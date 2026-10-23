import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Settings, Cpu, ShieldCheck, Check, AlertCircle, RefreshCw } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile, refreshUser } = useAuth();

  const [educationLevel, setEducationLevel] = useState(
    user?.profile?.education_level || 'Undergraduate'
  );
  const [weeklyHours, setWeeklyHours] = useState(
    user?.profile?.weekly_study_hours || 10
  );
  const [learningStyle, setLearningStyle] = useState(
    user?.profile?.learning_style || 'hands_on'
  );
  const [bio, setBio] = useState(user?.profile?.bio || '');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Health / AI Status
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [testingAi, setTestingAi] = useState(false);

  useEffect(() => {
    checkAiHealth();
  }, []);

  const checkAiHealth = async () => {
    setTestingAi(true);
    try {
      const res = await api.get<any>('/health');
      setAiStatus(res);
    } catch {}
    finally {
      setTestingAi(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await updateProfile({
        education_level: educationLevel,
        weekly_study_hours: weeklyHours,
        learning_style: learningStyle,
        bio,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      alert('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          Profile & System Settings
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Adjust your academic baseline, weekly study commitments, and inspect server-side AI model configurations.
        </p>
      </div>

      {/* Student Profile Form */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
          Student Profile Details
        </h3>

        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-1.5 font-medium">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Profile settings saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                disabled
                value={user?.full_name || ''}
                className="w-full text-xs bg-slate-100 border border-slate-300 rounded px-3 py-2 text-slate-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Account Email
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full text-xs bg-slate-100 border border-slate-300 rounded px-3 py-2 text-slate-600 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Education Level
              </label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:border-blue-600 focus:outline-hidden cursor-pointer"
              >
                <option value="High School">High School / Secondary</option>
                <option value="Undergraduate">Undergraduate Student</option>
                <option value="Graduate">Graduate / Masters</option>
                <option value="Self-taught">Self-taught / Career Transition</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Preferred Learning Style
              </label>
              <select
                value={learningStyle}
                onChange={(e) => setLearningStyle(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:border-blue-600 focus:outline-hidden cursor-pointer"
              >
                <option value="hands_on">Hands-on Projects & Exercises</option>
                <option value="reading">Official Documentation & Reading</option>
                <option value="mixed">Balanced Theory & Practice</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Weekly Study Commitment (Hours)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="4"
                max="40"
                step="2"
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(Number(e.target.value))}
                className="flex-1 accent-blue-700 cursor-pointer"
              />
              <span className="font-semibold text-xs text-slate-900 w-16 text-right">
                {weeklyHours} hrs/wk
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Used by the adaptive engine to estimate milestone deadlines and pacing.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Bio / Academic Background
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about your background, career focus, or target companies..."
              className="w-full text-xs bg-white border border-slate-300 rounded p-3 text-slate-800 focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          <div className="pt-2 text-right">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-medium shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* AI & Security Configuration Status */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-blue-700" />
            AI Engine & Security Configuration
          </h3>
          <button
            onClick={checkAiHealth}
            disabled={testingAi}
            className="text-xs text-blue-700 hover:text-blue-900 font-medium flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingAi ? 'animate-spin' : ''}`} />
            <span>Test Health</span>
          </button>
        </div>

        <div className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Current AI Engine Mode:</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded ${
                aiStatus?.ai_engine?.live_gemini
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {aiStatus?.ai_engine?.live_gemini ? 'Official Google Gemini SDK' : 'Local Deterministic Fallback'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-600">Configured Model:</span>
            <span className="font-mono text-slate-900">
              {aiStatus?.ai_engine?.model || 'gemini-2.5-flash'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-600">Database Connection:</span>
            <span className="font-semibold text-emerald-700">
              {aiStatus?.database === 'connected' ? 'Connected (SQLAlchemy)' : 'Checking...'}
            </span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 leading-relaxed">
          <strong>Security Note:</strong> All Gemini API keys and database credentials reside strictly on the backend server.
          The frontend never exposes API keys or conducts unauthorized external requests.
        </div>
      </div>
    </div>
  );
};
