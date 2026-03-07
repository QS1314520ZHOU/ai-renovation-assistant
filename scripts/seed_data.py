import asyncio
import uuid
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.config import settings
from app.models.base import Base
from app.models.pricing import PricingStandardItem, PricingRule, CityFactor, LayoutTemplate, RoomTemplate
from app.models.config import SystemConfig
from app.models.glossary import GlossaryTerm

# Unified Data with SI_ prefixes to match BudgetEngine logic
STANDARD_ITEMS = [
    {"code": "SI_HYDRO_ELECTRIC", "name": "水电改造", "aliases_json": ["水电", "强电", "弱电", "给排水"], "category": "水电", "pricing_mode": "area", "unit": "㎡", "description": "全屋水路及电路改造", "sort_order": 10},
    {"code": "SI_WATERPROOF", "name": "防水施工", "aliases_json": ["防水", "刷防水", "闭水试验"], "category": "防水", "pricing_mode": "area", "unit": "㎡", "description": "厨卫阳台防水涂料施工", "sort_order": 20},
    {"code": "SI_FLOOR_TILE", "name": "地面铺砖", "aliases_json": ["铺地砖", "地面贴砖", "地砖铺贴"], "category": "瓦工", "pricing_mode": "area", "unit": "㎡", "description": "地面瓷砖铺贴包含辅料及人工", "sort_order": 30},
    {"code": "SI_WALL_TILE", "name": "墙面铺砖", "aliases_json": ["贴墙砖", "墙面贴砖"], "category": "瓦工", "pricing_mode": "area", "unit": "㎡", "description": "墙面瓷砖铺贴包含辅料及人工", "sort_order": 40},
    {"code": "SI_WALL_PAINT", "name": "墙面乳胶漆", "aliases_json": ["刷漆", "面漆", "墙漆", "批腻子"], "category": "墙面", "pricing_mode": "area", "unit": "㎡", "description": "墙面基层处理及乳胶漆涂刷", "sort_order": 50},
    {"code": "SI_CEILING", "name": "吊顶工程", "aliases_json": ["吊顶", "石膏板吊顶", "集成吊顶"], "category": "木工", "pricing_mode": "area", "unit": "㎡", "description": "造型吊顶或集成吊顶施工", "sort_order": 60},
    {"code": "SI_DOOR", "name": "室内门", "aliases_json": ["木门", "卧室门", "房门"], "category": "安装", "pricing_mode": "quantity", "unit": "樘", "description": "室内木门及五金安装", "sort_order": 70},
    {"code": "SI_CABINET_KITCHEN", "name": "集成橱柜", "aliases_json": ["橱柜", "地柜", "吊柜"], "category": "定制", "pricing_mode": "linear_meter", "unit": "m", "description": "整体橱柜定制安装", "sort_order": 80},
    {"code": "SI_CUSTOM_WARDROBE", "name": "全屋定制柜", "aliases_json": ["衣柜", "定制柜", "入墙柜"], "category": "定制", "pricing_mode": "area", "unit": "㎡(投影)", "description": "衣柜及其他功能柜投影面积计算", "sort_order": 90},
    {"code": "SI_DEMOLITION", "name": "拆除工程", "aliases_json": ["拆墙", "砸墙", "铲墙皮"], "category": "拆改", "pricing_mode": "area", "unit": "㎡", "description": "非承重墙体拆除及垃圾清运", "sort_order": 5},
]

CITY_FACTORS = [
    {"city_code": "510100", "city_name": "成都", "province": "四川", "city_tier": "新一线", "factor": 1.0, "has_local_price": True},
    {"city_code": "110100", "city_name": "北京", "province": "北京", "city_tier": "一线", "factor": 1.35, "has_local_price": True},
    {"city_code": "310100", "city_name": "上海", "province": "上海", "city_tier": "一线", "factor": 1.35, "has_local_price": True},
    {"city_code": "440100", "city_name": "广州", "province": "广东", "city_tier": "一线", "factor": 1.25, "has_local_price": True},
    {"city_code": "440300", "city_name": "深圳", "province": "广东", "city_tier": "一线", "factor": 1.35, "has_local_price": True},
]

PRICING_RULES_MAPPING = {
    "SI_HYDRO_ELECTRIC": {"economy": 100, "standard": 135, "premium": 180},
    "SI_WATERPROOF": {"economy": 60, "standard": 80, "premium": 110},
    "SI_FLOOR_TILE": {"economy": 120, "standard": 180, "premium": 280},
    "SI_WALL_TILE": {"economy": 110, "standard": 160, "premium": 240},
    "SI_WALL_PAINT": {"economy": 40, "standard": 65, "premium": 90},
    "SI_CEILING": {"economy": 120, "standard": 180, "premium": 260},
    "SI_DOOR": {"economy": 1500, "standard": 2500, "premium": 4000},
    "SI_CABINET_KITCHEN": {"economy": 1800, "standard": 2800, "premium": 4500},
    "SI_CUSTOM_WARDROBE": {"economy": 800, "standard": 1200, "premium": 1800},
    "SI_DEMOLITION": {"economy": 40, "standard": 60, "premium": 80},
}

GLOSSARY_TERMS = [
    {"term": "闭水试验", "category": "防水", "definition": "防水施工后蓄水检查是否渗漏", "purpose": "验证防水质量", "risk": "不做后期漏水维修难", "tags_json": ["验收", "核心"]},
    {"term": "铲墙皮", "category": "拆改", "definition": "去除原有墙面疏松层", "purpose": "确保新腻子附着力", "risk": "不铲可能导致墙面脱落", "tags_json": ["基层"]},
    {"term": "耐水腻子", "category": "墙面", "definition": "具有防潮性能的墙面找平材料", "purpose": "防止墙面受潮发霉", "risk": "普通腻子易起皮", "tags_json": ["材料"]},
]

async def seed_data():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        # 1. System Config (AI Config)
        ai_config_val = {
            "activeModelId": "default-gpt-4o",
            "aiModels": [
                {
                    "id": "default-gpt-4o",
                    "name": "GPT-4o (Default)",
                    "baseUrl": settings.AI_BASE_URL,
                    "apiKey": settings.AI_API_KEY,
                    "models": [settings.AI_MODEL]
                }
            ]
        }
        res = await db.execute(select(SystemConfig).where(SystemConfig.key == "ai_config"))
        if not res.scalars().first():
            db.add(SystemConfig(key="ai_config", value=ai_config_val, description="AI Global Configuration"))

        # 2. City Factors
        for cf_data in CITY_FACTORS:
            res = await db.execute(select(CityFactor).where(CityFactor.city_code == cf_data["city_code"]))
            if not res.scalars().first():
                db.add(CityFactor(**cf_data))

        # 3. Standard Items & Rules
        for item_data in STANDARD_ITEMS:
            res = await db.execute(select(PricingStandardItem).where(PricingStandardItem.code == item_data["code"]))
            std_item = res.scalars().first()
            if not std_item:
                std_item = PricingStandardItem(**item_data)
                db.add(std_item)
                await db.flush()

            if item_data["code"] in PRICING_RULES_MAPPING:
                tier_prices = PRICING_RULES_MAPPING[item_data["code"]]
                for tier, total_price in tier_prices.items():
                    res = await db.execute(
                        select(PricingRule).where(
                            PricingRule.standard_item_id == std_item.id,
                            PricingRule.tier == tier,
                            PricingRule.city_code == "510100"
                        )
                    )
                    if not res.scalars().first():
                        db.add(PricingRule(
                            city_code="510100",
                            standard_item_id=std_item.id,
                            tier=tier,
                            material_unit_price=total_price * 0.6,
                            labor_unit_price=total_price * 0.4,
                            unit=item_data["unit"],
                            price_source="行业基准2025"
                        ))

        # 4. Layout Template (Sample)
        for layout_name in ["2室1厅1卫", "3室2厅1卫"]:
            res = await db.execute(select(LayoutTemplate).where(LayoutTemplate.layout_type == layout_name))
            if not res.scalars().first():
                tpl = LayoutTemplate(name=f"标准{layout_name}模板", layout_type=layout_name, bedroom_count=3 if "3室" in layout_name else 2, living_count=2 if "2厅" in layout_name else 1, bathroom_count=1, area_min=60, area_max=120)
                db.add(tpl)
                await db.flush()
                rooms = [{"room_name": "客厅", "room_type": "living", "area_ratio": 0.25}, {"room_name": "餐厅", "room_type": "dining", "area_ratio": 0.10}, {"room_name": "厨房", "room_type": "kitchen", "area_ratio": 0.08}, {"room_name": "卫生间", "room_type": "bathroom", "area_ratio": 0.07}]
                for r in rooms: db.add(RoomTemplate(layout_template_id=tpl.id, **r))

        # 5. Glossary Terms
        for g_data in GLOSSARY_TERMS:
            res = await db.execute(select(GlossaryTerm).where(GlossaryTerm.term == g_data["term"]))
            if not res.scalars().first():
                db.add(GlossaryTerm(**g_data))

        await db.commit()
        print("🎉 Seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
