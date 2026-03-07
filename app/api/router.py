from fastapi import APIRouter
from app.api.v1 import auth, projects, houses, budgets, ai, construction, glossary, quotes

api_router = APIRouter()

api_router.include_router(auth.router,         prefix="/v1/auth",         tags=["认证"])
api_router.include_router(projects.router,     prefix="/v1/projects",     tags=["项目"])
api_router.include_router(houses.router,       prefix="/v1/houses",       tags=["房屋"])
api_router.include_router(budgets.router,      prefix="/v1/budgets",      tags=["预算"])
api_router.include_router(ai.router,           prefix="/v1/ai",           tags=["AI问诊"])
api_router.include_router(construction.router, prefix="/v1/construction", tags=["施工管理"])
api_router.include_router(glossary.router,     prefix="/v1/glossary",     tags=["装修词典"])
api_router.include_router(quotes.router,       prefix="/v1/quotes",       tags=["报价体检"])
api_router.include_router(config.router,       prefix="/v1/config",       tags=["系统配置"])
