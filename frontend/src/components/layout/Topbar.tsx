import React, { useState, useEffect } from 'react';
import { Menu, Cpu, Globe, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

interface TopbarProps {
  currentTab: string;
  onOpenSidebar: () => void;
  onNavigateHome: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentTab,
  onOpenSidebar,
  onNavigateHome,
}) => {
  const { user } = useAuth();
  const [aiStatus, setAiStatus] = useState<{ live_gemini: boolean; model: string }>({
    live_gemini: false,
    model: 'local-deterministic-engine',
  });

  useEffect(() => {
    api
      .get<{ ai_engine: { live_gemini: boolean; model: string } }>('/health')
      .then((res) => {
        if (res && res.ai_engine) {
          setAiStatus(res.ai_engine);
        }
      })
      .catch(() => {});
  }, []);

  const titles: Record<string, string> = {
    dashboard: 'Student Dashboard',
    graph: 'Skill Dependency Graph (DAG)',
    roadmap: 'Adaptive Learning Roadmap',
    roles: 'Career Roles & Gap Analysis',
    assessments: 'Skill Competency Assessments',
    'job-analysis': 'Job Description & Resume Analysis',
    projects: 'Project Portfolio & Practical Evidence',
    skills: 'Demonstrated Skills & Taxonomy',
    analytics: 'Skill Analytics & Exportable Report',
    settings: 'Profile & Settings',
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-sm font-semibold text-slate-900 tracking-tight">
            {titles[currentTab] || 'SkillGraph AI'}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Engine mode badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
          <Cpu className="w-3.5 h-3.5 text-blue-600" />
          <span>
            {aiStatus.live_gemini ? `Gemini AI (${aiStatus.model})` : 'Deterministic AI Mode'}
          </span>
        </div>

        {/* Public site link */}
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">Public Overview</span>
        </button>
      </div>
    </header>
  );
};
