import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { SkillGraphPage } from './pages/SkillGraphPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { CareerRolesPage } from './pages/CareerRolesPage';
import { AssessmentsPage } from './pages/AssessmentsPage';
import { AssessmentRunnerPage } from './pages/AssessmentRunnerPage';
import { JobAnalysisPage } from './pages/JobAnalysisPage';
import { ProjectPortfolioPage } from './pages/ProjectPortfolioPage';
import { SkillsTaxonomyPage } from './pages/SkillsTaxonomyPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './services/api';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [publicView, setPublicView] = useState<'home' | 'login' | 'register'>('home');
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [activeAssessmentId, setActiveAssessmentId] = useState<number | null>(null);
  const [projectInitialTask, setProjectInitialTask] = useState<{ taskId?: number; skillId?: number }>({});

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs font-medium text-slate-500">
        Initializing SkillGraph AI session...
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    if (publicView === 'login') {
      return (
        <LoginPage
          onGoToRegister={() => setPublicView('register')}
          onGoHome={() => setPublicView('home')}
          onSuccess={() => setCurrentTab('dashboard')}
        />
      );
    }
    if (publicView === 'register') {
      return (
        <RegisterPage
          onGoToLogin={() => setPublicView('login')}
          onGoHome={() => setPublicView('home')}
          onSuccess={() => setCurrentTab('dashboard')}
        />
      );
    }
    return (
      <HomePage
        onGetStarted={() => setPublicView('register')}
        onLogin={() => setPublicView('login')}
      />
    );
  }

  // Authenticated Application Shell
  const handleTakeAssessment = async (skillId: number) => {
    try {
      const res = await api.get<any>(`/assessments/generate-for-skill/${skillId}`);
      setActiveAssessmentId(res.id);
      setCurrentTab('assessment-runner');
    } catch {
      alert('Could not launch assessment for this skill.');
    }
  };

  const handleStartExistingAssessment = (assessmentId: number) => {
    setActiveAssessmentId(assessmentId);
    setCurrentTab('assessment-runner');
  };

  const handleSubmitProjectForTask = (taskId?: number, skillId?: number) => {
    setProjectInitialTask({ taskId, skillId });
    setCurrentTab('projects');
  };

  return (
    <AppLayout
      currentTab={currentTab}
      onSelectTab={(tab) => {
        setCurrentTab(tab);
        if (tab !== 'assessment-runner') {
          setActiveAssessmentId(null);
        }
      }}
      onNavigateHome={() => setPublicView('home')}
    >
      {currentTab === 'dashboard' && (
        <DashboardPage onNavigateTab={(tab) => setCurrentTab(tab)} />
      )}

      {currentTab === 'graph' && (
        <SkillGraphPage
          onTakeAssessment={handleTakeAssessment}
          onGoToRoadmap={() => setCurrentTab('roadmap')}
        />
      )}

      {currentTab === 'roadmap' && (
        <RoadmapPage
          onTakeAssessment={handleTakeAssessment}
          onSubmitProject={handleSubmitProjectForTask}
        />
      )}

      {currentTab === 'roles' && (
        <CareerRolesPage
          onGoToRoadmap={() => setCurrentTab('roadmap')}
          onGoToGraph={(roleId) => setCurrentTab('graph')}
        />
      )}

      {currentTab === 'assessments' && (
        <AssessmentsPage
          onSelectAssessment={handleStartExistingAssessment}
          onGenerateForSkill={handleTakeAssessment}
        />
      )}

      {currentTab === 'assessment-runner' && activeAssessmentId && (
        <AssessmentRunnerPage
          assessmentId={activeAssessmentId}
          onBack={() => setCurrentTab('assessments')}
          onGoToRoadmap={() => setCurrentTab('roadmap')}
        />
      )}

      {currentTab === 'job-analysis' && (
        <JobAnalysisPage onGoToAssessments={() => setCurrentTab('assessments')} />
      )}

      {currentTab === 'projects' && (
        <ProjectPortfolioPage
          initialTaskId={projectInitialTask.taskId}
          initialSkillId={projectInitialTask.skillId}
        />
      )}

      {currentTab === 'skills' && (
        <SkillsTaxonomyPage onTakeAssessment={handleTakeAssessment} />
      )}

      {currentTab === 'analytics' && <AnalyticsPage />}

      {currentTab === 'settings' && <SettingsPage />}
    </AppLayout>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
