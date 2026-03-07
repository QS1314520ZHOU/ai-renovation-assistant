from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.dependencies import get_admin_user
from app.models.config import SystemConfig
from app.schemas.config import ConfigUpdate, ConfigResponse
from app.schemas.common import ApiResponse

router = APIRouter()

@router.get("/", response_model=ApiResponse[list[ConfigResponse]])
async def get_configs(db: AsyncSession = Depends(get_db), admin: dict = Depends(get_admin_user)):
    result = await db.execute(select(SystemConfig))
    configs = result.scalars().all()
    return ApiResponse(data=[
        ConfigResponse(
            key=c.key,
            value=c.value,
            description=c.description,
            is_active=c.is_active
        ) for c in configs
    ])

@router.post("/", response_model=ApiResponse[ConfigResponse])
async def update_config(req: ConfigUpdate, db: AsyncSession = Depends(get_db), admin: dict = Depends(get_admin_user)):
    result = await db.execute(select(SystemConfig).where(SystemConfig.key == req.key))
    config = result.scalar_one_or_none()
    
    if config:
        config.value = req.value
        config.description = req.description
        config.is_active = req.is_active
    else:
        config = SystemConfig(
            key=req.key,
            value=req.value,
            description=req.description,
            is_active=req.is_active
        )
        db.add(config)
    
    await db.commit()
    return ApiResponse(data=ConfigResponse(
        key=config.key,
        value=config.value,
        description=config.description,
        is_active=config.is_active
    ))
