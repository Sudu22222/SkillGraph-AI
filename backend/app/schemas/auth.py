from pydantic import BaseModel, EmailStr
from typing import Optional

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    education_level: Optional[str] = "Undergraduate"
    target_role_id: Optional[int] = None
    weekly_study_hours: Optional[int] = 10
    learning_style: Optional[str] = "hands_on"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
