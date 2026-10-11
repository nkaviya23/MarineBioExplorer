import React, { useEffect, useState } from 'react';
import { Search, Compass, Waves, SlidersHorizontal, ImageOff, ArrowUpRight } from 'lucide-react';
import type { Organism } from '../types/index.ts';
import { EmptyState } from '../components/EmptyState.tsx';

interface ExplorePageProps {
  onNavigate: (view: string, id?: string) => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({ onNavigate }) => {
  const [organisms, setOrganisms] = useState<Organism[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [phylumFilter, setPhylumFilter] = useState('');
  const [habitatFilter, setHabitatFilter] = useState('');

  const fetchOrganisms = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (phylumFilter) params.set('phylum', phylumFilter);
      if (habitatFilter) params.set('habitat', habitatFilter);

      const res = await fetch(`/api/organisms?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrganisms(data.organisms || []);
      }
    } catch (err) {
      console.error('Failed to load organisms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganisms();
  }, [phylumFilter, habitatFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrganisms();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
          Verified Organism Library
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Explore officially documented marine species with authenticated photographs and observation metadata.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 sm:p-4 rounded-xl border border-slate-800 bg-slate-900/50 mb-5 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by common name, scientific name, or characteristic..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-600 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
          <span className="text-slate-400 flex items-center gap-1 font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            Filters:
          </span>

          <select
            value={phylumFilter}
            onChange={(e) => setPhylumFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-cyan-600"
          >
            <option value="">All Phyla</option>
            <option value="Cnidaria">Cnidaria (Jellyfish, Corals, Anemones)</option>
            <option value="Mollusca">Mollusca (Octopuses, Squids, Clams)</option>
            <option value="Arthropoda">Arthropoda (Crustaceans, Crabs, Shrimp)</option>
            <option value="Chordata">Chordata (Fish, Sharks, Marine Mammals)</option>
            <option value="Echinodermata">Echinodermata (Sea Stars, Urchins)</option>
            <option value="Porifera">Porifera (Sponges)</option>
          </select>

          <select
            value={habitatFilter}
            onChange={(e) => setHabitatFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-cyan-600"
          >
            <option value="">All Habitats</option>
            <option value="Reef">Coral &amp; Rocky Reefs</option>
            <option value="Deep Sea">Deep Sea / Bathypelagic</option>
            <option value="Pelagic">Open Ocean / Pelagic</option>
            <option value="Intertidal">Intertidal / Tide Pools</option>
            <option value="Benthic">Benthic / Ocean Floor</option>
            <option value="Kelp Forest">Kelp Forests</option>
          </select>

          {(search || phylumFilter || habitatFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setPhylumFilter('');
                setHabitatFilter('');
              }}
              className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Grid of Results or Genuine Empty State */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 flex flex-col items-center justify-center">
          <Waves className="w-8 h-8 text-cyan-600 animate-pulse mb-3" />
          <p className="text-sm">Querying verified marine database...</p>
        </div>
      ) : organisms.length === 0 ? (
        <div className="py-4">
          <EmptyState
            title="The exploration library is waiting for its first discovery"
            description={
              search || phylumFilter || habitatFilter
                ? 'No verified organisms match your search criteria. Try modifying your filter or clearing the search.'
                : 'No organisms have been cataloged yet. As submissions are verified by administrators, approved biological profiles will appear in this library.'
            }
            icon={Compass}
            actionText="Contribute a Discovery"
            onAction={() => onNavigate('contribute')}
            secondaryActionText={search || phylumFilter || habitatFilter ? 'Clear Filters' : 'Identify an Observation'}
            onSecondaryAction={() => {
              if (search || phylumFilter || habitatFilter) {
                setSearch('');
                setPhylumFilter('');
                setHabitatFilter('');
              } else {
                onNavigate('identify');
              }
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {organisms.map((org) => (
            <div
              key={org.id}
              onClick={() => onNavigate('organism-detail', org.id)}
              className="group rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 hover:border-cyan-800/60 transition-all cursor-pointer overflow-hidden flex flex-col"
            >
              {/* Media Preview Box */}
              <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-800/80">
                {org.primaryMedia ? (
                  org.primaryMedia.file_type === 'video' ? (
                    <video
                      src={org.primaryMedia.file_path}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      muted
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={org.primaryMedia.file_path}
                      alt={org.common_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5 p-4 text-center">
                    <ImageOff className="w-6 h-6 text-slate-500" />
                    <span className="text-[11px] text-slate-400">No media attached yet</span>
                  </div>
                )}

                {/* Quiet unboxed metadata overlay */}
                {org.primaryMedia && (
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-slate-300 bg-slate-950/80 px-2 py-1 rounded backdrop-blur-sm border border-slate-800/60">
                    <span className="truncate">Photo: {org.primaryMedia.creator_name || 'Contributor'}</span>
                    <span>{org.mediaCount} record{org.mediaCount === 1 ? '' : 's'}</span>
                  </div>
                )}
              </div>

              {/* Organism Content */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
                      {org.common_name}
                    </h3>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 shrink-0 transition-colors" />
                  </div>

                  <p className="text-xs italic text-cyan-300/90 font-serif mt-0.5">
                    {org.scientific_name}
                  </p>

                  {/* Clean unboxed taxonomic metadata */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-3">
                    <span>{org.phylum || 'Unspecified Phylum'}</span>
                    {org.habitat && (
                      <>
                        <span aria-hidden="true" className="text-slate-400">·</span>
                        <span className="truncate">{org.habitat}</span>
                      </>
                    )}
                  </div>

                  {org.description && (
                    <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                      {org.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Depth: {org.min_depth_m != null || org.max_depth_m != null ? `${org.min_depth_m ?? 0}m - ${org.max_depth_m ?? 'Unknown'}m` : 'Unrecorded'}</span>
                  <span className="text-cyan-400 font-sans text-xs">View Profile</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
