import uuid
from sqlalchemy import String, Integer, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin

class GlossaryTerm(Base, TimestampMixin):
    __tablename__ = "glossary_terms"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    term: Mapped[str] = mapped_column(String(100), index=True)
    aliases_json: Mapped[list | None] = mapped_column(JSONB, default=list)
    category: Mapped[str] = mapped_column(String(50), index=True)
    definition: Mapped[str] = mapped_column(Text)
    purpose: Mapped[str | None] = mapped_column(Text)
    risk: Mapped[str | None] = mapped_column(Text)
    common_pitfall: Mapped[str | None] = mapped_column(Text)
    verify_method: Mapped[str | None] = mapped_column(Text)
    tags_json: Mapped[list | None] = mapped_column(JSONB, default=list)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
