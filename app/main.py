from contextlib import asynccontextmanager
import logging
import traceback

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.config import settings
from app.services.redis_service import RedisService
from app.tasks.price_sync_scheduler import setup_scheduler, shutdown_scheduler


def _setup_logging() -> None:
    level = logging.DEBUG if settings.DEBUG else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )


_setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting service: %s", settings.APP_NAME)
    redis_ok = await RedisService.ping()
    if redis_ok:
        logger.info("Redis connected")
    else:
        logger.warning("Redis unavailable, falling back to database-only context storage")

    try:
        setup_scheduler()
    except Exception as exc:
        logger.error("Failed to setup scheduler: %s", exc)

    try:
        yield
    finally:
        try:
            shutdown_scheduler()
        except Exception as exc:
            logger.error("Failed to shutdown scheduler: %s", exc)
        await RedisService.close()
        logger.info("Service stopped")


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOW_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)

app.include_router(api_router, prefix="/api")
app.mount("/static", StaticFiles(directory="app/static", check_dir=False), name="static")


@app.get("/health")
async def health():
    return {"status": "ok", "service": settings.APP_NAME}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error at %s %s: %s", request.method, request.url.path, exc)

    message = "服务器内部错误，请稍后重试"
    detail = None
    if settings.DEBUG:
        detail = {"error": str(exc), "type": exc.__class__.__name__}
    if settings.DEBUG and settings.EXPOSE_TRACEBACK:
        detail = {
            "error": str(exc),
            "type": exc.__class__.__name__,
            "traceback": traceback.format_exc(),
        }

    return JSONResponse(
        status_code=500,
        content={"code": 500, "message": message, "detail": detail},
    )
