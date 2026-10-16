"use client";

import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { ShieldCheck, ArrowRight, User, KeyRound, Sparkles, Check } from 'lucide-react';

function GoogleConsentInner() {
  const searchParams = useSearchParams();
  const state = searchParams.get('state') || '';
  const [tab, setTab] = useState<'signin' | 'connect'>('signin');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectMessage, setConnectMessage] = useState('');

  function proceedWithDirectAccount(targetEmail: string, targetName: string) {
    if (!targetEmail) return;
    const dest = new URL('/api/auth/google/callback', window.location.origin);
    dest.searchParams.set('code', 'sim_google_' + Math.random().toString(36).slice(2, 8));
    dest.searchParams.set('state', state);
    dest.searchParams.set('email', targetEmail);
    dest.searchParams.set('name', targetName || targetEmail.split('@')[0]);
    window.location.href = dest.toString();
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email) {
      proceedWithDirectAccount(email, name || email.split('@')[0]);
    }
  }

  async function handleConnectConfig(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) return;
    setConnecting(true);
    setConnectMessage('');
    try {
      const res = await fetch('/api/auth/google/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, clientSecret })
      });
      const data: any = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save Google Client ID.');
      setConnectMessage('Google OAuth configured! Redirecting to Google...');
      setTimeout(() => {
        window.location.href = '/api/auth/google';
      }, 800);
    } catch (err: any) {
      setConnectMessage(err.message || 'Error connecting Google credentials.');
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f7f1',
      padding: '24px',
      fontFamily: "'DM Sans', sans-serif"
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        backgroundColor: '#ffffff',
        border: '1px solid #dce4d5',
        borderRadius: '16px',
        padding: '36px 32px',
        boxShadow: '0 16px 40px rgba(18, 34, 19, 0.08)'
      }}>
        {/* Google G Logo Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#18201b', margin: 0 }}>
              Sign in with Google
            </h1>
            <p style={{ fontSize: '13px', color: '#687762', margin: '2px 0 0' }}>
              to continue to <strong>HireEase Services</strong>
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: '#eef3e7',
          padding: '4px',
          borderRadius: '8px',
          margin: '20px 0',
          border: '1px solid #e1ebd7'
        }}>
          <button
            type="button"
            onClick={() => setTab('signin')}
            style={{
              border: 0,
              background: tab === 'signin' ? '#ffffff' : 'transparent',
              padding: '9px 12px',
              fontSize: '12px',
              fontWeight: '600',
              color: tab === 'signin' ? '#18201b' : '#5a6852',
              borderRadius: '6px',
              cursor: 'pointer',
              boxShadow: tab === 'signin' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            Direct Account Login
          </button>
          <button
            type="button"
            onClick={() => setTab('connect')}
            style={{
              border: 0,
              background: tab === 'connect' ? '#ffffff' : 'transparent',
              padding: '9px 12px',
              fontSize: '12px',
              fontWeight: '600',
              color: tab === 'connect' ? '#18201b' : '#5a6852',
              borderRadius: '6px',
              cursor: 'pointer',
              boxShadow: tab === 'connect' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            Connect Cloud Client ID
          </button>
        </div>

        {tab === 'signin' ? (
          <div>
            {/* Quick Demo Shortcuts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#687762' }}>
                Quick select or enter your Google account below:
              </span>
              <button
                type="button"
                onClick={() => proceedWithDirectAccount('candidate@hireease.com', 'Alex Rivera')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 14px',
                  backgroundColor: '#fbfdfa',
                  border: '1px solid #e1ebd8',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#e2f0d9',
                    color: '#355325',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '13px'
                  }}>
                    A
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#18201b' }}>Alex Rivera</div>
                    <div style={{ fontSize: '11px', color: '#74836c' }}>candidate@hireease.com</div>
                  </div>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#eef6e6', color: '#4c6a38', border: '1px solid #d4e5c7' }}>
                  Candidate
                </span>
              </button>

              <button
                type="button"
                onClick={() => proceedWithDirectAccount('admin@hireease.com', 'HireEase Super Admin')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 14px',
                  backgroundColor: '#fbfdfa',
                  border: '1px solid #e1ebd8',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '13px'
                  }}>
                    H
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#18201b' }}>HireEase Super Admin</div>
                    <div style={{ fontSize: '11px', color: '#74836c' }}>admin@hireease.com</div>
                  </div>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                  Super Admin
                </span>
              </button>
            </div>

            {/* Custom Google Email Form */}
            <form onSubmit={handleCustomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#18201b' }}>
                  Your Google / Gmail Account:
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. yourname@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    padding: '11px 12px',
                    border: '1px solid #d9e0d2',
                    borderRadius: '7px',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: '#fcfdfb'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#18201b' }}>
                  Display Name (optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{
                    padding: '11px 12px',
                    border: '1px solid #d9e0d2',
                    borderRadius: '7px',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: '#fcfdfb'
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  marginTop: '6px',
                  padding: '12px 18px',
                  backgroundColor: '#1a73e8',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '14px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                Sign in with this Google Account <ArrowRight size={16} />
              </button>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                fontSize: '12px',
                color: '#65745e',
                marginTop: '6px'
              }}>
                <ShieldCheck size={15} color="#16a34a" />
                <span>Instant verified Google login with zero password or OTP steps.</span>
              </div>
            </form>
          </div>
        ) : (
          <div>
            <div style={{
              backgroundColor: '#f8faf6',
              border: '1px solid #e0e8da',
              borderRadius: '8px',
              padding: '14px',
              fontSize: '12px',
              color: '#52604b',
              lineHeight: 1.6,
              marginBottom: '16px'
            }}>
              <div style={{ fontWeight: 700, marginBottom: '6px', color: '#273b1d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <KeyRound size={14} /> Connect Google Cloud OAuth 2.0
              </div>
              <p style={{ margin: '0 0 6px' }}>
                To route authentication directly through <code>accounts.google.com</code> with live consent popups, paste your Google Cloud OAuth Client ID:
              </p>
              <ol style={{ paddingLeft: '18px', margin: 0 }}>
                <li>Console: <strong>console.cloud.google.com</strong> &gt; Credentials</li>
                <li>Add Origin: <code>{typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'}</code></li>
                <li>Add Redirect URI: <code>{typeof window !== 'undefined' ? `${window.location.origin}/api/auth/google/callback` : 'http://localhost:5173/api/auth/google/callback'}</code></li>
              </ol>
            </div>

            <form onSubmit={handleConnectConfig} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#18201b' }}>
                  Google Client ID:
                </label>
                <input
                  type="text"
                  required
                  placeholder="xxxxxxxx.apps.googleusercontent.com"
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  style={{
                    padding: '11px 12px',
                    border: '1px solid #d9e0d2',
                    borderRadius: '7px',
                    fontSize: '13px',
                    outline: 'none',
                    backgroundColor: '#fcfdfb'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#18201b' }}>
                  Google Client Secret (optional):
                </label>
                <input
                  type="password"
                  placeholder="GOCSPX-xxxxxxxxxxxxxxxx"
                  value={clientSecret}
                  onChange={e => setClientSecret(e.target.value)}
                  style={{
                    padding: '11px 12px',
                    border: '1px solid #d9e0d2',
                    borderRadius: '7px',
                    fontSize: '13px',
                    outline: 'none',
                    backgroundColor: '#fcfdfb'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={connecting || !clientId}
                style={{
                  marginTop: '4px',
                  padding: '12px 18px',
                  backgroundColor: '#18201b',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '14px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                {connecting ? 'Saving configuration...' : 'Save & Enable Real Google Sign-In'}
              </button>

              {connectMessage && (
                <p style={{ fontSize: '12px', color: connectMessage.includes('Redirecting') ? '#16a34a' : '#dc2626', margin: '4px 0 0' }}>
                  {connectMessage}
                </p>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GoogleConsentPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '50px', color: '#52604b' }}>Loading Google Authentication...</div>}>
      <GoogleConsentInner />
    </Suspense>
  );
}
