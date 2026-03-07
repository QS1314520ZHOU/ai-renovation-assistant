from typing import Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from openai import AsyncOpenAI
from app.models.config import SystemConfig
from app.config import settings

class AIClientFactory:
    """
    Shared factory to initialize AI clients with dynamic configurations.
    Priority: Admin Database Config (SystemConfig['ai_config']) > Environment Settings
    """
    @classmethod
    async def get_client(cls, db: AsyncSession) -> AsyncOpenAI:
        cfg_dict = await cls.get_config(db)
        return AsyncOpenAI(
            base_url=cfg_dict["base_url"],
            api_key=cfg_dict["api_key"]
        )

    @classmethod
    async def get_config(cls, db: AsyncSession) -> Dict[str, str]:
        """Fetch active AI configuration from SystemConfig table."""
        result = await db.execute(
            select(SystemConfig).where(SystemConfig.key == "ai_config", SystemConfig.is_active == True)
        )
        record = result.scalar_one_or_none()
        
        if record and record.value:
            # Expected structure: { "activeModelId": "...", "aiModels": [...] }
            val = record.value
            active_id = val.get("activeModelId")
            models = val.get("aiModels", [])
            active_model = next((m for m in models if m["id"] == active_id), None) if active_id else (models[0] if models else None)
            
            if active_model:
                return {
                    "base_url": active_model.get("baseUrl"),
                    "api_key": active_model.get("apiKey"),
                    "model": active_model.get("models")[0] if active_model.get("models") else settings.AI_MODEL
                }
        
        # Fallback to settings
        return {
            "base_url": settings.AI_BASE_URL,
            "api_key": settings.AI_API_KEY,
            "model": settings.AI_MODEL
        }
