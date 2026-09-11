'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { slackApi, API_BASE } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { FullPageLoader } from '@/components/ui/LoadingState';
import {
  ArrowLeft,
  CheckCircle2,
  Unplug,
  AlertCircle,
  ExternalLink,
  Zap,
  Bell,
  Shield,
  Send,
  Copy,
  Check,
  Terminal,
  RefreshCw,
  Clock,
  Sliders,
  Webhook,
  Mail,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function IntegrationsPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [slackConnected, setSlackConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [activePayloadTab, setActivePayloadTab] = useState<'rate_limit' | 'job_dispatched' | 'worker_failed'>('rate_limit');
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Notification toggle states
  const [notifications, setNotifications] = useState({
    rateLimitWarning: true,
    jobFailure: true,
    batchComplete: false,
    reconciliation: true,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/login';
    }
  }, [authLoading, user]);

  useEffect(() => {
    slackApi
      .getStatus()
      .then((res) => setSlackConnected(res.connected))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Check for Slack OAuth callback in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('slack') === 'connected') {
      setSlackConnected(true);
      showToast('success', 'Slack workspace connected successfully.');
      window.history.replaceState({}, '', '/settings/integrations');
    } else if (params.get('slack') === 'error') {
      showToast('error', 'Couldn\'t connect Slack. Try again.');
      window.history.replaceState({}, '', '/settings/integrations');
    }
  }, [showToast]);

  const handleDisconnect = async () => {
    if (!window.confirm('Rate-limit alerts will stop. Disconnect Slack workspace?')) return;
    setDisconnecting(true);
    try {
      await slackApi.disconnect();
      setSlackConnected(false);
      showToast('success', 'Slack workspace disconnected.');
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Failed to disconnect Slack.');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSendTestAlert = () => {
    setIsSendingTest(true);
    setTimeout(() => {
      setIsSendingTest(false);
      if (slackConnected) {
        showToast('success', 'Test incident alert dispatched to your Slack channel!');
      } else {
        showToast('info', 'Simulation: Test alert generated (Connect Slack for live delivery).');
      }
    }, 800);
  };

  const payloads = {
    rate_limit: {
      event: 'rate_limit.approaching',
      timestamp: new Date().toISOString(),
      sender: user?.email || 'outbox-sender@reachinbox.ai',
      metrics: {
        sent_in_current_hour: 185,
        hourly_threshold: 200,
        quota_utilization: '92.5%',
      },
      action: 'sliding_window_delay_applied_2000ms',
      cluster: 'us-east.reachinbox.internal',
    },
    job_dispatched: {
      event: 'email.dispatched',
      timestamp: new Date().toISOString(),
      job_id: 'job_bullmq_89412a8f',
      recipient: 'prospect@enterprise.corp',
      sender: user?.email || 'campaign@reachinbox.ai',
      latency_ms: 18.4,
      delivery_protocol: 'TLS_1.3_SMTP',
    },
    worker_failed: {
      event: 'worker.retry_exhausted',
      timestamp: new Date().toISOString(),
      job_id: 'job_bullmq_failed_992a',
      reason: 'SMTP connection timeout after 3 exponential backoff attempts',
      retry_count: 3,
      reconciliation_status: 'flagged_for_investigation',
    },
  };

  const handleCopyPayload = () => {
    const text = JSON.stringify(payloads[activePayloadTab], null, 2);
    navigator.clipboard.writeText(text);
    setCopiedPayload(true);
    showToast('success', 'Payload copied to clipboard');
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText('whsec_7f9c2d1b8e4a3f6e9b0d2c5a1f8e4b7c');
    setCopiedSecret(true);
    showToast('success', 'Webhook signing secret copied');
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  if (authLoading) return <FullPageLoader message="Loading cluster settings…" />;
  if (!user) return null;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg, #08090b)',
        backgroundImage:
          'radial-gradient(ellipse 900px 500px at 20% -10%, rgba(255, 157, 77, 0.05), transparent 60%), radial-gradient(ellipse 700px 500px at 100% 0%, rgba(52, 211, 153, 0.04), transparent 55%)',
        color: 'var(--text, #e8eaed)',
        fontFamily: 'var(--font-sans, "Inter", sans-serif)',
        paddingBottom: '60px',
      }}
    >
      {/* ── Topbar / Header ───────────────────────────────────── */}
      <header
        style={{
          background: 'var(--sidebar, #0a0b0d)',
          borderBottom: '1px solid var(--border, #1c2027)',
          padding: '0 24px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link
            href="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: 'var(--amber, #ff9d4d)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#14100a',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" />
              </svg>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '-0.01em' }}>
              ReachInbox
            </span>
          </Link>

          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--text-faint, #4a505a)',
              background: 'var(--panel-raised, #111318)',
              border: '1px solid var(--border, #1c2027)',
              padding: '2px 6px',
              borderRadius: '4px',
              letterSpacing: '0.04em',
            }}
          >
            OUTBOX
          </span>

          <span style={{ color: 'var(--text-faint, #4a505a)', fontSize: '13px' }}>/</span>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11.5px',
              color: 'var(--text-dim, #838a94)',
            }}
          >
            <Link
              href="/dashboard"
              style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s' }}
              className="hover:text-white"
            >
              console
            </Link>
            <span style={{ color: 'var(--text-faint)' }}>/</span>
            <span style={{ color: 'var(--amber, #ff9d4d)' }}>settings</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--good, #34d399)',
              background: 'var(--good-dim, rgba(52,211,153,.12))',
              border: '1px solid rgba(52,211,153,.25)',
              padding: '3px 9px',
              borderRadius: '12px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--good, #34d399)',
                display: 'inline-block',
              }}
            />
            <span>Webhook Dispatcher Active</span>
          </div>

          <Link
            href="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12.5px',
              color: 'var(--text-dim, #838a94)',
              background: 'var(--panel-raised, #111318)',
              border: '1px solid var(--border, #1c2027)',
              padding: '5px 12px',
              borderRadius: '7px',
              textDecoration: 'none',
              fontWeight: 500,
              transition: 'all 0.15s ease',
            }}
            className="hover:text-white hover:border-[#ff9d4d]"
          >
            <ArrowLeft size={13} />
            <span>Console</span>
          </Link>

          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--panel-raised, #111318)',
              border: '1px solid var(--border, #1c2027)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--amber, #ff9d4d)',
            }}
            title={user.name || user.email}
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              (user.name?.[0] || 'U').toUpperCase()
            )}
          </div>
        </div>
      </header>

      {/* ── Main Container ────────────────────────────────────── */}
      <main
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '32px 24px 0',
        }}
      >
        {/* ── Header Title Block ──────────────────────────────── */}
        <div style={{ marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '10.5px',
              color: 'var(--amber, #ff9d4d)',
              background: 'var(--amber-dim, rgba(255,157,77,.14))',
              border: '1px solid rgba(255,157,77,.25)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: 500,
              marginBottom: '10px',
            }}
          >
            <Sparkles size={12} />
            <span>OUTBOX TELEMETRY &amp; ALERT ENGINE</span>
          </div>

          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: '0 0 8px 0',
              color: 'var(--text, #e8eaed)',
            }}
          >
            Settings &amp; Integrations
          </h1>

          <p
            style={{
              fontSize: '13.5px',
              color: 'var(--text-dim, #838a94)',
              margin: 0,
              maxWidth: '720px',
              lineHeight: 1.5,
            }}
          >
            Connect incident channels, monitor sliding-window rate limit triggers, and automate real-time notifications across your marketing stack.
          </p>
        </div>

        {/* ── Top Metrics Banner (Console Stat Cards) ─────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              background: 'var(--panel, #0d0f12)',
              border: '1px solid var(--border, #1c2027)',
              borderRadius: '10px',
              padding: '14px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: 'var(--text-faint, #4a505a)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Alert Channels
              </span>
              <Bell size={13} style={{ color: 'var(--amber, #ff9d4d)' }} />
            </div>
            <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text, #e8eaed)', marginTop: '6px' }}>
              {slackConnected ? '1 Active' : '0 Connected'}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: slackConnected ? 'var(--good, #34d399)' : 'var(--text-faint, #4a505a)', marginTop: '4px' }}>
              {slackConnected ? '● Slack Workspace Active' : '○ Ready for connection'}
            </div>
          </div>

          <div
            style={{
              background: 'var(--panel, #0d0f12)',
              border: '1px solid var(--border, #1c2027)',
              borderRadius: '10px',
              padding: '14px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: 'var(--text-faint, #4a505a)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Dispatch Protocol
              </span>
              <Shield size={13} style={{ color: 'var(--good, #34d399)' }} />
            </div>
            <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text, #e8eaed)', marginTop: '6px' }}>
              TLS 1.3
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim, #838a94)', marginTop: '4px' }}>
              AES-256 Webhook Signing
            </div>
          </div>

          <div
            style={{
              background: 'var(--panel, #0d0f12)',
              border: '1px solid var(--border, #1c2027)',
              borderRadius: '10px',
              padding: '14px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: 'var(--text-faint, #4a505a)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Max Hourly Cap
              </span>
              <Clock size={13} style={{ color: 'var(--amber, #ff9d4d)' }} />
            </div>
            <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text, #e8eaed)', marginTop: '6px' }}>
              200 / hr
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--amber, #ff9d4d)', marginTop: '4px' }}>
              Per-sender safe ceiling
            </div>
          </div>

          <div
            style={{
              background: 'var(--panel, #0d0f12)',
              border: '1px solid var(--border, #1c2027)',
              borderRadius: '10px',
              padding: '14px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: 'var(--text-faint, #4a505a)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Queue Latency
              </span>
              <Zap size={13} style={{ color: 'var(--good, #34d399)' }} />
            </div>
            <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text, #e8eaed)', marginTop: '6px' }}>
              &lt; 45ms
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim, #838a94)', marginTop: '4px' }}>
              BullMQ event latency
            </div>
          </div>
        </div>

        {/* ── Integrations 2x2 Grid ────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          {/* 1. Slack Incident Alerts */}
          <div
            style={{
              background: 'var(--panel, #0d0f12)',
              border: '1px solid var(--border, #1c2027)',
              borderRadius: '12px',
              padding: '22px 24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '20px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: 'var(--panel-raised, #111318)',
                      border: '1px solid var(--border, #1c2027)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 122.8 122.8" fill="currentColor">
                      <path d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zm6.5 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z" fill="#E01E5A" />
                      <path d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2zm0 6.5c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z" fill="#36C5F0" />
                      <path d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2zm-6.5 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z" fill="#2EB67D" />
                      <path d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9zm0-6.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z" fill="#ECB22E" />
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--text, #e8eaed)' }}>
                      Slack Incident Alerts
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-dim, #838a94)', margin: '2px 0 0 0' }}>
                      Channel alerts for sliding-window limits &amp; bottlenecks.
                    </p>
                  </div>
                </div>

                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: slackConnected ? 'var(--good, #34d399)' : 'var(--text-faint, #4a505a)',
                    background: slackConnected ? 'var(--good-dim, rgba(52,211,153,.12))' : 'var(--panel-raised, #111318)',
                    border: `1px solid ${slackConnected ? 'rgba(52,211,153,.25)' : 'var(--border, #1c2027)'}`,
                    padding: '2px 7px',
                    borderRadius: '4px',
                    fontWeight: 500,
                  }}
                >
                  {slackConnected ? 'CONNECTED' : 'DISCONNECTED'}
                </span>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-dim, #838a94)' }}>
                  <Check size={13} style={{ color: 'var(--good, #34d399)', flexShrink: 0 }} />
                  <span>Instant warning when sender hits 90% of hourly quota (180/200).</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-dim, #838a94)' }}>
                  <Check size={13} style={{ color: 'var(--good, #34d399)', flexShrink: 0 }} />
                  <span>Critical notification if BullMQ job encounters repeated delivery failure.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-dim, #838a94)' }}>
                  <Check size={13} style={{ color: 'var(--good, #34d399)', flexShrink: 0 }} />
                  <span>Daily automated digest summarizing queue velocity &amp; sent metrics.</span>
                </div>
              </div>
            </div>

            <div
              style={{
                borderTop: '1px solid var(--border-soft, #15181d)',
                paddingTop: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
              }}
            >
              <button
                onClick={handleSendTestAlert}
                disabled={isSendingTest}
                style={{
                  background: 'var(--panel-raised, #111318)',
                  border: '1px solid var(--border, #1c2027)',
                  color: 'var(--text-dim, #838a94)',
                  borderRadius: '7px',
                  padding: '7px 12px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: isSendingTest ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
                className="hover:text-white"
              >
                {isSendingTest ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                <span>{isSendingTest ? 'Sending…' : 'Test Alert'}</span>
              </button>

              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-faint)' }}>
                  <RefreshCw size={12} className="animate-spin" />
                  <span>Checking…</span>
                </div>
              ) : slackConnected ? (
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  style={{
                    background: 'var(--bad-dim, rgba(242,99,123,.12))',
                    border: '1px solid rgba(242,99,123,.3)',
                    color: 'var(--bad, #f2637b)',
                    borderRadius: '7px',
                    padding: '7px 14px',
                    fontSize: '12px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: disconnecting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  className="hover:brightness-110"
                >
                  <Unplug size={12} />
                  <span>{disconnecting ? 'Disconnecting…' : 'Disconnect'}</span>
                </button>
              ) : (
                <button
                  onClick={() => { window.location.href = `${API_BASE}/slack/connect`; }}
                  style={{
                    background: 'var(--amber, #ff9d4d)',
                    border: 'none',
                    color: '#14100a',
                    borderRadius: '7px',
                    padding: '7px 16px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  className="hover:brightness-105"
                >
                  <ExternalLink size={12} />
                  <span>Connect Slack Workspace</span>
                </button>
              )}
            </div>
          </div>

          {/* 2. Outbound Event Webhook */}
          <div
            style={{
              background: 'var(--panel, #0d0f12)',
              border: '1px solid var(--border, #1c2027)',
              borderRadius: '12px',
              padding: '22px 24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '20px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: 'var(--panel-raised, #111318)',
                      border: '1px solid var(--border, #1c2027)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: 'var(--amber, #ff9d4d)',
                    }}
                  >
                    <Webhook size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--text, #e8eaed)' }}>
                      Outbound Event Webhook
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-dim, #838a94)', margin: '2px 0 0 0' }}>
                      Stream raw JSON event streams to Zapier, Make, or custom microservices.
                    </p>
                  </div>
                </div>

                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--amber, #ff9d4d)',
                    background: 'var(--amber-dim, rgba(255,157,77,.14))',
                    border: '1px solid rgba(255,157,77,.25)',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    fontWeight: 500,
                  }}
                >
                  LIVE DISPATCH
                </span>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10.5px',
                      color: 'var(--text-faint, #4a505a)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginBottom: '4px',
                    }}
                  >
                    DESTINATION ENDPOINT URL
                  </label>
                  <div
                    style={{
                      background: 'var(--panel-raised, #111318)',
                      border: '1px solid var(--border, #1c2027)',
                      borderRadius: '7px',
                      padding: '7px 11px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      color: 'var(--text, #e8eaed)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    https://api.reachinbox.ai/v1/webhooks/listener
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10.5px',
                        color: 'var(--text-faint, #4a505a)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      SIGNING SECRET (HMAC-SHA256)
                    </label>
                    <button
                      onClick={handleCopySecret}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--amber, #ff9d4d)',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: 0,
                      }}
                    >
                      {copiedSecret ? <Check size={11} /> : <Copy size={11} />}
                      <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div
                    style={{
                      background: 'var(--panel-raised, #111318)',
                      border: '1px solid var(--border, #1c2027)',
                      borderRadius: '7px',
                      padding: '7px 11px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11.5px',
                      color: 'var(--text-dim, #838a94)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>whsec_7f9c2d1b8e4a3f6e9b0d2c5a1f8e4b7c</span>
                    <Lock size={12} style={{ color: 'var(--text-faint)' }} />
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                borderTop: '1px solid var(--border-soft, #15181d)',
                paddingTop: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-faint, #4a505a)' }}>
                Retry Policy: 3 attempts · exp backoff
              </span>
              <button
                onClick={() => showToast('info', 'Webhook settings synced with environment defaults.')}
                style={{
                  background: 'var(--panel-raised, #111318)',
                  border: '1px solid var(--border, #1c2027)',
                  color: 'var(--text-dim, #838a94)',
                  borderRadius: '7px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.15s ease',
                }}
                className="hover:text-white"
              >
                Configure
              </button>
            </div>
          </div>

          {/* 3. Google Workspace Identity */}
          <div
            style={{
              background: 'var(--panel, #0d0f12)',
              border: '1px solid var(--border, #1c2027)',
              borderRadius: '12px',
              padding: '22px 24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '20px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: 'var(--panel-raised, #111318)',
                      border: '1px solid var(--border, #1c2027)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.98 0 12s.45 3.84 1.25 5.42l4.03-3.15z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--text, #e8eaed)' }}>
                      Google Workspace SSO
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-dim, #838a94)', margin: '2px 0 0 0' }}>
                      OAuth 2.0 verified authentication and campaign sender identity.
                    </p>
                  </div>
                </div>

                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--good, #34d399)',
                    background: 'var(--good-dim, rgba(52,211,153,.12))',
                    border: '1px solid rgba(52,211,153,.25)',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    fontWeight: 500,
                  }}
                >
                  ACTIVE SESSION
                </span>
              </div>

              <div
                style={{
                  marginTop: '16px',
                  background: 'var(--panel-raised, #111318)',
                  border: '1px solid var(--border, #1c2027)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-faint, #4a505a)' }}>Authenticated User</span>
                  <span style={{ fontWeight: 500, color: 'var(--text, #e8eaed)' }}>{user.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: 'var(--text-faint, #4a505a)' }}>Account Email</span>
                  <span style={{ color: 'var(--amber, #ff9d4d)' }}>{user.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                  <span style={{ color: 'var(--text-faint, #4a505a)' }}>Session Token</span>
                  <span style={{ color: 'var(--good, #34d399)' }}>Valid (Auto-Renewing)</span>
                </div>
              </div>
            </div>

            <div
              style={{
                borderTop: '1px solid var(--border-soft, #15181d)',
                paddingTop: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: 'var(--text-faint, #4a505a)',
              }}
            >
              <span>Scopes: profile, email, openid</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--good, #34d399)' }}>
                PKCE Active
              </span>
            </div>
          </div>

          {/* 4. SMTP / Ethereal Delivery Engine */}
          <div
            style={{
              background: 'var(--panel, #0d0f12)',
              border: '1px solid var(--border, #1c2027)',
              borderRadius: '12px',
              padding: '22px 24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '20px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: 'var(--panel-raised, #111318)',
                      border: '1px solid var(--border, #1c2027)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: 'var(--amber, #ff9d4d)',
                    }}
                  >
                    <Mail size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--text, #e8eaed)' }}>
                      SMTP Relay Engine
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-dim, #838a94)', margin: '2px 0 0 0' }}>
                      Nodemailer SMTP transport with automated Ethereal dev credentials.
                    </p>
                  </div>
                </div>

                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--amber, #ff9d4d)',
                    background: 'var(--amber-dim, rgba(255,157,77,.14))',
                    border: '1px solid rgba(255,157,77,.25)',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    fontWeight: 500,
                  }}
                >
                  PORT 587 TLS
                </span>
              </div>

              <div
                style={{
                  marginTop: '16px',
                  background: 'var(--panel-raised, #111318)',
                  border: '1px solid var(--border, #1c2027)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-faint, #4a505a)' }}>Transport Service</span>
                  <span style={{ fontWeight: 500, color: 'var(--text, #e8eaed)' }}>Ethereal Sandbox / SMTP</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: 'var(--text-faint, #4a505a)' }}>Concurrency</span>
                  <span style={{ color: 'var(--amber, #ff9d4d)' }}>5 Concurrent Workers</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                  <span style={{ color: 'var(--text-faint, #4a505a)' }}>Min Send Gap</span>
                  <span style={{ color: 'var(--good, #34d399)' }}>2,000ms delay</span>
                </div>
              </div>
            </div>

            <div
              style={{
                borderTop: '1px solid var(--border-soft, #15181d)',
                paddingTop: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-faint, #4a505a)' }}>
                Zero-drop queue reconciliation
              </span>
              <a
                href="https://ethereal.email/messages"
                target="_blank"
                rel="noreferrer"
                style={{
                  color: 'var(--amber, #ff9d4d)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 500,
                  fontSize: '12px',
                }}
                className="hover:underline"
              >
                <span>View Sent Mailbox</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>

        {/* ── Interactive Webhook Payload Inspector ───────────── */}
        <div
          style={{
            background: 'var(--panel, #0d0f12)',
            border: '1px solid var(--border, #1c2027)',
            borderRadius: '12px',
            padding: '22px 24px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={15} style={{ color: 'var(--amber, #ff9d4d)' }} />
                <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--text, #e8eaed)' }}>
                  Live Event Payload Inspector
                </h3>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-dim, #838a94)', margin: '3px 0 0 0' }}>
                Real-time structure of the JSON events streamed to connected Slack and Webhook endpoints.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--panel-raised, #111318)',
                  border: '1px solid var(--border, #1c2027)',
                  borderRadius: '7px',
                  padding: '2px',
                  gap: '2px',
                }}
              >
                {(['rate_limit', 'job_dispatched', 'worker_failed'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActivePayloadTab(tab)}
                    style={{
                      background: activePayloadTab === tab ? 'var(--amber, #ff9d4d)' : 'transparent',
                      color: activePayloadTab === tab ? '#14100a' : 'var(--text-dim, #838a94)',
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: '5px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: activePayloadTab === tab ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {tab === 'rate_limit'
                      ? 'rate_limit.approaching'
                      : tab === 'job_dispatched'
                      ? 'email.dispatched'
                      : 'worker.failed'}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCopyPayload}
                style={{
                  background: 'var(--panel-raised, #111318)',
                  border: '1px solid var(--border, #1c2027)',
                  color: 'var(--text-dim, #838a94)',
                  borderRadius: '7px',
                  padding: '5px 10px',
                  fontSize: '11.5px',
                  fontFamily: 'var(--font-mono)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                }}
                className="hover:text-white"
              >
                {copiedPayload ? <Check size={12} style={{ color: 'var(--good)' }} /> : <Copy size={12} />}
                <span>{copiedPayload ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div
            style={{
              background: '#050608',
              border: '1px solid var(--border, #1c2027)',
              borderRadius: '8px',
              padding: '14px 16px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              overflowX: 'auto',
              color: 'var(--good, #34d399)',
              lineHeight: 1.6,
            }}
          >
            <pre style={{ margin: 0 }}>
              {JSON.stringify(payloads[activePayloadTab], null, 2)}
            </pre>
          </div>
        </div>

        {/* ── Notification Triggers & Matrix ───────────────────── */}
        <div
          style={{
            background: 'var(--panel, #0d0f12)',
            border: '1px solid var(--border, #1c2027)',
            borderRadius: '12px',
            padding: '22px 24px',
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={15} style={{ color: 'var(--amber, #ff9d4d)' }} />
              <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--text, #e8eaed)' }}>
                Event Subscriptions &amp; Trigger Policy
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-dim, #838a94)', margin: '3px 0 0 0' }}>
              Configure automatic notification triggers delivered across connected Slack and Webhook destinations.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '12px',
            }}
          >
            <div
              style={{
                background: 'var(--panel-raised, #111318)',
                border: '1px solid var(--border, #1c2027)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text, #e8eaed)' }}>
                  Rate Limit Approaching Alert
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-dim, #838a94)', marginTop: '2px' }}>
                  Fire notification when sender reaches 90% of hourly limit (180/200).
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifications.rateLimitWarning}
                onChange={(e) => {
                  setNotifications({ ...notifications, rateLimitWarning: e.target.checked });
                  showToast('info', 'Trigger policy preference updated');
                }}
                style={{ width: '16px', height: '16px', accentColor: 'var(--amber, #ff9d4d)', cursor: 'pointer' }}
              />
            </div>

            <div
              style={{
                background: 'var(--panel-raised, #111318)',
                border: '1px solid var(--border, #1c2027)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text, #e8eaed)' }}>
                  Worker Retry Exhaustion Alert
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-dim, #838a94)', marginTop: '2px' }}>
                  Notify instantly if an email job fails all 3 retry cycles.
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifications.jobFailure}
                onChange={(e) => {
                  setNotifications({ ...notifications, jobFailure: e.target.checked });
                  showToast('info', 'Trigger policy preference updated');
                }}
                style={{ width: '16px', height: '16px', accentColor: 'var(--amber, #ff9d4d)', cursor: 'pointer' }}
              />
            </div>

            <div
              style={{
                background: 'var(--panel-raised, #111318)',
                border: '1px solid var(--border, #1c2027)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text, #e8eaed)' }}>
                  Batch Campaign Completion
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-dim, #838a94)', marginTop: '2px' }}>
                  Summary ping when a CSV bulk schedule finishes dispatching.
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifications.batchComplete}
                onChange={(e) => {
                  setNotifications({ ...notifications, batchComplete: e.target.checked });
                  showToast('info', 'Trigger policy preference updated');
                }}
                style={{ width: '16px', height: '16px', accentColor: 'var(--amber, #ff9d4d)', cursor: 'pointer' }}
              />
            </div>

            <div
              style={{
                background: 'var(--panel-raised, #111318)',
                border: '1px solid var(--border, #1c2027)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text, #e8eaed)' }}>
                  Auto-Reconciliation Notification
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-dim, #838a94)', marginTop: '2px' }}>
                  Report pending jobs recovered during server restart or sync.
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifications.reconciliation}
                onChange={(e) => {
                  setNotifications({ ...notifications, reconciliation: e.target.checked });
                  showToast('info', 'Trigger policy preference updated');
                }}
                style={{ width: '16px', height: '16px', accentColor: 'var(--amber, #ff9d4d)', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
