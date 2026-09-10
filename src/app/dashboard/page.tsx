'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useScheduledEmails } from '@/hooks/useScheduledEmails';
import { useSentEmails } from '@/hooks/useSentEmails';
import { Header } from '@/components/layout/Header';
import { TabNav } from '@/components/layout/TabNav';
import { ScheduledTable } from '@/components/scheduler/ScheduledTable';
import { SentTable } from '@/components/scheduler/SentTable';
import { ComposeForm } from '@/components/scheduler/ComposeForm';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FullPageLoader } from '@/components/ui/LoadingState';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  const { data: scheduledData } = useScheduledEmails(1, 1);
  const { data: sentData } = useSentEmails(1, 1);

  const scheduledTotal = scheduledData?.total ?? 0;
  const sentTotal = sentData?.total ?? 0;

  if (loading) {
    return <FullPageLoader message="Connecting to ReachInbox outbox…" />;
  }

  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }

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

      <main className="flex-1 wrap py-8 space-y-7">
        <ErrorBoundary>
          {/* ── Flagship Outbox Console Overview ───────────────── */}
          <div className="dash glass-flagship" style={{ padding: '22px 24px' }}>
            {/* Top Bar */}
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

            {/* Live 4-Cell Stats Grid */}
            <div className="stat-grid" style={{ margin: '0 -24px', padding: '0 24px' }}>
              <div className="stat">
                <div className="stat-label">Dispatched (24h)</div>
                <div className="stat-value up">{sentTotal.toLocaleString()}</div>
                <div className="stat-sub pos">+14%</div>
              </div>
              <div className="stat">
                <div className="stat-label">Pending in queue</div>
                <div className="stat-value">{scheduledTotal} jobs</div>
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
          </div>

          {/* ── Tab Selector & Action Strip ────────────────────── */}
          <TabNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onComposeClick={() => setIsComposeOpen(true)}
          />

          {/* ── Table Section ──────────────────────────────────── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'scheduled' ? (
                <ScheduledTable onComposeClick={() => setIsComposeOpen(true)} />
              ) : (
                <SentTable onComposeClick={() => setIsComposeOpen(true)} />
              )}
            </motion.div>
          </AnimatePresence>

          {/* ── Compose Modal ──────────────────────────────────── */}
          <AnimatePresence>
            {isComposeOpen && (
              <ComposeForm
                onClose={() => setIsComposeOpen(false)}
                onSuccess={() => setActiveTab('scheduled')}
              />
            )}
          </AnimatePresence>
        </ErrorBoundary>
      </main>
    </div>
  );
}
