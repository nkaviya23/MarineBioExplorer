import React, { useEffect, useState } from 'react';
import {
  Shield,
  Clock,
  Database,
  HelpCircle,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  PlusCircle,
  Search,
  Filter,
  Eye,
  Edit3,
  Link,
  ExternalLink,
  LogOut,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import type { Submission, Organism, MediaItem } from '../types/index.ts';
import { EmptyState } from '../components/EmptyState.tsx';

interface AdminDashboardProps {
  onNavigate: (view: string, id?: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();

  const [activeSection, setActiveSection] = useState<
    'overview' | 'pending' | 'organisms' | 'add-organism' | 'unknowns' | 'media'
  >('overview');

  // Overview metrics
  const [metrics, setMetrics] = useState<{
    pendingSubmissions: number;
    unknownSubmissions: number;
    clarificationSubmissions: number;
    approvedSubmissions: number;
    rejectedSubmissions: number;
    totalOrganisms: number;
    totalMedia: number;
    approvedMedia: number;
  }>({
    pendingSubmissions: 0,
    unknownSubmissions: 0,
    clarificationSubmissions: 0,
    approvedSubmissions: 0,
    rejectedSubmissions: 0,
    totalOrganisms: 0,
    totalMedia: 0,
    approvedMedia: 0,
  });

  // Data states
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [organisms, setOrganisms] = useState<Organism[]>([]);
  const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Review Inspection Modal
  const [inspectingSubmission, setInspectingSubmission] = useState<Submission | null>(null);
  const [reviewAction, setReviewAction] = useState<
    'APPROVE' | 'REJECT' | 'REQUEST_CLARIFICATION' | 'MARK_UNKNOWN' | 'LINK_ORGANISM'
  >('APPROVE');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewPublicDisplay, setReviewPublicDisplay] = useState(false);
  const [reviewAiReference, setReviewAiReference] = useState(false);
  const [selectedOrganismId, setSelectedOrganismId] = useState('');
  const [inlineCreateOrganism, setInlineCreateOrganism] = useState(false);
  const [inlineCommonName, setInlineCommonName] = useState('');
  const [inlineScientificName, setInlineScientificName] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Add Organism Form State
  const [addCommonName, setAddCommonName] = useState('');
  const [addScientificName, setAddScientificName] = useState('');
  const [addKingdom, setAddKingdom] = useState('Animalia');
  const [addPhylum, setAddPhylum] = useState('');
  const [addClassName, setAddClassName] = useState('');
  const [addOrderName, setAddOrderName] = useState('');
  const [addFamily, setAddFamily] = useState('');
  const [addGenus, setAddGenus] = useState('');
  const [addSpecies, setAddSpecies] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [addHabitat, setAddHabitat] = useState('');
  const [addMinDepth, setAddMinDepth] = useState('');
  const [addMaxDepth, setAddMaxDepth] = useState('');
  const [addGeoDist, setAddGeoDist] = useState('');
  const [addMorphology, setAddMorphology] = useState('');
  const [addBehavior, setAddBehavior] = useState('');
  const [addIdFeatures, setAddIdFeatures] = useState('');
  const [addVerificationStatus, setAddVerificationStatus] = useState<'VERIFIED' | 'UNVERIFIED'>('VERIFIED');
  const [addOrgSubmitting, setAddOrgSubmitting] = useState(false);
  const [addOrgMessage, setAddOrgMessage] = useState<{ text: string; isWarning?: boolean } | null>(null);

  // Edit Organism Modal
  const [editingOrganism, setEditingOrganism] = useState<Organism | null>(null);
  const [editStatus, setEditStatus] = useState<string>('VERIFIED');
  const [editCommonName, setEditCommonName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editHabitat, setEditHabitat] = useState('');

  // Attach Media Modal
  const [attachingToOrg, setAttachingToOrg] = useState<Organism | null>(null);
  const [selectedMediaToAttach, setSelectedMediaToAttach] = useState('');
  const [attachIsPrimary, setAttachIsPrimary] = useState(false);

  // Load all overview metrics
  const loadOverview = async () => {
    try {
      const res = await fetch('/api/admin/overview');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error('Failed to load overview:', err);
    }
  };

  // Load submissions
  const loadSubmissions = async (status: string = 'all') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/submissions?status=${status}`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
      }
    } catch (err) {
      console.error('Failed to load admin submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load organisms
  const loadOrganisms = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/organisms');
      if (res.ok) {
        const data = await res.json();
        setOrganisms(data.organisms || []);
      }
    } catch (err) {
      console.error('Failed to load admin organisms:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load media vault
  const loadMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/media');
      if (res.ok) {
        const data = await res.json();
        setAllMedia(data.media || []);
      }
    } catch (err) {
      console.error('Failed to load admin media:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
    loadOrganisms();
  }, []);

  useEffect(() => {
    if (activeSection === 'overview') {
      loadOverview();
    } else if (activeSection === 'pending') {
      loadSubmissions('PENDING_REVIEW');
    } else if (activeSection === 'unknowns') {
      loadSubmissions('UNKNOWN');
    } else if (activeSection === 'organisms') {
      loadOrganisms();
    } else if (activeSection === 'media') {
      loadMedia();
    }
  }, [activeSection]);

  // Open review modal for submission
  const handleOpenReview = (sub: Submission) => {
    setInspectingSubmission(sub);
    setReviewAction('APPROVE');
    setReviewNotes('');
    setReviewPublicDisplay(Boolean(sub.public_display_permission));
    setReviewAiReference(Boolean(sub.ai_reference_permission));
    setSelectedOrganismId(sub.resolved_organism_id || '');
    setInlineCreateOrganism(false);
    setInlineCommonName(sub.suspected_common_name || '');
    setInlineScientificName(sub.suspected_scientific_name || '');
    setReviewError('');
  };

  // Execute review decision
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectingSubmission) return;

    if (reviewAction === 'REJECT' && !reviewNotes.trim()) {
      setReviewError('A reason is required when rejecting a submission.');
      return;
    }

    if (reviewAction === 'REQUEST_CLARIFICATION' && !reviewNotes.trim()) {
      setReviewError('Please specify the questions or evidence needed from the contributor.');
      return;
    }

    setReviewSubmitting(true);
    setReviewError('');

    try {
      const body: any = {
        action: reviewAction,
        notes: reviewNotes,
        publicDisplayPermission: reviewPublicDisplay,
        aiReferencePermission: reviewAiReference,
        organismId: selectedOrganismId || undefined,
      };

      if (inlineCreateOrganism && inlineCommonName && inlineScientificName) {
        body.createOrganismData = {
          commonName: inlineCommonName,
          scientificName: inlineScientificName,
        };
      }

      const res = await fetch(`/api/admin/submissions/${inspectingSubmission.id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review.');
      }

      setInspectingSubmission(null);
      loadOverview();
      loadSubmissions(activeSection === 'unknowns' ? 'UNKNOWN' : 'PENDING_REVIEW');
    } catch (err: any) {
      setReviewError(err.message || 'Error saving review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Handle Add Organism Submit
  const handleAddOrganismSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addCommonName.trim() || !addScientificName.trim()) {
      setAddOrgMessage({ text: 'Common name and scientific name are required.', isWarning: true });
      return;
    }

    setAddOrgSubmitting(true);
    setAddOrgMessage(null);

    try {
      const res = await fetch('/api/admin/organisms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commonName: addCommonName,
          scientificName: addScientificName,
          kingdom: addKingdom,
          phylum: addPhylum,
          className: addClassName,
          orderName: addOrderName,
          family: addFamily,
          genus: addGenus,
          species: addSpecies,
          description: addDescription,
          habitat: addHabitat,
          minDepthM: addMinDepth,
          maxDepthM: addMaxDepth,
          geographicDistribution: addGeoDist,
          morphology: addMorphology,
          behavior: addBehavior,
          idFeatures: addIdFeatures,
          verificationStatus: addVerificationStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create organism record.');
      }

      const warning = data.duplicateWarning;
      setAddOrgMessage({
        text: `Organism "${addCommonName}" created successfully.${warning ? ` (${warning})` : ''}`,
        isWarning: Boolean(warning),
      });

      // Reset form
      setAddCommonName('');
      setAddScientificName('');
      setAddPhylum('');
      setAddDescription('');
      setAddHabitat('');
      setAddMinDepth('');
      setAddMaxDepth('');
      loadOverview();
      loadOrganisms();
    } catch (err: any) {
      setAddOrgMessage({ text: err.message || 'Error creating organism.', isWarning: true });
    } finally {
      setAddOrgSubmitting(false);
    }
  };

  // Attach media to organism
  const handleAttachMediaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachingToOrg || !selectedMediaToAttach) return;

    try {
      const res = await fetch(`/api/admin/organisms/${attachingToOrg.id}/attach-media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaId: selectedMediaToAttach,
          isPrimary: attachIsPrimary,
        }),
      });
      if (res.ok) {
        setAttachingToOrg(null);
        setSelectedMediaToAttach('');
        loadOrganisms();
      }
    } catch (err) {
      console.error('Failed to attach media:', err);
    }
  };

  // Edit organism
  const handleEditOrganismSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrganism) return;

    try {
      const res = await fetch(`/api/admin/organisms/${editingOrganism.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commonName: editCommonName,
          description: editDescription,
          habitat: editHabitat,
          verificationStatus: editStatus,
        }),
      });
      if (res.ok) {
        setEditingOrganism(null);
        loadOrganisms();
      }
    } catch (err) {
      console.error('Failed to update organism:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
      {/* Top Admin Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-mono uppercase tracking-wider mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>PROTECTED CURATOR CONSOLE</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
            Administrator Workspace
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Logged in as {user?.email} · Full permissions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSection('add-organism')}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm shadow-amber-950 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Add Organism
          </button>
          <button
            onClick={async () => {
              await logout();
              onNavigate('admin-login');
            }}
            className="p-1.5 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-xs cursor-pointer transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Admin Navigation Bar */}
      <div className="flex flex-wrap border-b border-slate-800 mb-5 gap-1 sm:gap-6 text-xs sm:text-sm font-medium">
        <button
          onClick={() => setActiveSection('overview')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer px-1 ${
            activeSection === 'overview'
              ? 'border-amber-500 text-amber-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Overview
        </button>

        <button
          onClick={() => setActiveSection('pending')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 px-1 ${
            activeSection === 'pending'
              ? 'border-amber-500 text-amber-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          Pending Approvals ({metrics.pendingSubmissions})
        </button>

        <button
          onClick={() => setActiveSection('organisms')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 px-1 ${
            activeSection === 'organisms'
              ? 'border-amber-500 text-amber-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          Organism Library ({metrics.totalOrganisms})
        </button>

        <button
          onClick={() => setActiveSection('add-organism')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 px-1 ${
            activeSection === 'add-organism'
              ? 'border-amber-500 text-amber-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          Add an Organism
        </button>

        <button
          onClick={() => setActiveSection('unknowns')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 px-1 ${
            activeSection === 'unknowns'
              ? 'border-amber-500 text-amber-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          Unknown Organisms ({metrics.unknownSubmissions})
        </button>

        <button
          onClick={() => setActiveSection('media')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 px-1 ${
            activeSection === 'media'
              ? 'border-amber-500 text-amber-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Media Management ({metrics.totalMedia})
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. OVERVIEW */}
      {/* ------------------------------------------------------------- */}
      {activeSection === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => setActiveSection('pending')}
              className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-amber-800/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Pending Approvals</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-100">
                {metrics.pendingSubmissions}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Awaiting curator decision</span>
            </div>

            <div
              onClick={() => setActiveSection('organisms')}
              className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-amber-800/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Total Organisms</span>
                <Database className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-100">
                {metrics.totalOrganisms}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Active in library</span>
            </div>

            <div
              onClick={() => setActiveSection('unknowns')}
              className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-amber-800/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Unknown Observations</span>
                <HelpCircle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-100">
                {metrics.unknownSubmissions}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Unresolved specimens</span>
            </div>

            <div
              onClick={() => setActiveSection('media')}
              className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-amber-800/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Media Records</span>
                <ImageIcon className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-100">
                {metrics.totalMedia}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">{metrics.approvedMedia} approved public</span>
            </div>
          </div>

          {/* Initial Clean State Guidance */}
          {metrics.pendingSubmissions === 0 && metrics.totalOrganisms === 0 && (
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/30 space-y-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-cyan-400" />
                Library Initialization Status
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                The database is empty by default (0 organisms, 0 media records). As the administrator, you can now start populating the
                official library using <strong>"Add an Organism"</strong>, or review incoming contributor submissions in <strong>"Pending Approvals"</strong>.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setActiveSection('add-organism')}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Create First Organism Record
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. PENDING APPROVALS */}
      {/* ------------------------------------------------------------- */}
      {activeSection === 'pending' && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              Loading submission queue...
            </div>
          ) : submissions.length === 0 ? (
            <EmptyState
              title="No pending submissions"
              description="The review queue is currently empty. New discoveries and identification requests submitted by contributors will appear here for inspection."
              icon={CheckCircle2}
            />
          ) : (
            <div className="space-y-4">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-cyan-400">{sub.id}</span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <h3 className="text-sm font-bold text-slate-100">
                          {sub.title || sub.suspected_common_name || 'Observation'}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        By {sub.contributor_name} ({sub.contributor_email}) on {new Date(sub.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      onClick={() => handleOpenReview(sub)}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Inspect &amp; Decide
                    </button>
                  </div>

                  {/* Submission summary */}
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    {sub.media && sub.media.length > 0 && (
                      <div className="w-32 h-24 rounded-lg overflow-hidden border border-slate-800 bg-black shrink-0">
                        {sub.media[0].file_type === 'video' ? (
                          <video src={sub.media[0].file_path} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={sub.media[0].file_path} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                    )}

                    <div className="text-xs text-slate-300 space-y-1 flex-1">
                      <div>
                        <span className="text-slate-400">Suspected Species: </span>
                        <span>{sub.suspected_common_name || 'Unspecified'}</span>
                        {sub.suspected_scientific_name && (
                          <span className="italic font-serif text-cyan-300 ml-1">
                            ({sub.suspected_scientific_name})
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-slate-400">Location: </span>
                        <span>{sub.observation_location || 'Not provided'}</span>
                        {sub.depth_meters != null && (
                          <span className="ml-2 text-slate-400">· Depth: {sub.depth_meters}m</span>
                        )}
                      </div>
                      {sub.contributor_notes && (
                        <div>
                          <span className="text-slate-400">Notes: </span>
                          <span>{sub.contributor_notes}</span>
                        </div>
                      )}

                      {/* Explicit Permissions Flag */}
                      <div className="pt-2 flex flex-wrap gap-4 text-[11px] font-mono">
                        <span className={sub.public_display_permission ? 'text-emerald-400' : 'text-amber-400'}>
                          Public Display: {sub.public_display_permission ? 'Permitted' : 'Private Only'}
                        </span>
                        <span className={sub.ai_reference_permission ? 'text-cyan-400' : 'text-slate-400'}>
                          AI/Reference: {sub.ai_reference_permission ? 'Eligible' : 'Excluded'}
                        </span>
                        <span className="text-slate-400">
                          Ownership: {sub.owns_media ? 'Contributor Owns' : 'Third-Party'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. ORGANISM LIBRARY MANAGEMENT */}
      {/* ------------------------------------------------------------- */}
      {activeSection === 'organisms' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-2">
            <h2 className="text-base font-bold text-slate-100">Official Organism Catalog</h2>
            <button
              onClick={() => setActiveSection('add-organism')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Add New Organism
            </button>
          </div>

          {organisms.length === 0 ? (
            <EmptyState
              title="No organisms have been added yet"
              description="The official organism catalog is empty. You can add new biological profiles manually or promote approved community submissions to catalog records."
              icon={Database}
              actionText="Add an Organism"
              onAction={() => setActiveSection('add-organism')}
            />
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden divide-y divide-slate-800">
              {organisms.map((org) => (
                <div key={org.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/70 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-100">{org.common_name}</h3>
                      <span className="text-xs italic font-serif text-cyan-300">({org.scientific_name})</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        org.verification_status === 'VERIFIED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {org.verification_status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <span>Phylum: {org.phylum || 'Unspecified'}</span>
                      <span aria-hidden="true">·</span>
                      <span>Habitat: {org.habitat || 'Unrecorded'}</span>
                      <span aria-hidden="true">·</span>
                      <span>{org.mediaCount || 0} media record{(org.mediaCount || 0) === 1 ? '' : 's'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setAttachingToOrg(org);
                        setSelectedMediaToAttach('');
                        setAttachIsPrimary(false);
                        loadMedia();
                      }}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Link className="w-3.5 h-3.5" />
                      Attach Media
                    </button>
                    <button
                      onClick={() => {
                        setEditingOrganism(org);
                        setEditStatus(org.verification_status);
                        setEditCommonName(org.common_name);
                        setEditDescription(org.description || '');
                        setEditHabitat(org.habitat || '');
                      }}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => onNavigate('organism-detail', org.id)}
                      className="p-1.5 text-slate-400 hover:text-cyan-400 rounded cursor-pointer"
                      title="View Public Profile"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. ADD AN ORGANISM */}
      {/* ------------------------------------------------------------- */}
      {activeSection === 'add-organism' && (
        <div className="max-w-3xl space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-100">Add an Organism to Official Catalog</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Create an organism record with taxonomic hierarchy and ecological data. Photographs or videos can be attached afterward.
            </p>
          </div>

          {addOrgMessage && (
            <div className={`p-3.5 rounded-lg text-xs ${
              addOrgMessage.isWarning
                ? 'bg-amber-950/40 border border-amber-800 text-amber-300'
                : 'bg-emerald-950/40 border border-emerald-800 text-emerald-300'
            }`}>
              {addOrgMessage.text}
            </div>
          )}

          <form onSubmit={handleAddOrganismSubmit} className="space-y-6">
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Primary Identity
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Common Name <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addCommonName}
                    onChange={(e) => setAddCommonName(e.target.value)}
                    placeholder="e.g. Leafy Seadragon"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Scientific Name <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addScientificName}
                    onChange={(e) => setAddScientificName(e.target.value)}
                    placeholder="e.g. Phycodurus eques"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-600 italic font-serif"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Verification Status
                </label>
                <select
                  value={addVerificationStatus}
                  onChange={(e) => setAddVerificationStatus(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-600"
                >
                  <option value="VERIFIED">Verified (Immediately public)</option>
                  <option value="UNVERIFIED">Unverified (Pending review)</option>
                </select>
              </div>
            </div>

            {/* Taxonomy */}
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Taxonomic Classification
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Kingdom</label>
                  <input
                    type="text"
                    value={addKingdom}
                    onChange={(e) => setAddKingdom(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Phylum</label>
                  <input
                    type="text"
                    value={addPhylum}
                    onChange={(e) => setAddPhylum(e.target.value)}
                    placeholder="e.g. Chordata"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Class</label>
                  <input
                    type="text"
                    value={addClassName}
                    onChange={(e) => setAddClassName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Order</label>
                  <input
                    type="text"
                    value={addOrderName}
                    onChange={(e) => setAddOrderName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Family</label>
                  <input
                    type="text"
                    value={addFamily}
                    onChange={(e) => setAddFamily(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Genus</label>
                  <input
                    type="text"
                    value={addGenus}
                    onChange={(e) => setAddGenus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 italic"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Species</label>
                  <input
                    type="text"
                    value={addSpecies}
                    onChange={(e) => setAddSpecies(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 italic"
                  />
                </div>
              </div>
            </div>

            {/* Description & Ecological Attributes */}
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Ecology &amp; Identification Specs
              </h3>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={addDescription}
                  onChange={(e) => setAddDescription(e.target.value)}
                  placeholder="Overview of biological profile, history, and characteristics..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Habitat</label>
                  <input
                    type="text"
                    value={addHabitat}
                    onChange={(e) => setAddHabitat(e.target.value)}
                    placeholder="e.g. Kelp forests, coastal reefs"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Min Depth (Meters)</label>
                  <input
                    type="number"
                    value={addMinDepth}
                    onChange={(e) => setAddMinDepth(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Max Depth (Meters)</label>
                  <input
                    type="number"
                    value={addMaxDepth}
                    onChange={(e) => setAddMaxDepth(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Morphological Characteristics</label>
                  <textarea
                    rows={2}
                    value={addMorphology}
                    onChange={(e) => setAddMorphology(e.target.value)}
                    placeholder="Physical appearance, leaf-like appendages..."
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Identification Key Features</label>
                  <textarea
                    rows={2}
                    value={addIdFeatures}
                    onChange={(e) => setAddIdFeatures(e.target.value)}
                    placeholder="Diagnostic traits distinguishing it from related taxa..."
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={addOrgSubmitting}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer shadow-sm shadow-amber-950"
            >
              {addOrgSubmitting ? 'Creating Record...' : 'Save Organism Profile'}
            </button>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. UNKNOWN ORGANISMS WORKFLOW */}
      {/* ------------------------------------------------------------- */}
      {activeSection === 'unknowns' && (
        <div className="space-y-4">
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-base font-bold text-slate-100">Unidentified Organisms Queue</h2>
            <p className="text-xs text-slate-400">
              Observations marked as UNKNOWN. Review evidence, add notes, or resolve them by linking to a known organism or creating a new record.
            </p>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-500 text-xs">Loading unknown records...</div>
          ) : submissions.length === 0 ? (
            <EmptyState
              title="No unidentified specimens in queue"
              description="There are currently no observations waiting for taxonomic resolution."
              icon={CheckCircle2}
            />
          ) : (
            <div className="space-y-4">
              {submissions.map((sub) => (
                <div key={sub.id} className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">
                        {sub.title || 'Unidentified Marine Observation'}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Contributed by {sub.contributor_name} on {new Date(sub.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      onClick={() => handleOpenReview(sub)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold cursor-pointer"
                    >
                      Resolve / Review
                    </button>
                  </div>

                  {sub.contributor_notes && (
                    <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded border border-slate-800">
                      {sub.contributor_notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. MEDIA MANAGEMENT */}
      {/* ------------------------------------------------------------- */}
      {activeSection === 'media' && (
        <div className="space-y-4">
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-base font-bold text-slate-100">Media Vault &amp; Provenance Registry</h2>
            <p className="text-xs text-slate-400">
              Inspect all uploaded media, license declarations, and separated display/AI permissions.
            </p>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-500 text-xs">Loading media vault...</div>
          ) : allMedia.length === 0 ? (
            <EmptyState
              title="Media vault is waiting for its first upload"
              description="No photograph or video records exist in the database yet."
              icon={ImageIcon}
            />
          ) : (
            <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
              {allMedia.map((med) => (
                <div key={med.id} className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-12 rounded overflow-hidden border border-slate-800 bg-black shrink-0">
                      {med.file_type === 'video' ? (
                        <video src={med.file_path} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={med.file_path} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>

                    <div className="text-xs space-y-0.5">
                      <div className="font-mono text-slate-200">{med.original_filename}</div>
                      <div className="text-slate-400">
                        Category: <span className="text-cyan-300 font-medium">{med.category || 'In Situ / Live Organism'}</span> · License: <span className="text-slate-300">{med.license_type}</span> · Creator: {med.creator_name || 'Contributor'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Linked Organism: {med.organism_common_name || 'Unassigned'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className={med.public_display_permission ? 'text-emerald-400' : 'text-amber-400'}>
                      Display: {med.public_display_permission ? 'Yes' : 'No'}
                    </span>
                    <span className={med.ai_reference_permission ? 'text-cyan-400' : 'text-slate-400'}>
                      AI Ref: {med.ai_reference_permission ? 'Yes' : 'No'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      med.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {med.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* REVIEW & DECISION MODAL */}
      {/* ------------------------------------------------------------- */}
      {inspectingSubmission && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono text-cyan-400">Reviewing {inspectingSubmission.id}</span>
                <h3 className="text-base font-bold text-slate-100">
                  {inspectingSubmission.title || inspectingSubmission.suspected_common_name || 'Observation'}
                </h3>
              </div>
              <button
                onClick={() => setInspectingSubmission(null)}
                className="text-slate-400 hover:text-slate-200 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Media previews */}
            {inspectingSubmission.media && inspectingSubmission.media.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {inspectingSubmission.media.map((m) => (
                  <div key={m.id} className="relative aspect-video rounded-lg overflow-hidden border border-slate-800 bg-black">
                    {m.file_type === 'video' ? (
                      <video src={m.file_path} controls className="w-full h-full object-contain" />
                    ) : (
                      <img src={m.file_path} alt="" className="w-full h-full object-contain" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Submission metadata */}
            <div className="p-3 bg-slate-950 rounded-lg text-xs space-y-1.5 border border-slate-800">
              <div><span className="text-slate-400">Contributor:</span> {inspectingSubmission.contributor_name} ({inspectingSubmission.contributor_email})</div>
              <div><span className="text-slate-400">Observation Date:</span> {inspectingSubmission.observation_date || 'Not recorded'}</div>
              <div><span className="text-slate-400">Location:</span> {inspectingSubmission.observation_location || 'Not recorded'}</div>
              {inspectingSubmission.media && inspectingSubmission.media[0]?.category && (
                <div><span className="text-slate-400">Media Category:</span> <span className="text-cyan-300 font-medium">{inspectingSubmission.media[0].category}</span></div>
              )}
              <div><span className="text-slate-400">Notes:</span> {inspectingSubmission.contributor_notes || 'None'}</div>
            </div>

            {/* Review Decision Form */}
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Curator Decision Action
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setReviewAction('APPROVE')}
                    className={`p-2 rounded-lg border text-center cursor-pointer transition-colors ${
                      reviewAction === 'APPROVE' ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold' : 'border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Approve for Library
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewAction('REQUEST_CLARIFICATION')}
                    className={`p-2 rounded-lg border text-center cursor-pointer transition-colors ${
                      reviewAction === 'REQUEST_CLARIFICATION' ? 'bg-orange-950 border-orange-500 text-orange-300 font-bold' : 'border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Request Clarification
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewAction('MARK_UNKNOWN')}
                    className={`p-2 rounded-lg border text-center cursor-pointer transition-colors ${
                      reviewAction === 'MARK_UNKNOWN' ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold' : 'border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Mark as Unknown
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewAction('REJECT')}
                    className={`p-2 rounded-lg border text-center cursor-pointer transition-colors ${
                      reviewAction === 'REJECT' ? 'bg-red-950 border-red-500 text-red-300 font-bold' : 'border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Reject Submission
                  </button>
                </div>
              </div>

              {/* Organism Linking / Creation if approving */}
              {reviewAction === 'APPROVE' && (
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-3 text-xs">
                  <label className="block font-semibold text-slate-200">
                    Assign to Organism Record
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="radio"
                        checked={!inlineCreateOrganism}
                        onChange={() => setInlineCreateOrganism(false)}
                        className="accent-amber-500"
                      />
                      <span>Select Existing Organism</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="radio"
                        checked={inlineCreateOrganism}
                        onChange={() => setInlineCreateOrganism(true)}
                        className="accent-amber-500"
                      />
                      <span>Create New Organism Inline</span>
                    </label>
                  </div>

                  {!inlineCreateOrganism ? (
                    <select
                      value={selectedOrganismId}
                      onChange={(e) => setSelectedOrganismId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                    >
                      <option value="">-- Select an Organism --</option>
                      {organisms.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.common_name} ({o.scientific_name})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Common Name (e.g. Moon Jelly)"
                        value={inlineCommonName}
                        onChange={(e) => setInlineCommonName(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                      />
                      <input
                        type="text"
                        placeholder="Scientific Name (e.g. Aurelia aurita)"
                        value={inlineScientificName}
                        onChange={(e) => setInlineScientificName(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 italic"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Separated Rights Controls (Critical Rule) */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs">
                <span className="font-semibold text-slate-200 block">
                  Permissions Verification (Must Be Independent Decisions)
                </span>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={reviewPublicDisplay}
                    onChange={(e) => setReviewPublicDisplay(e.target.checked)}
                    className="accent-emerald-500"
                  />
                  <span>Authorize Public Display in Organism Library</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={reviewAiReference}
                    onChange={(e) => setReviewAiReference(e.target.checked)}
                    className="accent-cyan-500"
                  />
                  <span>Authorize as Reference Dataset for Future AI Identification</span>
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Curator Reason / Reviewer Message to Contributor
                </label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={
                    reviewAction === 'REJECT'
                      ? 'Explain reason for rejection...'
                      : reviewAction === 'REQUEST_CLARIFICATION'
                      ? 'Describe additional photos or evidence required...'
                      : 'Optional review notes or species identification confirmation...'
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              {reviewError && (
                <div className="p-2.5 bg-red-950/40 border border-red-800 rounded text-xs text-red-300">
                  {reviewError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInspectingSubmission(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded text-xs font-semibold cursor-pointer"
                >
                  {reviewSubmitting ? 'Recording Decision...' : 'Confirm Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ATTACH MEDIA MODAL */}
      {attachingToOrg && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-100">
              Attach Approved Media to "{attachingToOrg.common_name}"
            </h3>
            <form onSubmit={handleAttachMediaSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Select Media Record</label>
                <select
                  required
                  value={selectedMediaToAttach}
                  onChange={(e) => setSelectedMediaToAttach(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                >
                  <option value="">-- Select Media --</option>
                  {allMedia.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.original_filename} ({m.creator_name || 'Contributor'})
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={attachIsPrimary}
                  onChange={(e) => setAttachIsPrimary(e.target.checked)}
                  className="accent-cyan-500"
                />
                <span>Set as primary preview image for organism card</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAttachingToOrg(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium cursor-pointer"
                >
                  Attach Media
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ORGANISM MODAL */}
      {editingOrganism && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-100">
              Edit "{editingOrganism.common_name}"
            </h3>
            <form onSubmit={handleEditOrganismSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Common Name</label>
                <input
                  type="text"
                  value={editCommonName}
                  onChange={(e) => setEditCommonName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Habitat</label>
                <input
                  type="text"
                  value={editHabitat}
                  onChange={(e) => setEditHabitat(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                >
                  <option value="VERIFIED">VERIFIED (Public)</option>
                  <option value="UNVERIFIED">UNVERIFIED (Draft)</option>
                  <option value="ARCHIVED">ARCHIVED (Hidden)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingOrganism(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
