"use client";

import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { ShieldCheck, ArrowRight, User } from 'lucide-react';

function LinkedInConsentInner() {
  const searchParams = useSearchParams();
  const state = searchParams.get('state') || '';
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [useOther, setUseOther] = useState(false);

  function proceedWithAccount(email: string, name: string) {
    if (!email) return;
    const dest = new URL('/api/auth/linkedin/callback', window.location.origin);
    dest.searchParams.set('code', 'sim_linkedin_' + Math.random().toString(36).slice(2, 8));
    dest.searchParams.set('state', state);
    dest.searchParams.set('email', email);
    dest.searchParams.set('name', name);
    window.location.href = dest.toString();
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (customEmail) {
      proceedWithAccount(customEmail, customName || customEmail.split('@')[0]);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#050914',
      padding: '20px',
      fontFamily: 'inherit'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#0b1329',
        border: '1px solid #1a2744',
        borderRadius: '16px',
        padding: '36px 32px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
      }}>
        {/* LinkedIn Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <svg viewBox="0 0 24 24" width="28" height="28" fill="#0A66C2">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.3a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28Z"/>
          </svg>
          <span style={{ fontSize: '18px', fontWeight: '600', color: '#f1f5f9' }}>LinkedIn</span>
        </div>

        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: '0 0 8px 0' }}>
          Sign in as Candidate
        </h1>
        <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 24px 0' }}>
          Connect your LinkedIn identity to <strong style={{ color: '#38bdf8' }}>HireEase Services</strong>
        </p>

        {/* Account Choices */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          <button
            onClick={() => proceedWithAccount('candidate@hireease.com', 'Alex Rivera')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '10px',
              color: '#f8fafc',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: 'rgba(10, 102, 194, 0.2)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '15px'
              }}>
                A
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>Alex Rivera</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>candidate@hireease.com</div>
              </div>
            </div>
            <span style={{
              fontSize: '11px',
              fontWeight: '600',
              padding: '3px 8px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              color: '#4ade80',
              border: '1px solid rgba(34, 197, 94, 0.3)'
            }}>
              Candidate Profile
            </span>
          </button>

          {!useOther ? (
            <button
              onClick={() => setUseOther(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                backgroundColor: 'transparent',
                border: '1px dashed #334155',
                borderRadius: '10px',
                color: '#94a3b8',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <User size={18} />
              <span style={{ fontSize: '13px' }}>Use another LinkedIn account...</span>
            </button>
          ) : (
            <form onSubmit={handleCustomSubmit} style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="email"
                placeholder="Enter your LinkedIn account email"
                required
                value={customEmail}
                onChange={e => setCustomEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: '#070d1e',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <input
                type="text"
                placeholder="Full name (optional)"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: '#070d1e',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '10px',
                  backgroundColor: '#0A66C2',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                Sign in with LinkedIn <ArrowRight size={14} />
              </button>
            </form>
          )}
        </div>

        <div style={{
          borderTop: '1px solid #162444',
          paddingTop: '16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          color: '#64748b',
          fontSize: '12px',
          lineHeight: '1.5'
        }}>
          <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#0A66C2' }} />
          <span>
            Candidate OAuth redirect active. Automatically authenticates without OTP and opens the Candidate Panel. Connecting <code>LINKEDIN_CLIENT_ID</code> and <code>LINKEDIN_CLIENT_SECRET</code> in <code>.env</code> routes to linkedin.com.
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LinkedInConsentPage() {
  return (
    <Suspense fallback={<div style={{ color: '#fff', textAlign: 'center', padding: '50px' }}>Loading LinkedIn Authentication...</div>}>
      <LinkedInConsentInner />
    </Suspense>
  );
}
