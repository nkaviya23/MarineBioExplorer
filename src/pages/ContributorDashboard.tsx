import React, { useEffect, useState } from 'react';
import {
  Compass,
  PlusCircle,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  FileText,
  User,
  Shield,
  MessageSquare,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import type { Submission } from '../types/index.ts';
import { EmptyState } from '../components/EmptyState.tsx';

interface ContributorDashboardProps {
  onNavigate: (view: string, id?: string) => void;
}

export const ContributorDashboard: React.FC<ContributorDashboardProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'submissions' | 'account'>('submissions');

  const fetchMySubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/submissions/mine');
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
      }
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMySubmissions();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-medium">
            <Clock className="w-3.5 h-3.5" /> Pending Review
          </span>
        );
      case 'NEEDS_CLARIFICATION':
        return (
          <span className="inline-flex items-center gap-1 text-xs text-orange-400 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" /> Needs Clarification
          </span>
        );
      case 'UNKNOWN':
        return (
          <span className="inline-flex items-center gap-1 text-xs text-cyan-400 font-medium">
            <HelpCircle className="w-3.5 h-3.5" /> Unidentified (Community Pool)
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 text-xs text-red-400 font-medium">
            <XCircle className="w-3.5 h-3.5" /> Not Accepted
          </span>
        );
      default:
        return <span className="text-xs text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono uppercase tracking-wider mb-1">
            <User className="w-3.5 h-3.5" />
            <span>CONTRIBUTOR WORKSPACE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
            Welcome, {user?.full_name || 'Ocean Explorer'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Account: {user?.email} · Role: Contributor
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('contribute')}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm shadow-cyan-950 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Contribute a Discovery
          </button>
          <button
            onClick={async () => {
              await logout();
              onNavigate('home');
            }}
            className="p-2 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-xs cursor-pointer transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div
          onClick={() => onNavigate('identify')}
          className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-cyan-800/60 transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Search className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">
            Identify an Organism
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Upload an image to request help or search existing species catalog.
          </p>
        </div>

        <div
          onClick={() => onNavigate('contribute')}
          className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-cyan-800/60 transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <PlusCircle className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">
            Contribute a Discovery
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Submit photographs, videos, and environmental metadata with rights settings.
          </p>
        </div>

        <div
          onClick={() => onNavigate('explore')}
          className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-cyan-800/60 transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Compass className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">
            Explore the Library
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Browse verified marine taxonomy records and approved public observations.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-6 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('submissions')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'submissions'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          My Submissions ({submissions.length})
        </button>

        <button
          onClick={() => setActiveTab('account')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'account'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          Account Details
        </button>
      </div>

      {activeTab === 'submissions' && (
        <div>
          {loading ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              Loading your submission history...
            </div>
          ) : submissions.length === 0 ? (
            <EmptyState
              title="No contributions yet. Be the first to share a discovery."
              description="You have not submitted any marine life observations yet. Once you contribute photos or videos, you can track verification reviews and curator notes here."
              icon={FileText}
              actionText="Contribute a Discovery"
              onAction={() => onNavigate('contribute')}
              secondaryActionText="Identify an Organism"
              onSecondaryAction={() => onNavigate('identify')}
            />
          ) : (
            <div className="space-y-4">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-100">
                        {sub.title || sub.suspected_common_name || 'Observation Record'}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="font-mono text-[11px] text-slate-400">ID: {sub.id}</span>
                        <span aria-hidden="true">·</span>
                        <span>{new Date(sub.created_at).toLocaleDateString()}</span>
                        {sub.observation_location && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{sub.observation_location}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div>{getStatusBadge(sub.status)}</div>
                  </div>

                  {/* Media preview and observation summary */}
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    {sub.media && sub.media.length > 0 && (
                      <div className="w-28 h-20 rounded-lg overflow-hidden border border-slate-800 bg-black shrink-0">
                        {sub.media[0].file_type === 'video' ? (
                          <video src={sub.media[0].file_path} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={sub.media[0].file_path} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                    )}

                    <div className="text-xs text-slate-300 space-y-1.5 flex-1">
                      {sub.suspected_common_name && (
                        <div>
                          <span className="text-slate-400">Suspected Species: </span>
                          <span className="font-medium text-slate-200">{sub.suspected_common_name}</span>
                          {sub.suspected_scientific_name && (
                            <span className="italic font-serif text-cyan-300 ml-1.5">
                              ({sub.suspected_scientific_name})
                            </span>
                          )}
                        </div>
                      )}
                      {sub.contributor_notes && (
                        <div>
                          <span className="text-slate-400">Notes: </span>
                          <span>{sub.contributor_notes}</span>
                        </div>
                      )}

                      {/* Permissions recorded */}
                      <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400 font-mono">
                        <span>Public Display: {sub.public_display_permission ? 'Authorized' : 'Private'}</span>
                        <span>·</span>
                        <span>AI Reference: {sub.ai_reference_permission ? 'Authorized' : 'Excluded'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Reviewer message if clarification requested or notes present */}
                  {sub.reviewer_notes && (
                    <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200 flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                      <div>
                        <span className="font-semibold block text-amber-300">Curator / Reviewer Notes:</span>
                        <span>{sub.reviewer_notes}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'account' && (
        <div className="max-w-xl p-6 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
          <h2 className="text-base font-bold text-slate-100">Account Details</h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Full Name / Attribution</span>
              <span className="text-slate-200 font-medium">{user?.full_name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Email Address</span>
              <span className="text-slate-200 font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Platform Role</span>
              <span className="text-cyan-400 font-mono font-medium">{user?.role}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Total Submissions Recorded</span>
              <span className="text-slate-200 font-mono font-medium">{submissions.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
