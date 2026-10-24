"use client";

import { useEffect, useState, useMemo } from 'react';
import {
  Sparkles,
  Search,
  Menu,
  X,
  MapPin,
  Briefcase,
  CheckCircle2,
  SlidersHorizontal,
  Stethoscope,
  Scale,
  TrendingUp,
  Languages,
  Code2,
  Atom,
  Share2,
  Bookmark,
  ArrowRight,
  Clock,
  ShieldCheck,
  ChevronDown,
  Flame,
  Zap,
  Bell,
  FileText,
  UserCheck,
  Laptop,
  Globe,
  Pause,
  Play
} from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Toaster, toast } from 'sonner';
import {
  trackedPlatforms,
  categories,
  expertiseProfiles,
  internalProjects,
  type Job
} from '@/lib/jobs';

export function LinkedinIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
    </svg>
  );
}

export function WhatsAppIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.19-.09-1.11-.55-1.28-.61-.17-.07-.3-.09-.43.1-.12.19-.48.61-.59.73-.11.12-.22.14-.4.05-.19-.09-.79-.29-1.5-.93-.55-.49-.93-1.1-1.04-1.28-.11-.19-.01-.29.08-.38.08-.08.19-.22.28-.33.09-.11.12-.19.19-.31.06-.12.03-.24-.02-.33-.04-.09-.43-1.03-.59-1.41-.15-.37-.31-.32-.43-.33h-.37c-.12 0-.33.05-.5.24-.18.19-.68.66-.68 1.62 0 .96.7 1.88.8 2.01.09.12 1.37 2.09 3.32 2.93.46.2.83.32 1.11.41.47.15.89.13 1.23.08.37-.06 1.11-.45 1.27-.89.15-.43.15-.81.11-.89-.04-.08-.17-.13-.36-.22z"/>
    </svg>
  );
}

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <a href="/" className={'brand ' + (light ? 'light' : '')} aria-label="HireEase Talent Network home">
      <span className="brand-mark">
        h<span />
      </span>
      <span>
        HireEase<span className="brand-sub">TALENT NETWORK</span>
      </span>
    </a>
  );
}

export default function Home() {
  const [menu, setMenu] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All roles');
  const [platform, setPlatform] = useState('all');
  const [filterDemand, setFilterDemand] = useState(false);
  const [filterUrgent, setFilterUrgent] = useState(false);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  // Clean initial jobs feed: start empty so only roles created in admin panel appear
  const [jobs, setJobs] = useState<Job[]>([]);
  const [detail, setDetail] = useState<Job | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  // Moving platform ticker control
  const [tickerPaused, setTickerPaused] = useState(false);
  const [allPlatformsModalOpen, setAllPlatformsModalOpen] = useState(false);

  // Talent pool interactive accordion state (Image 2)
  const [activeDomain, setActiveDomain] = useState('finance');
  const [talentPoolModalOpen, setTalentPoolModalOpen] = useState(false);
  const [talentPoolEmail, setTalentPoolEmail] = useState('');
  const [talentPoolDomain, setTalentPoolDomain] = useState('Finance');
  const [talentPoolSubmitted, setTalentPoolSubmitted] = useState(false);

  // Waitlist form state
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistFeatures, setWaitlistFeatures] = useState<string[]>([
    'AI Mock Interview',
    'AI Resume Builder'
  ]);
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  // Job alert subscription modal state
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertEmail, setAlertEmail] = useState('');
  const [alertCategory, setAlertCategory] = useState('Healthcare');
  const [alertSubmitted, setAlertSubmitted] = useState(false);

  // FAQ open/close accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetch('/api/jobs')
      .then(async r => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((d: any) => {
        if (d && Array.isArray(d.jobs)) {
          // Live roles from database only
          setJobs(d.jobs);
        }
      })
      .catch(() => setUnavailable(true));
  }, []);

  const visible = useMemo(() => {
    return jobs.filter(j => {
      const matchCategory = category === 'All roles' || j.category === category;
      const matchPlatform =
        platform === 'all' ||
        (j.platform && j.platform.toLowerCase() === platform.toLowerCase()) ||
        (j.company && j.company.toLowerCase().includes(platform.toLowerCase()));
      const matchQuery =
        !query ||
        `${j.title} ${j.company} ${j.category} ${j.description} ${j.skills.join(' ')}`
          .toLowerCase()
          .includes(query.toLowerCase());
      const matchDemand = !filterDemand || j.highDemand;
      const matchUrgent = !filterUrgent || j.urgent;

      return matchCategory && matchPlatform && matchQuery && matchDemand && matchUrgent;
    });
  }, [jobs, query, category, platform, filterDemand, filterUrgent]);

  const toggleSaveJob = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (savedJobs.includes(id)) {
      setSavedJobs(savedJobs.filter(j => j !== id));
      toast.info('Removed from saved roles');
    } else {
      setSavedJobs([...savedJobs, id]);
      toast.success('Saved to your bookmarked roles');
    }
  };

  const shareJob = (j: Job, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/dashboard?role=${encodeURIComponent(j.id)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success('Job link copied to clipboard!');
    }
  };

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail) {
      toast.error('Please enter your email address.');
      return;
    }
    if (waitlistFeatures.length === 0) {
      toast.error('Pick at least one feature to join the waitlist.');
      return;
    }
    setWaitlistSubmitted(true);
    toast.success("You're on the early access list! We will notify you when features launch.");
  };

  const handleAlertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertEmail) {
      toast.error('Enter an email address to receive job alerts.');
      return;
    }
    setAlertSubmitted(true);
    toast.success(`Job alerts activated for ${alertCategory} roles!`);
    setTimeout(() => {
      setAlertModalOpen(false);
      setAlertSubmitted(false);
      setAlertEmail('');
    }, 1500);
  };

  const faqs = [
    {
      q: 'What is AI training work and what do contributors actually do?',
      a: 'AI training involves evaluating model-generated answers, verifying facts, ranking competing completions (RLHF), writing gold-standard reference responses, and auditing clinical or legal reasoning. Subject matter experts (such as physicians, lawyers, and coders) ensure frontier AI outputs are accurate, safe, and helpful.'
    },
    {
      q: 'How much do these roles pay, and how do I receive payment?',
      a: 'Pay rates typically range from $18/hr for general data annotation up to $70 - $130/hr for verified domain specialists (such as medical reviewers, contract lawyers, and senior software engineers). Most roles pay in US Dollars directly to your PayPal, Wise, or bank account on weekly or bi-weekly cycles.'
    },
    {
      q: 'Is this work fully remote and can I work flexible hours?',
      a: 'Yes! The vast majority of roles in our feed are 100% remote and offer self-scheduled, flexible hours. You can work from anywhere with a reliable computer and internet connection.'
    },
    {
      q: 'Is HireEase Talent Network completely free for candidates?',
      a: 'Yes, 100% free, always. We never charge candidates to search, apply, take assessments, or get hired. Be aware of scams: any entity demanding upfront payment or application fees is fraudulent.'
    },
    {
      q: 'What is the difference between platform roles and in-house projects?',
      a: 'Platform roles are curated from top partner platforms (Scale AI, Outlier, Alignerr, Turing, etc.) where you apply directly with our match insights. In-house projects are direct contracts managed by HireEase where you work directly on our client assignments with guaranteed rates and streamlined weekly dispatch.'
    }
  ];


  const getPlatformLogo = (name: string) => {
    switch (name) {
      case 'Labelbox':
        return (
          <div className="partner-logo-box labelbox">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/labelbox.svg" alt="Labelbox" className="platform-svg-img" style={{ height: '24px', width: 'auto' }} />
          </div>
        );
      case 'micro1.':
        return (
          <div className="partner-logo-box micro1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/micro1.svg" alt="micro1." style={{ height: '22px', width: 'auto', objectFit: 'contain' }} />
          </div>
        );
      case 'MERCOR':
        return (
          <div className="partner-logo-box mercor">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/mercor.svg" alt="Mercor" className="platform-svg-img" style={{ height: '24px', width: 'auto', objectFit: 'contain' }} />
          </div>
        );
      case 'xAI':
        return (
          <div className="partner-logo-box xai">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/xai.svg" alt="xAI" style={{ height: '22px', width: 'auto', objectFit: 'contain' }} />
          </div>
        );
      case 'Alignerr':
        return (
          <div className="partner-logo-box alignerr">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/alignerr.png" alt="Alignerr" className="platform-svg-icon" style={{ height: '24px', width: '24px', objectFit: 'contain' }} />
            <span className="partner-logo-text alignerr-text" style={{ fontSize: '16px', fontWeight: 700 }}>Alignerr</span>
          </div>
        );
      case 'Anthropic':
        return (
          <div className="partner-logo-box anthropic">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/anthropic.svg" alt="Anthropic" style={{ height: '26px', width: 'auto', objectFit: 'contain' }} />
          </div>
        );
      case 'Scale AI':
        return (
          <div className="partner-logo-box scale-ai">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/scaleai.svg" alt="Scale AI" style={{ height: '20px', width: 'auto', objectFit: 'contain' }} />
          </div>
        );
      case 'ElevenLabs':
        return (
          <div className="partner-logo-box elevenlabs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/ElevenLabs.svg" alt="ElevenLabs" style={{ height: '20px', width: 'auto', objectFit: 'contain' }} />
          </div>
        );
      case 'Turing':
        return (
          <div className="partner-logo-box turing">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/turing.svg" alt="Turing" className="platform-svg-img" style={{ height: '24px', width: 'auto', objectFit: 'contain' }} />
          </div>
        );
      case 'Invisible Tech':
        return (
          <div className="partner-logo-box invisible-tech">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/invisible.svg" alt="Invisible Tech" className="platform-svg-icon" style={{ height: '20px', width: 'auto' }} />
            <span className="partner-logo-text" style={{ fontSize: '15px', fontWeight: 700 }}>Invisible Tech</span>
          </div>
        );
      case 'Outlier':
        return (
          <div className="partner-logo-box outlier">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/outlier.svg" alt="Outlier" className="platform-svg-img" style={{ height: '22px', width: 'auto', objectFit: 'contain' }} />
          </div>
        );
      case 'DataAnnotation.tech':
        return (
          <div className="partner-logo-box data-annotation">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/dataannotation.svg" alt="DataAnnotation" className="platform-svg-img" style={{ height: '24px', width: 'auto', objectFit: 'contain' }} />
          </div>
        );
      case 'Mindrift':
        return (
          <div className="partner-logo-box mindrift">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/mindrift.svg" alt="Mindrift" className="platform-svg-img" style={{ height: '22px', width: 'auto', objectFit: 'contain' }} />
          </div>
        );
      case 'Harvey AI':
        return (
          <div className="partner-logo-box harvey-ai">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/harvey.svg" alt="Harvey AI" className="platform-svg-icon" style={{ height: '20px', width: 'auto', objectFit: 'contain' }} />
            <span className="partner-logo-text harvey-text" style={{ fontSize: '16px', fontWeight: 700 }}>Harvey AI</span>
          </div>
        );
      default:
        return <span>{name}</span>;
    }
  };

  const handleTalentPoolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!talentPoolEmail) {
      toast.error('Please enter your email to join the talent pool.');
      return;
    }
    setTalentPoolSubmitted(true);
    toast.success(`Welcome to the HireEase Talent Pool for ${talentPoolDomain}!`);
    setTimeout(() => {
      setTalentPoolModalOpen(false);
      setTalentPoolSubmitted(false);
      setTalentPoolEmail('');
    }, 1600);
  };

  return (
    <>
      {mounted && <Toaster richColors position="top-right" />}

      {/* Candidate Charge Notice & Community Banner */}
      <div className="candidate-protection-banner">
        <div className="wrap flex items-center justify-between text-xs py-2 gap-4 flex-wrap">
          <span className="flex items-center gap-2">
            <ShieldCheck size={15} className="text-emerald-700 shrink-0" />
            <span>
              <strong>100% Free for Candidates:</strong> Never pay fees to apply or work. We protect candidate rights worldwide.
            </span>
          </span>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <a
              href="https://chat.whatsapp.com/Jkb7Uip2sPYK6OLIrR8pFM"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-emerald-800 hover:underline"
              title="Join WhatsApp Community"
            >
              <WhatsAppIcon size={14} /> WhatsApp Community
            </a>
            <span className="text-gray-300">|</span>
            <a
              href="https://www.linkedin.com/company/hireease-services/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-blue-700 hover:underline"
              title="Follow on LinkedIn"
            >
              <LinkedinIcon size={14} /> Follow on LinkedIn
            </a>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="site-header">
        <div className="nav-wrap">
          <Brand />
          <nav className={menu ? 'open' : ''} aria-label="Main navigation">
            {[
              ['Find Roles', '#opportunities'],
              ['Expertise Fields', '#fields'],
              ['Platforms We Track', '#platforms'],
              ['Features & Tools', '#features'],
              ['In-House Projects', '#internal-projects'],
              ['How It Works', '#how-it-works'],
              ['FAQ', '#faq']
            ].map(([title, link]) => (
              <a key={link} href={link} onClick={() => setMenu(false)}>
                {title}
              </a>
            ))}
          </nav>
          <div className="nav-actions">
            <a className="login-link font-medium" href="/auth?mode=signin">
              Log in
            </a>
            <a className="btn green font-bold shadow-sm" href="/auth?mode=signup">
              Join free
            </a>
          </div>
          <button
            className="menu-btn"
            aria-label={menu ? 'Close menu' : 'Open menu'}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Modal Overlay (Image 3) */}
      {menu && (
        <div className="mobile-nav-modal-backdrop" onClick={() => setMenu(false)}>
          <div className="mobile-nav-modal-card" onClick={e => e.stopPropagation()}>
            <div className="mobile-nav-header">
              <Brand />
              <button
                className="mobile-nav-close-btn"
                aria-label="Close navigation"
                onClick={() => setMenu(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="mobile-nav-list">
              <a href="/" className="mobile-nav-item active" onClick={() => setMenu(false)}>
                Home
              </a>
              <a href="#opportunities" className="mobile-nav-item" onClick={() => setMenu(false)}>
                Find Jobs
              </a>
              <a href="#how-it-works" className="mobile-nav-item" onClick={() => setMenu(false)}>
                How it works
              </a>
              <a href="#features" className="mobile-nav-item" onClick={() => setMenu(false)}>
                Refer &amp; Earn
              </a>
              <a href="mailto:support@hireeaseservices.com" className="mobile-nav-item" onClick={() => setMenu(false)}>
                Contact
              </a>
              <a href="#faq" className="mobile-nav-item" onClick={() => setMenu(false)}>
                FAQ
              </a>
            </div>

            <div className="mobile-nav-divider" />

            <a href="/dashboard" className="mobile-nav-dashboard-btn" onClick={() => setMenu(false)}>
              Dashboard
            </a>

            <div className="mobile-nav-communities">
              <a
                href="https://chat.whatsapp.com/Jkb7Uip2sPYK6OLIrR8pFM"
                target="_blank"
                rel="noopener noreferrer"
                className="mobile-nav-community-link whatsapp"
              >
                <WhatsAppIcon size={16} /> 📢 Join Our WhatsApp Community
              </a>
              <a
                href="https://www.linkedin.com/company/hireease-services/"
                target="_blank"
                rel="noopener noreferrer"
                className="mobile-nav-community-link linkedin"
              >
                <LinkedinIcon size={16} /> 🔗 Follow Us on LinkedIn
              </a>
            </div>
          </div>
        </div>
      )}

      <main>
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-content">
            <span className="eyebrow hero-eyebrow">
              <Sparkles size={14} /> REMOTE AI TRAINING WORK · ALL PLATFORMS IN ONE FEED
            </span>
            <h1>
              Stop hunting for AI training jobs.<br />
              <span>Let them find you.</span>
            </h1>
            <p className="hero-subtext">
              One free feed of remote AI training roles from top AI and human data platforms,
              matched to your skills. Plus instant job alerts, an AI resume builder, and direct access
              to paid in-house client projects.
            </p>

            {/* Quick Hero Search & Filter */}
            <form
              className="hero-search-box"
              onSubmit={e => {
                e.preventDefault();
                document.getElementById('opportunities')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <div className="search-input-wrap">
                <Search size={18} className="search-icon" />
                <input
                  aria-label="Search by expertise or skill"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Your expertise, e.g. Nursing, Python, Legal, Hindi..."
                />
              </div>

              <select
                aria-label="Select field"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="hero-category-select"
              >
                {categories.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <button type="submit" className="btn green font-bold">
                Find roles
              </button>
            </form>

            {/* Category quick pills */}
            <div className="hero-quick-pills">
              <span className="quick-label">Browse by field:</span>
              {[
                'Healthcare',
                'Legal',
                'Finance',
                'Languages',
                'Coding',
                'Science',
                'Data Annotation & RLHF'
              ].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCategory(c);
                    document.getElementById('opportunities')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`quick-pill ${category === c ? 'active' : ''}`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Live Stats Ticker */}
            <div className="hero-stats-ticker">
              <div className="stat-card">
                <span className="stat-num text-emerald-400">500+</span>
                <span className="stat-label">Open roles right now</span>
              </div>
              <div className="stat-card">
                <span className="stat-num text-emerald-400">10+</span>
                <span className="stat-label">AI platforms tracked</span>
              </div>
              <div className="stat-card">
                <span className="stat-num text-emerald-400">90+</span>
                <span className="stat-label">Countries eligible</span>
              </div>
              <div className="stat-card">
                <span className="stat-num text-emerald-400">$18 - $120/hr</span>
                <span className="stat-label">Average pay range (USD)</span>
              </div>
            </div>
          </div>

          {/* Right-side Ambient Telemetry Decor for Wide Displays */}
          <div className="hero-telemetry-decor" aria-hidden="true">
            <div className="telemetry-radar">
              <svg viewBox="0 0 440 440" fill="none" className="telemetry-svg">
                <circle cx="220" cy="220" r="190" stroke="rgba(196, 245, 104, 0.12)" strokeWidth="1" />
                <circle cx="220" cy="220" r="130" stroke="rgba(196, 245, 104, 0.16)" strokeWidth="1" strokeDasharray="5 7" />
                <circle cx="220" cy="220" r="70" stroke="rgba(196, 245, 104, 0.22)" strokeWidth="1" />
                <line x1="30" y1="220" x2="410" y2="220" stroke="rgba(196, 245, 104, 0.08)" />
                <line x1="220" y1="30" x2="220" y2="410" stroke="rgba(196, 245, 104, 0.08)" />
                <circle cx="220" cy="90" r="6" fill="#c4f568" />
                <circle cx="330" cy="150" r="5" fill="#77ab3b" />
                <circle cx="310" cy="310" r="7" fill="#c4f568" />
                <circle cx="130" cy="290" r="5" fill="#a3e635" />
                <circle cx="110" cy="160" r="6" fill="#77ab3b" />
                <circle cx="220" cy="220" r="9" fill="#c4f568" />
              </svg>
            </div>
            <div className="telemetry-badge-card top-badge">
              <span className="telemetry-status-dot" />
              <div>
                <strong>Global AI Ingestion Feed</strong>
                <span>12 Platforms Synced</span>
              </div>
            </div>
            <div className="telemetry-badge-card bottom-badge">
              <span className="telemetry-status-dot" />
              <div>
                <strong>Zero Candidate Fee Policy</strong>
                <span>100% Free Verification</span>
              </div>
            </div>
          </div>
        </section>

        {/* Platforms We Track (Moving Ticker - Image 1) */}
        <section className="platform-directory-wrap" id="platforms">
          <div className="platform-directory-header">
            <span className="platform-directory-eyebrow">
              PLATFORM DIRECTORY
            </span>
            <h2 className="platform-directory-title">The places where AI work gets posted</h2>
            <p className="platform-directory-subtext">
              We track public roles across specialist platforms and AI company career pages, then bring the openings into one feed.
            </p>
          </div>

          <div className="platform-ticker-container">
            <div className={`platform-ticker-track ${tickerPaused ? 'paused' : ''}`}>
              {[...trackedPlatforms, ...trackedPlatforms].map((p, idx) => (
                <button
                  key={`${p}-${idx}`}
                  onClick={() => {
                    setPlatform(p);
                    document.getElementById('opportunities')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="platform-ticker-pill"
                  title={`Filter roles from ${p}`}
                >
                  {getPlatformLogo(p)}
                </button>
              ))}
            </div>
          </div>

          <div className="platform-ticker-footer">
            <button
              onClick={() => setAllPlatformsModalOpen(true)}
              className="platform-view-all-link"
            >
              View all platforms <ArrowRight size={15} />
            </button>
            <button
              onClick={() => setTickerPaused(!tickerPaused)}
              className="platform-pause-btn"
              aria-label={tickerPaused ? 'Resume moving platforms' : 'Pause moving platforms'}
              title={tickerPaused ? 'Resume moving platforms' : 'Pause moving platforms'}
            >
              {tickerPaused ? <Play size={15} /> : <Pause size={15} />}
            </button>
          </div>
        </section>

        {/* Live Job Feed (Find Roles) */}
        <section className="opportunities-section" id="opportunities">
          <div className="wrap">
            <div className="section-heading-split">
              <div>
                <span className="eyebrow">UPDATED DAILY</span>
                <h2>AI Training Roles in One Feed</h2>
                <p>Explore remote annotation, RLHF, and subject matter expert openings.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAlertModalOpen(true)}
                  className="btn outline-green text-xs font-semibold flex items-center gap-2"
                >
                  <Bell size={15} /> Set job alert
                </button>
                <a href="/dashboard" className="btn green text-xs font-semibold flex items-center gap-2">
                  <Sparkles size={15} /> Match your skills
                </a>
              </div>
            </div>

            {/* Filter Controls Bar */}
            <div className="feed-filters-bar">
              <div className="search-filter-input">
                <Search size={16} />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Filter by title, skill, or keyword..."
                />
                {query && (
                  <button onClick={() => setQuery('')} className="text-xs text-gray-500 hover:text-black">
                    Clear
                  </button>
                )}
              </div>

              <div className="category-scroll-pills">
                {categories.map(c => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`category-pill ${category === c ? 'active' : ''}`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-md px-2.5 h-9">
                  <SlidersHorizontal size={14} className="text-gray-500 shrink-0" />
                  <select
                    value={platform}
                    onChange={e => setPlatform(e.target.value)}
                    className="bg-transparent text-xs text-gray-800 outline-none cursor-pointer pr-2 font-medium"
                  >
                    <option value="all">All platforms</option>
                    {trackedPlatforms.map(p => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setFilterDemand(!filterDemand)}
                  className={`filter-toggle-pill ${filterDemand ? 'active' : ''}`}
                >
                  <Flame size={13} /> High demand
                </button>

                <button
                  type="button"
                  onClick={() => setFilterUrgent(!filterUrgent)}
                  className={`filter-toggle-pill ${filterUrgent ? 'active' : ''}`}
                >
                  <Zap size={13} /> Urgent
                </button>
              </div>
            </div>

            {/* Meta bar */}
            <div className="results-meta-bar">
              <span>
                <strong>{visible.length}</strong> roles matching your criteria
              </span>
              {(category !== 'All roles' || platform !== 'all' || query || filterDemand || filterUrgent) && (
                <button
                  onClick={() => {
                    setCategory('All roles');
                    setPlatform('all');
                    setQuery('');
                    setFilterDemand(false);
                    setFilterUrgent(false);
                  }}
                  className="reset-filters-btn"
                >
                  Reset all filters
                </button>
              )}
            </div>

            {unavailable && (
              <p className="notice" role="status">
                Live openings are updating. Displaying verified active roles from our catalog.
              </p>
            )}

            {/* Job Grid */}
            <div className="jobs-cards-grid">
              {visible.map(j => {
                const isSaved = savedJobs.includes(j.id);
                return (
                  <article key={j.id} className="stn-job-card">
                    <div className="card-top-row">
                      <span className="platform-tag">
                        <span className="dot" />
                        {j.platform || j.company}
                      </span>
                      <div className="card-badge-group">
                        {j.urgent && (
                          <span className="badge-urgent">
                            <Zap size={11} /> Urgent
                          </span>
                        )}
                        {j.highDemand && (
                          <span className="badge-demand">
                            <Flame size={11} /> High demand
                          </span>
                        )}
                        <span className="badge-remote">Remote</span>
                      </div>
                    </div>

                    <h3 className="job-title-heading">
                      <button onClick={() => setDetail(j)} className="text-left hover:text-emerald-800">
                        {j.title}
                      </button>
                    </h3>

                    <div className="job-comp-line">
                      <span className="comp-amount">{j.payRate || j.compensation}</span>
                      <span className="location-meta">
                        <MapPin size={13} /> {j.location}
                      </span>
                    </div>

                    <p className="job-snippet">{j.description}</p>

                    {/* Match reason highlight */}
                    <div className="match-reason-box">
                      <span className="label">Why you:</span> Matches skills in{' '}
                      <strong>{j.skills.slice(0, 2).join(' & ')}</strong>
                    </div>

                    <div className="job-skills-row">
                      {j.skills.slice(0, 4).map(s => (
                        <span key={s} className="skill-chip">
                          {s}
                        </span>
                      ))}
                    </div>

                    <div className="card-bottom-actions">
                      <button onClick={() => setDetail(j)} className="btn-details">
                        View role
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={e => shareJob(j, e)}
                          title="Share role link"
                          className="icon-action-btn"
                        >
                          <Share2 size={15} />
                        </button>
                        <button
                          onClick={e => toggleSaveJob(j.id, e)}
                          title={isSaved ? 'Remove bookmark' : 'Bookmark role'}
                          className={`icon-action-btn ${isSaved ? 'saved' : ''}`}
                        >
                          <Bookmark size={15} />
                        </button>
                        <a
                          href={`/dashboard?role=${encodeURIComponent(j.id)}`}
                          className="btn-apply-primary"
                        >
                          Apply now
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {jobs.length === 0 ? (
              <div className="clean-feed-box">
                <div className="clean-feed-icon">
                  <Briefcase size={28} />
                </div>
                <h3>Clean Feed · Ready for Verified Openings</h3>
                <p>
                  No roles are currently posted. All positions on HireEase are added directly by verified recruiters.
                  Join our Talent Pool or WhatsApp community to get alerted the instant matching roles go live.
                </p>
                <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
                  <button onClick={() => setTalentPoolModalOpen(true)} className="btn-join-talent-pool">
                    Join Our Talent Pool <ArrowRight size={15} />
                  </button>
                  <a
                    href="https://chat.whatsapp.com/Jkb7Uip2sPYK6OLIrR8pFM"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-community-whatsapp"
                  >
                    <WhatsAppIcon size={15} /> Join WhatsApp Group
                  </a>
                </div>
              </div>
            ) : visible.length === 0 ? (
              <div className="empty-state-box">
                <Search size={32} className="mx-auto text-emerald-700 mb-3" />
                <h3>No roles match these filters</h3>
                <p>Try clearing your search query or switching to another expertise category.</p>
                <button
                  className="btn green mt-3"
                  onClick={() => {
                    setCategory('All roles');
                    setPlatform('all');
                    setQuery('');
                    setFilterDemand(false);
                    setFilterUrgent(false);
                  }}
                >
                  Reset filters
                </button>
              </div>
            ) : null}
          </div>
        </section>

        {/* Interactive Talent Pool Stack (Image 2) */}
        <section className="talent-stack-section" id="fields">
          <div className="section-header-compact text-center">
            <span className="platform-directory-eyebrow">
              BUILT FOR REAL CAREERS
            </span>
            <h2 className="platform-directory-title">Who we&apos;re looking for</h2>
            <p className="platform-directory-subtext" style={{ margin: '0 auto' }}>
              Frontier AI models require domain accuracy that general web text cannot provide. We
              recruit verified specialists across seven core disciplines.
            </p>
          </div>

          <div className="talent-stack-container">
            {expertiseProfiles.map(p => {
              const isActive = activeDomain === p.id;
              if (isActive) {
                return (
                  <div
                    key={p.id}
                    className="talent-stack-card active"
                    style={{ backgroundImage: `url(${p.bgImage})` }}
                  >
                    <div className="talent-stack-overlay">
                      <div className="talent-stack-active-content">
                        <h3 className="talent-stack-active-title">{p.name}</h3>
                        <p className="talent-stack-active-sub">{p.roles}</p>
                        <button
                          onClick={() => {
                            setCategory(p.id === 'annotation' ? 'Data Annotation & RLHF' : p.name);
                            document.getElementById('opportunities')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="btn-explore-domain"
                        >
                          Explore roles
                          <span className="btn-explore-domain-arrow">
                            <ArrowRight size={13} />
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={p.id}
                  className="talent-stack-card inactive"
                  style={{ backgroundImage: `url(${p.bgImage})` }}
                  onClick={() => setActiveDomain(p.id)}
                >
                  <div className="talent-stack-overlay">
                    <span className="talent-stack-inactive-title">{p.name}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <button
              onClick={() => setTalentPoolModalOpen(true)}
              className="btn-join-talent-pool-big"
            >
              Join Our Talent Pool
              <span className="btn-join-arrow-circle">
                <ArrowRight size={15} />
              </span>
            </button>
          </div>
        </section>

        {/* Official Community Channels (WhatsApp & LinkedIn) */}
        <section className="community-section" id="community">
          <div className="wrap">
            <div className="section-header-compact text-center">
              <span className="eyebrow uppercase tracking-widest text-emerald-800">
                OFFICIAL COMMUNITY
              </span>
              <h2>Join 15,000+ AI Trainers & Specialists</h2>
              <p>
                Get instant job drop notifications, real-time assessment leaks and guidelines, and direct peer networking.
              </p>
            </div>

            <div className="community-grid">
              <div className="community-card">
                <div>
                  <span className="community-badge whatsapp">
                    <WhatsAppIcon size={14} /> WhatsApp Community
                  </span>
                  <h3>📢 Join Our WhatsApp Community</h3>
                  <p>
                    Get instant alerts when high-paying AI annotation and RLHF roles drop, assessment interview prep, prompt tips, and direct contractor discussions.
                  </p>
                </div>
                <a
                  href="https://chat.whatsapp.com/Jkb7Uip2sPYK6OLIrR8pFM"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-community-action whatsapp"
                >
                  <WhatsAppIcon size={18} /> Join WhatsApp Community
                </a>
              </div>

              <div className="community-card">
                <div>
                  <span className="community-badge linkedin">
                    <LinkedinIcon size={14} /> LinkedIn Company
                  </span>
                  <h3>🔗 Follow Us on LinkedIn</h3>
                  <p>
                    Stay updated on enterprise AI industry benchmarks, client project rollouts, remote work guidelines, and verified company announcements.
                  </p>
                </div>
                <a
                  href="https://www.linkedin.com/company/hireease-services/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-community-action linkedin"
                >
                  <LinkedinIcon size={18} /> Follow on LinkedIn
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Talent Infrastructure Features Suite */}
        <section className="features-suite-section" id="features">
          <div className="wrap">
            <div className="section-header-compact text-center">
              <span className="eyebrow uppercase tracking-widest text-emerald-700">
                TALENT INFRASTRUCTURE FOR AI TRAINING WORK
              </span>
              <h2>Find the work. Get ready. Get hired. Keep growing.</h2>
              <p>Everything you need to succeed in the high-growth AI training economy.</p>
            </div>

            <div className="features-grid-3">
              <div className="feature-block-card">
                <div className="feat-icon-bubble">
                  <Briefcase size={22} />
                </div>
                <h3>One feed, matched to your skills</h3>
                <p>
                  Stop checking a dozen platforms every morning. We gather openings from Scale AI,
                  Outlier, Alignerr, and more, filtering out noise so you see only relevant roles.
                </p>
                <div className="feat-chip-row">
                  <span>Daily updates</span>
                  <span>Direct apply links</span>
                </div>
              </div>

              <div className="feature-block-card">
                <div className="feat-icon-bubble">
                  <Bell size={22} />
                </div>
                <h3>Job alerts that come to you</h3>
                <p>
                  High-paying roles fill quickly. Set your domain preferences and minimum hourly pay
                  threshold to receive instant email notifications the moment matching roles land.
                </p>
                <div className="feat-chip-row">
                  <span>Custom pay filters</span>
                  <span>Instant alerts</span>
                </div>
              </div>

              <div className="feature-block-card">
                <div className="feat-icon-bubble">
                  <FileText size={22} />
                </div>
                <h3>AI resume builder</h3>
                <p>
                  Turn your existing work background into a concise resume formatted specifically for AI
                  training, RLHF rater, and subject matter evaluation positions.
                </p>
                <div className="feat-chip-row">
                  <span>ATS-optimized</span>
                  <span>AI-trainer format</span>
                </div>
              </div>

              <div className="feature-block-card">
                <div className="feat-icon-bubble">
                  <Globe size={22} />
                </div>
                <h3>Your own portfolio page</h3>
                <p>
                  Create a public showcase demonstrating your validated skills, language fluencies,
                  and completed evaluation benchmarks with a shareable URL.
                </p>
                <div className="feat-chip-row">
                  <span>Shareable link</span>
                  <span>Skill badges</span>
                </div>
              </div>

              <div className="feature-block-card">
                <div className="feat-icon-bubble">
                  <UserCheck size={22} />
                </div>
                <h3>A path to in-house client projects</h3>
                <p>
                  Pass a brief skills screening to unlock exclusive projects operated directly by
                  HireEase. Enjoy guaranteed rates, direct client feedback, and prompt weekly payouts.
                </p>
                <div className="feat-chip-row">
                  <span>Guaranteed rates</span>
                  <span>Weekly payouts</span>
                </div>
              </div>

              <div className="feature-block-card">
                <div className="feat-icon-bubble">
                  <Laptop size={22} />
                </div>
                <h3>Practice lab & mock interviews</h3>
                <p>
                  Prepare for platform screening assessments with our interactive practice quizzes
                  covering prompt evaluation, hallucination detection, and RLHF guidelines.
                </p>
                <div className="feat-chip-row">
                  <span>Instant feedback</span>
                  <span>Benchmark tests</span>
                </div>
              </div>
            </div>

            {/* Interactive Waitlist Form for Upcoming Features */}
            <div className="waitlist-card-box">
              <div className="waitlist-header">
                <span className="eyebrow uppercase text-emerald-800">BE FIRST IN LINE</span>
                <h3>Join the early access waitlist for upcoming features</h3>
                <p>Pick the tools you want to try first. We will notify you as soon as they open.</p>
              </div>

              {waitlistSubmitted ? (
                <div className="waitlist-success-banner">
                  <CheckCircle2 size={24} className="text-emerald-700" />
                  <div>
                    <strong>You&apos;re on the early access list!</strong>
                    <p>We&apos;ll email you the moment your selected features go live. No spam, ever.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleWaitlistSubmit} className="waitlist-form">
                  <div className="features-checkbox-grid">
                    {[
                      'AI Mock Interview',
                      'Skill Gap Analyzer',
                      'Custom Portfolio Domain (yourname.com)',
                      'Automated 1-Click Apply Agent'
                    ].map(feat => {
                      const checked = waitlistFeatures.includes(feat);
                      return (
                        <label key={feat} className="checkbox-item-label">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={e => {
                              if (e.target.checked) setWaitlistFeatures([...waitlistFeatures, feat]);
                              else setWaitlistFeatures(waitlistFeatures.filter(f => f !== feat));
                            }}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span>{feat}</span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="waitlist-input-group">
                    <input
                      type="email"
                      required
                      placeholder="Enter your email address"
                      value={waitlistEmail}
                      onChange={e => setWaitlistEmail(e.target.value)}
                    />
                    <button type="submit" className="btn green font-bold">
                      Join waitlist
                    </button>
                  </div>
                  <span className="text-[11px] text-gray-500 text-center block mt-2">
                    One email when each feature launches. Unsubscribe anytime.
                  </span>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* In-House Projects Section */}
        <section className="internal-projects-section wrap" id="internal-projects">
          <div className="section-header-compact text-center">
            <span className="eyebrow uppercase tracking-widest text-emerald-800">
              DIRECT CLIENT CONTRACTS
            </span>
            <h2>Paid In-House Projects</h2>
            <p>
              Exclusive assignments run directly through HireEase. Pass our short skills screening to
              receive dispatch requests with verified weekly payments.
            </p>
          </div>

          <div className="internal-projects-grid">
            {internalProjects.map(proj => (
              <div key={proj.id} className="inhouse-project-card">
                <div className="proj-top-meta">
                  <span className="proj-client-tag">{proj.client}</span>
                  <span className="proj-payout-badge">{proj.payout}</span>
                </div>
                <h3>{proj.title}</h3>
                <p className="proj-desc">{proj.description}</p>
                <div className="proj-details-row">
                  <span>
                    <Clock size={13} /> {proj.estimatedHours}
                  </span>
                  <span>
                    <Briefcase size={13} /> {proj.duration}
                  </span>
                </div>
                <div className="proj-skills-tags">
                  {proj.requiredSkills.map(s => (
                    <span key={s}>{s}</span>
                  ))}
                </div>
                <a
                  href={`/dashboard?project=${encodeURIComponent(proj.id)}`}
                  className="btn green w-full font-bold text-xs mt-3 flex items-center justify-center gap-2"
                >
                  Apply to project <ArrowRight size={13} />
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="how-it-works-section wrap" id="how-it-works">
          <div className="section-header-compact text-center">
            <span className="eyebrow uppercase tracking-widest text-emerald-800">
              YOUR NEXT CHAPTER
            </span>
            <h2>How it works</h2>
            <p>From potential to paid AI contributor in three straightforward steps.</p>
          </div>

          <div className="how-steps-grid">
            <div className="step-card">
              <div className="step-num-pill">01</div>
              <h3>Join the network</h3>
              <p>
                Create your free profile. Share your education, professional expertise, and language
                fluencies. Upload your résumé once.
              </p>
            </div>

            <div className="step-card">
              <div className="step-num-pill">02</div>
              <h3>Get vetted and matched</h3>
              <p>
                Take a quick 5-minute practice assessment to showcase your attention to detail. Our
                system curates matching roles across 10+ platforms.
              </p>
            </div>

            <div className="step-card">
              <div className="step-num-pill">03</div>
              <h3>Work and get paid</h3>
              <p>
                Apply with one click or direct vetted links. Work flexible hours on contracts or
                internal client assignments and receive prompt USD payouts.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="faq-section wrap" id="faq">
          <div className="section-header-compact text-center">
            <span className="eyebrow uppercase tracking-widest text-emerald-800">GOT QUESTIONS?</span>
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about remote AI training work and our network.</p>
          </div>

          <div className="faq-accordion-container">
            {faqs.map((item, i) => (
              <div key={i} className="faq-accordion-item">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="faq-question-btn"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    size={18}
                    className={`faq-chevron ${openFaq === i ? 'open' : ''}`}
                  />
                </button>
                {openFaq === i && <div className="faq-answer-panel">{item.a}</div>}
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="bottom-cta-banner wrap">
          <div className="cta-inner">
            <div className="cta-text">
              <span className="eyebrow text-emerald-800 uppercase tracking-widest">
                JOIN 10,000+ AI CONTRIBUTORS
              </span>
              <h2>Your expertise is in high demand.</h2>
              <p>
                Create your free profile today, explore curated roles across 10+ platforms, and unlock
                direct client project opportunities.
              </p>
            </div>
            <div className="cta-button-group">
              <a href="/auth?mode=signup" className="btn btn-dark-cta font-bold text-sm">
                Create free profile
              </a>
              <a href="#opportunities" className="btn btn-outline-dark-cta font-bold text-sm">
                Browse roles
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="stn-footer">
        <div className="wrap footer-grid">
          <div className="footer-brand-col">
            <Brand light />
            <p className="footer-tagline">
              Connecting human intelligence with the future of artificial intelligence. Free job board
              and talent network for AI training, annotation, and subject matter evaluation.
            </p>
            <div className="candidate-free-pill">
              <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
              <span>100% Free for candidates · Anti-scam guaranteed</span>
            </div>
          </div>

          <div className="footer-links-col">
            <h4>Browse by Field</h4>
            <ul>
              <li>
                <a href="#opportunities" onClick={() => setCategory('Healthcare')}>
                  Healthcare AI Roles
                </a>
              </li>
              <li>
                <a href="#opportunities" onClick={() => setCategory('Legal')}>
                  Legal AI Roles
                </a>
              </li>
              <li>
                <a href="#opportunities" onClick={() => setCategory('Finance')}>
                  Finance AI Roles
                </a>
              </li>
              <li>
                <a href="#opportunities" onClick={() => setCategory('Languages')}>
                  Languages & Translation
                </a>
              </li>
              <li>
                <a href="#opportunities" onClick={() => setCategory('Coding')}>
                  Coding & Software AI
                </a>
              </li>
              <li>
                <a href="#opportunities" onClick={() => setCategory('Science')}>
                  STEM & Scientific Proofs
                </a>
              </li>
              <li>
                <a href="#opportunities" onClick={() => setCategory('Data Annotation & RLHF')}>
                  Data Annotation & RLHF
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4>For Talent</h4>
            <ul>
              <li>
                <a href="/auth?mode=signup">Join Talent Network</a>
              </li>
              <li>
                <a href="/dashboard">Candidate Dashboard</a>
              </li>
              <li>
                <a href="#features">AI Resume Builder</a>
              </li>
              <li>
                <a href="#internal-projects">In-House Projects</a>
              </li>
              <li>
                <button
                  onClick={() => setAlertModalOpen(true)}
                  className="text-left text-gray-400 hover:text-white"
                >
                  Job Alert Subscription
                </button>
              </li>
              <li>
                <a href="/auth?mode=signin">Candidate Sign In</a>
              </li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4>Platforms Tracked</h4>
            <ul>
              <li>
                <a href="#opportunities" onClick={() => setPlatform('Scale AI')}>
                  Scale AI
                </a>
              </li>
              <li>
                <a href="#opportunities" onClick={() => setPlatform('Outlier')}>
                  Outlier
                </a>
              </li>
              <li>
                <a href="#opportunities" onClick={() => setPlatform('Alignerr')}>
                  Alignerr
                </a>
              </li>
              <li>
                <a href="#opportunities" onClick={() => setPlatform('Turing')}>
                  Turing
                </a>
              </li>
              <li>
                <a href="#opportunities" onClick={() => setPlatform('Invisible Tech')}>
                  Invisible Technologies
                </a>
              </li>
              <li>
                <a href="#opportunities" onClick={() => setPlatform('DataAnnotation.tech')}>
                  DataAnnotation.tech
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="wrap footer-bottom-bar">
          <span>© {new Date().getFullYear()} HireEase Talent Network. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#faq" className="hover:text-emerald-400">
              FAQ
            </a>
            <a href="/auth?mode=signin" className="hover:text-emerald-400">
              Sign in
            </a>
            <a href="#opportunities" className="hover:text-emerald-400">
              Browse roles
            </a>
          </div>
        </div>
      </footer>

      {/* Role Details Sheet & Job Alert Modal (Client-only interactive overlays) */}
      {mounted && (
        <>
          <Sheet open={!!detail} onOpenChange={o => !o && setDetail(null)}>
            <SheetContent className="role-sheet-modern">
              {detail && (
                <>
                  <div className="sheet-top-meta">
                    <span className="platform-pill">{detail.platform || detail.company}</span>
                    <span className="remote-pill">Remote</span>
                  </div>

                  <SheetTitle className="sheet-role-title">{detail.title}</SheetTitle>
                  <SheetDescription className="sheet-role-desc">{detail.description}</SheetDescription>

                  <div className="sheet-info-cards">
                    <div className="info-mini-card">
                      <span className="label">Estimated Compensation</span>
                      <strong>{detail.payRate || detail.compensation}</strong>
                    </div>
                    <div className="info-mini-card">
                      <span className="label">Location Scope</span>
                      <strong>{detail.location}</strong>
                    </div>
                    <div className="info-mini-card">
                      <span className="label">Employment Type</span>
                      <strong>{detail.type}</strong>
                    </div>
                  </div>

                  <div className="sheet-content-block">
                    <h4>Responsibilities</h4>
                    <ul className="sheet-bullet-list">
                      {detail.responsibilities.map(r => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="sheet-content-block">
                    <h4>Required Skills</h4>
                    <div className="skill-tags">
                      {detail.skills.map(s => (
                        <span key={s}>{s}</span>
                      ))}
                    </div>
                  </div>

                  <div className="sheet-content-block">
                    <h4>Requirements & Experience</h4>
                    <p className="text-sm text-gray-700">{detail.experience}</p>
                  </div>

                  <div className="sheet-action-row">
                    <a
                      className="btn green w-full font-bold py-3 text-center"
                      href={`/dashboard?role=${encodeURIComponent(detail.id)}`}
                    >
                      Apply with HireEase Profile
                    </a>
                  </div>
                </>
              )}
            </SheetContent>
          </Sheet>

          {/* Job Alert Subscription Modal */}
          <Dialog open={alertModalOpen} onOpenChange={setAlertModalOpen}>
            <DialogContent className="max-w-md p-6 bg-white rounded-xl">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Bell className="text-emerald-600" size={20} /> Instant Job Alerts
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Never miss high-demand openings. Get an email notification as soon as new roles in your
                field are posted.
              </DialogDescription>

              {alertSubmitted ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm">
                  <CheckCircle2 size={20} className="mb-2 text-emerald-600" />
                  <strong>Alert subscription active!</strong> We will email you when new {alertCategory}{' '}
                  roles appear.
                </div>
              ) : (
                <form onSubmit={handleAlertSubmit} className="space-y-4 mt-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Field of Interest
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-md p-2 text-sm"
                      value={alertCategory}
                      onChange={e => setAlertCategory(e.target.value)}
                    >
                      {categories
                        .filter(c => c !== 'All roles')
                        .map(c => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Your Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      className="w-full border border-gray-300 rounded-md p-2 text-sm"
                      value={alertEmail}
                      onChange={e => setAlertEmail(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn green w-full font-bold">
                    Subscribe to alerts
                  </button>
                </form>
              )}
            </DialogContent>
          </Dialog>

          {/* All Platforms Directory Modal (Image 1 "View all platforms") */}
          <Dialog open={allPlatformsModalOpen} onOpenChange={setAllPlatformsModalOpen}>
            <DialogContent className="max-w-2xl p-6 bg-white rounded-2xl max-h-[85vh] overflow-y-auto">
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-emerald-950">
                <Globe size={22} className="text-emerald-700" /> Platform Directory ({trackedPlatforms.length} Tracked)
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                We track remote AI trainer, RLHF rater, and specialist openings across leading AI and data providers daily.
              </DialogDescription>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {trackedPlatforms.map(p => (
                  <div
                    key={p}
                    className="p-3.5 border border-gray-200 rounded-xl hover:border-emerald-600 hover:bg-emerald-50/40 transition flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="shrink-0 scale-90 origin-left">
                        {getPlatformLogo(p)}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setPlatform(p);
                        setAllPlatformsModalOpen(false);
                        document.getElementById('opportunities')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-xs bg-white border border-gray-300 hover:border-emerald-700 hover:text-emerald-800 px-3 py-1.5 rounded-md font-bold shrink-0 transition"
                    >
                      Filter Feed
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setAllPlatformsModalOpen(false)}
                  className="btn outline text-xs px-4 py-2"
                >
                  Close
                </button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Join Talent Pool Modal (Image 2) */}
          <Dialog open={talentPoolModalOpen} onOpenChange={setTalentPoolModalOpen}>
            <DialogContent className="max-w-md p-6 bg-white rounded-2xl">
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-emerald-950">
                <Sparkles size={20} className="text-emerald-700" /> Join Our Talent Pool
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Get early priority dispatch when high-paying AI annotation, prompt evaluation, and subject matter expert contracts launch.
              </DialogDescription>

              {talentPoolSubmitted ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm mt-3">
                  <CheckCircle2 size={22} className="mb-2 text-emerald-600" />
                  <strong>You are on the priority talent list!</strong> We will reach out as soon as verified roles matching {talentPoolDomain} open.
                </div>
              ) : (
                <form onSubmit={handleTalentPoolSubmit} className="space-y-4 mt-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Primary Domain of Expertise
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      value={talentPoolDomain}
                      onChange={e => setTalentPoolDomain(e.target.value)}
                    >
                      {expertiseProfiles.map(p => (
                        <option key={p.id} value={p.name}>
                          {p.name} ({p.roles})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="you@domain.com"
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      value={talentPoolEmail}
                      onChange={e => setTalentPoolEmail(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn green w-full font-bold py-3 rounded-lg text-sm shadow-md transition"
                  >
                    Join Talent Pool Free
                  </button>
                </form>
              )}

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>Already have an account?</span>
                <a href="/auth?mode=signin" className="text-emerald-800 font-semibold hover:underline">
                  Sign In
                </a>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  );
}
