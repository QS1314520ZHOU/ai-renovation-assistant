import json
import logging
from typing import Any

import redis.asyncio as redis
from redis.exceptions import RedisError

from app.config import settings

logger = logging.getLogger(__name__)


class RedisService:
    _client: redis.Redis | None = None
    _disabled: bool = False

    @classmethod
    async def get_client(cls) -> redis.Redis | None:
        if not settings.REDIS_ENABLED or cls._disabled:
            return None

        if cls._client is None:
            try:
                cls._client = redis.from_url(
                    settings.REDIS_URL,
                    encoding='utf-8',
                    decode_responses=True,
                    socket_connect_timeout=2,
                    socket_timeout=2,
                    health_check_interval=30,
                )
            except Exception as exc:
                logger.warning('Redis initialization failed: %s', exc)
                cls._disabled = True
                return None
        return cls._client

    @classmethod
    async def ping(cls) -> bool:
        client = await cls.get_client()
        if not client:
            return False
        try:
            await client.ping()
            return True
        except RedisError as exc:
            logger.warning('Redis ping failed: %s', exc)
            return False

    @classmethod
    async def close(cls) -> None:
        if cls._client is None:
            return
        try:
            await cls._client.aclose()
        except Exception as exc:
            logger.warning('Redis close failed: %s', exc)
        finally:
            cls._client = None

    @classmethod
    async def get_json(cls, key: str) -> Any:
        client = await cls.get_client()
        if not client:
            return None
        try:
            raw = await client.get(key)
            if not raw:
                return None
            return json.loads(raw)
        except (RedisError, json.JSONDecodeError) as exc:
            logger.warning('Redis get_json failed key=%s err=%s', key, exc)
            return None

    @classmethod
    async def set_json(cls, key: str, value: Any, ttl_seconds: int | None = None) -> bool:
        client = await cls.get_client()
        if not client:
            return False
        try:
            payload = json.dumps(value, ensure_ascii=False)
            if ttl_seconds:
                await client.set(key, payload, ex=ttl_seconds)
            else:
                await client.set(key, payload)
            return True
        except (RedisError, TypeError) as exc:
            logger.warning('Redis set_json failed key=%s err=%s', key, exc)
            return False

    @classmethod
    async def delete(cls, key: str) -> None:
        client = await cls.get_client()
        if not client:
            return
        try:
            await client.delete(key)
        except RedisError as exc:
            logger.warning('Redis delete failed key=%s err=%s', key, exc)
