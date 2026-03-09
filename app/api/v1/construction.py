from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.construction import (
    ChecklistRecord,
    ConstructionLog as LogModel,
    ConstructionPhaseRecord,
    PaymentRecord as PayModel,
    PurchaseRecord,
)
from app.models.project import RenovationProject
from app.schemas.common import ApiResponse
from app.schemas.construction import (
    ChecklistToggle,
    ConstructionBootstrapRequest,
    LogCreate,
    PaymentCreate,
    PhaseUpdate,
    PurchaseUpdate,
)
from app.utils.exceptions import NotFoundError

router = APIRouter()


def _to_float(value):
    if value is None:
        return None
    if isinstance(value, Decimal):
        return float(value)
    try:
        return float(value)
    except Exception:
        return None


def _serialize_phase(row: ConstructionPhaseRecord) -> dict:
    return {
        "id": str(row.id),
        "project_id": str(row.project_id),
        "phase": row.phase,
        "status": row.status,
        "start_date": str(row.start_date) if row.start_date else None,
        "end_date": str(row.end_date) if row.end_date else None,
        "notes": row.notes,
        "sort_order": row.sort_order,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def _serialize_log(row: LogModel) -> dict:
    return {
        "id": str(row.id),
        "project_id": str(row.project_id),
        "phase": row.phase,
        "log_date": str(row.log_date),
        "title": row.title,
        "content": row.content,
        "photos": row.photos_json or [],
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def _serialize_payment(row: PayModel) -> dict:
    return {
        "id": str(row.id),
        "project_id": str(row.project_id),
        "phase": row.phase,
        "payment_type": row.payment_type,
        "amount": _to_float(row.amount) or 0,
        "payee": row.payee,
        "payment_date": str(row.payment_date),
        "note": row.note,
        "receipt_url": row.receipt_url,
        "is_addon": bool(row.is_addon),
        "addon_reason": row.addon_reason,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def _serialize_checklist(row: ChecklistRecord) -> dict:
    return {
        "id": str(row.id),
        "project_id": str(row.project_id),
        "phase": row.phase,
        "category": row.group_name,
        "content": row.content,
        "is_checked": bool(row.is_checked),
        "note": row.note,
        "photo_url": row.photo_url,
        "sort_order": row.sort_order,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def _serialize_purchase(row: PurchaseRecord) -> dict:
    return {
        "id": str(row.id),
        "project_id": str(row.project_id),
        "phase": row.phase,
        "name": row.name,
        "category": row.category,
        "estimated_price": _to_float(row.estimated_price),
        "actual_price": _to_float(row.actual_price),
        "is_purchased": bool(row.is_purchased),
        "need_measure": bool(row.need_measure),
        "deadline": str(row.deadline) if row.deadline else None,
        "note": row.note,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


async def _ensure_project_owner(project_id: UUID, user_id: UUID, db: AsyncSession) -> None:
    result = await db.execute(
        select(RenovationProject.id)
        .where(RenovationProject.id == project_id)
        .where(RenovationProject.user_id == user_id)
        .where(RenovationProject.is_deleted == False)
    )
    if not result.scalar_one_or_none():
        raise NotFoundError("项目不存在")


@router.post("/{project_id}/bootstrap", response_model=ApiResponse[dict])
async def bootstrap_construction(
    project_id: UUID,
    req: ConstructionBootstrapRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _ensure_project_owner(project_id, UUID(str(user["user_id"])), db)

    phase_rows = await db.execute(
        select(ConstructionPhaseRecord).where(ConstructionPhaseRecord.project_id == project_id)
    )
    phase_map = {row.phase: row for row in phase_rows.scalars().all()}

    checklist_rows = await db.execute(
        select(ChecklistRecord).where(ChecklistRecord.project_id == project_id)
    )
    checklist_map = {(row.phase, row.content): row for row in checklist_rows.scalars().all()}

    purchase_rows = await db.execute(
        select(PurchaseRecord).where(PurchaseRecord.project_id == project_id)
    )
    purchase_map = {(row.phase, row.name): row for row in purchase_rows.scalars().all()}

    created_phases = 0
    created_checklists = 0
    created_purchases = 0

    for item in req.phases:
        row = phase_map.get(item.phase)
        if row:
            row.sort_order = item.sort_order
            if row.status == "pending" and item.status != "pending":
                row.status = item.status
            continue

        phase_row = ConstructionPhaseRecord(
            project_id=project_id,
            phase=item.phase,
            status=item.status,
            start_date=item.start_date,
            end_date=item.end_date,
            notes=item.notes,
            sort_order=item.sort_order,
        )
        db.add(phase_row)
        created_phases += 1

    for item in req.checklists:
        key = (item.phase, item.content)
        row = checklist_map.get(key)
        if row:
            row.sort_order = item.sort_order
            if not row.group_name:
                row.group_name = item.category
            continue

        checklist_row = ChecklistRecord(
            project_id=project_id,
            phase=item.phase,
            group_name=item.category,
            content=item.content,
            sort_order=item.sort_order,
        )
        db.add(checklist_row)
        created_checklists += 1

    for item in req.purchases:
        key = (item.phase, item.name)
        row = purchase_map.get(key)
        if row:
            if row.estimated_price is None and item.estimated_price is not None:
                row.estimated_price = item.estimated_price
            row.need_measure = bool(item.need_measure)
            if item.note and not row.note:
                row.note = item.note
            continue

        purchase_row = PurchaseRecord(
            project_id=project_id,
            phase=item.phase,
            name=item.name,
            category=item.category,
            estimated_price=item.estimated_price,
            need_measure=item.need_measure,
            note=item.note,
        )
        db.add(purchase_row)
        created_purchases += 1

    await db.flush()

    fresh_phase_rows = await db.execute(
        select(ConstructionPhaseRecord)
        .where(ConstructionPhaseRecord.project_id == project_id)
        .order_by(ConstructionPhaseRecord.sort_order, ConstructionPhaseRecord.created_at)
    )
    fresh_checklist_rows = await db.execute(
        select(ChecklistRecord)
        .where(ChecklistRecord.project_id == project_id)
        .order_by(ChecklistRecord.phase, ChecklistRecord.sort_order, ChecklistRecord.created_at)
    )
    fresh_purchase_rows = await db.execute(
        select(PurchaseRecord)
        .where(PurchaseRecord.project_id == project_id)
        .order_by(PurchaseRecord.phase, PurchaseRecord.created_at)
    )

    return ApiResponse(
        data={
            "created": {
                "phases": created_phases,
                "checklists": created_checklists,
                "purchases": created_purchases,
            },
            "phases": [_serialize_phase(row) for row in fresh_phase_rows.scalars().all()],
            "checklists": [_serialize_checklist(row) for row in fresh_checklist_rows.scalars().all()],
            "purchases": [_serialize_purchase(row) for row in fresh_purchase_rows.scalars().all()],
        }
    )


@router.get("/{project_id}/phases", response_model=ApiResponse[list[dict]])
async def get_phases(
    project_id: UUID,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _ensure_project_owner(project_id, UUID(str(user["user_id"])), db)
    result = await db.execute(
        select(ConstructionPhaseRecord)
        .where(ConstructionPhaseRecord.project_id == project_id)
        .order_by(ConstructionPhaseRecord.sort_order, ConstructionPhaseRecord.created_at)
    )
    return ApiResponse(data=[_serialize_phase(row) for row in result.scalars().all()])


@router.put("/{project_id}/phases", response_model=ApiResponse[dict])
async def update_phase(
    project_id: UUID,
    req: PhaseUpdate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _ensure_project_owner(project_id, UUID(str(user["user_id"])), db)
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
        record = ConstructionPhaseRecord(project_id=project_id, **req.model_dump())
        db.add(record)
    await db.flush()
    return ApiResponse(message="更新成功", data=_serialize_phase(record))


@router.post("/{project_id}/logs", response_model=ApiResponse[dict])
async def add_log(
    project_id: UUID,
    req: LogCreate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _ensure_project_owner(project_id, UUID(str(user["user_id"])), db)
    log = LogModel(
        project_id=project_id,
        phase=req.phase,
        log_date=req.log_date,
        title=req.title,
        content=req.content,
        photos_json=req.photos,
    )
    db.add(log)
    await db.flush()
    return ApiResponse(message="已记录", data=_serialize_log(log))


@router.get("/{project_id}/logs", response_model=ApiResponse[list[dict]])
async def list_logs(
    project_id: UUID,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _ensure_project_owner(project_id, UUID(str(user["user_id"])), db)
    result = await db.execute(
        select(LogModel)
        .where(LogModel.project_id == project_id)
        .order_by(LogModel.log_date.desc(), LogModel.created_at.desc())
    )
    return ApiResponse(data=[_serialize_log(row) for row in result.scalars().all()])


@router.post("/{project_id}/payments", response_model=ApiResponse[dict])
async def add_payment(
    project_id: UUID,
    req: PaymentCreate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _ensure_project_owner(project_id, UUID(str(user["user_id"])), db)
    payment = PayModel(project_id=project_id, **req.model_dump())
    db.add(payment)
    await db.flush()
    return ApiResponse(message="已记录", data=_serialize_payment(payment))


@router.get("/{project_id}/payments", response_model=ApiResponse[list[dict]])
async def list_payments(
    project_id: UUID,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _ensure_project_owner(project_id, UUID(str(user["user_id"])), db)
    result = await db.execute(
        select(PayModel)
        .where(PayModel.project_id == project_id)
        .order_by(PayModel.payment_date.desc(), PayModel.created_at.desc())
    )
    return ApiResponse(data=[_serialize_payment(row) for row in result.scalars().all()])


@router.get("/{project_id}/checklists", response_model=ApiResponse[list[dict]])
async def list_checklists(
    project_id: UUID,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _ensure_project_owner(project_id, UUID(str(user["user_id"])), db)
    result = await db.execute(
        select(ChecklistRecord)
        .where(ChecklistRecord.project_id == project_id)
        .order_by(ChecklistRecord.phase, ChecklistRecord.sort_order, ChecklistRecord.created_at)
    )
    return ApiResponse(data=[_serialize_checklist(row) for row in result.scalars().all()])


@router.put("/{project_id}/checklists", response_model=ApiResponse[dict])
async def toggle_checklist(
    project_id: UUID,
    req: ChecklistToggle,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _ensure_project_owner(project_id, UUID(str(user["user_id"])), db)
    result = await db.execute(
        select(ChecklistRecord)
        .where(ChecklistRecord.id == req.checklist_id)
        .where(ChecklistRecord.project_id == project_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise NotFoundError("验收项不存在")

    record.is_checked = req.is_checked
    if req.note is not None:
        record.note = req.note
    if req.photo_url is not None:
        record.photo_url = req.photo_url

    await db.flush()
    return ApiResponse(message="已更新", data=_serialize_checklist(record))


@router.get("/{project_id}/purchases", response_model=ApiResponse[list[dict]])
async def list_purchases(
    project_id: UUID,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _ensure_project_owner(project_id, UUID(str(user["user_id"])), db)
    result = await db.execute(
        select(PurchaseRecord)
        .where(PurchaseRecord.project_id == project_id)
        .order_by(PurchaseRecord.phase, PurchaseRecord.created_at)
    )
    return ApiResponse(data=[_serialize_purchase(row) for row in result.scalars().all()])


@router.put("/{project_id}/purchases", response_model=ApiResponse[dict])
async def update_purchase(
    project_id: UUID,
    req: PurchaseUpdate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _ensure_project_owner(project_id, UUID(str(user["user_id"])), db)
    result = await db.execute(
        select(PurchaseRecord)
        .where(PurchaseRecord.id == req.purchase_id)
        .where(PurchaseRecord.project_id == project_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise NotFoundError("采购项不存在")

    if req.is_purchased is not None:
        record.is_purchased = req.is_purchased
    if req.actual_price is not None:
        record.actual_price = req.actual_price
    if req.note is not None:
        record.note = req.note

    await db.flush()
    return ApiResponse(message="已更新", data=_serialize_purchase(record))
