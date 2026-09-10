'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { FullPageLoader } from '@/components/ui/LoadingState';
import { ArrowLeft, AlertCircle, ShieldCheck, Lock, Sparkles } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function LoginContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const handleGoogleLogin = () => {
    setIsRedirecting(true);
    window.location.href = `${API_BASE}/auth/google`;
  };

  if (loading || (user && !loading)) {
    return <FullPageLoader message="Checking session…" />;
  }

  return (
    <main className="min-h-screen flex items-center justify-center relative px-4 py-12">
      {/* ── Background Mesh & Noise ────────────────────────────── */}
      <div className="mesh">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      <div className="noise"></div>

      {/* ── Center Login Card ──────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-[440px]">
        <div className="glass-flagship p-8 sm:p-10 rounded-[28px] text-center flex flex-col items-center">
          {/* Logo Mark */}
          <Link href="/" className="brand-mark mb-5" style={{ width: '44px', height: '44px', borderRadius: '12px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#0b0c10" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ width: '22px', height: '22px' }}>
              <polygon points="13 2 3 14 11 14 10 22 21 10 13 10 13 2" />
            </svg>
          </Link>

          {/* Eyebrow & Title */}
          <div className="mb-7 space-y-1.5">
            <span className="eyebrow-badge glass" style={{ marginBottom: '12px' }}>
              <Sparkles size={12} style={{ color: 'var(--violet)' }} />
              Single Sign-On · v2.4
            </span>
            <h1 style={{ fontSize: '26px', marginBottom: '8px' }}>Welcome to ReachInbox</h1>
            <p className="hero-sub" style={{ fontSize: '14px', marginBottom: 0, lineHeight: 1.5 }}>
              Sign in with Google to access your outbox campaign scheduler and queues.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              className="w-full flex items-center gap-2.5 p-3 rounded-xl mb-5 text-xs text-left"
              style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: 'var(--coral)' }}
            >
              <AlertCircle size={15} className="shrink-0" />
              <span>Authentication cancelled or failed. Please try again.</span>
            </div>
          )}

          {/* Google SSO Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isRedirecting}
            className="w-full btn btn-primary flex items-center justify-center gap-3 py-3 px-6 text-sm"
            style={{
              padding: '13px 20px',
              fontSize: '14.5px',
              width: '100%',
              justifyContent: 'center',
              borderRadius: '14px',
            }}
          >
            {isRedirecting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-[#0b0c10]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-85" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Redirecting to Google…</span>
              </>
            ) : (
              <>
                <span style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#fff',
                  color: '#0b0c10',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-display)',
                  fontSize: '12px',
                  fontWeight: 700,
                }}>
                  G
                </span>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Security Trust Strip */}
          <div className="w-full mt-7 pt-5 border-t border-white/[0.06] flex items-center justify-center gap-4 text-xs font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1.5">
              <Lock size={12} style={{ color: 'var(--violet)' }} />
              OAuth 2.0 PKCE
            </span>
            <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--text-muted)' }}></span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={12} style={{ color: 'var(--mint)' }} />
              Zero Secrets Stored
            </span>
          </div>

          {/* Back Link */}
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-1.5 text-xs transition-colors"
            style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <ArrowLeft size={13} />
            Back to landing page
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<FullPageLoader message="Loading ReachInbox…" />}>
      <LoginContent />
    </Suspense>
  );
}
