from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import User
from app.schemas.graph import SkillGraphResponse
from app.services.auth_service import get_optional_user
from app.services.graph_engine import GraphEngine

router = APIRouter(prefix="/graph", tags=["Skill Dependency Graph"])

@router.get("/", response_model=SkillGraphResponse)
def get_skill_dependency_graph(
    role_id: Optional[int] = Query(None, description="Optional career role filter"),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Returns the interactive skill dependency graph:
    - Directed edges representing strict prerequisite order
    - Cycle detection verification
    - Accessible node positions for React Flow DAG layout
    - Per-user competency status badges and prerequisite-readiness flags
    """
    engine = GraphEngine(db)
    user_id = current_user.id if current_user else None
    
    # If no role_id explicitly given, check user's target role
    if not role_id and current_user and current_user.profile and current_user.profile.target_role_id:
        role_id = current_user.profile.target_role_id

    result = engine.get_skill_graph_for_user(user_id=user_id, role_id=role_id)
    return result
