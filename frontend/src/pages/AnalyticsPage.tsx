import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  BarChart3,
  Printer,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  Layers,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [printableReport, setPrintableReport] = useState<any | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [user]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await api.get<any>('/analytics/summary');
      setAnalytics(data);
    } catch {}
    finally {
      setLoading(false);
    }
  };

  const handleOpenPrintReport = async () => {
    try {
      const report = await api.get<any>('/analytics/export-report');
      setPrintableReport(report);
      setShowPrintModal(true);
    } catch {}
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-slate-200/60 rounded-lg" />
        <div className="h-48 bg-slate-200/60 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Skill Analytics & Verification Audit
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Objective metrics derived from stored assessment results, hours logged, and category coverage.
          </p>
        </div>
        <button
          onClick={handleOpenPrintReport}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-medium border border-slate-200 shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Printer className="w-3.5 h-3.5 text-slate-600" />
          <span>Export Printable Skill Report</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Completed Hours</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {analytics?.hours_invested || 0} hrs
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            of {analytics?.total_estimated_hours || 0} est. hours
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Tasks Achieved</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {analytics?.tasks_completed_count || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            of {analytics?.total_tasks_count || 0} planned
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Target Role</div>
          <div className="text-base font-bold text-slate-900 mt-2 truncate">
            {analytics?.target_role}
          </div>
          <div className="text-[11px] text-blue-700 mt-0.5">Active Pathway</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Assessments Verified</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {analytics?.score_progression?.length || 0}
          </div>
          <div className="text-[11px] text-emerald-700 mt-0.5">Evidence-backed</div>
        </div>
      </div>

      {/* Category Competency Distribution */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Competency Distribution Across Engineering Domains
        </h3>

        <div className="space-y-3">
          {analytics?.category_distribution?.map((cat: any) => {
            const verifiedPct = cat.total_skills > 0 ? (cat.demonstrated / cat.total_skills) * 100 : 0;
            const developingPct = cat.total_skills > 0 ? (cat.developing / cat.total_skills) * 100 : 0;

            return (
              <div key={cat.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{cat.category}</span>
                  <span className="text-slate-500">
                    {cat.demonstrated} demonstrated • {cat.developing} developing • {cat.total_skills} total
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${verifiedPct}%` }}
                    className="bg-emerald-500 h-full"
                    title={`Demonstrated: ${cat.demonstrated}`}
                  />
                  <div
                    style={{ width: `${developingPct}%` }}
                    className="bg-amber-400 h-full"
                    title={`Developing: ${cat.developing}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Before and After Assessment Comparison */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Before-and-After Assessment Competency Evolution
          </h3>
          <p className="text-xs text-slate-500">
            Transparent comparison of initial assessment baseline vs latest demonstrated proficiency.
          </p>
        </div>

        {analytics?.before_after_comparison && analytics.before_after_comparison.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500 border-y border-slate-200">
                <tr>
                  <th className="px-3 py-2">Skill</th>
                  <th className="px-3 py-2">Baseline Score</th>
                  <th className="px-3 py-2">Latest Score</th>
                  <th className="px-3 py-2">Net Delta</th>
                  <th className="px-3 py-2">Audit Observation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analytics.before_after_comparison.map((item: any) => (
                  <tr key={item.skill_id} className="hover:bg-slate-50/60">
                    <td className="px-3 py-2.5 font-semibold text-slate-900">
                      {item.skill_name}
                    </td>
                    <td className="px-3 py-2.5 font-mono">{item.initial_score}%</td>
                    <td className="px-3 py-2.5 font-mono font-bold text-slate-900">
                      {item.latest_score}%
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                          item.delta > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.delta > 0 ? `+${item.delta}%` : `${item.delta}%`}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 text-[11px]">
                      {item.explanation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 text-xs text-slate-500 rounded text-center">
            Complete multiple assessments over time to track longitudinal before-and-after score changes.
          </div>
        )}
      </div>

      {/* Printable Report Modal */}
      {showPrintModal && printableReport && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-300">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="font-bold text-sm text-slate-900">
                Printable Skill Profile Document
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-blue-700 text-white rounded text-xs font-medium cursor-pointer flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="text-slate-400 hover:text-slate-700 font-bold px-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-slate-900 font-sans print:p-0">
              <div className="border-b border-slate-200 pb-4">
                <div className="text-xl font-bold">SkillGraph AI — Evidence Profile</div>
                <div className="text-xs text-slate-500 mt-1">
                  Verified Candidate Competency & Adaptive Roadmap Report
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold uppercase">Candidate:</span>
                  <div className="font-bold text-sm">{printableReport.student_name}</div>
                  <div className="text-slate-600">{printableReport.email}</div>
                  <div className="text-slate-600">{printableReport.education_level}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase">Target Role:</span>
                  <div className="font-bold text-sm">{printableReport.target_role}</div>
                  <div className="text-slate-600">Generated: {printableReport.generated_date}</div>
                </div>
              </div>

              <div className="border border-slate-200 rounded p-3 bg-slate-50 text-xs flex justify-around text-center">
                <div>
                  <div className="text-slate-500">Demonstrated</div>
                  <div className="text-base font-bold text-emerald-800">
                    {printableReport.summary_metrics.demonstrated}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Developing</div>
                  <div className="text-base font-bold text-amber-800">
                    {printableReport.summary_metrics.developing}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Total Tracked</div>
                  <div className="text-base font-bold text-slate-900">
                    {printableReport.competencies.length}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Verified Competencies & Evidence Log
                </div>
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700 font-semibold">
                    <tr>
                      <th className="p-2 border-b">Skill Name</th>
                      <th className="p-2 border-b">Category</th>
                      <th className="p-2 border-b">Status</th>
                      <th className="p-2 border-b">Evidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {printableReport.competencies.map((c: any, i: number) => (
                      <tr key={i}>
                        <td className="p-2 font-medium">{c.skill_name}</td>
                        <td className="p-2 text-slate-600">{c.category}</td>
                        <td className="p-2 capitalize font-semibold">{c.status}</td>
                        <td className="p-2 text-slate-600">{c.evidence_summary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
