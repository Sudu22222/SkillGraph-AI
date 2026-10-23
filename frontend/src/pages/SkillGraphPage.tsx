import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { SkillGraphResponse, CareerRole } from '../types';
import { SkillGraphFlow } from '../components/graph/SkillGraphFlow';
import { useAuth } from '../context/AuthContext';
import { Briefcase, AlertTriangle, ShieldCheck } from 'lucide-react';

interface SkillGraphPageProps {
  onTakeAssessment: (skillId: number) => void;
  onGoToRoadmap: () => void;
}

export const SkillGraphPage: React.FC<SkillGraphPageProps> = ({
  onTakeAssessment,
  onGoToRoadmap,
}) => {
  const { user } = useAuth();
  const [graphData, setGraphData] = useState<SkillGraphResponse | null>(null);
  const [roles, setRoles] = useState<CareerRole[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(
    user?.profile?.target_role_id || null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<CareerRole[]>('/roles/').then((data) => setRoles(data)).catch(() => {});
  }, []);

  const loadGraph = (roleId?: number | null) => {
    setLoading(true);
    const query = roleId ? `?role_id=${roleId}` : '';
    api
      .get<SkillGraphResponse>(`/graph/${query}`)
      .then((res) => setGraphData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadGraph(selectedRoleId);
  }, [selectedRoleId, user]);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? Number(e.target.value) : null;
    setSelectedRoleId(val);
  };

  return (
    <div className="space-y-4">
      {/* Top Description & Role Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Skill Dependency Graph (DAG)
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800">
              Strict Topological Order
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Directed prerequisite relationships validated against cycles. Nodes reflect your current competency evidence.
          </p>
        </div>

        {/* Role Highlight Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            Highlight Role:
          </label>
          <select
            value={selectedRoleId || ''}
            onChange={handleRoleChange}
            className="text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800 font-medium cursor-pointer focus:border-blue-600 focus:outline-hidden"
          >
            <option value="">All Skills (Unfiltered)</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cycle Detection Notification */}
      {graphData?.cycle_detected && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>
            Warning: Circular dependency detected in graph: {JSON.stringify(graphData.cycles)}. Topological sort temporarily falling back.
          </span>
        </div>
      )}

      {/* Legend & Instructions */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600 px-1 gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            Demonstrated (≥70%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            Developing (40-69%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            Missing Role Skill
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
            Unassessed
          </span>
        </div>
        <div className="text-slate-400 hidden lg:block">
          Click any skill node to view descriptions, official resources, and take assessments.
        </div>
      </div>

      {/* Flow Canvas */}
      {loading || !graphData ? (
        <div className="h-[550px] bg-slate-100 rounded-lg border border-slate-200 animate-pulse flex items-center justify-center text-xs text-slate-400">
          Calculating topological graph layout and dependencies...
        </div>
      ) : (
        <SkillGraphFlow
          graphData={graphData}
          onTakeAssessment={onTakeAssessment}
          onGoToRoadmap={onGoToRoadmap}
        />
      )}
    </div>
  );
};
