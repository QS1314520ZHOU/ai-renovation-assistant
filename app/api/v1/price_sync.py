from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_admin_user
from app.models.price_snapshot import PriceAdjustmentSuggestion, PriceSnapshot
from app.schemas.common import ApiResponse
from app.services.price_sync_service import (
    AI_ESTIMATED_SOURCES,
    SOURCE_LABELS,
    PriceSyncService,
)

router = APIRouter()


@router.post("/trigger", response_model=ApiResponse[dict])
async def trigger_sync(
    city_code: str = Query(default="510100", description="城市代码"),
    _admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    service = PriceSyncService(db)
    result = await service.run_full_sync(city_code=city_code)
    return ApiResponse(data=result, message=f"{city_code} 同步完成")


@router.get("/snapshots", response_model=ApiResponse[list[dict]])
async def list_snapshots(
    city_code: str = Query(default="510100"),
    source: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    _admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(PriceSnapshot).where(PriceSnapshot.city_code == city_code)
    if source:
        query = query.where(PriceSnapshot.source == source)
    query = query.order_by(PriceSnapshot.snapshot_date.desc()).limit(limit)

    rows = await db.execute(query)
    snapshots = rows.scalars().all()
    return ApiResponse(
        data=[
            {
                "id": str(item.id),
                "source": item.source,
                "source_label": SOURCE_LABELS.get(item.source, item.source),
                "is_ai_estimated": item.source in AI_ESTIMATED_SOURCES,
                "standard_item_code": item.standard_item_code,
                "raw_material_name": item.raw_material_name,
                "raw_price": float(item.raw_price),
                "raw_unit": item.raw_unit,
                "price_type": item.price_type,
                "snapshot_date": str(item.snapshot_date),
            }
            for item in snapshots
        ]
    )


@router.get("/snapshots/stats", response_model=ApiResponse[list[dict]])
async def snapshot_stats(
    city_code: str = Query(default="510100"),
    _admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    rows = await db.execute(
        select(
            PriceSnapshot.source,
            func.count(PriceSnapshot.id).label("count"),
            func.max(PriceSnapshot.snapshot_date).label("latest"),
        )
        .where(PriceSnapshot.city_code == city_code)
        .group_by(PriceSnapshot.source)
    )
    stats = [
        {
            "source": row.source,
            "source_label": SOURCE_LABELS.get(row.source, row.source),
            "is_ai_estimated": row.source in AI_ESTIMATED_SOURCES,
            "count": int(row.count),
            "latest": str(row.latest),
        }
        for row in rows.all()
    ]
    return ApiResponse(data=stats)


@router.get("/suggestions", response_model=ApiResponse[list[dict]])
async def list_suggestions(
    city_code: str = Query(default="510100"),
    status: str = Query(default="pending"),
    _admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    rows = await db.execute(
        select(PriceAdjustmentSuggestion)
        .where(PriceAdjustmentSuggestion.city_code == city_code)
        .where(PriceAdjustmentSuggestion.status == status)
        .order_by(func.abs(PriceAdjustmentSuggestion.deviation_pct).desc())
    )
    suggestions = rows.scalars().all()
    return ApiResponse(
        data=[
            {
                "id": str(item.id),
                "standard_item_code": item.standard_item_code,
                "tier": item.tier,
                "current_material": float(item.current_material_price or 0),
                "current_labor": float(item.current_labor_price or 0),
                "suggested_material": float(item.suggested_material_price or 0),
                "suggested_labor": float(item.suggested_labor_price or 0),
                "deviation_pct": float(item.deviation_pct or 0),
                "sample_count": int(item.sample_count or 0),
                "sources": item.sources_json,
            }
            for item in suggestions
        ]
    )


@router.post("/suggestions/{suggestion_id}/approve", response_model=ApiResponse[dict])
async def approve_suggestion(
    suggestion_id: UUID,
    admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    service = PriceSyncService(db)
    result = await service.apply_suggestion(suggestion_id, UUID(str(admin["user_id"])))
    if result.get("error"):
        return ApiResponse(code=400, message=result["error"])
    return ApiResponse(data=result, message="审批通过并已应用")


@router.post("/suggestions/{suggestion_id}/reject", response_model=ApiResponse[dict])
async def reject_suggestion(
    suggestion_id: UUID,
    admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    row = await db.execute(
        select(PriceAdjustmentSuggestion).where(PriceAdjustmentSuggestion.id == suggestion_id)
    )
    suggestion = row.scalar_one_or_none()
    if not suggestion:
        return ApiResponse(code=404, message="建议不存在")
    if suggestion.status != "pending":
        return ApiResponse(code=400, message="该建议已处理")

    suggestion.status = "rejected"
    suggestion.reviewed_by = UUID(str(admin["user_id"]))
    suggestion.reviewed_at = datetime.now(timezone.utc)
    return ApiResponse(data={"id": str(suggestion_id)}, message="已驳回")


@router.post("/suggestions/batch-approve", response_model=ApiResponse[dict])
async def batch_approve(
    city_code: str = Query(default="510100"),
    admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    rows = await db.execute(
        select(PriceAdjustmentSuggestion)
        .where(PriceAdjustmentSuggestion.city_code == city_code)
        .where(PriceAdjustmentSuggestion.status == "pending")
    )
    service = PriceSyncService(db)
    applied = 0
    failed = 0
    reviewer_id = UUID(str(admin["user_id"]))

    for suggestion in rows.scalars().all():
        result = await service.apply_suggestion(suggestion.id, reviewer_id)
        if result.get("error"):
            failed += 1
        else:
            applied += 1

    return ApiResponse(data={"applied": applied, "failed": failed})
