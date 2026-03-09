"""
scripts/seed_data_v2.py
修正版种子数据 — 基于2025年市场实际行情校准
"""
import asyncio
import uuid
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, delete
from app.config import settings
from app.models.pricing import PricingStandardItem, PricingRule, CityFactor, LayoutTemplate, RoomTemplate

# ============================================================
# 一、标准项：从10个扩充到22个，覆盖完整装修报价单
# ============================================================
STANDARD_ITEMS = [
    # --- 拆改 ---
    {"code": "SI_DEMOLITION",       "name": "拆除工程",   "aliases_json": ["拆墙","砸墙","铲墙皮","拆旧"],         "category": "拆改",   "pricing_mode": "area",    "unit": "㎡", "is_required": True,  "sort_order": 5,  "description": "非承重墙体拆除及建渣清运"},
    # --- 水电 ---
    {"code": "SI_HYDRO_ELECTRIC",   "name": "水电改造",   "aliases_json": ["水电","强电","弱电","给排水","水电全改"], "category": "水电",   "pricing_mode": "area",    "unit": "㎡", "is_required": True,  "sort_order": 10, "description": "全屋水路电路改造含开槽布管穿线"},
    {"code": "SI_ELEC_BOX",         "name": "强弱电箱",   "aliases_json": ["配电箱","弱电箱","电箱改造"],            "category": "水电",   "pricing_mode": "quantity","unit": "个", "is_required": True,  "sort_order": 12, "description": "强电箱及弱电箱更换或改造"},
    # --- 防水 ---
    {"code": "SI_WATERPROOF",       "name": "防水施工",   "aliases_json": ["防水","刷防水","闭水试验"],              "category": "防水",   "pricing_mode": "area",    "unit": "㎡", "is_required": True,  "sort_order": 20, "description": "厨卫阳台防水涂料施工"},
    # --- 瓦工 ---
    {"code": "SI_FLOOR_TILE",       "name": "地面铺砖",   "aliases_json": ["铺地砖","地面贴砖","地砖铺贴"],          "category": "瓦工",   "pricing_mode": "area",    "unit": "㎡", "is_required": False, "sort_order": 30, "description": "地面瓷砖铺贴（不含主材，仅人工+辅料）"},
    {"code": "SI_FLOOR_TILE_MAT",   "name": "地砖主材",   "aliases_json": ["地砖","釉面砖","通体砖","抛光砖"],       "category": "主材",   "pricing_mode": "area",    "unit": "㎡", "is_required": False, "sort_order": 31, "description": "地面瓷砖主材费用"},
    {"code": "SI_WALL_TILE",        "name": "墙面铺砖",   "aliases_json": ["贴墙砖","墙面贴砖"],                     "category": "瓦工",   "pricing_mode": "area",    "unit": "㎡", "is_required": False, "sort_order": 40, "description": "墙面瓷砖铺贴（不含主材，仅人工+辅料）"},
    {"code": "SI_WALL_TILE_MAT",    "name": "墙砖主材",   "aliases_json": ["墙砖","瓷片","内墙砖"],                  "category": "主材",   "pricing_mode": "area",    "unit": "㎡", "is_required": False, "sort_order": 41, "description": "墙面瓷砖主材费用"},
    {"code": "SI_FLOOR_WOOD",       "name": "木地板铺装", "aliases_json": ["铺地板","木地板","实木复合地板","强化地板"],"category": "主材",  "pricing_mode": "area",    "unit": "㎡", "is_required": False, "sort_order": 35, "description": "木地板主材及安装"},
    {"code": "SI_THRESHOLD",        "name": "门槛石/窗台石","aliases_json": ["过门石","门槛石","窗台石"],              "category": "瓦工",   "pricing_mode": "quantity","unit": "条", "is_required": True,  "sort_order": 42, "description": "门槛石及窗台石铺贴"},
    {"code": "SI_BASEBOARD",        "name": "踢脚线",     "aliases_json": ["踢脚线","踢脚板"],                       "category": "瓦工",   "pricing_mode": "linear_meter","unit": "m", "is_required": True, "sort_order": 43, "description": "踢脚线安装"},
    # --- 墙面 ---
    {"code": "SI_WALL_PAINT",       "name": "墙面乳胶漆", "aliases_json": ["刷漆","面漆","墙漆","批腻子","腻子"],     "category": "墙面",   "pricing_mode": "area",    "unit": "㎡", "is_required": True,  "sort_order": 50, "description": "墙面基层处理+腻子+底漆+面漆全套"},
    # --- 木工 ---
    {"code": "SI_CEILING_LIVING",   "name": "客餐厅吊顶", "aliases_json": ["吊顶","石膏板吊顶","造型吊顶"],           "category": "木工",   "pricing_mode": "area",    "unit": "㎡", "is_required": False, "sort_order": 60, "description": "客餐厅石膏板造型吊顶"},
    {"code": "SI_CEILING_KW",       "name": "厨卫集成吊顶","aliases_json": ["集成吊顶","铝扣板吊顶"],                 "category": "木工",   "pricing_mode": "area",    "unit": "㎡", "is_required": True,  "sort_order": 61, "description": "厨卫集成吊顶含灯具换气扇"},
    # --- 安装 ---
    {"code": "SI_DOOR",             "name": "室内门",     "aliases_json": ["木门","卧室门","房门","免漆门","实木复合门"],"category":"安装",  "pricing_mode": "quantity","unit": "樘", "is_required": True,  "sort_order": 70, "description": "室内木门含门套五金安装"},
    {"code": "SI_SWITCH_SOCKET",    "name": "开关插座",   "aliases_json": ["开关","插座","面板","86型"],               "category": "安装",   "pricing_mode": "quantity","unit": "个", "is_required": True,  "sort_order": 72, "description": "开关插座面板含安装"},
    {"code": "SI_LIGHT",            "name": "灯具安装",   "aliases_json": ["灯具","吸顶灯","筒灯","射灯"],             "category": "安装",   "pricing_mode": "quantity","unit": "套", "is_required": True,  "sort_order": 73, "description": "灯具安装（不含灯具主材）"},
    # --- 定制 ---
    {"code": "SI_CABINET_KITCHEN",  "name": "集成橱柜",   "aliases_json": ["橱柜","地柜","吊柜","台面"],               "category": "定制",   "pricing_mode": "linear_meter","unit":"m","is_required": True, "sort_order": 80, "description": "整体橱柜定制含台面五金"},
    {"code": "SI_CUSTOM_WARDROBE",  "name": "全屋定制柜", "aliases_json": ["衣柜","定制柜","入墙柜","鞋柜"],           "category": "定制",   "pricing_mode": "area",    "unit": "㎡(投影)", "is_required": True, "sort_order": 90, "description": "全屋定制柜体按投影面积计算"},
    # --- 洁具 ---
    {"code": "SI_SANITARY",         "name": "卫浴洁具",   "aliases_json": ["马桶","花洒","浴室柜","卫浴套装"],         "category": "主材",   "pricing_mode": "quantity","unit": "套", "is_required": True,  "sort_order": 95, "description": "马桶+花洒+浴室柜一套"},
    # --- 其他 ---
    {"code": "SI_CLEANING",         "name": "开荒保洁",   "aliases_json": ["保洁","开荒","垃圾清运"],                 "category": "其他",   "pricing_mode": "area",    "unit": "㎡", "is_required": True,  "sort_order": 100,"description": "竣工后全屋开荒保洁"},
    {"code": "SI_GARBAGE",          "name": "垃圾清运",   "aliases_json": ["建渣清运","垃圾外运"],                    "category": "其他",   "pricing_mode": "area",    "unit": "㎡", "is_required": True,  "sort_order": 101,"description": "施工垃圾清运"},
]

# ============================================================
# 二、定价规则 — 成都基准价（factor=1.0），人材比按工种分别设置
# 格式: (material, labor, accessory) 三项单独定价
# ============================================================
PRICING_RULES = {
    #                           经济档(材,工,辅)         标准档(材,工,辅)          豪华档(材,工,辅)
    "SI_DEMOLITION":       {"economy": (0,  35, 5),   "standard": (0,  50, 10),  "premium": (0,  70, 10)},
    "SI_HYDRO_ELECTRIC":   {"economy": (20, 35, 10),  "standard": (30, 55, 15),  "premium": (45, 70, 25)},
    "SI_ELEC_BOX":         {"economy": (300,150,0),    "standard": (450,200,0),   "premium": (650,250,0)},
    "SI_WATERPROOF":       {"economy": (25, 25, 10),  "standard": (35, 30, 15),  "premium": (50, 35, 25)},
    "SI_FLOOR_TILE":       {"economy": (0,  35, 15),  "standard": (0,  45, 20),  "premium": (0,  55, 25)},   # 纯施工费
    "SI_FLOOR_TILE_MAT":   {"economy": (65, 0,  0),   "standard": (110,0,  0),   "premium": (200,0,  0)},   # 纯主材
    "SI_WALL_TILE":        {"economy": (0,  40, 15),  "standard": (0,  50, 20),  "premium": (0,  60, 25)},
    "SI_WALL_TILE_MAT":    {"economy": (55, 0,  0),   "standard": (90, 0,  0),   "premium": (160,0,  0)},
    "SI_FLOOR_WOOD":       {"economy": (80, 20, 0),   "standard": (150,25, 0),   "premium": (280,30, 0)},
    "SI_THRESHOLD":        {"economy": (60, 30, 0),   "standard": (100,30, 0),   "premium": (180,40, 0)},
    "SI_BASEBOARD":        {"economy": (12, 8,  0),   "standard": (20, 10, 0),   "premium": (35, 12, 0)},
    "SI_WALL_PAINT":       {"economy": (10, 18, 10),  "standard": (18, 22, 15),  "premium": (30, 25, 20)},
    "SI_CEILING_LIVING":   {"economy": (40, 60, 20),  "standard": (55, 80, 25),  "premium": (80, 100,30)},
    "SI_CEILING_KW":       {"economy": (60, 40, 20),  "standard": (90, 50, 25),  "premium": (140,60, 30)},
    "SI_DOOR":             {"economy": (450,150,80),   "standard": (1100,250,120),"premium": (2200,400,180)},
    "SI_SWITCH_SOCKET":    {"economy": (8,  5,  0),   "standard": (18, 5,  0),   "premium": (35, 8,  0)},
    "SI_LIGHT":            {"economy": (0,  25, 0),   "standard": (0,  35, 0),   "premium": (0,  50, 0)},
    "SI_CABINET_KITCHEN":  {"economy": (550,180,70),   "standard": (1000,250,120),"premium": (1800,350,180)},
    "SI_CUSTOM_WARDROBE":  {"economy": (700,100,50),   "standard": (1000,120,80), "premium": (1500,150,100)},
    "SI_SANITARY":         {"economy": (1500,200,0),   "standard": (3000,300,0),  "premium": (6000,400,0)},
    "SI_CLEANING":         {"economy": (0,  5,  0),   "standard": (0,  8,  0),   "premium": (0,  12, 0)},
    "SI_GARBAGE":          {"economy": (0,  8,  0),   "standard": (0,  12, 0),   "premium": (0,  15, 0)},
}

# ============================================================
# 三、城市系数 — 扩充到15个城市，区分人工/材料系数
# ============================================================
CITY_FACTORS = [
    {"city_code":"510100","city_name":"成都","province":"四川",  "city_tier":"新一线","factor":1.00,"labor_factor":1.00,"has_local_price":True, "data_quality":"verified"},
    {"city_code":"110100","city_name":"北京","province":"北京",  "city_tier":"一线",  "factor":1.10,"labor_factor":1.40,"has_local_price":True, "data_quality":"verified"},
    {"city_code":"310100","city_name":"上海","province":"上海",  "city_tier":"一线",  "factor":1.10,"labor_factor":1.40,"has_local_price":True, "data_quality":"verified"},
    {"city_code":"440100","city_name":"广州","province":"广东",  "city_tier":"一线",  "factor":1.05,"labor_factor":1.25,"has_local_price":True, "data_quality":"verified"},
    {"city_code":"440300","city_name":"深圳","province":"广东",  "city_tier":"一线",  "factor":1.10,"labor_factor":1.40,"has_local_price":True, "data_quality":"verified"},
    {"city_code":"330100","city_name":"杭州","province":"浙江",  "city_tier":"新一线","factor":1.05,"labor_factor":1.20,"has_local_price":True, "data_quality":"verified"},
    {"city_code":"320100","city_name":"南京","province":"江苏",  "city_tier":"新一线","factor":1.03,"labor_factor":1.15,"has_local_price":True, "data_quality":"verified"},
    {"city_code":"420100","city_name":"武汉","province":"湖北",  "city_tier":"新一线","factor":1.00,"labor_factor":1.05,"has_local_price":True, "data_quality":"verified"},
    {"city_code":"500100","city_name":"重庆","province":"重庆",  "city_tier":"新一线","factor":0.95,"labor_factor":0.95,"has_local_price":True, "data_quality":"verified"},
    {"city_code":"430100","city_name":"长沙","province":"湖南",  "city_tier":"新一线","factor":0.95,"labor_factor":0.95,"has_local_price":True, "data_quality":"verified"},
    {"city_code":"610100","city_name":"西安","province":"陕西",  "city_tier":"新一线","factor":0.95,"labor_factor":0.95,"has_local_price":True, "data_quality":"estimated"},
    {"city_code":"370200","city_name":"青岛","province":"山东",  "city_tier":"新一线","factor":1.00,"labor_factor":1.05,"has_local_price":False,"data_quality":"estimated"},
    {"city_code":"210100","city_name":"沈阳","province":"辽宁",  "city_tier":"二线",  "factor":0.90,"labor_factor":0.85,"has_local_price":False,"data_quality":"estimated"},
    {"city_code":"350100","city_name":"福州","province":"福建",  "city_tier":"二线",  "factor":1.00,"labor_factor":1.05,"has_local_price":False,"data_quality":"estimated"},
    {"city_code":"530100","city_name":"昆明","province":"云南",  "city_tier":"二线",  "factor":0.90,"labor_factor":0.85,"has_local_price":False,"data_quality":"estimated"},
]

# ============================================================
# 四、户型模板也同步扩充
# ============================================================
LAYOUT_TEMPLATES = {
    "1室1厅1卫": {"bedroom": 1, "living": 1, "bathroom": 1, "area_min": 35,  "area_max": 60,
        "rooms": [
            {"room_name":"客厅","room_type":"living","area_ratio":0.28,"floor_material":"tile","wall_material":"paint","door_count":0},
            {"room_name":"卧室","room_type":"bedroom","area_ratio":0.25,"floor_material":"wood","wall_material":"paint","door_count":1},
            {"room_name":"厨房","room_type":"kitchen","area_ratio":0.12,"floor_material":"tile","wall_material":"tile","door_count":1},
            {"room_name":"卫生间","room_type":"bathroom","area_ratio":0.08,"floor_material":"tile","wall_material":"tile","door_count":1},
            {"room_name":"阳台","room_type":"balcony","area_ratio":0.07,"floor_material":"tile","wall_material":"paint","door_count":0},
            {"room_name":"玄关/过道","room_type":"hallway","area_ratio":0.05,"floor_material":"tile","wall_material":"paint","door_count":0},
        ]},
    "2室1厅1卫": {"bedroom": 2, "living": 1, "bathroom": 1, "area_min": 55,  "area_max": 85,
        "rooms": [
            {"room_name":"客厅","room_type":"living","area_ratio":0.25,"floor_material":"tile","wall_material":"paint","door_count":0},
            {"room_name":"主卧","room_type":"bedroom","area_ratio":0.18,"floor_material":"wood","wall_material":"paint","door_count":1},
            {"room_name":"次卧","room_type":"bedroom","area_ratio":0.14,"floor_material":"wood","wall_material":"paint","door_count":1},
            {"room_name":"厨房","room_type":"kitchen","area_ratio":0.10,"floor_material":"tile","wall_material":"tile","door_count":1},
            {"room_name":"卫生间","room_type":"bathroom","area_ratio":0.06,"floor_material":"tile","wall_material":"tile","door_count":1},
            {"room_name":"阳台","room_type":"balcony","area_ratio":0.06,"floor_material":"tile","wall_material":"paint","door_count":0},
            {"room_name":"过道","room_type":"hallway","area_ratio":0.05,"floor_material":"tile","wall_material":"paint","door_count":0},
        ]},
    "3室2厅1卫": {"bedroom": 3, "living": 2, "bathroom": 1, "area_min": 80,  "area_max": 120,
        "rooms": [
            {"room_name":"客厅","room_type":"living","area_ratio":0.22,"floor_material":"tile","wall_material":"paint","door_count":0},
            {"room_name":"餐厅","room_type":"dining","area_ratio":0.08,"floor_material":"tile","wall_material":"paint","door_count":0},
            {"room_name":"主卧","room_type":"bedroom","area_ratio":0.16,"floor_material":"wood","wall_material":"paint","door_count":1},
            {"room_name":"次卧","room_type":"bedroom","area_ratio":0.12,"floor_material":"wood","wall_material":"paint","door_count":1},
            {"room_name":"书房","room_type":"bedroom","area_ratio":0.10,"floor_material":"wood","wall_material":"paint","door_count":1},
            {"room_name":"厨房","room_type":"kitchen","area_ratio":0.08,"floor_material":"tile","wall_material":"tile","door_count":1},
            {"room_name":"卫生间","room_type":"bathroom","area_ratio":0.06,"floor_material":"tile","wall_material":"tile","door_count":1},
            {"room_name":"阳台","room_type":"balcony","area_ratio":0.06,"floor_material":"tile","wall_material":"paint","door_count":0},
            {"room_name":"过道","room_type":"hallway","area_ratio":0.04,"floor_material":"tile","wall_material":"paint","door_count":0},
        ]},
    "3室2厅2卫": {"bedroom": 3, "living": 2, "bathroom": 2, "area_min": 100, "area_max": 140,
        "rooms": [
            {"room_name":"客厅","room_type":"living","area_ratio":0.20,"floor_material":"tile","wall_material":"paint","door_count":0},
            {"room_name":"餐厅","room_type":"dining","area_ratio":0.07,"floor_material":"tile","wall_material":"paint","door_count":0},
            {"room_name":"主卧","room_type":"bedroom","area_ratio":0.15,"floor_material":"wood","wall_material":"paint","door_count":1},
            {"room_name":"次卧1","room_type":"bedroom","area_ratio":0.11,"floor_material":"wood","wall_material":"paint","door_count":1},
            {"room_name":"次卧2","room_type":"bedroom","area_ratio":0.09,"floor_material":"wood","wall_material":"paint","door_count":1},
            {"room_name":"厨房","room_type":"kitchen","area_ratio":0.07,"floor_material":"tile","wall_material":"tile","door_count":1},
            {"room_name":"主卫","room_type":"bathroom","area_ratio":0.05,"floor_material":"tile","wall_material":"tile","door_count":1},
            {"room_name":"客卫","room_type":"bathroom","area_ratio":0.04,"floor_material":"tile","wall_material":"tile","door_count":1},
            {"room_name":"阳台","room_type":"balcony","area_ratio":0.05,"floor_material":"tile","wall_material":"paint","door_count":0},
            {"room_name":"过道","room_type":"hallway","area_ratio":0.04,"floor_material":"tile","wall_material":"paint","door_count":0},
        ]},
}


async def seed_v2():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        # === 1. 清理旧的规则数据（保留用户数据不动） ===
        await db.execute(delete(PricingRule))
        await db.execute(delete(PricingStandardItem))
        await db.execute(delete(CityFactor))
        await db.execute(delete(RoomTemplate))
        await db.execute(delete(LayoutTemplate))

        # === 2. 写入城市系数 ===
        for cf in CITY_FACTORS:
            db.add(CityFactor(**cf))

        # === 3. 写入标准项 + 定价规则 ===
        for item_data in STANDARD_ITEMS:
            std_item = PricingStandardItem(**item_data)
            db.add(std_item)
            await db.flush()

            if item_data["code"] in PRICING_RULES:
                for tier, (mat, labor, acc) in PRICING_RULES[item_data["code"]].items():
                    db.add(PricingRule(
                        city_code="510100",  # 成都基准
                        standard_item_id=std_item.id,
                        tier=tier,
                        material_unit_price=mat,
                        labor_unit_price=labor,
                        accessory_unit_price=acc,
                        loss_rate=0.05 if "TILE" in item_data["code"] else 0.03,
                        unit=item_data["unit"],
                        price_source="market_research_2025Q4",
                    ))

        # === 4. 写入户型模板 ===
        for layout_name, tpl_data in LAYOUT_TEMPLATES.items():
            tpl = LayoutTemplate(
                name=f"标准{layout_name}模板",
                layout_type=layout_name,
                bedroom_count=tpl_data["bedroom"],
                living_count=tpl_data["living"],
                bathroom_count=tpl_data["bathroom"],
                area_min=tpl_data["area_min"],
                area_max=tpl_data["area_max"],
            )
            db.add(tpl)
            await db.flush()
            for r in tpl_data["rooms"]:
                db.add(RoomTemplate(
                    layout_template_id=tpl.id,
                    room_name=r["room_name"],
                    room_type=r["room_type"],
                    area_ratio=r["area_ratio"],
                    default_floor=r.get("floor_material"),
                    default_wall=r.get("wall_material"),
                    door_count=r.get("door_count", 1),
                ))

        await db.commit()
        print("✅ Seed V2 完成: 22个标准项, 15个城市, 4套户型模板")


if __name__ == "__main__":
    asyncio.run(seed_v2())
