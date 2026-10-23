import React, { useEffect, useState } from 'react';
import {
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Circle,
  ArrowRight,
  BookOpen,
  Award,
  Compass,
} from 'lucide-react';
import { GraphNodeData, SkillItem } from '../../types';
import { api } from '../../services/api';

interface SkillDetailDrawerProps {
  node: GraphNodeData | null;
  onClose: () => void;
  onTakeAssessment: (skillId: number) => void;
  onGoToRoadmap: () => void;
}

export const SkillDetailDrawer: React.FC<SkillDetailDrawerProps> = ({
  node,
  onClose,
  onTakeAssessment,
  onGoToRoadmap,
}) => {
  const [skillDetails, setSkillDetails] = useState<SkillItem | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!node) {
      setSkillDetails(null);
      return;
    }

    setLoading(true);
    api
      .get<SkillItem[]>('/skills/')
      .then((all) => {
        const found = all.find((s) => s.id === node.skill_id);
        if (found) {
          setSkillDetails(found);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [node]);

  if (!node) return null;

  const getStatusBadge = () => {
    switch (node.status) {
      case 'demonstrated':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Demonstrated ({node.proficiency_score}%)
          </span>
        );
      case 'developing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Developing ({node.proficiency_score}%)
          </span>
        );
      case 'missing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            Missing Role Skill
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            <Circle className="w-3.5 h-3.5 text-slate-400" />
            Unassessed
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {node.category}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-600 capitalize">{node.difficulty}</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 leading-snug">
            {node.label}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        {/* Competency Status Banner */}
        <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Demonstrated Status</span>
            {getStatusBadge()}
          </div>

          <div className="text-xs text-slate-600 pt-1 border-t border-slate-100">
            <span className="font-medium text-slate-700">Evidence Type: </span>
            <span className="capitalize">{node.evidence_type.replace('_', ' ')}</span>
          </div>

          {node.missing_prerequisites && node.missing_prerequisites.length > 0 && (
            <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-xs text-amber-800">
              <span className="font-semibold">Prerequisites pending: </span>
              {node.missing_prerequisites.join(', ')}
            </div>
          )}
        </div>

        {/* Skill Description */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            About this Skill
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed">
            {skillDetails?.description ||
              'A core competency required for scalable software engineering architectures.'}
          </p>
        </div>

        {/* Prerequisites */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Prerequisites ({skillDetails?.prerequisites?.length || 0})
          </h3>
          {skillDetails?.prerequisites && skillDetails.prerequisites.length > 0 ? (
            <div className="space-y-1.5">
              {skillDetails.prerequisites.map((p) => (
                <div
                  key={p.skill_id}
                  className="flex items-center justify-between p-2 rounded-md bg-slate-50 border border-slate-100 text-xs"
                >
                  <span className="font-medium text-slate-800">{p.skill_name}</span>
                  <span className="text-[10px] uppercase font-medium px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-600">
                    {p.relationship_type}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic p-2 bg-slate-50 rounded">
              Foundational skill (no prerequisite requirements).
            </div>
          )}
        </div>

        {/* Downstream Unlocked Skills */}
        {skillDetails?.dependents && skillDetails.dependents.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Unlocks Downstream ({skillDetails.dependents.length})
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {skillDetails.dependents.map((d) => (
                <span
                  key={d.skill_id}
                  className="text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200/80 flex items-center gap-1"
                >
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  {d.skill_name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Verified Curated Resources */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            Curated Official Resources
          </h3>
          {skillDetails?.learning_resources && skillDetails.learning_resources.length > 0 ? (
            <div className="space-y-2">
              {skillDetails.learning_resources.map((res) => (
                <a
                  key={res.id}
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50/80 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-700 group-hover:underline">
                      {res.title}
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {res.rationale}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                    <span>{res.provider}</span>
                    <span>•</span>
                    <span>~{res.estimated_mins} mins</span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic p-2 bg-slate-50 rounded">
              Standard official documentation will be referenced in your roadmap.
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col gap-2">
        <button
          onClick={() => onTakeAssessment(node.skill_id)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white font-medium text-xs rounded-md shadow-xs transition-colors cursor-pointer"
        >
          <Award className="w-4 h-4" />
          Take Competency Assessment
        </button>

        <button
          onClick={onGoToRoadmap}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-md transition-colors cursor-pointer"
        >
          <Compass className="w-4 h-4 text-slate-500" />
          View in Adaptive Roadmap
        </button>
      </div>
    </div>
  );
};
