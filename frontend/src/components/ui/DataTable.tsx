'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Types ─────────────────────────────────────────────────────────────── */

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onEmptyAction?: () => void;
  emptyActionText?: string;
}

/* ── Shimmer Skeleton Row ──────────────────────────────────────────────── */

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <div
            className="h-3.5 rounded shimmer"
            style={{ width: `${50 + Math.random() * 40}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

/* ── Data Table ────────────────────────────────────────────────────────── */

export function DataTable<T extends { id: string }>({
  columns,
  data,
  isLoading = false,
  emptyTitle = 'No data available',
  emptyDescription = 'Get started by creating a new email schedule.',
  onEmptyAction,
  emptyActionText = 'Compose Email',
}: DataTableProps<T>) {
  /* Loading skeleton */
  if (isLoading) {
    return (
      <div className="glass rounded-[20px] overflow-hidden p-3">
        <table className="dash-table w-full">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx}>
                  <div className="h-3 w-16 rounded shimmer" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonRow key={i} cols={columns.length} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  /* Empty state */
  if (data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass rounded-[20px] p-12 text-center"
      >
        <div
          className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-4"
          style={{ background: 'rgba(139,124,255,0.1)', color: 'var(--violet)' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-6l-2 3h-4l-2-3H2" />
            <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-white/90 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
          {emptyTitle}
        </h3>
        <p className="text-xs text-white/40 max-w-sm mx-auto mb-6 leading-relaxed">
          {emptyDescription}
        </p>
        {onEmptyAction && (
          <button
            onClick={onEmptyAction}
            className="btn btn-primary"
            style={{ padding: '8px 18px', fontSize: '13px' }}
          >
            {emptyActionText}
          </button>
        )}
      </motion.div>
    );
  }

  /* Populated table */
  return (
    <div className="glass rounded-[20px] overflow-hidden p-2 sm:p-4">
      <div className="overflow-x-auto">
        <table className="dash-table w-full">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={col.className || ''}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <AnimatePresence mode="popLayout">
            <tbody>
              {data.map((row, rowIdx) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2, delay: rowIdx * 0.02 }}
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={col.className || ''}
                    >
                      {col.cell
                        ? col.cell(row)
                        : col.accessorKey
                          ? String(row[col.accessorKey] ?? '')
                          : ''}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </AnimatePresence>
        </table>
      </div>
    </div>
  );
}
