from sqlalchemy.orm import Session
from app.models.entities import (
    User,
    UserProfile,
    CareerRole,
    Skill,
    SkillAlias,
    RoleSkillRequirement,
    SkillPrerequisite,
    LearningResource,
    Assessment,
    UserSkillEvidence
)
from app.services.auth_service import get_password_hash
from datetime import datetime

def seed_database(db: Session):
    # Check if already seeded
    if db.query(CareerRole).first():
        return

    print("Seeding SkillGraph AI taxonomy, roles, prerequisites, resources, and assessments...")

    # 1. CAREER ROLES
    roles_data = [
        {
            "title": "Frontend Developer",
            "slug": "frontend-developer",
            "category": "Frontend Engineering",
            "description": "Designs and develops responsive, accessible, high-performance user interfaces using modern web technologies, component architectures, and client-side state management."
        },
        {
            "title": "Backend Developer",
            "slug": "backend-developer",
            "category": "Backend Engineering",
            "description": "Architects resilient server-side applications, high-throughput APIs, relational and distributed database schemas, caching layers, and background processing systems."
        },
        {
            "title": "Full-Stack Developer",
            "slug": "full-stack-developer",
            "category": "Full-Stack Engineering",
            "description": "Bridges user interface engineering and distributed server systems, managing end-to-end features from database optimization to frontend user experience and deployment."
        },
        {
            "title": "Data Analyst",
            "slug": "data-analyst",
            "category": "Data & Analytics",
            "description": "Transforms raw transactional and analytical datasets into actionable operational intelligence through statistical modeling, data wrangling, and interactive dashboards."
        },
        {
            "title": "Python Developer",
            "slug": "python-developer",
            "category": "Software Engineering",
            "description": "Builds scalable backend services, automation suites, asynchronous pipelines, and data-intensive applications leveraging Python's rich ecosystem."
        },
        {
            "title": "Cybersecurity Analyst",
            "slug": "cybersecurity-analyst",
            "category": "Information Security",
            "description": "Protects digital infrastructure through threat modeling, vulnerability assessments, security architecture analysis, and defensive protocol enforcement."
        }
    ]

    roles = {}
    for r in roles_data:
        role = CareerRole(**r)
        db.add(role)
        db.flush()
        roles[r["slug"]] = role

    # 2. SKILLS
    skills_data = [
        # Languages
        {"name": "HTML & Web Standards", "slug": "html-web-standards", "category": "Languages", "difficulty_level": "beginner", "description": "Semantic markup, DOM hierarchy, web accessibility (WCAG), and responsive layout structure.", "is_core": True},
        {"name": "CSS & Modern Layouts", "slug": "css-modern-layouts", "category": "Languages", "difficulty_level": "beginner", "description": "Flexbox, CSS Grid, custom properties, responsive design patterns, and browser rendering optimization.", "is_core": True},
        {"name": "JavaScript (ES6+)", "slug": "javascript-es6", "category": "Languages", "difficulty_level": "beginner", "description": "Modern JavaScript syntax, closures, promises, async/await, event loop, and DOM manipulation.", "is_core": True},
        {"name": "TypeScript", "slug": "typescript", "category": "Languages", "difficulty_level": "intermediate", "description": "Static typing, interfaces, generics, utility types, and strict type checking for scalable applications.", "is_core": True},
        {"name": "Python", "slug": "python", "category": "Languages", "difficulty_level": "beginner", "description": "Python data structures, object-oriented programming, generators, decorators, and package management.", "is_core": True},
        {"name": "SQL & Relational DBs", "slug": "sql-relational-dbs", "category": "Databases", "difficulty_level": "beginner", "description": "DDL, DML, complex JOINs, aggregation, subqueries, transactions, and relational algebra.", "is_core": True},
        
        # Frameworks
        {"name": "React", "slug": "react", "category": "Frameworks", "difficulty_level": "intermediate", "description": "Component lifecycle, functional hooks, virtual DOM reconciliation, state management, and custom hooks.", "is_core": True},
        {"name": "Next.js & SSR", "slug": "nextjs-ssr", "category": "Frameworks", "difficulty_level": "advanced", "description": "Server-side rendering, static site generation, API routes, App Router, and caching strategies.", "is_core": False},
        {"name": "FastAPI", "slug": "fastapi", "category": "Frameworks", "difficulty_level": "intermediate", "description": "High-performance Python ASGI web framework, Pydantic type validation, and automated OpenAPI documentation.", "is_core": True},
        {"name": "Node.js & Express", "slug": "nodejs-express", "category": "Frameworks", "difficulty_level": "intermediate", "description": "Event-driven asynchronous I/O, middleware patterns, HTTP request routing, and npm package ecosystems.", "is_core": True},
        {"name": "Django", "slug": "django", "category": "Frameworks", "difficulty_level": "intermediate", "description": "Batteries-included web framework, ORM, admin dashboard, authentication, and migrations.", "is_core": False},

        # Architecture & Design
        {"name": "REST API Design", "slug": "rest-api-design", "category": "Architecture", "difficulty_level": "intermediate", "description": "Resource-oriented URI design, HTTP verbs, status codes, idempotency, versioning, and payload modeling.", "is_core": True},
        {"name": "GraphQL APIs", "slug": "graphql-apis", "category": "Architecture", "difficulty_level": "advanced", "description": "Schema definition language, query resolvers, mutations, subscriptions, and preventing N+1 query overfetching.", "is_core": False},
        {"name": "System Design & Scalability", "slug": "system-design", "category": "Architecture", "difficulty_level": "advanced", "description": "Load balancing, horizontal scaling, caching strategies, rate limiting, and CAP theorem trade-offs.", "is_core": True},
        {"name": "Microservices Architecture", "slug": "microservices", "category": "Architecture", "difficulty_level": "advanced", "description": "Service boundaries, asynchronous event-driven messaging, service discovery, and circuit breakers.", "is_core": False},

        # Databases & Caching
        {"name": "Relational Data Modeling", "slug": "relational-data-modeling", "category": "Databases", "difficulty_level": "intermediate", "description": "Database normalization (1NF-3NF), foreign keys, entity-relationship diagrams, and ACID semantics.", "is_core": True},
        {"name": "Database Indexing & Query Tuning", "slug": "database-indexing-tuning", "category": "Databases", "difficulty_level": "advanced", "description": "B-tree vs hash indexes, composite index prefixes, EXPLAIN query execution plans, and deadlocks.", "is_core": True},
        {"name": "PostgreSQL Administration", "slug": "postgresql-administration", "category": "Databases", "difficulty_level": "intermediate", "description": "Connection pooling, vacuuming, WAL replication, extensions (pg_stat_statements), and role security.", "is_core": False},
        {"name": "Redis & In-Memory Caching", "slug": "redis-caching", "category": "Databases", "difficulty_level": "intermediate", "description": "Key-value caching, TTL eviction policies, Pub/Sub channels, session storage, and rate limiting.", "is_core": True},

        # DevOps & Tooling
        {"name": "Git & Version Control", "slug": "git-version-control", "category": "DevOps", "difficulty_level": "beginner", "description": "Branching workflows, rebasing, merge conflict resolution, interactive staging, and pull requests.", "is_core": True},
        {"name": "Linux Command Line", "slug": "linux-cli", "category": "DevOps", "difficulty_level": "beginner", "description": "Bash scripting, file permissions (chmod/chown), process inspection, systemd, and SSH authentication.", "is_core": True},
        {"name": "Docker & Containers", "slug": "docker-containers", "category": "DevOps", "difficulty_level": "intermediate", "description": "Dockerfile authoring, multi-stage builds, container networking, volumes, and docker-compose orchestration.", "is_core": True},
        {"name": "CI/CD Pipelines", "slug": "ci-cd-pipelines", "category": "DevOps", "difficulty_level": "intermediate", "description": "Automated build/test workflows, GitHub Actions, semantic versioning, and continuous delivery.", "is_core": False},
        {"name": "Kubernetes Basics", "slug": "kubernetes-basics", "category": "DevOps", "difficulty_level": "advanced", "description": "Pods, Deployments, Services, ConfigMaps, Ingress controllers, and automated pod restarts.", "is_core": False},

        # Security
        {"name": "Web Security & OWASP Top 10", "slug": "web-security-owasp", "category": "Security", "difficulty_level": "intermediate", "description": "XSS, SQL injection, CSRF mitigation, Content Security Policy (CSP), and secure headers.", "is_core": True},
        {"name": "Authentication & OAuth/JWT", "slug": "auth-jwt-oauth", "category": "Security", "difficulty_level": "intermediate", "description": "Password hashing (bcrypt/argon2), stateless JWT signing, token rotation, OAuth2 authorization grants.", "is_core": True},
        {"name": "Network Security Fundamentals", "slug": "network-security", "category": "Security", "difficulty_level": "intermediate", "description": "TCP/IP protocol stack, DNS resolution, TLS 1.3 handshake, firewalls, and VPC networking.", "is_core": True},

        # Data & Analytics
        {"name": "Data Structures & Algorithms", "slug": "data-structures-algorithms", "category": "Fundamentals", "difficulty_level": "intermediate", "description": "Time/space complexity (Big-O), arrays, hash maps, trees, graphs, sorting, and binary search.", "is_core": True},
        {"name": "Pandas & Data Wrangling", "slug": "pandas-data-wrangling", "category": "Data & Analytics", "difficulty_level": "intermediate", "description": "DataFrames, filtering, group-by aggregations, missing data imputation, and tabular transformations.", "is_core": True},
        {"name": "Data Visualization & Dashboards", "slug": "data-visualization", "category": "Data & Analytics", "difficulty_level": "intermediate", "description": "Chart selection, Matplotlib, Seaborn, interactive visual analytics, and metric communication.", "is_core": False},
        {"name": "Statistical Analysis", "slug": "statistical-analysis", "category": "Data & Analytics", "difficulty_level": "intermediate", "description": "Hypothesis testing, p-values, regression analysis, correlation, and distribution analysis.", "is_core": False},
        {"name": "Automated Testing & TDD", "slug": "automated-testing", "category": "DevOps", "difficulty_level": "intermediate", "description": "Unit testing with pytest/vitest, mock objects, integration test suites, and test coverage metrics.", "is_core": True}
    ]

    skills = {}
    for s in skills_data:
        skill = Skill(**s)
        db.add(skill)
        db.flush()
        skills[s["slug"]] = skill

    # 3. SKILL ALIASES
    aliases_data = [
        ("html-web-standards", ["html", "html5", "semantic html"]),
        ("css-modern-layouts", ["css", "css3", "flexbox", "css grid", "tailwind"]),
        ("javascript-es6", ["javascript", "js", "ecmascript", "es6"]),
        ("typescript", ["ts", "typescript"]),
        ("python", ["python3", "py", "python"]),
        ("sql-relational-dbs", ["sql", "mysql", "postgres", "postgresql", "sqlite"]),
        ("react", ["reactjs", "react.js", "react"]),
        ("nextjs-ssr", ["next.js", "nextjs", "next"]),
        ("fastapi", ["fast-api", "fastapi"]),
        ("nodejs-express", ["node", "nodejs", "express", "expressjs"]),
        ("django", ["django", "django-rest-framework", "drf"]),
        ("rest-api-design", ["rest", "restful", "api design", "rest api"]),
        ("docker-containers", ["docker", "dockerfile", "containerization"]),
        ("git-version-control", ["git", "github", "gitlab", "version control"]),
        ("web-security-owasp", ["security", "owasp", "xss", "csrf", "appsec"]),
        ("auth-jwt-oauth", ["jwt", "oauth", "oauth2", "authentication", "auth"]),
        ("data-structures-algorithms", ["dsa", "algorithms", "data structures", "leetcode"]),
        ("pandas-data-wrangling", ["pandas", "numpy", "data wrangling", "data analysis"]),
        ("redis-caching", ["redis", "caching", "cache"]),
        ("system-design", ["system design", "distributed systems", "scalability"]),
        ("automated-testing", ["testing", "unit test", "pytest", "jest", "vitest", "tdd"]),
    ]

    for slug, alias_list in aliases_data:
        if slug in skills:
            for alias in alias_list:
                db.add(SkillAlias(skill_id=skills[slug].id, alias=alias))

    # 4. PREREQUISITES (Strict DAG - NO CYCLES)
    prereqs_data = [
        # (prerequisite_slug, dependent_slug, type)
        ("html-web-standards", "css-modern-layouts", "mandatory"),
        ("html-web-standards", "javascript-es6", "mandatory"),
        ("javascript-es6", "typescript", "mandatory"),
        ("javascript-es6", "react", "mandatory"),
        ("javascript-es6", "nodejs-express", "mandatory"),
        ("react", "nextjs-ssr", "mandatory"),
        ("python", "fastapi", "mandatory"),
        ("python", "django", "mandatory"),
        ("python", "pandas-data-wrangling", "mandatory"),
        ("pandas-data-wrangling", "data-visualization", "recommended"),
        ("pandas-data-wrangling", "statistical-analysis", "recommended"),
        ("sql-relational-dbs", "relational-data-modeling", "mandatory"),
        ("relational-data-modeling", "database-indexing-tuning", "mandatory"),
        ("relational-data-modeling", "postgresql-administration", "recommended"),
        ("rest-api-design", "fastapi", "recommended"),
        ("rest-api-design", "graphql-apis", "recommended"),
        ("rest-api-design", "microservices", "mandatory"),
        ("linux-cli", "docker-containers", "mandatory"),
        ("docker-containers", "kubernetes-basics", "mandatory"),
        ("git-version-control", "ci-cd-pipelines", "mandatory"),
        ("automated-testing", "ci-cd-pipelines", "recommended"),
        ("web-security-owasp", "auth-jwt-oauth", "mandatory"),
        ("system-design", "microservices", "mandatory"),
        ("relational-data-modeling", "system-design", "recommended"),
        ("redis-caching", "system-design", "recommended")
    ]

    for prereq_slug, dep_slug, rel_type in prereqs_data:
        if prereq_slug in skills and dep_slug in skills:
            db.add(SkillPrerequisite(
                skill_id=skills[dep_slug].id,
                prerequisite_skill_id=skills[prereq_slug].id,
                relationship_type=rel_type
            ))

    # 5. ROLE TO SKILL REQUIREMENTS
    role_skills_map = {
        "frontend-developer": [
            ("html-web-standards", "mandatory", "intermediate", 1.0),
            ("css-modern-layouts", "mandatory", "intermediate", 1.0),
            ("javascript-es6", "mandatory", "advanced", 1.2),
            ("react", "mandatory", "intermediate", 1.2),
            ("typescript", "mandatory", "intermediate", 1.1),
            ("rest-api-design", "recommended", "intermediate", 0.8),
            ("git-version-control", "mandatory", "intermediate", 0.9),
            ("automated-testing", "recommended", "intermediate", 0.7),
            ("nextjs-ssr", "optional", "beginner", 0.5)
        ],
        "backend-developer": [
            ("python", "mandatory", "intermediate", 1.1),
            ("sql-relational-dbs", "mandatory", "advanced", 1.2),
            ("fastapi", "mandatory", "intermediate", 1.1),
            ("rest-api-design", "mandatory", "advanced", 1.2),
            ("relational-data-modeling", "mandatory", "intermediate", 1.0),
            ("database-indexing-tuning", "recommended", "intermediate", 0.9),
            ("auth-jwt-oauth", "mandatory", "intermediate", 1.0),
            ("docker-containers", "mandatory", "intermediate", 0.9),
            ("git-version-control", "mandatory", "intermediate", 0.8),
            ("redis-caching", "recommended", "intermediate", 0.8),
            ("system-design", "recommended", "intermediate", 0.9)
        ],
        "full-stack-developer": [
            ("javascript-es6", "mandatory", "advanced", 1.1),
            ("typescript", "mandatory", "intermediate", 1.0),
            ("react", "mandatory", "intermediate", 1.1),
            ("python", "mandatory", "intermediate", 1.0),
            ("fastapi", "mandatory", "intermediate", 1.0),
            ("sql-relational-dbs", "mandatory", "intermediate", 1.1),
            ("rest-api-design", "mandatory", "intermediate", 1.0),
            ("docker-containers", "recommended", "intermediate", 0.8),
            ("auth-jwt-oauth", "mandatory", "intermediate", 0.9),
            ("git-version-control", "mandatory", "intermediate", 0.8)
        ],
        "data-analyst": [
            ("sql-relational-dbs", "mandatory", "advanced", 1.3),
            ("python", "mandatory", "intermediate", 1.1),
            ("pandas-data-wrangling", "mandatory", "advanced", 1.2),
            ("data-visualization", "mandatory", "intermediate", 1.0),
            ("statistical-analysis", "mandatory", "intermediate", 1.0),
            ("relational-data-modeling", "recommended", "intermediate", 0.8),
            ("git-version-control", "recommended", "beginner", 0.6)
        ],
        "python-developer": [
            ("python", "mandatory", "advanced", 1.3),
            ("sql-relational-dbs", "mandatory", "intermediate", 1.0),
            ("fastapi", "mandatory", "intermediate", 1.1),
            ("data-structures-algorithms", "mandatory", "intermediate", 1.0),
            ("rest-api-design", "mandatory", "intermediate", 0.9),
            ("docker-containers", "recommended", "intermediate", 0.8),
            ("automated-testing", "mandatory", "intermediate", 1.0),
            ("git-version-control", "mandatory", "intermediate", 0.8)
        ],
        "cybersecurity-analyst": [
            ("web-security-owasp", "mandatory", "advanced", 1.3),
            ("network-security", "mandatory", "advanced", 1.2),
            ("auth-jwt-oauth", "mandatory", "intermediate", 1.1),
            ("linux-cli", "mandatory", "intermediate", 1.0),
            ("python", "recommended", "intermediate", 0.9),
            ("sql-relational-dbs", "recommended", "intermediate", 0.8),
            ("git-version-control", "recommended", "beginner", 0.6)
        ]
    }

    for role_slug, req_list in role_skills_map.items():
        if role_slug in roles:
            role_obj = roles[role_slug]
            for skill_slug, imp, prof, weight in req_list:
                if skill_slug in skills:
                    db.add(RoleSkillRequirement(
                        role_id=role_obj.id,
                        skill_id=skills[skill_slug].id,
                        importance_level=imp,
                        required_proficiency=prof,
                        weight=weight
                    ))

    # 6. VERIFIED OFFICIAL LEARNING RESOURCES
    resources_data = [
        ("html-web-standards", "MDN: HTML Basics & Semantic Elements", "https://developer.mozilla.org/en-US/docs/Learn/HTML", "official_docs", "MDN Web Docs", 120, "beginner", "Official browser reference for semantic structure and accessible document outlines."),
        ("css-modern-layouts", "MDN: CSS Grid and Flexbox Guide", "https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout", "official_docs", "MDN Web Docs", 180, "intermediate", "Comprehensive guide to responsive two-dimensional grid and flexible box alignment."),
        ("javascript-es6", "MDN: JavaScript Language Overview", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", "official_docs", "MDN Web Docs", 240, "intermediate", "In-depth guide to asynchronous programming, scope, and prototype inheritance."),
        ("typescript", "TypeScript Handbook: The Basics", "https://www.typescriptlang.org/docs/handbook/intro.html", "official_docs", "TypeScript Team", 180, "intermediate", "Official guide to static typing, interfaces, and union discrimination in JavaScript."),
        ("react", "React.dev: Quick Start & Describing the UI", "https://react.dev/learn", "official_docs", "React Team", 200, "intermediate", "Modern official documentation covering component lifecycle, state hooks, and pure functions."),
        ("fastapi", "FastAPI Tutorial: User Guide", "https://fastapi.tiangolo.com/tutorial/", "official_docs", "FastAPI", 180, "intermediate", "Step-by-step official guide to typed Python endpoints, validation, and dependency injection."),
        ("python", "Python 3 Documentation: Official Tutorial", "https://docs.python.org/3/tutorial/", "official_docs", "Python Software Foundation", 240, "beginner", "Authoritative guide covering data structures, modules, classes, and standard libraries."),
        ("sql-relational-dbs", "PostgreSQL: The SQL Language Tutorial", "https://www.postgresql.org/docs/current/tutorial-sql.html", "official_docs", "PostgreSQL Global Development Group", 210, "beginner", "Core relational queries, schema creation, transactions, and aggregate groupings."),
        ("rest-api-design", "RFC 9110: HTTP Semantics", "https://www.rfc-editor.org/rfc/rfc9110.html", "reference", "IETF", 150, "intermediate", "Standard specification for HTTP methods, headers, status codes, and idempotency rules."),
        ("docker-containers", "Docker Docs: Get Started Guide", "https://docs.docker.com/get-started/", "official_docs", "Docker Inc.", 160, "intermediate", "Building portable images, orchestrating multi-container services, and isolating runtime environments."),
        ("git-version-control", "Pro Git Book: Git Basics", "https://git-scm.com/book/en/v2", "official_docs", "Git Project", 120, "beginner", "Comprehensive reference on staging mechanics, branching, rebasing, and remote synchronization."),
        ("web-security-owasp", "OWASP Top Ten Web Application Security Risks", "https://owasp.org/www-project-top-ten/", "official_docs", "OWASP Foundation", 180, "intermediate", "Industry standard awareness document for developers to avoid critical vulnerabilities.")
    ]

    for s_slug, title, url, r_type, provider, mins, diff, rationale in resources_data:
        if s_slug in skills:
            db.add(LearningResource(
                skill_id=skills[s_slug].id,
                title=title,
                url=url,
                resource_type=r_type,
                provider=provider,
                estimated_mins=mins,
                difficulty=diff,
                rationale=rationale
            ))

    # 7. CURATED ASSESSMENTS FOR POPULAR SKILLS
    assessments_seed = [
        {
            "title": "React Functional Components & Hooks Assessment",
            "skill_slug": "react",
            "difficulty": "intermediate",
            "assessment_type": "quiz",
            "time_limit_mins": 15,
            "passing_score": 70,
            "questions_data": [
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
            ]
        },
        {
            "title": "SQL & Relational Query Mastery Assessment",
            "skill_slug": "sql-relational-dbs",
            "difficulty": "intermediate",
            "assessment_type": "quiz",
            "time_limit_mins": 15,
            "passing_score": 70,
            "questions_data": [
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
        },
        {
            "title": "Python Architecture & Asynchronous Design",
            "skill_slug": "python",
            "difficulty": "intermediate",
            "assessment_type": "quiz",
            "time_limit_mins": 15,
            "passing_score": 70,
            "questions_data": [
                {
                    "id": "q1",
                    "question": "How does Python's Global Interpreter Lock (GIL) influence multi-threaded execution?",
                    "question_type": "multiple_choice",
                    "options": [
                        {"id": "a", "text": "It restricts bytecode execution to one native thread at a time per interpreter process"},
                        {"id": "b", "text": "It prevents network I/O from running asynchronously in asyncio loops"},
                        {"id": "c", "text": "It disables garbage collection during multi-process multiprocessing"},
                        {"id": "d", "text": "It forces all local variables to be stored in thread-safe heap allocations"}
                    ],
                    "correct_option_id": "a",
                    "explanation": "The GIL ensures memory safety in CPython by synchronizing thread access to Python objects, meaning CPU-bound threads do not scale in parallel across multiple cores.",
                    "points": 25
                },
                {
                    "id": "q2",
                    "question": "What is the memory and performance benefit of using a generator expression over a list comprehension?",
                    "question_type": "multiple_choice",
                    "options": [
                        {"id": "a", "text": "Generators evaluate items lazily yielding one item at a time, requiring O(1) memory overhead"},
                        {"id": "b", "text": "Generators automatically parallelize item calculation across CPU threads"},
                        {"id": "c", "text": "Generators compile into C extensions using Cython automatically"},
                        {"id": "d", "text": "Generators allow random index-based lookups faster than lists"}
                    ],
                    "correct_option_id": "a",
                    "explanation": "Generators compute values on-demand using iterator protocols, avoiding allocating full lists in memory.",
                    "points": 25
                },
                {
                    "id": "q3",
                    "question": "In Python object-oriented programming, when should `__slots__` be declared on a class?",
                    "question_type": "multiple_choice",
                    "options": [
                        {"id": "a", "text": "When creating millions of lightweight instances to prevent dynamic `__dict__` memory allocation"},
                        {"id": "b", "text": "To make class methods private and uncallable from subclasses"},
                        {"id": "c", "text": "To serialize instances directly to JSON without an encoder"},
                        {"id": "d", "text": "Only when implementing abstract base classes in the `abc` module"}
                    ],
                    "correct_option_id": "a",
                    "explanation": "__slots__ reserves space for a fixed set of attributes, saving significant memory by omitting the default per-instance __dict__.",
                    "points": 25
                },
                {
                    "id": "q4",
                    "question": "Describe the difference between concurrency using `asyncio` (coroutines) vs parallelism using `multiprocessing` in Python.",
                    "question_type": "short_answer",
                    "points": 25,
                    "explanation": "asyncio is cooperative single-threaded concurrency ideal for I/O-bound tasks. multiprocessing spawns distinct OS processes with separate memory spaces and GILs, ideal for CPU-bound computations.",
                    "rubric": {
                        "criteria": [
                            {"name": "Asyncio Context", "max_points": 10, "description": "Explains cooperative single-threaded event loop for I/O-bound operations"},
                            {"name": "Multiprocessing Context", "max_points": 10, "description": "Explains separate OS processes bypassing the GIL for CPU-bound work"},
                            {"name": "Trade-offs", "max_points": 5, "description": "Mentions IPC communication overhead vs async simplicity"}
                        ]
                    }
                }
            ]
        }
    ]

    for a_data in assessments_seed:
        slug = a_data["skill_slug"]
        if slug in skills:
            db.add(Assessment(
                title=a_data["title"],
                skill_id=skills[slug].id,
                difficulty=a_data["difficulty"],
                assessment_type=a_data["assessment_type"],
                time_limit_mins=a_data["time_limit_mins"],
                passing_score=a_data["passing_score"],
                questions_data=a_data["questions_data"]
            ))

    # 8. DEFAULT SEED USER (for immediate evaluation)
    demo_user = User(
        email="demo@skillgraph.ai",
        hashed_password=get_password_hash("password123"),
        full_name="Alex Chen",
        role="student",
        is_active=True
    )
    db.add(demo_user)
    db.flush()

    # User profile
    fe_role = roles["frontend-developer"]
    demo_profile = UserProfile(
        user_id=demo_user.id,
        education_level="Undergraduate",
        interests=["Web Development", "Component Systems", "Full-Stack"],
        target_role_id=fe_role.id,
        weekly_study_hours=12,
        learning_style="hands_on",
        bio="Junior software engineering student preparing for frontend and full-stack engineering roles."
    )
    db.add(demo_profile)
    db.flush()

    # Pre-seed realistic initial evidence for demo user
    # 2 demonstrated, 1 developing, others unassessed
    initial_evidence = [
        (skills["html-web-standards"].id, "demonstrated", 92.0, "assessment", "Completed HTML Semantic Structure assessment with 92%."),
        (skills["css-modern-layouts"].id, "demonstrated", 85.0, "assessment", "Completed Modern Layouts & Flexbox assessment with 85%."),
        (skills["javascript-es6"].id, "developing", 64.0, "resume_mention", "Demonstrated basic ES6 usage in portfolio project; flagged for assessment verification.")
    ]

    for s_id, status, score, ev_type, summ in initial_evidence:
        db.add(UserSkillEvidence(
            user_id=demo_user.id,
            skill_id=s_id,
            status=status,
            proficiency_score=score,
            evidence_type=ev_type,
            evidence_summary=summ,
            verified_at=datetime.utcnow() if status == "demonstrated" else None
        ))

    db.commit()
    print("Seed data completed successfully!")
