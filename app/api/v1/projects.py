from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.dependencies import get_current_user
from app.models.project import RenovationProject
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectOut
from app.schemas.common import ApiResponse
from app.utils.exceptions import NotFoundError

router = APIRouter()

@router.get("/", response_model=ApiResponse[list[ProjectOut]])
async def list_projects(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RenovationProject)
        .where(RenovationProject.user_id == user["user_id"])
        .where(RenovationProject.is_deleted == False)
        .order_by(RenovationProject.created_at.desc())
    )
    projects = result.scalars().all()
    return ApiResponse(data=[ProjectOut.model_validate(p) for p in projects])

@router.post("/", response_model=ApiResponse[ProjectOut])
async def create_project(
    req: ProjectCreate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = RenovationProject(
        user_id=user["user_id"],
        name=req.name,
        city_code=req.city_code,
        city_name=req.city_name,
        target_budget=req.target_budget,
        start_date=req.start_date,
        move_in_date=req.move_in_date,
    )
    db.add(project)
    await db.flush()
    return ApiResponse(data=ProjectOut.model_validate(project))

@router.get("/{project_id}", response_model=ApiResponse[ProjectOut])
async def get_project(
    project_id: UUID,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RenovationProject)
        .where(RenovationProject.id == project_id)
        .where(RenovationProject.user_id == user["user_id"])
    )
    project = result.scalar_one_or_none()
    if not project:
        raise NotFoundError("项目不存在")
    return ApiResponse(data=ProjectOut.model_validate(project))

@router.put("/{project_id}", response_model=ApiResponse[ProjectOut])
async def update_project(
    project_id: UUID,
    req: ProjectUpdate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RenovationProject)
        .where(RenovationProject.id == project_id)
        .where(RenovationProject.user_id == user["user_id"])
    )
    project = result.scalar_one_or_none()
    if not project:
        raise NotFoundError("项目不存在")

    for field, value in req.model_dump(exclude_unset=True).items():
        setattr(project, field, value)

    await db.flush()
    return ApiResponse(data=ProjectOut.model_validate(project))

@router.delete("/{project_id}", response_model=ApiResponse)
async def delete_project(
    project_id: UUID,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RenovationProject)
        .where(RenovationProject.id == project_id)
        .where(RenovationProject.user_id == user["user_id"])
    )
    project = result.scalar_one_or_none()
    if not project:
        raise NotFoundError("项目不存在")

    project.is_deleted = True
    await db.flush()
    return ApiResponse(message="已删除")
