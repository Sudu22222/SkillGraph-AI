from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import User, UserProfile, CareerRole
from app.schemas.auth import UserRegister, UserLogin, Token
from app.schemas.user import UserOut
from app.services.auth_service import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(User).filter(User.email == user_in.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Validate target role if provided
    target_role_id = user_in.target_role_id
    if target_role_id:
        role = db.query(CareerRole).filter(CareerRole.id == target_role_id).first()
        if not role:
            target_role_id = None
    else:
        # Default to first role (Frontend Developer) if none chosen
        first_role = db.query(CareerRole).first()
        if first_role:
            target_role_id = first_role.id

    # Create user
    user = User(
        email=user_in.email.lower().strip(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name.strip(),
        role="student",
        is_active=True
    )
    db.add(user)
    db.flush()

    # Create profile
    profile = UserProfile(
        user_id=user.id,
        education_level=user_in.education_level or "Undergraduate",
        interests=[],
        target_role_id=target_role_id,
        weekly_study_hours=user_in.weekly_study_hours or 10,
        learning_style=user_in.learning_style or "hands_on",
        bio=""
    )
    db.add(profile)
    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": str(user.id), "email": user.email})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "target_role_id": profile.target_role_id
        }
    }

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email.lower().strip()).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is inactive."
        )

    token = create_access_token(data={"sub": str(user.id), "email": user.email})
    target_role_id = user.profile.target_role_id if user.profile else None

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "target_role_id": target_role_id
        }
    }

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
