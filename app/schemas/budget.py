import uuid
from pydantic import BaseModel

class BudgetCalcRequest(BaseModel):
    project_id: uuid.UUID | None = None
    city_code: str
    inner_area: float
    layout_type: str
    tier: str = "standard"
    floor_preference: str = "tile"
    bathroom_count: int = 1
    special_needs: list[str] = []

class BudgetItemOut(BaseModel):
    id: uuid.UUID
    category: str
    item_name: str
    quantity: float | None
    unit: str | None
    material_unit_price: float | None
    labor_unit_price: float | None
    subtotal: float | None
    is_user_modified: bool
    data_source: str | None

    model_config = {"from_attributes": True}

class BudgetSchemeOut(BaseModel):
    id: uuid.UUID
    tier: str
    total_amount: float | None
    material_amount: float | None
    labor_amount: float | None
    management_fee: float | None
    contingency: float | None
    ai_explanation: str | None
    items: list[BudgetItemOut] = []

    model_config = {"from_attributes": True}

class BudgetResultOut(BaseModel):
    project_id: uuid.UUID
    schemes: list[BudgetSchemeOut]
    missing_items: list[dict] = []
    suggestions: list[str] = []
