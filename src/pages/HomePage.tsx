import React, { useEffect, useState } from 'react';
import { Waves, Search, PlusCircle, ShieldCheck, Database, Compass, ArrowRight } from 'lucide-react';
import { EmptyState } from '../components/EmptyState.tsx';

interface HomePageProps {
  onNavigate: (view: string, id?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<{ organismsCount: number; mediaCount: number } | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => setStats({ organismsCount: 0, mediaCount: 0 }));
  }, []);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-10 sm:py-14 bg-radial-[at_50%_0%] from-slate-900 via-slate-950 to-slate-950 border-b border-slate-900">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs font-mono mb-4 shadow-sm">
            <Waves className="w-3.5 h-3.5" />
            <span>COMMUNITY-POWERED OCEAN TAXONOMY</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-100 uppercase max-w-4xl mx-auto leading-tight sm:leading-none">
            EXPLORE LIFE BENEATH THE OCEANS
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Discover marine organisms. Share what you find. Help build a growing, verified library of ocean life.
          </p>

          {/* Primary Actions */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('explore')}
              className="px-6 py-3.5 text-sm font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-lg shadow-cyan-900/30 flex items-center gap-2 cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              Explore the Library
            </button>

            <button
              onClick={() => onNavigate('identify')}
              className="px-6 py-3.5 text-sm font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              Identify Something
            </button>

            <button
              onClick={() => onNavigate('contribute')}
              className="px-6 py-3.5 text-sm font-semibold rounded-xl bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-cyan-800/60 transition-all flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Contribute a Discovery
            </button>
          </div>
        </div>
      </section>

      {/* Real Library Status & Empty-State Handling */}
      <section className="py-8 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-900 gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-100 tracking-tight">Verified Organism Catalog</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Curated and authenticated biological profiles with confirmed media provenance.
            </p>
          </div>
          <button
            onClick={() => onNavigate('explore')}
            className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
          >
            Browse all entries <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zero-dummy rule: When empty, display authentic empty state */}
        {stats && stats.organismsCount === 0 ? (
          <div className="py-3">
            <EmptyState
              title="The exploration library is waiting for its first discovery"
              description="No organisms have been cataloged yet. As researchers, divers, and community contributors submit observations and verify specimens, approved profiles will appear here."
              icon={Database}
              actionText="Contribute First Discovery"
              onAction={() => onNavigate('contribute')}
              secondaryActionText="Identify an Observation"
              onSecondaryAction={() => onNavigate('identify')}
            />
          </div>
        ) : (
          <div className="py-4">
            <div className="text-center py-4">
              <button
                onClick={() => onNavigate('explore')}
                className="px-5 py-2.5 bg-cyan-600/20 border border-cyan-700/50 text-cyan-300 rounded-lg text-sm font-medium hover:bg-cyan-600/30 transition-colors cursor-pointer"
              >
                View Catalog Entries ({stats?.organismsCount} Verified)
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Feature Pillars */}
      <section className="py-8 sm:py-10 bg-slate-950 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <h2 className="text-2xl font-bold text-slate-100">Designed for Scientific Rigor &amp; Provenance</h2>
            <p className="text-sm text-slate-400 mt-2">
              Every photograph, video, and identification follows strict documentation ethics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-200">Community Identification</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Found a specimen during a dive or shoreline walk? Submit observation imagery for community analysis and administrator verification.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-200">Explicit Rights Separation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Public display permission and AI/visual-identification permission are treated as distinct rights. Your media is never repurposed without clear authorization.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-200">Protected Admin Curation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Submissions are reviewed before inclusion in the public library, ensuring accurate taxonomy, valid licenses, and verified observation data.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
