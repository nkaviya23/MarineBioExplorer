import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { db } from './db.js';

export interface UserRecord {
  id: string;
  email: string;
  full_name: string;
  role: 'CONTRIBUTOR' | 'ADMIN';
  created_at: string;
  updated_at: string;
}

const SESSION_SECRET = process.env.SESSION_SECRET || 'marine-bio-default-dev-secret-keep-secure-32ch';
const ADMIN_SETUP_SECRET = process.env.ADMIN_SETUP_SECRET || 'marine-bio-admin-secret-key-change-me';

// Secure stateless session tokens signed with HMAC-SHA256
export function createSessionToken(userId: string, role: string): string {
  const payload = {
    uid: userId,
    rol: role,
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

export function verifySessionToken(token: string): { uid: string; rol: string } | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');

  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }
    return { uid: payload.uid, rol: payload.rol };
  } catch {
    return null;
  }
}

export function getUserFromRequest(req: Request): UserRecord | null {
  // Check cookie or Authorization header
  let token = req.cookies?.mbe_session;
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7).trim();
  }
  if (!token) return null;

  const verified = verifySessionToken(token);
  if (!verified) return null;

  const user = db.prepare(`
    SELECT id, email, full_name, role, created_at, updated_at
    FROM users WHERE id = ?
  `).get(verified.uid) as UserRecord | undefined;

  return user || null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  (req as any).user = user;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required. Please sign in as an administrator.' });
    return;
  }
  if (user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Forbidden. Administrator privileges required.' });
    return;
  }
  (req as any).user = user;
  next();
}

export function hasAnyAdmin(): boolean {
  const row = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN'").get() as { count: number };
  return (row?.count ?? 0) > 0;
}

export function getAdminSetupSecret(): string {
  return ADMIN_SETUP_SECRET;
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie('mbe_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie('mbe_session', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}
