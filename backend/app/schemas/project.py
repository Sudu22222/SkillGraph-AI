from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class ProjectSubmissionCreate(BaseModel):
    skill_id: int
    roadmap_task_id: Optional[int] = None
    title: str
    description: str
    repo_url: Optional[str] = ""
    text_submission: str

class RubricReviewItem(BaseModel):
    criterion: str
    score: float
    max_score: float
    comment: str

class ProjectSubmissionOut(BaseModel):
    id: int
    user_id: int
    roadmap_task_id: Optional[int] = None
    skill_id: int
    skill_name: str
    title: str
    description: str
    repo_url: str
    text_submission: str
    rubric_score: Optional[float] = None
    feedback: Dict[str, Any] = {}
    status: str  # draft, submitted, reviewed, verified
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ProjectReviewRequest(BaseModel):
    submission_id: int
    confirm_update_competency: bool = False
