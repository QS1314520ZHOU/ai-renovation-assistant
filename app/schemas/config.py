from pydantic import BaseModel

class ConfigUpdate(BaseModel):
    key: str
    value: dict
    description: str | None = None
    is_active: bool = True

class ConfigResponse(BaseModel):
    key: str
    value: dict
    description: str | None = None
    is_active: bool
