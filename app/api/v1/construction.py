from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.dependencies import get_current_user
from app.models.construction import (
    ConstructionPhaseRecord, ConstructionLog as LogModel,
    PaymentRecord as PayModel, ChecklistRecord, PurchaseRecord,
)
from app.schemas.construction import PhaseUpdate, LogCreate, PaymentCreate, ChecklistToggle
from app.schemas.common import ApiResponse

router = APIRouter()

@router.get("/{project_id}/phases", response_model=ApiResponse)
async def get_phases(project_id: UUID, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ConstructionPhaseRecord)
        .where(ConstructionPhaseRecord.project_id == project_id)
        .order_by(ConstructionPhaseRecord.sort_order)
    )
    return ApiResponse(data=[row.__dict__ for row in result.scalars().all()])

@router.put("/{project_id}/phases", response_model=ApiResponse)
async def update_phase(project_id: UUID, req: PhaseUpdate, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ConstructionPhaseRecord)
        .where(ConstructionPhaseRecord.project_id == project_id)
        .where(ConstructionPhaseRecord.phase == req.phase)
    )
    record = result.scalar_one_or_none()
    if record:
        record.status = req.status
        record.start_date = req.start_date
        record.end_date = req.end_date
        record.notes = req.notes
    else:
        db.add(ConstructionPhaseRecord(project_id=project_id, **req.model_dump()))
    await db.flush()
    return ApiResponse(message="更新成功")

@router.post("/{project_id}/logs", response_model=ApiResponse)
async def add_log(project_id: UUID, req: LogCreate, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    log = LogModel(project_id=project_id, phase=req.phase, log_date=req.log_date, title=req.title, content=req.content, photos_json=req.photos)
    db.add(log)
    await db.flush()
    return ApiResponse(message="已记录")

@router.get("/{project_id}/logs", response_model=ApiResponse)
async def list_logs(project_id: UUID, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(LogModel).where(LogModel.project_id == project_id).order_by(LogModel.log_date.desc())
    )
    return ApiResponse(data=[row.__dict__ for row in result.scalars().all()])

@router.post("/{project_id}/payments", response_model=ApiResponse)
async def add_payment(project_id: UUID, req: PaymentCreate, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    payment = PayModel(project_id=project_id, **req.model_dump())
    db.add(payment)
    await db.flush()
    return ApiResponse(message="已记录")

@router.get("/{project_id}/payments", response_model=ApiResponse)
async def list_payments(project_id: UUID, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PayModel).where(PayModel.project_id == project_id).order_by(PayModel.payment_date.desc())
    )
    return ApiResponse(data=[row.__dict__ for row in result.scalars().all()])

@router.put("/{project_id}/checklists", response_model=ApiResponse)
async def toggle_checklist(project_id: UUID, req: ChecklistToggle, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ChecklistRecord).where(ChecklistRecord.id == req.checklist_id))
    record = result.scalar_one_or_none()
    if record:
        record.is_checked = req.is_checked
        record.note = req.note
    await db.flush()
    return ApiResponse(message="已更新")
