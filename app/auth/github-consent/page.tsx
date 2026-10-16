"use client";

import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { ShieldCheck, ArrowRight, KeyRound } from 'lucide-react';

function GitHubConsentInner() {
  const searchParams = useSearchParams();
  const state = searchParams.get('state') || '';
  const [tab, setTab] = useState<'signin' | 'connect'>('signin');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectMessage, setConnectMessage] = useState('');

  function proceedWithAccount(targetEmail: string, targetName: string) {
    if (!targetEmail) return;
    const dest = new URL('/api/auth/github/callback', window.location.origin);
    dest.searchParams.set('code', 'sim_github_' + Math.random().toString(36).slice(2, 8));
    dest.searchParams.set('state', state);
    dest.searchParams.set('email', targetEmail);
    dest.searchParams.set('name', targetName || targetEmail.split('@')[0]);
    window.location.href = dest.toString();
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    const resolvedEmail = email || (username ? `${username.toLowerCase()}@github.com` : '');
    if (resolvedEmail) {
      proceedWithAccount(resolvedEmail, name || username || resolvedEmail.split('@')[0]);
    }
  }

  async function handleConnectConfig(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) return;
    setConnecting(true);
    setConnectMessage('');
    try {
      const res = await fetch('/api/auth/github/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, clientSecret })
      });
      const data: any = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save GitHub Client ID.');
      setConnectMessage('GitHub OAuth configured! Redirecting to GitHub...');
      setTimeout(() => {
        window.location.href = '/api/auth/github';
      }, 800);
    } catch (err: any) {
      setConnectMessage(err.message || 'Error connecting GitHub credentials.');
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
        {/* GitHub Logo Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="#24292f">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#18201b', margin: 0 }}>
              Sign in with GitHub
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
            Direct GitHub Sign-In
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
            Connect OAuth App
          </button>
        </div>

        {tab === 'signin' ? (
          <div>
            <form onSubmit={handleCustomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#18201b' }}>
                  GitHub Username or Email:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. octocat or user@gmail.com"
                  value={username}
                  onChange={e => {
                    setUsername(e.target.value);
                    if (e.target.value.includes('@')) {
                      setEmail(e.target.value);
                    }
                  }}
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
                  Your Full Name (optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Rivera"
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
                  backgroundColor: '#24292f',
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
                Sign in with this GitHub Account <ArrowRight size={16} />
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
                <span>Instant verified GitHub developer access. No password or OTP needed.</span>
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
                <KeyRound size={14} /> Connect GitHub OAuth App
              </div>
              <p style={{ margin: '0 0 6px' }}>
                To route authentication directly through <strong>github.com/login/oauth</strong>, create an OAuth App in GitHub Settings:
              </p>
              <ol style={{ paddingLeft: '18px', margin: 0 }}>
                <li>GitHub &gt; Settings &gt; Developer Settings &gt; OAuth Apps</li>
                <li>Homepage URL: <code>{typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'}</code></li>
                <li>Authorization callback URL: <code>{typeof window !== 'undefined' ? `${window.location.origin}/api/auth/github/callback` : 'http://localhost:5173/api/auth/github/callback'}</code></li>
              </ol>
            </div>

            <form onSubmit={handleConnectConfig} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#18201b' }}>
                  GitHub Client ID:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ov23li..."
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
                  GitHub Client Secret (optional):
                </label>
                <input
                  type="password"
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
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
                  backgroundColor: '#24292f',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '14px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                {connecting ? 'Saving configuration...' : 'Save & Enable Live GitHub Sign-In'}
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

export default function GitHubConsentPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '50px', color: '#52604b' }}>Loading GitHub Authentication...</div>}>
      <GitHubConsentInner />
    </Suspense>
  );
}
