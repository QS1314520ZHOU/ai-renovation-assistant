from uuid import UUID
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.common import ApiResponse
from app.services.quote_service import QuoteService

router = APIRouter()

@router.post("/upload", response_model=ApiResponse)
async def upload_quote(
    project_id: str = Form(...),
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = QuoteService(db)
    result = await service.upload_and_parse(UUID(project_id), file)
    return ApiResponse(data=result)

@router.post("/check-text", response_model=ApiResponse)
async def check_quote_text(
    body: dict,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = QuoteService(db)
    result = await service.check_from_text(
        project_id=body.get("project_id"),
        text=body["text"],
    )
    return ApiResponse(data=result)

@router.get("/{quote_id}/report", response_model=ApiResponse)
async def get_risk_report(
    quote_id: UUID,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = QuoteService(db)
    report = await service.get_report(quote_id)
    return ApiResponse(data=report)
