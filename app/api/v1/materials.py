import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

from app.api.deps import get_db, get_current_user
from app.services.material_service import MaterialRecommendationService

router = APIRouter()

@router.get("/recommendation", response_model=Dict[str, Any])
async def get_material_recommendation(
    project_id: uuid.UUID = Query(...),
    item_id: uuid.UUID = Query(...),
    total_budget: float = Query(100000.0),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get AI-generated material recommendations and buying tips for a specific budget item.
    """
    service = MaterialRecommendationService(db)
    result = await service.get_recommendation(project_id, item_id, total_budget)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return {
        "message": "success",
        "data": result
    }
