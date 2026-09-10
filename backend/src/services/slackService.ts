import axios from 'axios';
import { pool } from '../db/pool';
import { config } from '../config';
import { logger } from '../db/logger';

export interface SlackTokenData {
  accessToken: string;
  teamId: string;
  channelId?: string;
}

/**
 * Exchange OAuth code for access token.
 */
export async function exchangeSlackCode(code: string): Promise<SlackTokenData> {
  const response = await axios.post('https://slack.com/api/oauth.v2.access', null, {
    params: {
      client_id: config.slack.clientId,
      client_secret: config.slack.clientSecret,
      code,
      redirect_uri: config.slack.redirectUri,
    },
  });

  if (!response.data.ok) {
    throw new Error(`Slack OAuth error: ${response.data.error}`);
  }

  const data = response.data;
  return {
    accessToken: data.access_token,
    teamId: data.team?.id || '',
    channelId: data.incoming_webhook?.channel_id,
  };
}

/**
 * Store Slack token for a user.
 */
export async function saveSlackToken(userId: string, tokenData: SlackTokenData): Promise<void> {
  await pool.query(
    `UPDATE users SET slack_access_token = $1, slack_team_id = $2, slack_channel_id = $3, updated_at = NOW()
     WHERE id = $4`,
    [tokenData.accessToken, tokenData.teamId, tokenData.channelId || null, userId]
  );
  logger.info('Slack token saved for user', { userId, teamId: tokenData.teamId });
}

/**
 * Get Slack token for a user.
 */
export async function getSlackToken(userId: string): Promise<string | null> {
  const result = await pool.query<{ slack_access_token: string | null }>(
    'SELECT slack_access_token FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0]?.slack_access_token || null;
}

/**
 * Disconnect Slack for a user.
 */
export async function disconnectSlack(userId: string): Promise<void> {
  await pool.query(
    `UPDATE users SET slack_access_token = NULL, slack_team_id = NULL, slack_channel_id = NULL, updated_at = NOW()
     WHERE id = $1`,
    [userId]
  );
}

/**
 * Send a Slack notification. Silently skips if no token is configured.
 * This is called when a sender hits the hourly rate limit.
 */
export async function sendSlackRateLimitNotification(
  userId: string,
  senderEmail: string,
  currentCount: number,
  limit: number,
  nextWindowAt: Date
): Promise<void> {
  try {
    const token = await getSlackToken(userId);
    if (!token) {
      logger.debug('Slack not connected for user, skipping rate limit notification', { userId });
      return;
    }

    const message = {
      text: `⚠️ *Rate Limit Reached*`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '⚠️ Email Rate Limit Reached',
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Sender:*\n${senderEmail}`,
            },
            {
              type: 'mrkdwn',
              text: `*Emails Sent This Hour:*\n${currentCount} / ${limit}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Remaining emails for this sender have been *rescheduled* to the next hour window: *${nextWindowAt.toUTCString()}*`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `ReachInbox Email Scheduler • ${new Date().toUTCString()}`,
            },
          ],
        },
      ],
    };

    // Use chat.postMessage with the bot token and default channel
    const result = await axios.post('https://slack.com/api/chat.postMessage', {
      ...message,
      channel: '#general', // Users can configure this; we'll use #general as default
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!result.data.ok) {
      // If #general fails, try posting to any accessible channel
      logger.warn('Slack postMessage to #general failed, trying alternative', { error: result.data.error });
      
      // Try using the incoming webhook if available
      const userResult = await pool.query<{ slack_channel_id: string | null }>(
        'SELECT slack_channel_id FROM users WHERE id = $1',
        [userId]
      );
      
      const channelId = userResult.rows[0]?.slack_channel_id;
      if (channelId) {
        await axios.post('https://slack.com/api/chat.postMessage', {
          ...message,
          channel: channelId,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    }

    logger.info('Slack rate limit notification sent', {
      userId,
      senderEmail,
      currentCount,
      limit,
    });
  } catch (err: any) {
    // Never crash the worker due to Slack notification failure
    logger.error('Failed to send Slack notification', {
      error: err.message,
      userId,
      senderEmail,
    });
  }
}
