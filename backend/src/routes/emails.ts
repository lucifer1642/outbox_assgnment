import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../middleware/auth';
import { pool } from '../db/pool';
import { scheduleEmailJob } from '../queues/emailQueue';
import { indexEmail, searchEmails } from '../services/elasticsearchService';
import { getCurrentHourCount } from '../services/rateLimitService';
import { AuthenticatedUser } from '../middleware/auth';
import { logger } from '../db/logger';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Handlers
const handleParseCsv = (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const content = req.file.buffer.toString('utf-8');
    const emails: string[] = [];

    try {
      const records = parse(content, {
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
      });
      for (const row of records) {
        for (const cell of (Array.isArray(row) ? row : [row])) {
          const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
          const matches = String(cell).match(emailRegex);
          if (matches) emails.push(...matches);
        }
      }
    } catch {
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const matches = content.match(emailRegex) || [];
      emails.push(...matches);
    }

    const unique = [...new Set(emails)];
    res.json({ emails: unique, count: unique.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

const handleSchedule = async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthenticatedUser;
    const {
      recipients,          // string[]
      subject,
      body,
      senderEmail,
      senderName,
      startTime,           // ISO string
      delayBetweenEmailsMs = 2000,
      hourlyLimit,
    } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'recipients is required and must be a non-empty array' });
    }

    if (!subject || !body || !senderEmail || !startTime) {
      return res.status(400).json({ error: 'subject, body, senderEmail, startTime are required' });
    }

    const scheduledStart = new Date(startTime);
    if (isNaN(scheduledStart.getTime())) {
      return res.status(400).json({ error: 'Invalid startTime' });
    }

    const campaignId = uuidv4();
    await pool.query(
      `INSERT INTO campaigns (id, user_id, name, subject, body, sender_email, start_time, delay_between_emails_ms, hourly_limit, total_recipients, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')`,
      [
        campaignId,
        user.id,
        `Campaign ${new Date().toLocaleDateString()}`,
        subject,
        body,
        senderEmail,
        scheduledStart,
        delayBetweenEmailsMs,
        hourlyLimit || 200,
        recipients.length,
      ]
    );

    const scheduledJobs: { emailJobId: string; recipientEmail: string; scheduledAt: Date }[] = [];

    for (let i = 0; i < recipients.length; i++) {
      const recipientEmail = recipients[i].trim().toLowerCase();
      if (!recipientEmail) continue;

      const emailJobId = uuidv4();
      const idempotencyKey = `${campaignId}:${recipientEmail}`;
      const scheduledAt = new Date(scheduledStart.getTime() + i * delayBetweenEmailsMs);

      try {
        await pool.query(
          `INSERT INTO email_jobs
           (id, user_id, sender_id, recipient_email, subject, body, status, scheduled_at, campaign_id, idempotency_key)
           VALUES ($1, $2, NULL, $3, $4, $5, 'scheduled', $6, $7, $8)
           ON CONFLICT (idempotency_key) DO NOTHING`,
          [emailJobId, user.id, recipientEmail, subject, body, scheduledAt, campaignId, idempotencyKey]
        );
      } catch (dbErr: any) {
        logger.warn('Duplicate email job skipped', { idempotencyKey, error: dbErr.message });
        continue;
      }

      const bullJobId = await scheduleEmailJob(
        {
          emailJobId,
          recipientEmail,
          subject,
          body,
          senderEmail,
          senderName: senderName || senderEmail,
          userId: user.id,
          campaignId,
          idempotencyKey,
        },
        scheduledAt
      );

      await pool.query(
        'UPDATE email_jobs SET bullmq_job_id = $1 WHERE id = $2',
        [bullJobId, emailJobId]
      );

      await indexEmail({
        id: emailJobId,
        userId: user.id,
        recipientEmail,
        subject,
        body,
        senderEmail,
        status: 'scheduled',
        scheduledAt: scheduledAt.toISOString(),
        campaignId,
        createdAt: new Date().toISOString(),
      });

      scheduledJobs.push({ emailJobId, recipientEmail, scheduledAt });
    }

    await pool.query(
      'UPDATE campaigns SET scheduled_count = $1 WHERE id = $2',
      [scheduledJobs.length, campaignId]
    );

    logger.info('Campaign created and emails scheduled', {
      campaignId,
      userId: user.id,
      count: scheduledJobs.length,
    });

    res.status(201).json({
      success: true,
      campaignId,
      scheduledCount: scheduledJobs.length,
      message: `${scheduledJobs.length} emails scheduled successfully`,
    });
  } catch (err: any) {
    logger.error('Schedule emails error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
};

const handleGetScheduled = async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthenticatedUser;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const [dataResult, countResult] = await Promise.all([
      pool.query<{
        id: string;
        recipient_email: string;
        subject: string;
        scheduled_at: Date;
        status: string;
        sender_email_col: string;
        campaign_id: string;
        created_at: Date;
      }>(
        `SELECT ej.id, ej.recipient_email, ej.subject, ej.scheduled_at, ej.status,
                c.sender_email as sender_email_col, ej.campaign_id, ej.created_at
         FROM email_jobs ej
         LEFT JOIN campaigns c ON ej.campaign_id = c.id
         WHERE ej.user_id = $1 AND ej.status IN ('scheduled', 'processing', 'rate_limited')
         ORDER BY ej.scheduled_at ASC
         LIMIT $2 OFFSET $3`,
        [user.id, limit, offset]
      ),
      pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM email_jobs WHERE user_id = $1 AND status IN ('scheduled', 'processing', 'rate_limited')`,
        [user.id]
      ),
    ]);

    res.json({
      data: dataResult.rows.map((r) => ({
        id: r.id,
        recipientEmail: r.recipient_email,
        subject: r.subject,
        scheduledAt: r.scheduled_at,
        status: r.status,
        senderEmail: r.sender_email_col,
        campaignId: r.campaign_id,
        createdAt: r.created_at,
      })),
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

const handleGetSent = async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthenticatedUser;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const [dataResult, countResult] = await Promise.all([
      pool.query<{
        id: string;
        recipient_email: string;
        subject: string;
        sent_at: Date;
        failed_at: Date;
        status: string;
        preview_url: string;
        sender_email_col: string;
        error_message: string;
      }>(
        `SELECT ej.id, ej.recipient_email, ej.subject, ej.sent_at, ej.failed_at,
                ej.status, ej.preview_url, c.sender_email as sender_email_col, ej.error_message
         FROM email_jobs ej
         LEFT JOIN campaigns c ON ej.campaign_id = c.id
         WHERE ej.user_id = $1 AND ej.status IN ('sent', 'failed')
         ORDER BY COALESCE(ej.sent_at, ej.failed_at) DESC
         LIMIT $2 OFFSET $3`,
        [user.id, limit, offset]
      ),
      pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM email_jobs WHERE user_id = $1 AND status IN ('sent', 'failed')`,
        [user.id]
      ),
    ]);

    res.json({
      data: dataResult.rows.map((r) => ({
        id: r.id,
        recipientEmail: r.recipient_email,
        subject: r.subject,
        sentAt: r.sent_at,
        failedAt: r.failed_at,
        status: r.status,
        previewUrl: r.preview_url,
        senderEmail: r.sender_email_col,
        errorMessage: r.error_message,
      })),
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

const handleSearch = async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthenticatedUser;
    const { q, status, page = '1', limit = '20' } = req.query as Record<string, string>;

    const result = await searchEmails({
      userId: user.id,
      query: q,
      status,
      from: (parseInt(page) - 1) * parseInt(limit),
      size: parseInt(limit),
    });

    res.json({
      data: result.hits,
      total: result.total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Route registrations
router.post('/emails/parse-csv', requireAuth, upload.single('file'), handleParseCsv);

router.post('/emails/schedule', requireAuth, handleSchedule);
router.post('/campaigns', requireAuth, handleSchedule);

router.get('/emails/scheduled', requireAuth, handleGetScheduled);
router.get('/campaigns/scheduled', requireAuth, handleGetScheduled);

router.get('/emails/sent', requireAuth, handleGetSent);
router.get('/campaigns/sent', requireAuth, handleGetSent);

router.get('/emails/search', requireAuth, handleSearch);
router.get('/campaigns/search', requireAuth, handleSearch);


// ─── Get single email ──────────────────────────────────────────────────────

router.get('/emails/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthenticatedUser;
    const result = await pool.query(
      `SELECT ej.*, c.sender_email, c.name as campaign_name
       FROM email_jobs ej
       LEFT JOIN campaigns c ON ej.campaign_id = c.id
       WHERE ej.id = $1 AND ej.user_id = $2`,
      [req.params.id, user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Email not found' });
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Rate limit status for a sender ───────────────────────────────────────

router.get('/emails/rate-limit/:senderEmail', requireAuth, async (req: Request, res: Response) => {
  try {
    const { senderEmail } = req.params;
    const current = await getCurrentHourCount(senderEmail);
    const now = new Date();
    const resetAt = new Date(now);
    resetAt.setUTCMinutes(0, 0, 0);
    resetAt.setUTCHours(resetAt.getUTCHours() + 1);

    res.json({
      senderEmail,
      current,
      limit: parseInt(process.env.MAX_EMAILS_PER_HOUR_PER_SENDER || '200'),
      resetAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Campaigns list ────────────────────────────────────────────────────────

router.get('/campaigns', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthenticatedUser;
    const result = await pool.query(
      `SELECT * FROM campaigns WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [user.id]
    );
    res.json({ data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
