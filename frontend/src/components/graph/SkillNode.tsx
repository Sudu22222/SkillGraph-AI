import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { CheckCircle2, Clock, AlertCircle, Circle, Sparkles, BookOpen } from 'lucide-react';
import { GraphNodeData } from '../../types';

interface SkillNodeProps {
  data: GraphNodeData & {
    onSelectNode?: (nodeData: GraphNodeData) => void;
  };
  selected?: boolean;
}

export const SkillNode = memo(({ data, selected }: SkillNodeProps) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'demonstrated':
        return {
          bg: 'bg-emerald-50/90 hover:bg-emerald-50',
          border: 'border-emerald-300',
          badgeBg: 'bg-emerald-100 text-emerald-800',
          icon: CheckCircle2,
          iconColor: 'text-emerald-600',
          label: 'Demonstrated',
        };
      case 'developing':
        return {
          bg: 'bg-amber-50/90 hover:bg-amber-50',
          border: 'border-amber-300',
          badgeBg: 'bg-amber-100 text-amber-800',
          icon: Clock,
          iconColor: 'text-amber-600',
          label: 'Developing',
        };
      case 'missing':
        return {
          bg: 'bg-rose-50/90 hover:bg-rose-50',
          border: 'border-rose-300',
          badgeBg: 'bg-rose-100 text-rose-800',
          icon: AlertCircle,
          iconColor: 'text-rose-600',
          label: 'Missing Gap',
        };
      default:
        return {
          bg: 'bg-white hover:bg-slate-50',
          border: 'border-slate-200',
          badgeBg: 'bg-slate-100 text-slate-700',
          icon: Circle,
          iconColor: 'text-slate-400',
          label: 'Unassessed',
        };
    }
  };

  const statusConfig = getStatusConfig(data.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div
      onClick={() => data.onSelectNode && data.onSelectNode(data)}
      className={`w-64 rounded-lg border p-3 shadow-xs transition-all cursor-pointer ${
        statusConfig.bg
      } ${statusConfig.border} ${
        selected ? 'ring-2 ring-blue-600 border-blue-600 shadow-md' : ''
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 !bg-slate-400 border !border-white"
      />

      {/* Top badges */}
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 truncate">
          {data.category}
        </span>
        <div className="flex items-center gap-1">
          {data.is_role_required && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 uppercase tracking-wider">
              {data.role_importance || 'Required'}
            </span>
          )}
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-1 ${statusConfig.badgeBg}`}
          >
            <StatusIcon className={`w-3 h-3 ${statusConfig.iconColor}`} />
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Title */}
      <div className="font-semibold text-slate-900 text-xs mb-1 truncate">
        {data.label}
      </div>

      {/* Bottom Info */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 mt-1.5">
        <span className="capitalize">{data.difficulty}</span>
        {data.status === 'demonstrated' ? (
          <span className="font-medium text-emerald-700">{data.proficiency_score}% verified</span>
        ) : data.is_prerequisite_ready ? (
          <span className="text-blue-700 font-medium flex items-center gap-0.5">
            <Sparkles className="w-3 h-3" /> Ready to learn
          </span>
        ) : (
          <span className="text-slate-400">Prereqs locked</span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2 !bg-slate-400 border !border-white"
      />
    </div>
  );
});

SkillNode.displayName = 'SkillNode';
