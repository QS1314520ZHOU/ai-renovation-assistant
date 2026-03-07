from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.ai import AIChatRequest, AIChatResponse
from app.schemas.common import ApiResponse
from app.services.ai_service import AIService
from app.services.upload_service import save_upload_file

router = APIRouter()

@router.post("/chat", response_model=ApiResponse[AIChatResponse])
async def ai_chat(
    req: AIChatRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AIService(db)
    result = await service.chat(req, user["user_id"])
    return ApiResponse(data=result)

@router.get("/sessions/{session_id}/messages", response_model=ApiResponse)
async def get_session_messages(
    session_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AIService(db)
    messages = await service.get_messages(session_id)
    return ApiResponse(data=messages)

@router.post("/upload", response_model=ApiResponse)
async def upload_file(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    url = save_upload_file(file)
    return ApiResponse(data={"url": url})

@router.post("/inspect", response_model=ApiResponse)
async def inspect_site(
    phase: str = Form(...),
    items: str = Form(...),
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AIService(db)
    result = await service.inspect_photo(phase, items, file)
    return ApiResponse(data={"reply": result})
