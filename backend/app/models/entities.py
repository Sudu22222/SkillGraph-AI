from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="student", nullable=False)  # student, educator, admin
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    skill_evidence = relationship("UserSkillEvidence", back_populates="user", cascade="all, delete-orphan")
    assessment_attempts = relationship("AssessmentAttempt", back_populates="user", cascade="all, delete-orphan")
    roadmaps = relationship("Roadmap", back_populates="user", cascade="all, delete-orphan")
    project_submissions = relationship("ProjectSubmission", back_populates="user", cascade="all, delete-orphan")
    audit_events = relationship("RoadmapAuditEvent", back_populates="user", cascade="all, delete-orphan")
    job_descriptions = relationship("JobDescription", back_populates="user", cascade="all, delete-orphan")

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    education_level = Column(String(100), default="Undergraduate")  # High School, Undergraduate, Graduate, Self-taught
    interests = Column(JSON, default=list)  # list of strings
    target_role_id = Column(Integer, ForeignKey("career_roles.id", ondelete="SET NULL"), nullable=True)
    weekly_study_hours = Column(Integer, default=10, nullable=False)
    learning_style = Column(String(50), default="hands_on")  # hands_on, reading, visual, mixed
    bio = Column(Text, default="", nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="profile")
    target_role = relationship("CareerRole")

class CareerRole(Base):
    __tablename__ = "career_roles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    slug = Column(String(150), unique=True, index=True, nullable=False)
    category = Column(String(100), default="Software Engineering", nullable=False)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    role_skills = relationship("RoleSkillRequirement", back_populates="role", cascade="all, delete-orphan")
    assessments = relationship("Assessment", back_populates="role")
    roadmaps = relationship("Roadmap", back_populates="target_role")

class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    slug = Column(String(150), unique=True, index=True, nullable=False)
    category = Column(String(100), nullable=False)  # Languages, Frameworks, Architecture, Databases, DevOps, Security
    description = Column(Text, nullable=False)
    difficulty_level = Column(String(50), default="intermediate", nullable=False)  # beginner, intermediate, advanced
    is_core = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    aliases = relationship("SkillAlias", back_populates="skill", cascade="all, delete-orphan")
    role_requirements = relationship("RoleSkillRequirement", back_populates="skill", cascade="all, delete-orphan")
    # Prerequisites where THIS skill depends on another
    prerequisites = relationship("SkillPrerequisite", foreign_keys="SkillPrerequisite.skill_id", back_populates="skill", cascade="all, delete-orphan")
    # Downstream dependencies where OTHER skills depend on this
    dependents = relationship("SkillPrerequisite", foreign_keys="SkillPrerequisite.prerequisite_skill_id", back_populates="prerequisite_skill", cascade="all, delete-orphan")
    learning_resources = relationship("LearningResource", back_populates="skill", cascade="all, delete-orphan")
    assessments = relationship("Assessment", back_populates="skill")

class SkillAlias(Base):
    __tablename__ = "skill_aliases"

    id = Column(Integer, primary_key=True, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    alias = Column(String(150), index=True, nullable=False)

    skill = relationship("Skill", back_populates="aliases")
    __table_args__ = (UniqueConstraint("skill_id", "alias", name="uq_skill_alias"),)

class RoleSkillRequirement(Base):
    __tablename__ = "role_skill_requirements"

    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("career_roles.id", ondelete="CASCADE"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    importance_level = Column(String(50), default="mandatory", nullable=False)  # mandatory, recommended, optional
    required_proficiency = Column(String(50), default="intermediate", nullable=False)  # beginner, intermediate, advanced
    weight = Column(Float, default=1.0, nullable=False)

    role = relationship("CareerRole", back_populates="role_skills")
    skill = relationship("Skill", back_populates="role_requirements")
    __table_args__ = (UniqueConstraint("role_id", "skill_id", name="uq_role_skill"),)

class SkillPrerequisite(Base):
    __tablename__ = "skill_prerequisites"

    id = Column(Integer, primary_key=True, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)  # The target skill
    prerequisite_skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)  # What must be learned first
    relationship_type = Column(String(50), default="mandatory", nullable=False)  # mandatory, recommended

    skill = relationship("Skill", foreign_keys=[skill_id], back_populates="prerequisites")
    prerequisite_skill = relationship("Skill", foreign_keys=[prerequisite_skill_id], back_populates="dependents")
    __table_args__ = (UniqueConstraint("skill_id", "prerequisite_skill_id", name="uq_skill_prereq"),)

class UserSkillEvidence(Base):
    __tablename__ = "user_skill_evidence"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="unassessed", nullable=False)  # unassessed, missing, developing, demonstrated
    proficiency_score = Column(Float, default=0.0, nullable=False)  # 0 to 100
    evidence_type = Column(String(50), default="unassessed", nullable=False)  # assessment, project, resume_mention, self_reported
    evidence_summary = Column(Text, default="", nullable=False)
    verified_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="skill_evidence")
    skill = relationship("Skill")
    __table_args__ = (
        UniqueConstraint("user_id", "skill_id", name="uq_user_skill_evidence"),
        Index("ix_user_evidence_status", "user_id", "status"),
    )

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    role_id = Column(Integer, ForeignKey("career_roles.id", ondelete="SET NULL"), nullable=True)
    difficulty = Column(String(50), default="intermediate", nullable=False)  # beginner, intermediate, advanced
    assessment_type = Column(String(50), default="quiz", nullable=False)  # quiz, practical_task
    time_limit_mins = Column(Integer, default=15, nullable=False)
    questions_data = Column(JSON, default=list, nullable=False)  # List of question dicts
    passing_score = Column(Integer, default=70, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    skill = relationship("Skill", back_populates="assessments")
    role = relationship("CareerRole", back_populates="assessments")
    attempts = relationship("AssessmentAttempt", back_populates="assessment", cascade="all, delete-orphan")

class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assessment_id = Column(Integer, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    score = Column(Float, nullable=False)
    max_score = Column(Float, nullable=False)
    percentage = Column(Float, nullable=False)
    passed = Column(Boolean, nullable=False)
    answers_data = Column(JSON, default=dict, nullable=False)
    rubric_feedback = Column(JSON, default=dict, nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="assessment_attempts")
    assessment = relationship("Assessment", back_populates="attempts")

class Roadmap(Base):
    __tablename__ = "roadmaps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    target_role_id = Column(Integer, ForeignKey("career_roles.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    status = Column(String(50), default="active", nullable=False)  # active, completed, archived
    explanation = Column(Text, default="", nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="roadmaps")
    target_role = relationship("CareerRole", back_populates="roadmaps")
    tasks = relationship("RoadmapTask", back_populates="roadmap", cascade="all, delete-orphan", order_by="RoadmapTask.task_order")

class RoadmapTask(Base):
    __tablename__ = "roadmap_tasks"

    id = Column(Integer, primary_key=True, index=True)
    roadmap_id = Column(Integer, ForeignKey("roadmaps.id", ondelete="CASCADE"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    learning_objective = Column(Text, nullable=False)
    estimated_hours = Column(Float, default=4.0, nullable=False)
    status = Column(String(50), default="not_started", nullable=False)  # not_started, in_progress, submitted, completed
    task_order = Column(Integer, nullable=False)
    practical_exercise = Column(Text, default="", nullable=False)
    assessment_criteria = Column(Text, default="", nullable=False)
    resources_data = Column(JSON, default=list, nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    roadmap = relationship("Roadmap", back_populates="tasks")
    skill = relationship("Skill")

class LearningResource(Base):
    __tablename__ = "learning_resources"

    id = Column(Integer, primary_key=True, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    url = Column(String(500), nullable=False)
    resource_type = Column(String(50), default="official_docs", nullable=False)  # official_docs, tutorial, course, book
    provider = Column(String(100), default="Official", nullable=False)
    estimated_mins = Column(Integer, default=60, nullable=False)
    difficulty = Column(String(50), default="intermediate", nullable=False)
    rationale = Column(Text, default="", nullable=False)

    skill = relationship("Skill", back_populates="learning_resources")

class ProjectSubmission(Base):
    __tablename__ = "project_submissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    roadmap_task_id = Column(Integer, ForeignKey("roadmap_tasks.id", ondelete="SET NULL"), nullable=True)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    repo_url = Column(String(500), default="", nullable=False)
    text_submission = Column(Text, default="", nullable=False)
    rubric_score = Column(Float, nullable=True)
    feedback = Column(JSON, default=dict, nullable=False)
    status = Column(String(50), default="submitted", nullable=False)  # draft, submitted, reviewed, verified
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    reviewed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="project_submissions")
    roadmap_task = relationship("RoadmapTask")
    skill = relationship("Skill")

class RoadmapAuditEvent(Base):
    __tablename__ = "roadmap_audit_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    roadmap_id = Column(Integer, ForeignKey("roadmaps.id", ondelete="SET NULL"), nullable=True)
    event_type = Column(String(100), nullable=False)  # assessment_completed, task_completed, roadmap_recalculated, skill_verified
    reason = Column(Text, nullable=False)
    details = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="audit_events")

class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    company = Column(String(200), default="", nullable=False)
    raw_text = Column(Text, nullable=False)
    source_type = Column(String(50), default="paste", nullable=False)  # paste, resume_upload, jd_upload
    extracted_skills_data = Column(JSON, default=list, nullable=False)
    analysis_summary = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="job_descriptions")
