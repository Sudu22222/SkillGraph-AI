from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import User, UserProfile, UserSkillEvidence, AssessmentAttempt, Roadmap, RoadmapTask
from app.schemas.user import UserProfileUpdate, UserProfileOut
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/users", tags=["Users & Profiles"])

@router.put("/profile", response_model=UserProfileOut)
def update_profile(
    profile_in: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = current_user.profile
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    if profile_in.education_level is not None:
        profile.education_level = profile_in.education_level
    if profile_in.interests is not None:
        profile.interests = profile_in.interests
    if profile_in.target_role_id is not None:
        profile.target_role_id = profile_in.target_role_id
    if profile_in.weekly_study_hours is not None:
        profile.weekly_study_hours = profile_in.weekly_study_hours
    if profile_in.learning_style is not None:
        profile.learning_style = profile_in.learning_style
    if profile_in.bio is not None:
        profile.bio = profile_in.bio

    db.commit()
    db.refresh(profile)
    return profile

@router.get("/stats")
def get_user_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Calculates live dashboard metrics from saved database records.
    Never hardcodes numbers!
    """
    evidence_list = db.query(UserSkillEvidence).filter(
        UserSkillEvidence.user_id == current_user.id
    ).all()

    demonstrated_count = sum(1 for e in evidence_list if e.status == "demonstrated")
    developing_count = sum(1 for e in evidence_list if e.status == "developing")
    missing_count = sum(1 for e in evidence_list if e.status == "missing")
    unassessed_count = sum(1 for e in evidence_list if e.status == "unassessed")

    # Completed assessments
    attempts = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.user_id == current_user.id
    ).all()
    completed_assessments = len(attempts)
    avg_score = round(sum(a.percentage for a in attempts) / completed_assessments, 1) if completed_assessments > 0 else 0.0

    # Roadmap progress
    active_roadmap = db.query(Roadmap).filter(
        Roadmap.user_id == current_user.id,
        Roadmap.status == "active"
    ).first()

    total_tasks = 0
    completed_tasks = 0
    total_hours = 0.0
    completed_hours = 0.0
    next_task = None

    if active_roadmap and active_roadmap.tasks:
        tasks = sorted(active_roadmap.tasks, key=lambda t: t.task_order)
        total_tasks = len(tasks)
        for t in tasks:
            total_hours += t.estimated_hours
            if t.status == "completed":
                completed_tasks += 1
                completed_hours += t.estimated_hours
            elif next_task is None and t.status in ["not_started", "in_progress"]:
                next_task = {
                    "id": t.id,
                    "title": t.title,
                    "skill_name": t.skill.name if t.skill else "",
                    "estimated_hours": t.estimated_hours,
                    "status": t.status,
                    "learning_objective": t.learning_objective
                }

    roadmap_progress = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0.0

    # Target role title
    target_role = current_user.profile.target_role if current_user.profile else None

    return {
        "target_role": {
            "id": target_role.id if target_role else None,
            "title": target_role.title if target_role else "Not Selected",
            "category": target_role.category if target_role else "",
        },
        "competencies": {
            "demonstrated": demonstrated_count,
            "developing": developing_count,
            "missing": missing_count,
            "unassessed": unassessed_count,
            "total_tracked": len(evidence_list)
        },
        "assessments": {
            "total_completed": completed_assessments,
            "average_percentage": avg_score
        },
        "roadmap": {
            "has_roadmap": active_roadmap is not None,
            "roadmap_id": active_roadmap.id if active_roadmap else None,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "total_hours": round(total_hours, 1),
            "completed_hours": round(completed_hours, 1),
            "progress_percentage": roadmap_progress,
            "next_task": next_task
        }
    }
