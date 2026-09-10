'use client';

import React from 'react';
import { motion } from 'framer-motion';

/* ── Premium Orbital Spinner ───────────────────────────────────────────── */

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

const sizePx = { sm: 24, md: 40, lg: 56 };

export function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
  const s = sizePx[size];
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="relative" style={{ width: s, height: s }}>
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent"
          style={{
            borderTopColor: 'rgba(124, 58, 237, 0.8)',
            borderRightColor: 'rgba(99, 102, 241, 0.3)',
          }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
        />
        {/* Inner ring */}
        <motion.div
          className="absolute rounded-full border-2 border-transparent"
          style={{
            inset: '20%',
            borderBottomColor: 'rgba(59, 130, 246, 0.7)',
            borderLeftColor: 'rgba(124, 58, 237, 0.2)',
          }}
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
        />
        {/* Center dot */}
        <motion.div
          className="absolute rounded-full bg-violet-500"
          style={{ inset: '40%' }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        />
      </div>
      {message && (
        <p className="text-sm text-white/40 font-medium tracking-wide">{message}</p>
      )}
    </div>
  );
}

/* ── Full-Page Loading State ───────────────────────────────────────────── */

export function FullPageLoader({ message }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-root)] bg-mesh">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-6"
      >
        <LoadingSpinner size="lg" />
        {message && (
          <p className="text-sm text-white/40 font-medium tracking-wide">{message}</p>
        )}
      </motion.div>
    </div>
  );
}

/* ── Empty State ───────────────────────────────────────────────────────── */

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center gap-5 py-20 text-center"
    >
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
          {icon}
        </div>
      )}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white/80">{title}</h3>
        {description && (
          <p className="text-sm text-white/40 max-w-md mx-auto leading-relaxed">{description}</p>
        )}
      </div>
      {action}
    </motion.div>
  );
}
