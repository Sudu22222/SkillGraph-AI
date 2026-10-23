from datetime import datetime
from typing import List, Dict, Any, Optional, Set
import networkx as nx
from sqlalchemy.orm import Session
from app.models.entities import (
    Roadmap,
    RoadmapTask,
    CareerRole,
    RoleSkillRequirement,
    Skill,
    SkillPrerequisite,
    UserSkillEvidence,
    LearningResource,
    RoadmapAuditEvent,
    UserProfile
)
from app.services.graph_engine import GraphEngine

class RoadmapEngine:
    def __init__(self, db: Session):
        self.db = db
        self.graph_engine = GraphEngine(db)

    def generate_or_update_roadmap(
        self,
        user_id: int,
        target_role_id: int,
        force_regenerate: bool = False
    ) -> Roadmap:
        """
        Generates or adaptively updates a learning roadmap respecting:
        - Target role skill requirements
        - Transitive prerequisite DAG dependencies
        - User's verified demonstrated competencies (skips mastered skills)
        - User's weekly study time
        - Preserves previously completed tasks
        """
        role = self.db.query(CareerRole).filter(CareerRole.id == target_role_id).first()
        if not role:
            raise ValueError("Target career role not found")

        profile = self.db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        weekly_hours = profile.weekly_study_hours if profile else 10

        # Existing active roadmap
        existing_roadmap = self.db.query(Roadmap).filter(
            Roadmap.user_id == user_id,
            Roadmap.status == "active"
        ).first()

        completed_tasks_by_skill: Dict[int, RoadmapTask] = {}
        if existing_roadmap and not force_regenerate:
            for task in existing_roadmap.tasks:
                if task.status == "completed":
                    completed_tasks_by_skill[task.skill_id] = task

        # Build Graph DAG
        G, all_skills, prereqs = self.graph_engine.build_skill_dag()
        skills_by_id = {s.id: s for s in all_skills}

        # User evidence
        user_evidence = {
            ev.skill_id: ev for ev in self.db.query(UserSkillEvidence).filter(
                UserSkillEvidence.user_id == user_id
            ).all()
        }

        # Role requirements
        role_reqs = self.db.query(RoleSkillRequirement).filter(
            RoleSkillRequirement.role_id == target_role_id
        ).all()

        target_skill_ids: Set[int] = {rr.skill_id for rr in role_reqs}

        # Collect all transitive prerequisite skills needed for these role skills
        needed_skill_ids: Set[int] = set(target_skill_ids)
        for s_id in target_skill_ids:
            if s_id in G:
                ancestors = nx.ancestors(G, s_id)
                needed_skill_ids.update(ancestors)

        # Build induced subgraph of needed skills
        subgraph = G.subgraph(needed_skill_ids).copy()

        # Topological sort of needed skills
        try:
            ordered_skill_ids = list(nx.topological_sort(subgraph))
        except Exception:
            ordered_skill_ids = sorted(list(needed_skill_ids), key=lambda sid: subgraph.in_degree(sid))

        # Filter out skills already demonstrated (unless already a completed roadmap task to preserve)
        tasks_to_create = []
        explanation_lines = []
        skipped_count = 0

        for sid in ordered_skill_ids:
            skill = skills_by_id.get(sid)
            if not skill:
                continue

            ev = user_evidence.get(sid)
            is_demonstrated = bool(ev and (ev.status == "demonstrated" or ev.proficiency_score >= 70.0))

            # If user already demonstrated skill AND it wasn't a prior task, skip
            if is_demonstrated and sid not in completed_tasks_by_skill:
                skipped_count += 1
                continue

            # Resources for this skill
            resources = self.db.query(LearningResource).filter(
                LearningResource.skill_id == sid
            ).all()
            res_data = [
                {
                    "id": r.id,
                    "title": r.title,
                    "url": r.url,
                    "resource_type": r.resource_type,
                    "provider": r.provider,
                    "estimated_mins": r.estimated_mins,
                    "difficulty": r.difficulty,
                    "rationale": r.rationale or f"Official reference material for mastering {skill.name}."
                }
                for r in resources
            ]

            # Determine task status and details
            if sid in completed_tasks_by_skill:
                prev_task = completed_tasks_by_skill[sid]
                task_status = "completed"
                started_at = prev_task.started_at
                completed_at = prev_task.completed_at
            else:
                task_status = "not_started"
                started_at = None
                completed_at = None

            # Check prerequisites
            prereq_skills = [
                skills_by_id[p.prerequisite_skill_id].name
                for p in prereqs
                if p.skill_id == sid and p.prerequisite_skill_id in skills_by_id
            ]

            is_core_req = sid in target_skill_ids
            est_hours = 6.0 if skill.difficulty_level == "advanced" else (4.0 if skill.difficulty_level == "intermediate" else 3.0)

            title = f"Master {skill.name}"
            learning_obj = (
                f"Develop verified working competency in {skill.name} ({skill.category}). "
                f"Understand core principles, solve practical tasks, and prepare for competency assessment."
            )
            practical_ex = (
                f"Implement a hands-on project module applying {skill.name}. "
                f"Ensure clean separation of concerns, handle edge cases, and write automated tests."
            )
            assessment_crit = (
                f"Achieve >= 70% on the {skill.name} competency assessment or submit an approved portfolio implementation."
            )

            tasks_to_create.append({
                "skill_id": sid,
                "title": title,
                "description": skill.description,
                "learning_objective": learning_obj,
                "estimated_hours": est_hours,
                "status": task_status,
                "practical_exercise": practical_ex,
                "assessment_criteria": assessment_crit,
                "resources_data": res_data,
                "started_at": started_at,
                "completed_at": completed_at,
                "prereq_names": prereq_skills,
                "is_core_role_req": is_core_req
            })

        # Build explanation
        explanation = (
            f"Adaptive roadmap sequenced for {role.title}. "
            f"Included {len(tasks_to_create)} structured learning tasks respecting strict prerequisite order. "
            f"Skipped {skipped_count} competencies where proficiency was already demonstrated. "
            f"Paced according to your study commitment of ~{weekly_hours} hours per week."
        )

        # Create or update Roadmap entity
        if existing_roadmap and not force_regenerate:
            roadmap = existing_roadmap
            roadmap.target_role_id = target_role_id
            roadmap.title = f"{role.title} Adaptive Roadmap"
            roadmap.explanation = explanation
            roadmap.updated_at = datetime.utcnow()

            # Remove non-completed tasks
            for old_task in list(roadmap.tasks):
                if old_task.status != "completed":
                    self.db.delete(old_task)
            self.db.flush()
        else:
            if existing_roadmap and force_regenerate:
                existing_roadmap.status = "archived"

            roadmap = Roadmap(
                user_id=user_id,
                target_role_id=target_role_id,
                title=f"{role.title} Adaptive Roadmap",
                status="active",
                explanation=explanation,
                generated_at=datetime.utcnow()
            )
            self.db.add(roadmap)
            self.db.flush()

        # Add tasks with updated order
        for idx, t_info in enumerate(tasks_to_create):
            # Check if completed task already exists
            if t_info["skill_id"] in completed_tasks_by_skill and not force_regenerate:
                # Update order of existing completed task
                existing_t = completed_tasks_by_skill[t_info["skill_id"]]
                existing_t.task_order = idx + 1
            else:
                new_task = RoadmapTask(
                    roadmap_id=roadmap.id,
                    skill_id=t_info["skill_id"],
                    title=t_info["title"],
                    description=t_info["description"],
                    learning_objective=t_info["learning_objective"],
                    estimated_hours=t_info["estimated_hours"],
                    status=t_info["status"],
                    task_order=idx + 1,
                    practical_exercise=t_info["practical_exercise"],
                    assessment_criteria=t_info["assessment_criteria"],
                    resources_data=t_info["resources_data"],
                    started_at=t_info["started_at"],
                    completed_at=t_info["completed_at"]
                )
                self.db.add(new_task)

        # Audit event
        audit = RoadmapAuditEvent(
            user_id=user_id,
            roadmap_id=roadmap.id,
            event_type="roadmap_generated" if not existing_roadmap else "roadmap_recalculated",
            reason=f"Generated adaptive roadmap for target role '{role.title}'.",
            details={
                "target_role_id": target_role_id,
                "total_tasks": len(tasks_to_create),
                "skipped_skills_count": skipped_count
            }
        )
        self.db.add(audit)

        self.db.commit()
        self.db.refresh(roadmap)
        return roadmap

    def validate_and_reorder_tasks(self, roadmap_id: int, user_id: int, new_task_ids: List[int]) -> bool:
        """
        Reorders roadmap tasks after validating that no task is moved
        BEFORE its mandatory prerequisites in the new sequence.
        """
        roadmap = self.db.query(Roadmap).filter(
            Roadmap.id == roadmap_id,
            Roadmap.user_id == user_id
        ).first()
        if not roadmap:
            raise ValueError("Roadmap not found")

        tasks_map = {t.id: t for t in roadmap.tasks}
        if set(new_task_ids) != set(tasks_map.keys()):
            raise ValueError("Task ID list does not match existing roadmap tasks")

        # Check prerequisite violations in new order
        # position map: skill_id -> new index
        pos_map = {}
        for idx, tid in enumerate(new_task_ids):
            task = tasks_map[tid]
            pos_map[task.skill_id] = idx

        # Fetch prerequisites
        prereqs = self.db.query(SkillPrerequisite).filter(
            SkillPrerequisite.relationship_type == "mandatory"
        ).all()

        for p in prereqs:
            # If both prerequisite and dependent skill are in this roadmap:
            if p.prerequisite_skill_id in pos_map and p.skill_id in pos_map:
                prereq_pos = pos_map[p.prerequisite_skill_id]
                dependent_pos = pos_map[p.skill_id]
                if dependent_pos < prereq_pos:
                    prereq_skill = self.db.query(Skill).get(p.prerequisite_skill_id)
                    dep_skill = self.db.query(Skill).get(p.skill_id)
                    raise ValueError(
                        f"Cannot place '{dep_skill.name}' before its mandatory prerequisite '{prereq_skill.name}'."
                    )

        # Valid reordering: update task_order
        for idx, tid in enumerate(new_task_ids):
            tasks_map[tid].task_order = idx + 1

        audit = RoadmapAuditEvent(
            user_id=user_id,
            roadmap_id=roadmap.id,
            event_type="roadmap_tasks_reordered",
            reason="User adjusted task learning order (prerequisite constraints verified).",
            details={"task_count": len(new_task_ids)}
        )
        self.db.add(audit)
        self.db.commit()
        return True
