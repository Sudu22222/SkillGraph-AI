import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Roadmap, RoadmapTask, AuditEvent } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Compass,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Award,
  Sparkles,
  History,
  MoveUp,
  MoveDown,
  AlertCircle,
  FolderGit2,
  Check,
} from 'lucide-react';

interface RoadmapPageProps {
  onTakeAssessment: (skillId: number) => void;
  onSubmitProject: (taskId?: number, skillId?: number) => void;
}

export const RoadmapPage: React.FC<RoadmapPageProps> = ({
  onTakeAssessment,
  onSubmitProject,
}) => {
  const { user } = useAuth();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [reorderError, setReorderError] = useState<string | null>(null);

  useEffect(() => {
    loadRoadmap();
  }, [user]);

  const loadRoadmap = async () => {
    setLoading(true);
    try {
      const res = await api.get<Roadmap>('/roadmaps/active');
      setRoadmap(res);
      const audits = await api.get<AuditEvent[]>('/roadmaps/audit-events');
      setAuditEvents(audits);
    } catch {
      // Empty or not generated yet
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const res = await api.post<Roadmap>('/roadmaps/generate', {
        force_regenerate: false,
      });
      setRoadmap(res);
      const audits = await api.get<AuditEvent[]>('/roadmaps/audit-events');
      setAuditEvents(audits);
    } catch {}
    finally {
      setRecalculating(false);
    }
  };

  const handleUpdateStatus = async (taskId: number, newStatus: string) => {
    try {
      await api.patch(`/roadmaps/tasks/${taskId}/status`, { status: newStatus });
      await loadRoadmap();
    } catch {}
  };

  const handleMoveTask = async (index: number, direction: 'up' | 'down') => {
    if (!roadmap || !roadmap.tasks) return;
    setReorderError(null);

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= roadmap.tasks.length) return;

    const taskIds = roadmap.tasks.map((t) => t.id);
    const temp = taskIds[index];
    taskIds[index] = taskIds[newIndex];
    taskIds[newIndex] = temp;

    try {
      await api.post('/roadmaps/reorder', { task_ids: taskIds });
      await loadRoadmap();
    } catch (err: any) {
      setReorderError(err.message || 'Cannot violate mandatory prerequisite sequence.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-28 bg-slate-200/60 rounded-lg" />
        <div className="h-48 bg-slate-200/60 rounded-lg" />
        <div className="h-48 bg-slate-200/60 rounded-lg" />
      </div>
    );
  }

  if (!roadmap || roadmap.tasks.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-10 text-center space-y-4 shadow-2xs">
        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
          <Compass className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          No Active Learning Roadmap
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          SkillGraph AI generates a personalized, prerequisite-respecting sequence of milestones based on your target role and study time.
        </p>
        <button
          onClick={handleRecalculate}
          disabled={recalculating}
          className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-medium shadow-xs transition-colors cursor-pointer"
        >
          {recalculating ? 'Generating Roadmap...' : 'Generate Adaptive Roadmap'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview & Recalculate Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Target Role Pathway
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-blue-700 font-semibold">
                {roadmap.target_role_title}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {roadmap.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAuditModal(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Audit History ({auditEvents.length})</span>
            </button>
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-medium shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{recalculating ? 'Recalculating...' : 'Recalculate Plan'}</span>
            </button>
          </div>
        </div>

        {/* AI Plan Justification */}
        <div className="p-3 bg-slate-50/80 rounded-md border border-slate-200 text-xs text-slate-700">
          <span className="font-semibold text-slate-900">Sequence Justification: </span>
          {roadmap.explanation}
        </div>

        {/* Progress Bar & Stats */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">
              Roadmap Progress: {roadmap.progress_percentage}% completed
            </span>
            <span className="text-slate-500">
              {roadmap.completed_hours} / {roadmap.total_hours} total study hours
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${roadmap.progress_percentage}%` }}
            />
          </div>
        </div>
      </div>

      {reorderError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <div className="font-semibold">Reordering Constraint Violation</div>
            <div>{reorderError}</div>
          </div>
        </div>
      )}

      {/* Sequenced Tasks Timeline */}
      <div className="space-y-4">
        {roadmap.tasks.map((task, idx) => {
          const isCompleted = task.status === 'completed';
          const isInProgress = task.status === 'in_progress';

          return (
            <div
              key={task.id}
              className={`bg-white border rounded-lg p-5 shadow-2xs transition-all ${
                isCompleted
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : isInProgress
                  ? 'border-blue-300 ring-1 ring-blue-100'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* Left: Milestone details */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      Milestone {task.task_order}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700">
                      {task.category}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500 capitalize">
                      {task.difficulty_level}
                    </span>

                    {isCompleted ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Completed
                      </span>
                    ) : isInProgress ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-800 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> In Progress
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
                        Not Started
                      </span>
                    )}

                    {!task.is_prerequisite_satisfied && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800">
                        Prerequisites pending ({task.missing_prerequisites.join(', ')})
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900">
                    {task.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {task.learning_objective}
                  </p>

                  {/* Practical Project Exercise */}
                  {task.practical_exercise && (
                    <div className="p-3 bg-slate-50 rounded-md border border-slate-200/80 text-xs text-slate-700 space-y-1">
                      <div className="font-semibold text-slate-900 flex items-center gap-1">
                        <FolderGit2 className="w-3.5 h-3.5 text-blue-700" />
                        Practical Hands-on Project Exercise:
                      </div>
                      <div className="text-slate-600">
                        {task.practical_exercise}
                      </div>
                    </div>
                  )}

                  {/* Official Curated Documentation Links */}
                  {task.resources && task.resources.length > 0 && (
                    <div className="pt-2">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-blue-700" />
                        Verified Learning Resources:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {task.resources.map((res) => (
                          <a
                            key={res.id}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-blue-700 transition-colors shadow-2xs"
                          >
                            <span>{res.title}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Actions & Reordering */}
                <div className="flex flex-col sm:items-end justify-between gap-3 shrink-0 pt-2 md:pt-0">
                  <div className="text-xs text-slate-500 font-medium">
                    Est. {task.estimated_hours} hours
                  </div>

                  {/* Status Toggle Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {task.status !== 'completed' ? (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(task.id, 'in_progress')}
                          className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors cursor-pointer ${
                            isInProgress
                              ? 'bg-blue-50 border-blue-300 text-blue-800'
                              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          In Progress
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(task.id, 'completed')}
                          className="px-3 py-1.5 text-xs font-medium rounded bg-emerald-700 hover:bg-emerald-800 text-white transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Mark Done
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(task.id, 'not_started')}
                        className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                      >
                        Re-open Task
                      </button>
                    )}
                  </div>

                  {/* Verification CTA Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onTakeAssessment(task.skill_id)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Award className="w-3 h-3 text-blue-700" />
                      Take Quiz
                    </button>
                    <button
                      onClick={() => onSubmitProject(task.id, task.skill_id)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <FolderGit2 className="w-3 h-3 text-blue-700" />
                      Submit Project
                    </button>

                    {/* Manual Reordering */}
                    <div className="flex items-center border border-slate-200 rounded overflow-hidden">
                      <button
                        disabled={idx === 0}
                        onClick={() => handleMoveTask(idx, 'up')}
                        title="Move Task Up"
                        className="p-1 hover:bg-slate-100 text-slate-600 disabled:opacity-30 cursor-pointer"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={idx === roadmap.tasks.length - 1}
                        onClick={() => handleMoveTask(idx, 'down')}
                        title="Move Task Down"
                        className="p-1 hover:bg-slate-100 text-slate-600 disabled:opacity-30 cursor-pointer"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Audit History Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-blue-700" />
                Roadmap Audit & Adaptation Log
              </h3>
              <button
                onClick={() => setShowAuditModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-3">
              {auditEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3 rounded-md bg-slate-50 border border-slate-200/80 text-xs"
                >
                  <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                    <span className="font-semibold uppercase tracking-wider text-blue-700">
                      {event.event_type.replace('_', ' ')}
                    </span>
                    <span>{new Date(event.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-800 font-medium">{event.reason}</p>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 rounded cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
