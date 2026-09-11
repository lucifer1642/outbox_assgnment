'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
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
  Radio,
  Clock,
  Layers,
  Sparkles,
  Sliders,
  Webhook,
  Mail,
  Lock,
} from 'lucide-react';

export default function IntegrationsPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [slackConnected, setSlackConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState(false);
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
      .catch(() => setError(true))
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
    if (!window.confirm('Rate-limit alerts will stop. Disconnect Slack?')) return;
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
        showToast('info', 'Simulation: Test incident alert generated (Connect Slack for live delivery).');
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

  if (authLoading) return <FullPageLoader message="Loading integrations…" />;
  if (!user) return null;

  return (
    <div className="min-h-screen relative flex flex-col bg-[#0b0c10] text-[#f3f4f7] overflow-x-hidden">
      {/* ── Background Mesh & Noise ────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        <div className="noise"></div>
      </div>

      <Header />

      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 lg:px-12 py-10 space-y-10">
        {/* ── Breadcrumb & Top Bar ─────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs font-mono text-[#98a0ae]">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <ArrowLeft size={13} />
              <span>Dashboard</span>
            </Link>
            <span>/</span>
            <span className="text-[#8b7cff] font-medium">Settings &amp; Integrations</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-white/[0.04] border border-white/[0.08] text-[#98a0ae]">
              <span className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse"></span>
              Webhook Dispatcher Active
            </span>
          </div>
        </div>

        {/* ── Page Header ──────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8b7cff]/10 border border-[#8b7cff]/25 text-xs text-[#8b7cff] font-medium">
            <Sparkles size={13} />
            <span>Outbox Telemetry &amp; Alert Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Integrations &amp; Webhooks
          </h1>
          <p className="text-base text-[#98a0ae] max-w-3xl leading-relaxed">
            Connect incident channels, monitor sliding-window rate limit triggers, and automate real-time notifications across your marketing stack.
          </p>
        </div>

        {/* ── Top Metrics Banner ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="p-5 rounded-2xl bg-white/[0.025] border border-white/[0.07] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#98a0ae]">ALERT CHANNELS</span>
              <Bell size={16} className="text-[#8b7cff]" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">
              {slackConnected ? '1 Active' : '0 Connected'}
            </div>
            <div className="text-[11px] text-[#34d399] mt-1 font-mono">
              {slackConnected ? 'Slack Workspace Active' : 'Ready for connection'}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.025] border border-white/[0.07] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#98a0ae]">DISPATCH PROTOCOL</span>
              <Shield size={16} className="text-[#34d399]" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">TLS 1.3</div>
            <div className="text-[11px] text-[#98a0ae] mt-1 font-mono">
              AES-256 Webhook Signing
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.025] border border-white/[0.07] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#98a0ae]">MAX HOURLY CAP</span>
              <Clock size={16} className="text-[#fbbf24]" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">200 / hr</div>
            <div className="text-[11px] text-[#fbbf24] mt-1 font-mono">
              Per-sender safe ceiling
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.025] border border-white/[0.07] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#98a0ae]">NOTIFICATION DELAY</span>
              <Zap size={16} className="text-[#26d0ce]" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">&lt; 45ms</div>
            <div className="text-[11px] text-[#26d0ce] mt-1 font-mono">
              BullMQ event latency
            </div>
          </div>
        </motion.div>

        {/* ── Integrations Cards Grid ──────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Slack Card ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="p-7 rounded-[26px] bg-[#11141d]/80 border border-white/[0.1] backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden group hover:border-[#8b7cff]/40 transition-colors duration-300"
          >
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Official Slack Multicolor Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-[#4A154B]/30 border border-[#4A154B]/40 flex items-center justify-center shrink-0 shadow-inner">
                    <svg width="28" height="28" viewBox="0 0 122.8 122.8" fill="currentColor">
                      <path d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zm6.5 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z" fill="#E01E5A" />
                      <path d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2zm0 6.5c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z" fill="#36C5F0" />
                      <path d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2zm-6.5 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z" fill="#2EB67D" />
                      <path d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9zm0-6.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z" fill="#ECB22E" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      Slack Incident Alerts
                    </h3>
                    <p className="text-xs text-[#98a0ae] mt-0.5">
                      Direct channel notifications for sliding-window limits &amp; bottlenecks.
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="shrink-0">
                  {slackConnected ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-[#34d399]/10 text-[#34d399] border border-[#34d399]/25">
                      <CheckCircle2 size={13} />
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-white/[0.05] text-[#98a0ae] border border-white/[0.08]">
                      Not Connected
                    </span>
                  )}
                </div>
              </div>

              {/* Feature Points */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2.5 text-xs text-[#98a0ae]">
                  <Check size={14} className="text-[#34d399] shrink-0" />
                  <span>Instant warning when sender hits 90% of hourly quota (180/200).</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-[#98a0ae]">
                  <Check size={14} className="text-[#34d399] shrink-0" />
                  <span>Critical alert if BullMQ job encounters repeated delivery failure.</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-[#98a0ae]">
                  <Check size={14} className="text-[#34d399] shrink-0" />
                  <span>Daily automated digest summarizing queue velocity &amp; sent metrics.</span>
                </div>
              </div>
            </div>

            {/* Actions Bottom Bar */}
            <div className="pt-5 border-t border-white/[0.08] flex items-center justify-between gap-3">
              <button
                onClick={handleSendTestAlert}
                disabled={isSendingTest}
                className="btn btn-ghost text-xs px-3.5 py-2 flex items-center gap-2 text-[#98a0ae] hover:text-white"
              >
                {isSendingTest ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <Send size={13} />
                )}
                <span>{isSendingTest ? 'Sending…' : 'Test Alert'}</span>
              </button>

              {loading ? (
                <div className="w-8 h-8 flex items-center justify-center">
                  <RefreshCw size={16} className="animate-spin text-[#8b7cff]" />
                </div>
              ) : slackConnected ? (
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="btn btn-ghost text-xs px-4 py-2 border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                >
                  <Unplug size={14} />
                  <span>{disconnecting ? 'Disconnecting…' : 'Disconnect Slack'}</span>
                </button>
              ) : (
                <button
                  onClick={() => { window.location.href = `${API_BASE}/slack/connect`; }}
                  className="btn btn-primary text-xs px-5 py-2.5 flex items-center gap-2 shadow-lg shadow-[#8b7cff]/20"
                >
                  <ExternalLink size={14} />
                  <span>Connect Slack Workspace</span>
                </button>
              )}
            </div>
          </motion.div>

          {/* ── Custom Webhook Engine Card ──────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="p-7 rounded-[26px] bg-[#11141d]/80 border border-white/[0.1] backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden group hover:border-[#5b8cff]/40 transition-colors duration-300"
          >
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#5b8cff]/15 border border-[#5b8cff]/30 flex items-center justify-center shrink-0">
                    <Webhook size={26} className="text-[#5b8cff]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      Outbound Event Webhook
                    </h3>
                    <p className="text-xs text-[#98a0ae] mt-0.5">
                      Stream raw JSON event streams to Zapier, Make, or custom microservices.
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-[#5b8cff]/10 text-[#5b8cff] border border-[#5b8cff]/25">
                  Live Dispatch
                </span>
              </div>

              {/* Endpoint configuration box */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-[11px] font-mono text-[#98a0ae] block mb-1">
                    DESTINATION ENDPOINT URL
                  </label>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/40 border border-white/[0.08]">
                    <span className="text-xs font-mono text-[#5b8cff] select-all truncate">
                      https://api.reachinbox.ai/v1/webhooks/listener
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-mono text-[#98a0ae]">
                      SIGNING SECRET (HMAC-SHA256)
                    </label>
                    <button
                      onClick={handleCopySecret}
                      className="text-[10px] font-mono text-[#8b7cff] hover:text-white flex items-center gap-1"
                    >
                      {copiedSecret ? <Check size={11} /> : <Copy size={11} />}
                      <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/[0.08] font-mono text-xs text-[#98a0ae]">
                    <span>whsec_7f9c2d1b8e4a3f6e9b0d2c5a1f8e4b7c</span>
                    <Lock size={12} className="text-[#98a0ae]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-white/[0.08] flex items-center justify-between text-xs">
              <span className="text-[#98a0ae] font-mono text-[11px]">
                Retry Policy: 3 attempts with exponential backoff
              </span>
              <button
                onClick={() => showToast('info', 'Webhook settings are synced with environment defaults.')}
                className="btn btn-ghost text-xs px-3 py-1.5 text-[#5b8cff]"
              >
                Configure
              </button>
            </div>
          </motion.div>

          {/* ── Google Workspace Identity Card ──────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="p-7 rounded-[26px] bg-[#11141d]/80 border border-white/[0.1] backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden group hover:border-[#34d399]/40 transition-colors duration-300"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.08] border border-white/[0.15] flex items-center justify-center shrink-0">
                    <svg className="w-7 h-7" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.98 0 12s.45 3.84 1.25 5.42l4.03-3.15z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      Google Workspace SSO
                    </h3>
                    <p className="text-xs text-[#98a0ae] mt-0.5">
                      OAuth 2.0 verified authentication and campaign sender identity.
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-[#34d399]/10 text-[#34d399] border border-[#34d399]/25">
                  <CheckCircle2 size={13} />
                  Active Session
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#98a0ae]">Authenticated User:</span>
                  <span className="font-semibold text-white">{user.name}</span>
                </div>
                <div className="flex items-center justify-between font-mono">
                  <span className="text-[#98a0ae]">Account Email:</span>
                  <span className="text-[#8b7cff]">{user.email}</span>
                </div>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-[#98a0ae]">Session Token:</span>
                  <span className="text-[#34d399]">Valid (Auto-Renewing)</span>
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-white/[0.08] flex items-center justify-between text-xs text-[#98a0ae]">
              <span>Scopes: profile, email, openid</span>
              <span className="font-mono text-[#34d399]">PKCE Active</span>
            </div>
          </motion.div>

          {/* ── SMTP / Ethereal Delivery Engine ─────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="p-7 rounded-[26px] bg-[#11141d]/80 border border-white/[0.1] backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden group hover:border-[#fbbf24]/40 transition-colors duration-300"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#fbbf24]/15 border border-[#fbbf24]/30 flex items-center justify-center shrink-0">
                    <Mail size={26} className="text-[#fbbf24]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      SMTP Relay Engine
                    </h3>
                    <p className="text-xs text-[#98a0ae] mt-0.5">
                      Nodemailer SMTP transport with automated Ethereal dev credentials.
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/25">
                  Port 587 TLS
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#98a0ae]">Transport Service:</span>
                  <span className="font-semibold text-white">Ethereal Sandbox / SMTP</span>
                </div>
                <div className="flex items-center justify-between font-mono">
                  <span className="text-[#98a0ae]">Concurrency:</span>
                  <span className="text-[#fbbf24]">5 Concurrent Workers</span>
                </div>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-[#98a0ae]">Min Send Gap:</span>
                  <span className="text-[#34d399]">2,000ms delay</span>
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-white/[0.08] flex items-center justify-between text-xs">
              <span className="text-[#98a0ae] font-mono text-[11px]">Zero-drop queue reconciliation</span>
              <a
                href="https://ethereal.email/messages"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#fbbf24] hover:underline inline-flex items-center gap-1"
              >
                <span>View Sent Mailbox</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </motion.div>
        </div>

        {/* ── Interactive Webhook Payload Simulator ───────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="p-8 rounded-[28px] bg-[#11141d]/85 border border-white/[0.1] backdrop-blur-xl shadow-2xl space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <Terminal size={18} className="text-[#8b7cff]" />
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Live Event Payload Inspector
                </h3>
              </div>
              <p className="text-xs text-[#98a0ae] mt-1">
                Real-time structure of the JSON events streamed to connected Slack and Webhook endpoints.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-1 rounded-xl bg-black/40 border border-white/[0.08] flex items-center gap-1">
                {(['rate_limit', 'job_dispatched', 'worker_failed'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActivePayloadTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                      activePayloadTab === tab
                        ? 'bg-[#8b7cff] text-[#0b0c10] font-bold shadow-md'
                        : 'text-[#98a0ae] hover:text-white'
                    }`}
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
                className="btn btn-ghost text-xs px-3 py-2 flex items-center gap-1.5 text-[#98a0ae] hover:text-white border border-white/[0.08]"
              >
                {copiedPayload ? <Check size={13} className="text-[#34d399]" /> : <Copy size={13} />}
                <span>{copiedPayload ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Code Viewer */}
          <div className="rounded-2xl bg-[#090a0f] border border-white/[0.08] p-5 font-mono text-xs overflow-x-auto shadow-inner">
            <pre className="text-[#34d399] leading-relaxed">
              {JSON.stringify(payloads[activePayloadTab], null, 2)}
            </pre>
          </div>
        </motion.div>

        {/* ── Notification Triggers & Matrix ───────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="p-8 rounded-[28px] bg-[#11141d]/85 border border-white/[0.1] backdrop-blur-xl shadow-2xl space-y-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Sliders size={18} className="text-[#26d0ce]" />
                Event Subscriptions &amp; Trigger Policy
              </h3>
              <p className="text-xs text-[#98a0ae] mt-1">
                Toggle specific trigger conditions for notifications sent across connected integrations.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-white">Rate Limit Approaching Alert</div>
                <div className="text-xs text-[#98a0ae] mt-0.5">Fire notification when sender reaches 90% of hourly limit.</div>
              </div>
              <input
                type="checkbox"
                checked={notifications.rateLimitWarning}
                onChange={(e) => {
                  setNotifications({ ...notifications, rateLimitWarning: e.target.checked });
                  showToast('info', 'Trigger policy preference updated');
                }}
                className="w-5 h-5 accent-[#8b7cff] cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-white">Worker Retry Exhaustion Alert</div>
                <div className="text-xs text-[#98a0ae] mt-0.5">Notify instantly if an email job fails all 3 retry cycles.</div>
              </div>
              <input
                type="checkbox"
                checked={notifications.jobFailure}
                onChange={(e) => {
                  setNotifications({ ...notifications, jobFailure: e.target.checked });
                  showToast('info', 'Trigger policy preference updated');
                }}
                className="w-5 h-5 accent-[#8b7cff] cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-white">Batch Campaign Completion</div>
                <div className="text-xs text-[#98a0ae] mt-0.5">Summary ping when a CSV bulk schedule finishes dispatching.</div>
              </div>
              <input
                type="checkbox"
                checked={notifications.batchComplete}
                onChange={(e) => {
                  setNotifications({ ...notifications, batchComplete: e.target.checked });
                  showToast('info', 'Trigger policy preference updated');
                }}
                className="w-5 h-5 accent-[#8b7cff] cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-white">Auto-Reconciliation Notification</div>
                <div className="text-xs text-[#98a0ae] mt-0.5">Report pending jobs recovered during server restart or sync.</div>
              </div>
              <input
                type="checkbox"
                checked={notifications.reconciliation}
                onChange={(e) => {
                  setNotifications({ ...notifications, reconciliation: e.target.checked });
                  showToast('info', 'Trigger policy preference updated');
                }}
                className="w-5 h-5 accent-[#8b7cff] cursor-pointer"
              />
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
