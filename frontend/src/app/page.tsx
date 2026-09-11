'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/lib/api';
import './landing.css';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const handleGoogleLogin = () => {
    if (user) {
      router.push('/dashboard');
    } else {
      window.location.href = `${API_BASE}/auth/google`;
    }
  };

  return (
    <div className="manifest-body">
      <div className="manifest-frame">
        {/* Corner Crop Marks */}
        <span className="crop tl"></span>
        <span className="crop tr"></span>
        <span className="crop bl"></span>
        <span className="crop br"></span>

        {/* Header Strip */}
        <div className="header-strip">
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

        {/* Hero Section */}
        <div className="hero-grid">
          {/* Left Column: Headline, Manifest Table, Capabilities */}
          <div className="hero-left">
            <div className="eyebrow">Dispatch manifest — enterprise email infrastructure</div>

            <h1 className="headline">
              Scale cold email dispatch without<br />
              <span className="dimension">
                rate-limit bans
                <span className="bracket"></span>
              </span>.
            </h1>

            <p className="lede">
              Engineered with BullMQ, Redis, PostgreSQL, and Elasticsearch. Guaranteed delivery pacing, automatic reconciliation, and zero credential exposure.
            </p>

            {/* Manifest Table */}
            <div className="manifest">
              <div className="manifest-head">
                <span className="title">Queue manifest</span>
                <span className="live">
                  <span className="dot"></span>
                  live
                </span>
              </div>
              <div className="manifest-row">
                <span className="tick"></span>
                <span className="label">Throttling</span>
                <span className="value">2000ms delay</span>
                <span className="note">sliding window</span>
              </div>
              <div className="manifest-row">
                <span className="tick"></span>
                <span className="label">Concurrency</span>
                <span className="value">5 workers</span>
                <span className="note">auto-scaling</span>
              </div>
              <div className="manifest-row">
                <span className="tick"></span>
                <span className="label">Hourly cap</span>
                <span className="value">200 / sender</span>
                <span className="note">domain-safe</span>
              </div>
              <div className="manifest-row">
                <span className="tick"></span>
                <span className="label">Search engine</span>
                <span className="value">&lt;15ms query</span>
                <span className="note">elasticsearch v8</span>
              </div>
            </div>

            {/* Capability List */}
            <div className="capabilities">
              <div className="cap-row">
                <span className="cap-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" strokeLinejoin="round" />
                  </svg>
                </span>
                <div className="cap-text">
                  <h3>High-throughput scheduler</h3>
                  <p>BullMQ and Redis powered persistent queues with millisecond dispatch precision.</p>
                </div>
              </div>
              <div className="cap-row">
                <span className="cap-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="8" />
                    <path d="M12 8v4l2.5 2.5" strokeLinecap="round" />
                  </svg>
                </span>
                <div className="cap-text">
                  <h3>Smart anti-spam throttling</h3>
                  <p>Configurable hourly rate limits and delay pacing to preserve sender reputation.</p>
                </div>
              </div>
              <div className="cap-row">
                <span className="cap-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="10" cy="10" r="6" />
                    <path d="M19 19l-4.3-4.3" strokeLinecap="round" />
                  </svg>
                </span>
                <div className="cap-text">
                  <h3>Full-text Elasticsearch</h3>
                  <p>Sub-second search across campaign subjects, bodies, and recipient archives.</p>
                </div>
              </div>
              <div className="cap-row">
                <span className="cap-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="4" y="5" width="16" height="5" rx="1" />
                    <rect x="4" y="14" width="16" height="5" rx="1" />
                  </svg>
                </span>
                <div className="cap-text">
                  <h3>Slack real-time telemetry</h3>
                  <p>Instant webhooks for completed dispatches, hourly quotas, and error alerts.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Ticket / Sign In */}
          <div className="hero-right">
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
                  Sign in with your authorized Google workspace to access campaign schedules, queues, and real-time telemetry.
                </p>
                <button
                  onClick={handleGoogleLogin}
                  className="google-btn"
                >
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
                  {user ? 'Open Cluster Dashboard' : 'Continue with Google'}
                </button>
                <p className="terms">By continuing, you agree to ReachInbox&apos;s Terms of Service and Privacy Policy.</p>
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
    </div>
  );
}
