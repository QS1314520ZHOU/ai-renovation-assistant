# app/models/price_snapshot.py

import uuid
from datetime import date, datetime
from sqlalchemy import String, Numeric, Integer, Boolean, Date, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base

class PriceSnapshot(Base):
    __tablename__ = "price_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source: Mapped[str] = mapped_column(String(50))
    city_code: Mapped[str] = mapped_column(String(10), index=True)
    standard_item_code: Mapped[str | None] = mapped_column(String(30))
    raw_material_name: Mapped[str] = mapped_column(String(200))
    raw_spec: Mapped[str | None] = mapped_column(String(200))
    raw_unit: Mapped[str | None] = mapped_column(String(20))
    raw_price: Mapped[float] = mapped_column(Numeric(12, 2))
    price_type: Mapped[str] = mapped_column(String(20))
    snapshot_date: Mapped[date] = mapped_column(Date)
    raw_json: Mapped[dict | None] = mapped_column(JSONB)
    is_processed: Mapped[bool] = mapped_column(Boolean, default=False)


class PriceAdjustmentSuggestion(Base):
    __tablename__ = "price_adjustment_suggestions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    city_code: Mapped[str] = mapped_column(String(10))
    standard_item_code: Mapped[str] = mapped_column(String(30))
    tier: Mapped[str] = mapped_column(String(20))
    current_material_price: Mapped[float | None] = mapped_column(Numeric(10, 2))
    current_labor_price: Mapped[float | None] = mapped_column(Numeric(10, 2))
    suggested_material_price: Mapped[float | None] = mapped_column(Numeric(10, 2))
    suggested_labor_price: Mapped[float | None] = mapped_column(Numeric(10, 2))
    deviation_pct: Mapped[float | None] = mapped_column(Numeric(5, 2))
    sample_count: Mapped[int | None] = mapped_column(Integer)
    sources_json: Mapped[dict | None] = mapped_column(JSONB)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
