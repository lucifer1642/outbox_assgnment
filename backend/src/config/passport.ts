import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { pool } from '../db/pool';
import { config } from '../config';
import { logger } from '../db/logger';
import { AuthenticatedUser } from '../middleware/auth';

export function setupPassport(): void {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackUrl,
      },
      async (accessToken, refreshToken, profile: Profile, done) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value || '';
          const name = profile.displayName;
          const avatarUrl = profile.photos?.[0]?.value || null;

          // Upsert user in database
          const result = await pool.query<{
            id: string;
            email: string;
            name: string;
            avatar_url: string;
            slack_access_token: string | null;
          }>(
            `INSERT INTO users (google_id, email, name, avatar_url)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (google_id) DO UPDATE
             SET email = EXCLUDED.email, name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url, updated_at = NOW()
             RETURNING id, email, name, avatar_url, slack_access_token`,
            [googleId, email, name, avatarUrl]
          );

          const user = result.rows[0];
          const authUser: AuthenticatedUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatar_url,
            slackAccessToken: user.slack_access_token || undefined,
          };

          logger.info('User authenticated via Google', { userId: user.id, email });
          done(null, authUser);
        } catch (err: any) {
          logger.error('Google OAuth error', { error: err.message });
          done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, (user as AuthenticatedUser).id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const result = await pool.query<{
        id: string;
        email: string;
        name: string;
        avatar_url: string;
        slack_access_token: string | null;
      }>(
        'SELECT id, email, name, avatar_url, slack_access_token FROM users WHERE id = $1',
        [id]
      );

      if (!result.rows[0]) {
        return done(null, false);
      }

      const user = result.rows[0];
      done(null, {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
        slackAccessToken: user.slack_access_token || undefined,
      } as AuthenticatedUser);
    } catch (err) {
      done(err);
    }
  });
}
