import json
import secrets
from typing import Any

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    DATABASE_URL_SYNC: str = ''

    REDIS_URL: str = 'redis://localhost:6379/0'
    REDIS_ENABLED: bool = True

    JWT_SECRET: str = Field(default_factory=lambda: secrets.token_urlsafe(48))
    JWT_ALGORITHM: str = 'HS256'
    JWT_EXPIRE_MINUTES: int = 1440

    CORS_ALLOW_ORIGINS: list[str] = Field(
        default_factory=lambda: ['http://localhost:5173', 'http://127.0.0.1:5173']
    )
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list[str] = Field(default_factory=lambda: ['*'])
    CORS_ALLOW_HEADERS: list[str] = Field(default_factory=lambda: ['*'])

    AI_BASE_URL: str = 'https://api.deepseek.com/v1'
    AI_API_KEY: str = ''
    AI_MODEL: str = 'deepseek-chat'
    AI_FALLBACK_MODELS: list[str] = Field(default_factory=list)
    AI_MAX_HISTORY_MESSAGES: int = 20
    AI_MAX_CONTEXT_TOKENS: int = 6000
    AI_CONTEXT_CACHE_TTL_SECONDS: int = 21600
    AI_STREAM_CHUNK_CHARS: int = 48

    DESIGN_PROVIDER: str = 'mock'
    STABILITY_API_BASE: str = 'https://api.stability.ai'
    STABILITY_API_KEY: str = ''
    STABILITY_IMAGE_TO_IMAGE_ENDPOINT: str = ''
    DESIGN_VERTICAL_PROVIDER_URL: str = ''
    DESIGN_VERTICAL_PROVIDER_KEY: str = ''
    ZJTCN_API_TOKEN: str = ''
    PRICE_SYNC_ENABLED: bool = True
    PRICE_DEVIATION_THRESHOLD: float = 0.15

    APP_NAME: str = 'AI装修预算助手'
    DEBUG: bool = True
    EXPOSE_TRACEBACK: bool = False

    @field_validator(
        'CORS_ALLOW_ORIGINS',
        'CORS_ALLOW_METHODS',
        'CORS_ALLOW_HEADERS',
        'AI_FALLBACK_MODELS',
        mode='before',
    )
    @classmethod
    def normalize_str_list(cls, value: Any) -> list[str]:
        if value is None:
            return []

        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]

        if isinstance(value, str):
            text = value.strip()
            if not text:
                return []
            if text.startswith('['):
                try:
                    parsed = json.loads(text)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed if str(item).strip()]
                except json.JSONDecodeError:
                    pass
            return [item.strip() for item in text.split(',') if item.strip()]

        return [str(value).strip()]

    @field_validator('DEBUG', mode='before')
    @classmethod
    def normalize_debug(cls, value):
        if isinstance(value, bool):
            return value
        if value is None:
            return True
        text = str(value).strip().lower()
        if text in {'1', 'true', 'yes', 'on', 'debug', 'development', 'dev'}:
            return True
        if text in {'0', 'false', 'no', 'off', 'release', 'production', 'prod'}:
            return False
        return True

    @model_validator(mode='after')
    def validate_security(self) -> 'Settings':
        weak_secrets = {'changeme', 'change_me', 'default', 'secret', 'your-secret'}
        jwt_secret = (self.JWT_SECRET or '').strip()
        if not jwt_secret or jwt_secret.lower() in weak_secrets:
            if self.DEBUG:
                self.JWT_SECRET = secrets.token_urlsafe(48)
            else:
                raise ValueError('JWT_SECRET is missing or too weak in non-debug mode')

        if not self.DEBUG and '*' in self.CORS_ALLOW_ORIGINS:
            raise ValueError("CORS_ALLOW_ORIGINS cannot include '*' when DEBUG=False")

        return self

    model_config = SettingsConfigDict(env_file='.env', extra='ignore')


settings = Settings()
