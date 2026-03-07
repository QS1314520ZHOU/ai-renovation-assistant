import uuid
import json
import re
from typing import List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from openai import AsyncOpenAI
from app.config import settings
from app.models.quote import QuoteUpload, QuoteItem, QuoteRiskReport
from app.models.pricing import PricingStandardItem, PricingRule
from app.models.project import RenovationProject

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
        self.client = AsyncOpenAI(
            base_url=settings.AI_BASE_URL,
            api_key=settings.AI_API_KEY,
        )

    async def upload_and_parse(self, project_id: uuid.UUID, file):
        # OCR logic would go here, currently we only support text check in a simplified way
        return {"message": "OCR not yet implemented locally"}

    async def check_from_text(self, project_id: uuid.UUID, text: str):
        # 1. AI Parsing
        parse_result = await self.client.chat.completions.create(
            model=settings.AI_MODEL,
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

        # 2. Save Upload Record
        upload = QuoteUpload(
            project_id=project_id,
            file_url="text_input",
            file_name="粘贴内容",
            ocr_status="completed",
            ocr_raw_text=text,
            parsed_data=json_data
        )
        self.db.add(upload)
        await self.db.flush()

        # 3. Analyze Items and Risks
        quote_items = []
        high_risks = 0
        medium_risks = 0
        low_risks = 0
        all_risks = []
        
        # Get standard items for matching
        std_items_result = await self.db.execute(select(PricingStandardItem).where(PricingStandardItem.is_active == True))
        std_items = std_items_result.scalars().all()

        for idx, item in enumerate(json_data.get("items", [])):
            name = item.get("name", "未知项目")
            # Simple fuzzy matching or alias matching could go here
            matched_std = self._match_standard_item(name, std_items)
            
            risks = []
            if matched_std:
                # Get pricing rules for this item
                rules_result = await self.db.execute(
                    select(PricingRule).where(PricingRule.standard_item_id == matched_std.id)
                )
                rules = rules_result.scalars().all()
                # Check price (simple check)
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
            quote_items.append({"name": name, "risks": risks})
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
            "items": quote_items
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
        # Simplified matching
        for item in std_items:
            if item.name == name or name in (item.aliases_json or []):
                return item
        return None
