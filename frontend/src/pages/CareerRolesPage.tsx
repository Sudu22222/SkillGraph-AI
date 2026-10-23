import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CareerRole, RoleGapSummary } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Layers,
} from 'lucide-react';

interface CareerRolesPageProps {
  onGoToRoadmap: () => void;
  onGoToGraph: (roleId: number) => void;
}

export const CareerRolesPage: React.FC<CareerRolesPageProps> = ({
  onGoToRoadmap,
  onGoToGraph,
}) => {
  const { user, updateProfile } = useAuth();
  const [roles, setRoles] = useState<CareerRole[]>([]);
  const [selectedRoleDetail, setSelectedRoleDetail] = useState<RoleGapSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [switchingRoleId, setSwitchingRoleId] = useState<number | null>(null);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const data = await api.get<CareerRole[]>('/roles/');
      setRoles(data);
    } catch {}
    finally {
      setLoading(false);
    }
  };

  const handleInspectGap = async (roleId: number) => {
    try {
      const gap = await api.get<RoleGapSummary>(`/roles/${roleId}/gap-analysis`);
      setSelectedRoleDetail(gap);
    } catch {}
  };

  const handleSetTargetRole = async (roleId: number) => {
    setSwitchingRoleId(roleId);
    try {
      await updateProfile({ target_role_id: roleId });
      // Generate roadmap for this new role
      await api.post('/roadmaps/generate', { role_id: roleId });
      onGoToRoadmap();
    } catch {
      alert('Failed to set target role.');
    } finally {
      setSwitchingRoleId(null);
    }
  };

  const currentRoleId = user?.profile?.target_role_id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          Curated Career Role Library
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Select a verified target role to align your skill graph and calculate an adaptive dependency roadmap.
        </p>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => {
          const isTarget = currentRoleId === role.id;

          return (
            <div
              key={role.id}
              className={`bg-white border rounded-lg p-5 shadow-2xs flex flex-col justify-between transition-all ${
                isTarget ? 'border-blue-600 ring-1 ring-blue-500/30' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <span className="font-semibold uppercase tracking-wider text-slate-400">
                    {role.category}
                  </span>
                  {isTarget && (
                    <span className="px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-800 text-[10px] uppercase">
                      Current Target
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1.5">
                  {role.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                  {role.description}
                </p>

                <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-4 pt-2 border-t border-slate-100">
                  <span>{role.total_skills_count} total skills</span>
                  <span>•</span>
                  <span>{role.mandatory_skills_count} mandatory</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleInspectGap(role.id)}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded text-xs font-medium transition-colors cursor-pointer"
                >
                  Inspect Role Gap Matrix
                </button>

                {!isTarget ? (
                  <button
                    onClick={() => handleSetTargetRole(role.id)}
                    disabled={switchingRoleId === role.id}
                    className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-medium shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {switchingRoleId === role.id
                        ? 'Sequencing Roadmap...'
                        : 'Set as Active Target Role'}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={onGoToRoadmap}
                    className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-medium shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>View Active Roadmap</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Role Gap Detail Modal */}
      {selectedRoleDetail && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Role Gap Analysis
                </span>
                <h3 className="font-bold text-base text-slate-900">
                  {selectedRoleDetail.role_title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRoleDetail(null)}
                className="text-slate-400 hover:text-slate-700 font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4">
              {/* Coverage stats */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200">
                  <div className="text-[10px] text-emerald-800 uppercase font-semibold">
                    Demonstrated
                  </div>
                  <div className="text-lg font-bold text-emerald-900">
                    {selectedRoleDetail.demonstrated_count}
                  </div>
                </div>
                <div className="p-2.5 rounded bg-amber-50 border border-amber-200">
                  <div className="text-[10px] text-amber-800 uppercase font-semibold">
                    Developing
                  </div>
                  <div className="text-lg font-bold text-amber-900">
                    {selectedRoleDetail.developing_count}
                  </div>
                </div>
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200">
                  <div className="text-[10px] text-rose-800 uppercase font-semibold">
                    Missing Gaps
                  </div>
                  <div className="text-lg font-bold text-rose-900">
                    {selectedRoleDetail.missing_count}
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-100 border border-slate-200">
                  <div className="text-[10px] text-slate-700 uppercase font-semibold">
                    Match %
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {selectedRoleDetail.match_percentage}%
                  </div>
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="overflow-x-auto border border-slate-200 rounded">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase font-semibold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Skill</th>
                      <th className="px-3 py-2">Importance</th>
                      <th className="px-3 py-2">Required Level</th>
                      <th className="px-3 py-2">Your Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedRoleDetail.skills_breakdown.map((s) => (
                      <tr key={s.skill_id}>
                        <td className="px-3 py-2 font-medium text-slate-900">
                          {s.skill_name}
                        </td>
                        <td className="px-3 py-2 uppercase text-[10px] font-semibold text-slate-600">
                          {s.importance_level}
                        </td>
                        <td className="px-3 py-2 capitalize text-slate-600">
                          {s.required_proficiency}
                        </td>
                        <td className="px-3 py-2 capitalize font-medium">
                          {s.user_status === 'demonstrated' ? (
                            <span className="text-emerald-700">Demonstrated</span>
                          ) : s.user_status === 'developing' ? (
                            <span className="text-amber-700">Developing</span>
                          ) : s.user_status === 'missing' ? (
                            <span className="text-rose-700">Missing Gap</span>
                          ) : (
                            <span className="text-slate-400">Unassessed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedRoleDetail(null);
                  onGoToGraph(selectedRoleDetail.role_id);
                }}
                className="text-xs text-blue-700 hover:text-blue-900 font-medium cursor-pointer"
              >
                Highlight on Skill Graph →
              </button>

              <button
                onClick={() => handleSetTargetRole(selectedRoleDetail.role_id)}
                className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-medium shadow-xs cursor-pointer"
              >
                Set as Active Target Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
