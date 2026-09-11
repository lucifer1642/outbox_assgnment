import { Router, Request, Response } from 'express';
import passport from 'passport';
import { config } from '../config';
import { signToken, AuthenticatedUser } from '../middleware/auth';

const router = Router();

// Initiate Google OAuth flow
router.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
  })
);

// Google OAuth callback
router.get(
  '/auth/google/callback',
  (req: Request, res: Response, next) => {
    if (req.query.error) {
      return res.redirect(`${config.frontendUrl}/login?error=${encodeURIComponent(String(req.query.error))}`);
    }
    if (!req.query.code) {
      return res.redirect(`${config.frontendUrl}/login?error=missing_code`);
    }
    passport.authenticate('google', (err: any, user: any) => {
      if (err) {
        console.error('Google OAuth callback error:', err);
        return res.redirect(`${config.frontendUrl}/login?error=oauth_error&message=${encodeURIComponent(err.message || 'error')}`);
      }
      if (!user) {
        return res.redirect(`${config.frontendUrl}/login?error=auth_failed`);
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error('Session login error:', loginErr);
          return res.redirect(`${config.frontendUrl}/login?error=session_error`);
        }

        const token = signToken({
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl || user.avatar_url,
          slackAccessToken: user.slackAccessToken || user.slack_access_token,
          exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
        });

        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('Session save error:', saveErr);
          }
          return res.redirect(`${config.frontendUrl}/dashboard?token=${encodeURIComponent(token)}`);
        });
      });
    })(req, res, next);
  }
);

// Get current user info (/me alias)
router.get('/me', (req: Request, res: Response) => {
  const isAuthed = (req.isAuthenticated && req.isAuthenticated()) || Boolean(req.user);
  if (!isAuthed || !req.user) {
    return res.status(401).json({ authenticated: false });
  }
  const user = req.user as any;
  res.json({
    authenticated: true,
    user: {
      id: user.id,
      googleId: user.googleId || user.google_id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl || user.avatar_url,
      slackConnected: Boolean(user.slackAccessToken || user.slack_access_token),
    },
  });
});

// Get current user info
router.get('/auth/me', (req: Request, res: Response) => {
  const isAuthed = (req.isAuthenticated && req.isAuthenticated()) || Boolean(req.user);
  if (!isAuthed || !req.user) {
    return res.status(401).json({ authenticated: false });
  }
  const user = req.user as any;
  res.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl || user.avatar_url,
      slackConnected: Boolean(user.slackAccessToken || user.slack_access_token),
    },
  });
});

// Logout
router.post('/auth/logout', (req: Request, res: Response, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ success: true, message: 'Logged out successfully' });
    });
  });
});

export default router;
