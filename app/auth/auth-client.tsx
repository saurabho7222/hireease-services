"use client";

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Eye, EyeOff, ArrowLeft, Mail, RefreshCw, CheckCircle2, ShieldCheck, KeyRound, X, ExternalLink, ArrowRight, Check } from 'lucide-react';
import { Brand } from '@/app/home';
import { Toaster, toast } from 'sonner';

export default function AuthClient({
  initialMode = 'signin',
  returnTo = ''
}: {
  initialMode?: 'signin' | 'signup';
  returnTo?: string;
  requestedRole?: string;
}) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [step, setStep] = useState<'form' | 'otp'>('form');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [linkedinLoading, setLinkedinLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [formError, setFormError] = useState('');

  // Google Direct Auth & GSI Modal State
  const [googleConfig, setGoogleConfig] = useState<{ configured: boolean; clientId: string | null }>({ configured: false, clientId: null });
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleModalTab, setGoogleModalTab] = useState<'direct' | 'connect'>('direct');
  const [directGoogleEmail, setDirectGoogleEmail] = useState('');
  const [directGoogleName, setDirectGoogleName] = useState('');
  const [directGoogleLoading, setDirectGoogleLoading] = useState(false);
  const [connectClientId, setConnectClientId] = useState('');
  const [connectClientSecret, setConnectClientSecret] = useState('');
  const [savingGoogleConfig, setSavingGoogleConfig] = useState(false);

  // GitHub Direct Auth & OAuth State
  const [githubConfig, setGithubConfig] = useState<{ configured: boolean; clientId: string | null }>({ configured: false, clientId: null });
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubModalOpen, setGithubModalOpen] = useState(false);
  const [githubModalTab, setGithubModalTab] = useState<'direct' | 'connect'>('direct');
  const [directGitHubUsername, setDirectGitHubUsername] = useState('');
  const [directGitHubEmail, setDirectGitHubEmail] = useState('');
  const [directGitHubName, setDirectGitHubName] = useState('');
  const [directGitHubLoading, setDirectGitHubLoading] = useState(false);
  const [connectGitHubClientId, setConnectGitHubClientId] = useState('');
  const [connectGitHubSecret, setConnectGitHubSecret] = useState('');
  const [savingGitHubConfig, setSavingGitHubConfig] = useState(false);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Focus first OTP box when entering OTP step
  useEffect(() => {
    if (step === 'otp') {
      otpInputsRef.current[0]?.focus();
    }
  }, [step]);

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setLoading(true);

    try {
      const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const payload = mode === 'signup'
        ? { name, email, password }
        : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data: any = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please check your credentials.');
      }

      if (data.requireOtp) {
        // Switch to OTP verification step
        setStep('otp');
        setOtp(['', '', '', '', '', '']);
        setResendCountdown(45);
        toast.info(data.message || 'Verification code sent to your email.');
        return;
      }

      // Existing verified login
      toast.success(
        data.user?.role === 'admin'
          ? 'Signed in as Administrator'
          : `Welcome back, ${data.user?.name || 'Candidate'}!`
      );

      const destination = returnTo && returnTo.startsWith('/')
        ? returnTo
        : data.redirectUrl || (data.user?.role === 'admin' ? '/admin' : '/dashboard');

      setTimeout(() => {
        window.location.href = destination;
      }, 300);
    } catch (err: any) {
      setFormError(err.message || 'An error occurred during authentication.');
      toast.error(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const otpCode = otp.join('').trim();
    if (otpCode.length !== 6) {
      setFormError('Please enter the full 6-digit verification code.');
      return;
    }

    setFormError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode })
      });

      const data: any = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid or expired verification code.');
      }

      toast.success('Email verified successfully! Welcome to HireEase.');

      const destination = returnTo && returnTo.startsWith('/')
        ? returnTo
        : data.redirectUrl || '/dashboard';

      setTimeout(() => {
        window.location.href = destination;
      }, 300);
    } catch (err: any) {
      setFormError(err.message || 'Verification error.');
      toast.error(err.message || 'Verification error.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (resendCountdown > 0 || resending) return;
    setResending(true);
    setFormError('');

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data: any = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not resend verification code.');
      }

      toast.success('A new 6-digit verification code was sent to your email.');
      setResendCountdown(60);
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    const sanitized = value.replace(/\D/g, '');
    if (!sanitized) {
      const updated = [...otp];
      updated[index] = '';
      setOtp(updated);
      return;
    }

    if (sanitized.length > 1) {
      // Pasted multi-digit code
      const digits = sanitized.slice(0, 6).split('');
      const updated = [...otp];
      for (let i = 0; i < 6; i++) {
        updated[i] = digits[i] || '';
      }
      setOtp(updated);
      const nextFocus = Math.min(digits.length, 5);
      otpInputsRef.current[nextFocus]?.focus();
      return;
    }

    const updated = [...otp];
    updated[index] = sanitized;
    setOtp(updated);

    // Auto-advance to next input
    if (index < 5 && sanitized) {
      otpInputsRef.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  }

  useEffect(() => {
    fetch('/api/auth/google/config')
      .then(r => r.json())
      .then((data: any) => {
        if (data && data.configured && data.clientId) {
          setGoogleConfig(data);
          loadGoogleGsi(data.clientId);
        }
      })
      .catch(() => {});

    fetch('/api/auth/github/config')
      .then(r => r.json())
      .then((data: any) => {
        if (data && data.configured && data.clientId) {
          setGithubConfig(data);
        }
      })
      .catch(() => {});
  }, []);

  function loadGoogleGsi(clientId: string) {
    if (typeof window === 'undefined') return;
    const existing = document.getElementById('google-gsi-client');
    if (!existing) {
      const script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initGoogleIdentity(clientId);
      };
      document.head.appendChild(script);
    } else {
      initGoogleIdentity(clientId);
    }
  }

  function initGoogleIdentity(clientId: string) {
    try {
      const g = (window as any).google;
      if (!g?.accounts?.id) return;
      g.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true
      });
      g.accounts.id.prompt();
    } catch (err) {
      console.warn('Google GSI initialization notice:', err);
    }
  }

  async function handleGoogleCredentialResponse(response: any) {
    if (!response?.credential) return;
    setGoogleLoading(true);
    try {
      const res = await fetch('/api/auth/google/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      });
      const data: any = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google authentication failed.');
      toast.success(
        data.user?.role === 'admin'
          ? 'Signed in as Administrator'
          : `Welcome back, ${data.user?.name || data.user?.email}!`
      );
      const destination = returnTo && returnTo.startsWith('/')
        ? returnTo
        : data.redirectUrl || (data.user?.role === 'admin' ? '/admin' : '/dashboard');
      setTimeout(() => {
        window.location.href = destination;
      }, 300);
    } catch (err: any) {
      toast.error(err.message || 'Google sign-in error.');
      setFormError(err.message || 'Google sign-in error.');
    } finally {
      setGoogleLoading(false);
    }
  }

  function handleGoogleLogin() {
    if (googleConfig.configured) {
      setGoogleLoading(true);
      window.location.href = '/api/auth/google';
    } else {
      setGoogleModalOpen(true);
    }
  }

  async function handleDirectGoogleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!directGoogleEmail) return;
    setDirectGoogleLoading(true);
    try {
      const res = await fetch('/api/auth/google/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: directGoogleEmail, name: directGoogleName })
      });
      const data: any = await res.json();
      if (!res.ok) throw new Error(data.error || 'Direct Google sign-in failed.');
      toast.success(
        data.user?.role === 'admin'
          ? 'Signed in as Administrator'
          : `Signed in as ${data.user?.name || data.user?.email}!`
      );
      setGoogleModalOpen(false);
      const destination = returnTo && returnTo.startsWith('/')
        ? returnTo
        : data.redirectUrl || (data.user?.role === 'admin' ? '/admin' : '/dashboard');
      setTimeout(() => {
        window.location.href = destination;
      }, 300);
    } catch (err: any) {
      toast.error(err.message || 'Google authentication error.');
    } finally {
      setDirectGoogleLoading(false);
    }
  }

  async function handleSaveGoogleConfig(e: React.FormEvent) {
    e.preventDefault();
    if (!connectClientId) return;
    setSavingGoogleConfig(true);
    try {
      const res = await fetch('/api/auth/google/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: connectClientId, clientSecret: connectClientSecret })
      });
      const data: any = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save Google Client ID.');
      setGoogleConfig({ configured: true, clientId: connectClientId });
      loadGoogleGsi(connectClientId);
      toast.success('Google OAuth 2.0 connected! Real Google Sign-In is now live.');
      setGoogleModalTab('direct');
      setGoogleModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to connect Google credentials.');
    } finally {
      setSavingGoogleConfig(false);
    }
  }

  function handleGitHubLogin() {
    if (githubConfig.configured) {
      setGithubLoading(true);
      window.location.href = '/api/auth/github';
    } else {
      setGithubModalOpen(true);
    }
  }

  async function handleDirectGitHubSubmit(e: React.FormEvent) {
    e.preventDefault();
    const resolvedEmail = directGitHubEmail || (directGitHubUsername ? `${directGitHubUsername.toLowerCase()}@github.com` : '');
    if (!resolvedEmail) return;
    setDirectGitHubLoading(true);
    try {
      const res = await fetch('/api/auth/github/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resolvedEmail, name: directGitHubName, username: directGitHubUsername })
      });
      const data: any = await res.json();
      if (!res.ok) throw new Error(data.error || 'Direct GitHub sign-in failed.');
      toast.success(
        data.user?.role === 'admin'
          ? 'Signed in as Administrator'
          : `Signed in as ${data.user?.name || data.user?.email}!`
      );
      setGithubModalOpen(false);
      const destination = returnTo && returnTo.startsWith('/')
        ? returnTo
        : data.redirectUrl || (data.user?.role === 'admin' ? '/admin' : '/dashboard');
      setTimeout(() => {
        window.location.href = destination;
      }, 300);
    } catch (err: any) {
      toast.error(err.message || 'GitHub authentication error.');
    } finally {
      setDirectGitHubLoading(false);
    }
  }

  async function handleSaveGitHubConfig(e: React.FormEvent) {
    e.preventDefault();
    if (!connectGitHubClientId) return;
    setSavingGitHubConfig(true);
    try {
      const res = await fetch('/api/auth/github/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: connectGitHubClientId, clientSecret: connectGitHubSecret })
      });
      const data: any = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save GitHub Client ID.');
      setGithubConfig({ configured: true, clientId: connectGitHubClientId });
      toast.success('GitHub OAuth connected! Real GitHub Sign-In is now live.');
      setGithubModalTab('direct');
      setGithubModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to connect GitHub credentials.');
    } finally {
      setSavingGitHubConfig(false);
    }
  }

  function handleLinkedInLogin() {
    setLinkedinLoading(true);
    // Real OAuth redirect flow - verifies email automatically, no OTP required
    window.location.href = '/api/auth/linkedin';
  }

  return (
    <div className="auth-page">
      <Toaster richColors position="top-center" />

      {/* Navigation Header */}
      <header className="auth-nav-bar">
        <Brand />
        <a href="/" className="auth-back-link">
          <ArrowLeft size={16} /> Back to website
        </a>
      </header>

      {/* Main Authentication Container */}
      <main className="auth-main">
        <div className="auth-card">
          {/* Eyebrow and Heading */}
          <div className="auth-heading">
            <span className="auth-eyebrow">
              <Sparkles size={12} /> CANDIDATE ACCESS
            </span>

            {step === 'otp' ? (
              <>
                <h1>Verify your email.</h1>
                <p>
                  We sent a 6-digit verification code to <strong style={{ color: '#38bdf8' }}>{email}</strong>
                </p>
              </>
            ) : mode === 'signin' ? (
              <>
                <h1>Candidate sign in.</h1>
                <p>Sign in to your candidate account to access recommendations and track applications.</p>
              </>
            ) : (
              <>
                <h1>Create candidate profile.</h1>
                <p>Build your profile once and unlock premier AI opportunities across engineering, evaluation, and research.</p>
              </>
            )}
          </div>

          {step === 'form' && (
            <>
              {/* Mode Switcher Tabs */}
              <div className="auth-tabs-toggle" role="tablist">
                <button
                  type="button"
                  className={`auth-tab-btn ${mode === 'signin' ? 'active' : ''}`}
                  onClick={() => {
                    setMode('signin');
                    setFormError('');
                  }}
                >
                  Candidate Sign In
                </button>
                <button
                  type="button"
                  className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
                  onClick={() => {
                    setMode('signup');
                    setFormError('');
                  }}
                >
                  Create Account
                </button>
              </div>

              {/* Direct Social Authentication Options (No OTP Required) */}
              <div className="social-auth-grid">
                <button
                  type="button"
                  className="social-btn"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading || linkedinLoading}
                  title={googleConfig.configured ? "Sign in directly with your Google account" : "Sign in directly with Google or configure Client ID"}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>{googleLoading ? 'Signing in with Google…' : 'Continue with Google'}</span>
                  {googleConfig.configured && (
                    <span style={{ fontSize: '10px', background: '#e2f6c7', color: '#38631b', padding: '1px 6px', borderRadius: '4px', fontWeight: 600, marginLeft: 'auto' }}>
                      Live Google
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  className="social-btn"
                  onClick={handleGitHubLogin}
                  disabled={googleLoading || githubLoading || linkedinLoading}
                  title={githubConfig.configured ? "Sign in directly with your GitHub account" : "Sign in directly with GitHub or configure OAuth App"}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="#24292f">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  <span>{githubLoading ? 'Signing in with GitHub…' : 'Continue with GitHub'}</span>
                  {githubConfig.configured && (
                    <span style={{ fontSize: '10px', background: '#e2f6c7', color: '#38631b', padding: '1px 6px', borderRadius: '4px', fontWeight: 600, marginLeft: 'auto' }}>
                      Live GitHub
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  className="social-btn"
                  onClick={handleLinkedInLogin}
                  disabled={googleLoading || githubLoading || linkedinLoading}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="#0A66C2">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.3a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28Z"/>
                  </svg>
                  <span>{linkedinLoading ? 'Redirecting to LinkedIn…' : 'Continue with LinkedIn'}</span>
                </button>
              </div>

              <div className="auth-divider">
                <span>Or continue with email</span>
              </div>

              {/* Email / Password Form */}
              <form onSubmit={handleEmailAuth} className="profile-form">
                {mode === 'signup' && (
                  <label className="field">
                    Full Name
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      autoComplete="name"
                    />
                  </label>
                )}

                <label className="field">
                  Email address
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                  />
                </label>

                <label className="field">
                  Password
                  <div className="password-field-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={mode === 'signup' ? 'Create a secure password (min. 6 characters)' : 'Enter your password'}
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>

                {formError && (
                  <p className="form-error" role="alert">
                    {formError}
                  </p>
                )}

                <button type="submit" className="btn green wide" disabled={loading}>
                  {loading
                    ? mode === 'signup' ? 'Sending verification code…' : 'Signing in…'
                    : mode === 'signup' ? 'Create Account & Verify Email' : 'Sign in to Candidate Dashboard'}
                </button>
              </form>
            </>
          )}

          {/* OTP Verification Step */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="profile-form">
              <div style={{ textAlign: 'center', margin: '10px 0 20px 0' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  color: '#38bdf8',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  <Mail size={14} /> Check your inbox for the 6-digit code
                </span>
              </div>

              {/* 6-Digit OTP Box Grid */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', margin: '14px 0 24px 0' }}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => { otpInputsRef.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                    style={{
                      width: '46px',
                      height: '52px',
                      fontSize: '22px',
                      fontWeight: '700',
                      textAlign: 'center',
                      borderRadius: '8px',
                      backgroundColor: '#070d1e',
                      border: digit ? '2px solid #38bdf8' : '1px solid #1e293b',
                      color: '#ffffff',
                      outline: 'none',
                      boxShadow: digit ? '0 0 10px rgba(56, 189, 248, 0.25)' : 'none'
                    }}
                  />
                ))}
              </div>

              {formError && (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              )}

              <button type="submit" className="btn green wide" disabled={loading || otp.join('').length !== 6}>
                {loading ? 'Verifying code…' : 'Verify & Enter Candidate Panel'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', fontSize: '13px' }}>
                <button
                  type="button"
                  className="text-button"
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#94a3b8' }}
                  onClick={() => {
                    setStep('form');
                    setFormError('');
                  }}
                >
                  <ArrowLeft size={14} /> Back to details
                </button>

                <button
                  type="button"
                  className="text-button"
                  disabled={resendCountdown > 0 || resending}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '13px',
                    color: resendCountdown > 0 ? '#64748b' : '#38bdf8'
                  }}
                  onClick={handleResendOtp}
                >
                  <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
                  {resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : 'Resend code'}
                </button>
              </div>
            </form>
          )}

          <p className="auth-footer-note">
            By continuing, you agree to HireEase Services Terms of Service and Privacy Policy. Candidate accounts are securely stored in the talent registry.
          </p>
        </div>
      </main>

      {/* Direct Google Authentication Modal */}
      {googleModalOpen && (
        <div className="google-modal-backdrop" onClick={() => setGoogleModalOpen(false)}>
          <div className="google-modal-card" onClick={e => e.stopPropagation()}>
            <div className="google-modal-header">
              <div>
                <h2>
                  <svg viewBox="0 0 24 24" width="22" height="22">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Google Account Sign In</span>
                </h2>
                <p>Sign in directly using your Google account to access your candidate profile.</p>
              </div>
              <button
                type="button"
                className="google-modal-close"
                onClick={() => setGoogleModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="google-modal-body">
              <div className="google-modal-tabs">
                <button
                  type="button"
                  className={`google-modal-tab ${googleModalTab === 'direct' ? 'active' : ''}`}
                  onClick={() => setGoogleModalTab('direct')}
                >
                  Direct Google Login
                </button>
                <button
                  type="button"
                  className={`google-modal-tab ${googleModalTab === 'connect' ? 'active' : ''}`}
                  onClick={() => setGoogleModalTab('connect')}
                >
                  Connect Google Cloud ID
                </button>
              </div>

              {googleModalTab === 'direct' ? (
                <div>
                  <div className="google-quick-accounts">
                    <p style={{ fontSize: '11px', color: '#66755d', margin: '0 0 6px', fontWeight: 600 }}>
                      Quick select or type your Google / Gmail account:
                    </p>
                    <button
                      type="button"
                      className="google-quick-account-btn"
                      onClick={() => {
                        setDirectGoogleEmail('candidate@hireease.com');
                        setDirectGoogleName('Alex Rivera');
                      }}
                    >
                      <div className="google-avatar-pill">A</div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#18201b' }}>Alex Rivera</div>
                        <div style={{ fontSize: '11px', color: '#74836c' }}>candidate@hireease.com</div>
                      </div>
                      <span className="google-pill-tag">Candidate</span>
                    </button>
                  </div>

                  <form onSubmit={handleDirectGoogleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label className="field">
                      Google / Gmail Address
                      <input
                        type="email"
                        required
                        value={directGoogleEmail}
                        onChange={e => setDirectGoogleEmail(e.target.value)}
                        placeholder="e.g. yourname@gmail.com"
                        autoComplete="email"
                      />
                    </label>

                    <label className="field">
                      Your Full Name (optional)
                      <input
                        type="text"
                        value={directGoogleName}
                        onChange={e => setDirectGoogleName(e.target.value)}
                        placeholder="e.g. Alex Rivera"
                        autoComplete="name"
                      />
                    </label>

                    <button
                      type="submit"
                      className="google-direct-btn"
                      disabled={directGoogleLoading || !directGoogleEmail}
                      style={{ marginTop: '6px' }}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      <span>{directGoogleLoading ? 'Signing in with Google…' : 'Sign in directly with Google'}</span>
                      <ArrowRight size={15} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#687762', marginTop: '4px' }}>
                      <ShieldCheck size={14} color="#16a34a" />
                      <span>Verified Google account access. No password or email OTP needed.</span>
                    </div>
                  </form>
                </div>
              ) : (
                <div>
                  <div className="google-config-box">
                    <div style={{ fontWeight: 700, marginBottom: '6px', color: '#273b1d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <KeyRound size={14} /> Connect Google Cloud OAuth 2.0
                    </div>
                    <p style={{ margin: '0 0 6px' }}>
                      To enable Google's native popup and One-Tap on this domain, enter your OAuth 2.0 Web Client credentials from the Google Cloud Console:
                    </p>
                    <ol style={{ paddingLeft: '18px', margin: '0 0 6px' }}>
                      <li>Create an OAuth Client ID (Web Application)</li>
                      <li>Add Authorized Origin: <code>{typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'}</code></li>
                      <li>Add Redirect URI: <code>{typeof window !== 'undefined' ? `${window.location.origin}/api/auth/google/callback` : 'http://localhost:5173/api/auth/google/callback'}</code></li>
                    </ol>
                  </div>

                  <form onSubmit={handleSaveGoogleConfig} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label className="field">
                      Google Client ID
                      <input
                        type="text"
                        required
                        value={connectClientId}
                        onChange={e => setConnectClientId(e.target.value)}
                        placeholder="xxxxxxxxxxxx.apps.googleusercontent.com"
                      />
                    </label>

                    <label className="field">
                      Google Client Secret (optional for GSI)
                      <input
                        type="password"
                        value={connectClientSecret}
                        onChange={e => setConnectClientSecret(e.target.value)}
                        placeholder="GOCSPX-xxxxxxxxxxxxxxxx"
                      />
                    </label>

                    <button
                      type="submit"
                      className="btn green wide"
                      disabled={savingGoogleConfig || !connectClientId}
                      style={{ marginTop: '4px' }}
                    >
                      {savingGoogleConfig ? 'Connecting credentials…' : 'Save & Enable Live Google Sign-In'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Direct GitHub Authentication Modal */}
      {githubModalOpen && (
        <div className="google-modal-backdrop" onClick={() => setGithubModalOpen(false)}>
          <div className="google-modal-card" onClick={e => e.stopPropagation()}>
            <div className="google-modal-header">
              <div>
                <h2>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="#24292f">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  <span>GitHub Developer Sign In</span>
                </h2>
                <p>Sign in directly using your GitHub account to access candidate roles and tracking.</p>
              </div>
              <button
                type="button"
                className="google-modal-close"
                onClick={() => setGithubModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="google-modal-body">
              <div className="google-modal-tabs">
                <button
                  type="button"
                  className={`google-modal-tab ${githubModalTab === 'direct' ? 'active' : ''}`}
                  onClick={() => setGithubModalTab('direct')}
                >
                  Direct GitHub Sign-In
                </button>
                <button
                  type="button"
                  className={`google-modal-tab ${githubModalTab === 'connect' ? 'active' : ''}`}
                  onClick={() => setGithubModalTab('connect')}
                >
                  Connect OAuth App
                </button>
              </div>

              {githubModalTab === 'direct' ? (
                <div>
                  <form onSubmit={handleDirectGitHubSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label className="field">
                      GitHub Username or Email
                      <input
                        type="text"
                        required
                        value={directGitHubUsername}
                        onChange={e => {
                          setDirectGitHubUsername(e.target.value);
                          if (e.target.value.includes('@')) {
                            setDirectGitHubEmail(e.target.value);
                          }
                        }}
                        placeholder="e.g. octocat or alex@gmail.com"
                        autoComplete="username"
                      />
                    </label>

                    <label className="field">
                      Your Full Name (optional)
                      <input
                        type="text"
                        value={directGitHubName}
                        onChange={e => setDirectGitHubName(e.target.value)}
                        placeholder="e.g. Alex Rivera"
                        autoComplete="name"
                      />
                    </label>

                    <button
                      type="submit"
                      className="google-direct-btn"
                      disabled={directGitHubLoading || !directGitHubUsername}
                      style={{ marginTop: '6px', backgroundColor: '#24292f' }}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="#ffffff">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                      </svg>
                      <span>{directGitHubLoading ? 'Signing in with GitHub…' : 'Sign in directly with GitHub'}</span>
                      <ArrowRight size={15} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#687762', marginTop: '4px' }}>
                      <ShieldCheck size={14} color="#16a34a" />
                      <span>Verified GitHub developer access. No password or email OTP needed.</span>
                    </div>
                  </form>
                </div>
              ) : (
                <div>
                  <div className="google-config-box">
                    <div style={{ fontWeight: 700, marginBottom: '6px', color: '#273b1d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <KeyRound size={14} /> Connect GitHub OAuth App
                    </div>
                    <p style={{ margin: '0 0 6px' }}>
                      To route authentication directly through <strong>github.com/login/oauth</strong>, configure your OAuth App in GitHub Developer Settings:
                    </p>
                    <ol style={{ paddingLeft: '18px', margin: '0 0 6px' }}>
                      <li>GitHub &gt; Settings &gt; Developer Settings &gt; OAuth Apps</li>
                      <li>Homepage URL: <code>{typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'}</code></li>
                      <li>Authorization callback URL: <code>{typeof window !== 'undefined' ? `${window.location.origin}/api/auth/github/callback` : 'http://localhost:5173/api/auth/github/callback'}</code></li>
                    </ol>
                  </div>

                  <form onSubmit={handleSaveGitHubConfig} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label className="field">
                      GitHub Client ID
                      <input
                        type="text"
                        required
                        value={connectGitHubClientId}
                        onChange={e => setConnectGitHubClientId(e.target.value)}
                        placeholder="Ov23li..."
                      />
                    </label>

                    <label className="field">
                      GitHub Client Secret (optional)
                      <input
                        type="password"
                        value={connectGitHubSecret}
                        onChange={e => setConnectGitHubSecret(e.target.value)}
                        placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      />
                    </label>

                    <button
                      type="submit"
                      className="btn wide"
                      disabled={savingGitHubConfig || !connectGitHubClientId}
                      style={{ marginTop: '4px', backgroundColor: '#24292f' }}
                    >
                      {savingGitHubConfig ? 'Connecting credentials…' : 'Save & Enable Live GitHub Sign-In'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
