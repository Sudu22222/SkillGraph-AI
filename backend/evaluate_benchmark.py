"""
SkillGraph AI — Reproducible Benchmark and Evaluation Suite
Executes real measurements on:
1. Skill extraction Precision & Recall on labeled test samples
2. Graph DAG cycle detection & Topological sort latency
3. Prerequisite sequence validity
4. Adaptive roadmap generation time
5. Deterministic vs Rubric grading accuracy
"""

import time
import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models.entities import Skill, SkillPrerequisite, CareerRole, User, UserProfile
from app.seed_data import seed_database
from app.services.graph_engine import GraphEngine
from app.services.job_analyzer import JobAnalyzerService
from app.services.roadmap_engine import RoadmapEngine
from app.services.assessment_engine import AssessmentEngine
from app.services.gemini_service import gemini_service

def run_benchmark():
    print("================================================================")
    print("   SKILLGRAPH AI — SYSTEM BENCHMARK & ACCURACY EVALUATION       ")
    print("================================================================")

    # 1. Setup isolated database
    engine = create_engine("sqlite:///:memory:")
    Session = sessionmaker(bind=engine)
    db = Session()
    Base.metadata.create_all(bind=engine)
    seed_database(db)

    # --- BENCHMARK 1: Graph DAG & Prerequisite Validity ---
    print("\n[TEST 1] Graph DAG Engine & Cycle Detection Performance")
    t0 = time.perf_counter()
    graph_engine = GraphEngine(db)
    G, skills, prereqs = graph_engine.build_skill_dag()
    dag_build_ms = (time.perf_counter() - t0) * 1000

    t0 = time.perf_counter()
    has_cycles, cycles = graph_engine.detect_cycles(G)
    cycle_check_ms = (time.perf_counter() - t0) * 1000

    t0 = time.perf_counter()
    topo_order = graph_engine.compute_topological_order(G)
    topo_sort_ms = (time.perf_counter() - t0) * 1000

    print(f"  • Total Canonical Skills in DAG: {len(skills)}")
    print(f"  • Total Prerequisite Edges: {len(prereqs)}")
    print(f"  • DAG Build Time: {dag_build_ms:.2f} ms")
    print(f"  • Cycle Detection Time: {cycle_check_ms:.2f} ms (Cycles Detected: {has_cycles})")
    print(f"  • Topological Sort Time: {topo_sort_ms:.2f} ms")
    assert not has_cycles, "Cycle detected in taxonomy DAG!"

    # Verify prerequisite integrity: for every edge (A -> B), A must appear before B
    order_idx = {nid: i for i, nid in enumerate(topo_order)}
    violations = 0
    for p in prereqs:
        if order_idx[p.prerequisite_skill_id] > order_idx[p.skill_id]:
            violations += 1
    print(f"  • Prerequisite Sequence Integrity: {100.0 if violations == 0 else 0.0}% ({violations} violations)")
    assert violations == 0

    # --- BENCHMARK 2: Labeled Skill Extraction Precision & Recall ---
    print("\n[TEST 2] Skill Extraction Precision & Recall on Ground-Truth Samples")
    labeled_samples = [
        {
            "text": "Seeking a Frontend Developer with React, TypeScript, HTML & Web Standards, and CSS layouts. Automated testing experience preferred.",
            "ground_truth_skills": {"React", "TypeScript", "HTML & Web Standards", "CSS & Modern Layouts", "Automated Testing & TDD"}
        },
        {
            "text": "Backend Engineer with extensive Python, FastAPI, and SQL experience. Must understand Docker, Redis, and REST API Design.",
            "ground_truth_skills": {"Python", "FastAPI", "SQL & Relational DBs", "Docker & Containers", "Redis & In-Memory Caching", "REST API Design"}
        },
        {
            "text": "Cybersecurity Analyst position requiring knowledge of Web Security & OWASP Top 10, Network Security, and Authentication with JWT.",
            "ground_truth_skills": {"Web Security & OWASP Top 10", "Network Security Fundamentals", "Authentication & OAuth/JWT"}
        }
    ]

    analyzer = JobAnalyzerService(db)
    total_true_positives = 0
    total_false_positives = 0
    total_false_negatives = 0
    t_start = time.perf_counter()

    for idx, sample in enumerate(labeled_samples):
        res = analyzer.analyze_document_or_text(sample["text"], title="Eval Sample")
        extracted_names = {
            item["normalized_skill_name"]
            for item in res["extracted_skills"]
            if item["normalized_skill_name"]
        }

        tp = len(extracted_names.intersection(sample["ground_truth_skills"]))
        fp = len(extracted_names.difference(sample["ground_truth_skills"]))
        fn = len(sample["ground_truth_skills"].difference(extracted_names))

        total_true_positives += tp
        total_false_positives += fp
        total_false_negatives += fn

    extraction_latency_ms = (time.perf_counter() - t_start) * 1000 / len(labeled_samples)
    precision = total_true_positives / (total_true_positives + total_false_positives) if (total_true_positives + total_false_positives) > 0 else 0.0
    recall = total_true_positives / (total_true_positives + total_false_negatives) if (total_true_positives + total_false_negatives) > 0 else 0.0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

    print(f"  • Average Extraction Latency: {extraction_latency_ms:.2f} ms/doc")
    print(f"  • Extraction Precision: {precision * 100:.1f}%")
    print(f"  • Extraction Recall: {recall * 100:.1f}%")
    print(f"  • F1 Score: {f1 * 100:.1f}%")

    # --- BENCHMARK 3: Adaptive Roadmap Sequencing Time & Integrity ---
    print("\n[TEST 3] Adaptive Roadmap Sequencing Engine")
    roadmap_engine = RoadmapEngine(db)
    demo_user = db.query(User).filter(User.email == "demo@skillgraph.ai").first()
    target_role = db.query(CareerRole).filter(CareerRole.slug == "frontend-developer").first()

    t0 = time.perf_counter()
    roadmap = roadmap_engine.generate_or_update_roadmap(
        user_id=demo_user.id,
        target_role_id=target_role.id,
        force_regenerate=True
    )
    roadmap_gen_ms = (time.perf_counter() - t0) * 1000

    print(f"  • Roadmap Generation Latency: {roadmap_gen_ms:.2f} ms")
    print(f"  • Scheduled Tasks Count: {len(roadmap.tasks)}")
    print(f"  • Total Planned Study Duration: {sum(t.estimated_hours for t in roadmap.tasks)} hours")

    # Verify task ordering respects prerequisite edges
    task_order_map = {t.skill_id: t.task_order for t in roadmap.tasks}
    prereq_violations = 0
    for p in prereqs:
        if p.prerequisite_skill_id in task_order_map and p.skill_id in task_order_map:
            if task_order_map[p.prerequisite_skill_id] > task_order_map[p.skill_id]:
                prereq_violations += 1

    print(f"  • Roadmap Prerequisite Sequencing Integrity: {100.0 if prereq_violations == 0 else 0.0}%")
    assert prereq_violations == 0

    # --- BENCHMARK 4: Deterministic vs Rubric Scoring ---
    print("\n[TEST 4] Objective & Rubric Assessment Evaluation")
    assessment_engine = AssessmentEngine(db)
    t0 = time.perf_counter()
    eval_result = assessment_engine.submit_and_evaluate(
        user_id=demo_user.id,
        assessment_id=1,
        answers={"q1": "a", "q2": "b", "q3": "a", "q4": "Use cleanup function with AbortController."}
    )
    eval_ms = (time.perf_counter() - t0) * 1000

    print(f"  • Evaluation Latency: {eval_ms:.2f} ms")
    print(f"  • Evaluated Score: {eval_result['percentage']}% ({eval_result['score']}/{eval_result['max_score']} pts)")
    print(f"  • Competency Transition: {eval_result['previous_status']} -> {eval_result['new_status']}")

    print("\n================================================================")
    print("   ALL BENCHMARK TESTS PASSED WITH 100% GRAPH INTEGRITY         ")
    print("================================================================")

if __name__ == "__main__":
    run_benchmark()
