import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Assessment, SkillItem, UserSkillEvidence } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface AssessmentsPageProps {
  onSelectAssessment: (assessmentId: number) => void;
  onGenerateForSkill: (skillId: number) => void;
}

export const AssessmentsPage: React.FC<AssessmentsPageProps> = ({
  onSelectAssessment,
  onGenerateForSkill,
}) => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [evidenceList, setEvidenceList] = useState<UserSkillEvidence[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assRes, skillsRes, evRes, histRes] = await Promise.all([
        api.get<Assessment[]>('/assessments/'),
        api.get<SkillItem[]>('/skills/'),
        api.get<UserSkillEvidence[]>('/skills/evidence'),
        api.get<any[]>('/assessments/attempts/history'),
      ]);
      setAssessments(assRes);
      setSkills(skillsRes);
      setEvidenceList(evRes);
      setHistory(histRes);
    } catch {}
    finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(skills.map((s) => s.category)));

  const filteredSkills = skills.filter(
    (s) => selectedCategory === 'all' || s.category === selectedCategory
  );

  const evidenceMap = new Map(evidenceList.map((e) => [e.skill_id, e]));
  const assessmentBySkill = new Map(assessments.map((a) => [a.skill_id, a]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          Evidence-Based Skill Assessments
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Verify your competence with deterministic question checks and rubric-evaluated practical tasks. Passing (≥70%) updates your demonstrated profile and unlocks downstream prerequisites.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
            selectedCategory === 'all'
              ? 'bg-blue-700 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Skills ({skills.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
              selectedCategory === cat
                ? 'bg-blue-700 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Skills Assessment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSkills.map((skill) => {
          const ev = evidenceMap.get(skill.id);
          const assessment = assessmentBySkill.get(skill.id);
          const status = ev?.status || 'unassessed';
          const score = ev?.proficiency_score || 0;

          return (
            <div
              key={skill.id}
              className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <span className="font-semibold uppercase tracking-wider text-slate-400">
                    {skill.category}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-medium ${
                      status === 'demonstrated'
                        ? 'bg-emerald-100 text-emerald-800'
                        : status === 'developing'
                        ? 'bg-amber-100 text-amber-800'
                        : status === 'missing'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {status === 'demonstrated'
                      ? `Demonstrated (${score}%)`
                      : status === 'developing'
                      ? `Developing (${score}%)`
                      : status === 'missing'
                      ? 'Missing Gap'
                      : 'Unassessed'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  {skill.name}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                  {skill.description}
                </p>

                <div className="text-[11px] text-slate-400 flex items-center gap-2 mb-4">
                  <span className="capitalize">{skill.difficulty_level} difficulty</span>
                  <span>•</span>
                  <span>4 questions & rubric</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                {assessment ? (
                  <button
                    onClick={() => onSelectAssessment(assessment.id)}
                    className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-medium shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>
                      {status === 'demonstrated' ? 'Retake Assessment' : 'Start Assessment'}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => onGenerateForSkill(skill.id)}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                    <span>Generate Quiz & Rubric</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Assessment History Table */}
      {history.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900">
            Historical Attempt Audit Log
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500 border-y border-slate-200">
                <tr>
                  <th className="px-3 py-2">Assessment</th>
                  <th className="px-3 py-2">Skill</th>
                  <th className="px-3 py-2">Score</th>
                  <th className="px-3 py-2">Result</th>
                  <th className="px-3 py-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/60">
                    <td className="px-3 py-2 font-medium text-slate-900">
                      {h.assessment_title}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{h.skill_name}</td>
                    <td className="px-3 py-2 font-semibold">
                      {h.percentage}% ({h.score}/{h.max_score} pts)
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          h.passed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {h.passed ? 'PASSED' : 'NEEDS PRACTICE'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-400">
                      {new Date(h.completed_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
