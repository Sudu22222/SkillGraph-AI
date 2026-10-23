from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import CareerRole, RoleSkillRequirement, UserSkillEvidence, User
from app.schemas.role import CareerRoleOut, RoleGapSummary, RoleSkillRequirementOut
from app.services.auth_service import get_optional_user

router = APIRouter(prefix="/roles", tags=["Career Roles"])

@router.get("/", response_model=List[CareerRoleOut])
def get_career_roles(
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    roles = db.query(CareerRole).all()
    user_evidence = {}
    if current_user:
        for ev in db.query(UserSkillEvidence).filter(UserSkillEvidence.user_id == current_user.id).all():
            user_evidence[ev.skill_id] = ev

    result = []
    for role in roles:
        skills_out = []
        for req in role.role_skills:
            ev = user_evidence.get(req.skill_id)
            status = ev.status if ev else "unassessed"
            score = ev.proficiency_score if ev else 0.0

            skills_out.append(RoleSkillRequirementOut(
                id=req.id,
                skill_id=req.skill_id,
                skill_name=req.skill.name,
                skill_slug=req.skill.slug,
                category=req.skill.category,
                difficulty_level=req.skill.difficulty_level,
                importance_level=req.importance_level,
                required_proficiency=req.required_proficiency,
                weight=req.weight,
                user_status=status,
                user_proficiency=score
            ))

        result.append(CareerRoleOut(
            id=role.id,
            title=role.title,
            slug=role.slug,
            category=role.category,
            description=role.description,
            created_at=role.created_at,
            skills=skills_out,
            total_skills_count=len(skills_out),
            mandatory_skills_count=sum(1 for s in skills_out if s.importance_level == "mandatory")
        ))

    return result

@router.get("/{role_id}", response_model=CareerRoleOut)
def get_career_role(
    role_id: int,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    role = db.query(CareerRole).filter(CareerRole.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Career role not found")

    user_evidence = {}
    if current_user:
        for ev in db.query(UserSkillEvidence).filter(UserSkillEvidence.user_id == current_user.id).all():
            user_evidence[ev.skill_id] = ev

    skills_out = []
    for req in role.role_skills:
        ev = user_evidence.get(req.skill_id)
        status = ev.status if ev else "unassessed"
        score = ev.proficiency_score if ev else 0.0

        skills_out.append(RoleSkillRequirementOut(
            id=req.id,
            skill_id=req.skill_id,
            skill_name=req.skill.name,
            skill_slug=req.skill.slug,
            category=req.skill.category,
            difficulty_level=req.skill.difficulty_level,
            importance_level=req.importance_level,
            required_proficiency=req.required_proficiency,
            weight=req.weight,
            user_status=status,
            user_proficiency=score
        ))

    return CareerRoleOut(
        id=role.id,
        title=role.title,
        slug=role.slug,
        category=role.category,
        description=role.description,
        created_at=role.created_at,
        skills=skills_out,
        total_skills_count=len(skills_out),
        mandatory_skills_count=sum(1 for s in skills_out if s.importance_level == "mandatory")
    )

@router.get("/{role_id}/gap-analysis", response_model=RoleGapSummary)
def get_role_gap_analysis(
    role_id: int,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    role = db.query(CareerRole).filter(CareerRole.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Career role not found")

    user_evidence = {}
    if current_user:
        for ev in db.query(UserSkillEvidence).filter(UserSkillEvidence.user_id == current_user.id).all():
            user_evidence[ev.skill_id] = ev

    demonstrated_count = 0
    developing_count = 0
    missing_count = 0
    unassessed_count = 0

    skills_breakdown = []
    for req in role.role_skills:
        ev = user_evidence.get(req.skill_id)
        status = ev.status if ev else "unassessed"
        score = ev.proficiency_score if ev else 0.0

        if status == "demonstrated" or score >= 70.0:
            demonstrated_count += 1
        elif status == "developing":
            developing_count += 1
        elif status == "missing":
            missing_count += 1
        else:
            unassessed_count += 1

        skills_breakdown.append(RoleSkillRequirementOut(
            id=req.id,
            skill_id=req.skill_id,
            skill_name=req.skill.name,
            skill_slug=req.skill.slug,
            category=req.skill.category,
            difficulty_level=req.skill.difficulty_level,
            importance_level=req.importance_level,
            required_proficiency=req.required_proficiency,
            weight=req.weight,
            user_status=status,
            user_proficiency=score
        ))

    total = len(skills_breakdown)
    match_pct = round((demonstrated_count / total * 100), 1) if total > 0 else 0.0

    return RoleGapSummary(
        role_id=role.id,
        role_title=role.title,
        role_category=role.category,
        match_percentage=match_pct,
        demonstrated_count=demonstrated_count,
        developing_count=developing_count,
        missing_count=missing_count,
        unassessed_count=unassessed_count,
        total_required_skills=total,
        skills_breakdown=skills_breakdown
    )
