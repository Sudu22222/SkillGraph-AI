import React from 'react';
import {
  Network,
  Compass,
  Award,
  FileSearch,
  ArrowRight,
  CheckCircle2,
  Cpu,
  ShieldCheck,
  BookOpen,
  FolderGit2,
} from 'lucide-react';

interface HomePageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onGetStarted, onLogin }) => {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans selection:bg-blue-100">
      {/* Navigation */}
      <header className="border-b border-slate-200 bg-white/95 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
              SG
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base tracking-tight">
                SkillGraph AI
              </span>
              <span className="hidden sm:inline-block text-xs text-slate-400 ml-2 border-l border-slate-200 pl-2">
                Adaptive Skill Gap Intelligence
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onLogin}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-md transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="text-xs font-medium bg-blue-700 hover:bg-blue-800 text-white px-3.5 py-2 rounded-md transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-24 border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 mb-6">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
            <span>Evidence-based career skill analysis & adaptive planning</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight mb-5">
            Understand your skills. <br className="hidden sm:inline" />
            <span className="text-blue-700">Plan your next move.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
            Most career tools rely on keyword matching that confuses resume mentions with real competence.
            SkillGraph AI maps your demonstrated capabilities onto an interactive prerequisite graph, detects critical knowledge gaps, and calculates an adaptive learning roadmap.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-medium text-sm rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Start Exploring Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onLogin}
              className="w-full sm:w-auto px-6 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 font-medium text-sm rounded-md transition-colors cursor-pointer"
            >
              <span>Sign In with Demo Account</span>
            </button>
          </div>

          <div className="mt-6 text-xs text-slate-500 flex items-center justify-center gap-4">
            <span>✓ No credit card required</span>
            <span>•</span>
            <span>✓ Instant demo profile included</span>
            <span>•</span>
            <span>✓ Transparent rubrics</span>
          </div>
        </div>
      </section>

      {/* Workflow Step-by-Step */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
            How SkillGraph AI Works
          </h2>
          <p className="text-sm text-slate-600">
            A principled, deterministic engineering approach to skill discovery and learning roadmaps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            {
              step: '01',
              title: 'Choose Target Role',
              desc: 'Select from curated career roles or paste a real job posting description.',
              icon: FileSearch,
            },
            {
              step: '02',
              title: 'Verify Skills',
              desc: 'Assess competence via deterministic technical quizzes and rubric-graded tasks.',
              icon: Award,
            },
            {
              step: '03',
              title: 'Visualize Dependencies',
              desc: 'Explore your DAG skill graph with prerequisite readiness indicators.',
              icon: Network,
            },
            {
              step: '04',
              title: 'Follow Roadmap',
              desc: 'Personalized learning sequence pacing around your weekly study commitment.',
              icon: Compass,
            },
            {
              step: '05',
              title: 'Demonstrate Mastery',
              desc: 'Submit portfolio projects and retake assessments to unlock downstream skills.',
              icon: FolderGit2,
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-lg border border-slate-200 bg-white shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-blue-700 font-mono">
                      {item.step}
                    </span>
                    <Icon className="w-4 h-4 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Deep Dive */}
      <section className="py-14 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center">
                <Network className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Interactive Skill Graph (DAG)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Directed Acyclic Graph ensuring valid learning orders. Cycles are automatically rejected.
                Nodes clearly differentiate between demonstrated competence, developing skills, and missing prerequisites.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-9 h-9 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Evidence vs Keyword Mentions
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Resume keywords are explicitly treated as unassessed claims rather than proof of competence.
                Students verify ability through deterministic assessments and transparent rubrics.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-9 h-9 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Verified Official Documentation
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                No hallucinated resources or arbitrary affiliate links. Every recommendation points to authoritative official documentation like MDN Web Docs, Python.org, React.dev, and PostgreSQL.org.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="py-12 bg-slate-50 text-center border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Ready to map your engineering skill dependencies?
          </h2>
          <p className="text-xs text-slate-600 max-w-lg mx-auto mb-5">
            Identify your genuine gaps, prepare for your target career role, and follow a structured adaptive roadmap.
          </p>
          <button
            onClick={onGetStarted}
            className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-medium text-xs rounded-md shadow-xs transition-colors cursor-pointer"
          >
            Launch SkillGraph AI
          </button>
          <div className="mt-8 text-[11px] text-slate-400">
            SkillGraph AI — Adaptive Skill Gap Intelligence. Built for engineering precision.
          </div>
        </div>
      </footer>
    </div>
  );
};
