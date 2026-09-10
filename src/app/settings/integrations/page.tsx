'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';

export default function IntegrationsPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [slackConnected, setSlackConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState(false);

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

  // Check for Slack OAuth callback
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

  if (authLoading) return <FullPageLoader message="Loading integrations…" />;
  if (!user) return null;

  return (
    <div className="min-h-screen relative flex flex-col">
      {/* ── Background Mesh & Noise ────────────────────────────── */}
      <div className="mesh">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      <div className="noise"></div>

      <Header />

      <main className="flex-1 wrap py-8 space-y-6 max-w-4xl mx-auto">
        {/* Back Link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors"
          style={{ textDecoration: 'none' }}
        >
          <ArrowLeft size={13} />
          Back to Dashboard
        </Link>

        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 style={{ fontSize: '28px', marginBottom: '6px' }}>Integrations &amp; Webhooks</h1>
          <p className="hero-sub" style={{ fontSize: '14px', margin: 0 }}>
            Connect third-party messaging tools to receive real-time sliding-window alerts.
          </p>
        </motion.div>

        {/* ── Slack Card ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="glass-flagship p-6 sm:p-8 rounded-[24px] space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              {/* Slack Icon */}
              <div className="w-12 h-12 rounded-2xl bg-[#4A154B]/20 border border-[#4A154B]/30 flex items-center justify-center shrink-0">
                <svg width="24" height="24" viewBox="0 0 122.8 122.8" fill="currentColor">
                  <path d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zm6.5 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z" fill="#E01E5A" />
                  <path d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2zm0 6.5c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z" fill="#36C5F0" />
                  <path d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2zm-6.5 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z" fill="#2EB67D" />
                  <path d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9zm0-6.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z" fill="#ECB22E" />
                </svg>
              </div>

              <div>
                <h3 className="text-base font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Slack Incident Alerts</h3>
                <p className="text-xs text-white/40 mt-1 leading-relaxed max-w-sm">
                  Receive instant alerts in your Slack channel whenever a sender hits hourly thresholds or bottlenecks occur.
                </p>
              </div>
            </div>

            {/* Action Button */}
            {loading ? (
              <div className="w-6 h-6 shrink-0">
                <svg className="animate-spin h-6 w-6 text-violet-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : slackConnected ? (
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="btn btn-ghost shrink-0"
                style={{
                  color: 'var(--coral)',
                  border: '1px solid rgba(248,113,113,0.2)',
                  fontSize: '12.5px',
                  padding: '8px 16px',
                }}
              >
                {disconnecting ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Disconnecting…
                  </>
                ) : (
                  <>
                    <Unplug size={14} />
                    Disconnect Slack
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => { window.location.href = `${API_BASE}/slack/connect`; }}
                className="btn btn-primary shrink-0"
                style={{ fontSize: '13px', padding: '9px 18px' }}
              >
                <ExternalLink size={14} />
                Connect Slack
              </button>
            )}
          </div>

          {/* Status Bar */}
          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {slackConnected ? (
                <>
                  <CheckCircle2 size={14} style={{ color: 'var(--mint)' }} />
                  <span className="font-medium mono" style={{ color: 'var(--mint)' }}>Connected &amp; Active</span>
                </>
              ) : error ? (
                <>
                  <AlertCircle size={14} style={{ color: 'var(--amber)' }} />
                  <span className="font-medium mono" style={{ color: 'var(--amber)' }}>Unable to check status</span>
                </>
              ) : (
                <span className="text-white/30 mono">Not connected</span>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
