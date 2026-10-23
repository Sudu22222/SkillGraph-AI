from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserProfileBase(BaseModel):
    education_level: Optional[str] = "Undergraduate"
    interests: Optional[List[str]] = []
    target_role_id: Optional[int] = None
    weekly_study_hours: Optional[int] = 10
    learning_style: Optional[str] = "hands_on"
    bio: Optional[str] = ""

class UserProfileUpdate(BaseModel):
    education_level: Optional[str] = None
    interests: Optional[List[str]] = None
    target_role_id: Optional[int] = None
    weekly_study_hours: Optional[int] = None
    learning_style: Optional[str] = None
    bio: Optional[str] = None

class CareerRoleSimple(BaseModel):
    id: int
    title: str
    slug: str
    category: str

    class Config:
        from_attributes = True

class UserProfileOut(UserProfileBase):
    id: int
    user_id: int
    target_role: Optional[CareerRoleSimple] = None
    updated_at: datetime

    class Config:
        from_attributes = True

class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    profile: Optional[UserProfileOut] = None

    class Config:
        from_attributes = True
