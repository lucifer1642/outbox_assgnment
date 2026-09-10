'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, Plus } from 'lucide-react';

interface TabNavProps {
  activeTab: 'scheduled' | 'sent';
  onTabChange: (tab: 'scheduled' | 'sent') => void;
  onComposeClick: () => void;
}

const tabs = [
  { id: 'scheduled' as const, label: 'Scheduled Queue', icon: Calendar },
  { id: 'sent' as const, label: 'Sent History', icon: CheckCircle },
];

export function TabNav({ activeTab, onTabChange, onComposeClick }: TabNavProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* ── Tab Pills ────────────────────────────────────────── */}
      <div className="flex items-center glass p-1 rounded-2xl w-fit" style={{ border: '1px solid var(--glass-border)' }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative flex items-center gap-2 px-4 py-2 rounded-xl
                text-xs font-semibold transition-colors duration-150
                ${isActive ? 'text-[#0b0c10]' : 'text-white/50 hover:text-white/80'}
              `}
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-xl shadow-md"
                  style={{
                    background: 'linear-gradient(120deg, var(--violet), var(--blue))',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon size={13} />
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Primary CTA ──────────────────────────────────────── */}
      <button
        onClick={onComposeClick}
        className="btn btn-primary w-full sm:w-auto justify-center"
        style={{ padding: '9px 18px', fontSize: '13.5px' }}
      >
        <Plus size={15} strokeWidth={2.5} />
        <span>Compose New Email</span>
      </button>
    </div>
  );
}
