import base64
import json
import re
import uuid
from typing import Any, List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pricing import PricingRule, PricingStandardItem
from app.models.project import RenovationProject
from app.models.quote import QuoteItem, QuoteRiskReport, QuoteUpload
from app.services.ai_client_factory import AIClientFactory

QUOTE_PARSE_PROMPT = """你是一名装修报价单审核助手。请把用户提供的报价内容整理为结构化 JSON。

输出要求：
1. 尽量提取每一项的名称、数量、单位、单价、小计
2. 如果识别不到某字段，值设为 null
3. 仅输出 JSON，不要附加解释

JSON 结构示例：
{
  "items": [
    {
      "name": "墙面乳胶漆",
      "quantity": 120,
      "unit": "㎡",
      "unitPrice": 38,
      "subtotal": 4560
    }
  ],
  "totalAmount": 4560,
  "notes": "补充说明"
}
"""


class QuoteService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_client(self):
        return await AIClientFactory.get_client(self.db)

    async def _get_config(self):
        return await AIClientFactory.get_config(self.db)

    async def upload_and_parse(self, project_id: uuid.UUID, file):
        contents = await file.read()
        base64_image = base64.b64encode(contents).decode('utf-8')
        client = await self._get_client()
        cfg = await self._get_config()

        try:
            response = await client.chat.completions.create(
                model=cfg['model'],
                messages=[
                    {
                        'role': 'user',
                        'content': [
                            {'type': 'text', 'text': QUOTE_PARSE_PROMPT},
                            {'type': 'image_url', 'image_url': {'url': f'data:{file.content_type};base64,{base64_image}'}},
                        ],
                    }
                ],
                temperature=0.2,
                max_tokens=3000,
            )
            json_data = self._extract_json(self._extract_reply_text(response))
            if not json_data or 'items' not in json_data:
                return {'error': 'AI 未能识别出有效的报价条目'}
            persist_project_id = await self._resolve_persist_project_id(project_id)
            return await self._process_parsed_data(project_id, persist_project_id, json_data, 'image_upload')
        except Exception as exc:
            return {'error': str(exc)}

    async def check_from_text(self, project_id: uuid.UUID | str | None, text: str):
        client = await self._get_client()
        cfg = await self._get_config()

        try:
            response = await client.chat.completions.create(
                model=cfg['model'],
                messages=[
                    {'role': 'system', 'content': QUOTE_PARSE_PROMPT},
                    {'role': 'user', 'content': text},
                ],
                temperature=0.2,
                max_tokens=2400,
            )
            json_data = self._extract_json(self._extract_reply_text(response))
            if not json_data or 'items' not in json_data:
                return {'error': 'AI 未能识别出有效的报价内容'}
            persist_project_id = await self._resolve_persist_project_id(project_id)
            return await self._process_parsed_data(project_id, persist_project_id, json_data, 'text_input')
        except Exception as exc:
            return {'error': str(exc)}

    async def _process_parsed_data(
        self,
        requested_project_id: uuid.UUID | str | None,
        persist_project_id: uuid.UUID | None,
        json_data: dict,
        source: str,
    ):
        analysis = await self._analyze_quote_items(json_data)

        if not persist_project_id:
            return {
                'quote_id': str(uuid.uuid4()),
                'report_id': str(uuid.uuid4()),
                'score': analysis['score'],
                'total_amount': json_data.get('totalAmount') or analysis['total_amount'],
                'items': analysis['items'],
                'risks': analysis['risk_summary'],
                'suggestions': analysis['suggestions'],
                'preview_mode': True,
            }

        upload = QuoteUpload(
            project_id=persist_project_id,
            file_url=source,
            file_name='报价单解析',
            ocr_status='completed',
            ocr_raw_text=json_data.get('notes', ''),
            parsed_data=json_data,
        )
        self.db.add(upload)
        await self.db.flush()

        for index, item in enumerate(analysis['items']):
            self.db.add(QuoteItem(
                quote_id=upload.id,
                original_name=item.get('name'),
                unit=item.get('unit'),
                quantity=item.get('quantity'),
                unit_price=item.get('unitPrice'),
                total_price=item.get('subtotal'),
                sort_order=index,
            ))

        report = QuoteRiskReport(
            quote_id=upload.id,
            project_id=persist_project_id,
            overall_score=analysis['score'],
            risk_count_high=analysis['risk_summary']['high'],
            risk_count_medium=analysis['risk_summary']['medium'],
            risk_count_low=analysis['risk_summary']['low'],
            risks_json=analysis['flat_risks'],
            suggestions_json=analysis['suggestions'],
            ai_summary='AI 已完成报价结构化与风险检查',
        )
        self.db.add(report)
        await self.db.commit()

        return {
            'quote_id': str(upload.id),
            'report_id': str(report.id),
            'score': analysis['score'],
            'total_amount': json_data.get('totalAmount') or analysis['total_amount'],
            'items': analysis['items'],
            'risks': analysis['risk_summary'],
            'suggestions': analysis['suggestions'],
            'preview_mode': False,
        }

    async def _analyze_quote_items(self, json_data: dict[str, Any]) -> dict[str, Any]:
        std_result = await self.db.execute(select(PricingStandardItem).where(PricingStandardItem.is_active == True))
        std_items = list(std_result.scalars().all())

        analyzed_items = []
        flat_risks = []
        risk_summary = {'high': 0, 'medium': 0, 'low': 0}
        total_amount = 0.0

        for item in json_data.get('items', []):
            name = item.get('name') or '未命名项目'
            quantity = item.get('quantity')
            unit = item.get('unit')
            unit_price = item.get('unitPrice')
            subtotal = item.get('subtotal')

            matched_std = self._match_standard_item(name, std_items)
            risks: list[dict[str, Any]] = []

            if matched_std and unit_price:
                rules_result = await self.db.execute(
                    select(PricingRule).where(PricingRule.standard_item_id == matched_std.id, PricingRule.is_active == True)
                )
                rules = list(rules_result.scalars().all())
                if rules:
                    average_price = sum(float(rule.material_unit_price or 0) + float(rule.labor_unit_price or 0) + float(rule.accessory_unit_price or 0) for rule in rules) / len(rules)
                    if float(unit_price) < average_price * 0.6:
                        risks.append({'level': 'high', 'desc': '单价明显低于常见市场水平，需警惕减项或低配材料'})
                    elif float(unit_price) > average_price * 1.5:
                        risks.append({'level': 'medium', 'desc': '单价偏高，建议核对品牌、规格和施工范围'})

            if not subtotal and quantity and unit_price:
                subtotal = round(float(quantity) * float(unit_price), 2)

            subtotal_value = float(subtotal or 0)
            total_amount += subtotal_value

            for risk in risks:
                risk_summary[risk['level']] += 1
                flat_risks.append(risk)

            analyzed_items.append({
                'name': name,
                'unit': unit,
                'quantity': quantity,
                'unitPrice': unit_price,
                'subtotal': subtotal_value,
                'risks': risks,
            })

        score = max(0, 100 - risk_summary['high'] * 15 - risk_summary['medium'] * 6 - risk_summary['low'] * 2)
        suggestions = []
        if risk_summary['high'] > 0:
            suggestions.append('重点复核异常低价项目，确认是否存在漏项、工艺降配或后期加价。')
        if risk_summary['medium'] > 0:
            suggestions.append('对偏高单价项目补充品牌、型号、施工范围与损耗说明。')
        if not suggestions:
            suggestions.append('当前报价结构较完整，建议继续核对付款节点、增项约定和材料品牌。')

        return {
            'items': analyzed_items,
            'flat_risks': flat_risks,
            'risk_summary': risk_summary,
            'total_amount': round(total_amount, 2),
            'score': score,
            'suggestions': suggestions,
        }

    async def get_report(self, quote_id: uuid.UUID):
        result = await self.db.execute(select(QuoteRiskReport).where(QuoteRiskReport.quote_id == quote_id))
        return result.scalar_one_or_none()

    async def _resolve_persist_project_id(self, project_id: uuid.UUID | str | None) -> uuid.UUID | None:
        candidate = self._parse_uuid(project_id)
        if not candidate:
            return None
        result = await self.db.execute(select(RenovationProject).where(RenovationProject.id == candidate))
        project = result.scalar_one_or_none()
        return project.id if project else None

    def _extract_json(self, text: str) -> dict:
        match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {}

    def _extract_reply_text(self, response: Any) -> str:
        choices = getattr(response, 'choices', None) or []
        if not choices:
            return ''
        message = getattr(choices[0], 'message', None)
        content = getattr(message, 'content', None)
        if isinstance(content, str):
            return content.strip()
        if isinstance(content, list):
            parts = []
            for part in content:
                if isinstance(part, dict) and part.get('text'):
                    parts.append(str(part['text']))
            return '\n'.join(parts).strip()
        return str(content or '').strip()

    def _match_standard_item(self, name: str, std_items: List[PricingStandardItem]) -> PricingStandardItem | None:
        name_clean = (name or '').lower().strip()
        for item in std_items:
            aliases = [str(alias).lower() for alias in (item.aliases_json or [])]
            if str(item.name).lower() == name_clean or name_clean in aliases:
                return item
        for item in std_items:
            aliases = [str(alias).lower() for alias in (item.aliases_json or [])]
            if str(item.name).lower() in name_clean or any(alias in name_clean for alias in aliases):
                return item
        return None

    def _parse_uuid(self, value: uuid.UUID | str | None) -> uuid.UUID | None:
        if isinstance(value, uuid.UUID):
            return value
        if not value:
            return None
        try:
            return uuid.UUID(str(value))
        except Exception:
            return None