import { Router, Request, Response } from 'express';
import passport from 'passport';
import { config } from '../config';

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
  passport.authenticate('google', { failureRedirect: `${config.frontendUrl}/login?error=auth_failed` }),
  (req: Request, res: Response) => {
    // Successful authentication, redirect to dashboard
    res.redirect(`${config.frontendUrl}/dashboard`);
  }
);

// Get current user info (/me alias)
router.get('/me', (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ authenticated: false });
  }
  const user = req.user as any;
  res.json({
    id: user.id,
    googleId: user.googleId || user.google_id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl || user.avatar_url,
    slackConnected: !!user.slackAccessToken,
  });
});

// Get current user info
router.get('/auth/me', (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ authenticated: false });
  }
  const user = req.user as any;
  res.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      slackConnected: !!user.slackAccessToken,
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
