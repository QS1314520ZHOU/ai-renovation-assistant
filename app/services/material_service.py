import uuid
import json
import re
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.services.ai_client_factory import AIClientFactory
from app.models.budget import BudgetItem

MATERIAL_RECOMMENDATION_PROMPT = """你是一个资深的中国室内设计及主材选购专家。用户目前正在选购【{category}】类别的装修材料，其预算档次为【{tier}】，当前项目的总预算大致为【{total_budget}】元。
具体的预算明细项是：【{item_name}】，预估单价为：【{unit_price}】元/{unit}。

请基于上述信息，为用户推荐2-3个适合该预算档次的真实市场品牌及型号，并给出选购时的避坑要点。

请务必输出为以下的JSON格式，不要输出其他文字：
```json
{
  "category": "{category}",
  "tier": "{tier}",
  "recommendations": [
    {
      "brand": "品牌名，例如：立邦/多乐士/马可波罗",
      "model_or_series": "型号或系列，例如：抗甲醛净味五合一",
      "estimated_price": "此预算下的参考价格区间，例如：300-400元/桶",
      "reason": "推荐理由，例如：性价比高，环保认证齐全"
    }
  ],
  "buying_tips": [
    "选购要点1，例如：乳胶漆认准十环认证",
    "选购要点2，例如：瓷砖注意看吸水率和防滑等级"
  ]
}
```
"""

class MaterialRecommendationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_client(self):
        return await AIClientFactory.get_client(self.db)

    async def _get_config(self):
        return await AIClientFactory.get_config(self.db)

    def _extract_json(self, text: str) -> dict:
        match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass
        return {}
        
    async def get_recommendation(self, project_id: uuid.UUID, item_id: uuid.UUID, total_budget: float):
        # 1. Fetch item details to give AI context
        result = await self.db.execute(select(BudgetItem).where(BudgetItem.id == item_id))
        item = result.scalar_one_or_none()
        
        if not item:
            return {"error": "Budget item not found"}

        # Use AI to generate dynamic, context-aware recommendations
        prompt = MATERIAL_RECOMMENDATION_PROMPT.format(
            category=item.category or "通用建材",
            tier=item.tier or "标准",
            total_budget=total_budget,
            item_name=item.item_name,
            unit_price=item.price,
            unit=item.unit or "项"
        )
        
        client = await self._get_client()
        cfg = await self._get_config()
        
        try:
            res = await client.chat.completions.create(
                model=cfg["model"],
                messages=[
                    {"role": "system", "content": "你是一个资深装修选材教练，严格按照JSON格式输出推荐内容。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
            )
            raw_content = res.choices[0].message.content
            json_data = self._extract_json(raw_content)
            
            if not json_data:
                return {"error": "Failed to generate material recommendations"}
                
            return json_data
            
        except Exception as e:
            return {"error": str(e)}
