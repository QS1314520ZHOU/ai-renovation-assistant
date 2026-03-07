import uuid
from pydantic import BaseModel

class AIChatRequest(BaseModel):
    session_id: uuid.UUID | None = None
    project_id: uuid.UUID | None = None
    message: str
    session_type: str = "consult"

class AIChatResponse(BaseModel):
    session_id: uuid.UUID
    reply: str
    extracted_fields: dict | None = None
    is_complete: bool = False
    missing_fields: list[str] = []
