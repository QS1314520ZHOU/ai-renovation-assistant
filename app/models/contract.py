import uuid
from sqlalchemy import String, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin

class ContractUpload(Base, TimestampMixin):
    __tablename__ = "contract_uploads"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("renovation_projects.id"), index=True)
    file_url: Mapped[str] = mapped_column(String(500))
    file_name: Mapped[str | None] = mapped_column(String(200))
    ocr_status: Mapped[str] = mapped_column(String(20), default="pending")
    ocr_raw_text: Mapped[str | None] = mapped_column(Text)
    parsed_data: Mapped[dict | None] = mapped_column(JSONB)

class ContractRiskReport(Base, TimestampMixin):
    __tablename__ = "contract_risk_reports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contract_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("contract_uploads.id"))
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("renovation_projects.id"))
    overall_score: Mapped[int | None] = mapped_column(Integer)
    risk_count_high: Mapped[int] = mapped_column(Integer, default=0)
    risk_count_medium: Mapped[int] = mapped_column(Integer, default=0)
    risk_count_low: Mapped[int] = mapped_column(Integer, default=0)
    risks_json: Mapped[list | None] = mapped_column(JSONB)
    payment_terms_json: Mapped[dict | None] = mapped_column(JSONB)
    recommendations_json: Mapped[list | None] = mapped_column(JSONB)
    ai_summary: Mapped[str | None] = mapped_column(Text)
