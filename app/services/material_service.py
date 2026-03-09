import uuid
import json
import re
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.services.ai_client_factory import AIClientFactory
from app.models.budget import BudgetItem, BudgetScheme

MATERIAL_JSON_EXAMPLE = '''{
  "category": "示例类别",
  "tier": "标准",
  "recommendations": [
    {
      "brand": "品牌名，例如：立邦/多乐士/马可波罗",
      "model_or_series": "型号或系列，例如：抗甲醛净味五合一",
      "estimated_price": "此预算下的参考价格区间，例如：300-400元/桶",
      "reason": "推荐理由，例如：性价比高，环保认证齐全",
      "product_image_url": "产品图URL（可为空）",
      "scene_image_url": "铺贴效果图URL（可为空）",
      "color_palette": ["#F5F1E8", "#D9C7A1", "#7A5C42"]
    }
  ],
  "buying_tips": [
    "选购要点1，例如：乳胶漆认准十环认证",
    "选购要点2，例如：瓷砖注意看吸水率和防滑等级"
  ]
}'''

MATERIAL_RECOMMENDATION_PROMPT_TEMPLATE = (
    "你是一个资深的中国室内设计及主材选购专家。"
    "用户目前正在选购【{category}】类别的装修材料，其预算档次为【{tier}】，"
    "当前项目的总预算大致为【{total_budget}】元。\n"
    "具体的预算明细项是：【{item_name}】，预估单价为：【{unit_price}】元/{unit}。\n\n"
    "请基于上述信息，为用户推荐2-3个适合该预算档次的真实市场品牌及型号，并给出选购时的避坑要点。\n\n"
    "请务必输出为以下的JSON格式，不要输出其他文字：\n"
    "```json\n" + MATERIAL_JSON_EXAMPLE + "\n```"
)


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
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        return {}

    async def get_recommendation(self, project_id: uuid.UUID, item_id: uuid.UUID, total_budget: float):
        # 1. Fetch item details
        result = await self.db.execute(select(BudgetItem).where(BudgetItem.id == item_id))
        item = result.scalar_one_or_none()

        if not item:
            return {"error": "Budget item not found"}

        # 2. Fetch tier from scheme
        scheme_result = await self.db.execute(select(BudgetScheme).where(BudgetScheme.id == item.scheme_id))
        scheme = scheme_result.scalar_one_or_none()
        tier = scheme.tier if scheme else "standard"

        # 3. Calculate combined unit price
        unit_price = float(item.material_unit_price or 0) + float(item.labor_unit_price or 0) + float(item.accessory_unit_price or 0)

        # 4. Build prompt
        prompt = MATERIAL_RECOMMENDATION_PROMPT_TEMPLATE.format(
            category=item.category or "通用建材",
            tier=tier,
            total_budget=total_budget,
            item_name=item.item_name,
            unit_price=unit_price,
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

            json_data["recommendations"] = [
                self._enrich_recommendation_visual(item)
                for item in (json_data.get("recommendations") or [])
                if isinstance(item, dict)
            ]

            return json_data

        except Exception as e:
            return {"error": str(e)}

    def _enrich_recommendation_visual(self, rec: dict) -> dict:
        item = dict(rec)
        brand = str(item.get("brand") or "").lower()
        category = str(item.get("model_or_series") or "").lower()
        seed = f"{brand} {category}"

        if not item.get("product_image_url"):
            item["product_image_url"] = self._pick_product_image(seed)
        if not item.get("scene_image_url"):
            item["scene_image_url"] = self._pick_scene_image(seed)
        if not isinstance(item.get("color_palette"), list) or not item.get("color_palette"):
            item["color_palette"] = self._pick_palette(seed)
        return item

    def _pick_product_image(self, seed: str) -> str:
        if any(k in seed for k in ["瓷砖", "马可波罗", "东鹏"]):
            return "https://images.unsplash.com/photo-1600607688960-e095ff83135f?auto=format&fit=crop&w=1200&q=80"
        if any(k in seed for k in ["乳胶漆", "立邦", "多乐士"]):
            return "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1200&q=80"
        if any(k in seed for k in ["地板", "木"]):
            return "https://images.unsplash.com/photo-1616627561839-074385245ff6?auto=format&fit=crop&w=1200&q=80"
        if any(k in seed for k in ["马桶", "花洒", "卫浴"]):
            return "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1200&q=80"
        return "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80"

    def _pick_scene_image(self, seed: str) -> str:
        if any(k in seed for k in ["瓷砖", "地板"]):
            return "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=1200&q=80"
        if any(k in seed for k in ["卫浴", "马桶", "花洒"]):
            return "https://images.unsplash.com/photo-1631889993959-41b4e9c6e3c3?auto=format&fit=crop&w=1200&q=80"
        return "https://images.unsplash.com/photo-1616594039964-8db67f4f62f5?auto=format&fit=crop&w=1200&q=80"

    def _pick_palette(self, seed: str) -> list[str]:
        if any(k in seed for k in ["木", "地板", "北欧", "日式"]):
            return ["#E8D8C3", "#C9A882", "#7B5A3E", "#F8F3EA"]
        if any(k in seed for k in ["轻奢", "石", "岩板"]):
            return ["#F3F4F6", "#D1D5DB", "#6B7280", "#111827"]
        if any(k in seed for k in ["新中式"]):
            return ["#EEE4D4", "#B08968", "#5C3D2E", "#2F241F"]
        return ["#F1F5F9", "#CBD5E1", "#64748B", "#1E293B"]
