import asyncio
import sys
import os

# 确保能找到 app 包
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.user import User

async def promote_user(phone: str):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.phone == phone))
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"❌ 未找到手机号为 {phone} 的用户")
            return
        
        user.role = "admin"
        await db.commit()
        print(f"✅ 用户 {user.nickname} ({phone}) 已成功提升为管理员")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("使用方法: python scripts/promote_admin.py <手机号>")
    else:
        asyncio.run(promote_user(sys.argv[1]))
