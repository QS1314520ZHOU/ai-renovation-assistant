import uuid
from sqlalchemy import String, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin

class UserFeedback(Base, TimestampMixin):
    __tablename__ = "user_feedback"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    project_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    feedback_type: Mapped[str] = mapped_column(String(30))  # budget/missing/ai/glossary/quote
    rating: Mapped[int | None] = mapped_column(Integer)  # 1-5
    content: Mapped[str | None] = mapped_column(Text)
    tags_json: Mapped[list | None] = mapped_column(JSONB, default=list)
    context_json: Mapped[dict | None] = mapped_column(JSONB)
