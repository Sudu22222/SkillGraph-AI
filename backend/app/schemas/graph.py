from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class GraphNode(BaseModel):
    id: str  # skill id as string
    skill_id: int
    label: str
    slug: str
    category: str
    difficulty: str
    status: str  # unassessed, missing, developing, demonstrated
    proficiency_score: float
    is_prerequisite_ready: bool
    evidence_type: str
    is_role_required: bool
    role_importance: Optional[str] = None  # mandatory, recommended, optional
    position: Dict[str, float]  # {x: 100, y: 200}

class GraphEdge(BaseModel):
    id: str
    source: str  # prerequisite skill id
    target: str  # dependent skill id
    relationship_type: str  # mandatory, recommended
    is_satisfied: bool

class SkillGraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    cycle_detected: bool
    cycles: List[List[str]] = []
    topological_order: List[str] = []
    total_skills: int
    demonstrated_count: int
    developing_count: int
    missing_count: int
    unassessed_count: int
    ready_to_learn_count: int
