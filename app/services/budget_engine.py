import logging
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.budget import BudgetItem, BudgetScheme
from app.models.pricing import CityFactor, LayoutTemplate, PricingRule, PricingStandardItem, RoomTemplate
from app.models.project import RenovationProject
from app.schemas.budget import BudgetCalcRequest, BudgetItemOut, BudgetResultOut, BudgetSchemeOut

logger = logging.getLogger(__name__)

DEFAULT_CITY_CODE = '510100'
PREVIEW_PROJECT_ID = uuid.UUID(int=0)
CHINESE_NUMBER_MAP = {
    '零': '0',
    '一': '1',
    '二': '2',
    '两': '2',
    '三': '3',
    '四': '4',
    '五': '5',
    '六': '6',
    '七': '7',
    '八': '8',
    '九': '9',
}


class BudgetEngineService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def calculate(self, req: BudgetCalcRequest, user_id: str) -> BudgetResultOut:
        city_code = await self._resolve_city_code(req.city_code, req.city_name)
        city_factors = await self._get_city_factors(city_code)
        rooms = await self._generate_rooms(
            layout_type=req.layout_type,
            inner_area=float(req.inner_area),
            floor_preference=req.floor_preference,
            bathroom_count=req.bathroom_count,
        )
        rules = await self._get_pricing_rules(city_code)

        if not rules:
            raise RuntimeError('未找到可用的预算规则，请先初始化价格标准数据。')

        standard_item_ids = {rule.standard_item_id for rule in rules}
        std_res = await self.db.execute(
            select(PricingStandardItem).where(PricingStandardItem.id.in_(standard_item_ids))
        )
        standard_items = {item.id: item for item in std_res.scalars().all()}

        persist_project_id = await self._resolve_persist_project_id(req.project_id, user_id)
        schemes: list[BudgetSchemeOut | BudgetScheme] = []

        for tier in ['economy', 'standard', 'premium']:
            scheme_data = self._calc_one_tier(
                tier=tier,
                rooms=rooms,
                rules=rules,
                std_items=standard_items,
                city_factors=city_factors,
                inner_area=float(req.inner_area),
                floor_preference=req.floor_preference,
                bathroom_count=req.bathroom_count,
            )

            if persist_project_id:
                scheme = BudgetScheme(
                    project_id=persist_project_id,
                    tier=tier,
                    total_amount=scheme_data['total'],
                    material_amount=scheme_data['material'],
                    labor_amount=scheme_data['labor'],
                    accessory_amount=scheme_data['accessory'],
                    management_fee=scheme_data['management_fee'],
                    contingency=scheme_data['contingency'],
                    is_primary=(tier == req.tier),
                    input_snapshot=req.model_dump(),
                )
                self.db.add(scheme)
                await self.db.flush()

                for item in scheme_data['items']:
                    self.db.add(BudgetItem(scheme_id=scheme.id, **item))

                schemes.append(scheme)
            else:
                scheme_id = uuid.uuid4()
                items_out = [
                    BudgetItemOut(
                        id=uuid.uuid4(),
                        scheme_id=scheme_id,
                        room_id=item.get('room_id'),
                        standard_item_id=item.get('standard_item_id'),
                        category=item['category'],
                        item_name=item['item_name'],
                        pricing_mode=item.get('pricing_mode'),
                        quantity=item.get('quantity'),
                        unit=item.get('unit'),
                        material_unit_price=item.get('material_unit_price'),
                        labor_unit_price=item.get('labor_unit_price'),
                        accessory_unit_price=item.get('accessory_unit_price'),
                        loss_rate=item.get('loss_rate'),
                        subtotal=item.get('subtotal'),
                        is_user_modified=False,
                        data_source=item.get('data_source'),
                        remark=item.get('remark'),
                        sort_order=item.get('sort_order'),
                    )
                    for item in scheme_data['items']
                ]

                schemes.append(
                    BudgetSchemeOut(
                        id=scheme_id,
                        project_id=req.project_id,
                        tier=tier,
                        total_amount=scheme_data['total'],
                        material_amount=scheme_data['material'],
                        labor_amount=scheme_data['labor'],
                        accessory_amount=scheme_data['accessory'],
                        management_fee=scheme_data['management_fee'],
                        contingency=scheme_data['contingency'],
                        items=items_out,
                    )
                )

        await self.db.flush()

        schemes_out: list[BudgetSchemeOut] = []
        for scheme in schemes:
            if isinstance(scheme, BudgetSchemeOut):
                schemes_out.append(scheme)
            else:
                schemes_out.append(BudgetSchemeOut.model_validate(scheme))

        return BudgetResultOut(
            project_id=persist_project_id or req.project_id or PREVIEW_PROJECT_ID,
            schemes=schemes_out,
            missing_items=[],
            suggestions=[
                '建议优先关注水电改造和防水节点。',
                '卫生间与阳台防水完工后，务必做闭水试验。',
            ],
        )

    async def _resolve_city_code(self, city_code: str | None, city_name: str | None) -> str:
        if city_code:
            return city_code

        if city_name:
            result = await self.db.execute(
                select(CityFactor).where(CityFactor.city_name.ilike(f'%{city_name}%'))
            )
            city = result.scalars().first()
            if city:
                return city.city_code

        return DEFAULT_CITY_CODE

    async def _get_city_factors(self, city_code: str) -> dict[str, float]:
        result = await self.db.execute(
            select(CityFactor).where(CityFactor.city_code == city_code)
        )
        city = result.scalar_one_or_none()

        if not city and city_code != DEFAULT_CITY_CODE:
            result = await self.db.execute(
                select(CityFactor).where(CityFactor.city_code == DEFAULT_CITY_CODE)
            )
            city = result.scalar_one_or_none()

        material_factor = float(city.factor) if city and city.factor is not None else 1.0
        labor_factor = float(city.labor_factor) if city and city.labor_factor is not None else material_factor
        return {
            'material': material_factor,
            'labor': labor_factor,
        }

    async def _get_pricing_rules(self, city_code: str) -> list[PricingRule]:
        result = await self.db.execute(
            select(PricingRule)
            .where(PricingRule.city_code == city_code, PricingRule.is_active == True)
            .order_by(PricingRule.tier, PricingRule.created_at.desc())
        )
        rules = list(result.scalars().all())
        if rules:
            return rules

        fallback = await self.db.execute(
            select(PricingRule)
            .where(PricingRule.city_code == DEFAULT_CITY_CODE, PricingRule.is_active == True)
            .order_by(PricingRule.tier, PricingRule.created_at.desc())
        )
        return list(fallback.scalars().all())

    async def _resolve_persist_project_id(self, project_id: uuid.UUID | None, user_id: str) -> uuid.UUID | None:
        if not project_id:
            return None

        result = await self.db.execute(
            select(RenovationProject).where(
                RenovationProject.id == project_id,
                RenovationProject.user_id == user_id,
            )
        )
        project = result.scalar_one_or_none()
        if project:
            return project.id

        logger.warning('Budget calculate received a non-persisted project_id=%s, fallback to preview mode', project_id)
        return None

    async def _generate_rooms(
        self,
        layout_type: str,
        inner_area: float,
        floor_preference: str,
        bathroom_count: int,
    ) -> list[dict[str, Any]]:
        template = await self._find_layout_template(layout_type, inner_area)
        if template:
            result = await self.db.execute(
                select(RoomTemplate)
                .where(RoomTemplate.layout_template_id == template.id)
                .order_by(RoomTemplate.sort_order, RoomTemplate.room_name)
            )
            room_templates = list(result.scalars().all())
            if room_templates:
                rooms = [
                    self._build_room_from_template(room, inner_area, floor_preference)
                    for room in room_templates
                ]
                return self._rebalance_room_areas(rooms, inner_area)

        return self._build_fallback_rooms(layout_type, inner_area, floor_preference, bathroom_count)

    async def _find_layout_template(self, layout_type: str, inner_area: float) -> LayoutTemplate | None:
        candidates = self._layout_candidates(layout_type)
        result = await self.db.execute(
            select(LayoutTemplate)
            .where(LayoutTemplate.layout_type.in_(candidates), LayoutTemplate.is_active == True)
            .order_by(LayoutTemplate.sort_order, LayoutTemplate.name)
        )
        templates = list(result.scalars().all())
        if not templates:
            return None

        exact = next((item for item in templates if item.layout_type == layout_type), None)
        if exact:
            return exact

        with_area = [item for item in templates if item.total_area is not None]
        if with_area:
            return min(with_area, key=lambda item: abs(float(item.total_area) - inner_area))

        return templates[0]

    def _layout_candidates(self, layout_type: str) -> list[str]:
        normalized = self._normalize_layout(layout_type)
        bedroom_count, living_count, bathroom_count = self._parse_layout_counts(normalized)

        digit_layout = f'{bedroom_count}室{living_count}厅{bathroom_count}卫'
        chinese_layout = f'{self._digit_to_chinese(bedroom_count)}室{self._digit_to_chinese(living_count)}厅{self._digit_to_chinese(bathroom_count)}卫'
        return list(dict.fromkeys([layout_type, normalized, digit_layout, chinese_layout]))

    def _normalize_layout(self, layout_type: str) -> str:
        normalized = (layout_type or '').strip()
        for chinese, digit in CHINESE_NUMBER_MAP.items():
            normalized = normalized.replace(chinese, digit)
        normalized = normalized.replace('房', '室')
        return normalized

    def _parse_layout_counts(self, layout_type: str) -> tuple[int, int, int]:
        normalized = self._normalize_layout(layout_type)
        match = None
        for pattern in [
            r'(\d)\s*室\s*(\d)\s*厅\s*(\d)\s*卫',
            r'(\d)\s*室\s*(\d)\s*厅',
        ]:
            match = __import__('re').search(pattern, normalized)
            if match:
                break

        if match:
            bedroom_count = int(match.group(1))
            living_count = int(match.group(2))
            bathroom_count = int(match.group(3)) if match.lastindex and match.lastindex >= 3 and match.group(3) else 1
            return bedroom_count, living_count, bathroom_count

        return 3, 2, 1

    def _digit_to_chinese(self, number: int) -> str:
        reverse_map = {
            0: '零',
            1: '一',
            2: '两',
            3: '三',
            4: '四',
            5: '五',
        }
        return reverse_map.get(number, str(number))

    def _build_room_from_template(
        self,
        room: RoomTemplate,
        inner_area: float,
        floor_preference: str,
    ) -> dict[str, Any]:
        if room.default_area is not None:
            area = float(room.default_area)
        elif room.area_ratio is not None:
            area = inner_area * float(room.area_ratio)
        else:
            area = inner_area / 6

        return {
            'room_name': room.room_name,
            'room_type': room.room_type,
            'area': round(area, 2),
            'door_count': int(room.door_count or 1),
            'floor_material': self._resolve_floor_material(room.room_type, room.default_floor, floor_preference),
            'wall_material': self._resolve_wall_material(room.room_type, room.default_wall),
        }

    def _build_fallback_rooms(
        self,
        layout_type: str,
        inner_area: float,
        floor_preference: str,
        bathroom_count: int,
    ) -> list[dict[str, Any]]:
        bedroom_count, living_count, layout_bathroom_count = self._parse_layout_counts(layout_type)
        actual_bathroom_count = bathroom_count or layout_bathroom_count or 1

        rooms: list[dict[str, Any]] = []
        living_area = inner_area * (0.24 if living_count <= 1 else 0.20)
        kitchen_area = max(6.0, inner_area * 0.08)
        dining_area = inner_area * 0.08 if living_count >= 2 else 0.0
        bathroom_area = max(4.0, inner_area * 0.05)
        balcony_area = 4.5 if inner_area >= 75 else 0.0

        rooms.append(self._make_room('客厅', 'living', living_area, floor_preference, 0))
        if dining_area > 0:
            rooms.append(self._make_room('餐厅', 'dining', dining_area, floor_preference, 0))
        rooms.append(self._make_room('厨房', 'kitchen', kitchen_area, floor_preference, 1))

        for index in range(actual_bathroom_count):
            room_name = '主卫' if actual_bathroom_count > 1 and index == 0 else f'卫生间{index + 1}' if actual_bathroom_count > 1 else '卫生间'
            rooms.append(self._make_room(room_name, 'bathroom', bathroom_area, floor_preference, 1))

        if balcony_area > 0:
            rooms.append(self._make_room('阳台', 'balcony', balcony_area, floor_preference, 0))

        used_area = sum(room['area'] for room in rooms)
        bedroom_area = max(8.0, (inner_area - used_area) / max(1, bedroom_count))
        for index in range(bedroom_count):
            room_name = '主卧' if index == 0 else f'次卧{index}'
            rooms.append(self._make_room(room_name, 'bedroom', bedroom_area, floor_preference, 1))

        return self._rebalance_room_areas(rooms, inner_area)

    def _make_room(
        self,
        room_name: str,
        room_type: str,
        area: float,
        floor_preference: str,
        door_count: int,
    ) -> dict[str, Any]:
        return {
            'room_name': room_name,
            'room_type': room_type,
            'area': round(area, 2),
            'door_count': door_count or 1,
            'floor_material': self._resolve_floor_material(room_type, None, floor_preference),
            'wall_material': self._resolve_wall_material(room_type, None),
        }

    def _rebalance_room_areas(self, rooms: list[dict[str, Any]], inner_area: float) -> list[dict[str, Any]]:
        total_area = sum(room['area'] for room in rooms)
        if not total_area:
            return rooms

        scale = inner_area / total_area
        for room in rooms:
            room['area'] = round(room['area'] * scale, 2)
        return rooms

    def _resolve_floor_material(self, room_type: str, default_floor: str | None, floor_preference: str) -> str:
        if room_type in {'kitchen', 'bathroom', 'balcony'}:
            return 'tile'
        if default_floor:
            return default_floor
        if floor_preference == 'wood':
            return 'wood'
        if floor_preference == 'mixed':
            return 'wood' if room_type == 'bedroom' else 'tile'
        return 'tile'

    def _resolve_wall_material(self, room_type: str, default_wall: str | None) -> str:
        if default_wall:
            return default_wall
        if room_type in {'kitchen', 'bathroom'}:
            return 'tile'
        return 'paint'

    def _calculate_quantity(self, code: str, rooms: list[dict[str, Any]], inner_area: float) -> float:
        if code == 'SI_HYDRO_ELECTRIC':
            return inner_area
        if code == 'SI_FLOOR_TILE':
            return sum(room['area'] for room in rooms if room.get('floor_material') == 'tile')
        if code == 'SI_FLOOR_WOOD':
            return sum(room['area'] for room in rooms if room.get('floor_material') == 'wood')
        if code == 'SI_WALL_PAINT':
            return sum(room['area'] for room in rooms if room.get('wall_material') == 'paint') * 2.5
        if code == 'SI_WALL_TILE':
            return sum(room['area'] for room in rooms if room.get('wall_material') == 'tile') * 3.0
        if code == 'SI_WATERPROOF':
            return sum(room['area'] for room in rooms if room['room_type'] in {'kitchen', 'bathroom', 'balcony'})
        if code == 'SI_CEILING':
            return sum(room['area'] for room in rooms if room['room_type'] in {'living', 'dining'}) * 0.8
        if code == 'SI_DOOR':
            return sum(room.get('door_count', 1) for room in rooms if room['room_type'] != 'living')
        if code == 'SI_DEMOLITION':
            return inner_area * 0.15
        if code == 'SI_CUSTOM_CABINET':
            return inner_area * 0.18
        if code == 'SI_CUSTOM_WARDROBE':
            bedroom_area = sum(room['area'] for room in rooms if room['room_type'] == 'bedroom')
            return bedroom_area * 0.22
        if code == 'SI_CABINET_KITCHEN':
            kitchen_area = sum(room['area'] for room in rooms if room['room_type'] == 'kitchen')
            return max(3.2, kitchen_area * 0.6)
        return inner_area

    def _calc_one_tier(
        self,
        tier: str,
        rooms: list[dict[str, Any]],
        rules: list[PricingRule],
        std_items: dict[uuid.UUID, PricingStandardItem],
        city_factors: dict[str, float],
        inner_area: float,
        floor_preference: str,
        bathroom_count: int,
    ) -> dict[str, Any]:
        items = []
        total_material = 0.0
        total_labor = 0.0
        total_accessory = 0.0

        tier_rules = [rule for rule in rules if rule.tier == tier]
        for rule in tier_rules:
            std_item = std_items.get(rule.standard_item_id)
            if not std_item:
                continue

            quantity = self._calculate_quantity(std_item.code, rooms, inner_area)
            if quantity <= 0:
                continue

            material = float(rule.material_unit_price or 0) * quantity * city_factors['material']
            labor = float(rule.labor_unit_price or 0) * quantity * city_factors['labor']
            accessory = float(rule.accessory_unit_price or 0) * quantity * city_factors['material']
            loss_rate = float(rule.loss_rate or 0.05)
            subtotal = (material + labor + accessory) * (1 + loss_rate)

            total_material += material * (1 + loss_rate)
            total_labor += labor * (1 + loss_rate)
            total_accessory += accessory * (1 + loss_rate)

            items.append({
                'standard_item_id': rule.standard_item_id,
                'category': std_item.category,
                'item_name': std_item.name,
                'pricing_mode': std_item.pricing_mode,
                'quantity': round(quantity, 2),
                'unit': rule.unit or std_item.unit,
                'material_unit_price': round(float(rule.material_unit_price or 0), 2),
                'labor_unit_price': round(float(rule.labor_unit_price or 0), 2),
                'accessory_unit_price': round(float(rule.accessory_unit_price or 0), 2),
                'loss_rate': round(loss_rate, 4),
                'subtotal': round(subtotal, 2),
                'data_source': 'rule_engine',
                'sort_order': std_item.sort_order,
            })

        raw_total = total_material + total_labor + total_accessory
        management_fee = round(raw_total * 0.08, 2)
        contingency = round(raw_total * 0.10, 2)

        return {
            'total': round(raw_total + management_fee + contingency, 2),
            'material': round(total_material, 2),
            'labor': round(total_labor, 2),
            'accessory': round(total_accessory, 2),
            'management_fee': management_fee,
            'contingency': contingency,
            'items': items,
        }

    async def get_schemes(self, project_id: uuid.UUID) -> list[BudgetSchemeOut]:
        result = await self.db.execute(
            select(BudgetScheme)
            .where(BudgetScheme.project_id == project_id)
            .order_by(BudgetScheme.created_at.desc())
        )
        return [BudgetSchemeOut.model_validate(item) for item in result.scalars().all()]

    async def update_item(self, item_id: uuid.UUID, update: dict[str, Any]) -> dict[str, Any]:
        result = await self.db.execute(select(BudgetItem).where(BudgetItem.id == item_id))
        item = result.scalar_one_or_none()
        if not item:
            return {'id': str(item_id), 'updated': False}

        item.original_value_json = {'subtotal': float(item.subtotal or 0)}
        for key, value in update.items():
            if hasattr(item, key):
                setattr(item, key, value)
        item.is_user_modified = True
        await self.db.flush()
        return {'id': str(item_id), 'updated': True}