import { Queue } from 'bullmq';
import { createBullMQConnection } from '../config/redis';
import { config } from '../config';
import { logger } from '../db/logger';

export interface EmailJobData {
  emailJobId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  senderEmail: string;
  senderName: string;
  userId: string;
  senderId?: string;
  campaignId?: string;
  idempotencyKey: string;
}

export const QUEUE_NAME = 'email-scheduler';

export const emailQueue = new Queue<EmailJobData>(QUEUE_NAME, {
  connection: createBullMQConnection(),
  defaultJobOptions: {
    removeOnComplete: {
      age: 3600, // keep completed jobs for 1 hour
      count: 1000,
    },
    removeOnFail: {
      age: 24 * 3600, // keep failed jobs for 24 hours
    },
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

emailQueue.on('error', (err) => {
  logger.error('Email queue error', { error: err.message });
});

/**
 * Schedule an email job with a specific delay.
 * Uses jobId = email:{emailJobId} to ensure idempotency —
 * adding the same job twice will be ignored by BullMQ.
 */
export async function scheduleEmailJob(
  data: EmailJobData,
  scheduledAt: Date
): Promise<string> {
  const delay = Math.max(0, scheduledAt.getTime() - Date.now());
  const jobId = `email:${data.emailJobId}`;

  const job = await emailQueue.add(QUEUE_NAME, data, {
    jobId,
    delay,
    // BullMQ rate limiter: max 1 job processed per MIN_DELAY_BETWEEN_SENDS_MS
    // This enforces per-worker throttling
  });

  logger.info('Email job scheduled', {
    jobId,
    emailJobId: data.emailJobId,
    delayMs: delay,
    scheduledAt: scheduledAt.toISOString(),
  });

  return job.id!;
}

export default emailQueue;
