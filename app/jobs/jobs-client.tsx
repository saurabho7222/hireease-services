"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  Briefcase,
  MapPin,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Flame,
  CheckCircle2,
  Bookmark,
  Share2,
  Filter,
  ShieldCheck,
  UserCheck,
  SlidersHorizontal
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Toaster, toast } from 'sonner';
import { Brand } from '@/app/home';
import { categories, trackedPlatforms, type Job } from '@/lib/jobs';

export default function JobsClient() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All roles');
  const [platform, setPlatform] = useState('All platforms');
  const [jobType, setJobType] = useState('All types');
  const [minPay, setMinPay] = useState(0);
  const [highDemandOnly, setHighDemandOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Saved roles
  const [savedJobs, setSavedJobs] = useState<string[]>([]);

  // Redirection Modal State
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [selectedJobForApply, setSelectedJobForApply] = useState<Job | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [isSubmittingTracking, setIsSubmittingTracking] = useState(false);
  const [targetRedirectUrl, setTargetRedirectUrl] = useState('');
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [showGuestForm, setShowGuestForm] = useState(false);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load saved roles
    try {
      const saved = JSON.parse(localStorage.getItem('hireease_saved_jobs') || '[]');
      setSavedJobs(saved);
    } catch {}

    // Fetch user session
    fetch('/api/auth/me')
      .then(r => (r.ok ? r.json() : null))
      .then((d: any) => {
        if (d?.user) {
          setCurrentUser(d.user);
        }
      })
      .catch(() => {});

    // Fetch all jobs
    fetch('/api/jobs')
      .then(r => r.json())
      .then((d: any) => {
        setJobs(d.jobs || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching jobs:', err);
        setLoading(false);
      });
  }, []);

  // Filter logic
  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      // Category filter
      if (category !== 'All roles' && j.category !== category) {
        return false;
      }
      // Platform filter
      if (platform !== 'All platforms') {
        const plat = (j.platform || j.company || '').toLowerCase();
        if (!plat.includes(platform.toLowerCase())) {
          return false;
        }
      }
      // Job Type filter
      if (jobType !== 'All types') {
        if (j.type !== jobType) return false;
      }
      // High Demand filter
      if (highDemandOnly && !j.highDemand && !j.urgent) {
        return false;
      }
      // Min Pay filter
      if (minPay > 0) {
        const match = j.compensation.match(/\$(\d+)/);
        if (match) {
          const rate = parseInt(match[1], 10);
          if (rate < minPay) return false;
        }
      }
      // Search query
      if (query.trim()) {
        const q = query.toLowerCase();
        const inTitle = j.title.toLowerCase().includes(q);
        const inCompany = j.company.toLowerCase().includes(q);
        const inDesc = j.description.toLowerCase().includes(q);
        const inSkills = j.skills.some(s => s.toLowerCase().includes(q));
        if (!inTitle && !inCompany && !inDesc && !inSkills) {
          return false;
        }
      }
      return true;
    });
  }, [jobs, category, platform, jobType, highDemandOnly, minPay, query]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredJobs.length / pageSize) || 1;
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [category, platform, jobType, highDemandOnly, minPay, query]);

  // Bookmark toggle
  const toggleSaveJob = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    let updated: string[];
    if (savedJobs.includes(id)) {
      updated = savedJobs.filter(item => item !== id);
      toast.info('Role removed from saved list');
    } else {
      updated = [...savedJobs, id];
      toast.success('Role saved to your profile bookmarks');
    }
    setSavedJobs(updated);
    localStorage.setItem('hireease_saved_jobs', JSON.stringify(updated));
  };

  // Share role
  const shareRole = (job: Job, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const url = `${window.location.origin}/jobs/${job.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success('Job link copied to clipboard!');
    }
  };

  const getCleanExcerpt = (desc: string): string => {
    if (!desc) return '';
    let text = desc
      .replace(/^Role Title:[\s\S]*?(?=Role Type:|$)/i, '')
      .replace(/^Role Type:[\s\S]*?(?=Location:|$)/i, '')
      .replace(/^Location:[\s\S]*?(?=(micro1|We are|In this role|About the opportunity|About micro1|$))/i, '')
      .replace(/^(About micro1:?|micro1 is engaging:?|We are engaging:?|In this role,?\s*)/i, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) text = desc.replace(/\s+/g, ' ').trim();
    if (text.length > 120) {
      return text.slice(0, 120).trim() + '…';
    }
    return text;
  };

  // Start application flow
  const initiateApplication = async (job: Job, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setSelectedJobForApply(job);
    const referralUrl = job.externalUrl || `https://refer.micro1.ai/referral/jobs?referralCode=a462a1ef-5825-41db-8422-83628df889fc`;
    setTargetRedirectUrl(referralUrl);
    setCountdown(3);

    // If user is already logged in, automatically record application
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
      // User is not logged in; open modal prompting for email or one-click continue
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
          jobId: selectedJobForApply?.id,
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

  return (
    <div className="min-h-screen bg-[#fcfdfc] text-[#182319] flex flex-col font-sans">
      <Toaster position="top-right" richColors />

      {/* Top Navigation */}
      <header className="main-header border-b border-[#e2ece0] bg-white/95 backdrop-blur-md sticky top-0 z-40">
        <div className="wrap flex items-center justify-between py-3.5 px-4 sm:px-6">
          <Brand />
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-gray-700">
            <Link href="/" className="hover:text-[#2e5c17] transition">
              Home
            </Link>
            <Link href="/jobs" className="text-[#2e5c17] font-extrabold flex items-center gap-1.5">
              <span>All Jobs</span>
              <span className="text-[10px] bg-[#edf7e3] text-[#2e5c17] px-2 py-0.5 rounded-full border border-[#d2ebd5]">
                {jobs.length || 389}
              </span>
            </Link>
            <Link href="/dashboard" className="hover:text-[#2e5c17] transition flex items-center gap-1">
              <Sparkles size={14} className="text-[#2e5c17]" /> Candidate Portal
            </Link>
            <Link href="/admin" className="hover:text-[#2e5c17] transition flex items-center gap-1">
              <ShieldCheck size={14} /> Recruiter ATS
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            {currentUser ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-[#182319] hover:bg-[#2b421e] text-[#c4f568] text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
              >
                <UserCheck size={14} /> Dashboard ({currentUser.name?.split(' ')[0]})
              </Link>
            ) : (
              <Link
                href="/auth?return_to=/jobs"
                className="px-4 py-2 bg-[#182319] hover:bg-[#2b421e] text-[#c4f568] text-xs font-bold rounded-xl transition shadow-sm"
              >
                Candidate Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Header Section */}
      <section className="bg-gradient-to-b from-[#f2f8ee] to-[#fcfdfc] border-b border-[#e5efe2] py-10 px-4 sm:px-6">
        <div className="wrap max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#c4e3b8] rounded-full text-xs font-bold text-[#2e5c17] mb-3 shadow-2xs">
              <Sparkles size={14} />
              <span>OFFICIAL REMOTE OPPORTUNITIES FEED</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#182319] mb-3">
              Explore All Remote AI Specialist Roles
            </h1>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              Browse and apply to <strong>{jobs.length || 388}+ verified</strong> AI training, RLHF, prompt engineering, code evaluation, and specialist opportunities with verified compensation.
            </p>
          </div>

          {/* Search & Multi-Filter Card */}
          <div className="mt-8 bg-white border border-[#dce5d4] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            {/* Search Input Bar */}
            <div className="relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by role title, required skill, discipline, or platform (e.g. Python, Legal, micro1)..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full pl-10 pr-24 py-3 bg-[#fafcfa] border border-[#dce5d4] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2e5c17] focus:bg-white transition"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                    category === c
                      ? 'bg-[#182319] text-[#c4f568] shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Dropdown Filters Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100 text-xs">
              {/* Platform */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">Platform / Sponsor</label>
                <select
                  value={platform}
                  onChange={e => setPlatform(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 font-medium bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2e5c17]"
                >
                  <option value="All platforms">All platforms</option>
                  {trackedPlatforms.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Employment Type */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">Employment Type</label>
                <select
                  value={jobType}
                  onChange={e => setJobType(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 font-medium bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2e5c17]"
                >
                  <option value="All types">All types</option>
                  <option value="Contract">Contract</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>

              {/* Minimum Pay */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">Minimum Compensation</label>
                <select
                  value={minPay}
                  onChange={e => setMinPay(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg p-2 font-medium bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2e5c17]"
                >
                  <option value="0">Any compensation</option>
                  <option value="20">$20+/hr</option>
                  <option value="30">$30+/hr</option>
                  <option value="50">$50+/hr</option>
                  <option value="70">$70+/hr</option>
                  <option value="100">$100+/hr</option>
                </select>
              </div>

              {/* High Demand Toggle */}
              <div className="flex items-end">
                <label className="flex items-center gap-2 p-2 w-full border border-gray-200 rounded-lg bg-gray-50/50 cursor-pointer text-gray-800 font-semibold hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={highDemandOnly}
                    onChange={e => setHighDemandOnly(e.target.checked)}
                    className="rounded text-[#2e5c17] accent-[#2e5c17]"
                  />
                  <span className="flex items-center gap-1 text-xs">
                    <Flame size={13} className="text-amber-500" /> High Demand Only
                  </span>
                </label>
              </div>
            </div>

            {/* Active Filters Summary */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500 flex-wrap gap-2">
              <div>
                Showing <strong>{filteredJobs.length}</strong> matching roles (Page {currentPage} of {totalPages})
              </div>
              {(category !== 'All roles' || platform !== 'All platforms' || jobType !== 'All types' || minPay > 0 || highDemandOnly || query) && (
                <button
                  onClick={() => {
                    setCategory('All roles');
                    setPlatform('All platforms');
                    setJobType('All types');
                    setMinPay(0);
                    setHighDemandOnly(false);
                    setQuery('');
                  }}
                  className="text-xs font-bold text-rose-600 hover:underline"
                >
                  Reset all filters
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Jobs Listing Section */}
      <main className="wrap max-w-6xl mx-auto py-10 px-4 sm:px-6 flex-1">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 h-64 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                <div className="h-16 bg-gray-100 rounded mb-4"></div>
              </div>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white border border-[#dce5d4] rounded-2xl p-12 text-center max-w-lg mx-auto shadow-xs">
            <Briefcase size={36} className="text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800 mb-1">No matching openings found</h3>
            <p className="text-xs text-gray-500 mb-5">
              Try adjusting your search keywords, lowering the compensation filter, or selecting 'All platforms'.
            </p>
            <button
              onClick={() => {
                setCategory('All roles');
                setPlatform('All platforms');
                setJobType('All types');
                setMinPay(0);
                setHighDemandOnly(false);
                setQuery('');
              }}
              className="px-5 py-2.5 bg-[#182319] text-[#c4f568] text-xs font-bold rounded-xl shadow-xs"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedJobs.map(job => {
                const isSaved = savedJobs.includes(job.id);
                return (
                  <article
                    key={job.id}
                    className="bg-white border border-[#dce5d4] hover:border-[#77ab3b] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group sm:aspect-square sm:max-h-[390px] min-h-[350px] overflow-hidden"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#edf7e3] text-[#2e5c17] border border-[#d2ebd5] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#468c22]"></span>
                            {job.platform || job.company}
                          </span>
                          <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                            {job.category}
                          </span>
                        </div>

                        {(job.highDemand || job.urgent) && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                            <Flame size={11} /> Urgent
                          </span>
                        )}
                      </div>

                      {/* Position Title */}
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-[#2e5c17] transition line-clamp-2 mb-2 leading-snug h-[42px] overflow-hidden">
                        <Link href={`/jobs/${job.id}`}>
                          {job.title}
                        </Link>
                      </h3>

                      {/* Compensation & Meta */}
                      <div className="flex items-center gap-3 text-xs mb-2 flex-wrap">
                        <span className="font-extrabold text-[#182319] bg-[#f2f8ee] px-2 py-0.5 rounded border border-[#d2ebd5]">
                          {job.compensation}
                        </span>
                        <span className="text-gray-500 flex items-center gap-1 text-[11px]">
                          <MapPin size={12} /> {job.location || 'Remote'}
                        </span>
                        <span className="text-gray-500 flex items-center gap-1 text-[11px]">
                          <Clock size={12} /> {job.type || 'Contract'}
                        </span>
                      </div>

                      {/* Description Snippet (Shrunk to 2 lines) */}
                      <p className="text-xs text-gray-600 line-clamp-2 mb-3 leading-relaxed max-h-[36px] overflow-hidden">
                        {getCleanExcerpt(job.description)}
                      </p>

                      {/* Skills Chips */}
                      {job.skills && job.skills.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap mb-2 max-h-[26px] overflow-hidden">
                          {job.skills.slice(0, 3).map(skill => (
                            <span
                              key={skill}
                              className="text-[10.5px] font-medium bg-gray-50 text-gray-600 border border-gray-200 px-2 py-0.5 rounded truncate"
                            >
                              {skill}
                            </span>
                          ))}
                          {job.skills.length > 3 && (
                            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                              +{job.skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 mt-auto">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={e => shareRole(job, e)}
                          title="Copy share link"
                          className="p-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition"
                        >
                          <Share2 size={14} />
                        </button>
                        <button
                          onClick={e => toggleSaveJob(job.id, e)}
                          title={isSaved ? 'Remove bookmark' : 'Bookmark role'}
                          className={`p-2 border rounded-lg transition ${
                            isSaved
                              ? 'bg-amber-50 border-amber-300 text-amber-600'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <Bookmark size={14} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="px-3 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition"
                        >
                          Details
                        </Link>
                        <button
                          onClick={e => initiateApplication(job, e)}
                          className="px-4 py-2 bg-[#182319] hover:bg-[#2b421e] text-[#c4f568] text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1"
                        >
                          <span>Apply Now</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-8 pb-4 flex-wrap gap-4 border-t border-gray-200 mt-10">
                <div className="text-xs text-gray-500 font-medium">
                  Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to{' '}
                  <strong>{Math.min(currentPage * pageSize, filteredJobs.length)}</strong> of{' '}
                  <strong>{filteredJobs.length}</strong> roles
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    title="Previous page"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {/* Dynamic page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                    .map((p, idx, arr) => {
                      const showEllipsisBefore = idx > 0 && p - arr[idx - 1] > 1;
                      return (
                        <div key={p} className="flex items-center">
                          {showEllipsisBefore && <span className="px-1 text-gray-400">...</span>}
                          <button
                            onClick={() => setCurrentPage(p)}
                            className={`min-w-8 h-8 px-2 text-xs font-bold rounded-lg transition ${
                              currentPage === p
                                ? 'bg-[#182319] text-[#c4f568]'
                                : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            {p}
                          </button>
                        </div>
                      );
                    })}

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    title="Next page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ====================================================================
          Candidate Tracking & Automatic Redirection Modal
          ==================================================================== */}
      <Dialog open={trackingModalOpen} onOpenChange={open => !open && setTrackingModalOpen(false)}>
        <DialogContent className="max-w-md p-6 bg-white rounded-2xl shadow-xl">
          {selectedJobForApply && (
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#edf7e3] text-[#2e5c17] flex items-center justify-center mx-auto mb-4 border border-[#d2ebd5]">
                <CheckCircle2 size={26} />
              </div>

              <DialogTitle className="text-xl font-extrabold text-center text-[#182319] mb-1">
                Application Recorded!
              </DialogTitle>
              <DialogDescription className="text-xs text-center text-gray-500 mb-4">
                {selectedJobForApply.title} · {selectedJobForApply.company}
              </DialogDescription>

              {/* Confirmation Notice Required by Specification */}
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

              {/* If user is not logged in, prompt to attach email for status updates */}
              {!currentUser && !showGuestForm && (
                <div className="mb-5 space-y-2 text-xs">
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <p className="text-gray-700 font-semibold mb-2">
                      Want to view your interview status in the candidate dashboard?
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowGuestForm(true)}
                        className="flex-1 py-1.5 bg-white border border-gray-300 hover:border-[#2e5c17] text-gray-800 font-bold rounded-lg text-xs transition"
                      >
                        Enter Email to Track
                      </button>
                      <Link
                        href={`/auth?return_to=${encodeURIComponent(`/jobs/${selectedJobForApply.id}`)}`}
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

              {/* Countdown & Action Buttons */}
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
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-white border-t border-[#e2ece0] py-8 text-xs text-gray-500 text-center">
        <div className="wrap max-w-6xl mx-auto px-4">
          <p>© {new Date().getFullYear()} HireEase Services. Verified AI contractor marketplace and placement network.</p>
        </div>
      </footer>
    </div>
  );
}
