def test_list_assessments(client):
    response = client.get("/api/v1/assessments/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3

def test_assessment_submission_and_scoring(client, auth_headers):
    # Fetch React assessment
    assessments = client.get("/api/v1/assessments/").json()
    react_assessment = next(a for a in assessments if "React" in a["title"])

    # Submit answers with correct answers for MCQs
    answers = {
        "q1": "a",
        "q2": "b",
        "q3": "a",
        "q4": "Use AbortController or an ignore boolean flag inside the cleanup function to cancel pending requests."
    }

    response = client.post(
        f"/api/v1/assessments/{react_assessment['id']}/submit",
        json={"assessment_id": react_assessment["id"], "answers": answers},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["passed"] is True
    assert data["percentage"] >= 70.0
    assert data["new_status"] == "demonstrated"
    assert len(data["evaluations"]) == 4

def test_assessment_history(client, auth_headers):
    response = client.get("/api/v1/assessments/attempts/history", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["passed"] is True
