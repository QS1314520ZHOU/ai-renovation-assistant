from pydantic import BaseModel

class RegisterRequest(BaseModel):
    phone: str
    password: str
    nickname: str | None = None

class LoginRequest(BaseModel):
    phone: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    nickname: str | None = None
    role: str | None = None
