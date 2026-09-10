'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { emailsApi } from '@/lib/api';
import type { EmailJob, PaginatedResponse } from '@/types';
import { StatusBadge } from './ui/StatusBadge';
import { LoadingSpinner, EmptyState } from './ui/LoadingState';
import { Button } from './ui/Button';

function formatDateTime(date: string | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface EmailsTableProps {
  type: 'scheduled' | 'sent';
  refreshKey?: number;
}

export function EmailsTable({ type, refreshKey = 0 }: EmailsTableProps) {
  const [data, setData] = useState<PaginatedResponse<EmailJob> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const limit = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result =
        type === 'scheduled'
          ? await emailsApi.getScheduled(page, limit)
          : await emailsApi.getSent(page, limit);
      setData(result);
    } catch (err) {
      console.error('Failed to load emails', err);
    } finally {
      setLoading(false);
    }
  }, [type, page]);

  useEffect(() => {
    if (!searchQuery) {
      fetchData();
    }
  }, [fetchData, searchQuery, refreshKey]);

  // Auto-refresh every 10 seconds for scheduled emails
  useEffect(() => {
    if (type !== 'scheduled') return;
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [type, fetchData]);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchQuery('');
      return;
    }
    setSearchQuery(query);
    setSearching(true);
    try {
      const result = await emailsApi.search(query, type === 'scheduled' ? 'scheduled' : undefined, 1, limit);
      setData(result);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setSearching(false);
    }
  }, [type]);

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  const columns =
    type === 'scheduled'
      ? ['Recipient', 'Subject', 'Sender', 'Scheduled At', 'Status']
      : ['Recipient', 'Subject', 'Sender', 'Sent At', 'Status', 'Preview'];

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder={`Search ${type === 'scheduled' ? 'scheduled' : 'sent'} emails...`}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
          onChange={(e) => handleSearch(e.target.value)}
          id={`search-${type}-emails`}
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="animate-spin h-4 w-4 text-violet-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white/3 border border-white/5 rounded-2xl overflow-hidden">
        {loading ? (
          <LoadingSpinner message={`Loading ${type} emails...`} />
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            icon={type === 'scheduled' ? '⏰' : '📬'}
            title={`No ${type} emails yet`}
            description={
              type === 'scheduled'
                ? 'Schedule your first email campaign to see it here'
                : 'Sent emails will appear here after delivery'
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {columns.map((col) => (
                      <th
                        key={col}
                        className="px-5 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/3">
                  {data.data.map((email) => (
                    <tr
                      key={email.id}
                      className="hover:bg-white/3 transition-colors group"
                    >
                      <td className="px-5 py-3.5 text-sm text-white/80 font-mono text-xs">
                        {email.recipientEmail}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-white/70 max-w-[200px] truncate">
                        {email.subject}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-white/40 font-mono">
                        {email.senderEmail || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-white/50 whitespace-nowrap">
                        {type === 'scheduled'
                          ? formatDateTime(email.scheduledAt)
                          : formatDateTime(email.sentAt || email.failedAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={email.status} />
                      </td>
                      {type === 'sent' && (
                        <td className="px-5 py-3.5">
                          {email.previewUrl ? (
                            <a
                              href={email.previewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-violet-400 hover:text-violet-300 transition-colors underline underline-offset-2"
                            >
                              View →
                            </a>
                          ) : (
                            <span className="text-xs text-white/20">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
                <span className="text-xs text-white/30">
                  Showing {(page - 1) * limit + 1}–{Math.min(page * limit, data.total)} of {data.total}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    ← Prev
                  </Button>
                  <span className="px-3 py-1.5 text-xs text-white/50">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next →
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Stats */}
      {data && data.total > 0 && (
        <p className="text-xs text-white/30 text-right">
          {data.total} total {type} email{data.total !== 1 ? 's' : ''}
          {type === 'scheduled' && ' • Auto-refreshes every 10s'}
        </p>
      )}
    </div>
  );
}
