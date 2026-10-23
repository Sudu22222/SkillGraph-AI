from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import User, UserSkillEvidence, AssessmentAttempt, CareerRole, Skill, Roadmap, RoadmapTask
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/analytics", tags=["Progress & Analytics"])

@router.get("/summary")
def get_analytics_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes before-and-after assessment comparison, skill coverage by category,
    learning hours invested, and milestone trends.
    """
    # 1. Competency breakdown by Category
    skills = db.query(Skill).all()
    evidence_map = {
        ev.skill_id: ev for ev in db.query(UserSkillEvidence).filter(
            UserSkillEvidence.user_id == current_user.id
        ).all()
    }

    category_stats = {}
    for s in skills:
        cat = s.category
        if cat not in category_stats:
            category_stats[cat] = {
                "category": cat,
                "total_skills": 0,
                "demonstrated": 0,
                "developing": 0,
                "missing": 0,
                "unassessed": 0
            }
        category_stats[cat]["total_skills"] += 1
        ev = evidence_map.get(s.id)
        status = ev.status if ev else "unassessed"
        if status == "demonstrated":
            category_stats[cat]["demonstrated"] += 1
        elif status == "developing":
            category_stats[cat]["developing"] += 1
        elif status == "missing":
            category_stats[cat]["missing"] += 1
        else:
            category_stats[cat]["unassessed"] += 1

    # 2. Assessment score progression & before/after
    attempts = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.user_id == current_user.id
    ).order_by(AssessmentAttempt.completed_at.asc()).all()

    score_progression = [
        {
            "attempt_id": a.id,
            "skill_name": a.assessment.skill.name if a.assessment and a.assessment.skill else "Skill",
            "score_percentage": a.percentage,
            "passed": a.passed,
            "completed_at": a.completed_at.strftime("%b %d, %H:%M")
        }
        for a in attempts
    ]

    # Before vs After per skill (if multiple attempts)
    skill_attempts = {}
    for a in attempts:
        sid = a.assessment.skill_id if a.assessment else None
        if sid:
            skill_attempts.setdefault(sid, []).append(a)

    before_after_comparison = []
    for sid, att_list in skill_attempts.items():
        if len(att_list) >= 1:
            first_att = att_list[0]
            latest_att = att_list[-1]
            skill_name = first_att.assessment.skill.name if first_att.assessment and first_att.assessment.skill else "Skill"
            delta = round(latest_att.percentage - first_att.percentage, 1)
            before_after_comparison.append({
                "skill_id": sid,
                "skill_name": skill_name,
                "initial_score": first_att.percentage,
                "latest_score": latest_att.percentage,
                "delta": delta,
                "attempts_count": len(att_list),
                "explanation": f"Improved by {delta}% over {len(att_list)} assessments." if delta > 0 else "Consistent demonstrated baseline."
            })

    # 3. Learning hours & Roadmap metrics
    active_roadmap = db.query(Roadmap).filter(
        Roadmap.user_id == current_user.id,
        Roadmap.status == "active"
    ).first()

    total_tasks = 0
    completed_tasks = 0
    total_hours = 0.0
    completed_hours = 0.0

    if active_roadmap:
        for t in active_roadmap.tasks:
            total_hours += t.estimated_hours
            if t.status == "completed":
                completed_tasks += 1
                completed_hours += t.estimated_hours

    target_role_title = current_user.profile.target_role.title if current_user.profile and current_user.profile.target_role else "Target Role"

    return {
        "target_role": target_role_title,
        "hours_invested": round(completed_hours, 1),
        "total_estimated_hours": round(total_hours, 1),
        "tasks_completed_count": completed_tasks,
        "total_tasks_count": total_tasks,
        "category_distribution": list(category_stats.values()),
        "score_progression": score_progression,
        "before_after_comparison": before_after_comparison
    }

@router.get("/export-report")
def export_skill_report(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Exports a structured printable career skill profile report.
    """
    evidence_list = db.query(UserSkillEvidence).filter(
        UserSkillEvidence.user_id == current_user.id
    ).all()

    target_role = current_user.profile.target_role if current_user.profile else None

    profile_data = {
        "student_name": current_user.full_name,
        "email": current_user.email,
        "education_level": current_user.profile.education_level if current_user.profile else "Undergraduate",
        "target_role": target_role.title if target_role else "General Software Engineering",
        "generated_date": current_user.updated_at.strftime("%B %d, %Y"),
        "competencies": [
            {
                "skill_name": e.skill.name,
                "category": e.skill.category,
                "status": e.status,
                "proficiency_score": e.proficiency_score,
                "evidence_type": e.evidence_type,
                "evidence_summary": e.evidence_summary,
                "verified_at": e.verified_at.strftime("%Y-%m-%d") if e.verified_at else None
            }
            for e in evidence_list
        ],
        "summary_metrics": {
            "demonstrated": sum(1 for e in evidence_list if e.status == "demonstrated"),
            "developing": sum(1 for e in evidence_list if e.status == "developing"),
            "missing": sum(1 for e in evidence_list if e.status == "missing"),
            "unassessed": sum(1 for e in evidence_list if e.status == "unassessed")
        }
    }
    return profile_data
