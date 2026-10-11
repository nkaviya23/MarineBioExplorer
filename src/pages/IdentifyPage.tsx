import React, { useState, useEffect } from 'react';
import { Upload, Search, Compass, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { EmptyState } from '../components/EmptyState.tsx';
import type { Organism } from '../types/index.ts';

interface IdentifyPageProps {
  onNavigate: (view: string, id?: string) => void;
}

export const IdentifyPage: React.FC<IdentifyPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'search'>('upload');

  // Option 1: Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [suspectedName, setSuspectedName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Option 2: Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Organism[]>([]);
  const [searchSearched, setSearchSearched] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Media Category
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([
    { id: 'in_situ', name: 'In Situ / Live Organism' },
    { id: 'morphology', name: 'Morphological Detail' },
    { id: 'behavior', name: 'Behavior & Interaction' },
    { id: 'habitat', name: 'Habitat & Environment' },
    { id: 'life_stage', name: 'Egg / Larval / Juvenile' },
    { id: 'specimen', name: 'Specimen / Microscopic' },
  ]);
  const [mediaCategory, setMediaCategory] = useState('');

  useEffect(() => {
    fetch('/api/media-categories')
      .then((res) => {
        if (!res.ok) throw new Error('API failure');
        return res.json();
      })
      .then((data) => {
        if (data && Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories);
        }
      })
      .catch((err) => {
        console.warn('Could not load categories:', err);
      });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrorMessage('');
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please select an image file of the organism.');
      return;
    }

    if (!user) {
      setErrorMessage('Please sign in or create a contributor account to submit observations for identification.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    const formData = new FormData();
    formData.append('files', selectedFile);
    formData.append('submissionType', 'IDENTIFY_REQUEST');
    formData.append('title', suspectedName ? `Identification Request: ${suspectedName}` : 'Unidentified Marine Life');
    formData.append('suspectedCommonName', suspectedName);
    formData.append('contributorNotes', description);
    formData.append('observationLocation', location);
    formData.append('observationDate', date);
    formData.append('mediaCategory', mediaCategory || 'In Situ / Live Organism');
    formData.append('category', mediaCategory || 'In Situ / Live Organism');
    formData.append('ownsMedia', 'true');
    formData.append('publicDisplayPermission', 'true'); // Community review
    formData.append('aiReferencePermission', 'false'); // Explicitly separated

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit identification request.');
      }

      setSubmissionSuccess(data.submission);
      handleRemoveFile();
      setSuspectedName('');
      setDescription('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error uploading file.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLibrarySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setSearchSearched(true);
    try {
      const res = await fetch(`/api/search/library?q=${encodeURIComponent(searchQuery.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
      {/* Header */}
      <div className="mb-5 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
          Marine Life Identification
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
          Need help identifying a specimen? Upload your photograph for review, or search the verified library.
        </p>
      </div>

      {/* Two Clear Ways To Begin - Segmented interactive buttons */}
      <div className="flex border-b border-slate-800 mb-5 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('upload')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'upload'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Upload className="w-4 h-4" />
          Option 1: Upload Your Own Image
        </button>

        <button
          onClick={() => setActiveTab('search')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'search'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Search className="w-4 h-4" />
          Option 2: Search Existing Library
        </button>
      </div>

      {/* OPTION 1: UPLOAD YOUR OWN IMAGE */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          {submissionSuccess ? (
            <div className="p-6 rounded-xl border border-cyan-800/60 bg-cyan-950/40 text-slate-200 space-y-4">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                <span>Observation Successfully Submitted for Review</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Identification has not been performed automatically. Your observation has been placed in the reviewer queue and public community pool.
                You can track its status under your Contributor Dashboard.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setSubmissionSuccess(null)}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium cursor-pointer"
                >
                  Submit Another Image
                </button>
                <button
                  onClick={() => onNavigate('contributor-dashboard')}
                  className="px-4 py-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 rounded-lg text-xs font-medium cursor-pointer"
                >
                  View My Submissions
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUploadSubmit} className="space-y-6">
              {!user && (
                <div className="p-4 rounded-xl border border-amber-800/50 bg-amber-950/30 text-amber-300 text-xs flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Sign In Required to Submit: </span>
                    You can inspect the form, but submitting requires a contributor account to preserve attribution and allow review correspondence.
                    <button
                      type="button"
                      onClick={() => onNavigate('login')}
                      className="ml-2 underline font-medium hover:text-white"
                    >
                      Sign In or Register
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Zone */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
                <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Organism Photograph <span className="text-cyan-400">*</span>
                </label>

                {previewUrl ? (
                  <div className="space-y-3">
                    <div className="relative aspect-video max-h-72 rounded-lg overflow-hidden border border-slate-800 bg-black flex items-center justify-center">
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{selectedFile?.name} ({(selectedFile?.size ? (selectedFile.size / 1024 / 1024).toFixed(2) : 0)} MB)</span>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="text-red-400 hover:text-red-300 cursor-pointer"
                      >
                        Remove image
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-cyan-700/60 rounded-xl p-8 cursor-pointer bg-slate-950/50 transition-colors">
                    <Upload className="w-8 h-8 text-cyan-500 mb-2" />
                    <span className="text-sm font-medium text-slate-200">
                      Select an image from your device
                    </span>
                    <span className="text-xs text-slate-400 mt-1">
                      JPEG, PNG, WebP up to 25MB
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}

                {/* Media Category Dropdown */}
                <div className="pt-3 border-t border-slate-800/80">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Media Category
                  </label>
                  <select
                    value={mediaCategory}
                    onChange={(e) => setMediaCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-600 transition-colors"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Observation Metadata */}
              <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Suspected Organism Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={suspectedName}
                    onChange={(e) => setSuspectedName(e.target.value)}
                    placeholder="e.g. Moon Jellyfish, Crown-of-thorns starfish, or unknown"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Observation Location (Optional)
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Monterey Bay, California (General region)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Observation Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Description &amp; Environmental Context (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe size, behavior, water depth, substrate, or unique visible features..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-600"
                  />
                </div>
              </div>

              {/* Explicit Identification Notice */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300">How Identification Works:</span>
                <p>
                  In this version, automated machine identification is not performed. Your photograph is securely saved in the database
                  and queued for review by the platform administrator and community experts.
                </p>
              </div>

              {errorMessage && (
                <p className="text-xs text-red-400 font-medium">{errorMessage}</p>
              )}

              <button
                type="submit"
                disabled={submitting || !selectedFile}
                className="w-full sm:w-auto px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              >
                {submitting ? 'Recording Submission...' : 'Submit for Identification Help'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* OPTION 2: SEARCH THE EXISTING LIBRARY */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          <form onSubmit={handleLibrarySearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search approved library by common name (e.g. Clownfish) or scientific name..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-600"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              Search Catalog
            </button>
          </form>

          {searchLoading ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              Searching verified records...
            </div>
          ) : searchSearched && searchResults.length === 0 ? (
            <EmptyState
              title="No matching records in the verified library"
              description={`No organism with the name "${searchQuery}" has been cataloged yet. Since our library is growing, you can upload your image to request identification.`}
              icon={Compass}
              actionText="Upload Image Instead"
              onAction={() => setActiveTab('upload')}
              secondaryActionText="Browse All Entries"
              onSecondaryAction={() => onNavigate('explore')}
            />
          ) : searchResults.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Matching Catalog Records ({searchResults.length})
              </h3>
              <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
                {searchResults.map((org) => (
                  <div
                    key={org.id}
                    onClick={() => onNavigate('organism-detail', org.id)}
                    className="p-4 hover:bg-slate-900/80 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-slate-100 hover:text-cyan-400">
                        {org.common_name}
                      </h4>
                      <p className="text-xs font-serif italic text-cyan-300/90">
                        {org.scientific_name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <span>{org.phylum || 'Taxonomy verified'}</span>
                        {org.habitat && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{org.habitat}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              title="Search the verified marine catalog"
              description="Enter a common name or scientific name above. If the organism is not found, you can submit your own photograph for community and administrator identification."
              icon={Search}
              actionText="Upload Your Image"
              onAction={() => setActiveTab('upload')}
            />
          )}
        </div>
      )}
    </div>
  );
};
