def test_cross_user_data_isolation(client, auth_headers, second_user_headers):
    # User 1 has their active roadmap
    r1 = client.get("/api/v1/roadmaps/active", headers=auth_headers).json()
    assert r1 is not None

    # User 2 generates their own roadmap
    r2 = client.post("/api/v1/roadmaps/generate", json={"role_id": 2}, headers=second_user_headers).json()
    assert r2["user_id"] != r1["user_id"]
    assert r2["id"] != r1["id"]

    # User 2 cannot modify User 1's tasks
    user1_task = r1["tasks"][0]
    unauthorized_attempt = client.patch(
        f"/api/v1/roadmaps/tasks/{user1_task['id']}/status",
        json={"status": "completed"},
        headers=second_user_headers
    )
    # Backend filters RoadmapTask by user_id, so returns 404 for another user's task
    assert unauthorized_attempt.status_code == 404

    # User 2 dashboard stats reflect only User 2's data
    stats2 = client.get("/api/v1/users/stats", headers=second_user_headers).json()
    stats1 = client.get("/api/v1/users/stats", headers=auth_headers).json()
    assert stats2["roadmap"]["roadmap_id"] == r2["id"]
    assert stats1["roadmap"]["roadmap_id"] == r1["id"]
