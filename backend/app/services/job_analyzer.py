import io
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.entities import Skill, SkillAlias, CareerRole, RoleSkillRequirement, UserSkillEvidence, JobDescription
from app.services.gemini_service import gemini_service
import pypdf

class JobAnalyzerService:
    def __init__(self, db: Session):
        self.db = db

    def extract_text_from_pdf(self, file_bytes: bytes) -> str:
        """Extracts text content from uploaded PDF document."""
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            text_parts = []
            for page in reader.pages:
                t = page.extract_text()
                if t:
                    text_parts.append(t)
            return "\n".join(text_parts)
        except Exception as e:
            raise ValueError(f"Could not read PDF document: {str(e)}")

    def _get_known_skills_taxonomy(self) -> List[Dict[str, Any]]:
        """Retrieves all canonical skills and aliases from the database."""
        skills = self.db.query(Skill).all()
        result = []
        for s in skills:
            aliases = [a.alias for a in s.aliases]
            result.append({
                "id": s.id,
                "name": s.name,
                "slug": s.slug,
                "category": s.category,
                "difficulty": s.difficulty_level,
                "aliases": aliases
            })
        return result

    def match_and_normalize_skill(self, raw_mention: str, known_skills: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Matches a raw mention against database skills and alias dictionary."""
        mention_clean = raw_mention.strip().lower()
        
        # 1. Exact canonical name match
        for s in known_skills:
            if s["name"].lower() == mention_clean or s["slug"].lower() == mention_clean:
                return s

        # 2. Alias match
        for s in known_skills:
            for alias in s["aliases"]:
                if alias.lower() == mention_clean:
                    return s

        # 3. Substring match for compound names
        for s in known_skills:
            if mention_clean in s["name"].lower() or s["name"].lower() in mention_clean:
                return s

        return None

    def analyze_document_or_text(
        self,
        raw_text: str,
        title: str,
        company: str = "",
        user_id: Optional[int] = None,
        target_role_id: Optional[int] = None,
        analysis_type: str = "job_description"
    ) -> Dict[str, Any]:
        """
        Processes text through Gemini/deterministic engine, normalizes skills,
        and computes role gap analysis with competency distinction.
        """
        known_skills = self._get_known_skills_taxonomy()
        ai_result = gemini_service.analyze_text(raw_text, analysis_type=analysis_type, known_skills=known_skills)

        # Normalize extracted skills
        normalized_extracted = []
        for item in ai_result.get("extracted_skills", []):
            matched = self.match_and_normalize_skill(item["raw_mention"], known_skills)
            normalized_extracted.append({
                "raw_mention": item["raw_mention"],
                "normalized_skill_id": matched["id"] if matched else None,
                "normalized_skill_name": matched["name"] if matched else item["raw_mention"],
                "category": matched["category"] if matched else item.get("category", "General"),
                "evidence_type": item.get("evidence_type", "resume_mention"),
                "evidence_snippet": item.get("evidence_snippet", ""),
                "confidence": item.get("confidence", 0.8),
                "suggested_status": item.get("suggested_status", "unassessed"),
                "requires_assessment": True,
                "user_confirmed": False
            })

        # Fetch user evidence
        user_evidence_map: Dict[int, UserSkillEvidence] = {}
        if user_id:
            for ev in self.db.query(UserSkillEvidence).filter(UserSkillEvidence.user_id == user_id).all():
                user_evidence_map[ev.skill_id] = ev

        # If a target role is specified, compare against role requirements
        comparisons = []
        matched_count = 0
        developing_count = 0
        missing_count = 0
        unassessed_mentions = 0

        extracted_skill_ids = {item["normalized_skill_id"] for item in normalized_extracted if item["normalized_skill_id"]}

        role_requirements = []
        if target_role_id:
            role_requirements = self.db.query(RoleSkillRequirement).filter(
                RoleSkillRequirement.role_id == target_role_id
            ).all()

        for req in role_requirements:
            skill = req.skill
            user_ev = user_evidence_map.get(skill.id)
            user_status = user_ev.status if user_ev else "unassessed"
            user_prof = user_ev.proficiency_score if user_ev else 0.0

            is_mentioned_in_doc = skill.id in extracted_skill_ids
            matched_item = next((item for item in normalized_extracted if item["normalized_skill_id"] == skill.id), None)
            snippet = matched_item["evidence_snippet"] if matched_item else None

            if user_status == "demonstrated" or user_prof >= 70.0:
                gap_status = "matched"
                matched_count += 1
                rec = "Demonstrated competency verified. Ready for advanced applications."
            elif user_status == "developing":
                gap_status = "needs_practice"
                developing_count += 1
                rec = "Foundational knowledge present. Complete practical tasks to reach full proficiency."
            elif is_mentioned_in_doc:
                # Skill is in resume/text, but user hasn't proven it in assessment!
                gap_status = "unassessed_claim"
                unassessed_mentions += 1
                rec = f"Referenced in document as '{matched_item['raw_mention']}'. Take competency assessment to verify proficiency."
            else:
                gap_status = "missing_competency"
                missing_count += 1
                rec = f"Required competency not yet demonstrated. Add to learning roadmap."

            comparisons.append({
                "skill_id": skill.id,
                "skill_name": skill.name,
                "category": skill.category,
                "importance_level": req.importance_level,
                "user_status": user_status,
                "user_proficiency": user_prof,
                "gap_status": gap_status,
                "evidence_type": user_ev.evidence_type if user_ev else ("resume_mention" if is_mentioned_in_doc else "none"),
                "evidence_snippet": snippet,
                "recommendation": rec
            })

        total_reqs = len(role_requirements)
        overall_match = round((matched_count / total_reqs * 100), 1) if total_reqs > 0 else 0.0

        # Save record in JobDescription if user_id
        saved_record = None
        if user_id:
            saved_record = JobDescription(
                user_id=user_id,
                title=title,
                company=company,
                raw_text=raw_text[:8000],
                source_type=analysis_type,
                extracted_skills_data=normalized_extracted,
                analysis_summary={
                    "matched_count": matched_count,
                    "developing_count": developing_count,
                    "missing_count": missing_count,
                    "unassessed_mentions": unassessed_mentions,
                    "overall_match_percentage": overall_match
                }
            )
            self.db.add(saved_record)
            self.db.commit()
            self.db.refresh(saved_record)

        return {
            "id": saved_record.id if saved_record else None,
            "title": title,
            "company": company,
            "analysis_type": analysis_type,
            "summary": ai_result.get("summary", ""),
            "extracted_skills": normalized_extracted,
            "comparisons": comparisons,
            "matched_skills_count": matched_count,
            "developing_skills_count": developing_count,
            "missing_skills_count": missing_count,
            "unassessed_mentions_count": unassessed_mentions,
            "overall_match_percentage": overall_match,
            "is_simulated_ai": ai_result.get("is_simulated_ai", False),
            "ai_model_used": ai_result.get("ai_model_used", "local-engine")
        }

    def apply_confirmed_skills(
        self,
        user_id: int,
        skills_to_apply: List[Dict[str, Any]]
    ) -> int:
        """
        Updates user evidence records for confirmed skills.
        Treats resume mentions as unassessed/developing with evidence note,
        never blindly setting them to demonstrated without an assessment.
        """
        count = 0
        for item in skills_to_apply:
            skill_id = item.get("skill_id")
            if not skill_id:
                continue

            status = item.get("status", "unassessed")
            ev_type = item.get("evidence_type", "resume_mention")
            summary = item.get("evidence_summary", "Extracted from uploaded resume/document.")

            # Safety enforcement: Resume mentions cannot be marked "demonstrated" without assessment
            if ev_type == "resume_mention" and status == "demonstrated":
                status = "developing"
                summary += " (Flagged for assessment verification)."

            evidence = self.db.query(UserSkillEvidence).filter(
                UserSkillEvidence.user_id == user_id,
                UserSkillEvidence.skill_id == skill_id
            ).first()

            if evidence:
                evidence.status = status
                evidence.evidence_type = ev_type
                evidence.evidence_summary = summary
            else:
                evidence = UserSkillEvidence(
                    user_id=user_id,
                    skill_id=skill_id,
                    status=status,
                    proficiency_score=50.0 if status == "developing" else 0.0,
                    evidence_type=ev_type,
                    evidence_summary=summary
                )
                self.db.add(evidence)
            count += 1

        self.db.commit()
        return count
