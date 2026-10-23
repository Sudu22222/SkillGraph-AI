import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ProjectSubmission, SkillItem } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  FolderGit2,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface ProjectPortfolioPageProps {
  initialTaskId?: number | null;
  initialSkillId?: number | null;
}

export const ProjectPortfolioPage: React.FC<ProjectPortfolioPageProps> = ({
  initialTaskId,
  initialSkillId,
}) => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<ProjectSubmission[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Form State
  const [skillId, setSkillId] = useState<number>(initialSkillId || 1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [textSubmission, setTextSubmission] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subs, sks] = await Promise.all([
        api.get<ProjectSubmission[]>('/projects/'),
        api.get<SkillItem[]>('/skills/'),
      ]);
      setSubmissions(subs);
      setSkills(sks);
      if (initialSkillId) {
        setSkillId(initialSkillId);
        setShowSubmitModal(true);
      } else if (sks.length > 0) {
        setSkillId(sks[0].id);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  };

  const handleCreateSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !textSubmission) {
      setError('Please provide title, description, and project implementation writeup.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.post<ProjectSubmission>('/projects/', {
        skill_id: skillId,
        roadmap_task_id: initialTaskId || null,
        title,
        description,
        repo_url: repoUrl,
        text_submission: textSubmission,
      });
      setShowSubmitModal(false);
      setTitle('');
      setDescription('');
      setRepoUrl('');
      setTextSubmission('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmCompetency = async (submissionId: number) => {
    try {
      await api.post('/projects/confirm-competency', {
        submission_id: submissionId,
        confirm_update_competency: true,
      });
      await loadData();
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Project Portfolio & Practical Evidence
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit code repositories and project writeups. Submissions are evaluated against transparent rubrics and require user confirmation to update demonstrated competency.
          </p>
        </div>
        <button
          onClick={() => setShowSubmitModal(true)}
          className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-medium shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Submit Project</span>
        </button>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {submissions.map((sub) => {
          const isVerified = sub.status === 'verified';
          const rubricScores = sub.feedback?.rubric_scores || [];

          return (
            <div
              key={sub.id}
              className={`bg-white border rounded-lg p-5 shadow-2xs space-y-3 ${
                isVerified ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800">
                      {sub.skill_name}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(sub.submitted_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {sub.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      isVerified
                        ? 'bg-emerald-100 text-emerald-800'
                        : sub.status === 'reviewed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {isVerified ? 'Verified Competency' : 'Rubric Reviewed'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-700">{sub.description}</p>

              {sub.repo_url && (
                <div className="text-xs">
                  <span className="text-slate-400">Repository: </span>
                  <a
                    href={sub.repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 hover:underline inline-flex items-center gap-1"
                  >
                    {sub.repo_url} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Rubric Review Outcome */}
              <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">
                    Transparent Technical Rubric Evaluation
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {sub.rubric_score}%
                  </span>
                </div>

                <p className="text-slate-600">{sub.feedback?.summary}</p>

                {rubricScores.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    {rubricScores.map((r, rIdx) => (
                      <div
                        key={rIdx}
                        className="bg-white p-2 rounded border border-slate-200/80"
                      >
                        <div className="font-medium text-slate-700">{r.criterion}</div>
                        <div className="font-mono font-semibold text-slate-900 text-xs mt-0.5">
                          {r.score} / {r.max_score} pts
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Explicit User Confirmation Button */}
              {!isVerified && (
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Confirm rubric results to update your demonstrated status in the skill graph:
                  </span>
                  <button
                    onClick={() => handleConfirmCompetency(sub.id)}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-medium shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm & Update Profile</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {submissions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200 text-xs text-slate-500">
            No projects submitted yet. Click "Submit Project" to evaluate your practical code against technical rubrics.
          </div>
        )}
      </div>

      {/* Submit Project Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <FolderGit2 className="w-4 h-4 text-blue-700" />
                Submit Practical Project for Verification
              </h3>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-slate-700 font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmission} className="p-4 overflow-y-auto space-y-4">
              {error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target Competency / Skill *
                </label>
                <select
                  value={skillId}
                  onChange={(e) => setSkillId(Number(e.target.value))}
                  className="w-full text-xs bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:border-blue-600 focus:outline-hidden cursor-pointer"
                >
                  {skills.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Asynchronous Task Queue with FastAPI and Redis"
                  className="w-full text-xs bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  GitHub Repository / Deployment URL
                </label>
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/username/project"
                  className="w-full text-xs bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Executive Description *
                </label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of what the project solves and architecture decisions..."
                  className="w-full text-xs bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Technical Writeup / Key Code Implementation Details *
                </label>
                <textarea
                  rows={5}
                  required
                  value={textSubmission}
                  onChange={(e) => setTextSubmission(e.target.value)}
                  placeholder="Describe your design patterns, edge case handling, and test coverage..."
                  className="w-full text-xs bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:border-blue-600 focus:outline-hidden font-mono"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-medium shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Evaluating Rubric...' : 'Submit for Rubric Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
