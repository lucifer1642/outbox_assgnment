'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────────── */

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (type: Toast['type'], message: string) => void;
  showToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
}

/* ── Context ───────────────────────────────────────────────────────────── */

const ToastContext = createContext<ToastContextValue | null>(null);

/* ── Provider ──────────────────────────────────────────────────────────── */

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, showToast: addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

/* ── Toast Config ──────────────────────────────────────────────────────── */

const toastConfig: Record<Toast['type'], {
  icon: React.ElementType;
  bg: string;
  border: string;
  text: string;
  progressColor: string;
}> = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-emerald-500/8',
    border: 'border-emerald-500/15',
    text: 'text-emerald-300',
    progressColor: 'bg-emerald-400',
  },
  error: {
    icon: XCircle,
    bg: 'bg-rose-500/8',
    border: 'border-rose-500/15',
    text: 'text-rose-300',
    progressColor: 'bg-rose-400',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-500/8',
    border: 'border-amber-500/15',
    text: 'text-amber-300',
    progressColor: 'bg-amber-400',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-500/8',
    border: 'border-blue-500/15',
    text: 'text-blue-300',
    progressColor: 'bg-blue-400',
  },
};

/* ── Container ─────────────────────────────────────────────────────────── */

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const config = toastConfig[toast.type];
          const Icon = config.icon;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 80, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.9 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={`
                pointer-events-auto relative overflow-hidden
                flex items-start gap-3 px-4 py-3.5 rounded-xl
                border backdrop-blur-xl shadow-2xl shadow-black/30
                ${config.bg} ${config.border}
              `}
            >
              <Icon size={18} className={`${config.text} mt-0.5 shrink-0`} />
              <span className={`${config.text} text-sm font-medium flex-1 leading-snug`}>
                {toast.message}
              </span>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-white/25 hover:text-white/50 transition-colors shrink-0 mt-0.5"
              >
                <X size={14} />
              </button>

              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
                <div
                  className={`h-full ${config.progressColor} opacity-50`}
                  style={{ animation: 'progress-shrink 4s linear forwards' }}
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/* ── Hook ──────────────────────────────────────────────────────────────── */

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
