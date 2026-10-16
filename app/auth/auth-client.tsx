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
  const [resending, setResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [formError, setFormError] = useState('');

  // Google Config State
  const [googleConfig, setGoogleConfig] = useState<{ configured: boolean; clientId: string | null }>({ configured: false, clientId: null });



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
    setGoogleLoading(true);
    window.location.href = '/api/auth/google';
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
                  disabled={googleLoading}
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




    </div>
  );
}
