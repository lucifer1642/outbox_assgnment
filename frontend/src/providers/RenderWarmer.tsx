'use client';

import { useEffect } from 'react';
import { API_BASE } from '@/lib/api';

/**
 * Pre-warms the Render backend container in the background as soon as any visitor arrives.
 * This prevents the Render free-tier cold start splash screen from appearing when clicking login.
 */
export function RenderWarmer() {
  useEffect(() => {
    if (typeof window !== 'undefined' && API_BASE && !API_BASE.includes('localhost')) {
      try {
        fetch(`${API_BASE}/health`, { mode: 'no-cors' }).catch(() => {});
      } catch (_) {}
    }
  }, []);

  return null;
}
