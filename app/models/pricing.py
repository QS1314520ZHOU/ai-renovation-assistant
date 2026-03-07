import uuid
from datetime import date
from sqlalchemy import String, Numeric, Integer, Boolean, Date, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin

class PricingStandardItem(Base, TimestampMixin):
    __tablename__ = "pricing_standard_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(30), unique=True)
    name: Mapped[str] = mapped_column(String(100))
    aliases_json: Mapped[list | None] = mapped_column(JSONB, default=list)
    category: Mapped[str] = mapped_column(String(50), index=True)
    sub_category: Mapped[str | None] = mapped_column(String(50))
    pricing_mode: Mapped[str] = mapped_column(String(20))
    unit: Mapped[str] = mapped_column(String(20))
    quantity_formula: Mapped[str | None] = mapped_column(Text)
    is_required: Mapped[bool] = mapped_column(Boolean, default=False)
    risk_if_missing: Mapped[str | None] = mapped_column(String(10))
    description: Mapped[str | None] = mapped_column(Text)
    tips: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

class PricingRule(Base, TimestampMixin):
    __tablename__ = "pricing_rules"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    city_code: Mapped[str] = mapped_column(String(10), index=True)
    standard_item_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("pricing_standard_items.id"))
    tier: Mapped[str] = mapped_column(String(20))
    material_unit_price: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    labor_unit_price: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    accessory_unit_price: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    unit: Mapped[str | None] = mapped_column(String(20))
    loss_rate: Mapped[float] = mapped_column(Numeric(5, 4), default=0.05)
    price_source: Mapped[str | None] = mapped_column(String(100))
    effective_date: Mapped[date] = mapped_column(Date, default=date.today)
    expire_date: Mapped[date | None] = mapped_column(Date)
    remark: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

class CityFactor(Base, TimestampMixin):
    __tablename__ = "city_factors"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    city_code: Mapped[str] = mapped_column(String(10), unique=True)
    city_name: Mapped[str] = mapped_column(String(50))
    province: Mapped[str | None] = mapped_column(String(50))
    city_tier: Mapped[str | None] = mapped_column(String(20))
    factor: Mapped[float] = mapped_column(Numeric(5, 3))
    labor_factor: Mapped[float | None] = mapped_column(Numeric(5, 3))
    has_local_price: Mapped[bool] = mapped_column(Boolean, default=False)
    data_quality: Mapped[str] = mapped_column(String(20), default="estimated")

class LayoutTemplate(Base, TimestampMixin):
    __tablename__ = "layout_templates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100))
    layout_type: Mapped[str] = mapped_column(String(50))
    bedroom_count: Mapped[int] = mapped_column(Integer)
    living_count: Mapped[int] = mapped_column(Integer)
    bathroom_count: Mapped[int] = mapped_column(Integer)
    area_min: Mapped[float | None] = mapped_column(Numeric(8, 2))
    area_max: Mapped[float | None] = mapped_column(Numeric(8, 2))
    total_area: Mapped[float | None] = mapped_column(Numeric(8, 2))
    description: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

class RoomTemplate(Base, TimestampMixin):
    __tablename__ = "room_templates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    layout_template_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("layout_templates.id", ondelete="CASCADE"))
    room_name: Mapped[str] = mapped_column(String(50))
    room_type: Mapped[str] = mapped_column(String(30))
    area_ratio: Mapped[float | None] = mapped_column(Numeric(5, 4))
    default_area: Mapped[float | None] = mapped_column(Numeric(8, 2))
    ceiling_height: Mapped[float] = mapped_column(Numeric(4, 2), default=2.80)
    door_count: Mapped[int] = mapped_column(Integer, default=1)
    window_count: Mapped[int] = mapped_column(Integer, default=1)
    window_area_ratio: Mapped[float] = mapped_column(Numeric(5, 4), default=0.15)
    default_floor: Mapped[str | None] = mapped_column(String(20))
    default_wall: Mapped[str | None] = mapped_column(String(20))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
