import uuid
from pydantic import BaseModel

class HouseCreate(BaseModel):
    building_area: float | None = None
    inner_area: float | None = None
    layout_type: str | None = None
    bathroom_count: int = 1
    tier_preference: str = "standard"
    floor_preference: str = "tile"
    current_status: str = "blank"
    special_needs: list[str] = []

class HouseOut(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    building_area: float | None
    inner_area: float | None
    layout_type: str | None
    tier_preference: str
    floor_preference: str
    bathroom_count: int
    special_needs: list | None

    model_config = {"from_attributes": True}

class RoomOut(BaseModel):
    id: uuid.UUID
    room_name: str
    room_type: str
    area: float | None
    ceiling_height: float
    floor_material: str | None
    wall_material: str | None

    model_config = {"from_attributes": True}
