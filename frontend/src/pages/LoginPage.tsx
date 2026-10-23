import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

interface LoginPageProps {
  onGoToRegister: () => void;
  onGoHome: () => void;
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onGoToRegister,
  onGoHome,
  onSuccess,
}) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail('demo@skillgraph.ai');
    setPassword('password123');
    setError(null);
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
          Sign in to your account
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Or{' '}
          <button
            onClick={onGoToRegister}
            className="font-medium text-blue-700 hover:text-blue-800 cursor-pointer"
          >
            create a new student profile
          </button>
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-6 px-4 shadow-sm border border-slate-200 sm:rounded-lg sm:px-8">
          {/* Quick Demo Button */}
          <div className="mb-5 p-3 rounded-md bg-blue-50/70 border border-blue-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-blue-900 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                Instant Demo Account
              </div>
              <div className="text-[11px] text-blue-700">
                demo@skillgraph.ai / password123
              </div>
            </div>
            <button
              type="button"
              onClick={fillDemoAccount}
              className="px-2.5 py-1 text-xs font-medium bg-blue-700 hover:bg-blue-800 text-white rounded transition-colors cursor-pointer"
            >
              Autofill
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-slate-700"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-slate-300 px-3 py-2 text-xs placeholder-slate-400 shadow-2xs focus:border-blue-600 focus:outline-hidden"
                  placeholder="student@university.edu"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-slate-700"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-slate-300 px-3 py-2 text-xs placeholder-slate-400 shadow-2xs focus:border-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-1.5 py-2.5 px-4 border border-transparent rounded-md shadow-xs text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 focus:outline-hidden cursor-pointer disabled:opacity-50 transition-colors"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
