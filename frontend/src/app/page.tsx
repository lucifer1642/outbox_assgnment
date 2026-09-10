'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { FullPageLoader } from '@/components/ui/LoadingState';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [dispatchedCount, setDispatchedCount] = useState(0);
  const countRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  // Animated Counter (matching concept script)
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const target = 1955;

    if (prefersReducedMotion) {
      setDispatchedCount(target);
      return;
    }

    let start: number | null = null;
    const duration = 1200;
    let animationFrameId: number;

    function step(ts: number) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDispatchedCount(Math.round(eased * target));
      if (p < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    }

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  if (loading) return <FullPageLoader message="Loading ReachInbox…" />;

  return (
    <>
      {/* ── Background Mesh & Noise ────────────────────────────── */}
      <div className="mesh">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      <div className="noise"></div>

      {/* ── Sticky Top Navigation ──────────────────────────────── */}
      <nav>
        <div className="nav-inner">
          <Link href="/" className="brand" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="brand-mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="#0b0c10" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 11 14 10 22 21 10 13 10 13 2" />
              </svg>
            </div>
            <span className="brand-name">ReachInbox</span>
            <span className="brand-badge">OUTBOX</span>
          </Link>

          <div className="nav-links">
            <a href="#capabilities">Features</a>
            <a href="#flow">Architecture</a>
            <a href="#metrics">Metrics</a>
          </div>

          <div className="nav-right">
            <div className="uptime">
              <span className="dot"></span>
              99.99% uptime
            </div>
            <Link href="/login" className="btn btn-primary">
              <span>Launch dashboard</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section with Flagship Dashboard Preview ──────── */}
      <header className="hero">
        <div className="hero-inner wrap">
          <span className="eyebrow-badge glass">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />
            </svg>
            BullMQ &amp; Redis outbox infrastructure · v2.4
          </span>

          <h1>Schedule and send email campaigns reliably, at scale</h1>

          <p className="hero-sub">
            Sliding-window sender rate limiting, persistent BullMQ queues, and real-time Slack alerts — built for high-volume email workflows.
          </p>

          <div className="hero-cta">
            <Link href="/login" className="btn btn-primary" style={{ padding: '12px 22px' }}>
              <span style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#fff',
                color: '#0b0c10',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontSize: '11px',
                fontWeight: 700,
              }}>
                G
              </span>
              <span>Get started with Google</span>
            </Link>

            <a href="#flow" className="btn btn-ghost" style={{ padding: '12px 22px' }}>
              <span>View architecture</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 6 15 12 9 18" />
              </svg>
            </a>
          </div>

          <div className="trust-row">
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              BullMQ Redis queue
            </span>
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Sliding-window limiter
            </span>
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Slack webhooks
            </span>
          </div>
        </div>

        {/* ── Glass Flagship Mockup ────────────────────────────── */}
        <div className="dash-shell">
          <div className="dash glass-flagship">
            <div className="dash-topbar">
              <div className="dash-topbar-left">
                <div className="traffic">
                  <i></i><i></i><i></i>
                </div>
                <span className="dash-path">cluster.us-east.reachinbox</span>
              </div>
              <div className="dash-status">
                <span><span className="status-dot"></span>Redis live · 2ms</span>
                <span><span className="status-dot pulse"></span>BullMQ active</span>
              </div>
            </div>

            <div className="stat-grid">
              <div className="stat">
                <div className="stat-label">Dispatched (24h)</div>
                <div className="stat-value up" ref={countRef}>
                  {dispatchedCount.toLocaleString()}
                </div>
                <div className="stat-sub pos">+14%</div>
              </div>
              <div className="stat">
                <div className="stat-label">Pending in queue</div>
                <div className="stat-value">84 jobs</div>
                <div className="stat-sub">Scheduled</div>
              </div>
              <div className="stat">
                <div className="stat-label">Deliverability</div>
                <div className="stat-value mint">99.98%</div>
                <div className="stat-sub">0 bounces</div>
              </div>
              <div className="stat">
                <div className="stat-label">Rate-limit window</div>
                <div className="stat-value">100 / hr</div>
                <div className="stat-sub">Safe</div>
              </div>
            </div>

            <table className="dash-table">
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Subject</th>
                  <th>Scheduled</th>
                  <th style={{ textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="mono">alex.chen@stripe.com</td>
                  <td>Product architecture review</td>
                  <td className="mono">In 2 mins</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="pill pending"><i></i>Pending</span>
                  </td>
                </tr>
                <tr>
                  <td className="mono">sarah.k@figma.com</td>
                  <td>Enterprise SLA tier</td>
                  <td className="mono">In 14 mins</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="pill scheduled"><i></i>Scheduled</span>
                  </td>
                </tr>
                <tr>
                  <td className="mono">david.m@linear.app</td>
                  <td>BullMQ outbox scaling</td>
                  <td className="mono">Just now</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="pill sent"><i></i>Sent</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="dash-footer"></div>
          </div>
        </div>
      </header>

      {/* ── Capabilities Section ──────────────────────────────── */}
      <section id="capabilities">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">Core capabilities</div>
            <h2>Engineered for zero email drops</h2>
            <p className="section-sub">Robust outbox primitives protecting your sender reputation.</p>
          </div>

          <div className="cap-grid">
            <div className="cap-card glass">
              <div className="icon-badge v">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <polyline points="12 7 12 12 15.5 14" />
                </svg>
              </div>
              <h3>BullMQ distributed queue</h3>
              <p>Redis-backed queue orchestration with automatic delayed job timers, retry policies, and concurrency control.</p>
              <div className="cap-foot">
                <span className="k">Delayed job buffer</span>
                <span className="v active">Active</span>
              </div>
            </div>

            <div className="cap-card glass">
              <div className="icon-badge t">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
                </svg>
              </div>
              <h3>Sliding-window limiter</h3>
              <p>Per-sender hourly rate limiting automatically reschedules burst jobs to prevent email provider spam penalties.</p>
              <div className="cap-foot">
                <span className="k">Window size · 3600s</span>
                <span className="v">Auto-spread</span>
              </div>
            </div>

            <div className="cap-card glass">
              <div className="icon-badge a">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                </svg>
              </div>
              <h3>Instant Slack alerts</h3>
              <p>Automated webhook alerts trigger instantly whenever queue bottlenecks or rate-limit thresholds occur.</p>
              <div className="cap-foot">
                <span className="k">#email-alerts</span>
                <span className="v link">Webhook live</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Architecture Flow Section ─────────────────────────── */}
      <section id="flow">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">Architecture flow</div>
            <h2>How email jobs are processed</h2>
          </div>

          <div className="flow-wrap">
            <div className="flow-line"></div>
            <div className="flow-grid">
              <div className="flow-step glass">
                <span className="flow-num">01</span>
                <div className="flow-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <h4>Ingest &amp; validate</h4>
                <p>Single forms or CSV batches are validated and recorded to PostgreSQL.</p>
              </div>

              <div className="flow-step glass">
                <span className="flow-num">02</span>
                <div className="flow-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                </div>
                <h4>BullMQ buffer</h4>
                <p>Jobs are enqueued into Redis with delay offsets and automatic retry math.</p>
              </div>

              <div className="flow-step glass">
                <span className="flow-num">03</span>
                <div className="flow-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
                  </svg>
                </div>
                <h4>Rate limiter guard</h4>
                <p>Worker verifies the hourly token bucket and reschedules jobs safely if saturated.</p>
              </div>

              <div className="flow-step glass">
                <span className="flow-num">04</span>
                <div className="flow-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                  </svg>
                </div>
                <h4>Dispatch &amp; Slack</h4>
                <p>Emails are dispatched via SMTP with real-time Slack status webhooks.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Metrics Strip Section ─────────────────────────────── */}
      <section id="metrics" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="metrics-strip glass">
            <div className="metric-cell">
              <div className="metric-value">99.99%</div>
              <div className="metric-label">System uptime</div>
            </div>
            <div className="metric-cell">
              <div className="metric-value">0ms</div>
              <div className="metric-label">Queue lag</div>
            </div>
            <div className="metric-cell">
              <div className="metric-value">100/hr</div>
              <div className="metric-label">Per-sender rate limit</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer>ReachInbox Outbox — Production-Grade Email Infrastructure</footer>
    </>
  );
}
