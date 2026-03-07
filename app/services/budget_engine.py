from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.pricing import PricingRule, PricingStandardItem, CityFactor, LayoutTemplate, RoomTemplate
from app.models.budget import BudgetScheme, BudgetItem
from app.models.house import HouseProfile, Room
from app.schemas.budget import BudgetCalcRequest, BudgetResultOut, BudgetSchemeOut, BudgetItemOut

class BudgetEngineService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def calculate(self, req: BudgetCalcRequest, user_id: str) -> BudgetResultOut:
        # 1. 获取城市系数
        city_factor = await self._get_city_factor(req.city_code)

        # 2. 匹配户型模板，生成房间
        rooms = await self._generate_rooms(req.layout_type, req.inner_area)

        # 3. 获取价格规则
        rules = await self._get_pricing_rules(req.city_code)

        # 4. 三档分别计算
        schemes = []
        for tier in ['economy', 'standard', 'premium']:
            scheme_data = self._calc_one_tier(
                tier=tier,
                rooms=rooms,
                rules=rules,
                city_factor=city_factor,
                inner_area=req.inner_area,
                floor_preference=req.floor_preference,
                bathroom_count=req.bathroom_count,
                special_needs=req.special_needs,
            )
            # 保存到数据库
            scheme = BudgetScheme(
                project_id=req.project_id,
                tier=tier,
                total_amount=scheme_data["total"],
                material_amount=scheme_data["material"],
                labor_amount=scheme_data["labor"],
                accessory_amount=scheme_data["accessory"],
                management_fee=scheme_data["management_fee"],
                contingency=scheme_data["contingency"],
                is_primary=(tier == req.tier),
                input_snapshot=req.model_dump(),
            )
            self.db.add(scheme)
            await self.db.flush()

            for item in scheme_data["items"]:
                self.db.add(BudgetItem(scheme_id=scheme.id, **item))

            schemes.append(scheme)

        await self.db.flush()

        # Re-fetch schemes to ensure all relationships are loaded for model_validate
        return BudgetResultOut(
            project_id=req.project_id,
            schemes=[BudgetSchemeOut.model_validate(s) for s in schemes],
            missing_items=[],
            suggestions=[],
        )

    async def _get_city_factor(self, city_code: str) -> float:
        result = await self.db.execute(
            select(CityFactor).where(CityFactor.city_code == city_code)
        )
        cf = result.scalar_one_or_none()
        return float(cf.factor) if cf else 1.0

    async def _generate_rooms(self, layout_type: str, inner_area: float) -> list[dict]:
        # 匹配模板
        result = await self.db.execute(
            select(LayoutTemplate).where(
                LayoutTemplate.layout_type == layout_type,
                LayoutTemplate.is_active == True,
                LayoutTemplate.area_min <= inner_area,
                LayoutTemplate.area_max >= inner_area,
            )
        )
        template = result.scalar_one_or_none()

        if not template:
            # 降级：按面积比例粗略生成
            return self._fallback_rooms(layout_type, inner_area)

        room_result = await self.db.execute(
            select(RoomTemplate)
            .where(RoomTemplate.layout_template_id == template.id)
            .order_by(RoomTemplate.sort_order)
        )
        room_templates = room_result.scalars().all()

        rooms = []
        for rt in room_templates:
            area = float(rt.area_ratio or 0) * inner_area
            rooms.append({
                "room_name": rt.room_name,
                "room_type": rt.room_type,
                "area": round(area, 2),
                "ceiling_height": float(rt.ceiling_height),
                "door_count": rt.door_count,
                "window_count": rt.window_count,
                "floor_material": rt.default_floor,
                "wall_material": rt.default_wall,
            })
        return rooms

    def _fallback_rooms(self, layout_type: str, area: float) -> list[dict]:
        # 简单的降级逻辑
        rooms = [
            {"room_name": "客厅", "room_type": "living", "area": area * 0.25, "ceiling_height": 2.8},
            {"room_name": "主卧", "room_type": "bedroom", "area": area * 0.18, "ceiling_height": 2.8},
            {"room_name": "厨房", "room_type": "kitchen", "area": area * 0.08, "ceiling_height": 2.8},
            {"room_name": "卫生间", "room_type": "bathroom", "area": area * 0.06, "ceiling_height": 2.8},
        ]
        return rooms

    async def _get_pricing_rules(self, city_code: str) -> list[PricingRule]:
        result = await self.db.execute(
            select(PricingRule)
            .where(PricingRule.city_code == city_code)
            .where(PricingRule.is_active == True)
        )
        return list(result.scalars().all())

    def _calc_one_tier(self, tier, rooms, rules, city_factor, inner_area, floor_preference, bathroom_count, special_needs) -> dict:
        items = []
        total_material = 0
        total_labor = 0
        total_accessory = 0

        tier_rules = [r for r in rules if r.tier == tier]

        for rule in tier_rules:
            quantity = inner_area  # 简化：后续按 pricing_mode 细化
            material = float(rule.material_unit_price) * quantity * city_factor
            labor = float(rule.labor_unit_price) * quantity * city_factor
            accessory = float(rule.accessory_unit_price) * quantity * city_factor
            loss = float(rule.loss_rate or 0.05)
            subtotal = (material + labor + accessory) * (1 + loss)

            total_material += material * (1 + loss)
            total_labor += labor * (1 + loss)
            total_accessory += accessory * (1 + loss)

            items.append({
                "standard_item_id": rule.standard_item_id,
                "category": "装修",
                "item_name": "项目" + str(rule.standard_item_id)[:8],  # 后续关联名称
                "pricing_mode": rule.unit or "area",
                "quantity": round(quantity, 2),
                "unit": rule.unit or "m²",
                "material_unit_price": float(rule.material_unit_price),
                "labor_unit_price": float(rule.labor_unit_price),
                "accessory_unit_price": float(rule.accessory_unit_price),
                "loss_rate": loss,
                "subtotal": round(subtotal, 2),
                "data_source": "rule_engine",
                "sort_order": 0,
            })

        raw_total = total_material + total_labor + total_accessory
        management_fee = round(raw_total * 0.08, 2)
        contingency = round(raw_total * 0.10, 2)

        return {
            "total": round(raw_total + management_fee + contingency, 2),
            "material": round(total_material, 2),
            "labor": round(total_labor, 2),
            "accessory": round(total_accessory, 2),
            "management_fee": management_fee,
            "contingency": contingency,
            "items": items,
        }

    async def get_schemes(self, project_id):
        result = await self.db.execute(
            select(BudgetScheme)
            .where(BudgetScheme.project_id == project_id)
            .order_by(BudgetScheme.created_at.desc())
        )
        return [BudgetSchemeOut.model_validate(s) for s in result.scalars().all()]

    async def update_item(self, item_id, update: dict):
        result = await self.db.execute(select(BudgetItem).where(BudgetItem.id == item_id))
        item = result.scalar_one_or_none()
        if item:
            item.original_value_json = {"subtotal": float(item.subtotal or 0)}
            for k, v in update.items():
                if hasattr(item, k):
                    setattr(item, k, v)
            item.is_user_modified = True
            await self.db.flush()
        return {"id": str(item_id), "updated": True}
