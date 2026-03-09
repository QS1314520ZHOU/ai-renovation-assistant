import asyncio
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.config import settings
from app.database import AsyncSessionLocal
from app.services.price_sync_service import PriceSyncService

logger = logging.getLogger(__name__)


SYNC_CITIES = [
    "510100",  # 成都
    "110100",  # 北京
    "310100",  # 上海
    "440100",  # 广州
    "440300",  # 深圳
    "330100",  # 杭州
    "420100",  # 武汉
    "500100",  # 重庆
]

scheduler = AsyncIOScheduler()


async def _run_sync_for_city(city_code: str) -> None:
    async with AsyncSessionLocal() as db:
        try:
            service = PriceSyncService(db)
            result = await service.run_full_sync(city_code)
            await db.commit()
            logger.info("scheduled full sync city=%s result=%s", city_code, result)
        except Exception as exc:
            await db.rollback()
            logger.error("scheduled full sync failed city=%s error=%s", city_code, exc)


async def scheduled_full_sync() -> None:
    logger.info("scheduled_full_sync started")
    for city_code in SYNC_CITIES:
        await _run_sync_for_city(city_code)
        await asyncio.sleep(5)
    logger.info("scheduled_full_sync completed")


async def scheduled_user_data_sync() -> None:
    async with AsyncSessionLocal() as db:
        try:
            service = PriceSyncService(db)
            count = await service.sync_from_user_quotes(months=3)
            for city_code in SYNC_CITIES:
                await service.aggregate_and_suggest(city_code)
            await db.commit()
            logger.info("scheduled_user_data_sync completed count=%s", count)
        except Exception as exc:
            await db.rollback()
            logger.error("scheduled_user_data_sync failed error=%s", exc)


def setup_scheduler() -> None:
    if not settings.PRICE_SYNC_ENABLED:
        logger.info("price sync scheduler disabled by PRICE_SYNC_ENABLED")
        return

    if scheduler.running:
        logger.info("price sync scheduler already running")
        return

    scheduler.add_job(
        scheduled_full_sync,
        CronTrigger(day="1,15", hour=3, minute=0),
        id="price_full_sync",
        replace_existing=True,
    )
    scheduler.add_job(
        scheduled_user_data_sync,
        CronTrigger(day_of_week="sun", hour=5, minute=0),
        id="user_data_feedback",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("price sync scheduler started")


def shutdown_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("price sync scheduler stopped")
