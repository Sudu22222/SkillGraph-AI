from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class QuestionOption(BaseModel):
    id: str
    text: str

class QuestionItem(BaseModel):
    id: str
    question: str
    question_type: str  # multiple_choice, short_answer, code_task
    options: Optional[List[QuestionOption]] = None
    points: int = 10
    rubric: Optional[Dict[str, Any]] = None  # for short answer/code

class AssessmentOut(BaseModel):
    id: int
    title: str
    skill_id: int
    skill_name: str
    role_id: Optional[int] = None
    difficulty: str
    assessment_type: str
    time_limit_mins: int
    passing_score: int
    questions: List[QuestionItem]
    created_at: datetime

    class Config:
        from_attributes = True

class AssessmentSubmission(BaseModel):
    assessment_id: int
    answers: Dict[str, Any]  # question_id -> selected_option_id or text string

class RubricItemScore(BaseModel):
    criterion: str
    score: float
    max_score: float
    feedback: str

class QuestionEvaluation(BaseModel):
    question_id: str
    is_correct: bool
    score: float
    max_score: float
    explanation: str
    rubric_scores: Optional[List[RubricItemScore]] = None

class AssessmentResultOut(BaseModel):
    attempt_id: int
    assessment_id: int
    skill_id: int
    skill_name: str
    score: float
    max_score: float
    percentage: float
    passed: bool
    evaluations: List[QuestionEvaluation]
    feedback_summary: str
    previous_status: str
    new_status: str
    new_proficiency_score: float
    roadmap_updated: bool
    explanation: str
    completed_at: datetime

class AssessmentAttemptOut(BaseModel):
    id: int
    assessment_id: int
    assessment_title: str
    skill_id: int
    skill_name: str
    score: float
    max_score: float
    percentage: float
    passed: bool
    completed_at: datetime

    class Config:
        from_attributes = True
