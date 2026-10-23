import json
import logging
from typing import Dict, Any, List, Optional
from app.config import settings

logger = logging.getLogger("skillgraph.gemini")

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL or "gemini-2.5-flash"
        self._client = None
        if self.api_key and self.api_key.strip():
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Could not initialize official Google GenAI client: {e}")

    @property
    def is_live_ai_available(self) -> bool:
        return self._client is not None

    def analyze_text(
        self,
        raw_text: str,
        analysis_type: str = "job_description",
        known_skills: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Extracts skills, experience requirements, and evidence from job descriptions or resumes.
        Distinguishes mere resume mentions from verified competency.
        """
        if self.is_live_ai_available:
            try:
                prompt = f"""
You are an expert technical recruiter and skill taxonomist for SkillGraph AI.
Analyze the following {analysis_type}.
Extract technical skills, tools, frameworks, and architecture concepts mentioned.

CRITICAL INSTRUCTIONS:
1. Distinguish between a skill merely listed as a keyword ("resume_mention") vs demonstrated depth ("project_evidence", "hands_on_experience").
2. Do not assume keyword mentions prove proficiency.
3. Categorize each skill (Languages, Frameworks, Architecture, Databases, DevOps, Security, Fundamentals).
4. Provide the exact text snippet where the skill was referenced.

Text to analyze:
\"\"\"{raw_text[:4000]}\"\"\"

Return ONLY valid JSON with this schema:
{{
  "summary": "Concise 2-sentence summary of the text requirements or background",
  "extracted_skills": [
    {{
      "raw_mention": "Skill Name",
      "category": "Languages | Frameworks | Architecture | Databases | DevOps | Security",
      "evidence_type": "resume_mention | project_evidence | job_requirement",
      "evidence_snippet": "Exact quote from text",
      "confidence": 0.85,
      "suggested_status": "unassessed | developing | demonstrated"
    }}
  ]
}}
"""
                response = self._client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                )
                raw_content = response.text.strip()
                if raw_content.startswith("```json"):
                    raw_content = raw_content[7:]
                if raw_content.endswith("```"):
                    raw_content = raw_content[:-3]
                parsed = json.loads(raw_content.strip())
                parsed["is_simulated_ai"] = False
                parsed["ai_model_used"] = self.model_name
                return parsed
            except Exception as e:
                logger.warning(f"Gemini live call failed, using deterministic engine: {e}")

        # Deterministic High-Fidelity Fallback
        return self._deterministic_skill_extraction(raw_text, analysis_type, known_skills)

    def _deterministic_skill_extraction(
        self,
        text: str,
        analysis_type: str,
        known_skills: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Grounded taxonomy keyword matcher with sentence context extraction."""
        lower_text = text.lower()
        extracted = []
        
        # Default skill dictionary if not provided
        taxonomy = known_skills or [
            {"name": "Python", "category": "Languages", "aliases": ["python3", "py"]},
            {"name": "JavaScript", "category": "Languages", "aliases": ["js", "es6"]},
            {"name": "TypeScript", "category": "Languages", "aliases": ["ts"]},
            {"name": "React", "category": "Frameworks", "aliases": ["reactjs", "react.js"]},
            {"name": "FastAPI", "category": "Frameworks", "aliases": ["fast-api"]},
            {"name": "Node.js", "category": "Frameworks", "aliases": ["nodejs", "node"]},
            {"name": "SQL & Relational DBs", "category": "Databases", "aliases": ["sql", "postgres", "postgresql", "mysql"]},
            {"name": "REST API Design", "category": "Architecture", "aliases": ["rest", "restful", "api design"]},
            {"name": "Git & Version Control", "category": "DevOps", "aliases": ["git", "github", "gitlab"]},
            {"name": "Docker & Containers", "category": "DevOps", "aliases": ["docker", "containerization"]},
            {"name": "Web Security & OWASP", "category": "Security", "aliases": ["security", "owasp", "xss", "csrf"]},
            {"name": "Data Structures & Algorithms", "category": "Fundamentals", "aliases": ["dsa", "algorithms", "data structures"]},
            {"name": "System Design", "category": "Architecture", "aliases": ["system design", "distributed systems", "scalability"]},
            {"name": "Automated Testing", "category": "DevOps", "aliases": ["testing", "pytest", "unit test", "jest", "tdd"]},
            {"name": "Pandas & Data Wrangling", "category": "Databases", "aliases": ["pandas", "numpy", "data analysis"]},
        ]

        sentences = [s.strip() for s in text.replace("\n", ". ").split(".") if s.strip()]

        for item in taxonomy:
            name = item["name"]
            category = item.get("category", "General")
            aliases = [name.lower()] + [a.lower() for a in item.get("aliases", [])]

            matched = False
            snippet = ""
            for alias in aliases:
                # Word boundary check
                if f" {alias} " in f" {lower_text} " or f"({alias})" in lower_text or f"/{alias}/" in lower_text:
                    matched = True
                    # Find snippet
                    for s in sentences:
                        if alias in s.lower():
                            snippet = s[:180]
                            break
                    break

            if matched:
                has_project_evidence = any(w in snippet.lower() for w in ["built", "developed", "architected", "implemented", "deployed", "scaled"])
                evidence_type = "project_evidence" if has_project_evidence else ("job_requirement" if analysis_type == "job_description" else "resume_mention")
                suggested_status = "demonstrated" if has_project_evidence else "unassessed"
                confidence = 0.92 if has_project_evidence else 0.75

                extracted.append({
                    "raw_mention": name,
                    "category": category,
                    "evidence_type": evidence_type,
                    "evidence_snippet": snippet or f"Mentioned in submitted {analysis_type} document.",
                    "confidence": confidence,
                    "suggested_status": suggested_status
                })

        summary = (
            f"Extracted {len(extracted)} relevant competencies from {analysis_type}. "
            f"Explicit project evidence detected for {sum(1 for e in extracted if e['evidence_type'] == 'project_evidence')} competencies. "
            f"Remaining mentions flagged as unassessed claims awaiting verification."
        )

        return {
            "summary": summary,
            "extracted_skills": extracted,
            "is_simulated_ai": True,
            "ai_model_used": "local-deterministic-engine"
        }

    def generate_assessment_questions(
        self,
        skill_name: str,
        category: str,
        difficulty: str = "intermediate"
    ) -> Dict[str, Any]:
        """Generates role-specific questions and rubrics with deterministic answer keys."""
        if self.is_live_ai_available:
            try:
                prompt = f"""
Generate an assessment for the skill '{skill_name}' (Category: {category}, Difficulty: {difficulty}).
Provide 3 multiple-choice questions (with 4 options and 1 correct answer index 0-3) and 1 short-answer/practical question with an evaluation rubric.

Return ONLY valid JSON matching this schema:
{{
  "title": "{skill_name} Competency Assessment",
  "questions": [
    {{
      "id": "q1",
      "question": "Question text",
      "question_type": "multiple_choice",
      "options": [{{"id": "a", "text": "Option A"}}, {{"id": "b", "text": "Option B"}}, {{"id": "c", "text": "Option C"}}, {{"id": "d", "text": "Option D"}}],
      "correct_option_id": "a",
      "explanation": "Why option A is correct",
      "points": 25
    }},
    {{
      "id": "q4",
      "question": "Practical scenario question",
      "question_type": "short_answer",
      "points": 25,
      "explanation": "Key points expected in student answer",
      "rubric": {{
        "criteria": [
          {{"name": "Technical Correctness", "max_points": 10, "description": "Accurately applies core concepts"}},
          {{"name": "Practical Application", "max_points": 10, "description": "Addresses real-world edge cases"}},
          {{"name": "Clarity & Terminology", "max_points": 5, "description": "Uses precise domain terms"}}
        ]
      }}
    }}
  ]
}}
"""
                response = self._client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                )
                raw = response.text.strip()
                if raw.startswith("```json"):
                    raw = raw[7:]
                if raw.endswith("```"):
                    raw = raw[:-3]
                parsed = json.loads(raw.strip())
                parsed["is_simulated_ai"] = False
                parsed["ai_model_used"] = self.model_name
                return parsed
            except Exception as e:
                logger.warning(f"Live Gemini question generation failed, falling back: {e}")

        # Deterministic questions based on skill
        return self._deterministic_questions(skill_name, category, difficulty)

    def _deterministic_questions(self, skill_name: str, category: str, difficulty: str) -> Dict[str, Any]:
        """Provides verified, high-quality domain questions for core competencies."""
        # Predefined rich banks for popular skills
        banks = {
            "React": [
                {
                    "id": "q1",
                    "question": "What is the primary motivation for React's virtual DOM reconciliation algorithm?",
                    "question_type": "multiple_choice",
                    "options": [
                        {"id": "a", "text": "Minimizing expensive real DOM tree mutations through diffing batch operations"},
                        {"id": "b", "text": "Allowing direct synchronous access to browser layout rendering threads"},
                        {"id": "c", "text": "Compiling JSX code into native machine assembly at runtime"},
                        {"id": "d", "text": "Replacing CSS stylesheet parsing inside the browser engine"}
                    ],
                    "correct_option_id": "a",
                    "explanation": "Virtual DOM reconciliation computes the minimal set of real DOM mutations needed, mitigating costly browser reflows.",
                    "points": 25
                },
                {
                    "id": "q2",
                    "question": "When should the `useCallback` hook be applied in a performance-critical component?",
                    "question_type": "multiple_choice",
                    "options": [
                        {"id": "a", "text": "For every single inline function defined inside any functional component"},
                        {"id": "b", "text": "When passing stable callback references to memoized children to prevent unnecessary re-renders"},
                        {"id": "c", "text": "To replace Redux actions in global asynchronous data flows"},
                        {"id": "d", "text": "Only inside custom React hooks that trigger window resize listeners"}
                    ],
                    "correct_option_id": "b",
                    "explanation": "useCallback caches function references, useful when passed to React.memo child components or dependency arrays.",
                    "points": 25
                },
                {
                    "id": "q3",
                    "question": "In React 18+, what is the purpose of concurrent features like `useTransition`?",
                    "question_type": "multiple_choice",
                    "options": [
                        {"id": "a", "text": "Prioritizing urgent user inputs (typing, clicking) over non-urgent background UI updates"},
                        {"id": "b", "text": "Running React component renders across multiple Web Workers"},
                        {"id": "c", "text": "Converting synchronous state into indexedDB storage automatically"},
                        {"id": "d", "text": "Disabling the component lifecycle during server-side rendering"}
                    ],
                    "correct_option_id": "a",
                    "explanation": "Transitions let you mark state updates as non-urgent so urgent interactions like keyboard strokes remain responsive.",
                    "points": 25
                },
                {
                    "id": "q4",
                    "question": "Explain how you would handle race conditions when fetching data inside a `useEffect` hook upon prop changes.",
                    "question_type": "short_answer",
                    "points": 25,
                    "explanation": "Use an `ignore` boolean flag or an `AbortController` in the cleanup function to prevent stale responses from overwriting current state.",
                    "rubric": {
                        "criteria": [
                            {"name": "Cleanup Mechanism", "max_points": 10, "description": "Mentions boolean flag or AbortController in useEffect cleanup"},
                            {"name": "State Integrity", "max_points": 10, "description": "Explains avoiding setting state on unmounted or stale request"},
                            {"name": "Clarity & Detail", "max_points": 5, "description": "Clear technical explanation with code concept"}
                        ]
                    }
                }
            ],
            "SQL & Relational DBs": [
                {
                    "id": "q1",
                    "question": "What is the primary difference between `WHERE` and `HAVING` clauses in SQL?",
                    "question_type": "multiple_choice",
                    "options": [
                        {"id": "a", "text": "WHERE filters rows before aggregation; HAVING filters aggregated groups created by GROUP BY"},
                        {"id": "b", "text": "HAVING only works on indexed columns, whereas WHERE works on non-indexed columns"},
                        {"id": "c", "text": "WHERE can only be used with SELECT statements; HAVING is used in UPDATE statements"},
                        {"id": "d", "text": "They are completely interchangeable syntactical aliases in modern ANSI SQL"}
                    ],
                    "correct_option_id": "a",
                    "explanation": "WHERE filters input rows prior to aggregation; HAVING evaluates condition predicates on aggregated groups.",
                    "points": 25
                },
                {
                    "id": "q2",
                    "question": "Under what condition will a B-tree index on `(last_name, first_name)` NOT be utilized by the query planner?",
                    "question_type": "multiple_choice",
                    "options": [
                        {"id": "a", "text": "A query filtering strictly on `WHERE first_name = 'Alice'` without specifying `last_name`"},
                        {"id": "b", "text": "A query filtering on both `WHERE last_name = 'Smith' AND first_name = 'Alice'`"},
                        {"id": "c", "text": "A query filtering only on `WHERE last_name = 'Smith'`"},
                        {"id": "d", "text": "A query using `ORDER BY last_name, first_name`"}
                    ],
                    "correct_option_id": "a",
                    "explanation": "Composite B-tree indexes require query conditions to match the leftmost prefix of index columns.",
                    "points": 25
                },
                {
                    "id": "q3",
                    "question": "Which transaction isolation level eliminates Non-Repeatable Reads but may still permit Phantom Reads under ANSI SQL-92?",
                    "question_type": "multiple_choice",
                    "options": [
                        {"id": "a", "text": "Repeatable Read"},
                        {"id": "b", "text": "Read Committed"},
                        {"id": "c", "text": "Read Uncommitted"},
                        {"id": "d", "text": "Serializable"}
                    ],
                    "correct_option_id": "a",
                    "explanation": "Repeatable Read guarantees rows read cannot change during transaction, but new matching rows (phantoms) could appear.",
                    "points": 25
                },
                {
                    "id": "q4",
                    "question": "Explain the N+1 query problem in Object-Relational Mappers (ORMs) and describe two strategies to resolve it.",
                    "question_type": "short_answer",
                    "points": 25,
                    "explanation": "N+1 happens when loading a collection executes 1 query for parents and N subsequent queries for children. Resolved via Eager Loading (JOIN / selectinload) or batch subqueries.",
                    "rubric": {
                        "criteria": [
                            {"name": "Problem Definition", "max_points": 10, "description": "Clearly explains 1 query for parent + N queries for children"},
                            {"name": "Resolution Strategies", "max_points": 10, "description": "Identifies eager loading (JOINs / subqueryload) and batch fetching"},
                            {"name": "Impact Explanation", "max_points": 5, "description": "Explains latency and database connection overhead"}
                        ]
                    }
                }
            ]
        }

        # Generic generator for other skills
        if skill_name in banks:
            questions = banks[skill_name]
        else:
            questions = [
                {
                    "id": "q1",
                    "question": f"What is a fundamental architectural best practice when working with {skill_name} in production?",
                    "question_type": "multiple_choice",
                    "options": [
                        {"id": "a", "text": f"Enforcing modular separation of concerns and clear interface contracts for {skill_name}"},
                        {"id": "b", "text": "Disabling error boundaries and validation to maximize execution speed"},
                        {"id": "c", "text": "Hardcoding configuration values directly into source files"},
                        {"id": "d", "text": "Avoiding automated unit and integration tests"}
                    ],
                    "correct_option_id": "a",
                    "explanation": f"Modular design and clean contracts are key to maintainable {skill_name} systems.",
                    "points": 25
                },
                {
                    "id": "q2",
                    "question": f"When troubleshooting a performance regression in {skill_name}, what should be the initial step?",
                    "question_type": "multiple_choice",
                    "options": [
                        {"id": "a", "text": "Instrumenting metrics and profiling before applying speculative optimizations"},
                        {"id": "b", "text": "Immediately rewriting the entire codebase in another language"},
                        {"id": "c", "text": "Restarting the production servers without collecting diagnostic logs"},
                        {"id": "d", "text": "Increasing memory allocation without analyzing resource utilization"}
                    ],
                    "correct_option_id": "a",
                    "explanation": "Profiling and evidence-based measurement avoid premature optimization.",
                    "points": 25
                },
                {
                    "id": "q3",
                    "question": f"How does error handling in {skill_name} ensure system reliability?",
                    "question_type": "multiple_choice",
                    "options": [
                        {"id": "a", "text": "By catching exceptions at domain boundaries and returning structured, actionable errors"},
                        {"id": "b", "text": "By swallowing all errors silently to avoid alerting end users"},
                        {"id": "c", "text": "By crashing the entire process upon every unexpected input"},
                        {"id": "d", "text": "By logging sensitive passwords to stdout during failure"}
                    ],
                    "correct_option_id": "a",
                    "explanation": "Structured boundary error handling preserves stability and diagnostic capability.",
                    "points": 25
                },
                {
                    "id": "q4",
                    "question": f"Describe a practical scenario where you implemented or would implement {skill_name}. What challenges arose and how did you resolve them?",
                    "question_type": "short_answer",
                    "points": 25,
                    "explanation": f"Should describe real architecture, tradeoffs, challenges, and concrete solutions using {skill_name}.",
                    "rubric": {
                        "criteria": [
                            {"name": "Domain Depth", "max_points": 10, "description": f"Demonstrates genuine knowledge of {skill_name} concepts"},
                            {"name": "Problem & Tradeoffs", "max_points": 10, "description": "Addresses concrete engineering challenges and tradeoffs"},
                            {"name": "Clarity & Detail", "max_points": 5, "description": "Articulate, well-structured technical response"}
                        ]
                    }
                }
            ]

        return {
            "title": f"{skill_name} Proficiency Assessment",
            "questions": questions,
            "is_simulated_ai": True,
            "ai_model_used": "local-deterministic-engine"
        }

    def evaluate_short_answer(
        self,
        question: str,
        user_answer: str,
        expected_explanation: str,
        rubric: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Evaluates an open-ended answer against transparent rubric criteria."""
        if not user_answer or len(user_answer.strip()) < 10:
            return {
                "score": 0.0,
                "max_score": 25.0,
                "is_correct": False,
                "feedback": "Answer was too brief or empty to evaluate demonstrated competency.",
                "rubric_scores": [
                    {"criterion": c.get("name", "Standard"), "score": 0.0, "max_score": c.get("max_points", 10), "feedback": "No substantive response provided."}
                    for c in rubric.get("criteria", [])
                ]
            }

        if self.is_live_ai_available:
            try:
                prompt = f"""
Evaluate the student's answer to this technical assessment question:
Question: {question}
Expected Key Points: {expected_explanation}
Student's Answer: {user_answer}

Rubric: {json.dumps(rubric)}

Return ONLY valid JSON matching this schema:
{{
  "score": 20.0,
  "max_score": 25.0,
  "is_correct": true,
  "feedback": "Constructive 1-2 sentence feedback on strengths and gaps",
  "rubric_scores": [
    {{"criterion": "Criterion Name", "score": 8.0, "max_score": 10.0, "feedback": "Specific feedback"}}
  ]
}}
"""
                response = self._client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                )
                raw = response.text.strip()
                if raw.startswith("```json"):
                    raw = raw[7:]
                if raw.endswith("```"):
                    raw = raw[:-3]
                parsed = json.loads(raw.strip())
                return parsed
            except Exception as e:
                logger.warning(f"Live Gemini rubric evaluation failed, using deterministic evaluation: {e}")

        # Deterministic Rubric Evaluator based on keywords and length
        criteria = rubric.get("criteria", [
            {"name": "Technical Correctness", "max_points": 10},
            {"name": "Practical Application", "max_points": 10},
            {"name": "Clarity & Detail", "max_points": 5}
        ])

        total_max = sum(c.get("max_points", 10) for c in criteria)
        words = user_answer.strip().split()
        word_count = len(words)

        # Keyword match against expected explanation
        expected_keywords = [w.lower().strip(".,;:()") for w in expected_explanation.split() if len(w) > 4]
        user_words = set(w.lower().strip(".,;:()") for w in words)
        matches = [k for k in expected_keywords if k in user_words]
        match_ratio = min(1.0, len(matches) / max(3, len(expected_keywords) * 0.4))

        length_factor = min(1.0, word_count / 30.0)
        quality_score = (match_ratio * 0.6) + (length_factor * 0.4)

        rubric_scores = []
        earned_total = 0.0
        for crit in criteria:
            max_pts = crit.get("max_points", 10)
            pts = round(max_pts * quality_score, 1)
            earned_total += pts
            rubric_scores.append({
                "criterion": crit.get("name", "Standard"),
                "score": pts,
                "max_score": max_pts,
                "feedback": f"Demonstrated {round(quality_score * 100)}% alignment with technical expectations."
            })

        is_correct = (earned_total / total_max) >= 0.6
        feedback = (
            f"Solid response covering key principles ({word_count} words). "
            f"Included {len(matches)} core technical concept markers."
            if is_correct else
            f"Partially addressed the question. Include more specific implementation details and edge case considerations."
        )

        return {
            "score": earned_total,
            "max_score": total_max,
            "is_correct": is_correct,
            "feedback": feedback,
            "rubric_scores": rubric_scores
        }

gemini_service = GeminiService()
