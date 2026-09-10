import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { config } from '../config';
import {
  exchangeSlackCode,
  saveSlackToken,
  disconnectSlack,
} from '../services/slackService';
import { pool } from '../db/pool';
import { AuthenticatedUser } from '../middleware/auth';

const router = Router();

// Redirect user to Slack OAuth authorization page
router.get('/slack/connect', requireAuth, (req: Request, res: Response) => {
  const scopes = ['chat:write', 'chat:write.public', 'incoming-webhook'];
  const params = new URLSearchParams({
    client_id: config.slack.clientId,
    scope: scopes.join(','),
    redirect_uri: config.slack.redirectUri,
    state: (req.user as AuthenticatedUser).id, // pass userId as state for CSRF protection
  });
  res.redirect(`https://slack.com/oauth/v2/authorize?${params}`);
});

// Slack OAuth callback
router.get('/slack/callback', requireAuth, async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query as { code: string; state: string };
    const userId = (req.user as AuthenticatedUser).id;

    // Verify state matches userId (basic CSRF check)
    if (state !== userId) {
      return res.redirect(`${config.frontendUrl}/dashboard?error=slack_csrf`);
    }

    const tokenData = await exchangeSlackCode(code);
    await saveSlackToken(userId, tokenData);

    res.redirect(`${config.frontendUrl}/dashboard?slack=connected`);
  } catch (err: any) {
    res.redirect(`${config.frontendUrl}/dashboard?error=slack_failed`);
  }
});

// Disconnect Slack
router.delete('/slack/disconnect', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as AuthenticatedUser).id;
    await disconnectSlack(userId);
    res.json({ success: true, message: 'Slack disconnected' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Slack connection status
router.get('/slack/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as AuthenticatedUser).id;
    const result = await pool.query<{ slack_access_token: string | null; slack_team_id: string | null }>(
      'SELECT slack_access_token, slack_team_id FROM users WHERE id = $1',
      [userId]
    );
    const user = result.rows[0];
    res.json({
      connected: !!user?.slack_access_token,
      teamId: user?.slack_team_id || null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
