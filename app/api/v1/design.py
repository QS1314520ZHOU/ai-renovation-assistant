import json
from typing import Any

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.common import ApiResponse
from app.schemas.design import DesignGenerateResponse
from app.services.design_image_service import DesignImageService
from app.utils.exceptions import BadRequestError

router = APIRouter()

STYLE_OPTIONS = [
    {"label": "现代简约", "value": "modern_minimal"},
    {"label": "北欧", "value": "nordic"},
    {"label": "日式", "value": "japanese"},
    {"label": "轻奢", "value": "light_luxury"},
    {"label": "新中式", "value": "new_chinese"},
]

ROOM_TYPE_OPTIONS = [
    {"label": "客厅", "value": "living"},
    {"label": "卧室", "value": "bedroom"},
    {"label": "厨房", "value": "kitchen"},
    {"label": "卫生间", "value": "bathroom"},
]

STYLE_LABEL_MAP = {item["value"]: item["label"] for item in STYLE_OPTIONS}


@router.get("/styles", response_model=ApiResponse[dict[str, list[dict[str, str]]]])
async def get_style_options(
    user: dict = Depends(get_current_user),
):
    _ = user
    return ApiResponse(data={"styles": STYLE_OPTIONS, "room_types": ROOM_TYPE_OPTIONS})


@router.post("/generate", response_model=ApiResponse[DesignGenerateResponse])
async def generate_design(
    file: UploadFile = File(...),
    style: str = Form(...),
    room_type: str = Form(...),
    preferences: str | None = Form(None),
    control_mode: str = Form("none"),
    strength: float = Form(0.7),
    seed: int | None = Form(None),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _ = user

    parsed_preferences: dict[str, Any] = {}
    if preferences:
        try:
            payload = json.loads(preferences)
            if isinstance(payload, dict):
                parsed_preferences = payload
        except json.JSONDecodeError as exc:
            raise BadRequestError("preferences 必须是合法 JSON") from exc

    service = DesignImageService(db)
    result = await service.generate_room_design(
        room_photo=file,
        style=STYLE_LABEL_MAP.get(style, style),
        room_type=room_type,
        preferences=parsed_preferences,
        control_mode=control_mode,
        strength=strength,
        seed=seed,
    )
    return ApiResponse(data=result)
