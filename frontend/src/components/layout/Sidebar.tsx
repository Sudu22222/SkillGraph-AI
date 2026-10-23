import React from 'react';
import {
  LayoutDashboard,
  Network,
  Briefcase,
  Compass,
  Award,
  FileSearch,
  FolderGit2,
  BarChart3,
  Settings,
  LogOut,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'graph', label: 'Skill Graph', icon: Network },
    { id: 'roadmap', label: 'Learning Roadmap', icon: Compass },
    { id: 'roles', label: 'Career Roles', icon: Briefcase },
    { id: 'assessments', label: 'Assessments', icon: Award },
    { id: 'job-analysis', label: 'Job & Resume Analysis', icon: FileSearch },
    { id: 'projects', label: 'Project Portfolio', icon: FolderGit2 },
    { id: 'skills', label: 'My Skills & Taxonomy', icon: Layers },
    { id: 'analytics', label: 'Analytics & Report', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (id: string) => {
    onSelectTab(id);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const targetRoleTitle = user?.profile?.target_role?.title || 'Role Unassigned';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-xs"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="px-5 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
              SG
            </div>
            <div>
              <div className="font-semibold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
                SkillGraph AI
                <span className="text-[10px] font-normal uppercase tracking-wider px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal">
                Adaptive Skill Gap Intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Target Role Snippet */}
        <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100">
          <div className="text-[11px] uppercase tracking-wider font-medium text-slate-400">
            Target Career Role
          </div>
          <div className="text-xs font-semibold text-slate-800 flex items-center justify-between mt-0.5">
            <span className="truncate">{targetRoleTitle}</span>
            <button
              onClick={() => handleNavClick('roles')}
              className="text-[11px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
            >
              Switch
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-800 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-blue-700' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-600" />}
              </button>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-100 bg-white">
          <div className="p-2.5 rounded-lg bg-slate-50 flex items-center justify-between">
            <div className="truncate mr-2">
              <div className="text-xs font-medium text-slate-900 truncate">
                {user?.full_name || 'Alex Chen'}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {user?.email || 'demo@skillgraph.ai'}
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
