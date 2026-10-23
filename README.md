# SkillGraph AI — Adaptive Skill Gap Intelligence
> **Understand your skills. Plan your next move.**  
> Evidence-based career skill analysis and adaptive learning plans for engineering students.

---

## 1. Overview & Core Purpose

Most career preparation and skill-assessment tools rely on simplistic keyword matching from resumes. This approach suffers from two severe flaws:
1. **Keyword mentions are conflated with demonstrated competence.** A candidate listing a technology on a resume is not necessarily proficient in it.
2. **Skill prerequisites are ignored.** Learning advanced concepts without mastering foundational requirements leads to frustration, gaps in understanding, and inefficient study schedules.

**SkillGraph AI** solves this through a principled, evidence-driven approach:
- **Interactive Directed Acyclic Graph (DAG):** Models skill prerequisites as strict dependencies with automatic cycle detection, topological sorting, and prerequisite-readiness indicators.
- **Adaptive Roadmap Engine:** Sequences personalized learning milestones that strictly respect prerequisite constraints, skip already-demonstrated competencies, and adapt to the student's weekly study commitment.
- **Evidence Distinction:** Differentiates between mere keyword mentions in resumes, self-reported claims, and verified competency proven through objective assessments or evaluated project submissions.
- **Deterministic & Rubric Scoring:** Combines automated deterministic grading for objective questions with transparent, visible rubrics for practical tasks and open-ended technical reasoning.
- **Explainability & Audit Trails:** Every recommendation, task reordering, and roadmap update provides human-readable explanations and persistent audit event logs.

---

## 2. Architecture & Tech Stack

```
                              ┌────────────────────────────────────────┐
                              │           SkillGraph AI Client         │
                              │  (React 19, TypeScript, Vite, Tailwind) │
                              │    React Flow Interactive DAG Canvas    │
                              └──────────────────┬─────────────────────┘
                                                 │ HTTP / REST (JWT)
                                                 ▼
                              ┌────────────────────────────────────────┐
                              │          FastAPI Backend Engine        │
                              │  - Auth & Access Control (bcrypt/JWT)  │
                              │  - Graph DAG Engine (NetworkX)         │
                              │  - Adaptive Roadmap Engine             │
                              │  - Job & Resume Parser (pypdf)         │
                              │  - Assessment & Rubric Engine          │
                              └──────┬───────────────────────────┬─────┘
                                     │                           │
                   SQLAlchemy Models │                           │ Google GenAI SDK /
                  & Alembic Migrations                           │ Deterministic Fallback
                                     ▼                           ▼
                     ┌───────────────────────────┐  ┌─────────────────────────┐
                     │   PostgreSQL / SQLite DB  │  │ Google Gemini 2.5 Flash │
                     │   (Users, Roles, Skills,  │  │  (Server-side strictly) │
                     │    Prereqs, Attempts)     │  └─────────────────────────┘
                     └───────────────────────────┘
```

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, `@xyflow/react` (React Flow), `lucide-react`.
- **Backend:** Python 3.11–3.13, FastAPI, Pydantic v2, SQLAlchemy 2.0, NetworkX, `pypdf`, `pyjwt`, `bcrypt`.
- **Database:** PostgreSQL (with SQLite zero-configuration local fallback) and Alembic migrations.
- **AI Integration:** Official Google GenAI SDK (`google-genai`) with configurable model name and transparent local deterministic fallback engine when API keys are not supplied.
- **Testing:** `pytest` (backend) and `vitest` / `@testing-library/react` (frontend).

---

## 3. Key Pages and Workflows

1. **Public Homepage (`/`):** Restrained, editorial design explaining the genuine problem, 5-step workflow, real feature examples, and zero fake marketing fluff.
2. **Authentication & Onboarding (`/auth/login`, `/auth/register`):** Secure password hashing (bcrypt), JWT sessions, academic background selection, study hours commitment, and pre-configured instant demo login (`demo@skillgraph.ai` / `password123`).
3. **Student Dashboard (`/dashboard`):** Real-time calculated metrics for demonstrated, developing, missing, and unassessed competencies; next recommended milestone; recent assessment logs.
4. **Interactive Skill Graph (`/graph`):** Zoomable DAG canvas using React Flow. Color-coded competency status, prerequisite-readiness badges, role filtering, slide-over detail drawer with official resources, and an accessible Table/List view.
5. **Adaptive Roadmap (`/roadmap`):** Topological milestone sequence with estimated durations, practical exercises, assessment criteria, verified documentation links, manual reordering validation, and recalculation triggers.
6. **Career Roles Library (`/roles`):** Curated career roles (Frontend, Backend, Full-Stack, Data Analyst, Python Developer, Cybersecurity Analyst) with role gap matrices.
7. **Job & Resume Analysis (`/job-analysis`):** Paste job postings or upload PDF resumes. AI extracts technical skills, matches against taxonomy aliases, and flags unassessed claims.
8. **Skill Assessments (`/assessments`, `/assessments/:id`):** Timed technical quizzes with MCQs, practical short-answer scenarios, transparent rubric criteria, and instant competency updates.
9. **Project Portfolio (`/projects`):** Submit practical code repositories and writeups evaluated against structured rubrics, requiring explicit user confirmation before updating competency.
10. **Analytics & Printable Report (`/analytics`):** Domain category distribution, before-and-after assessment comparison, and printable/PDF export.
11. **Settings (`/settings`):** Profile customization, weekly study hours adjustment, and server-side AI connection status inspection.

---

## 4. Local Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- Git

### Quick Setup Steps

#### 1. Clone the repository
```bash
git clone <repo-url>
cd NMITPW
```

#### 2. Backend Setup
```bash
# Create and activate virtual environment
python -m venv venv

# Windows:
.\venv\Scripts\Activate.ps1
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run database migrations (or the app auto-creates and seeds on startup)
python -m alembic upgrade head

# Start FastAPI server (runs on port 8000)
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

#### 3. Frontend Setup
```bash
# In a new terminal:
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 5. Instant Demo Credentials

For immediate evaluation without manual registration, a pre-populated demo student account is provided:
- **Email:** `demo@skillgraph.ai`
- **Password:** `password123`
- *Note:* A one-click **Autofill** button is provided directly on the Sign In page.

---

## 6. Running Tests & Benchmarks

### Backend Tests (`pytest`)
Executes all unit, integration, and cross-user data isolation tests:
```bash
$env:PYTHONPATH="backend"
.\venv\Scripts\pytest backend\tests -v
```
*Observed result:* **14 passed** in ~7 seconds.

### Frontend Tests (`vitest`)
Executes React component tests and DOM assertions:
```bash
cd frontend
npx vitest run
```
*Observed result:* **3 passed** across all test suites.

### Reproducible Benchmark Suite
Evaluates DAG latency, cycle detection, prerequisite integrity, skill extraction precision/recall, and roadmap sequencing:
```bash
$env:PYTHONPATH="backend"
.\venv\Scripts\python backend\evaluate_benchmark.py
```
*Measured Results:*
- **DAG Build Latency:** 13.30 ms
- **Cycle Detection:** 4.10 ms (0 cycles detected)
- **Topological Sort:** 2.93 ms (100% prerequisite integrity)
- **Roadmap Generation:** 89.92 ms
- **Skill Extraction Precision:** 100.0%

---

## 7. Environment Configuration (`.env`)

Refer to `.env.example`:
```ini
PROJECT_NAME="SkillGraph AI"
DATABASE_URL="sqlite:///./skillgraph.db"
# Production PostgreSQL:
# DATABASE_URL="postgresql+psycopg2://postgres:postgres@localhost:5432/skillgraph_db"

SECRET_KEY="replace-with-a-random-32-byte-hex-string-for-production"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Google Gemini API (leave blank for local deterministic engine)
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-2.5-flash"
```

---

## 8. Docker Deployment

A multi-container setup with PostgreSQL, FastAPI, and Nginx-served frontend is provided via `docker-compose.yml`:
```bash
docker-compose up --build -d
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

---

## 9. Security & Access Control

- **Server-Side API Keys:** Google Gemini API keys and database credentials never reach client-side JavaScript.
- **Authentication & Authorization:** Passwords hashed with `bcrypt`. Protected endpoints enforce JWT token validation and filter all queries by authenticated `user_id`.
- **Cross-User Data Isolation:** Tests verify that User A cannot read, alter, or reorder User B's roadmaps or submissions.
- **Sanitized Uploads:** Document uploads restrict file types to PDF and plain text, enforce a 5MB size limit, and treat document text strictly as untrusted input.

---

## 10. License
MIT License. Built for precision and academic empowerment.
