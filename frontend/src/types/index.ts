export type CompetencyStatus = 'unassessed' | 'missing' | 'developing' | 'demonstrated';
export type EvidenceType = 'assessment' | 'project' | 'resume_mention' | 'self_reported' | 'unassessed';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type ImportanceLevel = 'mandatory' | 'recommended' | 'optional';
export type TaskStatus = 'not_started' | 'in_progress' | 'submitted' | 'completed';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  profile?: UserProfile;
}

export interface UserProfile {
  id: number;
  user_id: number;
  education_level: string;
  interests: string[];
  target_role_id?: number | null;
  weekly_study_hours: number;
  learning_style: string;
  bio: string;
  updated_at: string;
  target_role?: CareerRoleSimple | null;
}

export interface CareerRoleSimple {
  id: number;
  title: string;
  slug: string;
  category: string;
}

export interface CareerRole {
  id: number;
  title: string;
  slug: string;
  category: string;
  description: string;
  created_at: string;
  skills: RoleSkillRequirement[];
  total_skills_count: number;
  mandatory_skills_count: number;
}

export interface RoleSkillRequirement {
  id: number;
  skill_id: number;
  skill_name: string;
  skill_slug: string;
  category: string;
  difficulty_level: DifficultyLevel;
  importance_level: ImportanceLevel;
  required_proficiency: DifficultyLevel;
  weight: number;
  user_status: CompetencyStatus;
  user_proficiency: number;
}

export interface RoleGapSummary {
  role_id: number;
  role_title: string;
  role_category: string;
  match_percentage: number;
  demonstrated_count: number;
  developing_count: number;
  missing_count: number;
  unassessed_count: number;
  total_required_skills: number;
  skills_breakdown: RoleSkillRequirement[];
}

export interface LearningResource {
  id: number;
  title: string;
  url: string;
  resource_type: string;
  provider: string;
  estimated_mins: number;
  difficulty: DifficultyLevel;
  rationale: string;
}

export interface SkillItem {
  id: number;
  name: string;
  slug: string;
  category: string;
  description: string;
  difficulty_level: DifficultyLevel;
  is_core: boolean;
  aliases: string[];
  prerequisites: {
    skill_id: number;
    skill_name: string;
    skill_slug: string;
    relationship_type: string;
  }[];
  dependents: {
    skill_id: number;
    skill_name: string;
    skill_slug: string;
    relationship_type: string;
  }[];
  learning_resources: LearningResource[];
}

export interface UserSkillEvidence {
  id: number;
  skill_id: number;
  skill_name: string;
  skill_slug: string;
  category: string;
  difficulty_level: DifficultyLevel;
  status: CompetencyStatus;
  proficiency_score: number;
  evidence_type: EvidenceType;
  evidence_summary: string;
  verified_at?: string | null;
  updated_at: string;
  is_prerequisite_ready: boolean;
  missing_prerequisites: string[];
}

export interface GraphNodeData {
  id: string;
  skill_id: number;
  label: string;
  slug: string;
  category: string;
  difficulty: DifficultyLevel;
  status: CompetencyStatus;
  proficiency_score: number;
  is_prerequisite_ready: boolean;
  missing_prerequisites: string[];
  evidence_type: EvidenceType;
  is_role_required: boolean;
  role_importance?: ImportanceLevel | null;
  position: { x: number; y: number };
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  relationship_type: 'mandatory' | 'recommended';
  is_satisfied: boolean;
}

export interface SkillGraphResponse {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  cycle_detected: boolean;
  cycles: string[][];
  topological_order: string[];
  total_skills: number;
  demonstrated_count: number;
  developing_count: number;
  missing_count: number;
  unassessed_count: number;
  ready_to_learn_count: number;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface QuestionItem {
  id: string;
  question: string;
  question_type: 'multiple_choice' | 'short_answer' | 'code_task';
  options?: QuestionOption[] | null;
  points: number;
  rubric?: any;
}

export interface Assessment {
  id: number;
  title: string;
  skill_id: number;
  skill_name: string;
  role_id?: number | null;
  difficulty: DifficultyLevel;
  assessment_type: string;
  time_limit_mins: number;
  passing_score: number;
  questions: QuestionItem[];
  created_at: string;
}

export interface QuestionEvaluation {
  question_id: string;
  is_correct: boolean;
  score: number;
  max_score: number;
  explanation: string;
  rubric_scores?: {
    criterion: string;
    score: number;
    max_score: number;
    feedback: string;
  }[] | null;
}

export interface AssessmentResult {
  attempt_id: number;
  assessment_id: number;
  skill_id: number;
  skill_name: string;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  evaluations: QuestionEvaluation[];
  feedback_summary: string;
  previous_status: CompetencyStatus;
  new_status: CompetencyStatus;
  new_proficiency_score: number;
  roadmap_updated: boolean;
  explanation: string;
  completed_at: string;
}

export interface RoadmapTask {
  id: number;
  roadmap_id: number;
  skill_id: number;
  skill_name: string;
  skill_slug: string;
  category: string;
  difficulty_level: DifficultyLevel;
  title: string;
  description: string;
  learning_objective: string;
  estimated_hours: number;
  status: TaskStatus;
  task_order: number;
  practical_exercise: string;
  assessment_criteria: string;
  resources: LearningResource[];
  is_prerequisite_satisfied: boolean;
  missing_prerequisites: string[];
  started_at?: string | null;
  completed_at?: string | null;
}

export interface Roadmap {
  id: number;
  user_id: number;
  target_role_id: number;
  target_role_title: string;
  title: string;
  status: string;
  explanation: string;
  total_hours: number;
  completed_hours: number;
  progress_percentage: number;
  tasks: RoadmapTask[];
  generated_at: string;
  updated_at: string;
}

export interface AuditEvent {
  id: number;
  event_type: string;
  reason: string;
  details: any;
  created_at: string;
}

export interface ExtractedSkillItem {
  raw_mention: string;
  normalized_skill_id?: number | null;
  normalized_skill_name?: string | null;
  category: string;
  evidence_type: string;
  evidence_snippet: string;
  confidence: number;
  suggested_status: CompetencyStatus;
  requires_assessment: boolean;
  user_confirmed: boolean;
}

export interface JobSkillComparison {
  skill_id: number;
  skill_name: string;
  category: string;
  importance_level: ImportanceLevel;
  user_status: CompetencyStatus;
  user_proficiency: number;
  gap_status: 'matched' | 'needs_practice' | 'missing_competency' | 'unassessed_claim';
  evidence_type: string;
  evidence_snippet?: string | null;
  recommendation: string;
}

export interface JobAnalysisResult {
  id?: number | null;
  title: string;
  company: string;
  analysis_type: string;
  summary: string;
  extracted_skills: ExtractedSkillItem[];
  comparisons: JobSkillComparison[];
  matched_skills_count: number;
  developing_skills_count: number;
  missing_skills_count: number;
  unassessed_mentions_count: number;
  overall_match_percentage: number;
  is_simulated_ai: boolean;
  ai_model_used: string;
}

export interface ProjectSubmission {
  id: number;
  user_id: number;
  roadmap_task_id?: number | null;
  skill_id: number;
  skill_name: string;
  title: string;
  description: string;
  repo_url: string;
  text_submission: string;
  rubric_score?: number | null;
  feedback: {
    summary?: string;
    rubric_scores?: { criterion: string; score: number; max_score: number; feedback: string }[];
    passed?: boolean;
  };
  status: 'draft' | 'submitted' | 'reviewed' | 'verified';
  submitted_at: string;
  reviewed_at?: string | null;
}

export interface DashboardStats {
  target_role: {
    id: number | null;
    title: string;
    category: string;
  };
  competencies: {
    demonstrated: number;
    developing: number;
    missing: number;
    unassessed: number;
    total_tracked: number;
  };
  assessments: {
    total_completed: number;
    average_percentage: number;
  };
  roadmap: {
    has_roadmap: boolean;
    roadmap_id: number | null;
    total_tasks: number;
    completed_tasks: number;
    total_hours: number;
    completed_hours: number;
    progress_percentage: number;
    next_task?: {
      id: number;
      title: string;
      skill_name: string;
      estimated_hours: number;
      status: string;
      learning_objective: string;
    } | null;
  };
}
