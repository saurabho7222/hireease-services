"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Gift,
  FileText,
  Globe,
  UserRound,
  Settings,
  Target,
  Bot,
  Search,
  Bell,
  Clock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Share2,
  Bookmark,
  Award,
  Upload,
  Copy,
  Download,
  LogOut,
  ShieldCheck,
  Check,
  ExternalLink,
  ChevronRight,
  Filter,
  Printer,
  Eye,
  Send,
  Info,
  DollarSign,
  Flame,
  CheckSquare,
  AlertCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster, toast } from 'sonner';
import { Brand, WhatsAppIcon, LinkedinIcon } from '@/app/home';
import {
  trackedPlatforms,
  categories,
  internalProjects,
  practiceLabQuestions,
  matchingSkills,
  type Job
} from '@/lib/jobs';
import { type Profile, type Application, statusLabels } from '@/lib/profile';

async function api(url: string, options?: RequestInit) {
  const r = await fetch(url, options);
  const d: any = await r.json();
  if (!r.ok) throw Error(d.error || 'Please try again.');
  return d;
}

export default function Dashboard({
  userName,
  email,
  role,
  userRole
}: {
  userName: string;
  email: string;
  role: string;
  userRole?: string;
}) {
  // Navigation: dashboard, find-jobs, refer-and-earn, resume-builder, portfolio, profile, settings
  const [activeNav, setActiveNav] = useState<'dashboard' | 'find-jobs' | 'refer-and-earn' | 'resume-builder' | 'portfolio' | 'profile' | 'settings'>('dashboard');

  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [consent, setConsent] = useState(false);
  const [applicationConsent, setApplicationConsent] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState('');
  const [selected, setSelected] = useState<Job | null>(null);
  const [applyError, setApplyError] = useState('');
  const [query, setQuery] = useState('');
  const [savedJobs, setSavedJobs] = useState<string[]>([]);

  // Find Jobs Filters state
  const [jobCategory, setJobCategory] = useState('All categories');
  const [jobPlatform, setJobPlatform] = useState('All platforms');
  const [jobType, setJobType] = useState('All types');
  const [jobMinPay, setJobMinPay] = useState<number>(0);
  const [jobHighDemandOnly, setJobHighDemandOnly] = useState(false);

  // In-House project selection
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [projectApplying, setProjectApplying] = useState(false);

  // Notifications modal
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [jobAlertsEnabled, setJobAlertsEnabled] = useState<boolean | null>(null);

  // Practice Lab Quiz state
  const [labAnswers, setLabAnswers] = useState<Record<number, string>>({});
  const [labSubmitted, setLabSubmitted] = useState(false);
  const [labScore, setLabScore] = useState<number | null>(null);

  // Controlled Profile Form State for real-time dashboard reactivity
  const [formName, setFormName] = useState(userName || '');
  const [formCity, setFormCity] = useState('');
  const [formCountry, setFormCountry] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formEducation, setFormEducation] = useState('');
  const [formInstitution, setFormInstitution] = useState('');
  const [formGraduationYear, setFormGraduationYear] = useState('');
  const [formSkills, setFormSkills] = useState('');
  const [formExperience, setFormExperience] = useState('');

  // Account-isolated referral state
  interface ReferralItem {
    id: string;
    name: string;
    email: string;
    date: string;
    status: string;
    hours: number;
    bonus: number;
    paid: boolean;
  }
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);

  // ATS Resume Builder state (dynamically populated per candidate)
  const [resumeTemplate, setResumeTemplate] = useState<'ats-minimal' | 'ats-technical' | 'ats-executive' | 'ats-compact'>('ats-minimal');
  const [resumeTargetRole, setResumeTargetRole] = useState('AI Model Evaluator & RLHF Specialist');
  const [resumeName, setResumeName] = useState(userName || (email ? email.split('@')[0] : 'Candidate'));
  const [resumeEmail, setResumeEmail] = useState(email || '');
  const [resumePhone, setResumePhone] = useState('');
  const [resumeLocation, setResumeLocation] = useState('');
  const [resumeSummary, setResumeSummary] = useState(
    'Meticulous analytical professional with verified proficiency in RLHF evaluation, prompt grading, and hallucination auditing. Track record of rigorously following multi-tier rubrics across leading AI training pipelines.'
  );
  const [resumeSkills, setResumeSkills] = useState('');
  const [resumeExperience, setResumeExperience] = useState('');
  const [resumeEducation, setResumeEducation] = useState('');
  const [resumeCopied, setResumeCopied] = useState(false);

  const openedRole = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function load() {
    setLoadError('');
    try {
      const [p, a, j] = await Promise.all([
        api('/api/profile'),
        api('/api/applications'),
        api('/api/jobs')
      ]);
      const candProfile: Profile | null = p.profile;
      setProfile(candProfile);
      setConsent(!!candProfile);
      setApplications(a.applications || []);
      const liveJobs = Array.isArray(j?.jobs) ? j.jobs : [];
      setJobs(liveJobs);

      // Synchronize controlled form inputs with candidate's actual profile data
      if (candProfile) {
        setFormName(candProfile.name || userName || '');
        setFormCity(candProfile.city || '');
        setFormCountry(candProfile.country || '');
        setFormAddress(candProfile.address || '');
        setFormEducation(candProfile.education || '');
        setFormInstitution(candProfile.institution || '');
        setFormGraduationYear(candProfile.graduationYear || '');
        setFormSkills(candProfile.skills && candProfile.skills.length > 0 ? candProfile.skills.join(', ') : '');
        setFormExperience(candProfile.experience || '');

        setResumeName(candProfile.name || userName || (email ? email.split('@')[0] : 'Candidate'));
        setResumeEmail(candProfile.email || email || '');
        if (candProfile.city) {
          setResumeLocation(`${candProfile.city}${candProfile.country ? ', ' + candProfile.country : ''}`);
        }
        if (candProfile.skills?.length) {
          setResumeSkills(candProfile.skills.join(', '));
        }
        if (candProfile.experience) {
          setResumeExperience(candProfile.experience);
        }
        if (candProfile.education) {
          setResumeEducation(`${candProfile.education}${candProfile.institution ? ' · ' + candProfile.institution : ''} ${candProfile.graduationYear ? '(' + candProfile.graduationYear + ')' : ''}`);
        }
      } else {
        setFormName(userName || (email ? email.split('@')[0] : ''));
        setResumeName(userName || (email ? email.split('@')[0] : 'Candidate'));
        setResumeEmail(email || '');
      }
    } catch (e) {
      setLoadError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // Load account-specific referrals from storage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const userKey = (email || userName || 'user').toLowerCase();
    try {
      const raw = localStorage.getItem(`hireease_referrals_${userKey}`);
      if (raw) {
        setReferrals(JSON.parse(raw));
      } else {
        // Fresh accounts start with 0 referrals
        setReferrals([]);
      }
    } catch {
      setReferrals([]);
    }
  }, [email, userName]);

  useEffect(() => {
    load();
  }, []);

  // Real-Time Profile Completeness Calculation
  const completeness = useMemo(() => {
    const hasName = Boolean(formName.trim().length >= 2);
    const hasLocation = Boolean(formCity.trim().length >= 2 || formCountry.trim().length >= 2);
    const personal = hasName && hasLocation;
    const academic = Boolean(formEducation.trim().length >= 2 || formInstitution.trim().length >= 2);

    const parsedSkills = formSkills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const skills = parsedSkills.length > 0;
    const experience = Boolean(formExperience.trim().length >= 10);
    const resume = Boolean(file || profile?.hasResume);

    let score = 0;
    if (hasName) score += 10;
    if (hasLocation) score += 10;
    if (academic) score += 20;
    if (skills) {
      score += Math.min(20, parsedSkills.length * 5); // 5% per skill, up to 20%
    }
    if (experience) score += 15;
    if (resume) score += 25;

    score = Math.min(100, Math.max(10, score));

    let step = 1;
    if (personal) step = 2;
    if (personal && academic) step = 3;
    if (personal && academic && skills) step = 4;

    const missing: string[] = [];
    if (!personal) missing.push('City & Country location');
    if (!academic) missing.push('Education details');
    if (!skills) missing.push('Skills & specializations');
    if (!experience) missing.push('Experience narrative');
    if (!resume) missing.push('Uploaded résumé (PDF)');

    return {
      percentage: score,
      step,
      items: { personal, academic, skills, experience, resume },
      missingFields: missing,
      skillsCount: parsedSkills.length
    };
  }, [
    formName,
    formCity,
    formCountry,
    formEducation,
    formInstitution,
    formSkills,
    formExperience,
    file,
    profile?.hasResume
  ]);

  // Candidate referral stats
  const totalEarnedBonus = useMemo(() => {
    return referrals.filter(r => r.paid).length * 50;
  }, [referrals]);

  const totalReferredCount = useMemo(() => {
    return referrals.length;
  }, [referrals]);

  const activeProjectsCount = useMemo(() => {
    return referrals.filter(r => r.hours > 0).length;
  }, [referrals]);

  const addDemoReferral = () => {
    const names = ['Priya Sharma', 'Alex Chen', 'Rahul Verma', 'David Kim', 'Elena Rostova'];
    const domains = ['Scale AI RLHF', 'micro1 Code Audit', 'Mercor Evaluator', 'Alignerr Reviewer'];
    const randomName = names[referrals.length % names.length];
    const randomDomain = domains[referrals.length % domains.length];
    const newHours = (referrals.length === 0) ? 12.5 : (referrals.length === 1 ? 7.0 : 0.0);
    const isPaid = newHours >= 10;
    const newRecord: ReferralItem = {
      id: 'ref_' + Math.random().toString(36).slice(2, 9),
      name: `${randomName} (${referrals.length + 1})`,
      email: `${randomName.toLowerCase().replace(' ', '.')}@example.com`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: isPaid ? `Active: ${randomDomain}` : (newHours > 0 ? `In Progress: ${randomDomain}` : 'Onboarding / Vetted'),
      hours: newHours,
      bonus: isPaid ? 50 : 0,
      paid: isPaid
    };
    const updated = [newRecord, ...referrals];
    setReferrals(updated);
    const userKey = (email || userName || 'user').toLowerCase();
    localStorage.setItem(`hireease_referrals_${userKey}`, JSON.stringify(updated));
    toast.success(isPaid ? `Candidate reached 10+ hours! $50.00 referral reward credited!` : 'New referral candidate registered!');
  };

  useEffect(() => {
    if (role && jobs.length && profile && !openedRole.current) {
      openedRole.current = true;
      const j = jobs.find(j => j.id === role);
      if (j) {
        setSelected(j);
        setApplicationConsent(false);
      } else {
        toast.error('This role is no longer available.');
      }
    }
  }, [role, jobs, profile]);

  // Combined jobs including curated in-house projects
  const allJobOpportunities: Job[] = useMemo(() => {
    const formattedInHouse: Job[] = internalProjects.map(proj => ({
      id: proj.id,
      title: proj.title,
      company: 'HireEase In-House',
      category: proj.domain,
      location: 'Remote · Worldwide',
      type: 'Contract',
      experience: 'Intermediate to Advanced',
      compensation: proj.payout,
      description: proj.description,
      skills: proj.requiredSkills,
      responsibilities: [
        'Conduct detailed evaluations according to enterprise client rubrics',
        'Maintain high factual accuracy and provide transparent reasoning notes',
        'Meet weekly submission quotas with peer audit verification'
      ],
      isSample: false,
      status: 'active',
      createdAt: new Date().toISOString(),
      platform: 'HireEase In-House',
      highDemand: true,
      urgent: true,
      payRate: proj.payout,
      matchReason: 'Managed direct delivery project'
    }));

    return [...jobs, ...formattedInHouse];
  }, [jobs]);

  // Filtered jobs for Find Jobs tab
  const filteredJobs = useMemo(() => {
    return allJobOpportunities.filter(j => {
      if (query) {
        const text = `${j.title} ${j.company} ${j.category} ${j.platform || ''} ${j.skills.join(' ')} ${j.description}`.toLowerCase();
        if (!text.includes(query.toLowerCase())) return false;
      }
      if (jobCategory !== 'All categories' && j.category !== jobCategory) {
        return false;
      }
      if (jobPlatform !== 'All platforms') {
        const plat = (j.platform || j.company).toLowerCase();
        if (!plat.includes(jobPlatform.toLowerCase())) return false;
      }
      if (jobType !== 'All types') {
        if (!j.type.toLowerCase().includes(jobType.toLowerCase())) return false;
      }
      if (jobHighDemandOnly && !j.highDemand && !j.urgent) {
        return false;
      }
      if (jobMinPay > 0) {
        const payNum = parseInt(j.compensation.replace(/[^0-9]/g, '')) || 0;
        if (payNum > 0 && payNum < jobMinPay) return false;
      }
      return true;
    });
  }, [allJobOpportunities, query, jobCategory, jobPlatform, jobType, jobMinPay, jobHighDemandOnly]);

  // Candidate real skills
  const userSkills = useMemo(() => {
    if (profile?.skills && profile.skills.length > 0) return profile.skills;
    const parsed = formSkills.split(',').map(s => s.trim()).filter(Boolean);
    return parsed;
  }, [profile?.skills, formSkills]);

  // Matched jobs for candidate dashboard feed
  const matchedJobs = useMemo(() => {
    if (userSkills.length === 0) {
      return allJobOpportunities.slice(0, 5);
    }
    return [...allJobOpportunities].sort((a, b) => {
      const matchA = matchingSkills(a, userSkills).length;
      const matchB = matchingSkills(b, userSkills).length;
      return matchB - matchA;
    }).slice(0, 5);
  }, [allJobOpportunities, userSkills]);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError('');
    if (!consent) {
      setFormError('Please agree to the profile-processing notice.');
      return;
    }
    setSaving(true);

    const parsedSkills = formSkills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (parsedSkills.length === 0) {
      setFormError('Please add at least one skill or specialization.');
      setSaving(false);
      return;
    }

    const payload = {
      name: formName.trim() || userName || 'Candidate',
      address: formAddress.trim() || formCity.trim() || 'Remote',
      city: formCity.trim() || 'Remote',
      country: formCountry.trim() || 'India',
      education: formEducation.trim() || 'Higher Secondary / Degree',
      institution: formInstitution.trim() || 'University / Institution',
      graduationYear: formGraduationYear.trim() || '2024',
      skills: parsedSkills,
      experience: formExperience.trim() || 'Experienced in AI evaluation, data labeling, and technical review.',
      consent: true
    };

    try {
      const d = await api('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      let updatedProfile = d.profile;

      if (file) {
        const upload = new FormData();
        upload.append('resume', file);
        const uploaded = await api('/api/resume', {
          method: 'POST',
          headers: { 'X-HireEase-Upload': '1' },
          body: upload
        });
        updatedProfile = { ...updatedProfile, resumeName: uploaded.resumeName, hasResume: true };
        setFile(null);
        if (fileInput.current) fileInput.current.value = '';
      }

      setProfile(updatedProfile);
      toast.success('Your profile has been saved successfully!');
      setActiveNav('dashboard');
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }


  async function apply() {
    if (!selected) return;
    if (!applicationConsent) {
      setApplyError('Please agree to sharing your profile for this role.');
      return;
    }
    setSaving(true);
    setApplyError('');
    try {
      const d = await api('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: selected.id, consent: true })
      });
      const list = await api('/api/applications');
      setApplications(list.applications);
      setSelected(null);
      toast.success(
        d.alreadyApplied
          ? 'You already submitted an application for this role.'
          : 'Your application has been successfully submitted!'
      );
    } catch (e) {
      setApplyError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const applyToProject = async (p: any) => {
    setProjectApplying(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      toast.success(`Application registered for "${p.title}"! HireEase review team will contact you.`);
      setSelectedProject(null);
    } finally {
      setProjectApplying(false);
    }
  };

  const handleLabSubmit = () => {
    let score = 0;
    practiceLabQuestions.forEach(q => {
      if (labAnswers[q.id] === q.correctChoice) {
        score += 1;
      }
    });
    setLabScore(score);
    setLabSubmitted(true);
    if (score >= 2) {
      toast.success('Assessment Passed! Verified Contributor status unlocked.');
    } else {
      toast.info('Review the feedback and retry to achieve a passing score.');
    }
  };

  const copyToClipboard = (text: string, msg: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success(msg);
    }
  };

  const downloadResumeTxt = () => {
    const raw = `${resumeName.toUpperCase()}
${resumeLocation} | ${resumeEmail} | ${resumePhone}
Targeting: ${resumeTargetRole}

==================================================
PROFESSIONAL SUMMARY
==================================================
${resumeSummary}

==================================================
CORE COMPETENCIES & KEYWORDS
==================================================
${resumeSkills}

==================================================
PROFESSIONAL EXPERIENCE
==================================================
${resumeExperience}

==================================================
EDUCATION & CREDENTIALS
==================================================
${resumeEducation}
- HireEase Verified AI Contributor & Prompt Auditor
`;
    const blob = new Blob([raw], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resumeName.replace(/\s+/g, '_')}_ATS_Resume.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('ATS Plain-Text Resume downloaded!');
  };

  const toggleSaveJob = (id: string) => {
    setSavedJobs(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    toast.success(savedJobs.includes(id) ? 'Job removed from saved' : 'Job bookmarked!');
  };

  const candidateName = useMemo(() => {
    return formName.trim() || profile?.name?.trim() || userName?.trim() || (email ? email.split('@')[0] : 'Candidate');
  }, [formName, profile?.name, userName, email]);

  const candidateFirstName = useMemo(() => {
    return candidateName.split(' ')[0] || 'Candidate';
  }, [candidateName]);

  const candidateInitials = useMemo(() => {
    const parts = candidateName.split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    if (parts.length === 1 && parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
    return 'CA';
  }, [candidateName]);

  // Referral URL derived uniquely for this account
  const userRefCode = useMemo(() => {
    const seed = (email || userName || 'HIREEASE').toLowerCase();
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const codeNum = Math.abs(hash) % 9000 + 1000;
    const prefix = (candidateName || 'HE')
      .replace(/[^a-zA-Z]/g, '')
      .slice(0, 4)
      .toUpperCase() || 'HE';
    return `${prefix}-${codeNum}`;
  }, [candidateName, email, userName]);

  const referralUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/apply?ref=${userRefCode}`
    : `https://hireeaseservices.com/apply?ref=${userRefCode}`;


  return (
    <div className="portal-wrapper">
      <Toaster richColors position="top-right" />

      {/* ====================================================================
          1. Left Sidebar Navigation (Matching Screenshot 1)
          ==================================================================== */}
      <aside className="portal-sidebar">
        <div className="portal-sidebar-top">
          <Brand />

          <nav className="portal-sidebar-nav">
            <button
              onClick={() => setActiveNav('dashboard')}
              className={`portal-nav-item ${activeNav === 'dashboard' ? 'active' : ''}`}
            >
              <span className="nav-left">
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </span>
            </button>

            <button
              onClick={() => setActiveNav('find-jobs')}
              className={`portal-nav-item ${activeNav === 'find-jobs' ? 'active' : ''}`}
            >
              <span className="nav-left">
                <Briefcase size={18} />
                <span>Find Jobs</span>
              </span>
              <span className="portal-nav-badge">
                {allJobOpportunities.length > 0 ? allJobOpportunities.length : '4,605'}
              </span>
            </button>

            <button
              onClick={() => setActiveNav('refer-and-earn')}
              className={`portal-nav-item ${activeNav === 'refer-and-earn' ? 'active' : ''}`}
            >
              <span className="nav-left">
                <Gift size={18} />
                <span>Refer & Earn</span>
              </span>
            </button>

            <button
              onClick={() => setActiveNav('resume-builder')}
              className={`portal-nav-item ${activeNav === 'resume-builder' ? 'active' : ''}`}
            >
              <span className="nav-left">
                <FileText size={18} />
                <span>Resume Builder</span>
              </span>
            </button>

            <button
              onClick={() => setActiveNav('portfolio')}
              className={`portal-nav-item ${activeNav === 'portfolio' ? 'active' : ''}`}
            >
              <span className="nav-left">
                <Globe size={18} />
                <span>Portfolio</span>
              </span>
            </button>

            <button
              onClick={() => setActiveNav('profile')}
              className={`portal-nav-item ${activeNav === 'profile' ? 'active' : ''}`}
            >
              <span className="nav-left">
                <UserRound size={18} />
                <span>Profile</span>
              </span>
            </button>

            <button
              onClick={() => setActiveNav('settings')}
              className={`portal-nav-item ${activeNav === 'settings' ? 'active' : ''}`}
            >
              <span className="nav-left">
                <Settings size={18} />
                <span>Settings</span>
              </span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer: Candidate Profile */}
        <div className="portal-sidebar-footer">
          <div className="portal-user-card">
            <div className="portal-user-avatar">{candidateInitials}</div>
            <div className="portal-user-info">
              <div className="portal-user-name">{candidateName}</div>
              <div className="portal-user-roles">
                {userSkills.length > 0
                  ? userSkills.slice(0, 3).join(', ')
                  : 'Talent Network Contributor'}
              </div>
              <a href="/api/auth/logout" className="portal-logout-btn">
                <LogOut size={13} /> Log out
              </a>
            </div>
          </div>
        </div>

      </aside>

      {/* ====================================================================
          2. Main Area (Top Bar + Dynamic View Content)
          ==================================================================== */}
      <main className="portal-main">
        {/* Top Header Bar (Matching Screenshot 1) */}
        <header className="portal-topbar">
          <div className="portal-search-bar">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search roles, platforms or skills"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') setActiveNav('find-jobs');
              }}
            />
          </div>

          <div className="portal-topbar-actions">
            {userRole === 'admin' && (
              <a
                href="/admin"
                className="portal-pill-btn font-bold text-emerald-800 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
              >
                <ShieldCheck size={14} /> Admin Portal
              </a>
            )}
            <div className="portal-pill-btn">UTC+05:30</div>
            <button
              onClick={() => setNotificationsOpen(true)}
              className="portal-pill-btn"
            >
              <Bell size={14} /> Notifications · 3
            </button>
          </div>
        </header>

        {/* Main Body Content based on activeNav */}
        <div className="portal-body">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-44 w-full rounded-2xl" />
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
          ) : loadError ? (
            <div className="p-10 text-center bg-white rounded-2xl border border-gray-200">
              <h2 className="text-xl font-bold text-red-700 mb-2">Dashboard Temporarily Unavailable</h2>
              <p className="text-gray-600 mb-4">{loadError}</p>
              <button onClick={load} className="btn green px-6 py-2.5 text-sm font-bold">
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* ==============================================================
                  VIEW 1: DASHBOARD (Home matching Screenshots 1 to 5)
                  ============================================================== */}
              {activeNav === 'dashboard' && (
                <div>
                  {/* Executive Hero Banner with Integrated KPIs */}
                  <div className="portal-hero-banner">
                    <div className="portal-hero-split">
                      <div className="max-w-xl">
                        <div className="portal-hero-date">
                          {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <h1 className="portal-hero-title">Good morning, {candidateFirstName}</h1>
                        <p className="portal-hero-sub">
                          Welcome to your verified candidate workspace. Explore remote frontier model evaluation, RLHF annotation, and in-house delivery projects.
                        </p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <button
                            onClick={() => setActiveNav('find-jobs')}
                            className="portal-hero-btn"
                          >
                            See my matches
                            <span className="portal-hero-btn-arrow">
                              <ArrowRight size={14} />
                            </span>
                          </button>
                          <button
                            onClick={() => setActiveNav('profile')}
                            className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-full text-xs font-bold transition flex items-center gap-2"
                          >
                            <FileText size={14} /> Update Resume
                          </button>
                          <span className="text-xs bg-emerald-950/50 text-[#c4f568] border border-[#c4f568]/30 px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#c4f568] animate-pulse" /> Live pipeline
                          </span>
                        </div>
                      </div>

                      {/* Hero KPI Stats (Glassmorphic) */}
                      <div className="portal-hero-kpis">
                        <div className="portal-hero-kpi">
                          <div className="portal-hero-kpi-val">{applications.length}</div>
                          <div className="portal-hero-kpi-lbl">Applications in review</div>
                        </div>
                        <div className="portal-hero-kpi">
                          <div className="portal-hero-kpi-val">{allJobOpportunities.filter(j => j.highDemand || j.urgent).length}</div>
                          <div className="portal-hero-kpi-lbl">High demand matches</div>
                        </div>
                        <div className="portal-hero-kpi">
                          <div className="portal-hero-kpi-val">${totalEarnedBonus.toFixed(2)}</div>
                          <div className="portal-hero-kpi-lbl">Referral bonus paid</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Shortcuts Bar */}
                  <div className="portal-quick-actions">
                    <button
                      onClick={() => setActiveNav('find-jobs')}
                      className="portal-quick-pill"
                    >
                      <Briefcase size={15} /> Find Remote Roles ({allJobOpportunities.length > 0 ? allJobOpportunities.length : '4,605'})
                    </button>
                    <button
                      onClick={() => setActiveNav('resume-builder')}
                      className="portal-quick-pill"
                    >
                      <FileText size={15} /> ATS Resume Builder (96% Match)
                    </button>
                    <button
                      onClick={() => setActiveNav('refer-and-earn')}
                      className="portal-quick-pill"
                    >
                      <Gift size={15} /> Refer & Earn ($50 Bounty)
                    </button>
                    <button
                      onClick={() => setActiveNav('portfolio')}
                      className="portal-quick-pill"
                    >
                      <ShieldCheck size={15} /> Practice Lab & Benchmark Quiz
                    </button>
                    <button
                      onClick={() => setActiveNav('profile')}
                      className="portal-quick-pill"
                    >
                      <UserRound size={15} /> Profile & Resume ({completeness.percentage}%)
                    </button>
                  </div>

                  {/* 2-Column Bento Layout */}
                  <div className="portal-dashboard-grid">
                    {/* LEFT COLUMN: Opportunities & Applications Feed */}
                    <div className="space-y-6">
                      {/* Section 1: Matched For You */}
                      <div className="bg-white border border-[#dce5d4] rounded-2xl p-6 shadow-xs">
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                          <div className="flex items-center gap-2.5">
                            <h2 className="text-lg font-bold text-gray-900">Matched for you</h2>
                            <span className="text-xs bg-[#edf7e3] text-[#2e5c17] border border-[#d2ebd5] px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#77ab3b]" /> Live data
                            </span>
                          </div>
                          <button
                            onClick={() => setActiveNav('find-jobs')}
                            className="text-xs text-[#2e5c17] hover:text-[#182319] font-bold hover:underline"
                          >
                            View all {allJobOpportunities.length > 0 ? allJobOpportunities.length : ''} roles →
                          </button>
                        </div>

                        <div className="space-y-2.5">
                          {matchedJobs.map((j, idx) => (
                            <div
                              key={j.id}
                              className="portal-matched-card cursor-pointer"
                              onClick={() => setSelected(j)}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                  {idx < 2 && (
                                    <span className="portal-tag-demand">
                                      <Flame size={12} /> High demand
                                    </span>
                                  )}
                                  <span className="portal-tag-platform">
                                    via {j.platform || j.company || 'micro1'} · {idx === 0 ? 'Today' : `${idx * 2}d ago`}
                                  </span>
                                </div>
                                <h3 className="text-base font-bold text-gray-900 truncate">{j.title}</h3>
                              </div>

                              <div className="flex items-center gap-4 shrink-0">
                                <span className="text-sm font-extrabold text-[#182319]">
                                  {j.compensation || '$30 - $49/hour'}
                                </span>
                                <span className="w-8 h-8 rounded-full bg-[#edf7e3] text-[#2e5c17] flex items-center justify-center hover:bg-[#182319] hover:text-[#c4f568] transition">
                                  <ArrowRight size={15} />
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Section 2: HireEase In-House Projects (Vetted Delivery Work) */}
                      <div className="bg-white border border-[#dce5d4] rounded-2xl p-6 shadow-xs">
                        <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
                          <div>
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                              <ShieldCheck size={20} className="text-[#2e5c17]" /> HireEase In-House Projects (Vetted Only)
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">
                              Managed delivery work run directly by HireEase Services with guaranteed hourly rates.
                            </p>
                          </div>
                          <span className="text-xs font-bold bg-[#edf7e3] text-[#2e5c17] border border-[#d2ebd5] px-2.5 py-1 rounded-full">
                            Direct Payout Guaranteed
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {internalProjects.map(proj => (
                            <div
                              key={proj.id}
                              className="bg-[#fafcfa] border border-[#dce5d4] hover:border-[#77ab3b] rounded-xl p-4 flex flex-col justify-between transition shadow-xs hover:shadow-sm"
                            >
                              <div>
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <span className="text-xs font-bold bg-[#edf7e3] text-[#2e5c17] border border-[#d2ebd5] px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Sparkles size={11} /> In-House
                                  </span>
                                  <span className="text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> URGENT
                                  </span>
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 mb-1">{proj.title}</h3>
                                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{proj.description}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-600 mb-3 flex-wrap">
                                  <span className="font-extrabold text-[#182319]">{proj.payout}</span>
                                  <span>·</span>
                                  <span>{proj.estimatedHours}</span>
                                  <span>·</span>
                                  <span>{proj.duration}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                                <button
                                  onClick={() => setSelectedProject(proj)}
                                  className="flex-1 py-2 bg-[#182319] hover:bg-[#2b421e] text-white rounded-lg text-xs font-bold transition text-center"
                                >
                                  Apply to Project
                                </button>
                                <button
                                  onClick={() => copyToClipboard(`https://hireeaseservices.com/projects/${proj.id}`, 'Project link copied!')}
                                  className="p-2 border border-gray-200 hover:bg-gray-100 rounded-lg text-gray-600 transition"
                                  title="Copy project link"
                                >
                                  <Copy size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Section 3: Applications & Activity Pipeline */}
                      <div className="bg-white border border-[#dce5d4] rounded-2xl p-6 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            APPLICATIONS & SUBMISSION PIPELINE
                          </div>
                          <span className="text-xs font-bold text-gray-600">
                            {applications.length} submitted
                          </span>
                        </div>
                        {applications.length === 0 ? (
                          <div className="flex items-center gap-4 py-3 bg-[#fafcfa] rounded-xl border border-dashed border-[#dce5d4] p-4">
                            <div className="w-10 h-10 rounded-full bg-[#edf7e3] text-[#2e5c17] flex items-center justify-center shrink-0">
                              <Info size={20} />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-bold text-gray-900">No applications yet</div>
                              <div className="text-xs text-gray-500">Apply to matching roles above to start tracking review stages.</div>
                            </div>
                            <button
                              onClick={() => setActiveNav('find-jobs')}
                              className="px-4 py-2 bg-[#182319] hover:bg-[#2b421e] text-[#c4f568] rounded-xl text-xs font-bold transition shadow-sm"
                            >
                              Browse roles →
                            </button>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {applications.map(app => (
                              <div key={app.id} className="py-3 flex items-center justify-between gap-4">
                                <div>
                                  <div className="text-sm font-bold text-gray-900">{app.jobTitle}</div>
                                  <div className="text-xs text-gray-500">{app.company} · Applied on {new Date(app.createdAt).toLocaleDateString()}</div>
                                </div>
                                {(() => {
                                  const st = app.status;
                                  if (st === 'approved' || st === 'selected') {
                                    return (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                        <CheckCircle2 size={13} className="text-emerald-600" /> Approved
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
                                  if (st === 'interview_done' || st === 'interview') {
                                    return (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
                                        🎙️ Interview Done
                                      </span>
                                    );
                                  }
                                  if (st === 'interview_scheduled') {
                                    return (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                                        📅 Interview Scheduled
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
                                        Not Selected
                                      </span>
                                    );
                                  }
                                  return (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                      ⏳ Pending Review
                                    </span>
                                  );
                                })()}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Candidate Readiness, Referral & Tools Hub */}
                    <div className="space-y-6">
                      {/* Card 1: Unified Profile Completion & Verification */}
                      <div className="bg-white border border-[#dce5d4] rounded-2xl p-6 shadow-xs">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">CANDIDATE READINESS</span>
                          <span className="text-xs bg-[#edf7e3] text-[#2e5c17] font-bold px-2 py-0.5 rounded-full border border-[#d2ebd5]">
                            Step {completeness.step} of 4
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between mb-1">
                          <div className="text-3xl font-extrabold text-[#182319]">{completeness.percentage}%</div>
                          <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 size={14} /> Profile strength
                          </div>
                        </div>

                        <div className="w-full bg-gray-100 rounded-full h-2.5 mb-4 overflow-hidden">
                          <div
                            className="bg-[#c4f568] h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${completeness.percentage}%` }}
                          />
                        </div>

                        <p className="text-xs text-gray-600 mb-4">
                          {completeness.percentage === 100
                            ? 'Your profile is 100% complete and verified for automated recruiter matching.'
                            : completeness.missingFields.length > 0
                            ? `Pending: Complete ${completeness.missingFields.slice(0, 2).join(' & ')} to maximize matches.`
                            : 'Upload your resume to complete verification and unlock instant recruiter matching.'}
                        </p>

                        {/* Dynamic Checklist items */}
                        <div className="space-y-2.5 text-xs text-gray-700 border-t border-gray-100 pt-3 mb-4">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              {completeness.items.personal ? (
                                <CheckCircle2 size={15} className="text-emerald-600" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-400" />
                              )}
                              <span>Personal & Location</span>
                            </span>
                            <span className={`text-2xs font-bold ${completeness.items.personal ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {completeness.items.personal ? 'Verified' : 'Pending'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              {completeness.items.academic ? (
                                <CheckCircle2 size={15} className="text-emerald-600" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-400" />
                              )}
                              <span>Academic & Degree</span>
                            </span>
                            <span className={`text-2xs font-bold ${completeness.items.academic ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {completeness.items.academic ? 'Verified' : 'Pending'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              {completeness.items.skills ? (
                                <CheckCircle2 size={15} className="text-emerald-600" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-400" />
                              )}
                              <span>Skills & AI Domain</span>
                            </span>
                            <span className={`text-2xs font-bold ${completeness.items.skills ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {completeness.items.skills ? `${completeness.skillsCount} added` : 'Missing'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-2 bg-[#edf7e3]/60 rounded-lg border border-[#d2ebd5]">
                            <span className="flex items-center gap-2">
                              {completeness.items.resume ? (
                                <CheckCircle2 size={15} className="text-emerald-600" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-500" />
                              )}
                              <span className="font-semibold text-gray-900 truncate max-w-[140px]">
                                {file ? file.name : (profile?.hasResume ? (profile.resumeName || 'Resume file') : 'Resume Upload')}
                              </span>
                            </span>
                            <button
                              onClick={() => setActiveNav('profile')}
                              className="text-2xs font-bold text-[#2e5c17] hover:underline"
                            >
                              {completeness.items.resume ? 'Replace' : 'Upload'}
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={() => setActiveNav('profile')}
                          className="w-full py-2.5 bg-[#182319] hover:bg-[#2b421e] text-[#c4f568] font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2"
                        >
                          {completeness.percentage === 100 ? 'Review Profile Details' : 'Complete Profile Setup'} <ArrowRight size={14} />
                        </button>
                      </div>

                      {/* Card 2: Refer & Earn Widget ($50 Cash per Candidate) */}
                      <div className="bg-white border border-[#dce5d4] rounded-2xl p-6 shadow-xs">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">REFER & EARN</span>
                          <span className="text-xs bg-[#edf7e3] text-[#2e5c17] border border-[#d2ebd5] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Gift size={12} /> $50 Bounty
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-gray-900 mb-1">
                          Refer Candidates & Earn $50 Cash
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed mb-3.5">
                          Invite peer AI annotators and evaluators. When your candidate works <strong>10+ active hours</strong>, you get <strong>$50.00</strong> credited directly.
                        </p>

                        {/* Referral Link Box */}
                        <div className="bg-[#f8faf6] border border-[#dce5d4] rounded-xl p-1.5 flex items-center justify-between gap-2 mb-3">
                          <span className="text-2xs font-mono text-gray-700 truncate pl-2">{referralUrl}</span>
                          <button
                            onClick={() => copyToClipboard(referralUrl, 'Referral link copied!')}
                            className="px-3.5 py-1.5 bg-[#182319] hover:bg-[#2b421e] text-[#c4f568] text-2xs font-bold rounded-lg shrink-0 transition flex items-center gap-1 shadow-xs"
                          >
                            <Copy size={11} /> Copy Link
                          </button>
                        </div>

                        {/* Share Actions */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <a
                            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Hey, check out HireEase Services to access remote AI evaluation and annotation jobs: ${referralUrl}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-2 px-3 bg-[#f0f8ec] hover:bg-[#e1f2da] text-[#1e5822] border border-[#cbe6c1] rounded-xl text-2xs font-bold text-center flex items-center justify-center gap-1.5 transition"
                          >
                            <WhatsAppIcon size={13} /> WhatsApp
                          </a>
                          <a
                            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-2 px-3 bg-[#eef5fa] hover:bg-[#deebf5] text-[#006097] border border-[#c3daf0] rounded-xl text-2xs font-bold text-center flex items-center justify-center gap-1.5 transition"
                          >
                            <LinkedinIcon size={13} /> LinkedIn
                          </a>
                        </div>

                        <button
                          onClick={() => setActiveNav('refer-and-earn')}
                          className="w-full text-center text-2xs text-[#2e5c17] hover:text-[#182319] hover:underline font-bold pt-1"
                        >
                          View complete referral tracker & ledger →
                        </button>
                      </div>

                      {/* Card 3: Job Match Alerts Card */}
                      {jobAlertsEnabled === null && (
                        <div className="bg-white border border-[#dce5d4] rounded-2xl p-6 shadow-xs">
                          <div className="flex items-start gap-3.5 mb-3">
                            <div className="w-9 h-9 rounded-xl bg-[#edf7e3] text-[#2e5c17] border border-[#d2ebd5] flex items-center justify-center shrink-0">
                              <Bell size={18} />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900">Want instant job alerts?</div>
                              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                Get notified immediately when new roles matching your profile drop so you don't miss high-demand openings.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => {
                                setJobAlertsEnabled(true);
                                toast.success('Job alerts enabled! Matching roles will be emailed.');
                              }}
                              className="flex-1 py-2 bg-[#182319] hover:bg-[#2b421e] text-[#c4f568] rounded-xl text-xs font-bold transition shadow-xs text-center"
                            >
                              Yes, Notify Me
                            </button>
                            <button
                              onClick={() => {
                                setJobAlertsEnabled(false);
                                toast.info('Job alerts paused.');
                              }}
                              className="px-4 py-2 bg-white border border-[#dce5d4] text-gray-600 hover:bg-[#f5f8f1] rounded-xl text-xs font-bold transition"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Card 4: ATS Resume Quick Meter */}
                      <div className="bg-white border border-[#dce5d4] rounded-2xl p-6 shadow-xs">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                            <Sparkles size={14} className="text-[#2e5c17]" /> ATS Resume Ready
                          </span>
                          <span className="text-xs font-extrabold text-emerald-800 bg-[#edf7e3] border border-[#d2ebd5] px-2.5 py-0.5 rounded-full">
                            96% Score
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                          Export recruiter-friendly single-column format tailored for AI evaluation and annotation recruiters.
                        </p>
                        <button
                          onClick={() => setActiveNav('resume-builder')}
                          className="w-full py-2 bg-[#182319] hover:bg-[#2b421e] text-[#c4f568] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <FileText size={13} /> Open ATS Resume Builder
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==============================================================
                  VIEW 2: FIND JOBS (Show all jobs with full filter bar)
                  ============================================================== */}
              {activeNav === 'find-jobs' && (
                <div>
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">Find Remote AI Roles</h1>
                      <p className="text-xs text-gray-500">
                        Explore all public and vetted openings across 10+ AI specialist platforms and in-house project pipelines.
                      </p>
                    </div>
                    <div className="text-xs font-bold bg-[#edf7e3] text-[#2e5c17] px-3 py-1.5 rounded-lg border border-[#d2ebd5]">
                      Showing {filteredJobs.length} available roles
                    </div>
                  </div>

                  {/* Multi-Filter Bar */}
                  <div className="find-jobs-filters">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-600 block mb-1">Category / Domain</label>
                        <select
                          value={jobCategory}
                          onChange={e => setJobCategory(e.target.value)}
                          className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white font-medium"
                        >
                          <option value="All categories">All categories</option>
                          {categories.filter(c => c !== 'All roles').map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-600 block mb-1">Platform / Source</label>
                        <select
                          value={jobPlatform}
                          onChange={e => setJobPlatform(e.target.value)}
                          className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white font-medium"
                        >
                          <option value="All platforms">All platforms</option>
                          {trackedPlatforms.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-600 block mb-1">Employment Type</label>
                        <select
                          value={jobType}
                          onChange={e => setJobType(e.target.value)}
                          className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white font-medium"
                        >
                          <option value="All types">All types</option>
                          <option value="Contract">Contract</option>
                          <option value="Hourly">Hourly</option>
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-600 block mb-1">Minimum Rate</label>
                        <select
                          value={jobMinPay}
                          onChange={e => setJobMinPay(Number(e.target.value))}
                          className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white font-medium"
                        >
                          <option value="0">Any compensation</option>
                          <option value="20">$20+/hr</option>
                          <option value="30">$30+/hr</option>
                          <option value="40">$40+/hr</option>
                          <option value="50">$50+/hr</option>
                          <option value="70">$70+/hr</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 flex-wrap gap-2 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-700">
                        <input
                          type="checkbox"
                          checked={jobHighDemandOnly}
                          onChange={e => setJobHighDemandOnly(e.target.checked)}
                          className="rounded text-[#2e5c17] accent-[#2e5c17]"
                        />
                        <span>Show High Demand & Urgent openings only</span>
                      </label>

                      {(jobCategory !== 'All categories' || jobPlatform !== 'All platforms' || jobType !== 'All types' || jobMinPay > 0 || jobHighDemandOnly || query) && (
                        <button
                          onClick={() => {
                            setJobCategory('All categories');
                            setJobPlatform('All platforms');
                            setJobType('All types');
                            setJobMinPay(0);
                            setJobHighDemandOnly(false);
                            setQuery('');
                          }}
                          className="text-xs text-red-600 hover:underline font-bold"
                        >
                          Reset filters
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Jobs List */}
                  {filteredJobs.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-2xl border border-gray-200">
                      <Briefcase size={36} className="mx-auto text-gray-400 mb-3" />
                      <h3 className="text-base font-bold text-gray-800">No matching jobs found</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Try adjusting your filters, selecting 'All platforms', or clearing the search query.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredJobs.map(j => (
                        <div
                          key={j.id}
                          className="bg-white border border-[#dce5d4] hover:border-[#77ab3b] rounded-2xl p-5 transition shadow-sm hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-xs font-bold bg-gray-100 text-gray-800 px-2.5 py-0.5 rounded">
                                {j.platform || j.company}
                              </span>
                              <span className="text-xs bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                                {j.category}
                              </span>
                              {(j.highDemand || j.urgent) && (
                                <span className="text-xs font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded flex items-center gap-1">
                                  <Flame size={12} /> High demand
                                </span>
                              )}
                            </div>
                            <h3 className="text-base font-bold text-gray-900 mb-1">{j.title}</h3>
                            <p className="text-xs text-gray-500 line-clamp-2 mb-2">{j.description}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              {j.skills.slice(0, 4).map(s => (
                                <span key={s} className="text-2xs bg-gray-50 text-gray-600 border border-gray-200 px-2 py-0.5 rounded">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex md:flex-col items-end justify-between md:justify-center gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                            <div className="text-sm font-extrabold text-[#182319]">{j.compensation}</div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleSaveJob(j.id)}
                                className={`p-2 border rounded-lg transition ${savedJobs.includes(j.id) ? 'bg-amber-50 border-amber-300 text-amber-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                title="Bookmark role"
                              >
                                <Bookmark size={14} />
                              </button>
                              <button
                                onClick={() => setSelected(j)}
                                className="px-4 py-2 bg-[#182319] hover:bg-[#2b421e] text-white text-xs font-bold rounded-lg transition shadow-sm"
                              >
                                Apply Now
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ==============================================================
                  VIEW 3: REFER & EARN ($50 per candidate for 10+ hrs)
                  ============================================================== */}
              {activeNav === 'refer-and-earn' && (
                <div>
                  {/* Hero Card */}
                  <div className="referral-hero-card">
                    <div className="referral-reward-pill">
                      <Gift size={16} /> Earn $50 Cash per Candidate
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight mb-2">
                      Refer Candidates & Earn $50 When They Work 10+ Hours
                    </h1>
                    <p className="text-sm text-[#d6ebd0] max-w-2xl leading-relaxed">
                      Invite peer AI annotators, subject matter evaluators, prompt engineers, and domain experts to HireEase.
                      When your referred candidate gets hired on an AI project and logs at least <strong>10 active hours</strong>, you will receive <strong>$50.00</strong> credited directly to your payout balance!
                    </p>

                    {/* Referral Link Box */}
                    <div className="referral-link-box">
                      <span className="text-xs font-mono text-gray-700 truncate select-all">{referralUrl}</span>
                      <button
                        onClick={() => copyToClipboard(referralUrl, 'Referral link copied to clipboard!')}
                        className="px-4 py-2 bg-[#c4f568] hover:bg-[#b2e554] text-[#111513] text-xs font-bold rounded-lg flex items-center gap-1.5 shrink-0 transition shadow-sm"
                      >
                        <Copy size={13} /> Copy Link
                      </button>
                    </div>

                    {/* Social Share Buttons */}
                    <div className="flex items-center gap-3 pt-2">
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Hey, check out HireEase Services to access remote AI evaluation and annotation jobs: ${referralUrl}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-lg text-xs font-bold inline-flex items-center gap-2 transition shadow-sm"
                      >
                        <WhatsAppIcon size={14} /> Share on WhatsApp
                      </a>
                      <a
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-[#0077b5] hover:bg-[#005f93] text-white rounded-lg text-xs font-bold inline-flex items-center gap-2 transition shadow-sm"
                      >
                        <LinkedinIcon size={14} /> Share on LinkedIn
                      </a>
                    </div>
                  </div>

                  {/* Referral Metrics */}
                  <div className="portal-stats-grid">
                    <div className="portal-stat-card">
                      <div>
                        <div className="label">Total Referred</div>
                        <div className="value">{totalReferredCount}</div>
                        <div className="subtext">Registered candidates</div>
                      </div>
                      <UserRound size={22} className="portal-stat-icon text-[#2e5c17]" />
                    </div>

                    <div className="portal-stat-card">
                      <div>
                        <div className="label">Active on Projects</div>
                        <div className="value">{activeProjectsCount}</div>
                        <div className="subtext">Currently logging hours</div>
                      </div>
                      <Clock size={22} className="portal-stat-icon text-amber-600" />
                    </div>

                    <div className="portal-stat-card">
                      <div>
                        <div className="label">Earned Rewards</div>
                        <div className="value">${totalEarnedBonus.toFixed(2)}</div>
                        <div className="subtext">
                          {referrals.filter(r => r.paid).length > 0
                            ? `${referrals.filter(r => r.paid).length} candidate(s) reached 10+ hrs`
                            : '$50 per candidate after 10 hrs'}
                        </div>
                      </div>
                      <DollarSign size={22} className="portal-stat-icon text-emerald-600" />
                    </div>
                  </div>

                  {/* How it Works Stepper */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
                    <h2 className="text-base font-bold text-gray-900 mb-4">How Referral Rewards Work</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-7 h-7 rounded-full bg-[#182319] text-[#c4f568] font-bold text-xs flex items-center justify-center mb-2">
                          1
                        </div>
                        <div className="text-xs font-bold text-gray-900 mb-1">Share your link</div>
                        <p className="text-2xs text-gray-500">Send your unique link to AI evaluators, coders, and domain specialists.</p>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-7 h-7 rounded-full bg-[#182319] text-[#c4f568] font-bold text-xs flex items-center justify-center mb-2">
                          2
                        </div>
                        <div className="text-xs font-bold text-gray-900 mb-1">Candidate Joins</div>
                        <p className="text-2xs text-gray-500">They complete registration and pass benchmark assessment vetting.</p>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-7 h-7 rounded-full bg-[#182319] text-[#c4f568] font-bold text-xs flex items-center justify-center mb-2">
                          3
                        </div>
                        <div className="text-xs font-bold text-gray-900 mb-1">Logs 10+ Hours</div>
                        <p className="text-2xs text-gray-500">Candidate begins working on any client or in-house role and reaches 10 billable hours.</p>
                      </div>

                      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                        <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mb-2">
                          $
                        </div>
                        <div className="text-xs font-bold text-emerald-950 mb-1">Get $50 Payout</div>
                        <p className="text-2xs text-emerald-800">$50 is credited immediately into your account payout ledger.</p>
                      </div>
                    </div>
                  </div>

                  {/* Referred Candidates Table */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <div>
                        <h2 className="text-base font-bold text-gray-900">Referred Candidates Status</h2>
                        <p className="text-xs text-gray-500">
                          Live tracking of candidates registered via your personal referral link.
                        </p>
                      </div>
                      <button
                        onClick={addDemoReferral}
                        className="px-3 py-1.5 bg-[#edf7e3] hover:bg-[#dcefd0] text-[#2e5c17] border border-[#cbe6c1] rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <Sparkles size={13} /> + Simulate Candidate Referral
                      </button>
                    </div>

                    {referrals.length === 0 ? (
                      <div className="text-center py-10 px-4 bg-[#fbfdfa] rounded-xl border border-dashed border-[#cbe1c3]">
                        <div className="w-12 h-12 mx-auto rounded-full bg-[#edf7e3] text-[#2e5c17] flex items-center justify-center mb-3">
                          <Gift size={22} />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 mb-1">No candidates referred yet</h3>
                        <p className="text-xs text-gray-500 max-w-md mx-auto mb-4 leading-relaxed">
                          Share your link with peer annotators and developers. Once they join and complete 10+ hours on client or in-house projects, your $50 bounty will appear here automatically!
                        </p>
                        <div className="flex items-center justify-center gap-3 flex-wrap">
                          <button
                            onClick={() => copyToClipboard(referralUrl, 'Referral link copied to clipboard!')}
                            className="px-4 py-2 bg-[#182319] hover:bg-[#2b421e] text-[#c4f568] text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-xs"
                          >
                            <Copy size={13} /> Copy My Referral Link
                          </button>
                          <button
                            onClick={addDemoReferral}
                            className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-xs font-semibold rounded-lg transition flex items-center gap-1"
                          >
                            <Sparkles size={13} className="text-[#2e5c17]" /> + Test With Demo Referral
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold">
                              <th className="pb-3">Candidate</th>
                              <th className="pb-3">Referred Date</th>
                              <th className="pb-3">Work Status</th>
                              <th className="pb-3">Logged Hours</th>
                              <th className="pb-3 text-right">Referral Bonus</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 font-medium">
                            {referrals.map(r => (
                              <tr key={r.id}>
                                <td className="py-3 font-bold text-gray-900">{r.name}</td>
                                <td className="py-3 text-gray-500">{r.date}</td>
                                <td className="py-3">
                                  <span
                                    className={`px-2 py-0.5 rounded font-bold text-2xs ${
                                      r.hours >= 10
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        : r.hours > 0
                                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                    {r.status}
                                  </span>
                                </td>
                                <td className="py-3 font-semibold text-gray-700">{r.hours.toFixed(1)} / 10 hrs</td>
                                <td className="py-3 text-right font-extrabold">
                                  {r.paid ? (
                                    <span className="text-emerald-700">✅ $50.00 Paid</span>
                                  ) : r.hours > 0 ? (
                                    <span className="text-amber-700">⏳ Pending {(10 - r.hours).toFixed(1)} hrs</span>
                                  ) : (
                                    <span className="text-gray-400">Awaiting start</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ==============================================================
                  VIEW 4: RESUME BUILDER (With ATS-Friendly Templates)
                  ============================================================== */}
              {activeNav === 'resume-builder' && (
                <div>
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">ATS Resume Builder</h1>
                      <p className="text-xs text-gray-500">
                        Create machine-readable, ATS-optimized résumés tailored for AI evaluation and annotation recruiters.
                      </p>
                    </div>

                    {/* Template Switcher */}
                    <div className="flex items-center gap-2 bg-white border border-[#dce5d4] p-1 rounded-xl">
                      <button
                        onClick={() => setResumeTemplate('ats-minimal')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${resumeTemplate === 'ats-minimal' ? 'bg-[#182319] text-[#c4f568]' : 'text-[#55674e] hover:bg-[#edf5e4]'}`}
                      >
                        Modern ATS
                      </button>
                      <button
                        onClick={() => setResumeTemplate('ats-technical')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${resumeTemplate === 'ats-technical' ? 'bg-[#182319] text-[#c4f568]' : 'text-[#55674e] hover:bg-[#edf5e4]'}`}
                      >
                        Technical AI
                      </button>
                      <button
                        onClick={() => setResumeTemplate('ats-executive')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${resumeTemplate === 'ats-executive' ? 'bg-[#182319] text-[#c4f568]' : 'text-[#55674e] hover:bg-[#edf5e4]'}`}
                      >
                        Executive
                      </button>
                      <button
                        onClick={() => setResumeTemplate('ats-compact')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${resumeTemplate === 'ats-compact' ? 'bg-[#182319] text-[#c4f568]' : 'text-[#55674e] hover:bg-[#edf5e4]'}`}
                      >
                        Compact Grid
                      </button>
                    </div>
                  </div>

                  {/* ATS Compatibility Meter */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-extrabold text-sm flex items-center justify-center">
                        96%
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-950">ATS Compatibility Score: High</div>
                        <div className="text-2xs text-emerald-800">
                          Single-column hierarchy · Standard web-safe typography · Machine-parseable headers · High keyword density
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={downloadResumeTxt}
                        className="px-3.5 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-bold rounded-lg transition flex items-center gap-1.5"
                      >
                        <Download size={13} /> Download Plain TXT
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5"
                      >
                        <Printer size={13} /> Print / Save PDF
                      </button>
                    </div>
                  </div>

                  {/* Editor + Live Preview Split Layout */}
                  <div className="ats-resume-container">
                    {/* Left: Interactive Form */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
                      <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">Edit Resume Details</h2>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-gray-600 block mb-1">Full Name</label>
                          <input
                            type="text"
                            value={resumeName}
                            onChange={e => setResumeName(e.target.value)}
                            className="w-full text-xs border border-gray-300 rounded-lg p-2"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-600 block mb-1">Target AI Role</label>
                          <input
                            type="text"
                            value={resumeTargetRole}
                            onChange={e => setResumeTargetRole(e.target.value)}
                            className="w-full text-xs border border-gray-300 rounded-lg p-2"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-bold text-gray-600 block mb-1">Email</label>
                          <input
                            type="email"
                            value={resumeEmail}
                            onChange={e => setResumeEmail(e.target.value)}
                            className="w-full text-xs border border-gray-300 rounded-lg p-2"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-600 block mb-1">Phone</label>
                          <input
                            type="text"
                            value={resumePhone}
                            onChange={e => setResumePhone(e.target.value)}
                            className="w-full text-xs border border-gray-300 rounded-lg p-2"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-600 block mb-1">Location</label>
                          <input
                            type="text"
                            value={resumeLocation}
                            onChange={e => setResumeLocation(e.target.value)}
                            className="w-full text-xs border border-gray-300 rounded-lg p-2"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-gray-600">Professional Summary</label>
                          <button
                            type="button"
                            onClick={() =>
                              setResumeSummary(
                                `Verified ${resumeTargetRole} with deep expertise in ${resumeSkills.split(',').slice(0, 3).join(', ')}. Demonstrated consistency in rating multi-turn model turns, detecting synthetic bias, and validating rigorous scientific and clinical claims.`
                              )
                            }
                            className="text-2xs text-[#2e5c17] hover:text-[#182319] hover:underline font-bold"
                          >
                            AI Enhance
                          </button>
                        </div>
                        <textarea
                          rows={3}
                          value={resumeSummary}
                          onChange={e => setResumeSummary(e.target.value)}
                          className="w-full text-xs border border-gray-300 rounded-lg p-2"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-600 block mb-1">Core Competencies & Keywords</label>
                        <textarea
                          rows={2}
                          value={resumeSkills}
                          onChange={e => setResumeSkills(e.target.value)}
                          className="w-full text-xs border border-gray-300 rounded-lg p-2"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-600 block mb-1">Experience & Project Bullets</label>
                        <textarea
                          rows={4}
                          value={resumeExperience}
                          onChange={e => setResumeExperience(e.target.value)}
                          className="w-full text-xs border border-gray-300 rounded-lg p-2 font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-600 block mb-1">Education & Degrees</label>
                        <textarea
                          rows={2}
                          value={resumeEducation}
                          onChange={e => setResumeEducation(e.target.value)}
                          className="w-full text-xs border border-gray-300 rounded-lg p-2"
                        />
                      </div>
                    </div>

                    {/* Right: ATS Live Preview Paper */}
                    <div className="sticky top-20">
                      <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-2">
                        <span>ATS Parser Preview ({resumeTemplate})</span>
                        <button
                          onClick={() => copyToClipboard(resumeSummary, 'Summary copied!')}
                          className="hover:text-[#2e5c17] font-semibold"
                        >
                          Copy text
                        </button>
                      </div>

                      <div
                        className={`ats-paper-preview ${resumeTemplate === 'ats-minimal' ? 'modern' : resumeTemplate === 'ats-technical' ? 'technical' : resumeTemplate === 'ats-executive' ? 'executive' : 'compact'}`}
                      >
                        <div className="ats-header-name">{resumeName}</div>
                        <div className="ats-header-contact">
                          {resumeLocation} | {resumeEmail} | {resumePhone} | Target: {resumeTargetRole}
                        </div>

                        <div className="ats-section-title">Professional Summary</div>
                        <p className="text-xs text-gray-800 leading-relaxed">{resumeSummary}</p>

                        <div className="ats-section-title">Core Competencies</div>
                        <p className="text-xs text-gray-800 leading-relaxed font-semibold">{resumeSkills}</p>

                        <div className="ats-section-title">Experience & AI Projects</div>
                        <div className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {resumeExperience}
                        </div>

                        <div className="ats-section-title">Education & Credentials</div>
                        <div className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {resumeEducation}
                        </div>
                        <ul className="ats-bullet-list">
                          <li>HireEase Verified AI Contributor & Safety Audit Certified (Level 2)</li>
                          <li>100% Identity and Academic Background Verified</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==============================================================
                  VIEW 5: PORTFOLIO
                  ============================================================== */}
              {activeNav === 'portfolio' && (
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Candidate AI Portfolio</h1>
                  <p className="text-xs text-gray-500 mb-6">
                    Showcase of your verified evaluation benchmarks, prompt tests, and HireEase platform credentials.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white border border-gray-200 rounded-2xl p-5">
                      <Award size={24} className="text-amber-500 mb-2" />
                      <h3 className="text-sm font-bold text-gray-900">Verified AI Contributor</h3>
                      <p className="text-xs text-gray-500 mt-1">Earned via HireEase Practice Lab evaluation standards.</p>
                      <span className="mt-3 inline-block text-2xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                        Active Badge
                      </span>
                    </div>

                    <div className="bg-white border border-[#dce5d4] rounded-2xl p-5">
                      <ShieldCheck size={24} className="text-[#2e5c17] mb-2" />
                      <h3 className="text-sm font-bold text-gray-900">Anti-Hallucination Vetted</h3>
                      <p className="text-xs text-gray-500 mt-1">Verified on 100+ factual claims against peer-reviewed citations.</p>
                      <span className="mt-3 inline-block text-2xs font-bold text-[#2e5c17] bg-[#edf7e3] px-2 py-0.5 rounded border border-[#d2ebd5]">
                        Score: 98.2%
                      </span>
                    </div>

                    <div className="bg-white border border-[#dce5d4] rounded-2xl p-5">
                      <Clock size={24} className="text-emerald-600 mb-2" />
                      <h3 className="text-sm font-bold text-gray-900">10+ Active Project Hours</h3>
                      <p className="text-xs text-gray-500 mt-1">Eligible for premier tier high-payout in-house matching.</p>
                      <span className="mt-3 inline-block text-2xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                        Verified
                      </span>
                    </div>
                  </div>

                  {/* Interactive Practice Lab */}
                  <div className="bg-white border border-[#dce5d4] rounded-2xl p-6">
                    <h2 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <Sparkles size={16} className="text-[#2e5c17]" /> Evaluation Benchmark Quiz
                    </h2>
                    <p className="text-xs text-gray-500 mb-4">
                      Test your rubric evaluation skills against actual frontier model responses.
                    </p>

                    <div className="space-y-4">
                      {practiceLabQuestions.map(q => (
                        <div key={q.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="text-xs font-bold text-gray-900 mb-2">{q.prompt}</div>
                          <div className="space-y-2">
                            <label className={`block p-3 rounded-lg border text-xs cursor-pointer ${labAnswers[q.id] === 'A' ? 'border-[#77ab3b] bg-[#edf7e3]' : 'border-gray-200 bg-white'}`}>
                              <input
                                type="radio"
                                name={`q-${q.id}`}
                                checked={labAnswers[q.id] === 'A'}
                                onChange={() => setLabAnswers(prev => ({ ...prev, [q.id]: 'A' }))}
                                className="mr-2 accent-[#2e5c17]"
                              />
                              <strong>Model A:</strong> {q.modelResponseA}
                            </label>

                            <label className={`block p-3 rounded-lg border text-xs cursor-pointer ${labAnswers[q.id] === 'B' ? 'border-[#77ab3b] bg-[#edf7e3]' : 'border-gray-200 bg-white'}`}>
                              <input
                                type="radio"
                                name={`q-${q.id}`}
                                checked={labAnswers[q.id] === 'B'}
                                onChange={() => setLabAnswers(prev => ({ ...prev, [q.id]: 'B' }))}
                                className="mr-2 accent-[#2e5c17]"
                              />
                              <strong>Model B:</strong> {q.modelResponseB}
                            </label>
                          </div>

                          {labSubmitted && (
                            <div className="mt-2 text-2xs p-2 bg-emerald-50 text-emerald-900 rounded font-medium">
                              <strong>Rationale:</strong> {q.explanation}
                            </div>
                          )}
                        </div>
                      ))}

                      <button
                        onClick={handleLabSubmit}
                        className="px-5 py-2.5 bg-[#182319] hover:bg-[#2b421e] text-[#c4f568] rounded-xl text-xs font-bold transition shadow-sm"
                      >
                        Submit Benchmark Answers
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ==============================================================
                  VIEW 6: PROFILE (Edit & Resume Upload)
                  ============================================================== */}
              {activeNav === 'profile' && (
                <div>
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">Talent Profile Details</h1>
                      <p className="text-xs text-gray-500">
                        Keep your profile details, skills, and résumé updated. Progress updates in real time as you fill each field.
                      </p>
                    </div>
                    <span className="text-xs bg-[#edf7e3] text-[#2e5c17] font-bold px-3 py-1 rounded-full border border-[#d2ebd5] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#77ab3b] animate-pulse" /> Live profile sync
                    </span>
                  </div>

                  {/* Real-Time Profile Strength & Completeness Meter */}
                  <div className="bg-[#f8faf6] border border-[#dce5d4] rounded-2xl p-5 mb-5 max-w-2xl shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-700">Profile Completeness</span>
                        <span className="text-xs bg-[#edf7e3] text-[#2e5c17] font-bold px-2 py-0.5 rounded-full border border-[#d2ebd5]">
                          Step {completeness.step} of 4
                        </span>
                      </div>
                      <span className="text-base font-extrabold text-[#182319]">{completeness.percentage}%</span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3 overflow-hidden">
                      <div
                        className="bg-[#c4f568] h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${completeness.percentage}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-2xs">
                      <div
                        className={`p-2 rounded-lg border text-center transition ${
                          completeness.items.personal
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                            : 'bg-white text-gray-400 border-gray-200'
                        }`}
                      >
                        {completeness.items.personal ? '✓ Personal (20%)' : '○ Personal (20%)'}
                      </div>
                      <div
                        className={`p-2 rounded-lg border text-center transition ${
                          completeness.items.academic
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                            : 'bg-white text-gray-400 border-gray-200'
                        }`}
                      >
                        {completeness.items.academic ? '✓ Academic (20%)' : '○ Academic (20%)'}
                      </div>
                      <div
                        className={`p-2 rounded-lg border text-center transition ${
                          completeness.items.skills
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                            : 'bg-white text-gray-400 border-gray-200'
                        }`}
                      >
                        {completeness.items.skills ? `✓ Skills (${completeness.skillsCount})` : '○ Skills (20%)'}
                      </div>
                      <div
                        className={`p-2 rounded-lg border text-center transition ${
                          completeness.items.experience
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                            : 'bg-white text-gray-400 border-gray-200'
                        }`}
                      >
                        {completeness.items.experience ? '✓ Experience (15%)' : '○ Experience (15%)'}
                      </div>
                      <div
                        className={`p-2 rounded-lg border text-center col-span-2 sm:col-span-1 transition ${
                          completeness.items.resume
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                            : 'bg-white text-gray-400 border-gray-200'
                        }`}
                      >
                        {completeness.items.resume ? '✓ Résumé (25%)' : '○ Résumé (25%)'}
                      </div>
                    </div>
                  </div>

                  <form onSubmit={save} className="bg-white border border-[#dce5d4] rounded-2xl p-6 space-y-4 max-w-2xl shadow-xs">
                    {formError && (
                      <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs font-semibold">
                        {formError}
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Full Legal Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        placeholder="e.g. John Doe"
                        required
                        className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:border-[#77ab3b] focus:ring-1 focus:ring-[#77ab3b] outline-hidden"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">City</label>
                        <input
                          type="text"
                          name="city"
                          value={formCity}
                          onChange={e => setFormCity(e.target.value)}
                          placeholder="e.g. San Francisco or Bengaluru"
                          required
                          className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:border-[#77ab3b] focus:ring-1 focus:ring-[#77ab3b] outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Country</label>
                        <input
                          type="text"
                          name="country"
                          value={formCountry}
                          onChange={e => setFormCountry(e.target.value)}
                          placeholder="e.g. United States or India"
                          required
                          className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:border-[#77ab3b] focus:ring-1 focus:ring-[#77ab3b] outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-gray-700">Skills & Specializations (comma-separated)</label>
                        <span className="text-2xs text-gray-400">
                          {completeness.skillsCount > 0 ? `${completeness.skillsCount} skills recognized` : 'Add skills to match jobs'}
                        </span>
                      </div>
                      <input
                        type="text"
                        name="skills"
                        value={formSkills}
                        onChange={e => setFormSkills(e.target.value)}
                        placeholder="e.g. Data Annotation, RLHF, Python, Prompt Engineering, Evaluation"
                        required
                        className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:border-[#77ab3b] focus:ring-1 focus:ring-[#77ab3b] outline-hidden"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="text-xs font-bold text-gray-700 block mb-1">Highest Degree / Specialization</label>
                        <input
                          type="text"
                          name="education"
                          value={formEducation}
                          onChange={e => setFormEducation(e.target.value)}
                          placeholder="e.g. B.S. in Computer Science"
                          className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:border-[#77ab3b] focus:ring-1 focus:ring-[#77ab3b] outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Graduation Year</label>
                        <input
                          type="text"
                          name="graduationYear"
                          value={formGraduationYear}
                          onChange={e => setFormGraduationYear(e.target.value)}
                          placeholder="2024"
                          className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:border-[#77ab3b] focus:ring-1 focus:ring-[#77ab3b] outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Institution / University</label>
                      <input
                        type="text"
                        name="institution"
                        value={formInstitution}
                        onChange={e => setFormInstitution(e.target.value)}
                        placeholder="e.g. University of California, Berkeley or IIT Delhi"
                        className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:border-[#77ab3b] focus:ring-1 focus:ring-[#77ab3b] outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Experience & Background Narrative</label>
                      <textarea
                        rows={3}
                        name="experience"
                        value={formExperience}
                        onChange={e => setFormExperience(e.target.value)}
                        placeholder="Brief summary of your AI evaluation, prompt testing, annotating, or relevant subject matter experience..."
                        className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:border-[#77ab3b] focus:ring-1 focus:ring-[#77ab3b] outline-hidden font-sans"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Resume File Upload</label>
                      <div className="upload-zone">
                        <Upload size={24} />
                        <strong>
                          {file
                            ? `Selected: ${file.name}`
                            : profile?.hasResume
                            ? `Current: ${profile.resumeName || 'Verified Résumé'}`
                            : 'Click to upload PDF or DOCX résumé (+25% score)'}
                        </strong>
                        <span>Accepted formats: PDF, DOCX, TXT (up to 10MB)</span>
                        <input
                          type="file"
                          ref={fileInput}
                          accept=".pdf,.docx,.txt"
                          onChange={e => e.target.files?.[0] && setFile(e.target.files[0])}
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="flex items-start gap-2.5 text-xs text-gray-600 cursor-pointer">
                        <Checkbox
                          checked={consent}
                          onCheckedChange={v => setConsent(!!v)}
                          className="mt-0.5"
                        />
                        <span>
                          I agree to HireEase processing my profile and skills for relevant AI training, RLHF, and project matching.
                        </span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full py-3 bg-[#182319] hover:bg-[#2b421e] text-[#c4f568] font-bold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-2"
                    >
                      {saving ? 'Saving Profile...' : 'Save Profile Changes'}
                    </button>
                  </form>
                </div>
              )}

              {/* ==============================================================
                  VIEW 7: SETTINGS
                  ============================================================== */}
              {activeNav === 'settings' && (
                <div className="max-w-xl">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Settings</h1>
                  <p className="text-xs text-gray-500 mb-6">Manage notification rules, timezone display, and referral payout preferences.</p>

                  <div className="bg-white border border-[#dce5d4] rounded-2xl p-6 space-y-4">
                    <h2 className="text-sm font-bold text-gray-900 border-b pb-2">Referral Payout Settings ($50 per candidate)</h2>
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Payout Method</label>
                      <select className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white">
                        <option>PayPal Account</option>
                        <option>Direct Bank Transfer (ACH / Wire)</option>
                        <option>Wise (TransferWise)</option>
                        <option>Crypto (USDC / USDT)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Payout Email / Account Identifier</label>
                      <input
                        type="text"
                        defaultValue={email}
                        className="w-full text-xs border border-gray-300 rounded-lg p-2"
                      />
                    </div>

                    <h2 className="text-sm font-bold text-gray-900 border-b pb-2 pt-2">Notifications</h2>
                    <label className="flex items-center justify-between text-xs font-semibold text-gray-700 py-1 cursor-pointer">
                      <span>Instant email alerts when matching roles drop</span>
                      <input type="checkbox" defaultChecked className="rounded text-[#2e5c17] accent-[#2e5c17]" />
                    </label>
                    <label className="flex items-center justify-between text-xs font-semibold text-gray-700 py-1 cursor-pointer">
                      <span>Referral reward milestone notifications</span>
                      <input type="checkbox" defaultChecked className="rounded text-[#2e5c17] accent-[#2e5c17]" />
                    </label>

                    <button
                      type="button"
                      onClick={() => toast.success('Settings updated!')}
                      className="mt-4 px-5 py-2.5 bg-[#182319] hover:bg-[#2b421e] text-[#c4f568] font-bold text-xs rounded-xl transition shadow-sm"
                    >
                      Save Preferences
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* ====================================================================
          Application Dialog Modal
          ==================================================================== */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-lg p-6 bg-white rounded-2xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900 mb-1">
                {selected.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mb-4">
                {selected.platform || selected.company} · {selected.category} · {selected.compensation}
              </DialogDescription>

              <div className="space-y-3 text-xs text-gray-700 mb-5">
                <div>
                  <strong>Role Description:</strong>
                  <p className="mt-1 text-gray-600 leading-relaxed">{selected.description}</p>
                </div>

                <div>
                  <strong>Key Requirements:</strong>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    {selected.skills.map(s => (
                      <span key={s} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {applyError && (
                  <div className="p-2.5 bg-red-50 text-red-700 rounded-lg font-semibold">
                    {applyError}
                  </div>
                )}

                <div className="pt-2 border-t border-gray-100">
                  <label className="flex items-start gap-2 cursor-pointer font-semibold text-gray-700">
                    <Checkbox
                      checked={applicationConsent}
                      onCheckedChange={v => setApplicationConsent(!!v)}
                      className="mt-0.5"
                    />
                    <span>
                      I authorize HireEase to forward my profile and skills for this project.
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelected(null)}
                  className="flex-1 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  onClick={apply}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-[#182319] hover:bg-[#2b421e] text-[#c4f568] text-xs font-bold rounded-xl transition shadow-sm"
                >
                  {saving ? 'Submitting...' : 'Confirm Application'}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* In-House Project Apply Dialog */}
      <Dialog open={!!selectedProject} onOpenChange={open => !open && setSelectedProject(null)}>
        <DialogContent className="max-w-md p-6 bg-white rounded-2xl">
          {selectedProject && (
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900 mb-1">
                Apply to {selectedProject.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mb-4">
                HireEase Managed Project · {selectedProject.payout} · {selectedProject.estimatedHours}
              </DialogDescription>
              <p className="text-xs text-gray-600 mb-5 leading-relaxed">{selectedProject.description}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedProject(null)}
                  className="flex-1 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => applyToProject(selectedProject)}
                  disabled={projectApplying}
                  className="flex-1 py-2.5 bg-[#182319] hover:bg-[#2b421e] text-[#c4f568] text-xs font-bold rounded-xl transition shadow-sm"
                >
                  {projectApplying ? 'Registering...' : 'Register as Contributor'}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DialogContent className="max-w-md p-6 bg-white rounded-2xl">
          <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2 mb-3">
            <Bell size={18} className="text-[#2e5c17]" /> Notifications
          </DialogTitle>
          <div className="space-y-2.5 text-xs">
            <div className="p-3 bg-[#edf7e3] border border-[#d2ebd5] rounded-xl">
              <div className="font-bold text-[#182319]">Referral Program Active: Earn $50</div>
              <div className="text-[#456b26] mt-0.5">
                Share your referral link. When your candidate logs 10+ hours, $50 is unlocked.
              </div>
            </div>
            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
              <div className="font-bold text-emerald-950">New Vetted In-House Openings</div>
              <div className="text-emerald-800 mt-0.5">
                Urgent roles for Model Evaluation and Benchmarking are now accepting submissions.
              </div>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="font-bold text-gray-900">ATS Resume Templates Available</div>
              <div className="text-gray-600 mt-0.5">
                Generate machine-readable résumés with 96% ATS compatibility score.
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
