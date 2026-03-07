from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.database import get_db
from app.models.glossary import GlossaryTerm
from app.schemas.common import ApiResponse

router = APIRouter()

@router.get("/", response_model=ApiResponse)
async def list_glossary(
    keyword: str = Query("", max_length=50),
    category: str = Query("", max_length=30),
    db: AsyncSession = Depends(get_db),
):
    query = select(GlossaryTerm).where(GlossaryTerm.is_active == True)

    if keyword:
        query = query.where(
            or_(
                GlossaryTerm.term.ilike(f"%{keyword}%"),
                GlossaryTerm.definition.ilike(f"%{keyword}%"),
            )
        )
    if category:
        query = query.where(GlossaryTerm.category == category)

    query = query.order_by(GlossaryTerm.sort_order)
    result = await db.execute(query)
    terms = result.scalars().all()
    return ApiResponse(data=[{
        "id": str(t.id),
        "term": t.term,
        "category": t.category,
        "definition": t.definition,
        "purpose": t.purpose,
        "risk": t.risk,
        "common_pitfall": t.common_pitfall,
        "verify_method": t.verify_method,
        "tags": t.tags_json,
    } for t in terms])
