from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class RoleSkillRequirementOut(BaseModel):
    id: int
    skill_id: int
    skill_name: str
    skill_slug: str
    category: str
    difficulty_level: str
    importance_level: str  # mandatory, recommended, optional
    required_proficiency: str  # beginner, intermediate, advanced
    weight: float
    user_status: Optional[str] = "unassessed"
    user_proficiency: Optional[float] = 0.0

    class Config:
        from_attributes = True

class CareerRoleOut(BaseModel):
    id: int
    title: str
    slug: str
    category: str
    description: str
    created_at: datetime
    skills: List[RoleSkillRequirementOut] = []
    total_skills_count: int = 0
    mandatory_skills_count: int = 0

    class Config:
        from_attributes = True

class RoleGapSummary(BaseModel):
    role_id: int
    role_title: str
    role_category: str
    match_percentage: float
    demonstrated_count: int
    developing_count: int
    missing_count: int
    unassessed_count: int
    total_required_skills: int
    skills_breakdown: List[RoleSkillRequirementOut]
