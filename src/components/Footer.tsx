import React from 'react';
import { Waves, ShieldCheck, Lock } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-slate-900 bg-slate-950 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <img
                src="/src/assets/images/marine_bio_logo_1791687723300.jpg"
                alt="Marine Bio Explorer Logo"
                className="w-7 h-7 rounded-full object-cover border border-cyan-500/40"
                referrerPolicy="no-referrer"
              />
              <span className="font-semibold text-slate-200 text-sm">Marine Bio Explorer</span>
            </div>
            <p className="text-slate-400 leading-relaxed max-w-md">
              A community-powered platform dedicated to documenting and verifying marine organisms.
              Every observation preserves creator provenance, licensing terms, and explicit rights permissions.
            </p>
            <div className="flex items-center gap-2 text-cyan-400/90 text-[11px] pt-1">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Independent Public Display &amp; Visual-AI Reference Permissions</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Explore
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('explore')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  Verified Organism Library
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('identify')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  Identification Helper
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('unknowns')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  Unknown Observations
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('contribute')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  Submit a Discovery
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Governance
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('login')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  Contributor Portal
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('register')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  Create Contributor Account
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('admin-login')}
                  className="flex items-center gap-1.5 text-amber-400/80 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  <Lock className="w-3 h-3" />
                  Administrator Portal
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-900 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} Marine Bio Explorer. Built for scientific integrity and ocean discovery.</p>
          <p className="font-mono text-slate-400">Zero-dummy initial database architecture</p>
        </div>
      </div>
    </footer>
  );
};
