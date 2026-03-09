import uuid
from pydantic import BaseModel


class BudgetCalcRequest(BaseModel):
    project_id: uuid.UUID | None = None
    city_code: str | None = None
    city_name: str | None = None
    inner_area: float
    layout_type: str
    tier: str = 'standard'
    floor_preference: str = 'tile'
    bathroom_count: int = 1
    special_needs: list[str] = []


class BudgetItemOut(BaseModel):
    id: uuid.UUID
    scheme_id: uuid.UUID | None = None
    room_id: uuid.UUID | None = None
    standard_item_id: uuid.UUID | None = None
    category: str
    item_name: str
    pricing_mode: str | None = None
    quantity: float | None = None
    unit: str | None = None
    material_unit_price: float | None = None
    labor_unit_price: float | None = None
    accessory_unit_price: float | None = None
    loss_rate: float | None = None
    subtotal: float | None = None
    is_user_modified: bool
    data_source: str | None = None
    remark: str | None = None
    sort_order: int | None = None

    model_config = {'from_attributes': True}


class BudgetSchemeOut(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID | None = None
    tier: str
    total_amount: float | None = None
    material_amount: float | None = None
    labor_amount: float | None = None
    accessory_amount: float | None = None
    management_fee: float | None = None
    contingency: float | None = None
    ai_explanation: str | None = None
    items: list[BudgetItemOut] = []

    model_config = {'from_attributes': True}


class BudgetResultOut(BaseModel):
    project_id: uuid.UUID
    schemes: list[BudgetSchemeOut]
    missing_items: list[dict] = []
    suggestions: list[str] = []