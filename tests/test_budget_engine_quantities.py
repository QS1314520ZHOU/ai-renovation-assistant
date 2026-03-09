import math
import uuid
from types import SimpleNamespace

import pytest

from app.services.budget_engine import BudgetEngineService


@pytest.fixture()
def service() -> BudgetEngineService:
    return BudgetEngineService(db=None)  # type: ignore[arg-type]


@pytest.fixture()
def rooms() -> list[dict]:
    return [
        {"room_name": "客厅", "room_type": "living", "area": 24.0, "floor_material": "tile", "wall_material": "paint", "door_count": 0},
        {"room_name": "主卧", "room_type": "bedroom", "area": 16.0, "floor_material": "wood", "wall_material": "paint", "door_count": 1},
        {"room_name": "卫生间", "room_type": "bathroom", "area": 5.0, "floor_material": "tile", "wall_material": "tile", "door_count": 1},
        {"room_name": "厨房", "room_type": "kitchen", "area": 7.0, "floor_material": "tile", "wall_material": "tile", "door_count": 1},
    ]


@pytest.mark.parametrize(
    ("code", "inner_area", "expected"),
    [
        ("SI_HYDRO_ELECTRIC", 96.0, 96.0),
        ("SI_FLOOR_TILE", 96.0, 36.0),
        ("SI_FLOOR_WOOD", 96.0, 16.0),
        ("SI_WALL_PAINT", 96.0, 100.0),
        ("SI_WALL_TILE", 96.0, 36.0),
        ("SI_WATERPROOF", 96.0, 12.0),
        ("SI_DOOR", 96.0, 3.0),
    ],
)
def test_calculate_quantity(service: BudgetEngineService, rooms: list[dict], code: str, inner_area: float, expected: float) -> None:
    result = service._calculate_quantity(code, rooms, inner_area)
    assert math.isclose(result, expected, rel_tol=1e-6, abs_tol=1e-6)


def test_calc_one_tier(service: BudgetEngineService, rooms: list[dict]) -> None:
    std_id = uuid.uuid4()
    rule = SimpleNamespace(
        tier="standard",
        standard_item_id=std_id,
        material_unit_price=100,
        labor_unit_price=50,
        accessory_unit_price=20,
        loss_rate=0.1,
        unit="㎡",
    )
    std_item = SimpleNamespace(
        id=std_id,
        code="SI_FLOOR_TILE",
        category="ground",
        name="地砖铺贴",
        pricing_mode="area",
        unit="㎡",
        sort_order=1,
    )

    result = service._calc_one_tier(
        tier="standard",
        rooms=rooms,
        rules=[rule],
        std_items={std_id: std_item},
        city_factors={"material": 1.0, "labor": 1.0},
        inner_area=96.0,
        floor_preference="mixed",
        bathroom_count=1,
    )

    assert len(result["items"]) == 1
    assert result["items"][0]["item_name"] == "地砖铺贴"
    assert math.isclose(result["items"][0]["quantity"], 36.0, rel_tol=1e-6, abs_tol=1e-6)
    assert math.isclose(result["material"], 3960.0, rel_tol=1e-6, abs_tol=1e-6)
    assert math.isclose(result["labor"], 1980.0, rel_tol=1e-6, abs_tol=1e-6)
    assert math.isclose(result["accessory"], 792.0, rel_tol=1e-6, abs_tol=1e-6)
    assert math.isclose(result["management_fee"], 538.56, rel_tol=1e-6, abs_tol=1e-6)
    assert math.isclose(result["contingency"], 673.2, rel_tol=1e-6, abs_tol=1e-6)
    assert math.isclose(result["total"], 7943.76, rel_tol=1e-6, abs_tol=1e-6)
