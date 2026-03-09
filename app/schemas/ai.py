import uuid
from pydantic import BaseModel, Field

class AIChatRequest(BaseModel):
    session_id: uuid.UUID | None = None
    project_id: uuid.UUID | None = None
    message: str
    session_type: str = "auto"
    stream: bool = False

class AIChatResponse(BaseModel):
    session_id: uuid.UUID
    session_type: str
    reply: str
    extracted_fields: dict | None = None
    is_complete: bool = False
    missing_fields: list[str] = Field(default_factory=list)
    model_used: str | None = None
    fallback_used: bool = False
