import uuid
from sqlalchemy import String, Numeric, Integer, Boolean, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

class BudgetScheme(Base, TimestampMixin):
    __tablename__ = "budget_schemes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("renovation_projects.id"), index=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    tier: Mapped[str] = mapped_column(String(20))
    total_amount: Mapped[float | None] = mapped_column(Numeric(12, 2))
    material_amount: Mapped[float | None] = mapped_column(Numeric(12, 2))
    labor_amount: Mapped[float | None] = mapped_column(Numeric(12, 2))
    accessory_amount: Mapped[float | None] = mapped_column(Numeric(12, 2))
    fixed_amount: Mapped[float | None] = mapped_column(Numeric(12, 2))
    management_fee: Mapped[float | None] = mapped_column(Numeric(12, 2))
    contingency: Mapped[float | None] = mapped_column(Numeric(12, 2))
    input_snapshot: Mapped[dict | None] = mapped_column(JSONB)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    ai_explanation: Mapped[str | None] = mapped_column(Text)

    items = relationship("BudgetItem", back_populates="scheme", lazy="selectin")

class BudgetItem(Base, TimestampMixin):
    __tablename__ = "budget_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scheme_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("budget_schemes.id", ondelete="CASCADE"), index=True)
    standard_item_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    room_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    category: Mapped[str] = mapped_column(String(50))
    item_name: Mapped[str] = mapped_column(String(200))
    pricing_mode: Mapped[str | None] = mapped_column(String(20))
    quantity: Mapped[float | None] = mapped_column(Numeric(10, 2))
    unit: Mapped[str | None] = mapped_column(String(20))
    material_unit_price: Mapped[float | None] = mapped_column(Numeric(10, 2))
    labor_unit_price: Mapped[float | None] = mapped_column(Numeric(10, 2))
    accessory_unit_price: Mapped[float | None] = mapped_column(Numeric(10, 2))
    loss_rate: Mapped[float] = mapped_column(Numeric(5, 4), default=0)
    subtotal: Mapped[float | None] = mapped_column(Numeric(12, 2))
    is_user_modified: Mapped[bool] = mapped_column(Boolean, default=False)
    original_value_json: Mapped[dict | None] = mapped_column(JSONB)
    data_source: Mapped[str | None] = mapped_column(String(50))
    remark: Mapped[str | None] = mapped_column(String(500))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    scheme = relationship("BudgetScheme", back_populates="items")
