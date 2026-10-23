def test_skill_graph_dag_no_cycles(client, auth_headers):
    response = client.get("/api/v1/graph/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["cycle_detected"] is False
    assert len(data["cycles"]) == 0
    assert len(data["nodes"]) >= 30
    assert len(data["edges"]) >= 20
    assert len(data["topological_order"]) >= 30

def test_prerequisite_readiness_logic(client, auth_headers):
    response = client.get("/api/v1/graph/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    
    # In seed data, Demo user has HTML & CSS demonstrated, but JS is developing
    nodes_by_label = {n["label"]: n for n in data["nodes"]}
    
    # HTML has 0 prerequisites, so it should be ready
    assert "HTML & Web Standards" in nodes_by_label
    assert nodes_by_label["HTML & Web Standards"]["is_prerequisite_ready"] is True

    # CSS depends on HTML. Since HTML is demonstrated, CSS is satisfied
    assert "CSS & Modern Layouts" in nodes_by_label
    assert nodes_by_label["CSS & Modern Layouts"]["status"] == "demonstrated"
