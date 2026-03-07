import uuid
from datetime import date
from pydantic import BaseModel

class PhaseUpdate(BaseModel):
    phase: str
    status: str
    start_date: date | None = None
    end_date: date | None = None
    notes: str | None = None

class LogCreate(BaseModel):
    phase: str
    log_date: date
    title: str
    content: str | None = None
    photos: list[str] = []

class PaymentCreate(BaseModel):
    phase: str
    payment_type: str
    amount: float
    payee: str | None = None
    payment_date: date
    note: str | None = None
    is_addon: bool = False
    addon_reason: str | None = None

class ChecklistToggle(BaseModel):
    checklist_id: uuid.UUID
    is_checked: bool
    note: str | None = None
