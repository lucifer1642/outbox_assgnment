import { Worker, Job } from 'bullmq';
import { createBullMQConnection } from '../config/redis';
import { config } from '../config';
import { logger } from '../db/logger';
import { pool } from '../db/pool';
import { QUEUE_NAME, EmailJobData } from './emailQueue';
import { sendEmail } from '../services/emailService';
import { checkAndIncrementRateLimit, getDelayUntilNextHour } from '../services/rateLimitService';
import { updateEmailInIndex } from '../services/elasticsearchService';
import { sendSlackRateLimitNotification } from '../services/slackService';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Track per-sender rate limit notifications to avoid sending duplicate Slack msgs
const notifiedThisHour = new Map<string, boolean>();

// Clear notification cache at the top of each hour
setInterval(() => {
  notifiedThisHour.clear();
}, 60 * 60 * 1000);

async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
  const {
    emailJobId,
    recipientEmail,
    subject,
    body,
    senderEmail,
    senderName,
    userId,
    idempotencyKey,
    campaignId,
  } = job.data;

  logger.info('Processing email job', { jobId: job.id, emailJobId, recipientEmail });

  // 1. Check idempotency — if already sent, skip
  const existingJob = await pool.query<{ status: string }>(
    'SELECT status FROM email_jobs WHERE id = $1',
    [emailJobId]
  );

  if (existingJob.rows[0]?.status === 'sent') {
    logger.warn('Email already sent, skipping (idempotency check)', { emailJobId });
    return;
  }

  if (existingJob.rows[0]?.status === 'failed_permanent') {
    logger.warn('Email permanently failed, skipping', { emailJobId });
    return;
  }

  // 2. Per-sender rate limiting (Redis-backed, safe across multiple workers)
  const campaignResult = await pool.query<{ hourly_limit: number }>(
    'SELECT hourly_limit FROM campaigns WHERE id = $1',
    [campaignId]
  );
  const hourlyLimit = campaignResult.rows[0]?.hourly_limit ?? config.rateLimiting.maxEmailsPerHourPerSender;

  const rateLimitResult = await checkAndIncrementRateLimit(senderEmail, hourlyLimit);

  if (!rateLimitResult.allowed) {
    // Rate limit exceeded — reschedule to next hour window
    const delayMs = getDelayUntilNextHour();
    const nextWindowAt = rateLimitResult.resetAt;

    logger.warn('Rate limit exceeded, rescheduling email to next hour', {
      emailJobId,
      senderEmail,
      current: rateLimitResult.current,
      limit: rateLimitResult.limit,
      delayMs,
      nextWindowAt: nextWindowAt.toISOString(),
    });

    // Update DB status to 'rate_limited'
    await pool.query(
      `UPDATE email_jobs SET status = 'rate_limited', updated_at = NOW() WHERE id = $1`,
      [emailJobId]
    );

    // Update Elasticsearch
    await updateEmailInIndex(emailJobId, {
      status: 'rate_limited',
    });

    // Send Slack notification (once per hour per sender to avoid spam)
    const notifyKey = `${userId}:${senderEmail}`;
    if (!notifiedThisHour.get(notifyKey)) {
      notifiedThisHour.set(notifyKey, true);
      await sendSlackRateLimitNotification(
        userId,
        senderEmail,
        rateLimitResult.current,
        rateLimitResult.limit,
        nextWindowAt
      );
    }

    // Move job to delayed state in BullMQ (preserves the job, reschedules it)
    await job.moveToDelayed(Date.now() + delayMs, job.token);
    return;
  }

  // 3. Minimum delay between sends (throttling)
  await sleep(config.worker.minDelayBetweenSendsMs);

  // 4. Mark as processing
  await pool.query(
    `UPDATE email_jobs SET status = 'processing', updated_at = NOW() WHERE id = $1`,
    [emailJobId]
  );

  // 5. Send the email
  try {
    const result = await sendEmail({
      from: senderEmail,
      fromName: senderName,
      to: recipientEmail,
      subject,
      html: body,
    });

    // 6. Update DB to 'sent'
    await pool.query(
      `UPDATE email_jobs
       SET status = 'sent', sent_at = NOW(), preview_url = $1, updated_at = NOW()
       WHERE id = $2`,
      [result.previewUrl, emailJobId]
    );

    // Update campaign count
    if (campaignId) {
      await pool.query(
        `UPDATE campaigns SET sent_count = sent_count + 1, updated_at = NOW() WHERE id = $1`,
        [campaignId]
      );
    }

    // 7. Update Elasticsearch
    await updateEmailInIndex(emailJobId, {
      status: 'sent',
      sentAt: new Date().toISOString(),
      previewUrl: result.previewUrl,
    });

    logger.info('Email sent successfully', {
      emailJobId,
      recipientEmail,
      messageId: result.messageId,
      previewUrl: result.previewUrl,
    });
  } catch (err: any) {
    logger.error('Email send failed', { emailJobId, error: err.message });

    // Update DB to 'failed'
    await pool.query(
      `UPDATE email_jobs
       SET status = 'failed', failed_at = NOW(), error_message = $1, updated_at = NOW()
       WHERE id = $2`,
      [err.message, emailJobId]
    );

    if (campaignId) {
      await pool.query(
        `UPDATE campaigns SET failed_count = failed_count + 1, updated_at = NOW() WHERE id = $1`,
        [campaignId]
      );
    }

    await updateEmailInIndex(emailJobId, { status: 'failed' });

    throw err; // Let BullMQ handle retries
  }
}

let workerInstance: Worker | null = null;

export function startEmailWorker(): Worker<EmailJobData> {
  if (workerInstance) {
    return workerInstance;
  }

  workerInstance = new Worker<EmailJobData>(QUEUE_NAME, processEmailJob, {
    connection: createBullMQConnection(),
    concurrency: config.worker.concurrency,
    // BullMQ limiter: max 1 job every MIN_DELAY_BETWEEN_SENDS_MS globally
    // Combined with the sleep() in processEmailJob for per-job throttling
    limiter: {
      max: 1,
      duration: config.worker.minDelayBetweenSendsMs,
    },
  });

  workerInstance.on('completed', (job) => {
    logger.info('Job completed', { jobId: job.id });
  });

  workerInstance.on('failed', (job, err) => {
    logger.error('Job failed', { jobId: job?.id, error: err.message });
  });

  workerInstance.on('stalled', (jobId) => {
    logger.warn('Job stalled', { jobId });
  });

  workerInstance.on('error', (err) => {
    logger.error('Worker error', { error: err.message });
  });

  logger.info('Email worker started', {
    concurrency: config.worker.concurrency,
    minDelayBetweenSendsMs: config.worker.minDelayBetweenSendsMs,
  });

  return workerInstance;
}

export async function stopEmailWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.close();
    workerInstance = null;
    logger.info('Email worker stopped');
  }
}
