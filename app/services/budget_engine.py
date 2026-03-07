import uuid
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
        # 0. 城市解析
        city_code = req.city_code
        if not city_code and req.city_name:
            # 根据名称匹配城市码
            city_res = await self.db.execute(
                select(CityFactor).where(CityFactor.city_name.like(f"%{req.city_name}%"))
            )
            city_obj = city_res.scalars().first()
            if city_obj:
                city_code = city_obj.city_code
            else:
                city_code = "510100" # 默认成都
        elif not city_code:
            city_code = "510100"

        # 1. 获取城市系数
        city_factor = await self._get_city_factor(city_code)

        # 2. 匹配户型模板，生成房间
        rooms = await self._generate_rooms(req.layout_type, req.inner_area)

        # 3. 获取价格规则
        rules = await self._get_pricing_rules(city_code)

        # 4. 获取标准项详情 (用于匹配 code)
        std_ids = {r.standard_item_id for r in rules}
        std_res = await self.db.execute(select(PricingStandardItem).where(PricingStandardItem.id.in_(std_ids)))
        std_items = {s.id: s for s in std_res.scalars().all()}

        # 4. 三档分别计算
        schemes = []
        for tier in ['economy', 'standard', 'premium']:
            scheme_data = self._calc_one_tier(
                tier=tier,
                rooms=rooms,
                rules=rules,
                std_items=std_items,
                city_factor=city_factor,
                inner_area=req.inner_area,
                floor_preference=req.floor_preference,
                bathroom_count=req.bathroom_count,
            )
            
            # 只有提供 project_id 时才保存到数据库
            if req.project_id:
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
            else:
                # 预览模式：仅构造 Pydantic 模型
                # 注意：BudgetItemOut 里的 id 需要 mock 一个
                items_out = []
                for idx, item in enumerate(scheme_data["items"]):
                    items_out.append(BudgetItemOut(
                        id=uuid.uuid4(), # Mock ID
                        **item,
                        is_user_modified=False
                    ))
                
                schemes.append(BudgetSchemeOut(
                    id=uuid.uuid4(),
                    tier=tier,
                    total_amount=scheme_data["total"],
                    material_amount=scheme_data["material"],
                    labor_amount=scheme_data["labor"],
                    management_fee=scheme_data["management_fee"],
                    contingency=scheme_data["contingency"],
                    items=items_out
                ))

        await self.db.flush()

        # 组装返回结果
        schemes_out = []
        for s in schemes:
            if isinstance(s, BudgetSchemeOut):
                schemes_out.append(s)
            else:
                schemes_out.append(BudgetSchemeOut.model_validate(s))

        return BudgetResultOut(
            project_id=req.project_id or uuid.UUID(int=0), # Mock project_id if missing
            schemes=schemes_out,
            missing_items=[],
            suggestions=["建议关注水电改造细节", "注意防水施工至少48小时闭水试验"],
        )

    def _calculate_quantity(self, code: str, rooms: list[dict], inner_area: float) -> float:
        """核心：根据项目代码和房间属性计算工程量"""
        if code == "SI_HYDRO_ELECTRIC":
            return inner_area  # 水电按建筑面积
        elif code == "SI_FLOOR_TILE":
            # 地砖：仅铺贴在 ground_material 为 tile 的房间
            return sum(r["area"] for r in rooms if r.get("floor_material") == "tile")
        elif code == "SI_FLOOR_WOOD":
            return sum(r["area"] for r in rooms if r.get("floor_material") == "wood")
        elif code == "SI_WALL_PAINT":
            # 墙面乳胶漆：地面面积的 2.5 倍 (粗略算法)
            return sum(r["area"] for r in rooms if r.get("wall_material") == "paint") * 2.5
        elif code == "SI_WALL_TILE":
            # 墙面瓷砖：厨房、卫生间墙面 (面积的 3 倍)
            return sum(r["area"] for r in rooms if r.get("wall_material") == "tile") * 3.0
        elif code == "SI_WATERPROOF":
            # 防水：厨卫阳台
            return sum(r["area"] for r in rooms if r["room_type"] in ["kitchen", "bathroom", "balcony"])
        elif code == "SI_CEILING":
            # 吊顶：客餐厅 80% 覆盖
            return sum(r["area"] for r in rooms if r["room_type"] in ["living", "dining"]) * 0.8
        elif code == "SI_DOOR":
            # 室内门：计件
            return sum(r.get("door_count", 1) for r in rooms if r["room_type"] != "living")
        elif code == "SI_DEMOLITION":
            return inner_area * 0.15 # 拆除
        elif code == "SI_CUSTOM_CABINET":
            return inner_area * 0.2 # 定制柜投影面积
        return inner_area # 兜底

    def _calc_one_tier(self, tier, rooms, rules, std_items, city_factor, inner_area, floor_preference, bathroom_count) -> dict:
        items = []
        total_material = 0
        total_labor = 0
        total_accessory = 0

        tier_rules = [r for r in rules if r.tier == tier]

        for rule in tier_rules:
            std_item = std_items.get(rule.standard_item_id)
            if not std_item:
                continue

            # 使用精细化算量
            quantity = self._calculate_quantity(std_item.code, rooms, inner_area)
            if quantity <= 0:
                continue

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
                "category": std_item.category,
                "item_name": std_item.name,
                "pricing_mode": std_item.pricing_mode,
                "quantity": round(quantity, 2),
                "unit": std_item.unit,
                "material_unit_price": float(rule.material_unit_price),
                "labor_unit_price": float(rule.labor_unit_price),
                "accessory_unit_price": float(rule.accessory_unit_price),
                "loss_rate": loss,
                "subtotal": round(subtotal, 2),
                "data_source": "rule_engine",
                "sort_order": std_item.sort_order,
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
