import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../db/logger';
import { config } from '../config';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  slackAccessToken?: string;
}

declare global {
  namespace Express {
    interface User extends AuthenticatedUser {}
  }
}

export function signToken(payload: object, secret: string = config.sessionSecret): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyToken<T = any>(token: string, secret: string = config.sessionSecret): T | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSignature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }
    return payload as T;
  } catch {
    return null;
  }
}

export function authenticateToken(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user && req.headers.authorization) {
    const [scheme, token] = req.headers.authorization.split(' ');
    if (scheme?.toLowerCase() === 'bearer' && token) {
      const decoded = verifyToken<AuthenticatedUser & { exp?: number }>(token);
      if (decoded && decoded.id) {
        req.user = {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
          avatarUrl: decoded.avatarUrl,
          slackAccessToken: decoded.slackAccessToken,
        };
        // Ensure passport isAuthenticated returns true
        if (!req.isAuthenticated || !req.isAuthenticated()) {
          (req as any).isAuthenticated = () => true;
        }
      }
    }
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const isAuthed = (req.isAuthenticated && req.isAuthenticated()) || Boolean(req.user);
  if (!isAuthed) {
    res.status(401).json({ error: 'Unauthorized', message: 'You must be logged in' });
    return;
  }
  next();
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message,
  });
}
