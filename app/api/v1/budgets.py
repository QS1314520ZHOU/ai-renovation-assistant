from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.budget import BudgetCalcRequest, BudgetResultOut
from app.schemas.common import ApiResponse
from app.services.budget_engine import BudgetEngineService

router = APIRouter()

@router.post("/calculate", response_model=ApiResponse[BudgetResultOut])
async def calculate_budget(
    req: BudgetCalcRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    engine = BudgetEngineService(db)
    result = await engine.calculate(req, user["user_id"])
    return ApiResponse(data=result)

@router.get("/{project_id}/schemes", response_model=ApiResponse)
async def get_budget_schemes(
    project_id: UUID,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    engine = BudgetEngineService(db)
    schemes = await engine.get_schemes(project_id)
    return ApiResponse(data=schemes)

@router.put("/items/{item_id}", response_model=ApiResponse)
async def update_budget_item(
    item_id: UUID,
    update: dict,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    engine = BudgetEngineService(db)
    result = await engine.update_item(item_id, update)
    return ApiResponse(data=result)
