import React, { useState } from 'react';
import { Upload, ShieldCheck, CheckCircle2, AlertCircle, FileText, Video, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface ContributePageProps {
  onNavigate: (view: string, id?: string) => void;
}

export const ContributePage: React.FC<ContributePageProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ name: string; url: string; isVideo: boolean }[]>([]);

  // Metadata
  const [suspectedCommonName, setSuspectedCommonName] = useState('');
  const [suspectedScientificName, setSuspectedScientificName] = useState('');
  const [observationLocation, setObservationLocation] = useState('');
  const [observationDate, setObservationDate] = useState('');
  const [depthMeters, setDepthMeters] = useState('');
  const [habitatNotes, setHabitatNotes] = useState('');
  const [contributorNotes, setContributorNotes] = useState('');
  const [contributorAttribution, setContributorAttribution] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');

  // Ownership & Rights
  const [ownsMedia, setOwnsMedia] = useState('yes'); // 'yes' or 'no'
  const [originalSource, setOriginalSource] = useState('');
  const [attributionName, setAttributionName] = useState('');
  const [licenseType, setLicenseType] = useState('Contributor Owned');
  const [publicDisplayPermission, setPublicDisplayPermission] = useState(false);
  const [aiReferencePermission, setAiReferencePermission] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successResult, setSuccessResult] = useState<any | null>(null);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files).slice(0, 2); // Up to 2 files
      setFiles(selected);
      const previews = selected.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
        isVideo: file.type.startsWith('video'),
      }));
      setFilePreviews(previews);
      setErrorMessage('');
    }
  };

  const handleRemoveFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    const updatedPreviews = filePreviews.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    setFilePreviews(updatedPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setErrorMessage('You must be signed in as a contributor to submit marine discoveries.');
      return;
    }

    if (files.length === 0) {
      setErrorMessage('Please select at least one photograph or video.');
      return;
    }

    // Ownership check
    if (ownsMedia === 'no' && !originalSource.trim()) {
      setErrorMessage('For third-party media, you must specify the original source or institution.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('submissionType', 'DISCOVERY');
    formData.append('title', suspectedCommonName ? `Discovery: ${suspectedCommonName}` : 'Marine Life Observation');
    formData.append('suspectedCommonName', suspectedCommonName);
    formData.append('suspectedScientificName', suspectedScientificName);
    formData.append('observationLocation', observationLocation);
    formData.append('observationDate', observationDate);
    formData.append('depthMeters', depthMeters);
    formData.append('habitatNotes', habitatNotes);
    formData.append('contributorNotes', contributorNotes);
    formData.append('contributorAttribution', contributorAttribution || user.full_name);
    formData.append('sourceUrl', sourceUrl);

    // Rights
    formData.append('ownsMedia', ownsMedia === 'yes' ? 'true' : 'false');
    formData.append('originalSource', originalSource);
    formData.append('attributionName', attributionName || contributorAttribution || user.full_name);
    formData.append('licenseType', licenseType);
    formData.append('publicDisplayPermission', publicDisplayPermission ? 'true' : 'false');
    formData.append('aiReferencePermission', aiReferencePermission ? 'true' : 'false');

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit discovery.');
      }

      setSuccessResult(data.submission);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error uploading submission.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
          Contribute a Marine Discovery
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Contribute ocean photographs and videos to the verified library. Every submission is reviewed by administrators
          before publication, and rights decisions are strictly preserved.
        </p>
      </div>

      {!user ? (
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-cyan-400 mx-auto" />
          <h2 className="text-lg font-semibold text-slate-100">Sign In to Contribute</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Contributing observations requires an explorer account so your discovery can be credited to you and you can track review updates.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('login')}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => onNavigate('register')}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              Create Contributor Account
            </button>
          </div>
        </div>
      ) : successResult ? (
        <div className="p-8 rounded-xl border border-cyan-800/60 bg-cyan-950/40 space-y-4 text-slate-200">
          <div className="flex items-center gap-2 text-cyan-300 font-bold text-lg">
            <CheckCircle2 className="w-6 h-6 text-cyan-400" />
            <span>Discovery Successfully Submitted</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Your observation has been saved with full provenance metadata and placed in the review queue.
            Status: <span className="font-mono text-cyan-300">PENDING_REVIEW</span>.
          </p>
          <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs space-y-1 text-slate-300">
            <div><span className="text-slate-400">Submission ID:</span> {successResult.id}</div>
            <div><span className="text-slate-400">Public Display Authorization:</span> {publicDisplayPermission ? 'Granted' : 'Private Review Only'}</div>
            <div><span className="text-slate-400">AI / Reference Permission:</span> {aiReferencePermission ? 'Granted' : 'Not Authorized'}</div>
          </div>
          <div className="flex gap-4 pt-4">
            <button
              onClick={() => {
                setSuccessResult(null);
                setFiles([]);
                setFilePreviews([]);
              }}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Submit Another Discovery
            </button>
            <button
              onClick={() => onNavigate('contributor-dashboard')}
              className="px-4 py-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Go to My Submissions
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 1. Media Upload */}
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-4 h-4 text-cyan-400" />
              1. Media Upload (Image or Video)
            </h2>

            {filePreviews.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filePreviews.map((p, idx) => (
                  <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center">
                    {p.isVideo ? (
                      <video src={p.url} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={p.url} alt="" className="w-full h-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="absolute top-2 right-2 bg-slate-950/80 hover:bg-red-950 text-red-300 text-xs px-2 py-1 rounded cursor-pointer border border-slate-800"
                    >
                      Remove
                    </button>
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] bg-slate-950/80 px-2 py-0.5 rounded text-slate-300">
                      {p.isVideo ? <Video className="w-3 h-3 text-cyan-400" /> : <ImageIcon className="w-3 h-3 text-cyan-400" />}
                      <span className="truncate max-w-[150px]">{p.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-cyan-700/60 rounded-xl p-8 cursor-pointer bg-slate-950/50 transition-colors">
                <Upload className="w-8 h-8 text-cyan-500 mb-2" />
                <span className="text-sm font-medium text-slate-200">
                  Select media file(s) from device
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  Upload up to 2 files: Photograph (JPEG, PNG, WebP) and/or Video (MP4, WebM)
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
                  onChange={handleFilesSelected}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* 2. Observation Details */}
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              2. Observation Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Suspected Common Name
                </label>
                <input
                  type="text"
                  value={suspectedCommonName}
                  onChange={(e) => setSuspectedCommonName(e.target.value)}
                  placeholder="e.g. Leopard Shark, Pacific Sea Nettle"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Scientific Name (if known)
                </label>
                <input
                  type="text"
                  value={suspectedScientificName}
                  onChange={(e) => setSuspectedScientificName(e.target.value)}
                  placeholder="e.g. Triakis semifasciata"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-600 italic font-serif"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  General Location
                </label>
                <input
                  type="text"
                  value={observationLocation}
                  onChange={(e) => setObservationLocation(e.target.value)}
                  placeholder="e.g. Channel Islands, California"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Observation Date
                </label>
                <input
                  type="date"
                  value={observationDate}
                  onChange={(e) => setObservationDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Depth (Meters)
                </label>
                <input
                  type="number"
                  step="any"
                  value={depthMeters}
                  onChange={(e) => setDepthMeters(e.target.value)}
                  placeholder="e.g. 14"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Habitat or Environmental Context
              </label>
              <input
                type="text"
                value={habitatNotes}
                onChange={(e) => setHabitatNotes(e.target.value)}
                placeholder="e.g. Rocky reef edge at kelp forest canopy base"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Observations &amp; Behavioral Notes
              </label>
              <textarea
                rows={3}
                value={contributorNotes}
                onChange={(e) => setContributorNotes(e.target.value)}
                placeholder="Observed behaviors, water visibility, temperature, substrate..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-600"
              />
            </div>
          </div>

          {/* 3. Ownership and Permission Questions (CRITICAL MANDATORY RULES) */}
          <div className="p-6 rounded-xl border border-cyan-900/60 bg-slate-900/60 space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                3. Ownership &amp; Rights Permissions (Strictly Governed)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Please answer the provenance and rights questions below. Public display permission and AI/visual-identification permission are independent decisions.
              </p>
            </div>

            {/* Ownership question */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Do you own this media or have explicit authorization to share it?
              </label>
              <div className="flex gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="ownsMedia"
                    value="yes"
                    checked={ownsMedia === 'yes'}
                    onChange={() => setOwnsMedia('yes')}
                    className="accent-cyan-500"
                  />
                  <span>Yes, I created this media / hold direct copyright</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="ownsMedia"
                    value="no"
                    checked={ownsMedia === 'no'}
                    onChange={() => setOwnsMedia('no')}
                    className="accent-cyan-500"
                  />
                  <span>No, this is third-party or institutional media</span>
                </label>
              </div>
            </div>

            {/* If third party */}
            {ownsMedia === 'no' && (
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Original Source Organization / Repository <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={originalSource}
                    onChange={(e) => setOriginalSource(e.target.value)}
                    placeholder="e.g. NOAA Ocean Exploration, Nautilus Live, or Institution"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Source URL
                  </label>
                  <input
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-600"
                  />
                </div>
              </div>
            )}

            {/* Attribution */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Attribution Name / Credit
                </label>
                <input
                  type="text"
                  value={attributionName}
                  onChange={(e) => setAttributionName(e.target.value)}
                  placeholder={user?.full_name || 'Name to credit'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  License Type
                </label>
                <select
                  value={licenseType}
                  onChange={(e) => setLicenseType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-600"
                >
                  <option value="Contributor Owned">Contributor Owned (Granted to Marine Bio Explorer)</option>
                  <option value="CC-BY">Creative Commons Attribution (CC-BY 4.0)</option>
                  <option value="CC-BY-SA">Creative Commons Attribution-ShareAlike (CC-BY-SA 4.0)</option>
                  <option value="CC-BY-NC">Creative Commons NonCommercial (CC-BY-NC 4.0)</option>
                  <option value="Public Domain">Public Domain / CC0</option>
                  <option value="All Rights Reserved - Granted Permission">All Rights Reserved (Specific Permission Granted)</option>
                </select>
              </div>
            </div>

            {/* Separate Permission Checkboxes */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 bg-slate-950 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={publicDisplayPermission}
                  onChange={(e) => setPublicDisplayPermission(e.target.checked)}
                  className="mt-0.5 accent-cyan-500 w-4 h-4 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 block">
                    May Marine Bio Explorer display this media publicly?
                  </span>
                  <span className="text-slate-400">
                    If checked, after administrator verification, this media may appear in the public organism library.
                    If unchecked, it remains private to reviewers.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 bg-slate-950 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={aiReferencePermission}
                  onChange={(e) => setAiReferencePermission(e.target.checked)}
                  className="mt-0.5 accent-cyan-500 w-4 h-4 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 block">
                    May this media be used as a reference dataset for future visual-identification features?
                  </span>
                  <span className="text-slate-400">
                    Independent from public display. Allows future taxonomy classification models to refer to this specimen.
                    No AI training occurs in this release.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-xs text-red-300">
              {errorMessage}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer shadow-sm shadow-cyan-950"
            >
              {submitting ? 'Recording Submission...' : 'Submit Discovery for Review'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
