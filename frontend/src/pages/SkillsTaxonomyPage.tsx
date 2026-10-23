import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SkillItem, UserSkillEvidence } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Layers,
  Search,
  ExternalLink,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Circle,
} from 'lucide-react';

export const SkillsTaxonomyPage: React.FC<{
  onTakeAssessment: (skillId: number) => void;
}> = ({ onTakeAssessment }) => {
  const { user } = useAuth();
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [evidenceList, setEvidenceList] = useState<UserSkillEvidence[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<SkillItem[]>('/skills/'),
      api.get<UserSkillEvidence[]>('/skills/evidence'),
    ])
      .then(([sks, evs]) => {
        setSkills(sks);
        setEvidenceList(evs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const categories = Array.from(new Set(skills.map((s) => s.category)));
  const evidenceMap = new Map(evidenceList.map((e) => [e.skill_id, e]));

  const filteredSkills = skills.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase()) ||
      s.aliases.some((a) => a.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory =
      selectedCategory === 'all' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          Curated Skill Taxonomy & Evidence Index
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Browse all canonical engineering competencies, verified aliases, prerequisite relationships, and official documentation links.
        </p>

        {/* Search & Filters */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by skill name or alias (e.g. 'ts', 'react', 'sql')..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({skills.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Skills Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Competency</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Aliases</th>
                <th className="px-4 py-3">Prerequisites</th>
                <th className="px-4 py-3">Your Evidence</th>
                <th className="px-4 py-3">Official Resources</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSkills.map((skill) => {
                const ev = evidenceMap.get(skill.id);
                const status = ev?.status || 'unassessed';
                const score = ev?.proficiency_score || 0;

                return (
                  <tr key={skill.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{skill.name}</div>
                      <div className="text-[11px] text-slate-500 max-w-xs line-clamp-1">
                        {skill.description}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-600">{skill.category}</td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[140px]">
                        {skill.aliases.map((a, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {skill.prerequisites.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {skill.prerequisites.map((p) => (
                            <span
                              key={p.skill_id}
                              className="text-[10px] bg-blue-50 text-blue-800 px-1.5 py-0.2 rounded"
                            >
                              {p.skill_name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">None (Root)</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          status === 'demonstrated'
                            ? 'bg-emerald-100 text-emerald-800'
                            : status === 'developing'
                            ? 'bg-amber-100 text-amber-800'
                            : status === 'missing'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {status}
                        {score > 0 && ` (${score}%)`}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 max-w-[200px]">
                        {skill.learning_resources.slice(0, 2).map((res) => (
                          <a
                            key={res.id}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-blue-700 hover:underline truncate inline-flex items-center gap-1"
                          >
                            <span>{res.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                          </a>
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onTakeAssessment(skill.id)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Assess
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
