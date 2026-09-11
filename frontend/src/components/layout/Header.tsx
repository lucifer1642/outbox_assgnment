'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';

export function Header() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      showToast('error', 'Logout failed. Clearing session.');
      window.location.href = '/login';
    }
  };

  return (
    <nav className="sticky top-0 z-40">
      <div className="nav-inner">
        {/* ── Brand ──────────────────────────────────────────────── */}
        <Link href="/dashboard" className="brand" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="brand-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="#0b0c10" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 11 14 10 22 21 10 13 10 13 2" />
            </svg>
          </div>
          <span className="brand-name">ReachInbox</span>
          <span className="brand-badge">OUTBOX</span>
        </Link>

        {/* ── Center / Status ────────────────────────────────────── */}
        <div className="hidden sm:flex items-center gap-6">
          <div className="uptime">
            <span className="dot"></span>
            99.99% system uptime
          </div>
        </div>

        {/* ── User Controls ──────────────────────────────────────── */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 py-1.5 px-2.5 rounded-xl hover:bg-white/[0.04] transition-all duration-150 focus-ring"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}
            >
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.name}
                  width={28}
                  height={28}
                  className="rounded-full ring-1 ring-violet-400/40"
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-[#0b0c10]"
                  style={{ background: 'linear-gradient(135deg, var(--violet), var(--blue))' }}
                >
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-[13px] font-semibold text-white leading-none truncate max-w-[120px]">
                  {user.name}
                </span>
                <span className="text-[10px] text-white/40 leading-none mt-0.5 truncate max-w-[120px] font-mono">
                  {user.email}
                </span>
              </div>
              <ChevronDown
                size={13}
                className={`text-white/35 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* ── Dropdown ──────────────────────────────────────── */}
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl overflow-hidden z-50 bg-[#131620]/95 backdrop-blur-2xl border border-white/[0.12]"
                >
                  {/* User info */}
                  <div className="px-4 py-3.5 border-b border-white/[0.08] bg-white/[0.02]">
                    <p className="text-sm font-semibold text-white truncate" style={{ fontFamily: 'var(--font-display)' }}>{user.name}</p>
                    <p className="text-xs text-[#98a0ae] truncate font-mono mt-0.5">{user.email}</p>
                  </div>

                  {/* Menu items */}
                  <div className="p-1.5 space-y-1">
                    <Link
                      href="/settings/integrations"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#f3f4f7] hover:bg-white/[0.06] transition-colors"
                    >
                      <Settings size={14} className="text-[#8b7cff]" />
                      <span>Settings &amp; Integrations</span>
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-white/[0.08] p-1.5">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        handleLogout();
                      }}
                      disabled={isLoggingOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-red-500/10 text-red-400 disabled:opacity-50 text-left cursor-pointer"
                    >
                      {isLoggingOut ? (
                        <svg className="animate-spin h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <LogOut size={14} className="text-red-400" />
                      )}
                      <span>{isLoggingOut ? 'Signing out…' : 'Sign out'}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </nav>
  );
}
