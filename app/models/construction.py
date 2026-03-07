import uuid
from datetime import date
from sqlalchemy import String, Numeric, Integer, Boolean, Date, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin

class ConstructionPhaseRecord(Base, TimestampMixin):
    __tablename__ = "construction_phase_records"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("renovation_projects.id"), index=True)
    phase: Mapped[str] = mapped_column(String(30))
    status: Mapped[str] = mapped_column(String(20), default="pending")
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    notes: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

class ConstructionLog(Base, TimestampMixin):
    __tablename__ = "construction_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("renovation_projects.id"), index=True)
    phase: Mapped[str] = mapped_column(String(30))
    log_date: Mapped[date] = mapped_column(Date)
    title: Mapped[str] = mapped_column(String(200))
    content: Mapped[str | None] = mapped_column(Text)
    photos_json: Mapped[list | None] = mapped_column(JSONB, default=list)

class PaymentRecord(Base, TimestampMixin):
    __tablename__ = "payment_records"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("renovation_projects.id"), index=True)
    phase: Mapped[str] = mapped_column(String(30))
    payment_type: Mapped[str] = mapped_column(String(30))
    amount: Mapped[float] = mapped_column(Numeric(12, 2))
    payee: Mapped[str | None] = mapped_column(String(100))
    payment_date: Mapped[date] = mapped_column(Date)
    note: Mapped[str | None] = mapped_column(Text)
    receipt_url: Mapped[str | None] = mapped_column(String(500))
    is_addon: Mapped[bool] = mapped_column(Boolean, default=False)
    addon_reason: Mapped[str | None] = mapped_column(String(200))

class ChecklistRecord(Base, TimestampMixin):
    __tablename__ = "checklist_records"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("renovation_projects.id"), index=True)
    phase: Mapped[str] = mapped_column(String(30))
    group_name: Mapped[str] = mapped_column(String(50))
    content: Mapped[str] = mapped_column(String(500))
    is_checked: Mapped[bool] = mapped_column(Boolean, default=False)
    note: Mapped[str | None] = mapped_column(Text)
    photo_url: Mapped[str | None] = mapped_column(String(500))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

class PurchaseRecord(Base, TimestampMixin):
    __tablename__ = "purchase_records"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("renovation_projects.id"), index=True)
    phase: Mapped[str] = mapped_column(String(30))
    name: Mapped[str] = mapped_column(String(200))
    category: Mapped[str] = mapped_column(String(50))
    estimated_price: Mapped[float | None] = mapped_column(Numeric(10, 2))
    actual_price: Mapped[float | None] = mapped_column(Numeric(10, 2))
    is_purchased: Mapped[bool] = mapped_column(Boolean, default=False)
    need_measure: Mapped[bool] = mapped_column(Boolean, default=False)
    deadline: Mapped[date | None] = mapped_column(Date)
    note: Mapped[str | None] = mapped_column(Text)
