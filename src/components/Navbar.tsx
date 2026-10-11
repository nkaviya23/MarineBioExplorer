import React from 'react';
import { Waves, Search, PlusCircle, HelpCircle, User, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, id?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    onNavigate('home');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <img
            src="/src/assets/images/marine_bio_logo_1791687723300.jpg"
            alt="Marine Bio Explorer Logo"
            className="w-10 h-10 rounded-full object-cover shadow-md group-hover:scale-105 transition-transform border border-cyan-500/50 ring-2 ring-cyan-500/20"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-slate-100 text-lg group-hover:text-cyan-400 transition-colors">
                Marine Bio Explorer
              </span>
            </div>
            <p className="text-[11px] text-cyan-400/80 tracking-wide uppercase font-mono hidden sm:block">
              Community Ocean Discovery
            </p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => onNavigate('explore')}
            className={`transition-colors cursor-pointer ${
              currentView === 'explore' || currentView === 'organism-detail'
                ? 'text-cyan-400 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Explore Library
          </button>
          <button
            onClick={() => onNavigate('identify')}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              currentView === 'identify' ? 'text-cyan-400 font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Search className="w-4 h-4" />
            Identify
          </button>
          <button
            onClick={() => onNavigate('contribute')}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              currentView === 'contribute' ? 'text-cyan-400 font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Contribute
          </button>
          <button
            onClick={() => onNavigate('unknowns')}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              currentView === 'unknowns' ? 'text-cyan-400 font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Unknown Observations
          </button>
        </nav>

        {/* User state & Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {user.role === 'ADMIN' ? (
                <button
                  onClick={() => onNavigate('admin-dashboard')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    currentView === 'admin-dashboard'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-900 text-amber-400 border-amber-500/30 hover:bg-amber-950/40'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  Admin Workspace
                </button>
              ) : (
                <button
                  onClick={() => onNavigate('contributor-dashboard')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    currentView === 'contributor-dashboard'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                      : 'bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  My Submissions
                </button>
              )}

              <span className="hidden lg:inline text-xs text-slate-400 max-w-[120px] truncate">
                {user.full_name}
              </span>

              <button
                onClick={handleLogout}
                title="Log out"
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('login')}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate('register')}
                className="hidden sm:inline-block px-3.5 py-1.5 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors cursor-pointer shadow-sm shadow-cyan-950"
              >
                Join as Contributor
              </button>
              <button
                onClick={() => onNavigate('admin-login')}
                title="Administrator Portal"
                className="p-1.5 text-slate-500 hover:text-amber-400 rounded-lg transition-colors cursor-pointer"
              >
                <Shield className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile nav subbar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-900 bg-slate-950 px-2 py-2 text-xs">
        <button
          onClick={() => onNavigate('explore')}
          className={`py-1 px-2 ${currentView === 'explore' ? 'text-cyan-400 font-medium' : 'text-slate-400'}`}
        >
          Explore
        </button>
        <button
          onClick={() => onNavigate('identify')}
          className={`py-1 px-2 ${currentView === 'identify' ? 'text-cyan-400 font-medium' : 'text-slate-400'}`}
        >
          Identify
        </button>
        <button
          onClick={() => onNavigate('contribute')}
          className={`py-1 px-2 ${currentView === 'contribute' ? 'text-cyan-400 font-medium' : 'text-slate-400'}`}
        >
          Contribute
        </button>
        <button
          onClick={() => onNavigate('unknowns')}
          className={`py-1 px-2 ${currentView === 'unknowns' ? 'text-cyan-400 font-medium' : 'text-slate-400'}`}
        >
          Unknowns
        </button>
      </div>
    </header>
  );
};
