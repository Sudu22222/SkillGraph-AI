from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class LearningResourceOut(BaseModel):
    id: int
    title: str
    url: str
    resource_type: str
    provider: str
    estimated_mins: int
    difficulty: str
    rationale: str

    class Config:
        from_attributes = True

class PrerequisiteItem(BaseModel):
    skill_id: int
    skill_name: str
    skill_slug: str
    relationship_type: str

class SkillOut(BaseModel):
    id: int
    name: str
    slug: str
    category: str
    description: str
    difficulty_level: str
    is_core: bool
    aliases: List[str] = []
    prerequisites: List[PrerequisiteItem] = []
    dependents: List[PrerequisiteItem] = []
    learning_resources: List[LearningResourceOut] = []

    class Config:
        from_attributes = True

class UserSkillEvidenceOut(BaseModel):
    id: int
    skill_id: int
    skill_name: str
    skill_slug: str
    category: str
    difficulty_level: str
    status: str  # unassessed, missing, developing, demonstrated
    proficiency_score: float
    evidence_type: str  # assessment, project, resume_mention, self_reported
    evidence_summary: str
    verified_at: Optional[datetime] = None
    updated_at: datetime
    is_prerequisite_ready: bool = False
    missing_prerequisites: List[str] = []

    class Config:
        from_attributes = True

class SkillEvidenceUpdate(BaseModel):
    status: str
    proficiency_score: float = 0.0
    evidence_type: str = "self_reported"
    evidence_summary: str = ""
