from typing import List, Dict, Any, Tuple, Optional
import networkx as nx
from sqlalchemy.orm import Session
from app.models.entities import Skill, SkillPrerequisite, UserSkillEvidence, RoleSkillRequirement

class GraphEngine:
    def __init__(self, db: Session):
        self.db = db

    def build_skill_dag(self, role_id: Optional[int] = None) -> Tuple[nx.DiGraph, List[Skill], List[SkillPrerequisite]]:
        """
        Builds a NetworkX DiGraph where:
        - Nodes are skill IDs
        - Directed edge (A -> B) means skill A is a prerequisite for skill B.
        """
        G = nx.DiGraph()
        
        all_skills = self.db.query(Skill).all()
        for skill in all_skills:
            G.add_node(
                skill.id,
                name=skill.name,
                slug=skill.slug,
                category=skill.category,
                difficulty=skill.difficulty_level,
                is_core=skill.is_core
            )

        prereqs = self.db.query(SkillPrerequisite).all()
        for p in prereqs:
            # prerequisite_skill_id must be learned BEFORE skill_id
            G.add_edge(
                p.prerequisite_skill_id,
                p.skill_id,
                relationship_type=p.relationship_type,
                id=p.id
            )

        return G, all_skills, prereqs

    def detect_cycles(self, G: nx.DiGraph) -> Tuple[bool, List[List[str]]]:
        """Detects circular dependencies in the skill graph."""
        try:
            cycles = list(nx.simple_cycles(G))
            if cycles:
                # Map IDs to skill names
                named_cycles = []
                for cycle in cycles:
                    named_cycle = [G.nodes[n].get("name", str(n)) for n in cycle]
                    named_cycles.append(named_cycle)
                return True, named_cycles
            return False, []
        except Exception:
            return False, []

    def compute_topological_order(self, G: nx.DiGraph) -> List[int]:
        """Returns valid learning order of skill IDs respecting prerequisites."""
        if not nx.is_directed_acyclic_graph(G):
            # Fallback to in-degree sorted order if cycle exists
            return sorted(G.nodes(), key=lambda n: G.in_degree(n))
        return list(nx.topological_sort(G))

    def compute_node_layers_and_positions(self, G: nx.DiGraph, skills: List[Skill]) -> Dict[int, Dict[str, float]]:
        """
        Calculates neat (x, y) coordinates for React Flow.
        Uses topological generation / longest path from root nodes to determine horizontal tier (X),
        and distributes nodes vertically within each tier (Y).
        """
        positions = {}
        if not G.nodes:
            return positions

        # If graph has cycles, break them temporarily for layout
        H = G.copy()
        if not nx.is_directed_acyclic_graph(H):
            feedback_edges = []
            for cycle in nx.simple_cycles(H):
                if len(cycle) >= 2:
                    feedback_edges.append((cycle[-1], cycle[0]))
            H.remove_edges_from(feedback_edges)

        # Calculate longest distance from any root (in-degree 0)
        levels: Dict[int, int] = {}
        roots = [n for n in H.nodes if H.in_degree(n) == 0]
        
        for root in roots:
            levels[root] = 0
            
        try:
            for node in nx.topological_sort(H):
                current_level = levels.get(node, 0)
                for successor in H.successors(node):
                    levels[successor] = max(levels.get(successor, 0), current_level + 1)
        except Exception:
            # Fallback level assignment by difficulty
            diff_map = {"beginner": 0, "intermediate": 1, "advanced": 2}
            for n in H.nodes:
                diff = H.nodes[n].get("difficulty", "intermediate")
                levels[n] = diff_map.get(diff, 1)

        # Group nodes by level
        level_groups: Dict[int, List[int]] = {}
        for node, lvl in levels.items():
            level_groups.setdefault(lvl, []).append(node)

        # Distribute coordinates:
        # X: level * 340 + 60
        # Y: index_in_level * 140 + 60
        for lvl, node_list in level_groups.items():
            # Sort within level by category for aesthetic grouping
            node_list_sorted = sorted(node_list, key=lambda n: G.nodes[n].get("category", ""))
            total_in_level = len(node_list_sorted)
            y_start = max(40, (600 - (total_in_level * 130)) // 2) if total_in_level < 5 else 40
            
            for idx, node in enumerate(node_list_sorted):
                positions[node] = {
                    "x": float(lvl * 340 + 60),
                    "y": float(y_start + idx * 140)
                }

        return positions

    def get_skill_graph_for_user(
        self,
        user_id: Optional[int],
        role_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Returns full graph payload with user competency statuses, prerequisite readiness,
        and role requirements for React Flow visualization.
        """
        G, skills, prereqs = self.build_skill_dag(role_id)
        has_cycles, cycles = self.detect_cycles(G)
        topo_order = self.compute_topological_order(G)
        positions = self.compute_node_layers_and_positions(G, skills)

        # Fetch user evidence if user_id is provided
        user_evidence_map: Dict[int, UserSkillEvidence] = {}
        if user_id:
            evidence_records = self.db.query(UserSkillEvidence).filter(
                UserSkillEvidence.user_id == user_id
            ).all()
            for ev in evidence_records:
                user_evidence_map[ev.skill_id] = ev

        # Fetch role requirements if role_id is provided
        role_req_map: Dict[int, RoleSkillRequirement] = {}
        if role_id:
            role_reqs = self.db.query(RoleSkillRequirement).filter(
                RoleSkillRequirement.role_id == role_id
            ).all()
            for rr in role_reqs:
                role_req_map[rr.skill_id] = rr

        # Build nodes
        nodes = []
        demonstrated_count = 0
        developing_count = 0
        missing_count = 0
        unassessed_count = 0
        ready_to_learn_count = 0

        for skill in skills:
            ev = user_evidence_map.get(skill.id)
            status = ev.status if ev else "unassessed"
            score = ev.proficiency_score if ev else 0.0
            ev_type = ev.evidence_type if ev else "unassessed"

            if status == "demonstrated":
                demonstrated_count += 1
            elif status == "developing":
                developing_count += 1
            elif status == "missing":
                missing_count += 1
            else:
                unassessed_count += 1

            # Check prerequisite readiness:
            # All mandatory prerequisites must be "demonstrated" or score >= 70
            prereq_edges = [p for p in prereqs if p.skill_id == skill.id and p.relationship_type == "mandatory"]
            is_ready = True
            missing_prereqs = []
            for pe in prereq_edges:
                p_ev = user_evidence_map.get(pe.prerequisite_skill_id)
                p_status = p_ev.status if p_ev else "unassessed"
                p_score = p_ev.proficiency_score if p_ev else 0.0
                if p_status != "demonstrated" and p_score < 70.0:
                    is_ready = False
                    p_skill = next((s for s in skills if s.id == pe.prerequisite_skill_id), None)
                    if p_skill:
                        missing_prereqs.append(p_skill.name)

            if is_ready and status != "demonstrated":
                ready_to_learn_count += 1

            role_req = role_req_map.get(skill.id)
            is_role_req = role_req is not None
            role_importance = role_req.importance_level if role_req else None

            pos = positions.get(skill.id, {"x": 100.0, "y": 100.0})

            nodes.append({
                "id": str(skill.id),
                "skill_id": skill.id,
                "label": skill.name,
                "slug": skill.slug,
                "category": skill.category,
                "difficulty": skill.difficulty_level,
                "status": status,
                "proficiency_score": score,
                "is_prerequisite_ready": is_ready,
                "missing_prerequisites": missing_prereqs,
                "evidence_type": ev_type,
                "is_role_required": is_role_req,
                "role_importance": role_importance,
                "position": pos
            })

        # Build edges
        edges = []
        for p in prereqs:
            source_ev = user_evidence_map.get(p.prerequisite_skill_id)
            is_satisfied = bool(source_ev and (source_ev.status == "demonstrated" or source_ev.proficiency_score >= 70.0))

            edges.append({
                "id": f"e{p.prerequisite_skill_id}-{p.skill_id}",
                "source": str(p.prerequisite_skill_id),
                "target": str(p.skill_id),
                "relationship_type": p.relationship_type,
                "is_satisfied": is_satisfied
            })

        return {
            "nodes": nodes,
            "edges": edges,
            "cycle_detected": has_cycles,
            "cycles": cycles,
            "topological_order": [str(nid) for nid in topo_order],
            "total_skills": len(skills),
            "demonstrated_count": demonstrated_count,
            "developing_count": developing_count,
            "missing_count": missing_count,
            "unassessed_count": unassessed_count,
            "ready_to_learn_count": ready_to_learn_count,
        }
