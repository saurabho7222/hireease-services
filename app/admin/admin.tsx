"use client";

import { useState, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster, toast } from 'sonner';
import { type Job, categories } from '@/lib/jobs';
import { type Profile, type Application, statusLabels } from '@/lib/profile';

async function api(url: string, opts?: RequestInit) {
  const r = await fetch(url, opts);
  const d: any = await r.json();
  if (!r.ok) throw Error(d.error || 'Please try again.');
  return d;
}

export default function Admin({ email }: { email: string }) {
  const [data, setData] = useState<{ jobs: Job[]; applications: Application[]; candidates: Profile[] } | null>(null);
  const [accessData, setAccessData] = useState<{ isSuperAdmin: boolean; admins: any[]; requests: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [setup, setSetup] = useState('');
  const [saving, setSaving] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [editor, setEditor] = useState<Job | 'new' | null>(null);
  const [jobCategory, setJobCategory] = useState('AI & ML');
  const [jobType, setJobType] = useState('Contract');
  const [jobStatus, setJobStatus] = useState('open');
  const [formError, setFormError] = useState('');
  const [candidate, setCandidate] = useState<Profile | null>(null);

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
    setJobCategory(j === 'new' ? 'AI & ML' : j.category);
    setJobType(j === 'new' ? 'Contract' : j.type);
    setJobStatus(j === 'new' ? 'open' : j.status);
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

  async function update(a: Application, status: string) {
    setApprovingId(a.id);
    try {
      const res = await api('/api/admin/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: a.id,
          status,
          sendEmail: status === 'selected'
        })
      });
      await load();
      if (status === 'selected' || res.emailSent) {
        toast.success(`Application approved! Candidate selection email sent to ${res.recipientEmail || a.profile?.email}.`);
      } else {
        toast.success('Application status updated.');
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setApprovingId(null);
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

  return (
    <div className="account-page">
      <Toaster richColors />
      <header className="account-header">
        <Brand />
        <div className="account-nav">
          <a href="/dashboard">Candidate view</a>
          <span className="user-email">{email}</span>
          <a href="/api/auth/logout" aria-label="Sign out">
            <LogOut size={19} />
          </a>
        </div>
      </header>

      <main className="account-wrap">
        <div className="account-heading">
          <div>
            <span className="eyebrow">HIRE EASE RECRUITER WORKSPACE</span>
            <h1>Good talent. Great possibilities.</h1>
            <p>Publish your partner roles, review talent, and dispatch candidate approvals.</p>
          </div>
          {data && (
            <button className="btn green" onClick={() => edit('new')}>
              <Plus size={18} /> Publish a role
            </button>
          )}
        </div>

        {loading ? (
          <Skeleton className="h-72 w-full" />
        ) : !data ? (
          <section className="admin-lock">
            <ShieldCheck size={35} />
            <h2>Activate your recruiter workspace.</h2>
            <p>Only the authorized recruiter can manage jobs or view candidate details. Use the one-time setup code supplied with this site.</p>
            <form onSubmit={activate}>
              <label className="field">
                Workspace setup code
                <input
                  type="password"
                  autoComplete="off"
                  required
                  value={setup}
                  onChange={e => setSetup(e.target.value)}
                />
              </label>
              <p className="small-copy">Activation links this workspace to your signed-in account: {email}.</p>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <button className="btn green" disabled={saving}>
                {saving ? 'Activating…' : 'Activate workspace'}
              </button>
            </form>
          </section>
        ) : (
          <>
            <div className="admin-stats">
              <div>
                <BriefcaseBusiness size={19} />
                <strong>{data.jobs.filter(j => j.status === 'open').length}</strong>
                <span>Open roles</span>
              </div>
              <div>
                <FileText size={19} />
                <strong>{data.applications.length}</strong>
                <span>Applications & interests</span>
              </div>
              <div>
                <Users size={19} />
                <strong>{data.candidates.length}</strong>
                <span>Candidate profiles</span>
              </div>
            </div>

            <Tabs defaultValue="jobs" className="account-tabs">
              <TabsList variant="line">
                <TabsTrigger value="jobs">Job posts</TabsTrigger>
                <TabsTrigger value="applications">
                  Applications ({data.applications.length})
                </TabsTrigger>
                <TabsTrigger value="candidates">Candidates</TabsTrigger>
                <TabsTrigger value="approvals">Admin Approvals</TabsTrigger>
              </TabsList>

              {/* Jobs Tab */}
              <TabsContent value="jobs">
                {data.jobs.length === 0 ? (
                  <div className="empty-state">
                    <h3>Your first opening starts here.</h3>
                    <p>Add a confirmed partner role. It will appear on the website and in candidate recommendations.</p>
                    <button className="btn" onClick={() => edit('new')}>
                      Create first job post
                    </button>
                  </div>
                ) : (
                  data.jobs.map(j => (
                    <article className="admin-record" key={j.id}>
                      <div className="admin-record-top">
                        <div>
                          <span className="eyebrow">
                            {j.company} · {j.status.toUpperCase()}
                          </span>
                          <h3>{j.title}</h3>
                          <p>
                            {j.location} · {j.type} · {j.category}
                          </p>
                        </div>
                        <button className="text-button" onClick={() => edit(j)}>
                          Edit role
                        </button>
                      </div>
                      <div className="skill-tags">
                        {j.skills.map(s => (
                          <span key={s}>{s}</span>
                        ))}
                      </div>
                    </article>
                  ))
                )}
              </TabsContent>

              {/* Applications Tab with Instant Candidate Approval & Email Dispatch */}
              <TabsContent value="applications">
                {data.applications.length === 0 ? (
                  <div className="empty-state">
                    <h3>Applications will appear here.</h3>
                    <p>When candidates apply, their applications appear here with one-click approval and email notification.</p>
                  </div>
                ) : (
                  data.applications.map(a => {
                    const isSelected = a.status === 'selected';
                    const isCurrentApproving = approvingId === a.id;

                    return (
                      <article className="admin-record" key={a.id}>
                        <div className="admin-record-top">
                          <div>
                            <span className="eyebrow">
                              {a.isSample ? 'EXPRESSION OF INTEREST' : a.company}
                            </span>
                            <h3>
                              {a.profile?.name || 'Candidate'} · {a.jobTitle}
                            </h3>
                            <p>
                              {a.profile?.email} · {a.profile?.city || 'India'} · Applied {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Select value={a.status} onValueChange={v => update(a, v)}>
                              <SelectTrigger aria-label={'Status for ' + a.profile?.name}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(statusLabels).map(([k, v]) => (
                                  <SelectItem key={k} value={k}>
                                    {v}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="admin-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button onClick={() => setCandidate(a.profile!)}>
                              View submitted profile
                            </button>
                            <a href={'/api/resume?application=' + a.id}>
                              Download submitted résumé
                            </a>
                          </div>

                          {/* Quick Approve & Email Trigger Button */}
                          <div>
                            {!isSelected ? (
                              <button
                                className="btn green"
                                disabled={isCurrentApproving}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', fontSize: '13px' }}
                                onClick={() => update(a, 'selected')}
                              >
                                <CheckCircle2 size={15} />
                                {isCurrentApproving ? 'Approving & Mailing…' : 'Approve & Send Email'}
                              </button>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '4px 10px',
                                  backgroundColor: 'rgba(34, 197, 94, 0.15)',
                                  color: '#4ade80',
                                  borderRadius: '9999px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  border: '1px solid rgba(34, 197, 94, 0.3)'
                                }}>
                                  <CheckCircle2 size={13} /> Approved · Email Sent
                                </span>
                                <button
                                  className="text-button"
                                  style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  disabled={isCurrentApproving}
                                  onClick={() => update(a, 'selected')}
                                >
                                  <Mail size={13} /> Resend Email
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </TabsContent>

              {/* Candidates Tab */}
              <TabsContent value="candidates">
                {data.candidates.length === 0 ? (
                  <div className="empty-state">
                    <h3>Your talent network will grow here.</h3>
                    <p>Candidate profiles appear when they register and save their details.</p>
                  </div>
                ) : (
                  data.candidates.map(c => (
                    <article className="admin-record" key={c.userId}>
                      <div className="admin-record-top">
                        <div>
                          <h3>{c.name}</h3>
                          <p>
                            {c.email} · {c.city}, {c.country}
                          </p>
                          <p>
                            {c.education} · {c.institution}
                          </p>
                        </div>
                        <button className="text-button" onClick={() => setCandidate(c)}>
                          View profile
                        </button>
                      </div>
                      <div className="skill-tags">
                        {c.skills.map(s => (
                          <span key={s}>{s}</span>
                        ))}
                      </div>
                      {c.hasResume && (
                        <a className="small-link" href={'/api/resume?candidate=' + encodeURIComponent(c.userId)}>
                          Download current résumé
                        </a>
                      )}
                    </article>
                  ))
                )}
              </TabsContent>

              {/* Admin Approvals & Team Access Tab */}
              <TabsContent value="approvals">
                <div style={{ padding: '8px 0' }}>
                  <div style={{
                    padding: '20px',
                    borderRadius: '12px',
                    backgroundColor: '#070d1e',
                    border: '1px solid #1a2744',
                    marginBottom: '24px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <Shield size={20} style={{ color: '#38bdf8' }} />
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                        Super Admin Access Control
                      </h3>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
                      Only your designated Super Admin account ({email}) holds direct Admin Panel rights.
                      No user can make themselves an Admin; any additional team access strictly requires your prior approval.
                    </p>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff', marginBottom: '14px' }}>
                    Authorized Administrators
                  </h3>

                  <div style={{ display: 'grid', gap: '10px', marginBottom: '32px' }}>
                    {accessData?.admins && accessData.admins.length > 0 ? (
                      accessData.admins.map((adm: any) => {
                        const isSuper = adm.email.toLowerCase() === email.toLowerCase();
                        return (
                          <div
                            key={adm.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '14px 18px',
                              backgroundColor: '#0b1329',
                              border: '1px solid #1a2744',
                              borderRadius: '10px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <UserCheck size={18} style={{ color: isSuper ? '#38bdf8' : '#4ade80' }} />
                              <div>
                                <strong style={{ color: '#ffffff', fontSize: '14px' }}>{adm.name}</strong>
                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{adm.email}</div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              {isSuper ? (
                                <span style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '4px 10px',
                                  borderRadius: '9999px',
                                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                                  color: '#38bdf8',
                                  border: '1px solid rgba(56, 189, 248, 0.3)'
                                }}>
                                  Super Admin (You)
                                </span>
                              ) : (
                                <>
                                  <span style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    padding: '4px 10px',
                                    borderRadius: '9999px',
                                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                                    color: '#4ade80',
                                    border: '1px solid rgba(34, 197, 94, 0.3)'
                                  }}>
                                    Approved Admin
                                  </span>
                                  {accessData?.isSuperAdmin && (
                                    <button
                                      className="text-button"
                                      style={{ color: '#f87171', fontSize: '12px' }}
                                      onClick={() => handleAdminAccessAction(adm.id, 'revoke')}
                                    >
                                      Revoke Access
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="empty-state">
                        <p>No administrators registered.</p>
                      </div>
                    )}
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff', marginBottom: '14px' }}>
                    Pending Admin Access Requests
                  </h3>

                  {accessData?.requests && accessData.requests.filter((r: any) => r.status === 'pending').length > 0 ? (
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {accessData.requests.filter((r: any) => r.status === 'pending').map((req: any) => (
                        <div
                          key={req.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px 20px',
                            backgroundColor: '#0b1329',
                            border: '1px solid #1a2744',
                            borderRadius: '10px'
                          }}
                        >
                          <div>
                            <strong style={{ color: '#ffffff', fontSize: '14px' }}>{req.name}</strong>
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{req.email}</div>
                            <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#cbd5e1' }}>
                              Reason: &quot;{req.reason}&quot;
                            </p>
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              className="btn green"
                              style={{ padding: '6px 14px', fontSize: '12px' }}
                              onClick={() => handleAdminAccessAction(req.user_id, 'grant')}
                            >
                              Approve Admin
                            </button>
                            <button
                              className="text-button"
                              style={{ color: '#f87171', fontSize: '12px' }}
                              onClick={() => handleAdminAccessAction(req.user_id, 'revoke')}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      padding: '24px',
                      textAlign: 'center',
                      borderRadius: '10px',
                      border: '1px dashed #1e293b',
                      color: '#64748b',
                      fontSize: '13px'
                    }}>
                      No pending admin requests. All candidates are strictly locked into the Candidate space.
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      <div className="account-footer">HireEase Services · Recruiter workspace</div>

      {/* Role Editor Modal */}
      <Dialog open={!!editor} onOpenChange={o => !o && setEditor(null)}>
        <DialogContent className="job-editor modal-box">
          <DialogTitle className="modal-title">
            {editor === 'new' ? 'Publish a new role' : 'Edit this role'}
          </DialogTitle>
          <DialogDescription>
            Use confirmed information from your recruiting partner. Open roles appear immediately on the site.
          </DialogDescription>
          <form onSubmit={save} className="profile-form" key={editor === 'new' ? 'new' : editor?.id}>
            <div className="form-pair">
              <label className="field">
                Role title
                <input
                  name="title"
                  required
                  minLength={3}
                  maxLength={150}
                  defaultValue={editor !== 'new' ? editor?.title : ''}
                />
              </label>
              <label className="field">
                Company
                <input
                  name="company"
                  required
                  minLength={2}
                  maxLength={150}
                  defaultValue={editor !== 'new' ? editor?.company : ''}
                />
              </label>
            </div>
            <div className="form-pair">
              <div className="field">
                Category
                <Select value={jobCategory} onValueChange={setJobCategory}>
                  <SelectTrigger aria-label="Job category">
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
              <div className="field">
                Work type
                <Select value={jobType} onValueChange={setJobType}>
                  <SelectTrigger aria-label="Job type">
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
            <div className="form-pair">
              <label className="field">
                Location
                <input
                  name="location"
                  required
                  maxLength={150}
                  placeholder="Remote — India"
                  defaultValue={editor !== 'new' ? editor?.location : ''}
                />
              </label>
              <label className="field">
                Experience required
                <input
                  name="experience"
                  required
                  maxLength={200}
                  placeholder="2+ years in Python development"
                  defaultValue={editor !== 'new' ? editor?.experience : ''}
                />
              </label>
            </div>
            <label className="field">
              Compensation / rate
              <input
                name="compensation"
                required
                maxLength={200}
                placeholder="Add verified rate, or state Not disclosed"
                defaultValue={editor !== 'new' ? editor?.compensation : ''}
              />
            </label>
            <label className="field">
              Role description
              <textarea
                name="description"
                rows={3}
                required
                minLength={20}
                maxLength={3000}
                defaultValue={editor !== 'new' ? editor?.description : ''}
              />
            </label>
            <label className="field">
              Skills, separated by commas
              <input
                name="skills"
                required
                maxLength={2000}
                defaultValue={editor !== 'new' ? editor?.skills.join(', ') : ''}
              />
            </label>
            <label className="field">
              Responsibilities, one per line
              <textarea
                name="responsibilities"
                rows={3}
                required
                maxLength={7000}
                defaultValue={editor !== 'new' ? editor?.responsibilities.join('\n') : ''}
              />
            </label>
            <div className="field">
              Role status
              <Select value={jobStatus} onValueChange={setJobStatus}>
                <SelectTrigger aria-label="Role status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open — publish on website</SelectItem>
                  <SelectItem value="closed">Closed — hide from new applications</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formError && (
              <p className="form-error" role="alert">
                {formError}
              </p>
            )}
            <button className="btn green wide" type="submit" disabled={saving}>
              {saving ? 'Saving…' : jobStatus === 'open' ? 'Publish role' : 'Save closed role'}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Candidate Profile Viewer Modal */}
      <Dialog open={!!candidate} onOpenChange={o => !o && setCandidate(null)}>
        <DialogContent className="modal-box">
          {candidate && (
            <>
              <DialogTitle className="modal-title">{candidate.name}</DialogTitle>
              <DialogDescription>{candidate.email}</DialogDescription>
              <div className="candidate-detail">
                <h3>Location & address</h3>
                <p>
                  {candidate.address}
                  <br />
                  {candidate.city}, {candidate.country}
                </p>
                <h3>Education</h3>
                <p>
                  {candidate.education}
                  <br />
                  {candidate.institution} · {candidate.graduationYear}
                </p>
                <h3>Skills</h3>
                <div className="skill-tags">
                  {candidate.skills.map(s => (
                    <span key={s}>{s}</span>
                  ))}
                </div>
                <h3>Experience & interests</h3>
                <p className="preserve-lines">{candidate.experience}</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
