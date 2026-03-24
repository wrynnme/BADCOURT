// ════ Registrations Routes ════
import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { verifyLiffToken, type LiffTokenPayload } from '../middleware/verifyLiff.js';
import { isAdmin } from '../middleware/isAdmin.js';
import { sendRegistrationConfirmation } from '../services/lineNotify.js';

const router = Router();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface AuthRequest extends Request {
  user?: LiffTokenPayload;
}

// POST /api/registrations - Register for a session
router.post('/', verifyLiffToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.sub;
    const { sessionId, paymentMethod } = req.body;

    if (!sessionId || !paymentMethod) {
      return res.status(400).json({ success: false, error: 'Missing sessionId or paymentMethod' });
    }

    if (!['qr', 'transfer', 'onsite'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, error: 'Invalid payment method' });
    }

    // Check session exists and is open
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    if (session.status !== 'open') {
      return res.status(400).json({ success: false, error: 'Session is not open for registration' });
    }

    // Check if already registered
    const { data: existing } = await supabase
      .from('registrations')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      return res.status(400).json({ success: false, error: 'Already registered for this session' });
    }

    // Check max players
    const { count } = await supabase
      .from('registrations')
      .select('*', { count: 'exact' })
      .eq('session_id', sessionId);

    if (count !== null && count >= session.max_players) {
      return res.status(400).json({ success: false, error: 'Session is full' });
    }

    // Create or update user
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

    // Create registration
    const { data: registration, error } = await supabase
      .from('registrations')
      .insert({
        session_id: sessionId,
        user_id: userId,
        display_name: req.user!.name || 'Unknown',
        picture_url: req.user!.picture || null,
        payment_method: paymentMethod,
        paid_status: paymentMethod === 'onsite' ? 'onsite' : 'pending',
        games_played: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('[registrations] Create error:', error);
      return res.status(500).json({ success: false, error: 'Failed to register' });
    }

    // Get registration number
    const { count: regCount } = await supabase
      .from('registrations')
      .select('*', { count: 'exact' })
      .eq('session_id', sessionId);

    // Send confirmation message
    try {
      await sendRegistrationConfirmation({
        userId,
        displayName: req.user!.name || 'Unknown',
        sessionName: session.name,
        sessionDate: session.date,
        sessionTime: `${session.start_time} - ${session.end_time}`,
        registrationNumber: regCount || 1,
        liffUrl: `https://liff.line.me/${process.env.VITE_LIFF_ID}/board/${sessionId}`,
      });
    } catch (notifyError) {
      console.error('[registrations] Send notification error:', notifyError);
      // Don't fail the registration if notification fails
    }

    res.status(201).json({ success: true, data: registration });
  } catch (error) {
    console.error('[registrations] Unexpected error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/registrations/session/:sessionId - Get registrations for a session
router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const { data: registrations, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('session_id', sessionId)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('[registrations] List error:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch registrations' });
    }

    res.json({ success: true, data: registrations || [] });
  } catch (error) {
    console.error('[registrations] Unexpected error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/registrations/:id - Cancel registration
router.delete('/:id', verifyLiffToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.sub;

    // Check ownership
    const { data: registration } = await supabase
      .from('registrations')
      .select('*')
      .eq('id', id)
      .single();

    if (!registration) {
      return res.status(404).json({ success: false, error: 'Registration not found' });
    }

    // Check if user owns this registration or is admin
    const { data: user } = await supabase
      .from('users')
      .select('is_admin')
      .eq('line_user_id', userId)
      .single();

    if (registration.user_id !== userId && !user?.is_admin) {
      return res.status(403).json({ success: false, error: 'Not authorized to cancel this registration' });
    }

    // Check if session already started
    const { data: session } = await supabase
      .from('sessions')
      .select('status')
      .eq('id', registration.session_id)
      .single();

    if (session?.status === 'playing' || session?.status === 'ended') {
      return res.status(400).json({ success: false, error: 'Cannot cancel registration after session has started' });
    }

    const { error } = await supabase
      .from('registrations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[registrations] Delete error:', error);
      return res.status(500).json({ success: false, error: 'Failed to cancel registration' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[registrations] Unexpected error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /api/registrations/:id/payment - Update payment status (admin only)
router.patch('/:id/payment', verifyLiffToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { paidStatus, slipUrl } = req.body;

    if (!['pending', 'approved', 'rejected', 'onsite'].includes(paidStatus)) {
      return res.status(400).json({ success: false, error: 'Invalid paid status' });
    }

    const { data: registration, error } = await supabase
      .from('registrations')
      .update({ 
        paid_status: paidStatus,
        slip_url: slipUrl || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[registrations] Update payment error:', error);
      return res.status(500).json({ success: false, error: 'Failed to update payment status' });
    }

    if (!registration) {
      return res.status(404).json({ success: false, error: 'Registration not found' });
    }

    res.json({ success: true, data: registration });
  } catch (error) {
    console.error('[registrations] Unexpected error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export { router as registrationsRouter };
