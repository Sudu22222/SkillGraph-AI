import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DashboardStats, AssessmentResult, CareerRole } from '../types';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Compass,
  Award,
  Network,
  FileSearch,
  BookOpen,
  Sparkles,
  BarChart2,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigateTab: (tab: string, extra?: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAttempts, setRecentAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, attemptsRes] = await Promise.all([
        api.get<DashboardStats>('/users/stats'),
        api.get<any[]>('/assessments/attempts/history'),
      ]);
      setStats(statsRes);
      setRecentAttempts(attemptsRes.slice(0, 5));
    } catch {
      // Fallback state
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInitialRoadmap = async () => {
    try {
      await api.post('/roadmaps/generate', {});
      await loadDashboardData();
      onNavigateTab('roadmap');
    } catch {}
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-slate-200/60 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="h-28 bg-slate-200/60 rounded-lg" />
          <div className="h-28 bg-slate-200/60 rounded-lg" />
          <div className="h-28 bg-slate-200/60 rounded-lg" />
          <div className="h-28 bg-slate-200/60 rounded-lg" />
        </div>
        <div className="h-64 bg-slate-200/60 rounded-lg" />
      </div>
    );
  }

  const roleTitle = stats?.target_role.title || 'Role Not Assigned';
  const hasRoadmap = stats?.roadmap.has_roadmap;

  return (
    <div className="space-y-6">
      {/* Target Role & Progress Overview Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Active Career Objective
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-blue-700 font-medium">
              {stats?.target_role.category || 'Engineering'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {roleTitle}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            {hasRoadmap
              ? `Your adaptive learning plan has ${stats?.roadmap.completed_tasks} of ${stats?.roadmap.total_tasks} milestones achieved (${stats?.roadmap.progress_percentage}% overall progress).`
              : 'You have not yet generated an adaptive roadmap for this role.'}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => onNavigateTab('roles')}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-medium rounded-md transition-colors cursor-pointer"
          >
            Switch Role
          </button>
          {hasRoadmap ? (
            <button
              onClick={() => onNavigateTab('roadmap')}
              className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>View Roadmap</span>
            </button>
          ) : (
            <button
              onClick={handleGenerateInitialRoadmap}
              className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Roadmap</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Competency Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Demonstrated */}
        <div
          onClick={() => onNavigateTab('skills')}
          className="bg-white border border-slate-200 hover:border-emerald-300 p-4 rounded-lg shadow-2xs transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-semibold">Demonstrated</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
            {stats?.competencies.demonstrated || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Verified with assessment ≥ 70%
          </div>
        </div>

        {/* Developing */}
        <div
          onClick={() => onNavigateTab('skills')}
          className="bg-white border border-slate-200 hover:border-amber-300 p-4 rounded-lg shadow-2xs transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-semibold">Developing</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
            {stats?.competencies.developing || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Partial score or self-reported
          </div>
        </div>

        {/* Missing Gaps */}
        <div
          onClick={() => onNavigateTab('roles')}
          className="bg-white border border-slate-200 hover:border-rose-300 p-4 rounded-lg shadow-2xs transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-xs font-semibold">Missing Gaps</span>
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900 group-hover:text-rose-700 transition-colors">
            {stats?.competencies.missing || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Required role skills not started
          </div>
        </div>

        {/* Assessments Taken */}
        <div
          onClick={() => onNavigateTab('assessments')}
          className="bg-white border border-slate-200 hover:border-blue-300 p-4 rounded-lg shadow-2xs transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-blue-700 mb-2">
            <span className="text-xs font-semibold">Assessments</span>
            <Award className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
            {stats?.assessments.total_completed || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Avg Score: {stats?.assessments.average_percentage || 0}%
          </div>
        </div>
      </div>

      {/* Next Recommended Task & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Task Card */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                Next Recommended Milestone
              </span>
              <span className="text-xs font-medium text-slate-400">
                Paced for {user?.profile?.weekly_study_hours || 10} hrs/wk
              </span>
            </div>

            {stats?.roadmap.next_task ? (
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">
                  {stats.roadmap.next_task.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {stats.roadmap.next_task.learning_objective}
                </p>
                <div className="flex items-center gap-3 pt-2 text-xs text-slate-500">
                  <span>Skill: <strong>{stats.roadmap.next_task.skill_name}</strong></span>
                  <span>•</span>
                  <span>Duration: ~{stats.roadmap.next_task.estimated_hours} hours</span>
                  <span>•</span>
                  <span className="capitalize text-blue-700 font-medium">
                    Status: {stats.roadmap.next_task.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-md text-xs text-slate-600">
                All scheduled roadmap milestones are currently completed, or no active tasks are in queue.
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onNavigateTab('roadmap')}
              className="text-xs font-medium text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
            >
              <span>Inspect full sequence in Roadmap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigateTab('assessments')}
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-medium transition-colors cursor-pointer"
            >
              Take Assessment
            </button>
          </div>
        </div>

        {/* Quick Tools Navigation */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Analysis & Verification Tools
          </h3>

          <div className="space-y-2">
            <button
              onClick={() => onNavigateTab('graph')}
              className="w-full p-2.5 rounded-md border border-slate-200 hover:border-slate-300 bg-slate-50/60 hover:bg-slate-50 flex items-center justify-between text-left transition-colors cursor-pointer group"
            >
              <div>
                <div className="text-xs font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                  Interactive Skill Graph (DAG)
                </div>
                <div className="text-[11px] text-slate-500">
                  Inspect prerequisite dependencies & readiness
                </div>
              </div>
              <Network className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
            </button>

            <button
              onClick={() => onNavigateTab('job-analysis')}
              className="w-full p-2.5 rounded-md border border-slate-200 hover:border-slate-300 bg-slate-50/60 hover:bg-slate-50 flex items-center justify-between text-left transition-colors cursor-pointer group"
            >
              <div>
                <div className="text-xs font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                  Job & Resume Gap Analysis
                </div>
                <div className="text-[11px] text-slate-500">
                  Compare resume text against real role requirements
                </div>
              </div>
              <FileSearch className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
            </button>

            <button
              onClick={() => onNavigateTab('projects')}
              className="w-full p-2.5 rounded-md border border-slate-200 hover:border-slate-300 bg-slate-50/60 hover:bg-slate-50 flex items-center justify-between text-left transition-colors cursor-pointer group"
            >
              <div>
                <div className="text-xs font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                  Project Portfolio
                </div>
                <div className="text-[11px] text-slate-500">
                  Submit practical code for rubric review
                </div>
              </div>
              <BookOpen className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Assessment Attempts */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Recent Assessment Performance
            </h3>
            <p className="text-xs text-slate-500">
              Deterministic quiz results and transparent rubric scoring history.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('assessments')}
            className="text-xs font-medium text-blue-700 hover:text-blue-900 cursor-pointer"
          >
            View All ({recentAttempts.length})
          </button>
        </div>

        {recentAttempts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500 border-y border-slate-200">
                <tr>
                  <th className="px-3 py-2">Assessment Title</th>
                  <th className="px-3 py-2">Competency Tested</th>
                  <th className="px-3 py-2">Score</th>
                  <th className="px-3 py-2">Outcome</th>
                  <th className="px-3 py-2">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentAttempts.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/60">
                    <td className="px-3 py-2.5 font-medium text-slate-900">
                      {att.assessment_title}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{att.skill_name}</td>
                    <td className="px-3 py-2.5 font-semibold text-slate-900">
                      {att.percentage}% ({att.score}/{att.max_score} pts)
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                          att.passed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {att.passed ? 'Demonstrated' : 'Developing'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-400 text-[11px]">
                      {new Date(att.completed_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-md">
            No assessment attempts on record yet. Select an assessment to demonstrate your initial competence.
          </div>
        )}
      </div>
    </div>
  );
};
