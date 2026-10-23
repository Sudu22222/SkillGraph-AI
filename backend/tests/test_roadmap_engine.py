def test_get_or_generate_active_roadmap(client, auth_headers):
    response = client.get("/api/v1/roadmaps/active", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data is not None
    assert "tasks" in data
    assert len(data["tasks"]) > 0
    assert data["target_role_title"] == "Frontend Developer"

def test_task_status_update(client, auth_headers):
    roadmap = client.get("/api/v1/roadmaps/active", headers=auth_headers).json()
    first_task = roadmap["tasks"][0]

    response = client.patch(
        f"/api/v1/roadmaps/tasks/{first_task['id']}/status",
        json={"status": "in_progress"},
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["new_status"] == "in_progress"

def test_audit_events_logged(client, auth_headers):
    response = client.get("/api/v1/roadmaps/audit-events", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
