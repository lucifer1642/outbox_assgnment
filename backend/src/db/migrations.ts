import { pool } from './pool';
import { logger } from './logger';

export async function runMigrations(): Promise<void> {
  logger.info('Running database migrations...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      google_id VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      avatar_url TEXT,
      slack_access_token TEXT,
      slack_team_id VARCHAR(255),
      slack_channel_id VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS senders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      email VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      ethereal_user VARCHAR(255),
      ethereal_pass VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, email)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_jobs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      sender_id UUID REFERENCES senders(id) ON DELETE SET NULL,
      recipient_email VARCHAR(255) NOT NULL,
      subject VARCHAR(1000) NOT NULL,
      body TEXT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
      scheduled_at TIMESTAMPTZ NOT NULL,
      sent_at TIMESTAMPTZ,
      failed_at TIMESTAMPTZ,
      error_message TEXT,
      bullmq_job_id VARCHAR(255) UNIQUE,
      preview_url TEXT,
      idempotency_key VARCHAR(255) UNIQUE,
      campaign_id UUID,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(500) NOT NULL,
      subject VARCHAR(1000) NOT NULL,
      body TEXT NOT NULL,
      sender_email VARCHAR(255) NOT NULL,
      start_time TIMESTAMPTZ NOT NULL,
      delay_between_emails_ms INTEGER NOT NULL DEFAULT 2000,
      hourly_limit INTEGER NOT NULL DEFAULT 200,
      total_recipients INTEGER NOT NULL DEFAULT 0,
      scheduled_count INTEGER NOT NULL DEFAULT 0,
      sent_count INTEGER NOT NULL DEFAULT 0,
      failed_count INTEGER NOT NULL DEFAULT 0,
      status VARCHAR(50) NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Add campaign_id FK to email_jobs
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'email_jobs_campaign_id_fkey'
      ) THEN
        ALTER TABLE email_jobs
        ADD CONSTRAINT email_jobs_campaign_id_fkey
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL;
      END IF;
    END $$;
  `);

  // Indexes for performance
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_email_jobs_user_id ON email_jobs(user_id);
    CREATE INDEX IF NOT EXISTS idx_email_jobs_status ON email_jobs(status);
    CREATE INDEX IF NOT EXISTS idx_email_jobs_scheduled_at ON email_jobs(scheduled_at);
    CREATE INDEX IF NOT EXISTS idx_email_jobs_sender_id ON email_jobs(sender_id);
    CREATE INDEX IF NOT EXISTS idx_email_jobs_campaign_id ON email_jobs(campaign_id);
  `);

  logger.info('Database migrations completed successfully');
}
