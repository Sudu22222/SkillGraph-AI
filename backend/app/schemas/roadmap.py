from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.schemas.skill import LearningResourceOut

class RoadmapTaskOut(BaseModel):
    id: int
    roadmap_id: int
    skill_id: int
    skill_name: str
    skill_slug: str
    category: str
    difficulty_level: str
    title: str
    description: str
    learning_objective: str
    estimated_hours: float
    status: str  # not_started, in_progress, submitted, completed
    task_order: int
    practical_exercise: str
    assessment_criteria: str
    resources: List[LearningResourceOut] = []
    is_prerequisite_satisfied: bool = True
    missing_prerequisites: List[str] = []
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class RoadmapOut(BaseModel):
    id: int
    user_id: int
    target_role_id: int
    target_role_title: str
    title: str
    status: str
    explanation: str
    total_hours: float
    completed_hours: float
    progress_percentage: float
    tasks: List[RoadmapTaskOut] = []
    generated_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TaskStatusUpdate(BaseModel):
    status: str  # not_started, in_progress, completed

class RoadmapReorderRequest(BaseModel):
    task_ids: List[int]

class AuditEventOut(BaseModel):
    id: int
    event_type: str
    reason: str
    details: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True
