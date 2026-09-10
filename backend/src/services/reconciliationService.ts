import { emailQueue, scheduleEmailJob } from '../queues/emailQueue';
import { pool } from '../db/pool';
import { logger } from '../db/logger';

/**
 * Service Boot Reconciliation
 * Scans DB for 'scheduled' or 'rate_limited' recipients that do not have
 * an active BullMQ delayed job, and re-enqueues only those.
 */
export async function reconcilePendingJobs(): Promise<void> {
  logger.info('Starting boot reconciliation check for pending email jobs...');

  try {
    const pendingResult = await pool.query<{
      id: string;
      user_id: string;
      recipient_email: string;
      subject: string;
      body: string;
      scheduled_at: Date;
      campaign_id: string;
      idempotency_key: string;
      sender_email_col: string;
      bullmq_job_id: string;
    }>(
      `SELECT ej.id, ej.user_id, ej.recipient_email, ej.subject, ej.body,
              ej.scheduled_at, ej.campaign_id, ej.idempotency_key, ej.bullmq_job_id,
              c.sender_email as sender_email_col
       FROM email_jobs ej
       LEFT JOIN campaigns c ON ej.campaign_id = c.id
       WHERE ej.status IN ('scheduled', 'rate_limited')`
    );

    let reEnqueuedCount = 0;

    for (const row of pendingResult.rows) {
      // Check if job exists in BullMQ
      const existingBullJob = row.bullmq_job_id ? await emailQueue.getJob(row.bullmq_job_id) : null;

      if (!existingBullJob) {
        // Compute delay from original scheduled_at, never from now + full delay
        const newBullJobId = await scheduleEmailJob(
          {
            emailJobId: row.id,
            recipientEmail: row.recipient_email,
            subject: row.subject,
            body: row.body,
            senderEmail: row.sender_email_col || 'test@ethereal.email',
            senderName: row.sender_email_col || 'Outbox Sender',
            userId: row.user_id,
            campaignId: row.campaign_id,
            idempotencyKey: row.idempotency_key,
          },
          new Date(row.scheduled_at)
        );

        await pool.query(
          'UPDATE email_jobs SET bullmq_job_id = $1 WHERE id = $2',
          [newBullJobId, row.id]
        );

        reEnqueuedCount++;
      }
    }

    logger.info(`Boot reconciliation complete. Re-enqueued ${reEnqueuedCount} missing jobs.`);
  } catch (err: any) {
    logger.error('Error during boot reconciliation', { error: err.message });
  }
}
