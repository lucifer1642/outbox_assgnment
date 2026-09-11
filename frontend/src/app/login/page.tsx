'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { FullPageLoader } from '@/components/ui/LoadingState';
import { API_BASE } from '@/lib/api';
import './login.css';

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
    <div className="login-page-body">
      {/* Top Header Strip */}
      <div className="login-header-strip">
        <Link href="/" className="wordmark">
          <span className="wordmark-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="wordmark-text">ReachInbox <span>Outbox</span></span>
        </Link>
        <div className="header-meta">
          <span>ref // RI-2026-0091</span>
          <span className="mdiv"></span>
          <span className="status">
            <span className="dot"></span>
            operational
          </span>
        </div>
      </div>

      {/* Main Stage */}
      <div className="stage">
        <div className="stage-inner">
          {/* Left: Departures-board status */}
          <div className="board">
            <div className="board-eyebrow">Dispatch manifest — access gate</div>
            <h1>One sender.<br />One inbox.<br />Clear runway.</h1>
            <p className="sub">
              Your queues keep running while you&apos;re away. Sign in to see what shipped, what&apos;s throttled, and what&apos;s next in line.
            </p>

            <div className="queue-table">
              <div className="queue-table-head">
                <span className="title">System status</span>
                <span className="live">
                  <span className="dot"></span>
                  live
                </span>
              </div>
              <div className="queue-row">
                <span className="tick"></span>
                <span className="label">Queued sends</span>
                <span className="value">1,204</span>
              </div>
              <div className="queue-row">
                <span className="tick"></span>
                <span className="label">Sent last hour</span>
                <span className="value">618</span>
              </div>
              <div className="queue-row">
                <span className="tick"></span>
                <span className="label">Workers active</span>
                <span className="value">5 / 5</span>
              </div>
            </div>
          </div>

          {/* Right: The ticket / sign-in */}
          <div className="ticket">
            <div className="ticket-top">
              <span className="stamp-badge">
                <span>verified<br />sender</span>
              </span>
              <div className="ticket-row">
                <span className="ticket-label">boarding pass</span>
                <span className="oauth-tag">OAuth 2.0</span>
              </div>
              <h2>Clear for dispatch</h2>
              <p className="sub">
                Sign in with your authorized Google workspace to reach your campaign queues and telemetry.
              </p>

              {error && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '4px',
                    marginBottom: '16px',
                    fontSize: '12px',
                    background: 'rgba(221,67,39,0.08)',
                    border: '1px solid rgba(221,67,39,0.25)',
                    color: 'var(--stamp)',
                  }}
                >
                  Authentication was not completed. Please try again with your Google account.
                </div>
              )}

              <button
                onClick={handleGoogleLogin}
                disabled={isRedirecting}
                className="google-btn"
                type="button"
              >
                {isRedirecting ? (
                  <>
                    <svg className="animate-spin" style={{ width: '15px', height: '15px' }} viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#fff" strokeWidth="3" />
                      <path className="opacity-75" fill="#fff" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Connecting to Google…</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24">
                      <path
                        fill="#fff"
                        d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.56-5.17 3.56-8.81z"
                        opacity=".9"
                      />
                      <path
                        fill="#fff"
                        d="M12 24c3.24 0 5.96-1.07 7.94-2.92l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1C3.25 21.3 7.31 24 12 24z"
                        opacity=".7"
                      />
                      <path
                        fill="#fff"
                        d="M5.27 14.27a7.2 7.2 0 010-4.54v-3.1H1.27a12 12 0 000 10.74l4-3.1z"
                        opacity=".55"
                      />
                      <path
                        fill="#fff"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.63l4 3.1C6.22 6.87 8.87 4.75 12 4.75z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              <p className="terms">
                By continuing, you agree to ReachInbox&apos;s <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
              </p>
            </div>

            <div className="perforation"></div>

            <div className="ticket-stub">
              <div className="barcode"></div>
              <div className="tracking">RI-OUTBOX-778241</div>
              <div className="trust-row">
                <span className="trust-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Zero secrets
                </span>
                <span className="trust-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  TLS 1.3
                </span>
                <span className="trust-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Direct OAuth
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Strip */}
      <div className="footer-strip">
        <span>© 2026 ReachInbox Outbox System — production deployment</span>
        <div className="stack-list">
          <span>BullMQ 5.7</span>
          <span className="sep"></span>
          <span>Elasticsearch 8.11</span>
          <span className="sep"></span>
          <span>PostgreSQL 15</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<FullPageLoader message="Loading ReachInbox…" />}>
      <LoginContent />
    </Suspense>
  );
}
