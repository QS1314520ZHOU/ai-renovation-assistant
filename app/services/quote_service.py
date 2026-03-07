import uuid
import json
import re
import base64
from typing import List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from openai import AsyncOpenAI
from app.config import settings
from app.models.quote import QuoteUpload, QuoteItem, QuoteRiskReport
from app.models.pricing import PricingStandardItem, PricingRule

QUOTE_PARSE_PROMPT = """你是一个装修报价单分析专家。请将以下报价单内容解析为结构化JSON格式。

要求：
1. 提取每一个报价项目，包括：项目名称、数量、单位、单价、小计
2. 如果某些字段无法识别，设为null
3. 尽可能还原表格结构

输出格式：
```json
{
  "items": [
    {
      "name": "项目名称",
      "quantity": 数量或null,
      "unit": "单位",
      "unitPrice": 单价或null,
      "subtotal": 小计或null
    }
  ],
  "totalAmount": 合计金额或null,
  "notes": "补充说明"
}
```

以下是报价单内容：
"""

class QuoteService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self._client = None
        self._config = None

    async def _get_config(self):
        if self._config:
            return self._config
        # 共享 AIService 的配置获取逻辑
        from app.models.config import SystemConfig
        from app.config import settings
        result = await self.db.execute(select(SystemConfig).where(SystemConfig.key == "ai_config", SystemConfig.is_active == True))
        cfg_record = result.scalar_one_or_none()
        if cfg_record:
            val = cfg_record.value
            active_id = val.get("activeModelId")
            models = val.get("aiModels", [])
            active_model = next((m for m in models if m["id"] == active_id), None) if active_id else (models[0] if models else None)
            if active_model:
                self._config = {
                    "base_url": active_model.get("baseUrl"),
                    "api_key": active_model.get("apiKey"),
                    "model": active_model.get("models")[0] if active_model.get("models") else settings.AI_MODEL
                }
                return self._config
        self._config = {"base_url": settings.AI_BASE_URL, "api_key": settings.AI_API_KEY, "model": settings.AI_MODEL}
        return self._config

    async def _get_client(self):
        if self._client: return self._client
        cfg = await self._get_config()
        self._client = AsyncOpenAI(base_url=cfg["base_url"], api_key=cfg["api_key"])
        return self._client

    async def upload_and_parse(self, project_id: uuid.UUID, file):
        # 1. Read file and encode to base64
        contents = await file.read()
        base64_image = base64.b64encode(contents).decode('utf-8')
        
        # 2. AI Vision Parsing
        client = await self._get_client()
        cfg = await self._get_config()
        parse_result = await client.chat.completions.create(
            model=cfg["model"],
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": QUOTE_PARSE_PROMPT},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{file.content_type};base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            temperature=0.3,
            max_tokens=3000,
        )
        
        raw_content = parse_result.choices[0].message.content
        json_data = self._extract_json(raw_content)
        
        if not json_data or "items" not in json_data:
            return {"error": "Failed to parse image content"}

        return await self._process_parsed_data(project_id, json_data, "image_upload")

    async def check_from_text(self, project_id: uuid.UUID, text: str):
        # 1. AI Parsing from text
        client = await self._get_client()
        cfg = await self._get_config()
        parse_result = await client.chat.completions.create(
            model=cfg["model"],
            messages=[
                {"role": "system", "content": QUOTE_PARSE_PROMPT},
                {"role": "user", "content": text},
            ],
            temperature=0.3,
        )
        
        raw_content = parse_result.choices[0].message.content
        json_data = self._extract_json(raw_content)
        
        if not json_data or "items" not in json_data:
            return {"error": "Failed to parse quote content"}

        return await self._process_parsed_data(project_id, json_data, "text_input")

    async def _process_parsed_data(self, project_id: uuid.UUID, json_data: dict, source: str):
        # 2. Save Upload Record
        upload = QuoteUpload(
            project_id=project_id,
            file_url=source,
            file_name="报价单解析",
            ocr_status="completed",
            ocr_raw_text=json_data.get("notes", ""),
            parsed_data=json_data
        )
        self.db.add(upload)
        await self.db.flush()

        # 3. Analyze Items and Risks
        quote_items_out = []
        high_risks = 0
        medium_risks = 0
        low_risks = 0
        all_risks = []
        
        # Get standard items for matching
        std_items_result = await self.db.execute(select(PricingStandardItem).where(PricingStandardItem.is_active == True))
        std_items = std_items_result.scalars().all()

        for idx, item in enumerate(json_data.get("items", [])):
            name = item.get("name", "未知项目")
            matched_std = self._match_standard_item(name, std_items)
            
            risks = []
            if matched_std:
                rules_result = await self.db.execute(
                    select(PricingRule).where(PricingRule.standard_item_id == matched_std.id)
                )
                rules = rules_result.scalars().all()
                if item.get("unitPrice") and rules:
                    avg_price = sum(float(r.material_unit_price + r.labor_unit_price) for r in rules) / len(rules)
                    if float(item["unitPrice"]) < avg_price * 0.6:
                        risks.append({"type": "price_low", "level": "high", "desc": "单价明显低于市场价"})
                        high_risks += 1
                    elif float(item["unitPrice"]) > avg_price * 1.5:
                        risks.append({"type": "price_high", "level": "medium", "desc": "单价高于市场价"})
                        medium_risks += 1

            quote_item = QuoteItem(
                quote_id=upload.id,
                original_name=name,
                matched_std_id=matched_std.id if matched_std else None,
                match_confidence=0.8 if matched_std else 0,
                unit=item.get("unit"),
                quantity=item.get("quantity"),
                unit_price=item.get("unitPrice"),
                total_price=item.get("subtotal"),
                sort_order=idx
            )
            self.db.add(quote_item)
            quote_items_out.append({"name": name, "risks": risks, "unitPrice": item.get("unitPrice"), "subtotal": item.get("subtotal"), "unit": item.get("unit"), "quantity": item.get("quantity")})
            all_risks.extend(risks)

        # 4. Generate Report
        score = 100 - (high_risks * 15 + medium_risks * 5 + low_risks * 2)
        score = max(0, score)

        report = QuoteRiskReport(
            quote_id=upload.id,
            project_id=project_id,
            overall_score=score,
            risk_count_high=high_risks,
            risk_count_medium=medium_risks,
            risk_count_low=low_risks,
            risks_json=all_risks,
            suggestions_json=["建议进一步核对低价项目是否存在隐形增项"] if high_risks > 0 else []
        )
        self.db.add(report)
        await self.db.commit()

        return {
            "quote_id": str(upload.id),
            "report_id": str(report.id),
            "score": score,
            "total_amount": json_data.get("totalAmount"),
            "items": quote_items_out,
            "risks": {"high": high_risks, "medium": medium_risks, "low": low_risks},
            "suggestions": report.suggestions_json
        }

    async def get_report(self, quote_id: uuid.UUID):
        result = await self.db.execute(select(QuoteRiskReport).where(QuoteRiskReport.quote_id == quote_id))
        report = result.scalar_one_or_none()
        return report

    def _extract_json(self, text: str) -> dict:
        match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass
        return {}

    def _match_standard_item(self, name: str, std_items: List[PricingStandardItem]) -> PricingStandardItem:
        name_clean = name.lower().strip()
        # 1. 精确匹配或别名匹配
        for item in std_items:
            if item.name == name or name in (item.aliases_json or []):
                return item
        # 2. 关键词包含匹配 (模糊匹配增强)
        for item in std_items:
            if item.name in name_clean or any(alias in name_clean for alias in (item.aliases_json or [])):
                return item
        return None
