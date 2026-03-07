import uuid
from datetime import date
from sqlalchemy import String, Numeric, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, SoftDeleteMixin

class RenovationProject(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "renovation_projects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(30), default="draft")
    city_code: Mapped[str] = mapped_column(String(10))
    city_name: Mapped[str | None] = mapped_column(String(50))
    target_budget: Mapped[float | None] = mapped_column(Numeric(12, 2))
    actual_spent: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    move_in_date: Mapped[date | None] = mapped_column(Date)
    current_phase: Mapped[str | None] = mapped_column(String(30))
    notes: Mapped[str | None] = mapped_column(String(2000))
    meta: Mapped[dict | None] = mapped_column(JSONB, default=dict)

    # relationships
    house_profile = relationship("HouseProfile", back_populates="project", uselist=False, lazy="selectin")
