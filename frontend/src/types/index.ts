export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  slackConnected: boolean;
}

export interface EmailJob {
  id: string;
  recipientEmail: string;
  subject: string;
  scheduledAt: string;
  sentAt?: string;
  failedAt?: string;
  status: 'scheduled' | 'processing' | 'sent' | 'failed' | 'rate_limited';
  senderEmail?: string;
  previewUrl?: string;
  errorMessage?: string;
  campaignId?: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  subject: string;
  body: string;
  senderEmail: string;
  startTime: string;
  delayBetweenEmailsMs: number;
  hourlyLimit: number;
  totalRecipients: number;
  scheduledCount: number;
  sentCount: number;
  failedCount: number;
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ScheduleEmailRequest {
  recipients: string[];
  subject: string;
  body: string;
  senderEmail: string;
  senderName?: string;
  startTime: string;
  delayBetweenEmailsMs?: number;
  hourlyLimit?: number;
}

export interface ParseCSVResponse {
  emails: string[];
  count: number;
}

export interface RateLimitStatus {
  senderEmail: string;
  current: number;
  limit: number;
  resetAt: string;
}
