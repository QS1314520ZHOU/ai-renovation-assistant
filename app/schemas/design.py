from typing import Any

from pydantic import BaseModel


class DesignGenerateResponse(BaseModel):
    source_image_url: str
    generated_image_url: str
    style: str
    room_type: str
    provider: str
    is_mock: bool = True
    note: str | None = None
    prompt: str | None = None
    control_mode: str = "none"
    strength: float = 0.7
    seed: int | None = None
    preferences: dict[str, Any] = {}
