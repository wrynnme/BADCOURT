// ════ Admin Authorization Middleware ════
import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const ADMIN_LINE_USER_IDS = (process.env.ADMIN_LINE_USER_IDS || '').split(',').filter(Boolean);

// Create admin Supabase client with service role key
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    name: string;
    picture?: string;
  };
  isAdminOverride?: boolean;
}

/**
 * Check if user is admin based on:
 * 1. ADMIN_LINE_USER_IDS environment variable
 * 2. is_admin flag in users table
 */
export async function isAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user?.sub;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  try {
    // Check 1: Environment variable list
    if (ADMIN_LINE_USER_IDS.includes(userId)) {
      authReq.isAdminOverride = true;
      next();
      return;
    }

    // Check 2: Database is_admin flag
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('line_user_id', userId)
      .single();

    if (error || !user) {
      res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
      return;
    }

    if (!user.is_admin) {
      res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
      return;
    }

    next();
  } catch (error) {
    console.error('[isAdmin] Error:', error);
    res.status(500).json({ success: false, error: 'Admin check failed' });
  }
}

/**
 * Check if user is admin or the creator of the resource
 */
export async function isAdminOrOwner(
  req: Request,
  res: Response,
  next: NextFunction,
  getOwnerId: (req: Request) => Promise<string | null>
): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user?.sub;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  // Admin can do anything
  if (ADMIN_LINE_USER_IDS.includes(userId)) {
    next();
    return;
  }

  // Check if user is the owner
  try {
    const ownerId = await getOwnerId(req);
    if (ownerId && ownerId === userId) {
      next();
      return;
    }

    // Check is_admin in DB
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('line_user_id', userId)
      .single();

    if (user?.is_admin) {
      next();
      return;
    }

    res.status(403).json({ success: false, error: 'Forbidden' });
  } catch (error) {
    console.error('[isAdminOrOwner] Error:', error);
    res.status(500).json({ success: false, error: 'Authorization check failed' });
  }
}
