'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { FullPageLoader } from '@/components/ui/LoadingState';
import {
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  Lock,
  Sparkles,
  Zap,
  Clock,
  Send,
  Database,
  Search,
  CheckCircle2,
  Cpu,
  Layers,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { API_BASE } from '@/lib/api';

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
    return <FullPageLoader message="Connecting to ReachInbox outbox…" />;
  }

  const features = [
    {
      icon: Zap,
      title: 'High-Throughput Scheduler',
      desc: 'BullMQ & Redis powered persistent queues with millisecond dispatch precision.',
      color: 'var(--amber)',
    },
    {
      icon: Clock,
      desc: 'Configurable hourly rate limits and delay pacing to preserve sender reputation.',
      title: 'Smart Anti-Spam Throttling',
      color: 'var(--mint)',
    },
    {
      icon: Search,
      title: 'Full-Text Elasticsearch',
      desc: 'Sub-second search across campaign subjects, bodies, and recipient archives.',
      color: 'var(--blue)',
    },
    {
      icon: Layers,
      title: 'Slack Real-Time Telemetry',
      desc: 'Instant webhooks for completed dispatches, hourly quotas, and error alerts.',
      color: 'var(--violet)',
    },
  ];

  return (
    <div className="min-h-screen relative flex flex-col justify-between overflow-x-hidden bg-[#0b0c10] text-[#f3f4f7]">
      {/* ── Dynamic Ambient Mesh & Animated Orbs ─────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            x: [0, 40, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-[140px] opacity-25"
          style={{ background: 'radial-gradient(circle, #8b7cff 0%, #5b8cff 60%, transparent 80%)' }}
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, -50, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute -bottom-32 -right-32 w-[650px] h-[650px] rounded-full blur-[160px] opacity-20"
          style={{ background: 'radial-gradient(circle, #26d0ce 0%, #34d399 50%, transparent 80%)' }}
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.12, 0.22, 0.12],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[180px]"
          style={{ background: 'radial-gradient(ellipse, #8b7cff 0%, transparent 75%)' }}
        />
        <div className="noise"></div>
      </div>

      {/* ── Top Header Navigation ──────────────────────────────── */}
      <header className="relative z-10 w-full px-6 lg:px-12 py-6 border-b border-white/[0.06] backdrop-blur-md bg-[#0b0c10]/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3.5 group text-decoration-none">
            <div
              className="brand-mark w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #8b7cff, #5b8cff)',
                boxShadow: '0 0 24px rgba(139, 124, 255, 0.4)',
              }}
            >
              <Send size={18} className="text-[#0b0c10] translate-x-[-1px] translate-y-[1px]" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-2">
                ReachInbox
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.08] text-[#8b7cff] font-normal border border-[#8b7cff]/30">
                  OUTBOX
                </span>
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-5">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-[#98a0ae]">
              <span className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse" />
              <span>Queue Workers Operational</span>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs text-[#98a0ae] hover:text-white transition-colors duration-200"
            >
              <ArrowLeft size={14} />
              <span>Back to home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Full-Page Grid ─────────────────────────────────── */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 lg:px-12 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* ── Left Column: Platform Showcase & Telemetry ──────── */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-7 flex flex-col justify-center space-y-8"
        >
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#8b7cff]/10 border border-[#8b7cff]/25 text-xs text-[#8b7cff] w-fit font-medium">
            <Sparkles size={13} className="text-[#8b7cff]" />
            <span>Enterprise Email Dispatch System</span>
          </div>

          {/* Hero Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.12]">
              Scale cold email dispatch without{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #8b7cff 0%, #5b8cff 50%, #26d0ce 100%)',
                }}
              >
                rate-limit bans.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-[#98a0ae] leading-relaxed max-w-2xl">
              Engineered with BullMQ, Redis, PostgreSQL, and Elasticsearch. Guaranteed delivery pacing,
              automatic reconciliation, and zero credential exposure.
            </p>
          </div>

          {/* Live Engine Telemetry Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.09] backdrop-blur-xl relative overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <Activity size={16} className="text-[#34d399]" />
                <span className="text-xs font-mono uppercase tracking-wider text-[#f3f4f7] font-semibold">
                  Queue Telemetry Engine
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#34d399] px-2 py-0.5 rounded bg-[#34d399]/10 border border-[#34d399]/20">
                LIVE METRICS
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="text-[11px] text-[#98a0ae] font-mono">THROTTLING</div>
                <div className="text-sm font-semibold text-white mt-1">2000ms delay</div>
                <div className="text-[10px] text-[#34d399] mt-0.5">Sliding window</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="text-[11px] text-[#98a0ae] font-mono">CONCURRENCY</div>
                <div className="text-sm font-semibold text-white mt-1">5 Workers</div>
                <div className="text-[10px] text-[#8b7cff] mt-0.5">Auto-scaling</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="text-[11px] text-[#98a0ae] font-mono">HOURLY CAP</div>
                <div className="text-sm font-semibold text-white mt-1">200 / sender</div>
                <div className="text-[10px] text-[#26d0ce] mt-0.5">Domain-safe</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="text-[11px] text-[#98a0ae] font-mono">SEARCH ENGINE</div>
                <div className="text-sm font-semibold text-white mt-1">&lt; 15ms query</div>
                <div className="text-[10px] text-[#fbbf24] mt-0.5">Elasticsearch v8</div>
              </div>
            </div>
          </motion.div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/[0.015] border border-white/[0.05] hover:border-white/[0.12] transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${feat.color}15`, color: feat.color }}
                >
                  <feat.icon size={16} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">{feat.title}</div>
                  <div className="text-[11px] text-[#98a0ae] leading-relaxed mt-0.5">{feat.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Right Column: Sign In Portal ────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="lg:col-span-5 w-full flex justify-center lg:justify-end"
        >
          <div className="w-full max-w-[480px] relative">
            {/* Ambient Backlight Glow behind card */}
            <div
              className="absolute -inset-1 rounded-[32px] opacity-40 blur-xl -z-10"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 124, 255, 0.3), rgba(91, 140, 255, 0.2), rgba(38, 208, 206, 0.2))',
              }}
            />

            {/* Main Portal Card */}
            <div className="p-8 sm:p-10 rounded-[30px] bg-[#11141d]/85 border border-white/[0.12] backdrop-blur-2xl shadow-2xl flex flex-col space-y-7">
              {/* Header Icon & Eyebrow */}
              <div className="flex flex-col items-start space-y-3">
                <div className="flex items-center justify-between w-full">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #8b7cff, #5b8cff)',
                      boxShadow: '0 8px 24px rgba(139, 124, 255, 0.35)',
                    }}
                  >
                    <Zap size={22} className="text-[#0b0c10]" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-mono bg-white/[0.06] border border-white/[0.1] text-[#98a0ae] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]"></span>
                    OAuth 2.0 PKCE
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Welcome to ReachInbox
                  </h2>
                  <p className="text-sm text-[#98a0ae] leading-relaxed">
                    Sign in with your authorized Google workspace to access campaign schedules, queues, and
                    real-time telemetry.
                  </p>
                </div>
              </div>

              {/* Error Alert if any */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-400"
                  >
                    <AlertCircle size={16} className="shrink-0 text-red-400" />
                    <span>Authentication was not completed. Please try again with your Google account.</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Google SSO Button */}
              <div className="space-y-4">
                <motion.button
                  whileHover={{ scale: 1.015, y: -1 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={handleGoogleLogin}
                  disabled={isRedirecting}
                  className="w-full relative group overflow-hidden rounded-2xl py-4 px-6 bg-white text-[#0b0c10] font-semibold text-sm sm:text-base flex items-center justify-center gap-3.5 shadow-xl transition-all duration-200 hover:shadow-2xl hover:shadow-white/20 disabled:opacity-80 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isRedirecting ? (
                    <div className="flex items-center gap-3">
                      <svg className="animate-spin h-5 w-5 text-[#0b0c10]" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="font-semibold">Connecting to Google…</span>
                    </div>
                  ) : (
                    <>
                      {/* Official Google Vector Logo */}
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.98 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                        />
                      </svg>
                      <span className="font-semibold">Continue with Google</span>
                      <ChevronRight size={16} className="text-[#5f6672] group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </motion.button>

                <p className="text-[11px] text-center text-[#5f6672] leading-relaxed">
                  By continuing, you agree to ReachInbox&apos;s Terms of Service and Privacy Policy.
                </p>
              </div>

              {/* Security Highlights Strip */}
              <div className="pt-5 border-t border-white/[0.08] grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex flex-col items-center gap-1">
                  <ShieldCheck size={16} className="text-[#34d399]" />
                  <span className="text-[10px] font-mono text-[#98a0ae]">Zero Secrets</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex flex-col items-center gap-1">
                  <Lock size={16} className="text-[#8b7cff]" />
                  <span className="text-[10px] font-mono text-[#98a0ae]">TLS 1.3 Strict</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex flex-col items-center gap-1">
                  <CheckCircle2 size={16} className="text-[#5b8cff]" />
                  <span className="text-[10px] font-mono text-[#98a0ae]">Direct OAuth</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="relative z-10 w-full px-6 lg:px-12 py-6 border-t border-white/[0.06] backdrop-blur-md bg-[#0b0c10]/40 text-xs text-[#5f6672]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px]">
          <div>
            © 2026 ReachInbox Outbox System · Production Deployment
          </div>
          <div className="flex items-center gap-6">
            <span>BullMQ 5.7</span>
            <span>·</span>
            <span>Elasticsearch 8.11</span>
            <span>·</span>
            <span>PostgreSQL 15</span>
          </div>
        </div>
      </footer>
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
