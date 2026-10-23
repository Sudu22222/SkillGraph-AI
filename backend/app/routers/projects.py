from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import ProjectSubmission, UserSkillEvidence, User, Skill, RoadmapTask
from app.schemas.project import ProjectSubmissionCreate, ProjectSubmissionOut, ProjectReviewRequest
from app.services.auth_service import get_current_user
from app.services.gemini_service import gemini_service

router = APIRouter(prefix="/projects", tags=["Project Portfolio & Rubrics"])

@router.get("/", response_model=List[ProjectSubmissionOut])
def list_submissions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    submissions = db.query(ProjectSubmission).filter(
        ProjectSubmission.user_id == current_user.id
    ).order_by(ProjectSubmission.submitted_at.desc()).all()

    return [
        ProjectSubmissionOut(
            id=sub.id,
            user_id=sub.user_id,
            roadmap_task_id=sub.roadmap_task_id,
            skill_id=sub.skill_id,
            skill_name=sub.skill.name if sub.skill else "Skill",
            title=sub.title,
            description=sub.description,
            repo_url=sub.repo_url,
            text_submission=sub.text_submission,
            rubric_score=sub.rubric_score,
            feedback=sub.feedback or {},
            status=sub.status,
            submitted_at=sub.submitted_at,
            reviewed_at=sub.reviewed_at
        )
        for sub in submissions
    ]

@router.post("/", response_model=ProjectSubmissionOut)
def create_project_submission(
    payload: ProjectSubmissionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    skill = db.query(Skill).filter(Skill.id == payload.skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    # Evaluate project submission with transparent rubric
    rubric = {
        "criteria": [
            {"name": "Architecture & Clean Code", "max_points": 35, "description": "Modularity, separation of concerns, and idiomatic patterns"},
            {"name": "Practical Competency Demonstration", "max_points": 40, "description": "Fulfills core functional requirements and edge cases"},
            {"name": "Documentation & Verification Evidence", "max_points": 25, "description": "Clear setup guide, tests, or working repository link"}
        ]
    }

    eval_result = gemini_service.evaluate_short_answer(
        question=f"Evaluate practical project submission for {skill.name}: {payload.title}. Description: {payload.description}",
        user_answer=f"Submission details: {payload.text_submission}. Repo: {payload.repo_url}",
        expected_explanation=f"A complete, well-tested project demonstrating practical competency in {skill.name}.",
        rubric=rubric
    )

    # Scale score to 100
    score = eval_result.get("score", 75.0)
    # Check if repo_url provided
    if payload.repo_url and payload.repo_url.strip().startswith("http"):
        score = min(100.0, score + 10.0)

    feedback = {
        "summary": eval_result.get("feedback", "Project evaluated against transparent technical rubric."),
        "rubric_scores": eval_result.get("rubric_scores", []),
        "passed": score >= 70.0
    }

    submission = ProjectSubmission(
        user_id=current_user.id,
        roadmap_task_id=payload.roadmap_task_id,
        skill_id=payload.skill_id,
        title=payload.title,
        description=payload.description,
        repo_url=payload.repo_url or "",
        text_submission=payload.text_submission,
        rubric_score=score,
        feedback=feedback,
        status="reviewed",
        submitted_at=datetime.utcnow(),
        reviewed_at=datetime.utcnow()
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    return ProjectSubmissionOut(
        id=submission.id,
        user_id=submission.user_id,
        roadmap_task_id=submission.roadmap_task_id,
        skill_id=submission.skill_id,
        skill_name=skill.name,
        title=submission.title,
        description=submission.description,
        repo_url=submission.repo_url,
        text_submission=submission.text_submission,
        rubric_score=submission.rubric_score,
        feedback=submission.feedback or {},
        status=submission.status,
        submitted_at=submission.submitted_at,
        reviewed_at=submission.reviewed_at
    )

@router.post("/confirm-competency")
def confirm_project_competency(
    payload: ProjectReviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    User explicitly confirms AI rubric review before updating their demonstrated competency.
    Prompt requirement: 'require user confirmation before updating competency based on AI feedback.'
    """
    sub = db.query(ProjectSubmission).filter(
        ProjectSubmission.id == payload.submission_id,
        ProjectSubmission.user_id == current_user.id
    ).first()

    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    if not payload.confirm_update_competency:
        return {"success": False, "message": "Confirmation was not provided."}

    sub.status = "verified"

    # Update UserSkillEvidence
    evidence = db.query(UserSkillEvidence).filter(
        UserSkillEvidence.user_id == current_user.id,
        UserSkillEvidence.skill_id == sub.skill_id
    ).first()

    score = sub.rubric_score or 75.0
    status = "demonstrated" if score >= 70.0 else "developing"

    if evidence:
        evidence.status = status
        evidence.proficiency_score = score
        evidence.evidence_type = "project"
        evidence.evidence_summary = f"Verified via project '{sub.title}' (Rubric score: {score}%)."
        evidence.verified_at = datetime.utcnow()
    else:
        evidence = UserSkillEvidence(
            user_id=current_user.id,
            skill_id=sub.skill_id,
            status=status,
            proficiency_score=score,
            evidence_type="project",
            evidence_summary=f"Verified via project '{sub.title}' (Rubric score: {score}%).",
            verified_at=datetime.utcnow()
        )
        db.add(evidence)

    # If linked to roadmap task, mark completed
    if sub.roadmap_task_id:
        task = db.query(RoadmapTask).filter(RoadmapTask.id == sub.roadmap_task_id).first()
        if task and status == "demonstrated":
            task.status = "completed"
            task.completed_at = datetime.utcnow()

    db.commit()

    return {
        "success": True,
        "new_status": status,
        "message": f"Successfully verified competency for {sub.skill.name} based on project rubric review."
    }
