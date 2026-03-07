"""运行: cd D:\ai-renovation-assistant && set PYTHONPATH=D:\ai-renovation-assistant && python -m scripts.seed_data"""
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from app.models.pricing import PricingStandardItem, PricingRule, CityFactor, LayoutTemplate, RoomTemplate
from app.models.glossary import GlossaryTerm

# 同步连接，直接连本地 PostgreSQL
DATABASE_URL = "postgresql://renovation:renovation2024@localhost:5432/renovation_db"
engine = create_engine(DATABASE_URL, echo=True)

STANDARD_ITEMS = [
    {"code": "SI_HYDRO_ELECTRIC", "name": "水电改造", "category": "水电", "pricing_mode": "area", "unit": "m²", "is_required": True, "aliases_json": ["水电", "改水改电", "水电路改造"]},
    {"code": "SI_FLOOR_TILE", "name": "地面铺砖", "category": "泥瓦", "pricing_mode": "area", "unit": "m²", "is_required": True, "aliases_json": ["铺地砖", "地砖铺贴"]},
    {"code": "SI_WALL_PAINT", "name": "墙面乳胶漆", "category": "油漆", "pricing_mode": "area", "unit": "m²", "is_required": True, "aliases_json": ["刷墙", "乳胶漆", "墙漆"]},
    {"code": "SI_WATERPROOF", "name": "防水工程", "category": "防水", "pricing_mode": "area", "unit": "m²", "is_required": True, "aliases_json": ["做防水", "防水涂料"]},
    {"code": "SI_CEILING", "name": "吊顶", "category": "木工", "pricing_mode": "area", "unit": "m²", "is_required": False, "aliases_json": ["石膏板吊顶", "集成吊顶"]},
    {"code": "SI_CUSTOM_CABINET", "name": "定制柜", "category": "定制", "pricing_mode": "area", "unit": "m²", "is_required": False, "aliases_json": ["衣柜", "橱柜", "定制衣柜", "全屋定制"]},
    {"code": "SI_DEMOLITION", "name": "拆除工程", "category": "拆改", "pricing_mode": "area", "unit": "m²", "is_required": False, "aliases_json": ["拆墙", "铲墙皮"]},
    {"code": "SI_WALL_TILE", "name": "墙面铺砖", "category": "泥瓦", "pricing_mode": "area", "unit": "m²", "is_required": True, "aliases_json": ["贴墙砖", "墙砖"]},
    {"code": "SI_FLOOR_WOOD", "name": "木地板铺设", "category": "安装", "pricing_mode": "area", "unit": "m²", "is_required": False, "aliases_json": ["铺地板", "木地板"]},
    {"code": "SI_DOOR", "name": "室内门", "category": "安装", "pricing_mode": "quantity", "unit": "套", "is_required": True, "aliases_json": ["房门", "卧室门", "木门"]},
]

PRICING_RULES_CHENGDU = [
    {"code": "SI_HYDRO_ELECTRIC", "economy": (0, 45, 5), "standard": (0, 65, 8), "premium": (0, 90, 12)},
    {"code": "SI_FLOOR_TILE", "economy": (45, 40, 10), "standard": (80, 50, 15), "premium": (150, 65, 20)},
    {"code": "SI_WALL_PAINT", "economy": (12, 15, 5), "standard": (25, 18, 8), "premium": (45, 22, 12)},
    {"code": "SI_WATERPROOF", "economy": (30, 25, 5), "standard": (50, 30, 8), "premium": (80, 35, 10)},
    {"code": "SI_CEILING", "economy": (30, 40, 10), "standard": (60, 50, 15), "premium": (100, 65, 20)},
    {"code": "SI_CUSTOM_CABINET", "economy": (400, 80, 20), "standard": (700, 100, 30), "premium": (1200, 120, 50)},
    {"code": "SI_DEMOLITION", "economy": (0, 30, 5), "standard": (0, 35, 8), "premium": (0, 40, 10)},
    {"code": "SI_WALL_TILE", "economy": (40, 45, 10), "standard": (70, 55, 15), "premium": (120, 70, 20)},
    {"code": "SI_FLOOR_WOOD", "economy": (80, 20, 5), "standard": (150, 25, 8), "premium": (300, 30, 12)},
    {"code": "SI_DOOR", "economy": (800, 200, 50), "standard": (1500, 250, 80), "premium": (3000, 300, 100)},
]

CITY_FACTORS = [
    {"city_code": "510100", "city_name": "成都", "province": "四川", "city_tier": "新一线", "factor": 1.00, "has_local_price": True},
    {"city_code": "110100", "city_name": "北京", "province": "北京", "city_tier": "一线", "factor": 1.35, "has_local_price": False},
    {"city_code": "310100", "city_name": "上海", "province": "上海", "city_tier": "一线", "factor": 1.30, "has_local_price": False},
    {"city_code": "440100", "city_name": "广州", "province": "广东", "city_tier": "一线", "factor": 1.20, "has_local_price": False},
    {"city_code": "440300", "city_name": "深圳", "province": "广东", "city_tier": "一线", "factor": 1.40, "has_local_price": False},
    {"city_code": "500100", "city_name": "重庆", "province": "重庆", "city_tier": "新一线", "factor": 0.95, "has_local_price": False},
    {"city_code": "330100", "city_name": "杭州", "province": "浙江", "city_tier": "新一线", "factor": 1.15, "has_local_price": False},
    {"city_code": "420100", "city_name": "武汉", "province": "湖北", "city_tier": "新一线", "factor": 1.05, "has_local_price": False},
    {"city_code": "320100", "city_name": "南京", "province": "江苏", "city_tier": "新一线", "factor": 1.10, "has_local_price": False},
    {"city_code": "610100", "city_name": "西安", "province": "陕西", "city_tier": "新一线", "factor": 0.95, "has_local_price": False},
]

LAYOUT_TEMPLATES = [
    {
        "name": "两室一厅一卫 70㎡ 标准型", "layout_type": "两室一厅一卫",
        "bedroom_count": 2, "living_count": 1, "bathroom_count": 1,
        "area_min": 55, "area_max": 85, "total_area": 70,
        "rooms": [
            {"room_name": "客厅", "room_type": "living", "area_ratio": 0.26, "default_floor": "tile", "default_wall": "paint"},
            {"room_name": "主卧", "room_type": "bedroom", "area_ratio": 0.20, "default_floor": "wood", "default_wall": "paint"},
            {"room_name": "次卧", "room_type": "bedroom", "area_ratio": 0.14, "default_floor": "wood", "default_wall": "paint"},
            {"room_name": "厨房", "room_type": "kitchen", "area_ratio": 0.09, "default_floor": "tile", "default_wall": "tile"},
            {"room_name": "卫生间", "room_type": "bathroom", "area_ratio": 0.06, "default_floor": "tile", "default_wall": "tile"},
            {"room_name": "阳台", "room_type": "balcony", "area_ratio": 0.07, "default_floor": "tile", "default_wall": "paint"},
            {"room_name": "玄关过道", "room_type": "hallway", "area_ratio": 0.08, "default_floor": "tile", "default_wall": "paint"},
        ],
    },
    {
        "name": "三室两厅一卫 90㎡ 标准型", "layout_type": "三室两厅一卫",
        "bedroom_count": 3, "living_count": 2, "bathroom_count": 1,
        "area_min": 80, "area_max": 105, "total_area": 90,
        "rooms": [
            {"room_name": "客厅", "room_type": "living", "area_ratio": 0.24, "default_floor": "tile", "default_wall": "paint"},
            {"room_name": "餐厅", "room_type": "dining", "area_ratio": 0.10, "default_floor": "tile", "default_wall": "paint"},
            {"room_name": "主卧", "room_type": "bedroom", "area_ratio": 0.17, "default_floor": "wood", "default_wall": "paint"},
            {"room_name": "次卧", "room_type": "bedroom", "area_ratio": 0.12, "default_floor": "wood", "default_wall": "paint"},
            {"room_name": "书房", "room_type": "bedroom", "area_ratio": 0.09, "default_floor": "wood", "default_wall": "paint"},
            {"room_name": "厨房", "room_type": "kitchen", "area_ratio": 0.08, "default_floor": "tile", "default_wall": "tile"},
            {"room_name": "卫生间", "room_type": "bathroom", "area_ratio": 0.05, "default_floor": "tile", "default_wall": "tile"},
            {"room_name": "阳台", "room_type": "balcony", "area_ratio": 0.07, "default_floor": "tile", "default_wall": "paint"},
            {"room_name": "过道", "room_type": "hallway", "area_ratio": 0.08, "default_floor": "tile", "default_wall": "paint"},
        ],
    },
    {
        "name": "三室两厅两卫 120㎡ 标准型", "layout_type": "三室两厅两卫",
        "bedroom_count": 3, "living_count": 2, "bathroom_count": 2,
        "area_min": 105, "area_max": 140, "total_area": 120,
        "rooms": [
            {"room_name": "客厅", "room_type": "living", "area_ratio": 0.22, "default_floor": "tile", "default_wall": "paint"},
            {"room_name": "餐厅", "room_type": "dining", "area_ratio": 0.08, "default_floor": "tile", "default_wall": "paint"},
            {"room_name": "主卧", "room_type": "bedroom", "area_ratio": 0.16, "default_floor": "wood", "default_wall": "paint"},
            {"room_name": "次卧", "room_type": "bedroom", "area_ratio": 0.11, "default_floor": "wood", "default_wall": "paint"},
            {"room_name": "书房", "room_type": "bedroom", "area_ratio": 0.08, "default_floor": "wood", "default_wall": "paint"},
            {"room_name": "厨房", "room_type": "kitchen", "area_ratio": 0.07, "default_floor": "tile", "default_wall": "tile"},
            {"room_name": "主卫", "room_type": "bathroom", "area_ratio": 0.05, "default_floor": "tile", "default_wall": "tile"},
            {"room_name": "客卫", "room_type": "bathroom", "area_ratio": 0.04, "default_floor": "tile", "default_wall": "tile"},
            {"room_name": "阳台", "room_type": "balcony", "area_ratio": 0.06, "default_floor": "tile", "default_wall": "paint"},
            {"room_name": "过道", "room_type": "hallway", "area_ratio": 0.07, "default_floor": "tile", "default_wall": "paint"},
        ],
    },
]

GLOSSARY = [
    {"term": "水电改造", "category": "水电", "definition": "对原有水路和电路进行重新布局和改造", "purpose": "满足新的用水用电需求", "risk": "隐蔽工程，完工后难以修改", "common_pitfall": "报价按米计算时注意是否包含开槽费", "verify_method": "打压测试0.8MPa保持30分钟不掉压", "tags_json": ["水电", "隐蔽工程"]},
    {"term": "闭水试验", "category": "防水", "definition": "在防水施工完成后蓄水检验防水效果", "purpose": "验证防水层是否渗漏", "risk": "不做可能导致漏水到楼下", "common_pitfall": "蓄水时间不够（至少48小时）", "verify_method": "蓄水48小时后检查楼下天花板无渗漏", "tags_json": ["防水", "验收"]},
    {"term": "腻子", "category": "油漆", "definition": "墙面找平用的膏状材料，刷漆前的基层处理", "purpose": "使墙面平整光滑，便于刷漆", "risk": "使用劣质腻子可能导致墙面开裂脱落", "common_pitfall": "确认是否为耐水腻子", "verify_method": "干燥后用灯光侧照检查平整度", "tags_json": ["油漆", "墙面"]},
    {"term": "美缝", "category": "泥瓦", "definition": "瓷砖铺贴后对缝隙进行填充美化处理", "purpose": "防水防霉，美观耐用", "risk": "不做美缝容易发霉发黑", "common_pitfall": "美缝剂品质差异大，注意选环保产品", "verify_method": "检查填充饱满、颜色一致、无气泡", "tags_json": ["泥瓦", "瓷砖"]},
    {"term": "找平", "category": "泥瓦", "definition": "用水泥砂浆将不平整的地面处理平整", "purpose": "为铺设地板或地砖提供平整基层", "risk": "找平不好会导致地板起翘、空鼓", "common_pitfall": "自流平和水泥砂浆找平价格差异较大", "verify_method": "用2米靠尺检查，误差不超过3mm", "tags_json": ["泥瓦", "地面"]},
]


def seed():
    with Session(engine) as db:
        # 1. 标准项目
        item_map = {}
        for s in STANDARD_ITEMS:
            item = PricingStandardItem(**s)
            db.add(item)
            db.flush()
            item_map[s["code"]] = item.id
        print(f"✅ 写入 {len(STANDARD_ITEMS)} 条标准项目")

        # 2. 价格规则
        count = 0
        for rule in PRICING_RULES_CHENGDU:
            code = rule["code"]
            for tier_name in ["economy", "standard", "premium"]:
                mat, lab, acc = rule[tier_name]
                db.add(PricingRule(
                    city_code="510100",
                    standard_item_id=item_map[code],
                    tier=tier_name,
                    material_unit_price=mat,
                    labor_unit_price=lab,
                    accessory_unit_price=acc,
                    unit="m²",
                    loss_rate=0.05,
                    price_source="行业调研2025",
                ))
                count += 1
        db.flush()
        print(f"✅ 写入 {count} 条价格规则")

        # 3. 城市系数
        for cf in CITY_FACTORS:
            db.add(CityFactor(**cf))
        db.flush()
        print(f"✅ 写入 {len(CITY_FACTORS)} 个城市系数")

        # 4. 户型模板
        for lt in LAYOUT_TEMPLATES:
            rooms_data = lt.pop("rooms")
            template = LayoutTemplate(**lt)
            db.add(template)
            db.flush()
            for i, r in enumerate(rooms_data):
                db.add(RoomTemplate(
                    layout_template_id=template.id,
                    room_name=r["room_name"],
                    room_type=r["room_type"],
                    area_ratio=r["area_ratio"],
                    default_floor=r["default_floor"],
                    default_wall=r["default_wall"],
                    sort_order=i,
                ))
            db.flush()
        print(f"✅ 写入 {len(LAYOUT_TEMPLATES)} 个户型模板")

        # 5. 词典
        for g in GLOSSARY:
            db.add(GlossaryTerm(**g))
        db.flush()
        print(f"✅ 写入 {len(GLOSSARY)} 条装修词典")

        db.commit()
        print("\n🎉 所有种子数据写入完成！")


if __name__ == "__main__":
    seed()
