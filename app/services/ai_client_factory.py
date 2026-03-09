from typing import Any, Dict
from urllib.parse import urlsplit, urlunsplit

from openai import AsyncOpenAI
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.config import SystemConfig


class AIClientFactory:
    """
    Shared factory to initialize AI clients with dynamic configurations.
    Priority: Admin Database Config (SystemConfig['ai_config']) > Environment Settings
    """

    @classmethod
    async def get_client(cls, db: AsyncSession) -> AsyncOpenAI:
        candidates = await cls.get_model_candidates(db)
        return cls.build_client(candidates[0])

    @classmethod
    async def get_config(cls, db: AsyncSession) -> Dict[str, Any]:
        """Fetch active AI configuration with fallback models."""
        candidates = await cls.get_model_candidates(db)
        primary = candidates[0]
        return {
            "base_url": primary["base_url"],
            "api_key": primary["api_key"],
            "model": primary["model"],
            "fallback_models": [item["model"] for item in candidates[1:]],
        }

    @classmethod
    async def get_model_candidates(cls, db: AsyncSession) -> list[Dict[str, str]]:
        """
        Return ordered model candidates for failover.
        First candidate is the primary model.
        """
        result = await db.execute(
            select(SystemConfig).where(SystemConfig.key == "ai_config", SystemConfig.is_active == True)
        )
        record = result.scalar_one_or_none()

        candidates: list[Dict[str, str]] = []
        if record and record.value:
            candidates = cls._resolve_model_candidates(record.value)

        if not candidates:
            env_models = [settings.AI_MODEL] + list(settings.AI_FALLBACK_MODELS or [])
            for model in env_models:
                normalized_model = cls._clean_str(model)
                if not normalized_model:
                    continue
                candidates.append(
                    {
                        "base_url": cls._normalize_base_url(settings.AI_BASE_URL),
                        "api_key": settings.AI_API_KEY,
                        "model": normalized_model,
                    }
                )

        deduped: list[Dict[str, str]] = []
        seen: set[tuple[str, str, str]] = set()
        for item in candidates:
            marker = (item["base_url"], item["model"], item["api_key"] or "")
            if marker in seen:
                continue
            seen.add(marker)
            deduped.append(item)

        if deduped:
            return deduped

        return [
            {
                "base_url": cls._normalize_base_url(settings.AI_BASE_URL),
                "api_key": settings.AI_API_KEY,
                "model": settings.AI_MODEL,
            }
        ]

    @classmethod
    def build_client(cls, config: Dict[str, str]) -> AsyncOpenAI:
        return AsyncOpenAI(
            base_url=config["base_url"],
            api_key=config["api_key"],
        )

    @staticmethod
    def _pick(data: Dict[str, Any], *keys: str) -> Any:
        for key in keys:
            if key in data and data[key] is not None:
                return data[key]
        return None

    @staticmethod
    def _clean_str(value: Any) -> str | None:
        if value is None:
            return None
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value

    @staticmethod
    def _normalize_base_url(base_url: str) -> str:
        parts = urlsplit(base_url.strip())
        path = parts.path.rstrip('/')

        if path.endswith('/chat/completions'):
            path = path[: -len('/chat/completions')]

        return urlunsplit((parts.scheme, parts.netloc, path, parts.query, parts.fragment))

    @classmethod
    def _resolve_model_candidates(cls, value: Dict[str, Any]) -> list[Dict[str, str]]:
        active_id = cls._pick(value, "activeModelId", "active_model_id")
        ai_models = cls._pick(value, "aiModels", "ai_models") or []
        if not isinstance(ai_models, list):
            return []

        enabled_models = [model for model in ai_models if isinstance(model, dict) and cls._pick(model, "enabled") is not False]
        candidate_models = enabled_models or [model for model in ai_models if isinstance(model, dict)]
        if not candidate_models:
            return []

        sorted_models = sorted(candidate_models, key=lambda model: cls._pick(model, "priority") or 999)
        if active_id:
            sorted_models = sorted(
                sorted_models,
                key=lambda model: 0 if cls._pick(model, "id") == active_id else 1,
            )

        candidates: list[Dict[str, str]] = []
        for model_cfg in sorted_models:
            base_url = cls._clean_str(cls._pick(model_cfg, "baseUrl", "base_url")) or settings.AI_BASE_URL
            if not base_url:
                continue
            api_key = cls._clean_str(cls._pick(model_cfg, "apiKey", "api_key")) or settings.AI_API_KEY
            model_names = [
                cls._clean_str(item)
                for item in (cls._pick(model_cfg, "models") or [])
                if cls._clean_str(item)
            ]
            if not model_names:
                model_names = [settings.AI_MODEL]

            for model_name in model_names:
                if not model_name:
                    continue
                candidates.append(
                    {
                        "base_url": cls._normalize_base_url(base_url),
                        "api_key": api_key,
                        "model": model_name,
                    }
                )

        return candidates
