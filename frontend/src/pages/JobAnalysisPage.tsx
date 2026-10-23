import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CareerRole, JobAnalysisResult, ExtractedSkillItem } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  FileSearch,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Briefcase,
  FileText,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

export const JobAnalysisPage: React.FC<{ onGoToAssessments: () => void }> = ({
  onGoToAssessments,
}) => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<CareerRole[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(
    user?.profile?.target_role_id || null
  );

  const [activeInputTab, setActiveInputTab] = useState<'paste' | 'upload'>('paste');
  const [title, setTitle] = useState('Frontend Engineer Role Analysis');
  const [company, setCompany] = useState('TechCorp');
  const [rawText, setRawText] = useState('');
  const [analysisType, setAnalysisType] = useState<'job_description' | 'resume'>('job_description');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<JobAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applySuccessMessage, setApplySuccessMessage] = useState<string | null>(null);

  // Editable candidate skills for review before saving
  const [editableSkills, setEditableSkills] = useState<ExtractedSkillItem[]>([]);

  useEffect(() => {
    api
      .get<CareerRole[]>('/roles/')
      .then((data) => {
        setRoles(data);
        if (!selectedRoleId && data.length > 0) {
          setSelectedRoleId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Pre-fill sample job descriptions
  const sampleJDs = [
    {
      title: 'Senior Frontend Engineer (React/TypeScript)',
      company: 'Vercel / Next-Gen UI',
      roleSlug: 'frontend-developer',
      text: `We are looking for a Senior Frontend Engineer to build high-performance web applications.
Requirements:
- Strong demonstrated experience with React, TypeScript, and modern CSS layouts (Flexbox, CSS Grid).
- Deep understanding of HTML & Web Standards, accessibility (WCAG), and browser performance optimization.
- Familiarity with Next.js & SSR, state management, and automated testing (Vitest, React Testing Library).
- Experience working with REST API Design and Git version control workflows in agile teams.
- Knowledge of Web Security (OWASP Top 10) including XSS and CSRF prevention.`,
    },
    {
      title: 'Backend Systems Engineer (Python/FastAPI)',
      company: 'Datadog / High-Throughput APIs',
      roleSlug: 'backend-developer',
      text: `Seeking a Backend Developer to architect resilient distributed services and database pipelines.
Requirements:
- Expert knowledge of Python and asynchronous web frameworks such as FastAPI.
- Advanced SQL and relational database modeling with PostgreSQL and database indexing/query tuning.
- Authentication & JWT/OAuth token verification, rate limiting, and secure session handling.
- Hands-on experience with Docker & containers and CI/CD pipelines.
- Familiarity with Redis in-memory caching and system design for horizontal scalability.`,
    },
    {
      title: 'Candidate Resume: Software Engineering Intern',
      company: 'University Student Portfolio',
      roleSlug: 'frontend-developer',
      isResume: true,
      text: `Alex Chen - Software Engineering Student
EDUCATION: B.S. in Computer Science (Undergraduate)
SKILLS: HTML, CSS, JavaScript, TypeScript, React, Python, Git, Docker, SQL.
PROJECTS:
- Built a component library in React with TypeScript and responsive modern CSS layouts. Tested with automated testing.
- Developed a REST API using Python and FastAPI with SQL relational database integration.
- Configured Git version control workflows and containerized services using Docker.`,
    },
  ];

  const loadSample = (sample: (typeof sampleJDs)[0]) => {
    setTitle(sample.title);
    setCompany(sample.company);
    setRawText(sample.text);
    setAnalysisType(sample.isResume ? 'resume' : 'job_description');
    const matchedRole = roles.find((r) => r.slug === sample.roleSlug);
    if (matchedRole) {
      setSelectedRoleId(matchedRole.id);
    }
  };

  const handleRunAnalysis = async () => {
    setError(null);
    setApplySuccessMessage(null);

    if (activeInputTab === 'paste') {
      if (!rawText || rawText.trim().length < 20) {
        setError('Please provide at least 20 characters of job description or resume text.');
        return;
      }

      setLoading(true);
      try {
        const result = await api.post<JobAnalysisResult>('/job-analysis/analyze-text', {
          title,
          company,
          raw_text: rawText,
          target_role_id: selectedRoleId,
          analysis_type: analysisType,
        });
        setAnalysisResult(result);
        setEditableSkills(result.extracted_skills);
      } catch (err: any) {
        setError(err.message || 'Analysis failed. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      // File upload
      if (!selectedFile) {
        setError('Please select a PDF or text file to upload.');
        return;
      }

      setLoading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title || selectedFile.name);
      formData.append('company', company);
      formData.append('analysis_type', analysisType);
      if (selectedRoleId) {
        formData.append('target_role_id', String(selectedRoleId));
      }

      try {
        const result = await api.post<JobAnalysisResult>(
          '/job-analysis/upload-document',
          formData
        );
        setAnalysisResult(result);
        setEditableSkills(result.extracted_skills);
      } catch (err: any) {
        setError(err.message || 'File upload analysis failed.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleApplySkillsToProfile = async () => {
    if (!editableSkills || editableSkills.length === 0) return;

    setLoading(true);
    try {
      const payload = {
        skills: editableSkills
          .filter((s) => s.normalized_skill_id)
          .map((s) => ({
            skill_id: s.normalized_skill_id,
            status: s.suggested_status,
            evidence_type: s.evidence_type,
            evidence_summary: s.evidence_snippet || 'Imported from document analysis.',
          })),
      };

      const res = await api.post<{ success: boolean; applied_count: number }>(
        '/job-analysis/apply-skills',
        payload
      );
      setApplySuccessMessage(
        `Successfully saved ${res.applied_count} competencies to your student profile! Any resume mentions are safely labeled as unassessed/developing awaiting assessment verification.`
      );
    } catch (err: any) {
      setError(err.message || 'Failed to save skills.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          Job Description & Resume Gap Analysis
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Extract required and demonstrated competencies with Gemini AI. Explicitly distinguishes mere keyword mentions from verified demonstrated capability.
        </p>

        {/* Quick Sample Selector */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1">
            Pre-load Samples:
          </span>
          {sampleJDs.map((s, idx) => (
            <button
              key={idx}
              onClick={() => loadSample(s)}
              className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium transition-colors cursor-pointer"
            >
              {s.title.split(' ')[0]} {s.title.split(' ')[1]} ({s.isResume ? 'Resume' : 'JD'})
            </button>
          ))}
        </div>
      </div>

      {/* Input Form Card */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
        {/* Role & Mode Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Compare Against Career Role
            </label>
            <select
              value={selectedRoleId || ''}
              onChange={(e) => setSelectedRoleId(Number(e.target.value))}
              className="w-full text-xs bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 cursor-pointer focus:border-blue-600 focus:outline-hidden"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Document Type
            </label>
            <select
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value as any)}
              className="w-full text-xs bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 cursor-pointer focus:border-blue-600 focus:outline-hidden"
            >
              <option value="job_description">Job Posting / Description</option>
              <option value="resume">Student Resume / CV</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Position / Document Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
              className="w-full text-xs bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:border-blue-600 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Input Method Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pt-2">
          <button
            onClick={() => setActiveInputTab('paste')}
            className={`pb-2 text-xs font-medium border-b-2 cursor-pointer transition-colors ${
              activeInputTab === 'paste'
                ? 'border-blue-700 text-blue-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Paste Text
          </button>
          <button
            onClick={() => setActiveInputTab('upload')}
            className={`pb-2 text-xs font-medium border-b-2 cursor-pointer transition-colors ${
              activeInputTab === 'upload'
                ? 'border-blue-700 text-blue-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Upload Document (PDF / TXT)
          </button>
        </div>

        {activeInputTab === 'paste' ? (
          <div>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste the full job description or resume text here..."
              className="w-full p-3 text-xs bg-slate-50/50 border border-slate-300 rounded-md focus:bg-white focus:border-blue-600 focus:outline-hidden font-mono"
            />
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <div className="text-xs text-slate-600 mb-1">
              {selectedFile ? (
                <span className="font-semibold text-slate-900">{selectedFile.name}</span>
              ) : (
                'Select a PDF (.pdf) or Text document (.txt, .md)'
              )}
            </div>
            <p className="text-[11px] text-slate-400 mb-3">Maximum file size 5MB</p>
            <label className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-xs font-medium text-slate-700 rounded-md shadow-2xs cursor-pointer">
              Choose File
              <input
                type="file"
                accept=".pdf,.txt,.md"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
            </label>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={handleRunAnalysis}
            disabled={loading}
            className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium rounded-md shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{loading ? 'Analyzing with AI...' : 'Run Gap Analysis'}</span>
          </button>
        </div>
      </div>

      {/* Analysis Results View */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Analysis Outcome
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {analysisResult.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                  {analysisResult.ai_model_used}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              {analysisResult.summary}
            </p>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-md bg-emerald-50/70 border border-emerald-200">
                <div className="text-xs text-emerald-800 font-medium">Verified Matched</div>
                <div className="text-xl font-bold text-emerald-900">
                  {analysisResult.matched_skills_count}
                </div>
              </div>
              <div className="p-3 rounded-md bg-amber-50/70 border border-amber-200">
                <div className="text-xs text-amber-800 font-medium">Needs Practice</div>
                <div className="text-xl font-bold text-amber-900">
                  {analysisResult.developing_skills_count}
                </div>
              </div>
              <div className="p-3 rounded-md bg-rose-50/70 border border-rose-200">
                <div className="text-xs text-rose-800 font-medium">Missing Gaps</div>
                <div className="text-xl font-bold text-rose-900">
                  {analysisResult.missing_skills_count}
                </div>
              </div>
              <div className="p-3 rounded-md bg-slate-100 border border-slate-200">
                <div className="text-xs text-slate-700 font-medium">Role Match %</div>
                <div className="text-xl font-bold text-slate-900">
                  {analysisResult.overall_match_percentage}%
                </div>
              </div>
            </div>
          </div>

          {/* Competency Gap Comparison Table */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Role Skill Competency Matrix
                </h3>
                <p className="text-xs text-slate-500">
                  Side-by-side comparison of role requirements vs your verified profile evidence.
                </p>
              </div>
              <button
                onClick={onGoToAssessments}
                className="text-xs font-medium text-blue-700 hover:text-blue-900 cursor-pointer"
              >
                Assess Gaps →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500 border-y border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">Required Skill</th>
                    <th className="px-3 py-2.5">Category</th>
                    <th className="px-3 py-2.5">Importance</th>
                    <th className="px-3 py-2.5">Your Evidence</th>
                    <th className="px-3 py-2.5">Gap Status</th>
                    <th className="px-3 py-2.5">Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analysisResult.comparisons.map((c) => (
                    <tr key={c.skill_id} className="hover:bg-slate-50/60">
                      <td className="px-3 py-3 font-semibold text-slate-900">
                        {c.skill_name}
                      </td>
                      <td className="px-3 py-3 text-slate-600">{c.category}</td>
                      <td className="px-3 py-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold bg-slate-100 text-slate-700">
                          {c.importance_level}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-600 capitalize">
                        {c.user_status} ({c.user_proficiency}%)
                      </td>
                      <td className="px-3 py-3">
                        {c.gap_status === 'matched' && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Matched
                          </span>
                        )}
                        {c.gap_status === 'needs_practice' && (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                            <Clock className="w-3.5 h-3.5" /> Developing
                          </span>
                        )}
                        {c.gap_status === 'unassessed_claim' && (
                          <span className="inline-flex items-center gap-1 text-blue-700 font-semibold">
                            <ShieldAlert className="w-3.5 h-3.5" /> Mentioned in Doc
                          </span>
                        )}
                        {c.gap_status === 'missing_competency' && (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-semibold">
                            <AlertCircle className="w-3.5 h-3.5" /> Missing Gap
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-slate-600 text-[11px] max-w-xs">
                        {c.recommendation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Review & Apply Extracted Skills to Profile */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Review & Save Extracted Competencies
                </h3>
                <p className="text-xs text-slate-500">
                  Validate AI-extracted skills before importing them into your profile. Resume mentions are preserved as unassessed/developing to protect competency integrity.
                </p>
              </div>
              <button
                onClick={handleApplySkillsToProfile}
                disabled={loading || editableSkills.length === 0}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-medium shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                Save Selected to Profile
              </button>
            </div>

            {applySuccessMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800">
                {applySuccessMessage}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500 border-y border-slate-200">
                  <tr>
                    <th className="px-3 py-2">Extracted Mention</th>
                    <th className="px-3 py-2">Canonical Taxonomy Skill</th>
                    <th className="px-3 py-2">Evidence Snippet</th>
                    <th className="px-3 py-2">Status to Apply</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {editableSkills.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2.5 font-medium text-slate-900">
                        {item.raw_mention}
                      </td>
                      <td className="px-3 py-2.5 text-blue-700 font-medium">
                        {item.normalized_skill_name || 'Unmatched'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-500 text-[11px] max-w-sm italic">
                        "{item.evidence_snippet}"
                      </td>
                      <td className="px-3 py-2.5">
                        <select
                          value={item.suggested_status}
                          onChange={(e) => {
                            const updated = [...editableSkills];
                            updated[idx].suggested_status = e.target.value as any;
                            setEditableSkills(updated);
                          }}
                          className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 cursor-pointer"
                        >
                          <option value="unassessed">Unassessed Claim</option>
                          <option value="developing">Developing</option>
                          <option value="demonstrated">Demonstrated (Prior Proof)</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
