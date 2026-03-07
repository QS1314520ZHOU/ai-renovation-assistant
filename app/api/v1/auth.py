from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.schemas.common import ApiResponse
from app.utils.security import hash_password, verify_password, create_access_token
from app.utils.exceptions import BadRequestError

router = APIRouter()

@router.post("/register", response_model=ApiResponse[TokenResponse])
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.phone == req.phone))
    if existing.scalar_one_or_none():
        raise BadRequestError("该手机号已注册")

    user = User(
        phone=req.phone,
        password_hash=hash_password(req.password),
        nickname=req.nickname or f"用户{req.phone[-4:]}",
    )
    db.add(user)
    await db.flush()

    token = create_access_token({"user_id": str(user.id), "role": user.role})
    return ApiResponse(data=TokenResponse(
        access_token=token,
        user_id=str(user.id),
        nickname=user.nickname,
        role=user.role,
    ))

@router.post("/login", response_model=ApiResponse[TokenResponse])
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.phone == req.phone))
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.password_hash):
        raise BadRequestError("手机号或密码错误")

    token = create_access_token({"user_id": str(user.id), "role": user.role})
    return ApiResponse(data=TokenResponse(
        access_token=token,
        user_id=str(user.id),
        nickname=user.nickname,
        role=user.role,
    ))
