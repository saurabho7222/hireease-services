"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  MapPin,
  Clock,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Bookmark,
  Share2,
  Flame,
  Calendar,
  Layers,
  Award,
  Sparkles,
  Info
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Toaster, toast } from 'sonner';
import { Brand } from '@/app/home';
import { getCompanyLogo, getCompanyDisplayName, type Job } from '@/lib/jobs';

export default function JobDetailClient({ initialJob }: { initialJob?: Job | null }) {
  const [job, setJob] = useState<Job | null>(initialJob || null);
  const [loading, setLoading] = useState(!initialJob);
  const [saved, setSaved] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string } | null>(null);

  // Redirection Modal State
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isSubmittingTracking, setIsSubmittingTracking] = useState(false);
  const [targetRedirectUrl, setTargetRedirectUrl] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [showGuestForm, setShowGuestForm] = useState(false);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check saved state
    if (job) {
      try {
        const savedList: string[] = JSON.parse(localStorage.getItem('hireease_saved_jobs') || '[]');
        setSaved(savedList.includes(job.id));
      } catch {}
    }

    // Check user session
    fetch('/api/auth/me')
      .then(r => (r.ok ? r.json() : null))
      .then((d: any) => {
        if (d?.user) setCurrentUser(d.user);
      })
      .catch(() => {});
  }, [job]);

  const toggleSave = () => {
    if (!job) return;
    try {
      const savedList: string[] = JSON.parse(localStorage.getItem('hireease_saved_jobs') || '[]');
      let updated: string[];
      if (savedList.includes(job.id)) {
        updated = savedList.filter(id => id !== job.id);
        toast.info('Role removed from saved bookmarks');
        setSaved(false);
      } else {
        updated = [...savedList, job.id];
        toast.success('Role saved to your profile bookmarks');
        setSaved(true);
      }
      localStorage.setItem('hireease_saved_jobs', JSON.stringify(updated));
    } catch {}
  };

  const shareLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Job link copied to clipboard!');
    }
  };

  const initiateApplication = async () => {
    if (!job) return;
    const referralUrl = job.externalUrl || `https://refer.micro1.ai/referral/jobs?referralCode=a462a1ef-5825-41db-8422-83628df889fc`;
    setTargetRedirectUrl(referralUrl);
    setCountdown(3);

    if (currentUser) {
      setIsSubmittingTracking(true);
      setTrackingModalOpen(true);
      try {
        const res = await fetch('/api/applications/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: job.id, externalUrl: referralUrl })
        });
        const data: any = await res.json();
        if (data.externalUrl) {
          setTargetRedirectUrl(data.externalUrl);
        }
      } catch (err) {
        console.error('Tracking recording error:', err);
      } finally {
        setIsSubmittingTracking(false);
        startCountdown(referralUrl);
      }
    } else {
      setTrackingModalOpen(true);
    }
  };

  const startCountdown = (url: string) => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    let secondsLeft = 3;
    countdownTimerRef.current = setInterval(() => {
      secondsLeft -= 1;
      setCountdown(secondsLeft);
      if (secondsLeft <= 0) {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        window.open(url, '_blank', 'noopener,noreferrer');
        setTrackingModalOpen(false);
      }
    }, 1000);
  };

  const handleGuestSubmitAndRedirect = async () => {
    if (!guestEmail.trim()) {
      toast.error('Please enter your email to track your application.');
      return;
    }
    setIsSubmittingTracking(true);
    try {
      const res = await fetch('/api/applications/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job?.id,
          externalUrl: targetRedirectUrl,
          guestEmail: guestEmail.trim(),
          guestName: guestName.trim()
        })
      });
      const data: any = await res.json();
      const finalUrl = data.externalUrl || targetRedirectUrl;
      setTargetRedirectUrl(finalUrl);
      toast.success('Application recorded on HireEase Services!');
      startCountdown(finalUrl);
    } catch {
      startCountdown(targetRedirectUrl);
    } finally {
      setIsSubmittingTracking(false);
    }
  };

  const handleDirectRedirectNow = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    window.open(targetRedirectUrl, '_blank', 'noopener,noreferrer');
    setTrackingModalOpen(false);
  };

  if (!job) {
    return (
      <div className="min-h-screen bg-[#fcfdfc] flex flex-col justify-center items-center p-6 text-center">
        <Briefcase size={40} className="text-gray-400 mb-3" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Job Opening Not Found</h2>
        <p className="text-sm text-gray-500 mb-5">This position may have been filled or the URL is incorrect.</p>
        <Link href="/jobs" className="px-5 py-2.5 bg-[#182319] text-[#c4f568] text-xs font-bold rounded-xl">
          ← Back to All Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfdfc] text-[#182319] flex flex-col font-sans">
      <Toaster position="top-right" richColors />

      {/* Navigation Header */}
      <header className="main-header border-b border-[#e2ece0] bg-white/95 backdrop-blur-md sticky top-0 z-40">
        <div className="wrap flex items-center justify-between py-3.5 px-4 sm:px-6">
          <Brand />
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-gray-700">
            <Link href="/" className="hover:text-[#2e5c17] transition">
              Home
            </Link>
            <Link href="/jobs" className="text-[#2e5c17] font-bold">
              All Jobs
            </Link>
            <Link href="/dashboard" className="hover:text-[#2e5c17] transition flex items-center gap-1">
              <Sparkles size={14} className="text-[#2e5c17]" /> Candidate Portal
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/jobs"
              className="text-xs font-bold text-gray-600 hover:text-black flex items-center gap-1 transition"
            >
              <ArrowLeft size={14} /> Back to Openings
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Wrap */}
      <main className="wrap max-w-5xl mx-auto py-8 sm:py-12 px-4 sm:px-6 flex-1">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-6 flex-wrap">
          <Link href="/" className="hover:text-black">Home</Link>
          <span>/</span>
          <Link href="/jobs" className="hover:text-black">Jobs</Link>
          <span>/</span>
          <span className="text-gray-800 font-bold line-clamp-1">{job.title}</span>
        </div>

        {/* Hero Role Card */}
        <div className="bg-white border border-[#dce5d4] rounded-2xl p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              {/* Badges & Company Logo */}
              <div className="flex items-center gap-3.5 mb-4 flex-wrap">
                <div className="w-12 h-12 rounded-xl bg-white border border-[#dce5d4] p-2 flex items-center justify-center shrink-0 shadow-2xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getCompanyLogo(job.company || job.platform)}
                    alt={job.company || 'Company'}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-extrabold text-[#182319]">
                      {getCompanyDisplayName(job.company || job.platform)}
                    </span>
                    <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-md">
                      {job.category}
                    </span>
                    {(job.highDemand || job.urgent) && (
                      <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                        <Flame size={12} /> High Demand
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium">Verified Partner Platform</span>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#182319] tracking-tight mb-3 leading-tight">
                {job.title}
              </h1>

              {/* Meta details */}
              <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-600 flex-wrap">
                <div className="flex items-center gap-1.5 font-bold text-[#182319] bg-[#edf7e3] px-2.5 py-1 rounded-lg border border-[#cbe8c3]">
                  {job.compensation}
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <MapPin size={14} />
                  <span>{job.location || 'Remote (Worldwide)'}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Clock size={14} />
                  <span>{job.type || 'Contract'}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Calendar size={14} />
                  <span>Posted {new Date(job.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0 w-full sm:w-auto md:w-56">
              <button
                onClick={initiateApplication}
                className="w-full py-3.5 bg-[#182319] hover:bg-[#2b421e] text-[#c4f568] font-extrabold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2"
              >
                <span>Apply Now</span>
                <ExternalLink size={16} />
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSave}
                  className={`flex-1 py-2.5 px-3 border rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    saved
                      ? 'bg-amber-50 border-amber-300 text-amber-700'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Bookmark size={14} />
                  <span>{saved ? 'Saved' : 'Bookmark'}</span>
                </button>
                <button
                  onClick={shareLink}
                  className="flex-1 py-2.5 px-3 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-700 transition flex items-center justify-center gap-1.5"
                >
                  <Share2 size={14} />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main JD Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Complete Job Description */}
            <section className="bg-white border border-[#dce5d4] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                <Briefcase size={18} className="text-[#2e5c17]" /> Complete Job Description
              </h2>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line space-y-3">
                {job.description}
              </div>
            </section>

            {/* Scope of Work & Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <section className="bg-white border border-[#dce5d4] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-[#2e5c17]" /> Key Responsibilities & Scope
                </h2>
                <ul className="space-y-2.5 text-sm text-gray-700">
                  {job.responsibilities.map((r, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="text-[#2e5c17] font-bold mt-0.5">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Experience & Requirements */}
            {job.experience && (
              <section className="bg-white border border-[#dce5d4] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                  <Award size={18} className="text-[#2e5c17]" /> Qualifications & Experience
                </h2>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {job.experience}
                </p>
              </section>
            )}

            {/* Required Skills */}
            {job.skills && job.skills.length > 0 && (
              <section className="bg-white border border-[#dce5d4] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                  <Layers size={18} className="text-[#2e5c17]" /> Required Technical & Domain Skills
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  {job.skills.map(s => (
                    <span
                      key={s}
                      className="text-xs font-semibold bg-[#edf7e3] text-[#204712] border border-[#d2ebd5] px-3 py-1.5 rounded-xl"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Partner Network Transparency */}
            <div className="p-5 bg-[#fafcfa] border border-[#dce5d4] rounded-2xl flex items-start gap-3.5 text-xs text-gray-600">
              <ShieldCheck size={20} className="text-[#2e5c17] shrink-0 mt-0.5" />
              <div>
                <strong className="text-gray-900 block mb-1">HireEase Services Placement Guarantee</strong>
                <span>
                  This remote contract opening is managed through our verified talent partner network ({job.company || 'micro1'}). When you click Apply Now, your candidate application is automatically tracked in our database so our recruiters can assist with assessment prep and interview support.
                </span>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Opportunity Summary Card */}
            <div className="bg-white border border-[#dce5d4] rounded-2xl p-6 shadow-xs space-y-4 sticky top-20">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-400">
                ROLE SUMMARY
              </h3>

              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-gray-500 block mb-0.5">Estimated Hourly Rate</span>
                  <span className="text-base font-extrabold text-[#182319]">{job.compensation}</span>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <span className="text-gray-500 block mb-1">Sponsoring Platform</span>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-white border border-[#dce5d4] p-0.5 flex items-center justify-center shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getCompanyLogo(job.company || job.platform)}
                        alt={job.company || 'Company'}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="font-bold text-gray-800">{getCompanyDisplayName(job.company || job.platform)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <span className="text-gray-500 block mb-0.5">Discipline Category</span>
                  <span className="font-bold text-gray-800">{job.category}</span>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <span className="text-gray-500 block mb-0.5">Location & Work Style</span>
                  <span className="font-bold text-gray-800">{job.location || 'Remote'} · 100% Async</span>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <span className="text-gray-500 block mb-0.5">Employment Arrangement</span>
                  <span className="font-bold text-gray-800">{job.type || 'Contract / Hourly'}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-2">
                <button
                  onClick={initiateApplication}
                  className="w-full py-3 bg-[#182319] hover:bg-[#2b421e] text-[#c4f568] font-bold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>Apply Now</span>
                  <ArrowRight size={14} />
                </button>
                <Link
                  href="/jobs"
                  className="w-full py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-xs text-center block transition"
                >
                  Browse Similar Openings
                </Link>
              </div>

              {/* Progress Pipeline Preview */}
              <div className="pt-4 border-t border-gray-100">
                <div className="text-[11px] font-bold text-gray-400 uppercase mb-2">APPLICATION STAGES</div>
                <div className="space-y-2 text-[11px] text-gray-600">
                  <div className="flex items-center gap-2 text-[#2e5c17] font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#2e5c17]"></span>
                    <span>1. Click Apply (Recorded on HireEase)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                    <span>2. Complete External Application</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                    <span>3. Assessment / Code Test</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                    <span>4. Interview & Selection</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Candidate Tracking & Redirection Modal */}
      <Dialog open={trackingModalOpen} onOpenChange={open => !open && setTrackingModalOpen(false)}>
        <DialogContent className="max-w-md p-6 bg-white rounded-2xl shadow-xl">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#edf7e3] text-[#2e5c17] flex items-center justify-center mx-auto mb-4 border border-[#d2ebd5]">
              <CheckCircle2 size={26} />
            </div>

            <DialogTitle className="text-xl font-extrabold text-center text-[#182319] mb-1">
              Application Recorded!
            </DialogTitle>
            <DialogDescription className="text-xs text-center text-gray-500 mb-4">
              {job.title} · {job.company}
            </DialogDescription>

            {/* Mandatory confirmation text */}
            <div className="p-4 bg-[#f4faee] border border-[#d2ebd5] rounded-xl text-xs text-[#204712] mb-5 leading-relaxed space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-sm text-[#182319]">
                <ShieldCheck size={16} className="text-[#2e5c17]" />
                <span>Tracking Activated</span>
              </div>
              <p>
                <strong>&quot;Your application has been recorded on HireEase Services. You will now be redirected to the official job application page.&quot;</strong>
              </p>
              <div className="text-[11px] text-gray-600 pt-1 border-t border-[#d2ebd5]/60">
                Your candidate record has been saved in the administrative dashboard to track review and interview stages.
              </div>
            </div>

            {/* If user is not logged in */}
            {!currentUser && !showGuestForm && (
              <div className="mb-5 space-y-2 text-xs">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <p className="text-gray-700 font-semibold mb-2">
                    Want to track your interview and review status?
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowGuestForm(true)}
                      className="flex-1 py-1.5 bg-white border border-gray-300 hover:border-[#2e5c17] text-gray-800 font-bold rounded-lg text-xs transition"
                    >
                      Enter Email to Track
                    </button>
                    <Link
                      href={`/auth?return_to=${encodeURIComponent(`/jobs/${job.id}`)}`}
                      className="flex-1 py-1.5 bg-[#182319] text-[#c4f568] font-bold rounded-lg text-xs text-center transition"
                    >
                      Sign In with Google
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Guest Quick Form */}
            {!currentUser && showGuestForm && (
              <div className="space-y-3 mb-5 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Your Full Name</label>
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    value={guestName}
                    onChange={e => setGuestName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Your Email Address *</label>
                  <input
                    type="email"
                    placeholder="jane@example.com"
                    value={guestEmail}
                    onChange={e => setGuestEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs"
                  />
                </div>
                <button
                  onClick={handleGuestSubmitAndRedirect}
                  disabled={isSubmittingTracking}
                  className="w-full py-2 bg-[#182319] hover:bg-[#2b421e] text-[#c4f568] font-bold rounded-xl transition text-xs shadow-xs"
                >
                  {isSubmittingTracking ? 'Saving & Redirecting...' : 'Save & Continue to Application'}
                </button>
              </div>
            )}

            {/* Direct action button */}
            <div className="space-y-3">
              <button
                onClick={handleDirectRedirectNow}
                className="w-full py-3 bg-[#182319] hover:bg-[#2b421e] text-[#c4f568] font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2"
              >
                <span>Proceed to Official Application Now</span>
                <ExternalLink size={14} />
              </button>

              <div className="text-center text-[11px] text-gray-400">
                Automatically redirecting in <strong>{countdown}</strong> seconds...
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-white border-t border-[#e2ece0] py-8 text-xs text-gray-500 text-center">
        <div className="wrap max-w-5xl mx-auto px-4">
          <p>© {new Date().getFullYear()} HireEase Services. Verified AI contractor marketplace and placement network.</p>
        </div>
      </footer>
    </div>
  );
}
