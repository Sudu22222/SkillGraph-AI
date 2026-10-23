from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import Skill, UserSkillEvidence, User, SkillPrerequisite
from app.schemas.skill import SkillOut, UserSkillEvidenceOut, SkillEvidenceUpdate, PrerequisiteItem, LearningResourceOut
from app.services.auth_service import get_current_user, get_optional_user

router = APIRouter(prefix="/skills", tags=["Skills & Evidence"])

@router.get("/", response_model=List[SkillOut])
def list_skills(db: Session = Depends(get_db)):
    skills = db.query(Skill).all()
    result = []
    for s in skills:
        aliases = [a.alias for a in s.aliases]
        prereqs = [
            PrerequisiteItem(
                skill_id=p.prerequisite_skill_id,
                skill_name=p.prerequisite_skill.name,
                skill_slug=p.prerequisite_skill.slug,
                relationship_type=p.relationship_type
            )
            for p in s.prerequisites
        ]
        dependents = [
            PrerequisiteItem(
                skill_id=d.skill_id,
                skill_name=d.skill.name,
                skill_slug=d.skill.slug,
                relationship_type=d.relationship_type
            )
            for d in s.dependents
        ]
        resources = [
            LearningResourceOut.model_validate(r) for r in s.learning_resources
        ]

        result.append(SkillOut(
            id=s.id,
            name=s.name,
            slug=s.slug,
            category=s.category,
            description=s.description,
            difficulty_level=s.difficulty_level,
            is_core=s.is_core,
            aliases=aliases,
            prerequisites=prereqs,
            dependents=dependents,
            learning_resources=resources
        ))

    return result

@router.get("/evidence", response_model=List[UserSkillEvidenceOut])
def get_user_skill_evidence(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns all skills with the student's demonstrated, developing,
    missing, or unassessed status, including prerequisite-ready calculations.
    """
    skills = db.query(Skill).all()
    user_evidence = {
        ev.skill_id: ev for ev in db.query(UserSkillEvidence).filter(
            UserSkillEvidence.user_id == current_user.id
        ).all()
    }

    all_prereqs = db.query(SkillPrerequisite).all()
    skills_map = {s.id: s for s in skills}

    result = []
    for s in skills:
        ev = user_evidence.get(s.id)
        status = ev.status if ev else "unassessed"
        score = ev.proficiency_score if ev else 0.0
        ev_type = ev.evidence_type if ev else "unassessed"
        summary = ev.evidence_summary if ev else ""
        verified_at = ev.verified_at if ev else None
        updated_at = ev.updated_at if ev else s.created_at

        # Calculate prerequisite readiness
        # All mandatory prerequisites must be demonstrated
        s_prereqs = [p for p in all_prereqs if p.skill_id == s.id and p.relationship_type == "mandatory"]
        is_ready = True
        missing_prereqs = []
        for p in s_prereqs:
            p_ev = user_evidence.get(p.prerequisite_skill_id)
            if not p_ev or (p_ev.status != "demonstrated" and p_ev.proficiency_score < 70.0):
                is_ready = False
                p_skill = skills_map.get(p.prerequisite_skill_id)
                if p_skill:
                    missing_prereqs.append(p_skill.name)

        result.append(UserSkillEvidenceOut(
            id=ev.id if ev else 0,
            skill_id=s.id,
            skill_name=s.name,
            skill_slug=s.slug,
            category=s.category,
            difficulty_level=s.difficulty_level,
            status=status,
            proficiency_score=score,
            evidence_type=ev_type,
            evidence_summary=summary,
            verified_at=verified_at,
            updated_at=updated_at,
            is_prerequisite_ready=is_ready,
            missing_prerequisites=missing_prereqs
        ))

    return result

@router.put("/evidence/{skill_id}", response_model=UserSkillEvidenceOut)
def update_skill_evidence(
    skill_id: int,
    data: SkillEvidenceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    evidence = db.query(UserSkillEvidence).filter(
        UserSkillEvidence.user_id == current_user.id,
        UserSkillEvidence.skill_id == skill_id
    ).first()

    if evidence:
        evidence.status = data.status
        evidence.proficiency_score = data.proficiency_score
        evidence.evidence_type = data.evidence_type
        evidence.evidence_summary = data.evidence_summary
    else:
        evidence = UserSkillEvidence(
            user_id=current_user.id,
            skill_id=skill_id,
            status=data.status,
            proficiency_score=data.proficiency_score,
            evidence_type=data.evidence_type,
            evidence_summary=data.evidence_summary
        )
        db.add(evidence)

    db.commit()
    db.refresh(evidence)

    return UserSkillEvidenceOut(
        id=evidence.id,
        skill_id=skill.id,
        skill_name=skill.name,
        skill_slug=skill.slug,
        category=skill.category,
        difficulty_level=skill.difficulty_level,
        status=evidence.status,
        proficiency_score=evidence.proficiency_score,
        evidence_type=evidence.evidence_type,
        evidence_summary=evidence.evidence_summary,
        verified_at=evidence.verified_at,
        updated_at=evidence.updated_at,
        is_prerequisite_ready=True,
        missing_prerequisites=[]
    )
