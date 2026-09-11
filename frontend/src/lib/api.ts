import axios from 'axios';
import type {
  User,
  EmailJob,
  Campaign,
  PaginatedResponse,
  ScheduleEmailRequest,
  ParseCSVResponse,
  RateLimitStatus,
} from '@/types';

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((reqConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('reachinbox_auth_token');
    if (token) {
      reqConfig.headers.Authorization = `Bearer ${token}`;
    }
  }
  return reqConfig;
});

// ─── Auth ──────────────────────────────────────────────────────────────────

export const authApi = {
  getMe: (): Promise<{ authenticated: boolean; user?: User }> =>
    api
      .get('/auth/me')
      .then((r) => r.data)
      .catch((err) => {
        if (err.response?.status === 401) {
          return { authenticated: false };
        }
        throw err;
      }),

  logout: (): Promise<{ success: boolean }> =>
    api.post('/auth/logout').then((r) => r.data),
};

// ─── Emails ────────────────────────────────────────────────────────────────

export const emailsApi = {
  parseCSV: (file: File): Promise<ParseCSVResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post('/emails/parse-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  schedule: (data: ScheduleEmailRequest): Promise<{ campaignId: string; scheduledCount: number; message: string }> =>
    api.post('/emails/schedule', data).then((r) => r.data),

  getScheduled: (page = 1, limit = 20): Promise<PaginatedResponse<EmailJob>> =>
    api.get('/emails/scheduled', { params: { page, limit } }).then((r) => r.data),

  getSent: (page = 1, limit = 20): Promise<PaginatedResponse<EmailJob>> =>
    api.get('/emails/sent', { params: { page, limit } }).then((r) => r.data),

  search: (
    query: string,
    status?: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<EmailJob>> =>
    api
      .get('/emails/search', { params: { q: query, status, page, limit } })
      .then((r) => r.data),

  getRateLimit: (senderEmail: string): Promise<RateLimitStatus> =>
    api.get(`/emails/rate-limit/${encodeURIComponent(senderEmail)}`).then((r) => r.data),
};

// ─── Campaigns ─────────────────────────────────────────────────────────────

export const campaignsApi = {
  list: (): Promise<{ data: Campaign[] }> =>
    api.get('/campaigns').then((r) => r.data),
};

// ─── Slack ─────────────────────────────────────────────────────────────────

export const slackApi = {
  getStatus: (): Promise<{ connected: boolean; teamId: string | null }> =>
    api.get('/slack/status').then((r) => r.data),

  connect: (): void => {
    window.location.href = `${API_BASE}/slack/connect`;
  },

  disconnect: (): Promise<{ success: boolean }> =>
    api.delete('/slack/disconnect').then((r) => r.data),
};

// ─── Error handler ─────────────────────────────────────────────────────────

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      const isPublicPath = currentPath === '' || currentPath === '/' || currentPath.startsWith('/login');
      const isAuthCheck = error.config?.url?.includes('/auth/me');

      if (typeof window !== 'undefined' && !isPublicPath && !isAuthCheck) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
