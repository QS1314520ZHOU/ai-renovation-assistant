from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.dependencies import get_current_user
from app.models.house import HouseProfile, Room
from app.schemas.house import HouseCreate, HouseOut, RoomOut
from app.schemas.common import ApiResponse
from app.utils.exceptions import NotFoundError

router = APIRouter()

@router.post("/{project_id}", response_model=ApiResponse[HouseOut])
async def create_house(
    project_id: UUID,
    req: HouseCreate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    house = HouseProfile(project_id=project_id, **req.model_dump())
    db.add(house)
    await db.flush()
    return ApiResponse(data=HouseOut.model_validate(house))

@router.get("/{project_id}", response_model=ApiResponse[HouseOut])
async def get_house(
    project_id: UUID,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(HouseProfile).where(HouseProfile.project_id == project_id)
    )
    house = result.scalar_one_or_none()
    if not house:
        raise NotFoundError("未创建房屋档案")
    return ApiResponse(data=HouseOut.model_validate(house))

@router.get("/{project_id}/rooms", response_model=ApiResponse[list[RoomOut]])
async def get_rooms(
    project_id: UUID,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Room)
        .join(HouseProfile)
        .where(HouseProfile.project_id == project_id)
        .order_by(Room.sort_order)
    )
    rooms = result.scalars().all()
    return ApiResponse(data=[RoomOut.model_validate(r) for r in rooms])
