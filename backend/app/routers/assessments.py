from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import Assessment, AssessmentAttempt, User, Skill
from app.schemas.assessment import (
    AssessmentOut,
    AssessmentSubmission,
    AssessmentResultOut,
    AssessmentAttemptOut,
    QuestionItem,
    QuestionOption
)
from app.services.auth_service import get_current_user, get_optional_user
from app.services.assessment_engine import AssessmentEngine
from app.services.gemini_service import gemini_service

router = APIRouter(prefix="/assessments", tags=["Skill Assessments"])

@router.get("/", response_model=List[AssessmentOut])
def list_assessments(
    skill_id: Optional[int] = Query(None),
    role_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Assessment)
    if skill_id:
        query = query.filter(Assessment.skill_id == skill_id)
    if role_id:
        query = query.filter(Assessment.role_id == role_id)

    assessments = query.all()
    result = []
    for a in assessments:
        questions = []
        for q in (a.questions_data or []):
            options = None
            if q.get("options"):
                options = [QuestionOption(id=opt["id"], text=opt["text"]) for opt in q["options"]]
            questions.append(QuestionItem(
                id=q.get("id"),
                question=q.get("question"),
                question_type=q.get("question_type", "multiple_choice"),
                options=options,
                points=q.get("points", 25),
                rubric=q.get("rubric")
            ))

        result.append(AssessmentOut(
            id=a.id,
            title=a.title,
            skill_id=a.skill_id,
            skill_name=a.skill.name if a.skill else "Skill",
            role_id=a.role_id,
            difficulty=a.difficulty,
            assessment_type=a.assessment_type,
            time_limit_mins=a.time_limit_mins,
            passing_score=a.passing_score,
            questions=questions,
            created_at=a.created_at
        ))

    return result

@router.get("/generate-for-skill/{skill_id}", response_model=AssessmentOut)
def generate_or_get_for_skill(
    skill_id: int,
    db: Session = Depends(get_db)
):
    """
    Returns an existing assessment for the skill, or on-demand generates
    a structured assessment with rubric criteria using Gemini/deterministic engine.
    """
    existing = db.query(Assessment).filter(Assessment.skill_id == skill_id).first()
    if existing:
        questions = []
        for q in (existing.questions_data or []):
            options = None
            if q.get("options"):
                options = [QuestionOption(id=opt["id"], text=opt["text"]) for opt in q["options"]]
            questions.append(QuestionItem(
                id=q.get("id"),
                question=q.get("question"),
                question_type=q.get("question_type", "multiple_choice"),
                options=options,
                points=q.get("points", 25),
                rubric=q.get("rubric")
            ))
        return AssessmentOut(
            id=existing.id,
            title=existing.title,
            skill_id=existing.skill_id,
            skill_name=existing.skill.name if existing.skill else "Skill",
            role_id=existing.role_id,
            difficulty=existing.difficulty,
            assessment_type=existing.assessment_type,
            time_limit_mins=existing.time_limit_mins,
            passing_score=existing.passing_score,
            questions=questions,
            created_at=existing.created_at
        )

    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    gen = gemini_service.generate_assessment_questions(
        skill_name=skill.name,
        category=skill.category,
        difficulty=skill.difficulty_level
    )

    assessment = Assessment(
        title=gen.get("title", f"{skill.name} Assessment"),
        skill_id=skill.id,
        difficulty=skill.difficulty_level,
        assessment_type="quiz",
        time_limit_mins=15,
        passing_score=70,
        questions_data=gen.get("questions", [])
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    questions = []
    for q in (assessment.questions_data or []):
        options = None
        if q.get("options"):
            options = [QuestionOption(id=opt["id"], text=opt["text"]) for opt in q["options"]]
        questions.append(QuestionItem(
            id=q.get("id"),
            question=q.get("question"),
            question_type=q.get("question_type", "multiple_choice"),
            options=options,
            points=q.get("points", 25),
            rubric=q.get("rubric")
        ))

    return AssessmentOut(
        id=assessment.id,
        title=assessment.title,
        skill_id=assessment.skill_id,
        skill_name=skill.name,
        role_id=assessment.role_id,
        difficulty=assessment.difficulty,
        assessment_type=assessment.assessment_type,
        time_limit_mins=assessment.time_limit_mins,
        passing_score=assessment.passing_score,
        questions=questions,
        created_at=assessment.created_at
    )

@router.get("/{assessment_id}", response_model=AssessmentOut)
def get_assessment(assessment_id: int, db: Session = Depends(get_db)):
    a = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assessment not found")

    questions = []
    for q in (a.questions_data or []):
        options = None
        if q.get("options"):
            options = [QuestionOption(id=opt["id"], text=opt["text"]) for opt in q["options"]]
        questions.append(QuestionItem(
            id=q.get("id"),
            question=q.get("question"),
            question_type=q.get("question_type", "multiple_choice"),
            options=options,
            points=q.get("points", 25),
            rubric=q.get("rubric")
        ))

    return AssessmentOut(
        id=a.id,
        title=a.title,
        skill_id=a.skill_id,
        skill_name=a.skill.name if a.skill else "Skill",
        role_id=a.role_id,
        difficulty=a.difficulty,
        assessment_type=a.assessment_type,
        time_limit_mins=a.time_limit_mins,
        passing_score=a.passing_score,
        questions=questions,
        created_at=a.created_at
    )

@router.post("/{assessment_id}/submit", response_model=AssessmentResultOut)
def submit_assessment(
    assessment_id: int,
    payload: AssessmentSubmission,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    engine = AssessmentEngine(db)
    try:
        result = engine.submit_and_evaluate(
            user_id=current_user.id,
            assessment_id=assessment_id,
            answers=payload.answers
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/attempts/history", response_model=List[AssessmentAttemptOut])
def get_attempt_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    attempts = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.user_id == current_user.id
    ).order_by(AssessmentAttempt.completed_at.desc()).all()

    return [
        AssessmentAttemptOut(
            id=att.id,
            assessment_id=att.assessment_id,
            assessment_title=att.assessment.title if att.assessment else "Assessment",
            skill_id=att.assessment.skill_id if att.assessment else 0,
            skill_name=att.assessment.skill.name if att.assessment and att.assessment.skill else "",
            score=att.score,
            max_score=att.max_score,
            percentage=att.percentage,
            passed=att.passed,
            completed_at=att.completed_at
        )
        for att in attempts
    ]
