from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.entities import (
    Assessment,
    AssessmentAttempt,
    UserSkillEvidence,
    Roadmap,
    RoadmapTask,
    RoadmapAuditEvent,
    Skill
)
from app.services.gemini_service import gemini_service

class AssessmentEngine:
    def __init__(self, db: Session):
        self.db = db

    def submit_and_evaluate(
        self,
        user_id: int,
        assessment_id: int,
        answers: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Evaluates assessment submission deterministically for multiple choice,
        and uses rubric evaluation for short answer/practical tasks.
        Updates user evidence, records attempt, and updates roadmap.
        """
        assessment = self.db.query(Assessment).filter(Assessment.id == assessment_id).first()
        if not assessment:
            raise ValueError("Assessment not found")

        questions = assessment.questions_data or []
        total_earned = 0.0
        total_max = 0.0
        evaluations = []

        for q in questions:
            q_id = q.get("id")
            q_type = q.get("question_type", "multiple_choice")
            q_points = float(q.get("points", 25))
            total_max += q_points
            user_ans = answers.get(q_id)

            if q_type == "multiple_choice":
                correct_opt = q.get("correct_option_id", "")
                is_correct = (str(user_ans).strip().lower() == str(correct_opt).strip().lower())
                earned = q_points if is_correct else 0.0
                total_earned += earned
                evaluations.append({
                    "question_id": q_id,
                    "is_correct": is_correct,
                    "score": earned,
                    "max_score": q_points,
                    "explanation": q.get("explanation", ""),
                    "rubric_scores": None
                })
            else:
                # Open-ended short answer or practical task
                eval_res = gemini_service.evaluate_short_answer(
                    question=q.get("question", ""),
                    user_answer=str(user_ans or ""),
                    expected_explanation=q.get("explanation", ""),
                    rubric=q.get("rubric", {})
                )
                earned = float(eval_res.get("score", 0.0))
                # Scale earned to question points if needed
                max_rubric = float(eval_res.get("max_score", 25.0))
                scaled_earned = (earned / max_rubric) * q_points if max_rubric > 0 else 0.0
                total_earned += scaled_earned
                evaluations.append({
                    "question_id": q_id,
                    "is_correct": eval_res.get("is_correct", False),
                    "score": round(scaled_earned, 1),
                    "max_score": q_points,
                    "explanation": eval_res.get("feedback", ""),
                    "rubric_scores": eval_res.get("rubric_scores", [])
                })

        percentage = round((total_earned / total_max * 100), 1) if total_max > 0 else 0.0
        passed = percentage >= assessment.passing_score

        # Determine competency status
        if percentage >= 70.0:
            new_status = "demonstrated"
        elif percentage >= 40.0:
            new_status = "developing"
        else:
            new_status = "missing"

        # Fetch or create UserSkillEvidence
        evidence = self.db.query(UserSkillEvidence).filter(
            UserSkillEvidence.user_id == user_id,
            UserSkillEvidence.skill_id == assessment.skill_id
        ).first()

        prev_status = evidence.status if evidence else "unassessed"
        summary = f"Scored {percentage}% ({round(total_earned, 1)}/{round(total_max, 1)} pts) on {assessment.title}."

        if evidence:
            evidence.status = new_status
            evidence.proficiency_score = percentage
            evidence.evidence_type = "assessment"
            evidence.evidence_summary = summary
            evidence.verified_at = datetime.utcnow()
        else:
            evidence = UserSkillEvidence(
                user_id=user_id,
                skill_id=assessment.skill_id,
                status=new_status,
                proficiency_score=percentage,
                evidence_type="assessment",
                evidence_summary=summary,
                verified_at=datetime.utcnow()
            )
            self.db.add(evidence)

        # Record attempt
        attempt = AssessmentAttempt(
            user_id=user_id,
            assessment_id=assessment.id,
            score=round(total_earned, 1),
            max_score=round(total_max, 1),
            percentage=percentage,
            passed=passed,
            answers_data=answers,
            rubric_feedback={"evaluations": evaluations, "summary": summary},
            completed_at=datetime.utcnow()
        )
        self.db.add(attempt)

        # Record audit event
        audit = RoadmapAuditEvent(
            user_id=user_id,
            event_type="assessment_completed",
            reason=f"Completed {assessment.title}. Competency transitioned from {prev_status} to {new_status}.",
            details={
                "assessment_id": assessment.id,
                "skill_id": assessment.skill_id,
                "percentage": percentage,
                "passed": passed,
                "previous_status": prev_status,
                "new_status": new_status
            }
        )
        self.db.add(audit)

        # Check if any roadmap task corresponds to this skill and update it
        active_roadmap = self.db.query(Roadmap).filter(
            Roadmap.user_id == user_id,
            Roadmap.status == "active"
        ).first()

        roadmap_updated = False
        update_explanation = ""
        if active_roadmap and new_status == "demonstrated":
            # If there's a task for this skill in the roadmap, mark it completed
            for task in active_roadmap.tasks:
                if task.skill_id == assessment.skill_id and task.status != "completed":
                    task.status = "completed"
                    task.completed_at = datetime.utcnow()
                    roadmap_updated = True
                    update_explanation = f"Marked roadmap task '{task.title}' as completed due to demonstrated assessment score of {percentage}%."

        self.db.commit()
        self.db.refresh(attempt)

        feedback_summary = (
            f"Assessment passed with {percentage}%. Demonstrated proficiency verified for {assessment.skill.name}."
            if passed else
            f"Assessment completed with {percentage}%. Passing benchmark is {assessment.passing_score}%. Review recommended resources and retake when ready."
        )

        return {
            "attempt_id": attempt.id,
            "assessment_id": assessment.id,
            "skill_id": assessment.skill_id,
            "skill_name": assessment.skill.name,
            "score": round(total_earned, 1),
            "max_score": round(total_max, 1),
            "percentage": percentage,
            "passed": passed,
            "evaluations": evaluations,
            "feedback_summary": feedback_summary,
            "previous_status": prev_status,
            "new_status": new_status,
            "new_proficiency_score": percentage,
            "roadmap_updated": roadmap_updated,
            "explanation": update_explanation,
            "completed_at": attempt.completed_at
        }
