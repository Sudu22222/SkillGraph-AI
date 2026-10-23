import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CareerRole } from '../types';
import { ArrowRight, AlertCircle } from 'lucide-react';

interface RegisterPageProps {
  onGoToLogin: () => void;
  onGoHome: () => void;
  onSuccess: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onGoToLogin,
  onGoHome,
  onSuccess,
}) => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [educationLevel, setEducationLevel] = useState('Undergraduate');
  const [targetRoleId, setTargetRoleId] = useState<number | null>(null);
  const [weeklyHours, setWeeklyHours] = useState(10);
  const [learningStyle, setLearningStyle] = useState('hands_on');

  const [roles, setRoles] = useState<CareerRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<CareerRole[]>('/roles/')
      .then((data) => {
        setRoles(data);
        if (data.length > 0) {
          setTargetRoleId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await register({
        full_name: fullName,
        email,
        password,
        education_level: educationLevel,
        target_role_id: targetRoleId,
        weekly_study_hours: weeklyHours,
        learning_style: learningStyle,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div
          onClick={onGoHome}
          className="flex items-center justify-center gap-2 mb-3 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
            SG
          </div>
          <span className="font-bold text-slate-900 text-lg tracking-tight">
            SkillGraph AI
          </span>
        </div>
        <h2 className="text-center text-xl font-bold tracking-tight text-slate-900">
          Create student profile
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Already registered?{' '}
          <button
            onClick={onGoToLogin}
            className="font-medium text-blue-700 hover:text-blue-800 cursor-pointer"
          >
            Sign in
          </button>
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <div className="bg-white py-6 px-4 shadow-sm border border-slate-200 sm:rounded-lg sm:px-8">
          {error && (
            <div className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Jordan Smith"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-xs shadow-2xs focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Email address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-xs shadow-2xs focus:border-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Password *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-xs shadow-2xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Target Career Role
                </label>
                <select
                  value={targetRoleId || ''}
                  onChange={(e) => setTargetRoleId(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-xs shadow-2xs bg-white focus:border-blue-600 focus:outline-hidden cursor-pointer"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} ({r.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Education Level
                </label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-xs shadow-2xs bg-white focus:border-blue-600 focus:outline-hidden cursor-pointer"
                >
                  <option value="High School">High School / Secondary</option>
                  <option value="Undergraduate">Undergraduate Student</option>
                  <option value="Graduate">Graduate / Masters</option>
                  <option value="Self-taught">Self-taught / Career Transition</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Weekly Study Commitment
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="range"
                    min="4"
                    max="40"
                    step="2"
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(Number(e.target.value))}
                    className="flex-1 accent-blue-700 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-900 w-12 text-right">
                    {weeklyHours} hrs
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Preferred Learning Style
                </label>
                <select
                  value={learningStyle}
                  onChange={(e) => setLearningStyle(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-xs shadow-2xs bg-white focus:border-blue-600 focus:outline-hidden cursor-pointer"
                >
                  <option value="hands_on">Hands-on Projects & Exercises</option>
                  <option value="reading">Official Documentation & Reading</option>
                  <option value="mixed">Balanced Theory & Practice</option>
                </select>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-1.5 py-2.5 px-4 border border-transparent rounded-md shadow-xs text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 focus:outline-hidden cursor-pointer disabled:opacity-50 transition-colors"
              >
                {loading ? 'Creating Profile & Roadmap...' : 'Complete Profile & Launch'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
