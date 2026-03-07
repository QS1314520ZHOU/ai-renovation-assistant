import uuid
from sqlalchemy import String, Numeric, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

class QuoteUpload(Base, TimestampMixin):
    __tablename__ = "quote_uploads"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("renovation_projects.id"), index=True)
    file_url: Mapped[str] = mapped_column(String(500))
    file_name: Mapped[str | None] = mapped_column(String(200))
    file_size: Mapped[int | None] = mapped_column(Integer)
    ocr_status: Mapped[str] = mapped_column(String(20), default="pending")
    ocr_raw_text: Mapped[str | None] = mapped_column(Text)
    ocr_confidence: Mapped[float | None] = mapped_column(Numeric(5, 4))
    parsed_data: Mapped[dict | None] = mapped_column(JSONB)

    items = relationship("QuoteItem", back_populates="quote", lazy="selectin")

class QuoteItem(Base, TimestampMixin):
    __tablename__ = "quote_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quote_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("quote_uploads.id", ondelete="CASCADE"), index=True)
    original_name: Mapped[str | None] = mapped_column(String(200))
    matched_std_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    match_confidence: Mapped[float | None] = mapped_column(Numeric(5, 4))
    category: Mapped[str | None] = mapped_column(String(50))
    unit: Mapped[str | None] = mapped_column(String(20))
    quantity: Mapped[float | None] = mapped_column(Numeric(10, 2))
    unit_price: Mapped[float | None] = mapped_column(Numeric(10, 2))
    total_price: Mapped[float | None] = mapped_column(Numeric(12, 2))
    remark: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    quote = relationship("QuoteUpload", back_populates="items")

class QuoteRiskReport(Base, TimestampMixin):
    __tablename__ = "quote_risk_reports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quote_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("quote_uploads.id"))
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("renovation_projects.id"))
    overall_score: Mapped[int | None] = mapped_column(Integer)
    risk_count_high: Mapped[int] = mapped_column(Integer, default=0)
    risk_count_medium: Mapped[int] = mapped_column(Integer, default=0)
    risk_count_low: Mapped[int] = mapped_column(Integer, default=0)
    risks_json: Mapped[list | None] = mapped_column(JSONB)
    missing_items_json: Mapped[list | None] = mapped_column(JSONB)
    price_anomalies_json: Mapped[list | None] = mapped_column(JSONB)
    suggestions_json: Mapped[list | None] = mapped_column(JSONB)
    ai_summary: Mapped[str | None] = mapped_column(Text)
