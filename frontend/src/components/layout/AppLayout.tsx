import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface AppLayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onNavigateHome: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentTab,
  onSelectTab,
  onNavigateHome,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Topbar
          currentTab={currentTab}
          onOpenSidebar={() => setSidebarOpen(true)}
          onNavigateHome={onNavigateHome}
        />
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
