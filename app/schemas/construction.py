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
    photo_url: str | None = None


class PhaseSeedItem(BaseModel):
    phase: str
    status: str = "pending"
    start_date: date | None = None
    end_date: date | None = None
    notes: str | None = None
    sort_order: int = 0


class ChecklistSeedItem(BaseModel):
    phase: str
    category: str
    content: str
    sort_order: int = 0


class PurchaseSeedItem(BaseModel):
    phase: str
    name: str
    category: str
    estimated_price: float | None = None
    need_measure: bool = False
    note: str | None = None


class PurchaseUpdate(BaseModel):
    purchase_id: uuid.UUID
    is_purchased: bool | None = None
    actual_price: float | None = None
    note: str | None = None


class ConstructionBootstrapRequest(BaseModel):
    phases: list[PhaseSeedItem] = []
    checklists: list[ChecklistSeedItem] = []
    purchases: list[PurchaseSeedItem] = []
