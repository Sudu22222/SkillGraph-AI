import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.main import app
from app.seed_data import seed_database
from app.models.entities import User
from app.services.auth_service import get_password_hash, create_access_token

TEST_DATABASE_URL = "sqlite:///./test_skillgraph.db"

test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    seed_database(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def auth_headers(client):
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "demo@skillgraph.ai").first()
    token = create_access_token(data={"sub": str(user.id), "email": user.email})
    db.close()
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def second_user_headers(client):
    db = TestingSessionLocal()
    user2 = User(
        email="second_user@skillgraph.ai",
        hashed_password=get_password_hash("password123"),
        full_name="Second User",
        role="student",
        is_active=True
    )
    db.add(user2)
    db.commit()
    db.refresh(user2)
    token = create_access_token(data={"sub": str(user2.id), "email": user2.email})
    db.close()
    return {"Authorization": f"Bearer {token}"}
