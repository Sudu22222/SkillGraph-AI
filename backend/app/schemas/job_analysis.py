from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class ExtractedSkillItem(BaseModel):
    raw_mention: str
    normalized_skill_id: Optional[int] = None
    normalized_skill_name: Optional[str] = None
    category: str
    evidence_type: str  # 'resume_mention', 'project_evidence', 'coursework_mention', 'job_requirement'
    evidence_snippet: str
    confidence: float  # 0.0 to 1.0
    suggested_status: str  # 'unassessed', 'missing', 'developing', 'demonstrated'
    requires_assessment: bool = True
    user_confirmed: bool = False

class JobAnalysisRequest(BaseModel):
    title: str = "Job Role Analysis"
    company: Optional[str] = ""
    raw_text: str
    target_role_id: Optional[int] = None
    analysis_type: str = "job_description"  # 'job_description' or 'resume'

class JobSkillComparison(BaseModel):
    skill_id: int
    skill_name: str
    category: str
    importance_level: str  # mandatory, recommended, optional
    user_status: str  # demonstrated, developing, missing, unassessed
    user_proficiency: float
    gap_status: str  # 'matched', 'needs_practice', 'missing_competency', 'unassessed_claim'
    evidence_type: str
    evidence_snippet: Optional[str] = None
    recommendation: str

class JobAnalysisResultOut(BaseModel):
    id: Optional[int] = None
    title: str
    company: str
    analysis_type: str
    summary: str
    extracted_skills: List[ExtractedSkillItem] = []
    comparisons: List[JobSkillComparison] = []
    matched_skills_count: int
    developing_skills_count: int
    missing_skills_count: int
    unassessed_mentions_count: int
    overall_match_percentage: float
    is_simulated_ai: bool = False
    ai_model_used: str

class ApplySkillEvidenceItem(BaseModel):
    skill_id: int
    status: str  # 'unassessed', 'missing', 'developing', 'demonstrated'
    evidence_type: str  # 'resume_mention', 'project', 'assessment', 'self_reported'
    evidence_summary: str

class ApplyExtractedSkillsRequest(BaseModel):
    skills: List[ApplySkillEvidenceItem]
