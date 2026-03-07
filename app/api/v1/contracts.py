import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

from app.api.deps import get_db, get_current_user
from app.services.contract_service import ContractService

router = APIRouter()

@router.post("/upload")
async def upload_contract(
    project_id: uuid.UUID = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    service = ContractService(db)
    result = await service.upload_and_parse(project_id, file)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return {"message": "success", "data": result}

@router.post("/text")
async def check_contract_text(
    project_id: uuid.UUID = Body(...),
    text: str = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    service = ContractService(db)
    result = await service.check_from_text(project_id, text)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return {"message": "success", "data": result}

@router.get("/report/{report_id}", response_model=Dict[str, Any])
async def get_contract_report(
    report_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    service = ContractService(db)
    report = await service.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    return {
        "message": "success",
        "data": {
            "id": report.id,
            "contract_id": report.contract_id,
            "project_id": report.project_id,
            "overall_score": report.overall_score,
            "risk_count_high": report.risk_count_high,
            "risk_count_medium": report.risk_count_medium,
            "risk_count_low": report.risk_count_low,
            "risks": report.risks_json,
            "payment_terms": report.payment_terms_json,
            "recommendations": report.recommendations_json,
            "ai_summary": report.ai_summary,
            "created_at": report.created_at
        }
    }
