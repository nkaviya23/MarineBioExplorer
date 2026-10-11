import React, { useState, useEffect } from 'react';
import { Shield, Lock, KeyRound, AlertTriangle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface AdminLoginPageProps {
  onNavigate: (view: string) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onNavigate }) => {
  const { adminLogin, adminSetup } = useAuth();

  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [checkingSetup, setCheckingSetup] = useState(true);

  // Standard Admin Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initial Admin Setup state (when no admin exists yet)
  const [setupMode, setSetupMode] = useState(false);
  const [setupFullName, setSetupFullName] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupSecret, setSetupSecret] = useState('');
  const [setupSuccess, setSetupSuccess] = useState('');

  useEffect(() => {
    fetch('/api/admin/setup-status')
      .then((res) => res.json())
      .then((data) => {
        setHasAdmin(data.hasAdmin);
        if (!data.hasAdmin) {
          setSetupMode(true);
        }
      })
      .catch(() => setHasAdmin(true))
      .finally(() => setCheckingSetup(false));
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await adminLogin(email, password);
    setLoading(false);

    if (res.success) {
      onNavigate('admin-dashboard');
    } else {
      setError(res.error || 'Administrator authentication failed.');
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await adminSetup(setupEmail, setupPassword, setupFullName, setupSecret);
    setLoading(false);

    if (res.success) {
      setSetupSuccess(res.message || 'Administrator initialized successfully.');
      setTimeout(() => {
        onNavigate('admin-dashboard');
      }, 1200);
    } else {
      setError(res.error || 'Setup authorization failed.');
    }
  };

  if (checkingSetup) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center text-slate-500 text-sm">
        Verifying administrator console configuration...
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="relative inline-block mx-auto">
            <img
              src="/src/assets/images/marine_bio_logo_1791687723300.jpg"
              alt="Marine Bio Explorer Logo"
              className="w-16 h-16 rounded-full object-cover border-2 border-amber-500/60 shadow-lg mx-auto"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-950 border border-amber-600 text-amber-400 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Administrator Portal
          </h1>
          <p className="text-xs text-slate-400">
            Protected management workspace for library curation, submission approvals, and taxonomy verification.
          </p>
        </div>

        {/* INITIAL ADMIN SETUP CONSOLE (WHEN NO ADMIN EXISTS IN DATABASE) */}
        {setupMode ? (
          <div className="p-6 rounded-2xl border border-amber-800/70 bg-slate-900/80 space-y-5">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Initial Administrator Setup Required</span>
                No administrator account exists in the database. As the founder, authorize your administrator profile using the secure setup key.
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs">
                {error}
              </div>
            )}

            {setupSuccess && (
              <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {setupSuccess}
              </div>
            )}

            <form onSubmit={handleSetupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Administrator Full Name
                </label>
                <input
                  type="text"
                  required
                  value={setupFullName}
                  onChange={(e) => setSetupFullName(e.target.value)}
                  placeholder="Founder Administrator"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Admin Email Address
                </label>
                <input
                  type="email"
                  required
                  value={setupEmail}
                  onChange={(e) => setSetupEmail(e.target.value)}
                  placeholder="admin@marinebio.org"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Master Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Setup Secret Key (from ADMIN_SETUP_SECRET)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={setupSecret}
                    onChange={(e) => setSetupSecret(e.target.value)}
                    placeholder="Enter ADMIN_SETUP_SECRET"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Configured in `.env` (default dev key: <code>marine-bio-admin-secret-key-change-me</code>).
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-amber-950"
              >
                <Shield className="w-4 h-4" />
                {loading ? 'Authorizing...' : 'Initialize Founder Administrator'}
              </button>

              {hasAdmin && (
                <button
                  type="button"
                  onClick={() => setSetupMode(false)}
                  className="w-full text-xs text-slate-400 hover:text-slate-300 underline cursor-pointer text-center pt-2"
                >
                  Return to Standard Administrator Login
                </button>
              )}
            </form>
          </div>
        ) : (
          /* STANDARD ADMINISTRATOR LOGIN FORM */
          <form onSubmit={handleAdminLogin} className="p-6 rounded-2xl border border-amber-950/80 bg-slate-900/60 space-y-4 shadow-xl">
            {error && (
              <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@marinebio.org"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
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
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-amber-950"
            >
              <Lock className="w-4 h-4" />
              {loading ? 'Authenticating...' : 'Sign In as Administrator'}
            </button>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/60 mt-4">
              <button
                type="button"
                onClick={() => setSetupMode(true)}
                className="text-amber-400 hover:text-amber-300 font-mono text-[11px] cursor-pointer"
              >
                Run Admin Setup Key
              </button>
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="text-slate-400 hover:text-slate-300 cursor-pointer"
              >
                Explorer Login
              </button>
            </div>
          </form>
        )}

        <div className="text-center">
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Public Website
          </button>
        </div>
      </div>
    </div>
  );
};
