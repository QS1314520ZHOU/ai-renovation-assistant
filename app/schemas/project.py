import uuid
from datetime import date
from pydantic import BaseModel

class ProjectCreate(BaseModel):
    name: str
    city_code: str
    city_name: str | None = None
    target_budget: float | None = None
    start_date: date | None = None
    move_in_date: date | None = None

class ProjectUpdate(BaseModel):
    name: str | None = None
    status: str | None = None
    target_budget: float | None = None
    start_date: date | None = None
    end_date: date | None = None
    move_in_date: date | None = None
    current_phase: str | None = None

class ProjectOut(BaseModel):
    id: uuid.UUID
    name: str
    status: str
    city_code: str
    city_name: str | None
    target_budget: float | None
    actual_spent: float
    start_date: date | None
    current_phase: str | None

    model_config = {"from_attributes": True}
