"use client";

import { useState, useEffect, useMemo } from 'react';
import { Brand } from '@/app/home';
import {
  Plus,
  ShieldCheck,
  LogOut,
  FileText,
  Users,
  BriefcaseBusiness,
  CheckCircle2,
  Shield,
  UserCheck,
  Mail,
  AlertCircle,
  Trash2,
  Search,
  Download,
  Filter,
  Calendar,
  Clock,
  Sparkles,
  Star,
  MessageSquare,
  ExternalLink,
  Eye,
  Check,
  X,
  ChevronRight,
  Phone,
  MapPin,
  GraduationCap,
  Building,
  Briefcase,
  FileDown,
  UserPlus,
  Globe
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster, toast } from 'sonner';
import { type Job, categories, trackedPlatforms } from '@/lib/jobs';
import {
  type Profile,
  type Application,
  statusLabels,
  selectableAdminStatuses
} from '@/lib/profile';

async function api(url: string, opts?: RequestInit) {
  const r = await fetch(url, opts);
  const d: any = await r.json();
  if (!r.ok) throw Error(d.error || 'Please try again.');
  return d;
}

export default function Admin({ email }: { email: string }) {
  const [data, setData] = useState<{ jobs: Job[]; applications: Application[]; candidates: Profile[] } | null>(null);
  const [accessData, setAccessData] = useState<{ isSuperAdmin: boolean; admins: any[]; requests: any[]; auditLogs?: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [setup, setSetup] = useState('');
  const [saving, setSaving] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [editor, setEditor] = useState<Job | 'new' | null>(null);
  const [jobCategory, setJobCategory] = useState('Data Annotation & RLHF');
  const [jobType, setJobType] = useState('Contract');
  const [jobStatus, setJobStatus] = useState('open');
  const [formError, setFormError] = useState('');

  // Super Admin flag: designated email or API verification
  const isSuperAdminUser = (email && (email.toLowerCase() === 'saurabho7222@gmail.com' || email.toLowerCase() === 'admin@hireease.com')) || Boolean(accessData?.isSuperAdmin);
  const [candidate, setCandidate] = useState<Profile | null>(null);

  // ATS Filters and Search States
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [appSearch, setAppSearch] = useState<string>('');
  const [candidateSearch, setCandidateSearch] = useState<string>('');

  // Candidate Dossier & Internal Notes Modal State
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [evalNotes, setEvalNotes] = useState<string>('');
  const [evalRating, setEvalRating] = useState<number>(0);
  const [evalSaving, setEvalSaving] = useState<boolean>(false);
  const [interviewDateInput, setInterviewDateInput] = useState<string>('');

  // Add Admin Modal States
  const [addAdminModalOpen, setAddAdminModalOpen] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'recruiter'>('admin');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

  async function load() {
    try {
      const [adminData, accessRes] = await Promise.all([
        api('/api/admin'),
        api('/api/admin/access').catch(() => null)
      ]);
      setData(adminData);
      if (accessRes) setAccessData(accessRes);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const key = hash.get('setup');
    if (key) {
      setSetup(key);
      history.replaceState(null, '', '/admin');
    }
    load();
  }, []);

  async function activate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: setup })
      });
      setSetup('');
      await load();
      toast.success('Your recruiter workspace is activated.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function edit(j: Job | 'new') {
    setEditor(j);
    setFormError('');
    setJobCategory(j === 'new' ? 'Data Annotation & RLHF' : j.category);
    setJobType(j === 'new' ? 'Contract' : j.type);
    setJobStatus(j === 'new' ? 'open' : j.status);
  }

  async function deleteJob(id: string) {
    if (!confirm('Are you sure you want to remove this role?')) return;
    try {
      await api('/api/admin/jobs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      await load();
      toast.success('Role deleted successfully.');
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    const f = new FormData(e.currentTarget);
    const payload = {
      ...Object.fromEntries(f),
      ...(editor !== 'new' ? { id: (editor as Job).id } : {}),
      category: jobCategory,
      type: jobType,
      status: jobStatus,
      skills: String(f.get('skills')).split(',').map(s => s.trim()).filter(Boolean),
      responsibilities: String(f.get('responsibilities')).split('\n').map(s => s.trim()).filter(Boolean)
    };

    try {
      await api('/api/admin/jobs', {
        method: editor === 'new' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setEditor(null);
      await load();
      toast.success(jobStatus === 'open' ? 'Role published.' : 'Role saved as closed.');
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // Update application status, internal notes, rating, and email dispatch
  async function update(
    a: Application,
    newStatus: string,
    notes?: string,
    rating?: number,
    sendEmail?: boolean,
    interviewDate?: string
  ) {
    setApprovingId(a.id);
    try {
      const res = await api('/api/admin/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: a.id,
          status: newStatus,
          notes: notes !== undefined ? notes : a.notes,
          rating: rating !== undefined ? rating : a.rating,
          interviewDate: interviewDate !== undefined ? interviewDate : a.interviewDate,
          sendEmail: sendEmail ?? (newStatus === 'selected' || newStatus === 'approved')
        })
      });

      // Update in local state for instantaneous UI response
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          applications: prev.applications.map(item =>
            item.id === a.id
              ? {
                  ...item,
                  status: newStatus,
                  notes: res.notes !== undefined ? res.notes : (notes ?? item.notes),
                  rating: res.rating !== undefined ? res.rating : (rating ?? item.rating),
                  interviewDate: interviewDate !== undefined ? interviewDate : item.interviewDate
                }
              : item
          )
        };
      });

      if (selectedApplication?.id === a.id) {
        setSelectedApplication(prev => prev ? {
          ...prev,
          status: newStatus,
          notes: res.notes !== undefined ? res.notes : (notes ?? prev.notes),
          rating: res.rating !== undefined ? res.rating : (rating ?? prev.rating),
          interviewDate: interviewDate !== undefined ? interviewDate : prev.interviewDate
        } : null);
      }

      if (newStatus === 'selected' || newStatus === 'approved' || res.emailSent) {
        toast.success(`Application approved! Candidate selection email sent to ${res.recipientEmail || a.profile?.email}.`);
      } else {
        toast.success(`Status updated to ${statusLabels[newStatus] || newStatus}.`);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setApprovingId(null);
    }
  }

  // Save notes and interview date from the Candidate Dossier modal
  async function saveDossierNotes() {
    if (!selectedApplication) return;
    setEvalSaving(true);
    try {
      await update(selectedApplication, selectedApplication.status, evalNotes, evalRating, false, interviewDateInput);
      toast.success('Internal review notes and interview details saved.');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setEvalSaving(false);
    }
  }

  function openDossier(app: Application) {
    setSelectedApplication(app);
    setEvalNotes(app.notes || '');
    setEvalRating(app.rating || 0);
    setInterviewDateInput(app.interviewDate || '');
  }

  async function handleCreateAdmin() {
    if (!newAdminEmail.trim() || !newAdminName.trim()) {
      toast.error('Please enter name and email for the administrator.');
      return;
    }
    setIsAddingAdmin(true);
    try {
      const res = await api('/api/admin/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_admin',
          name: newAdminName.trim(),
          email: newAdminEmail.trim(),
          role: newAdminRole,
          temporaryPassword: newAdminPassword.trim() || undefined
        })
      });
      toast.success(res.message || 'Administrator account added successfully!');
      setAddAdminModalOpen(false);
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setIsAddingAdmin(false);
    }
  }

  async function handleChangeAdminRole(userId: string, role: 'admin' | 'recruiter') {
    try {
      const res = await api('/api/admin/access', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'change_role', role })
      });
      toast.success(res.message);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleAdminAccessAction(userId: string, action: 'grant' | 'revoke') {
    try {
      const res = await api('/api/admin/access', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      });
      await load();
      toast.success(res.message);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  // Filtered Applications Pipeline
  const filteredApplications = useMemo(() => {
    if (!data?.applications) return [];
    return data.applications.filter(a => {
      // Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'clicked_apply') {
          if (a.status !== 'clicked_apply' && a.status !== 'redirected') return false;
        } else if (statusFilter === 'awaiting_confirmation') {
          if (a.status !== 'awaiting_confirmation' && a.status !== 'pending') return false;
        } else if (statusFilter === 'submitted') {
          if (a.status !== 'submitted') return false;
        } else if (statusFilter === 'assessment') {
          if (a.status !== 'assessment') return false;
        } else if (statusFilter === 'interview') {
          if (a.status !== 'interview' && a.status !== 'interview_scheduled' && a.status !== 'interview_done' && a.status !== 'interview_completed') return false;
        } else if (statusFilter === 'selected') {
          if (a.status !== 'selected' && a.status !== 'approved' && a.status !== 'hired') return false;
        } else if (statusFilter === 'rejected') {
          if (a.status !== 'rejected' && a.status !== 'not_selected') return false;
        }
      }

      // Role Filter
      if (roleFilter !== 'all') {
        if (a.jobTitle !== roleFilter && a.jobId !== roleFilter) return false;
      }

      // Platform Filter
      if (platformFilter !== 'all') {
        const plat = (a.company || a.platform || '').toLowerCase();
        if (!plat.includes(platformFilter.toLowerCase())) return false;
      }

      // Search Filter
      if (appSearch.trim()) {
        const q = appSearch.toLowerCase().trim();
        const nameMatch = a.profile?.name?.toLowerCase().includes(q);
        const emailMatch = a.profile?.email?.toLowerCase().includes(q);
        const titleMatch = a.jobTitle?.toLowerCase().includes(q);
        const companyMatch = a.company?.toLowerCase().includes(q);
        const cityMatch = a.profile?.city?.toLowerCase().includes(q);
        const skillsMatch = a.profile?.skills?.some(s => s.toLowerCase().includes(q));
        if (!nameMatch && !emailMatch && !titleMatch && !companyMatch && !cityMatch && !skillsMatch) {
          return false;
        }
      }

      return true;
    });
  }, [data?.applications, statusFilter, roleFilter, platformFilter, appSearch]);

  // Filtered Talent Pool
  const filteredCandidates = useMemo(() => {
    if (!data?.candidates) return [];
    if (!candidateSearch.trim()) return data.candidates;
    const q = candidateSearch.toLowerCase().trim();
    return data.candidates.filter(c => {
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        c.country?.toLowerCase().includes(q) ||
        c.education?.toLowerCase().includes(q) ||
        c.skills.some(s => s.toLowerCase().includes(q))
      );
    });
  }, [data?.candidates, candidateSearch]);

  // Status Metrics Breakdown
  const metrics = useMemo(() => {
    const apps = data?.applications || [];
    return {
      total: apps.length,
      clickedApply: apps.filter(a => a.status === 'clicked_apply' || a.status === 'redirected').length,
      awaitingConfirmation: apps.filter(a => a.status === 'awaiting_confirmation' || a.status === 'pending').length,
      submitted: apps.filter(a => a.status === 'submitted').length,
      assessment: apps.filter(a => a.status === 'assessment').length,
      interview: apps.filter(a => a.status === 'interview' || a.status === 'interview_scheduled' || a.status === 'interview_done' || a.status === 'interview_completed').length,
      selected: apps.filter(a => a.status === 'selected' || a.status === 'approved' || a.status === 'hired').length,
      rejected: apps.filter(a => a.status === 'rejected' || a.status === 'not_selected').length,
      candidates: data?.candidates?.length || 0,
      openJobs: data?.jobs?.filter(j => j.status === 'open').length || 0
    };
  }, [data]);

  // Status Badge Helper
  function renderStatusPill(status: string) {
    const st = status.toLowerCase();
    if (st === 'approved' || st === 'selected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 size={13} className="text-emerald-600" /> Selected / Approved
        </span>
      );
    }
    if (st === 'hired') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#edf7e3] text-[#182319] border border-[#c4f568]">
          🎉 Hired / Offered
        </span>
      );
    }
    if (st === 'interview_completed' || st === 'interview_done') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
          🎙️ Interview Completed
        </span>
      );
    }
    if (st === 'interview_scheduled' || st === 'interview') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
          📅 Interview Scheduled
        </span>
      );
    }
    if (st === 'assessment') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-800 border border-violet-200">
          🧠 Assessment
        </span>
      );
    }
    if (st === 'submitted') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
          📝 Application Submitted
        </span>
      );
    }
    if (st === 'awaiting_confirmation') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
          ⏳ Awaiting External Confirmation
        </span>
      );
    }
    if (st === 'redirected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
          ↗️ Redirected
        </span>
      );
    }
    if (st === 'clicked_apply') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
          🔗 Clicked Apply
        </span>
      );
    }
    if (st === 'review' || st === 'under_review') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
          🔍 Under Review
        </span>
      );
    }
    if (st === 'rejected' || st === 'not_selected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          ✕ Not Selected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-700 border border-gray-200">
        ⏳ {statusLabels[st] || st}
      </span>
    );
  }

  return (
    <div className="account-page bg-[#f6f9f2] min-h-screen text-[#182319]">
      <Toaster richColors />

      {/* Header */}
      <header className="bg-white border-b border-[#dce5d4] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Brand />
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#182319] text-[#c4f568]">
              <ShieldCheck size={12} /> Recruiter ATS
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-5 text-sm">
            <a
              href="/dashboard"
              className="text-xs font-bold text-[#2e5c17] hover:text-[#182319] bg-[#edf7e3] px-3 py-1.5 rounded-xl border border-[#dce5d4] transition"
            >
              Candidate view →
            </a>
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-[#182319]">{email}</span>
              <span className="text-[10px] text-gray-500">Super Administrator</span>
            </div>
            <a
              href="/api/auth/logout"
              aria-label="Sign out"
              className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition"
              title="Sign out"
            >
              <LogOut size={18} />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero Section */}
        <div className="bg-[#182319] text-white rounded-3xl p-6 sm:p-8 mb-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#c4f568] opacity-5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-wider uppercase text-[#c4f568] mb-2 bg-[#233324] px-3 py-1 rounded-full">
                <Sparkles size={13} /> HIRE EASE TALENT ACQUISITION & ATS PORTAL
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-2">
                Candidate Pipeline & Management
              </h1>
              <p className="text-sm text-gray-300 max-w-2xl">
                Review incoming applications, grade candidate skills, conduct interview tracking, record internal notes, and dispatch selection approvals.
              </p>
            </div>

            {data && (
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => edit('new')}
                  className="px-5 py-2.5 bg-[#c4f568] hover:bg-[#b2eb52] text-[#182319] rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm font-semibold"
                >
                  <Plus size={16} /> Publish a Role
                </button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <Skeleton className="h-96 w-full rounded-2xl" />
        ) : error && !data ? (
          <section className="bg-white border border-rose-200 rounded-2xl p-8 max-w-xl mx-auto shadow-sm text-center">
            <AlertCircle size={40} className="text-rose-600 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-[#182319] mb-2">Unable to Load Recruiter Workspace</h2>
            <p className="text-xs text-rose-700 mb-6 bg-rose-50 p-3 rounded-xl border border-rose-100">
              {error}
            </p>
            <button
              onClick={() => { setLoading(true); load(); }}
              className="px-6 py-2.5 bg-[#182319] hover:bg-[#2b421e] text-[#c4f568] font-bold text-xs rounded-xl transition shadow-xs"
            >
              Retry Loading
            </button>
          </section>
        ) : !data ? (
          <section className="bg-white border border-[#dce5d4] rounded-2xl p-8 max-w-xl mx-auto shadow-sm text-center">
            <ShieldCheck size={40} className="text-[#2e5c17] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#182319] mb-2">Connecting to Recruiter Workspace</h2>
            <p className="text-xs text-gray-500 mb-6">
              Synchronizing verified ATS applications, talent pipeline, and administrator credentials.
            </p>
            <button
              onClick={() => { setLoading(true); load(); }}
              className="px-6 py-2.5 bg-[#182319] hover:bg-[#2b421e] text-[#c4f568] font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
            >
              Refresh Workspace
            </button>
          </section>
        ) : (
          <>
            {/* KPI Metrics Dashboard Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
              <div
                onClick={() => setStatusFilter('all')}
                className={`bg-white border rounded-2xl p-4 cursor-pointer transition shadow-xs hover:border-[#182319] ${
                  statusFilter === 'all' ? 'border-[#182319] ring-2 ring-[#182319]/10' : 'border-[#dce5d4]'
                }`}
              >
                <div className="flex items-center justify-between text-gray-500 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total</span>
                  <FileText size={16} className="text-[#182319]" />
                </div>
                <div className="text-2xl font-extrabold text-[#182319]">{metrics.total}</div>
                <div className="text-[11px] text-gray-500">All Applications</div>
              </div>

              <div
                onClick={() => setStatusFilter('clicked_apply')}
                className={`bg-white border rounded-2xl p-4 cursor-pointer transition shadow-xs hover:border-sky-400 ${
                  statusFilter === 'clicked_apply' ? 'border-sky-500 ring-2 ring-sky-500/10' : 'border-[#dce5d4]'
                }`}
              >
                <div className="flex items-center justify-between text-sky-700 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Clicked Apply</span>
                  <ExternalLink size={16} />
                </div>
                <div className="text-2xl font-extrabold text-sky-700">{metrics.clickedApply}</div>
                <div className="text-[11px] text-gray-500">Redirected to link</div>
              </div>

              <div
                onClick={() => setStatusFilter('awaiting_confirmation')}
                className={`bg-white border rounded-2xl p-4 cursor-pointer transition shadow-xs hover:border-amber-400 ${
                  statusFilter === 'awaiting_confirmation' ? 'border-amber-500 ring-2 ring-amber-500/10' : 'border-[#dce5d4]'
                }`}
              >
                <div className="flex items-center justify-between text-amber-700 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Awaiting Conf</span>
                  <Clock size={16} />
                </div>
                <div className="text-2xl font-extrabold text-amber-700">{metrics.awaitingConfirmation}</div>
                <div className="text-[11px] text-gray-500">External pending</div>
              </div>

              <div
                onClick={() => setStatusFilter('assessment')}
                className={`bg-white border rounded-2xl p-4 cursor-pointer transition shadow-xs hover:border-purple-400 ${
                  statusFilter === 'assessment' ? 'border-purple-500 ring-2 ring-purple-500/10' : 'border-[#dce5d4]'
                }`}
              >
                <div className="flex items-center justify-between text-purple-700 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Assessment</span>
                  <Sparkles size={16} />
                </div>
                <div className="text-2xl font-extrabold text-purple-700">{metrics.assessment}</div>
                <div className="text-[11px] text-gray-500">Online test stage</div>
              </div>

              <div
                onClick={() => setStatusFilter('interview')}
                className={`bg-white border rounded-2xl p-4 cursor-pointer transition shadow-xs hover:border-indigo-400 ${
                  statusFilter === 'interview' ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-[#dce5d4]'
                }`}
              >
                <div className="flex items-center justify-between text-indigo-700 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Interviews</span>
                  <Calendar size={16} />
                </div>
                <div className="text-2xl font-extrabold text-indigo-700">{metrics.interview}</div>
                <div className="text-[11px] text-gray-500">Scheduled / Done</div>
              </div>

              <div
                onClick={() => setStatusFilter('selected')}
                className={`bg-white border rounded-2xl p-4 cursor-pointer transition shadow-xs hover:border-emerald-400 ${
                  statusFilter === 'selected' ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-[#dce5d4]'
                }`}
              >
                <div className="flex items-center justify-between text-emerald-700 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Selected</span>
                  <CheckCircle2 size={16} />
                </div>
                <div className="text-2xl font-extrabold text-emerald-700">{metrics.selected}</div>
                <div className="text-[11px] text-gray-500">Hired / Offered</div>
              </div>
            </div>

            {/* Main Tabs Navigation */}
            <Tabs defaultValue="applications" className="space-y-6">
              <TabsList className="bg-white border border-[#dce5d4] p-1.5 rounded-2xl flex flex-wrap gap-1 shadow-xs">
                <TabsTrigger
                  value="applications"
                  className="data-[state=active]:bg-[#182319] data-[state=active]:text-[#c4f568] text-gray-700 font-bold text-xs px-4 py-2 rounded-xl transition"
                >
                  Candidate Applications ({data.applications.length})
                </TabsTrigger>
                <TabsTrigger
                  value="candidates"
                  className="data-[state=active]:bg-[#182319] data-[state=active]:text-[#c4f568] text-gray-700 font-bold text-xs px-4 py-2 rounded-xl transition"
                >
                  Talent Pool ({data.candidates.length})
                </TabsTrigger>
                <TabsTrigger
                  value="jobs"
                  className="data-[state=active]:bg-[#182319] data-[state=active]:text-[#c4f568] text-gray-700 font-bold text-xs px-4 py-2 rounded-xl transition"
                >
                  Job Openings ({data.jobs.length})
                </TabsTrigger>
                <TabsTrigger
                  value="approvals"
                  className="data-[state=active]:bg-[#182319] data-[state=active]:text-[#c4f568] text-gray-700 font-bold text-xs px-4 py-2 rounded-xl transition"
                >
                  Admin Access Control
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: CANDIDATE APPLICATIONS (ATS CORE) */}
              <TabsContent value="applications" className="space-y-6">
                {/* Applications Filtering & Search Bar */}
                <div className="bg-white border border-[#dce5d4] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                  {/* Status Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
                        statusFilter === 'all'
                          ? 'bg-[#182319] text-[#c4f568]'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      All ({metrics.total})
                    </button>
                    <button
                      onClick={() => setStatusFilter('clicked_apply')}
                      className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
                        statusFilter === 'clicked_apply'
                          ? 'bg-sky-700 text-white'
                          : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
                      }`}
                    >
                      🔗 Clicked Apply ({metrics.clickedApply})
                    </button>
                    <button
                      onClick={() => setStatusFilter('awaiting_confirmation')}
                      className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
                        statusFilter === 'awaiting_confirmation'
                          ? 'bg-amber-600 text-white'
                          : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      ⏳ Awaiting Conf ({metrics.awaitingConfirmation})
                    </button>
                    <button
                      onClick={() => setStatusFilter('submitted')}
                      className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
                        statusFilter === 'submitted'
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                      }`}
                    >
                      📝 Submitted ({metrics.submitted})
                    </button>
                    <button
                      onClick={() => setStatusFilter('assessment')}
                      className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
                        statusFilter === 'assessment'
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                      }`}
                    >
                      🧠 Assessment ({metrics.assessment})
                    </button>
                    <button
                      onClick={() => setStatusFilter('interview')}
                      className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
                        statusFilter === 'interview'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
                      }`}
                    >
                      🎙️ Interview ({metrics.interview})
                    </button>
                    <button
                      onClick={() => setStatusFilter('selected')}
                      className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
                        statusFilter === 'selected'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      }`}
                    >
                      🎉 Selected / Hired ({metrics.selected})
                    </button>
                    <button
                      onClick={() => setStatusFilter('rejected')}
                      className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
                        statusFilter === 'rejected'
                          ? 'bg-rose-600 text-white'
                          : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                      }`}
                    >
                      ✕ Rejected ({metrics.rejected})
                    </button>
                  </div>

                  {/* Search and Role Filter */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-gray-100">
                    <div className="sm:col-span-6 relative">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search candidate name, email, skills, city, or company..."
                        value={appSearch}
                        onChange={e => setAppSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2e5c17]"
                      />
                      {appSearch && (
                        <button
                          onClick={() => setAppSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="sm:col-span-6">
                      <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-full text-xs h-9 sm:h-10 rounded-xl bg-gray-50 border-gray-200">
                          <SelectValue placeholder="Filter by Job Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Roles & Openings</SelectItem>
                          {Array.from(new Set(data.applications.map(a => a.jobTitle))).map(title => (
                            <SelectItem key={title} value={title}>
                              {title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                    <span>
                      Showing <strong>{filteredApplications.length}</strong> of {data.applications.length} applications
                    </span>
                    {(statusFilter !== 'all' || roleFilter !== 'all' || appSearch) && (
                      <button
                        onClick={() => {
                          setStatusFilter('all');
                          setRoleFilter('all');
                          setAppSearch('');
                        }}
                        className="text-xs text-[#2e5c17] hover:underline font-bold"
                      >
                        Reset all filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Candidate Applications List */}
                {filteredApplications.length === 0 ? (
                  <div className="bg-white border border-[#dce5d4] rounded-2xl p-12 text-center shadow-xs">
                    <FileText size={36} className="text-gray-400 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-gray-800 mb-1">No candidate applications found</h3>
                    <p className="text-xs text-gray-500 max-w-md mx-auto mb-4">
                      No applications match the current filter or search criteria. Try resetting filters.
                    </p>
                    <button
                      onClick={() => {
                        setStatusFilter('all');
                        setRoleFilter('all');
                        setAppSearch('');
                      }}
                      className="px-4 py-2 bg-[#182319] text-[#c4f568] rounded-xl text-xs font-bold"
                    >
                      Clear search filters
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredApplications.map(a => {
                      const isSelected = a.status === 'selected' || a.status === 'approved';
                      const isCurrentApproving = approvingId === a.id;
                      const candidateName = a.profile?.name || 'Candidate';
                      const initials = candidateName
                        .split(' ')
                        .map(n => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase();

                      return (
                        <article
                          key={a.id}
                          className="bg-white border border-[#dce5d4] hover:border-gray-300 rounded-2xl p-5 sm:p-6 shadow-xs transition space-y-4"
                        >
                          {/* Card Top Header */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-3.5">
                              {/* Avatar */}
                              <div className="w-11 h-11 rounded-2xl bg-[#edf7e3] text-[#2e5c17] font-extrabold flex items-center justify-center text-sm shrink-0 border border-[#dce5d4]">
                                {initials || 'CA'}
                              </div>

                              <div>
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="text-xs font-extrabold text-[#182319] hover:underline cursor-pointer" onClick={() => openDossier(a)}>
                                    {candidateName}
                                  </span>
                                  <span className="text-xs text-gray-400">·</span>
                                  <span className="text-xs font-semibold text-gray-700">{a.jobTitle}</span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                    {a.company || 'Partner'}
                                  </span>
                                  {a.isSample && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                      Sample Role
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                                  <span>{a.profile?.email}</span>
                                  {a.profile?.city && (
                                    <>
                                      <span>•</span>
                                      <span>{a.profile?.city}, {a.profile?.country || 'India'}</span>
                                    </>
                                  )}
                                  <span>•</span>
                                  <span>
                                    Applied {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Status Selector Dropdown */}
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                              <span className="text-[11px] font-bold text-gray-400 uppercase sm:hidden">Status:</span>
                              <div className="w-48 sm:w-52">
                                <Select value={a.status} onValueChange={v => update(a, v)}>
                                  <SelectTrigger className="h-9 text-xs rounded-xl font-bold bg-white border-gray-300 shadow-2xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {selectableAdminStatuses.map(item => (
                                      <SelectItem key={item.value} value={item.value} className="text-xs font-semibold">
                                        <div className="flex items-center gap-2">
                                          <span>{item.icon}</span>
                                          <span>{item.label}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                    {/* Fallback for legacy status strings */}
                                    {!selectableAdminStatuses.some(s => s.value === a.status) && (
                                      <SelectItem value={a.status} className="text-xs font-semibold">
                                        {statusLabels[a.status] || a.status}
                                      </SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>

                          {/* Skills & Candidate snapshot snippet */}
                          {a.profile?.skills && a.profile.skills.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap pt-1">
                              <span className="text-[11px] text-gray-400 font-semibold mr-1">Skills:</span>
                              {a.profile.skills.slice(0, 6).map(s => (
                                <span
                                  key={s}
                                  className="text-[11px] font-medium bg-[#f6f9f2] text-gray-700 px-2.5 py-0.5 rounded-lg border border-[#dce5d4]"
                                >
                                  {s}
                                </span>
                              ))}
                              {a.profile.skills.length > 6 && (
                                <span className="text-[10px] text-gray-400 font-bold">
                                  +{a.profile.skills.length - 6} more
                                </span>
                              )}
                            </div>
                          )}

                          {/* Recruiter Review Note Preview (if set) */}
                          {a.notes && (
                            <div className="bg-[#fcfdfa] border border-[#e5edd8] rounded-xl p-3 text-xs text-gray-700 flex items-start gap-2.5">
                              <MessageSquare size={14} className="text-[#2e5c17] shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="font-bold text-[#182319]">Internal Recruiter Notes</span>
                                  {a.rating && a.rating > 0 ? (
                                    <span className="text-amber-500 font-bold flex items-center">
                                      {'★'.repeat(a.rating)}{'☆'.repeat(5 - a.rating)}
                                    </span>
                                  ) : null}
                                </div>
                                <p className="text-gray-600 line-clamp-2">{a.notes}</p>
                              </div>
                            </div>
                          )}

                          {/* Card Actions Bar */}
                          <div className="pt-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={() => openDossier(a)}
                                className="px-3 py-1.5 bg-[#edf7e3] hover:bg-[#e1f0d3] text-[#2e5c17] rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-[#dce5d4]"
                              >
                                <Eye size={13} /> Full Dossier & Notes
                              </button>

                              <a
                                href={'/api/resume?application=' + a.id}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                                title="Download submitted PDF resume"
                              >
                                <Download size={13} /> Résumé
                              </a>

                              <a
                                href={`mailto:${a.profile?.email}?subject=${encodeURIComponent(`Regarding your application for ${a.jobTitle} at ${a.company || 'HireEase'}`)}`}
                                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                                title="Send direct email to candidate"
                              >
                                <Mail size={13} /> Contact
                              </a>
                            </div>

                            {/* Quick Action Decision Button */}
                            <div>
                              {!isSelected ? (
                                <button
                                  disabled={isCurrentApproving}
                                  onClick={() => update(a, 'approved', undefined, undefined, true)}
                                  className="px-4 py-1.5 bg-[#182319] hover:bg-[#2b421e] text-[#c4f568] rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                                >
                                  <CheckCircle2 size={14} />
                                  {isCurrentApproving ? 'Approving…' : 'Quick Approve & Send Email'}
                                </button>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    <CheckCircle2 size={13} className="text-emerald-600" /> Approved · Email Sent
                                  </span>
                                  <button
                                    disabled={isCurrentApproving}
                                    onClick={() => update(a, 'approved', undefined, undefined, true)}
                                    className="text-xs font-semibold text-gray-500 hover:text-[#182319] flex items-center gap-1"
                                    title="Resend the approval notification email"
                                  >
                                    <Mail size={12} /> Resend
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* TAB 2: TALENT POOL (ALL CANDIDATES) */}
              <TabsContent value="candidates" className="space-y-6">
                <div className="bg-white border border-[#dce5d4] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                  <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search talent network by skill (e.g. Python, RLHF, Medical), name, email, or city..."
                      value={candidateSearch}
                      onChange={e => setCandidateSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2e5c17]"
                    />
                    {candidateSearch && (
                      <button
                        onClick={() => setCandidateSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    Showing <strong>{filteredCandidates.length}</strong> registered talent profiles
                  </div>
                </div>

                {filteredCandidates.length === 0 ? (
                  <div className="bg-white border border-[#dce5d4] rounded-2xl p-12 text-center shadow-xs">
                    <Users size={36} className="text-gray-400 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-gray-800 mb-1">No candidate profiles found</h3>
                    <p className="text-xs text-gray-500 max-w-md mx-auto">
                      Candidate profiles appear here automatically as candidates sign up and complete their onboarding.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredCandidates.map(c => (
                      <div
                        key={c.userId}
                        className="bg-white border border-[#dce5d4] hover:border-gray-300 rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <h3 className="text-sm font-extrabold text-[#182319]">{c.name}</h3>
                              <div className="text-xs text-gray-500">{c.email}</div>
                            </div>
                            <span className="text-[10px] bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-md">
                              {c.city || 'India'}
                            </span>
                          </div>

                          <div className="text-xs text-gray-600 mb-3">
                            <span className="font-semibold text-gray-800">{c.education}</span> · {c.institution} ({c.graduationYear})
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {c.skills.slice(0, 5).map(s => (
                              <span
                                key={s}
                                className="text-[10px] font-medium bg-[#f6f9f2] text-gray-700 px-2 py-0.5 rounded-md border border-[#dce5d4]"
                              >
                                {s}
                              </span>
                            ))}
                            {c.skills.length > 5 && (
                              <span className="text-[10px] text-gray-400">+{c.skills.length - 5}</span>
                            )}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                          <button
                            onClick={() => setCandidate(c)}
                            className="font-bold text-[#2e5c17] hover:underline flex items-center gap-1"
                          >
                            <Eye size={13} /> View Profile
                          </button>
                          {c.hasResume && (
                            <a
                              href={'/api/resume?candidate=' + encodeURIComponent(c.userId)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-gray-600 hover:text-[#182319] flex items-center gap-1"
                            >
                              <Download size={13} /> Download CV
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* TAB 3: JOB OPENINGS MANAGEMENT */}
              <TabsContent value="jobs" className="space-y-6">
                <div className="flex items-center justify-between gap-4 bg-white border border-[#dce5d4] p-4 rounded-2xl shadow-xs">
                  <div>
                    <h2 className="text-base font-bold text-[#182319]">Published Partner Roles</h2>
                    <p className="text-xs text-gray-500">
                      Manage verified job listings displayed across HireEase candidate job portal.
                    </p>
                  </div>
                  <button
                    onClick={() => edit('new')}
                    className="px-4 py-2 bg-[#182319] hover:bg-[#2e5c17] text-[#c4f568] rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus size={15} /> Create Role
                  </button>
                </div>

                {data.jobs.length === 0 ? (
                  <div className="bg-white border border-[#dce5d4] rounded-2xl p-12 text-center shadow-xs">
                    <BriefcaseBusiness size={36} className="text-gray-400 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-gray-800 mb-1">No roles published yet</h3>
                    <p className="text-xs text-gray-500 max-w-md mx-auto mb-4">
                      Create your first job post. It will immediately show up for candidates on the homepage and dashboard.
                    </p>
                    <button
                      onClick={() => edit('new')}
                      className="px-4 py-2 bg-[#182319] text-[#c4f568] rounded-xl text-xs font-bold"
                    >
                      Publish First Job
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.jobs.map(j => (
                      <article
                        key={j.id}
                        className="bg-white border border-[#dce5d4] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2e5c17] bg-[#edf7e3] px-2 py-0.5 rounded-md">
                              {j.company}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                                j.status === 'open'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {j.status.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-400">·</span>
                            <span className="text-xs text-gray-500">{j.category}</span>
                          </div>
                          <h3 className="text-base font-extrabold text-[#182319] mb-1">{j.title}</h3>
                          <p className="text-xs text-gray-500 mb-2">
                            {j.location} · {j.type} · Pay: {j.compensation || 'Disclosed during screening'}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {j.skills.map(s => (
                              <span
                                key={s}
                                className="text-[10px] font-medium bg-[#f6f9f2] text-gray-700 px-2 py-0.5 rounded-md border border-[#dce5d4]"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => edit(j)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteJob(j.id)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* TAB 4: SUPER ADMIN SECURITY & TEAM APPROVALS */}
              <TabsContent value="approvals" className="space-y-6">
                <div className="bg-white border border-[#dce5d4] rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield size={22} className="text-[#2e5c17]" />
                    <h3 className="text-base font-bold text-[#182319]">Super Admin Access Control</h3>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">
                    Only authorized recruiter and administrative personnel can view candidate submissions, resumes, and change application statuses. Super Admin account holds exclusive privilege to approve team members.
                  </p>
                </div>

                {/* Authorized Admins List */}
                <div className="bg-white border border-[#dce5d4] rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-[#182319]">Active Administrators</h3>
                      <p className="text-xs text-gray-500">Manage recruiter and administrator privileges for team members.</p>
                    </div>
                    {isSuperAdminUser && (
                      <button
                        onClick={() => setAddAdminModalOpen(true)}
                        className="px-4 py-2 bg-[#182319] hover:bg-[#2b421e] text-[#c4f568] text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs self-start sm:self-auto cursor-pointer"
                      >
                        <UserPlus size={15} /> Add New Admin
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {((accessData?.admins && accessData.admins.length > 0)
                      ? accessData.admins
                      : [{ id: 'super-root', name: 'saurabh ojha', email: email || 'saurabho7222@gmail.com', role: 'admin' }]
                    ).map((adm: any) => {
                        const isSuper = (adm.email?.toLowerCase() === email?.toLowerCase()) || (adm.email?.toLowerCase() === 'saurabho7222@gmail.com');
                        const role = adm.role || 'admin';
                        return (
                          <div
                            key={adm.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200"
                          >
                            <div className="flex items-center gap-3">
                              <UserCheck size={18} className={isSuper ? 'text-[#2e5c17]' : role === 'recruiter' ? 'text-purple-600' : 'text-blue-600'} />
                              <div>
                                <strong className="text-xs font-bold text-gray-900">{adm.name}</strong>
                                <div className="text-[11px] text-gray-500">{adm.email}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              {isSuper ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#182319] text-[#c4f568]">
                                  Super Admin (You)
                                </span>
                              ) : (
                                <>
                                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                    role === 'recruiter'
                                      ? 'bg-purple-50 text-purple-800 border-purple-200'
                                      : 'bg-blue-50 text-blue-800 border-blue-200'
                                  }`}>
                                    {role === 'recruiter' ? 'Recruiter' : 'Administrator'}
                                  </span>

                                  {isSuperAdminUser && (
                                    <>
                                      <button
                                        onClick={() => handleChangeAdminRole(adm.id, role === 'admin' ? 'recruiter' : 'admin')}
                                        className="text-xs text-gray-600 hover:text-gray-900 font-semibold px-2 py-1 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition"
                                        title={`Switch role to ${role === 'admin' ? 'Recruiter' : 'Administrator'}`}
                                      >
                                        Change to {role === 'admin' ? 'Recruiter' : 'Admin'}
                                      </button>
                                      <button
                                        onClick={() => handleAdminAccessAction(adm.id, 'revoke')}
                                        className="text-xs text-rose-600 font-bold hover:underline px-2 py-1"
                                      >
                                        Revoke
                                      </button>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Pending Requests */}
                <div className="bg-white border border-[#dce5d4] rounded-2xl p-6 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-[#182319]">Pending Recruiter Access Requests</h3>
                  {accessData?.requests && accessData.requests.filter((r: any) => r.status === 'pending').length > 0 ? (
                    <div className="space-y-3">
                      {accessData.requests.filter((r: any) => r.status === 'pending').map((req: any) => (
                        <div
                          key={req.id}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200"
                        >
                          <div>
                            <strong className="text-xs font-bold text-gray-900">{req.name}</strong>
                            <div className="text-[11px] text-gray-500">{req.email}</div>
                            <p className="text-xs text-gray-600 mt-1 italic">&quot;{req.reason}&quot;</p>
                          </div>
                          {isSuperAdminUser && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleAdminAccessAction(req.user_id, 'grant')}
                                className="px-3 py-1.5 bg-[#182319] text-[#c4f568] rounded-xl text-xs font-bold transition cursor-pointer"
                              >
                                Approve Admin
                              </button>
                              <button
                                onClick={() => handleAdminAccessAction(req.user_id, 'revoke')}
                                className="px-3 py-1.5 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold transition cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-gray-500 border border-dashed border-gray-200 rounded-xl">
                      No pending recruiter requests. All candidates are strictly locked into the candidate dashboard.
                    </div>
                  )}
                </div>

                {/* Admin Activity & Audit Logs */}
                <div className="bg-white border border-[#dce5d4] rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#182319]">Admin Activity & Audit Trail</h3>
                      <p className="text-xs text-gray-500">Security record of role modifications, admin additions, and status updates.</p>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                      {accessData?.auditLogs?.length || 0} Events Logged
                    </span>
                  </div>

                  {accessData?.auditLogs && accessData.auditLogs.length > 0 ? (
                    <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto pr-1">
                      {accessData.auditLogs.map((log: any) => (
                        <div key={log.id} className="py-2.5 flex items-start justify-between text-xs gap-3">
                          <div className="space-y-0.5">
                            <div className="font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-700">
                                {log.action.replace(/_/g, ' ')}
                              </span>
                              <span>{log.actor_email}</span>
                            </div>
                            <div className="text-gray-500 text-[11px]">
                              Target: <strong>{log.target_email || 'System'}</strong>
                              {log.details ? ` · ${log.details}` : ''}
                            </div>
                          </div>
                          <div className="text-[11px] text-gray-400 whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 text-center py-4">No administrative audit events recorded yet.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      <footer className="text-center py-8 text-xs text-gray-400 border-t border-[#dce5d4] bg-white">
        HireEase Services Recruiter ATS · Built for high-volume technical screening
      </footer>

      {/* Role Editor Modal */}
      <Dialog open={!!editor} onOpenChange={o => !o && setEditor(null)}>
        <DialogContent className="max-w-2xl bg-white rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
          <DialogTitle className="text-xl font-bold text-[#182319]">
            {editor === 'new' ? 'Publish a New Role' : 'Edit Role Posting'}
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 mb-4">
            Roles appear immediately across the HireEase website and candidate job feeds.
          </DialogDescription>

          <form onSubmit={save} className="space-y-4" key={editor === 'new' ? 'new' : editor?.id}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Role Title</label>
                <input
                  name="title"
                  required
                  minLength={3}
                  maxLength={150}
                  placeholder="e.g. AI Prompt Evaluator, Python RLHF Reviewer"
                  defaultValue={editor !== 'new' ? editor?.title : ''}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2e5c17]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Company / Platform</label>
                <input
                  name="company"
                  id="job-company-input"
                  required
                  minLength={2}
                  maxLength={150}
                  list="tracked-platforms-list"
                  placeholder="e.g. Mercor, Alignerr, micro1, Turing, Scale AI..."
                  defaultValue={editor !== 'new' ? editor?.company : ''}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2e5c17]"
                />
                <datalist id="tracked-platforms-list">
                  {trackedPlatforms.map(p => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
                <div className="flex gap-1 flex-wrap mt-1.5">
                  {trackedPlatforms.slice(0, 6).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('job-company-input') as HTMLInputElement;
                        if (el) el.value = p;
                      }}
                      className="text-[10px] px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                <Select value={jobCategory} onValueChange={setJobCategory}>
                  <SelectTrigger className="w-full text-xs h-9 sm:h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.slice(1).map(c => (
                      <SelectItem value={c} key={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Work Type</label>
                <Select value={jobType} onValueChange={setJobType}>
                  <SelectTrigger className="w-full text-xs h-9 sm:h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['Contract', 'Full-time', 'Part-time', 'Freelance'].map(t => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Location</label>
                <input
                  name="location"
                  required
                  maxLength={150}
                  placeholder="Remote — India or Global"
                  defaultValue={editor !== 'new' ? editor?.location : ''}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2e5c17]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Experience</label>
                <input
                  name="experience"
                  required
                  maxLength={200}
                  placeholder="1-3 years in technical writing / code review"
                  defaultValue={editor !== 'new' ? editor?.experience : ''}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2e5c17]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Compensation / Pay Rate</label>
              <input
                name="compensation"
                required
                maxLength={200}
                placeholder="e.g. $25 - $45/hr or ₹8,00,000 - ₹15,00,000/yr"
                defaultValue={editor !== 'new' ? editor?.compensation : ''}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2e5c17]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Role Description</label>
              <textarea
                name="description"
                rows={3}
                required
                minLength={20}
                maxLength={3000}
                defaultValue={editor !== 'new' ? editor?.description : ''}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2e5c17]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Required Skills (comma separated)</label>
              <input
                name="skills"
                required
                maxLength={2000}
                placeholder="Python, RLHF, Prompt Engineering, Evaluation"
                defaultValue={editor !== 'new' ? editor?.skills.join(', ') : ''}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2e5c17]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Key Responsibilities (one per line)</label>
              <textarea
                name="responsibilities"
                rows={3}
                required
                maxLength={7000}
                placeholder="Audit model outputs for factual precision&#10;Flag hallucinations and safety violations&#10;Write unit tests for edge cases"
                defaultValue={editor !== 'new' ? editor?.responsibilities.join('\n') : ''}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2e5c17]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Publication Status</label>
              <Select value={jobStatus} onValueChange={setJobStatus}>
                <SelectTrigger className="w-full text-xs h-9 sm:h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open — Published on website</SelectItem>
                  <SelectItem value="closed">Closed — Hidden from new applications</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formError && <p className="text-xs text-rose-600">{formError}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-[#182319] hover:bg-[#2e5c17] text-[#c4f568] font-bold text-xs rounded-xl transition shadow-xs"
            >
              {saving ? 'Saving…' : jobStatus === 'open' ? 'Publish Role' : 'Save Closed Role'}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* CANDIDATE FULL DOSSIER & RECRUITER NOTES MODAL */}
      <Dialog open={!!selectedApplication} onOpenChange={o => !o && setSelectedApplication(null)}>
        <DialogContent className="max-w-2xl bg-white rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
          {selectedApplication && (
            <div className="space-y-6">
              {/* Dossier Header */}
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#2e5c17] bg-[#edf7e3] px-2.5 py-0.5 rounded-full">
                      APPLICANT DOSSIER
                    </span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-500">{selectedApplication.company}</span>
                  </div>
                  <DialogTitle className="text-xl sm:text-2xl font-extrabold text-[#182319]">
                    {selectedApplication.profile?.name || 'Candidate'}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-gray-500 mt-1">
                    Applied for <strong>{selectedApplication.jobTitle}</strong> on {new Date(selectedApplication.createdAt).toLocaleDateString()}
                  </DialogDescription>
                </div>

                <div className="text-right">
                  <div className="text-[11px] font-bold text-gray-400 uppercase mb-1">Application Status</div>
                  <Select
                    value={selectedApplication.status}
                    onValueChange={v => update(selectedApplication, v, evalNotes, evalRating, false, interviewDateInput)}
                  >
                    <SelectTrigger className="w-44 text-xs font-bold h-9 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectableAdminStatuses.map(item => (
                        <SelectItem key={item.value} value={item.value} className="text-xs font-semibold">
                          <div className="flex items-center gap-2">
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Contact & Education Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs">
                <div>
                  <div className="font-bold text-gray-800 mb-1 flex items-center gap-1.5">
                    <Mail size={13} className="text-[#2e5c17]" /> Contact Information
                  </div>
                  <p className="text-gray-600">{selectedApplication.profile?.email}</p>
                  <p className="text-gray-600">
                    {selectedApplication.profile?.address && `${selectedApplication.profile.address}, `}
                    {selectedApplication.profile?.city}, {selectedApplication.profile?.country || 'India'}
                  </p>
                </div>

                <div>
                  <div className="font-bold text-gray-800 mb-1 flex items-center gap-1.5">
                    <GraduationCap size={13} className="text-[#2e5c17]" /> Academic Background
                  </div>
                  <p className="text-gray-700 font-semibold">{selectedApplication.profile?.education || 'Degree not listed'}</p>
                  <p className="text-gray-600">
                    {selectedApplication.profile?.institution} · Grad Year: {selectedApplication.profile?.graduationYear}
                  </p>
                </div>
              </div>

              {/* Skills */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Verified Competencies</h4>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedApplication.profile?.skills?.map(s => (
                    <span
                      key={s}
                      className="text-xs font-semibold bg-[#edf7e3] text-[#2e5c17] px-3 py-1 rounded-xl border border-[#dce5d4]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Experience */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Experience Narrative</h4>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {selectedApplication.profile?.experience || 'No previous experience description provided.'}
                </div>
              </div>

              {/* Platform & Referral Link (if tracked external application) */}
              {selectedApplication.externalUrl && (
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Globe size={15} className="text-[#2e5c17]" />
                    <span className="text-gray-700">
                      Platform Application Link (<strong>{selectedApplication.platform || selectedApplication.company || 'External'}</strong>):
                    </span>
                  </div>
                  <a
                    href={selectedApplication.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2e5c17] hover:underline font-bold inline-flex items-center gap-1 shrink-0"
                  >
                    Open Platform Application <ExternalLink size={12} />
                  </a>
                </div>
              )}

              {/* Candidate Application Progression & Status History */}
              {selectedApplication.statusHistory && selectedApplication.statusHistory.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Candidate Application Progression & Audit Trail
                    </h4>
                    <span className="text-[11px] font-semibold text-gray-400">
                      {selectedApplication.statusHistory.length} events
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-2xl border border-gray-200 p-3.5 space-y-2.5 max-h-48 overflow-y-auto">
                    {selectedApplication.statusHistory.map((ev, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs">
                        <div className="w-2 h-2 rounded-full bg-[#2e5c17] mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-gray-900">
                              {statusLabels[ev.status] || ev.status}
                            </span>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap">
                              {new Date(ev.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-500">
                            Recorded by <span className="font-semibold text-gray-700">{ev.actor}</span>
                            {ev.note ? ` · "${ev.note}"` : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recruiter Evaluation & Internal Notes Box */}
              <div className="bg-[#f7faf3] p-5 rounded-2xl border border-[#dce5d4] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-[#2e5c17]" />
                    <h4 className="text-xs font-bold text-[#182319] uppercase tracking-wider">
                      Recruiter Evaluation & Screening Feedback
                    </h4>
                  </div>

                  {/* Star Rating */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setEvalRating(star === evalRating ? 0 : star)}
                        className={`text-lg transition ${
                          star <= evalRating ? 'text-amber-400' : 'text-gray-300 hover:text-amber-200'
                        }`}
                        title={`Rate ${star} star`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={3}
                  placeholder="Record interview notes, technical screening feedback, compensation discussions, communication notes..."
                  value={evalNotes}
                  onChange={e => setEvalNotes(e.target.value)}
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2e5c17]"
                />

                {/* Interview Date Input */}
                <div className="pt-1">
                  <label className="text-[11px] font-bold text-gray-700 uppercase flex items-center gap-1.5 mb-1">
                    <Calendar size={13} className="text-[#2e5c17]" /> Scheduled Interview Date / Time
                  </label>
                  <input
                    type="datetime-local"
                    value={interviewDateInput}
                    onChange={e => setInterviewDateInput(e.target.value)}
                    className="w-full sm:w-72 p-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2e5c17]"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-gray-500">
                    Internal only · Not visible to the candidate
                  </span>
                  <button
                    type="button"
                    disabled={evalSaving}
                    onClick={saveDossierNotes}
                    className="px-4 py-1.5 bg-[#182319] hover:bg-[#2e5c17] text-[#c4f568] rounded-xl text-xs font-bold transition shadow-2xs"
                  >
                    {evalSaving ? 'Saving…' : 'Save Notes & Interview'}
                  </button>
                </div>
              </div>

              {/* Dossier Action Buttons */}
              <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <a
                    href={'/api/resume?application=' + selectedApplication.id}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Download size={14} /> Download Submitted Résumé
                  </a>

                  <a
                    href={`mailto:${selectedApplication.profile?.email}?subject=${encodeURIComponent(`Regarding your application for ${selectedApplication.jobTitle} at ${selectedApplication.company || 'HireEase'}`)}`}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Mail size={14} /> Send Email
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => update(selectedApplication, 'approved', evalNotes, evalRating, true)}
                  className="px-5 py-2 bg-[#c4f568] hover:bg-[#b5e855] text-[#182319] font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 size={15} /> Approve & Dispatch Email
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Candidate Profile Viewer Modal (General Talent Pool) */}
      <Dialog open={!!candidate} onOpenChange={o => !o && setCandidate(null)}>
        <DialogContent className="max-w-xl bg-white rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
          {candidate && (
            <div className="space-y-4">
              <DialogTitle className="text-xl font-bold text-[#182319]">{candidate.name}</DialogTitle>
              <DialogDescription className="text-xs text-gray-500">{candidate.email}</DialogDescription>

              <div className="space-y-3 text-xs">
                <div>
                  <h4 className="font-bold text-gray-700">Location</h4>
                  <p className="text-gray-600">
                    {candidate.address && `${candidate.address}, `}
                    {candidate.city}, {candidate.country}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-gray-700">Education</h4>
                  <p className="text-gray-600 font-semibold">{candidate.education}</p>
                  <p className="text-gray-500">{candidate.institution} · Class of {candidate.graduationYear}</p>
                </div>

                <div>
                  <h4 className="font-bold text-gray-700 mb-1">Skills</h4>
                  <div className="flex gap-1.5 flex-wrap">
                    {candidate.skills.map(s => (
                      <span key={s} className="px-2.5 py-0.5 rounded-lg bg-gray-100 text-gray-700 text-[11px] font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-700 mb-1">Experience</h4>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap bg-gray-50 p-3 rounded-xl border border-gray-200">
                    {candidate.experience || 'No description provided.'}
                  </p>
                </div>

                {candidate.hasResume && (
                  <div className="pt-2">
                    <a
                      href={'/api/resume?candidate=' + encodeURIComponent(candidate.userId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#182319] text-[#c4f568] rounded-xl font-bold text-xs"
                    >
                      <Download size={14} /> Download Current Résumé
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add New Administrator Dialog */}
      <Dialog open={addAdminModalOpen} onOpenChange={setAddAdminModalOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-6 sm:p-8">
          <DialogTitle className="text-xl font-bold text-[#182319] flex items-center gap-2">
            <UserPlus size={20} className="text-[#2e5c17]" /> Add New Administrator
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 mb-4">
            Super Admin exclusive: grant administrative or recruiter privileges to a team member.
          </DialogDescription>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Priya Sharma"
                value={newAdminName}
                onChange={e => setNewAdminName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2e5c17]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="colleague@hireeaseservices.com"
                value={newAdminEmail}
                onChange={e => setNewAdminEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2e5c17]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Role & Permissions</label>
              <Select value={newAdminRole} onValueChange={(v: 'admin' | 'recruiter') => setNewAdminRole(v)}>
                <SelectTrigger className="w-full text-xs h-10 rounded-xl bg-gray-50 border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin" className="text-xs font-semibold">
                    Administrator (Full ATS, jobs & candidate management)
                  </SelectItem>
                  <SelectItem value="recruiter" className="text-xs font-semibold">
                    Recruiter (Screen candidates, interview updates & notes)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Temporary Password <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="password"
                placeholder="Leave blank for auto-generated secure token"
                value={newAdminPassword}
                onChange={e => setNewAdminPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2e5c17]"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setAddAdminModalOpen(false)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isAddingAdmin}
                onClick={handleCreateAdmin}
                className="px-5 py-2 bg-[#182319] hover:bg-[#2b421e] text-[#c4f568] text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
              >
                {isAddingAdmin ? 'Adding...' : 'Add Administrator'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
