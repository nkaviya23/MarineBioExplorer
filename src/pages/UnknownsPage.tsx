import React, { useEffect, useState } from 'react';
import { HelpCircle, Compass, Waves } from 'lucide-react';
import { EmptyState } from '../components/EmptyState.tsx';

interface UnknownsPageProps {
  onNavigate: (view: string, id?: string) => void;
}

export const UnknownsPage: React.FC<UnknownsPageProps> = ({ onNavigate }) => {
  const [unknowns, setUnknowns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/unknowns')
      .then((res) => res.json())
      .then((data) => setUnknowns(data.unknowns || []))
      .catch((err) => console.error('Failed to load unknowns:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
      <div className="mb-5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/60 border border-amber-800/60 text-amber-300 text-xs font-mono mb-2">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>MYSTERIES &amp; UNIDENTIFIED SPECIMENS</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
          Unidentified Ocean Observations
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
          These observations were submitted by ocean explorers but require community and taxonomic expertise to identify.
          Help review photos and characteristics.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500 flex flex-col items-center justify-center">
          <Waves className="w-8 h-8 text-cyan-600 animate-pulse mb-3" />
          <p className="text-sm">Querying unknown observations...</p>
        </div>
      ) : unknowns.length === 0 ? (
        <EmptyState
          title="No unknown observations pending community review"
          description="All current ocean observations have either been resolved or none have been submitted yet. Encountered an unfamiliar marine organism? Share a photo to request community assistance."
          icon={Compass}
          actionText="Submit an Unidentified Organism"
          onAction={() => onNavigate('identify')}
          secondaryActionText="Explore Verified Library"
          onSecondaryAction={() => onNavigate('explore')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {unknowns.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-video bg-black">
                  {item.media && item.media[0] ? (
                    item.media[0].file_type === 'video' ? (
                      <video src={item.media[0].file_path} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={item.media[0].file_path} alt="" className="w-full h-full object-cover" />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                      No media available
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="text-base font-semibold text-slate-100">
                    {item.title || item.suspected_common_name || 'Unidentified Marine Life'}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{item.observation_location || 'Location unrecorded'}</span>
                    {item.observation_date && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{item.observation_date}</span>
                      </>
                    )}
                  </div>

                  {item.contributor_notes && (
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mt-2">
                      {item.contributor_notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-slate-800/60 mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>By {item.contributor_attribution || 'Contributor'}</span>
                <span className="font-mono text-[11px] text-amber-400">Awaiting ID</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
