import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Shield, ExternalLink, ImageOff } from 'lucide-react';
import type { Organism, MediaItem } from '../types/index.ts';

interface OrganismDetailPageProps {
  organismId: string;
  onNavigate: (view: string, id?: string) => void;
}

export const OrganismDetailPage: React.FC<OrganismDetailPageProps> = ({ organismId, onNavigate }) => {
  const [organism, setOrganism] = useState<Organism | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/organisms/${organismId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => {
        setOrganism(data.organism);
        setMedia(data.media || []);
      })
      .catch((err) => {
        console.error('Error fetching organism:', err);
        setOrganism(null);
      })
      .finally(() => setLoading(false));
  }, [organismId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-500">
        <p>Loading biological profile...</p>
      </div>
    );
  }

  if (!organism) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-100 mb-2">Organism Record Not Found</h2>
        <p className="text-sm text-slate-400 mb-6">
          The requested profile may be unverified, archived, or does not exist in the public library.
        </p>
        <button
          onClick={() => onNavigate('explore')}
          className="px-4 py-2 bg-slate-800 text-slate-200 rounded-lg text-sm hover:bg-slate-700 transition-colors cursor-pointer"
        >
          Return to Library
        </button>
      </div>
    );
  }

  const currentMedia = media[selectedMediaIndex] || null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 w-full">
      {/* Back button */}
      <button
        onClick={() => onNavigate('explore')}
        className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-cyan-400 transition-colors mb-4 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Verified Library
      </button>

      {/* Header Profile Title */}
      <div className="border-b border-slate-800 pb-4 mb-6">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            {organism.common_name}
          </h1>
          <span className="text-lg font-serif italic text-cyan-300">
            {organism.scientific_name}
          </span>
        </div>

        {/* Quiet unboxed metadata */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-3">
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified Record
          </span>
          <span aria-hidden="true" className="text-slate-400">·</span>
          <span>Phylum: {organism.phylum || 'Unclassified'}</span>
          {organism.habitat && (
            <>
              <span aria-hidden="true" className="text-slate-400">·</span>
              <span>Habitat: {organism.habitat}</span>
            </>
          )}
          <span aria-hidden="true" className="text-slate-400">·</span>
          <span>Catalog ID: {organism.id}</span>
        </div>
      </div>

      {/* Media and Characteristics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Media Display & Provenance */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
            {currentMedia ? (
              <div className="relative aspect-video bg-black flex items-center justify-center">
                {currentMedia.file_type === 'video' ? (
                  <video
                    src={currentMedia.file_path}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={currentMedia.file_path}
                    alt={organism.common_name}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            ) : (
              <div className="aspect-video flex flex-col items-center justify-center text-slate-400 bg-slate-900/60 p-6 text-center">
                <ImageOff className="w-8 h-8 text-slate-500 mb-2" />
                <p className="text-sm font-medium text-slate-300">No approved media records attached</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  This organism profile was documented without media or is awaiting photo verification.
                </p>
              </div>
            )}

            {/* Media Provenance & Attribution Bar */}
            {currentMedia && (
              <div className="p-4 border-t border-slate-800/80 bg-slate-900/70 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-medium">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Media Provenance &amp; Rights</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Category: {currentMedia.category || 'In Situ / Live Organism'} · License: {currentMedia.license_type || 'Contributor Owned'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                  <div>
                    <span className="text-slate-400">Creator / Author: </span>
                    <span>{currentMedia.creator_name || 'Individual Contributor'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Copyright Holder: </span>
                    <span>{currentMedia.copyright_holder || currentMedia.creator_name || 'Contributor'}</span>
                  </div>
                  {currentMedia.source_organization && (
                    <div className="col-span-2">
                      <span className="text-slate-400">Organization: </span>
                      <span>{currentMedia.source_organization}</span>
                    </div>
                  )}
                  {currentMedia.attribution_text && (
                    <div className="col-span-2">
                      <span className="text-slate-400">Attribution: </span>
                      <span>{currentMedia.attribution_text}</span>
                    </div>
                  )}
                  {currentMedia.original_source_url && (
                    <div className="col-span-2 pt-1">
                      <a
                        href={currentMedia.original_source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-cyan-400 hover:underline"
                      >
                        Original Source Record <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Media thumbnail selector */}
          {media.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {media.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedMediaIndex(index)}
                  className={`w-20 h-14 rounded-lg overflow-hidden border shrink-0 transition-all cursor-pointer ${
                    selectedMediaIndex === index ? 'border-cyan-400 ring-2 ring-cyan-500/20' : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={item.file_path} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Description */}
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-2">
              Overview &amp; Natural History
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {organism.description || 'Information not yet available.'}
            </p>
          </div>
        </div>

        {/* Right Column: Taxonomy and Biological Specs */}
        <div className="lg:col-span-5 space-y-6">
          {/* Taxonomic Hierarchy */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Taxonomic Classification
            </h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Kingdom</span>
                <span className="text-slate-200 font-medium">{organism.kingdom || 'Animalia'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Phylum</span>
                <span className="text-slate-200 font-medium">{organism.phylum || 'Information not yet available'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Class</span>
                <span className="text-slate-200 font-medium">{organism.class_name || 'Information not yet available'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Order</span>
                <span className="text-slate-200 font-medium">{organism.order_name || 'Information not yet available'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Family</span>
                <span className="text-slate-200 font-medium">{organism.family || 'Information not yet available'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Genus</span>
                <span className="text-slate-200 font-serif italic">{organism.genus || 'Information not yet available'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Species</span>
                <span className="text-slate-200 font-serif italic">{organism.species || 'Information not yet available'}</span>
              </div>
            </div>
          </div>

          {/* Environmental & Biological Details */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-4">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Ecological Data
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Depth Range</span>
                <span className="text-slate-200 font-mono">
                  {organism.min_depth_m != null || organism.max_depth_m != null
                    ? `${organism.min_depth_m ?? 0}m to ${organism.max_depth_m ?? 'Depth unrecorded'}m`
                    : 'Information not yet available'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Geographic Distribution</span>
                <span className="text-slate-200">
                  {organism.geographic_distribution || 'Information not yet available'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Morphological Characteristics</span>
                <span className="text-slate-200 leading-relaxed">
                  {organism.morphology || 'Information not yet available'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Observed Behavior</span>
                <span className="text-slate-200 leading-relaxed">
                  {organism.behavior || 'Information not yet available'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Identification Key Features</span>
                <span className="text-slate-200 leading-relaxed">
                  {organism.id_features || 'Information not yet available'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
