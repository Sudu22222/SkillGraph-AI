from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import Roadmap, RoadmapTask, User, CareerRole, SkillPrerequisite, UserSkillEvidence, RoadmapAuditEvent
from app.schemas.roadmap import RoadmapOut, RoadmapTaskOut, TaskStatusUpdate, RoadmapReorderRequest, AuditEventOut
from app.schemas.skill import LearningResourceOut
from app.services.auth_service import get_current_user
from app.services.roadmap_engine import RoadmapEngine

router = APIRouter(prefix="/roadmaps", tags=["Adaptive Roadmap Engine"])

@router.get("/active", response_model=Optional[RoadmapOut])
def get_active_roadmap(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    roadmap = db.query(Roadmap).filter(
        Roadmap.user_id == current_user.id,
        Roadmap.status == "active"
    ).first()

    if not roadmap:
        # Check if user has target role and auto-generate initial roadmap
        target_role_id = current_user.profile.target_role_id if current_user.profile else None
        if target_role_id:
            engine = RoadmapEngine(db)
            roadmap = engine.generate_or_update_roadmap(
                user_id=current_user.id,
                target_role_id=target_role_id
            )
        else:
            return None

    # Fetch user evidence and prereqs to annotate prerequisite satisfaction
    user_evidence = {
        ev.skill_id: ev for ev in db.query(UserSkillEvidence).filter(
            UserSkillEvidence.user_id == current_user.id
        ).all()
    }
    all_prereqs = db.query(SkillPrerequisite).all()

    tasks_out = []
    total_hours = 0.0
    completed_hours = 0.0

    for t in sorted(roadmap.tasks, key=lambda x: x.task_order):
        total_hours += t.estimated_hours
        if t.status == "completed":
            completed_hours += t.estimated_hours

        # Check prerequisite satisfaction for this task's skill
        s_prereqs = [p for p in all_prereqs if p.skill_id == t.skill_id and p.relationship_type == "mandatory"]
        is_sat = True
        missing = []
        for p in s_prereqs:
            pev = user_evidence.get(p.prerequisite_skill_id)
            if not pev or (pev.status != "demonstrated" and pev.proficiency_score < 70.0):
                is_sat = False
                if p.prerequisite_skill:
                    missing.append(p.prerequisite_skill.name)

        res_list = [
            LearningResourceOut(
                id=r.get("id", 0),
                title=r.get("title", ""),
                url=r.get("url", ""),
                resource_type=r.get("resource_type", "doc"),
                provider=r.get("provider", "Official"),
                estimated_mins=r.get("estimated_mins", 60),
                difficulty=r.get("difficulty", "intermediate"),
                rationale=r.get("rationale", "")
            )
            for r in (t.resources_data or [])
        ]

        tasks_out.append(RoadmapTaskOut(
            id=t.id,
            roadmap_id=t.roadmap_id,
            skill_id=t.skill_id,
            skill_name=t.skill.name if t.skill else "",
            skill_slug=t.skill.slug if t.skill else "",
            category=t.skill.category if t.skill else "",
            difficulty_level=t.skill.difficulty_level if t.skill else "intermediate",
            title=t.title,
            description=t.description,
            learning_objective=t.learning_objective,
            estimated_hours=t.estimated_hours,
            status=t.status,
            task_order=t.task_order,
            practical_exercise=t.practical_exercise,
            assessment_criteria=t.assessment_criteria,
            resources=res_list,
            is_prerequisite_satisfied=is_sat,
            missing_prerequisites=missing,
            started_at=t.started_at,
            completed_at=t.completed_at
        ))

    progress_pct = round((completed_hours / total_hours * 100), 1) if total_hours > 0 else 0.0

    return RoadmapOut(
        id=roadmap.id,
        user_id=roadmap.user_id,
        target_role_id=roadmap.target_role_id,
        target_role_title=roadmap.target_role.title if roadmap.target_role else "",
        title=roadmap.title,
        status=roadmap.status,
        explanation=roadmap.explanation,
        total_hours=round(total_hours, 1),
        completed_hours=round(completed_hours, 1),
        progress_percentage=progress_pct,
        tasks=tasks_out,
        generated_at=roadmap.generated_at,
        updated_at=roadmap.updated_at
    )

@router.post("/generate", response_model=RoadmapOut)
def generate_roadmap(
    role_id: Optional[int] = Body(None, embed=True),
    force_regenerate: bool = Body(False, embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_role_id = role_id or (current_user.profile.target_role_id if current_user.profile else None)
    if not target_role_id:
        first_role = db.query(CareerRole).first()
        target_role_id = first_role.id if first_role else 1

    engine = RoadmapEngine(db)
    roadmap = engine.generate_or_update_roadmap(
        user_id=current_user.id,
        target_role_id=target_role_id,
        force_regenerate=force_regenerate
    )

    # Update profile target role if changed
    if current_user.profile and current_user.profile.target_role_id != target_role_id:
        current_user.profile.target_role_id = target_role_id
        db.commit()

    return get_active_roadmap(current_user=current_user, db=db)

@router.patch("/tasks/{task_id}/status")
def update_task_status(
    task_id: int,
    status_update: TaskStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(RoadmapTask).join(Roadmap).filter(
        RoadmapTask.id == task_id,
        Roadmap.user_id == current_user.id
    ).first()

    if not task:
        raise HTTPException(status_code=404, detail="Roadmap task not found")

    new_status = status_update.status
    if new_status not in ["not_started", "in_progress", "completed"]:
        raise HTTPException(status_code=400, detail="Invalid task status")

    task.status = new_status
    if new_status == "in_progress" and not task.started_at:
        task.started_at = datetime.utcnow()
    elif new_status == "completed":
        task.completed_at = datetime.utcnow()

    # Record audit event
    audit = RoadmapAuditEvent(
        user_id=current_user.id,
        roadmap_id=task.roadmap_id,
        event_type="task_status_updated",
        reason=f"Updated status of task '{task.title}' to '{new_status}'.",
        details={"task_id": task.id, "new_status": new_status}
    )
    db.add(audit)
    db.commit()

    return {"success": True, "task_id": task.id, "new_status": new_status}

@router.post("/reorder")
def reorder_tasks(
    payload: RoadmapReorderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    active_roadmap = db.query(Roadmap).filter(
        Roadmap.user_id == current_user.id,
        Roadmap.status == "active"
    ).first()

    if not active_roadmap:
        raise HTTPException(status_code=404, detail="No active roadmap found")

    engine = RoadmapEngine(db)
    try:
        engine.validate_and_reorder_tasks(
            roadmap_id=active_roadmap.id,
            user_id=current_user.id,
            new_task_ids=payload.task_ids
        )
        return {"success": True, "message": "Roadmap order updated successfully."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/audit-events", response_model=List[AuditEventOut])
def get_audit_events(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    events = db.query(RoadmapAuditEvent).filter(
        RoadmapAuditEvent.user_id == current_user.id
    ).order_by(RoadmapAuditEvent.created_at.desc()).limit(20).all()

    return events
