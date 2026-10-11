import React, { useState } from 'react';
import { Waves, LogIn, Lock, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface LoginPageProps {
  onNavigate: (view: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      onNavigate('contributor-dashboard');
    } else {
      setError(res.error || 'Failed to sign in.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <img
            src="/src/assets/images/marine_bio_logo_1791687723300.jpg"
            alt="Marine Bio Explorer Logo"
            className="w-16 h-16 rounded-full object-cover border-2 border-cyan-500/50 shadow-lg mx-auto"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-2xl font-bold text-slate-100">Explorer &amp; Contributor Sign In</h1>
          <p className="text-xs text-slate-400">
            Sign in to submit marine discoveries, request organism identification, and track your observations.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="explorer@ocean.org"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-cyan-950"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          <div className="pt-2 text-center text-xs text-slate-400 space-y-2">
            <p>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => onNavigate('register')}
                className="text-cyan-400 hover:text-cyan-300 font-medium underline cursor-pointer"
              >
                Register as Contributor
              </button>
            </p>
          </div>
        </form>

        {/* Clear Separation Notice to Administrator Entry */}
        <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/80 text-center">
          <p className="text-xs text-slate-400">
            Are you the platform founder or administrator?
          </p>
          <button
            onClick={() => onNavigate('admin-login')}
            className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" />
            Go to Dedicated Administrator Portal <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
