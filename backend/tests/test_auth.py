def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "ai_engine" in data

def test_login_demo_user(client):
    response = client.post("/api/v1/auth/login", json={
        "email": "demo@skillgraph.ai",
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "demo@skillgraph.ai"

def test_register_new_user(client):
    response = client.post("/api/v1/auth/register", json={
        "email": "new_student@skillgraph.ai",
        "password": "securepassword123",
        "full_name": "Jordan Smith",
        "education_level": "Undergraduate",
        "weekly_study_hours": 15
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "new_student@skillgraph.ai"

def test_login_invalid_password(client):
    response = client.post("/api/v1/auth/login", json={
        "email": "demo@skillgraph.ai",
        "password": "wrongpassword"
    })
    assert response.status_code == 401

def test_protected_route_without_token(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
