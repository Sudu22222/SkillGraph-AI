from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import User
from app.schemas.job_analysis import JobAnalysisRequest, JobAnalysisResultOut, ApplyExtractedSkillsRequest
from app.services.auth_service import get_optional_user, get_current_user
from app.services.job_analyzer import JobAnalyzerService

router = APIRouter(prefix="/job-analysis", tags=["Job Description & Resume Analysis"])

@router.post("/analyze-text", response_model=JobAnalysisResultOut)
def analyze_text(
    payload: JobAnalysisRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    if not payload.raw_text or len(payload.raw_text.strip()) < 20:
        raise HTTPException(
            status_code=400,
            detail="Submitted text is too short. Please provide a substantive job description or resume text."
        )

    user_id = current_user.id if current_user else None
    target_role_id = payload.target_role_id
    if not target_role_id and current_user and current_user.profile:
        target_role_id = current_user.profile.target_role_id

    analyzer = JobAnalyzerService(db)
    result = analyzer.analyze_document_or_text(
        raw_text=payload.raw_text,
        title=payload.title,
        company=payload.company or "",
        user_id=user_id,
        target_role_id=target_role_id,
        analysis_type=payload.analysis_type
    )
    return result

@router.post("/upload-document", response_model=JobAnalysisResultOut)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form("Uploaded Resume Analysis"),
    company: str = Form(""),
    analysis_type: str = Form("resume"),
    target_role_id: Optional[int] = Form(None),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    # Enforce file format and size limits (max 5MB)
    if not file.filename.lower().endswith((".pdf", ".txt", ".md")):
        raise HTTPException(
            status_code=400,
            detail="Supported formats are PDF (.pdf) and plain text (.txt, .md)."
        )

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 5MB limit.")

    analyzer = JobAnalyzerService(db)
    if file.filename.lower().endswith(".pdf"):
        try:
            extracted_text = analyzer.extract_text_from_pdf(contents)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse PDF document: {str(e)}")
    else:
        try:
            extracted_text = contents.decode("utf-8", errors="ignore")
        except Exception:
            raise HTTPException(status_code=400, detail="Could not decode text file.")

    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="No readable text found in uploaded document.")

    user_id = current_user.id if current_user else None
    if not target_role_id and current_user and current_user.profile:
        target_role_id = current_user.profile.target_role_id

    result = analyzer.analyze_document_or_text(
        raw_text=extracted_text,
        title=title or file.filename,
        company=company,
        user_id=user_id,
        target_role_id=target_role_id,
        analysis_type=analysis_type
    )
    return result

@router.post("/apply-skills")
def apply_extracted_skills(
    payload: ApplyExtractedSkillsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Applies user-reviewed skills to the student's profile.
    Enforces evidence distinction: resume mentions are saved as 'developing' or 'unassessed',
    never treated as demonstrated proof without assessment.
    """
    analyzer = JobAnalyzerService(db)
    skills_data = [item.model_dump() for item in payload.skills]
    applied_count = analyzer.apply_confirmed_skills(
        user_id=current_user.id,
        skills_to_apply=skills_data
    )
    return {
        "success": True,
        "applied_count": applied_count,
        "message": f"Successfully updated {applied_count} competencies in your profile."
    }
