// ════ Sessions Routes ════
import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { verifyLiffToken, type LiffTokenPayload } from '../middleware/verifyLiff.js';
import { isAdmin } from '../middleware/isAdmin.js';

const router = Router();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Extend Request type
interface AuthRequest extends Request {
  user?: LiffTokenPayload;
}

// GET /api/sessions - List sessions with optional filter
router.get('/', async (req: Request, res: Response) => {
  try {
    const { filter, date, status } = req.query;
    
    let query = supabase
      .from('sessions')
      .select(`
        *,
        created_by_user:users!sessions_created_by_fkey(display_name, picture_url)
      `)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    // Filter by date
    if (filter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      query = query.eq('date', today);
    } else if (filter === 'week') {
      const today = new Date();
      const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      query = query
        .gte('date', today.toISOString().split('T')[0])
        .lte('date', weekEnd.toISOString().split('T')[0]);
    }

    // Filter by status
    if (status && ['open', 'playing', 'ended'].includes(status as string)) {
      query = query.eq('status', status);
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error('[sessions] List error:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch sessions' });
    }

    // Get registration counts for each session
    const sessionIds = sessions?.map(s => s.id) || [];
    const { data: regCounts } = await supabase
      .from('registrations')
      .select('session_id')
      .in('session_id', sessionIds);

    const countMap = new Map<string, number>();
    regCounts?.forEach(r => {
      countMap.set(r.session_id, (countMap.get(r.session_id) || 0) + 1);
    });

    const sessionsWithCount = sessions?.map(s => ({
      ...s,
      registeredCount: countMap.get(s.id) || 0,
    })) || [];

    res.json({ success: true, data: sessionsWithCount });
  } catch (error) {
    console.error('[sessions] Unexpected error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/sessions/:id - Get single session
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: session, error } = await supabase
      .from('sessions')
      .select(`
        *,
        created_by_user:users!sessions_created_by_fkey(display_name, picture_url)
      `)
      .eq('id', id)
      .single();

    if (error || !session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    // Get registrations
    const { data: registrations } = await supabase
      .from('registrations')
      .select('*')
      .eq('session_id', id)
      .order('joined_at', { ascending: true });

    res.json({ 
      success: true, 
      data: { 
        ...session, 
        registrations: registrations || [] 
      } 
    });
  } catch (error) {
    console.error('[sessions] Get error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/sessions - Create new session (admin only)
router.post('/', verifyLiffToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      date,
      startTime,
      endTime,
      courtCount,
      maxPlayers,
      feePerHour,
      billingMode,
      defaultMatchMode,
    } = req.body;

    // Validation
    if (!name || !date || !startTime || !endTime || !courtCount || !maxPlayers || !feePerHour) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Create or update user
    const userId = req.user!.sub;
    const { data: existingUser } = await supabase
      .from('users')
      .select('line_user_id')
      .eq('line_user_id', userId)
      .single();

    if (!existingUser) {
      await supabase.from('users').insert({
        line_user_id: userId,
        display_name: req.user!.name || 'Unknown',
        picture_url: req.user!.picture || null,
      });
    }

    // Create session
    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        name,
        date,
        start_time: startTime,
        end_time: endTime,
        court_count: courtCount,
        max_players: maxPlayers,
        fee_per_hour: feePerHour,
        billing_mode: billingMode || 'equal',
        default_match_mode: defaultMatchMode || 'random',
        status: 'open',
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('[sessions] Create error:', error);
      return res.status(500).json({ success: false, error: 'Failed to create session' });
    }

    res.status(201).json({ success: true, data: session });
  } catch (error) {
    console.error('[sessions] Create unexpected error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /api/sessions/:id - Update session (admin only)
router.patch('/:id', verifyLiffToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent updating certain fields
    delete updates.id;
    delete updates.created_by;

    const { data: session, error } = await supabase
      .from('sessions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[sessions] Update error:', error);
      return res.status(500).json({ success: false, error: 'Failed to update session' });
    }

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    res.json({ success: true, data: session });
  } catch (error) {
    console.error('[sessions] Update unexpected error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/sessions/:id - Delete session (admin only)
router.delete('/:id', verifyLiffToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[sessions] Delete error:', error);
      return res.status(500).json({ success: false, error: 'Failed to delete session' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[sessions] Delete unexpected error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export { router as sessionsRouter };
