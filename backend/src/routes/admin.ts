// ════ Admin Routes ════
import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { verifyLiffToken } from '../middleware/verifyLiff.js';
import { isAdmin } from '../middleware/isAdmin.js';

const router = Router();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// GET /api/admin/users - List all users (admin only)
router.get('/users', verifyLiffToken, isAdmin, async (_req: Request, res: Response) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('total_games', { ascending: false });

    if (error) {
      console.error('[admin] List users error:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }

    res.json({ success: true, data: users || [] });
  } catch (error) {
    console.error('[admin] List users error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /api/admin/users/:userId - Update user (admin only)
router.patch('/users/:userId', verifyLiffToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { is_admin, display_name } = req.body;

    const updates: Record<string, unknown> = {};
    if (typeof is_admin === 'boolean') updates.is_admin = is_admin;
    if (display_name) updates.display_name = display_name;
    updates.updated_at = new Date().toISOString();

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('line_user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[admin] Update user error:', error);
      return res.status(500).json({ success: false, error: 'Failed to update user' });
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('[admin] Update user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/admin/dashboard - Dashboard stats (admin only)
router.get('/dashboard', verifyLiffToken, isAdmin, async (_req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Today's stats
    const [{ data: todaySessions }, { data: todayPlayers }, { data: todayMatches }] = await Promise.all([
      supabase.from('sessions').select('*').eq('date', today),
      supabase.from('registrations').select('*', { count: 'exact' }).eq('joined_at', today),
      supabase.from('matches').select('*').gte('started_at', today),
    ]);

    // Total stats
    const [{ data: totalUsers }, { data: totalSessions }, { data: pendingPayments }] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact' }),
      supabase.from('sessions').select('*', { count: 'exact' }),
      supabase.from('registrations').select('*', { count: 'exact' }).eq('paid_status', 'pending'),
    ]);

    res.json({
      success: true,
      data: {
        today: {
          sessions: todaySessions?.length || 0,
          players: todayPlayers?.length || 0,
          matches: todayMatches?.length || 0,
        },
        totals: {
          users: totalUsers?.length || 0,
          sessions: totalSessions?.length || 0,
          pendingPayments: pendingPayments?.length || 0,
        },
      },
    });
  } catch (error) {
    console.error('[admin] Dashboard error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/admin/sessions/:sessionId/end - End a session (admin only)
router.post('/sessions/:sessionId/end', verifyLiffToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const { data: session, error } = await supabase
      .from('sessions')
      .update({ status: 'ended' })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('[admin] End session error:', error);
      return res.status(500).json({ success: false, error: 'Failed to end session' });
    }

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    res.json({ success: true, data: session });
  } catch (error) {
    console.error('[admin] End session error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export { router as adminRouter };
