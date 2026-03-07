from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.utils.security import decode_token
from app.utils.exceptions import UnauthorizedError

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedError()
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    if not payload or "user_id" not in payload:
        raise UnauthorizedError()
    return payload

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise UnauthorizedError("仅管理员有权执行此操作")
    return current_user
