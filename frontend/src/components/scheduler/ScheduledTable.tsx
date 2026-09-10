'use client';

import React, { useState } from 'react';
import { useScheduledEmails } from '@/hooks/useScheduledEmails';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, X, AlertTriangle, RefreshCw } from 'lucide-react';
import type { EmailJob } from '@/types';

interface ScheduledTableProps {
  onComposeClick: () => void;
}

export function ScheduledTable({ onComposeClick }: ScheduledTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const queryToUse = debouncedSearchQuery.length >= 3 || debouncedSearchQuery.length === 0 ? debouncedSearchQuery : '';

  const { data, isLoading, isError, refetch } = useScheduledEmails(page, limit, queryToUse, statusFilter);

  const columns: Column<EmailJob>[] = [
    {
      header: 'Recipient',
      accessorKey: 'recipientEmail',
      cell: (item) => (
        <span className="mono">{item.recipientEmail}</span>
      ),
    },
    {
      header: 'Subject',
      accessorKey: 'subject',
      cell: (item) => (
        <span className="font-medium text-white/90 text-[13.5px]">{item.subject}</span>
      ),
    },
    {
      header: 'Scheduled Time',
      accessorKey: 'scheduledAt',
      cell: (item) => (
        <span className="mono text-xs text-white/50">
          {new Date(item.scheduledAt).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      className: 'text-right',
      cell: (item) => (
        <div style={{ textAlign: 'right' }}>
          <StatusBadge status={item.status} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* ── Search & Filter Bar ────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="flex-1 flex items-center gap-2.5 glass px-3.5 py-2.5 rounded-xl">
          <Search size={14} className="text-white/30 shrink-0" />
          <input
            type="text"
            placeholder="Search recipient, subject, or body…"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="bg-transparent border-none text-white text-xs sm:text-sm focus:outline-none w-full placeholder:text-white/25"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setPage(1); }}
              className="text-white/30 hover:text-white/60 transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="
              glass appearance-none cursor-pointer rounded-xl
              text-white text-xs sm:text-sm pl-3.5 pr-8 py-2.5 min-w-[150px]
              focus:outline-none
            "
          >
            <option value="" style={{ background: '#0b0c10' }}>All Statuses</option>
            <option value="scheduled" style={{ background: '#0b0c10' }}>Scheduled</option>
            <option value="pending" style={{ background: '#0b0c10' }}>Pending</option>
            <option value="delayed" style={{ background: '#0b0c10' }}>Delayed</option>
            <option value="rate_limited" style={{ background: '#0b0c10' }}>Rate Limited</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
      </div>

      {/* ── Error State ────────────────────────────────────────── */}
      {isError ? (
        <div className="glass p-8 rounded-2xl text-center space-y-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto" style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--coral)' }}>
            <AlertTriangle size={18} />
          </div>
          <p className="text-xs font-medium" style={{ color: 'var(--coral)' }}>Couldn&apos;t load scheduled emails.</p>
          <button
            onClick={() => refetch()}
            className="btn btn-ghost"
            style={{ padding: '6px 14px', fontSize: '12px' }}
          >
            <RefreshCw size={12} />
            Retry
          </button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
          emptyTitle={(queryToUse || statusFilter) ? 'No results found' : 'No scheduled emails in queue'}
          emptyDescription={(queryToUse || statusFilter) ? 'Try adjusting your search query or filter.' : 'Your queue is empty. Schedule your first campaign now.'}
          onEmptyAction={(!queryToUse && !statusFilter) ? onComposeClick : () => { setSearchQuery(''); setStatusFilter(''); setPage(1); }}
          emptyActionText={(queryToUse || statusFilter) ? 'Clear filters' : 'Compose New Email'}
        />
      )}

      {/* ── Pagination ─────────────────────────────────────────── */}
      {data && data.total > limit && (
        <div className="flex items-center justify-between px-4 py-2.5 glass rounded-xl">
          <span className="mono text-xs text-white/40">
            Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, data.total)} of {data.total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-ghost"
              style={{ padding: '4px 12px', fontSize: '11px' }}
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * limit >= data.total}
              className="btn btn-ghost"
              style={{ padding: '4px 12px', fontSize: '11px' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
