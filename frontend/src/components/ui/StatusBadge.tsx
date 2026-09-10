'use client';

import React from 'react';

interface StatusBadgeProps {
  status: string;
  failureReason?: string;
}

export function StatusBadge({ status, failureReason }: StatusBadgeProps) {
  const key = status.toLowerCase();

  let pillClass = 'pill';
  let label = status;

  if (key === 'pending') {
    pillClass = 'pill pending';
    label = 'Pending';
  } else if (key === 'scheduled') {
    pillClass = 'pill scheduled';
    label = 'Scheduled';
  } else if (key === 'sent') {
    pillClass = 'pill sent';
    label = 'Sent';
  } else if (key === 'failed') {
    pillClass = 'pill';
    label = 'Failed';
  } else if (key === 'rate_limited' || key === 'rate-limited') {
    pillClass = 'pill pending';
    label = 'Rate Limited';
  } else if (key === 'delayed') {
    pillClass = 'pill pending';
    label = 'Delayed';
  } else if (key === 'processing') {
    pillClass = 'pill scheduled';
    label = 'Processing';
  }

  const tooltip = failureReason || (key.includes('rate') ? 'Delayed due to hourly limit' : undefined);

  return (
    <span
      className={pillClass}
      title={tooltip}
      style={
        key === 'failed'
          ? { background: 'rgba(248,113,113,0.1)', color: 'var(--coral)' }
          : undefined
      }
    >
      <i
        style={
          key === 'failed'
            ? { background: 'var(--coral)' }
            : undefined
        }
      />
      <span>{label}</span>
    </span>
  );
}
