// ════ LIFF Token Verification Middleware ════
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || '';

export interface LiffTokenPayload {
  sub: string; // userId
  name: string; // displayName
  picture?: string;
  email?: string;
  iat: number;
  exp: number;
}

/**
 * Verify LINE ID Token from LIFF SDK
 * The frontend sends this token in Authorization header as Bearer token
 */
export async function verifyLiffToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Missing or invalid Authorization header' });
      return;
    }

    const token = authHeader.substring(7);

    if (!token) {
      res.status(401).json({ success: false, error: 'Missing token' });
      return;
    }

    // Verify the JWT token from LINE
    // LINE ID tokens are JWTs signed with the channel secret
    const payload = jwt.verify(token, LINE_CHANNEL_SECRET) as LiffTokenPayload;

    if (!payload.sub) {
      res.status(401).json({ success: false, error: 'Invalid token: missing userId' });
      return;
    }

    // Attach user info to request
    (req as Request & { user: LiffTokenPayload }).user = {
      sub: payload.sub,
      name: payload.name || '',
      picture: payload.picture,
      email: payload.email,
      iat: payload.iat,
      exp: payload.exp,
    };

    next();
  } catch (error) {
    console.error('[verifyLiff] Token verification failed:', error);

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ success: false, error: 'Invalid token' });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, error: 'Token expired' });
      return;
    }

    res.status(500).json({ success: false, error: 'Token verification failed' });
  }
}

/**
 * Optional verification - doesn't fail if no token
 * Useful for endpoints that work for both authenticated and anonymous users
 */
export async function optionalLiffVerify(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  // If token is provided, verify it
  return verifyLiffToken(req, res, next);
}
