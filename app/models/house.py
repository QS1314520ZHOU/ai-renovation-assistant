import uuid
from sqlalchemy import String, Numeric, Integer, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

class HouseProfile(Base, TimestampMixin):
    __tablename__ = "house_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("renovation_projects.id"), index=True)
    building_area: Mapped[float | None] = mapped_column(Numeric(8, 2))
    inner_area: Mapped[float | None] = mapped_column(Numeric(8, 2))
    layout_type: Mapped[str | None] = mapped_column(String(50))
    floor_number: Mapped[int | None] = mapped_column(Integer)
    total_floors: Mapped[int | None] = mapped_column(Integer)
    building_age: Mapped[int | None] = mapped_column(Integer)
    is_elevator: Mapped[bool] = mapped_column(Boolean, default=False)
    has_balcony: Mapped[bool] = mapped_column(Boolean, default=True)
    balcony_count: Mapped[int] = mapped_column(Integer, default=1)
    bathroom_count: Mapped[int] = mapped_column(Integer, default=1)
    current_status: Mapped[str] = mapped_column(String(20), default="blank")
    decoration_style: Mapped[str | None] = mapped_column(String(50))
    tier_preference: Mapped[str] = mapped_column(String(20), default="standard")
    floor_preference: Mapped[str] = mapped_column(String(20), default="tile")
    special_needs: Mapped[list | None] = mapped_column(JSONB, default=list)

    project = relationship("RenovationProject", back_populates="house_profile")
    rooms = relationship("Room", back_populates="house_profile", lazy="selectin")

class Room(Base, TimestampMixin):
    __tablename__ = "rooms"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    house_profile_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("house_profiles.id"), index=True)
    room_name: Mapped[str] = mapped_column(String(50))
    room_type: Mapped[str] = mapped_column(String(30))
    area: Mapped[float | None] = mapped_column(Numeric(8, 2))
    perimeter: Mapped[float | None] = mapped_column(Numeric(8, 2))
    ceiling_height: Mapped[float] = mapped_column(Numeric(4, 2), default=2.80)
    wall_area: Mapped[float | None] = mapped_column(Numeric(8, 2))
    floor_area: Mapped[float | None] = mapped_column(Numeric(8, 2))
    door_count: Mapped[int] = mapped_column(Integer, default=1)
    window_count: Mapped[int] = mapped_column(Integer, default=1)
    window_area: Mapped[float | None] = mapped_column(Numeric(6, 2))
    has_floor_heating: Mapped[bool] = mapped_column(Boolean, default=False)
    floor_material: Mapped[str | None] = mapped_column(String(20))
    wall_material: Mapped[str | None] = mapped_column(String(20))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    house_profile = relationship("HouseProfile", back_populates="rooms")
