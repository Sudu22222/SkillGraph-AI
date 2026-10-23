from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import entities  # ensure models are registered
from app.seed_data import seed_database

# Routers
from app.routers import (
    auth,
    users,
    roles,
    skills,
    graph,
    job_analysis,
    assessments,
    roadmaps,
    projects,
    analytics,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    
    # Run database seed
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Adaptive Skill Gap Intelligence — Evidence-based career skill analysis and adaptive learning plans.",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API V1 routers
v1_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=v1_prefix)
app.include_router(users.router, prefix=v1_prefix)
app.include_router(roles.router, prefix=v1_prefix)
app.include_router(skills.router, prefix=v1_prefix)
app.include_router(graph.router, prefix=v1_prefix)
app.include_router(job_analysis.router, prefix=v1_prefix)
app.include_router(assessments.router, prefix=v1_prefix)
app.include_router(roadmaps.router, prefix=v1_prefix)
app.include_router(projects.router, prefix=v1_prefix)
app.include_router(analytics.router, prefix=v1_prefix)

@app.get("/api/health")
def health_check():
    from app.services.gemini_service import gemini_service
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "connected",
        "ai_engine": {
            "live_gemini": gemini_service.is_live_ai_available,
            "model": gemini_service.model_name if gemini_service.is_live_ai_available else "local-deterministic-engine"
        }
    }
