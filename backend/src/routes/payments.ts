// ════ Payments Routes ════
import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { verifyLiffToken } from '../middleware/verifyLiff.js';
import { isAdmin } from '../middleware/isAdmin.js';
import { sendBillNotification, sendPaymentApprovedNotification } from '../services/lineNotify.js';
import { calculateBill, type SessionBill } from '../services/billing.js';

const router = Router();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// GET /api/payments/session/:sessionId - Get billing for a session
router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    // Get session
    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    // Get registrations
    const { data: registrations } = await supabase
      .from('registrations')
      .select('*')
      .eq('session_id', sessionId);

    // Get matches
    const { data: matches } = await supabase
      .from('matches')
      .select('*')
      .eq('session_id', sessionId);

    // Calculate bill
    const bill: SessionBill = calculateBill(session, registrations || [], matches || []);

    res.json({ success: true, data: bill });
  } catch (error) {
    console.error('[payments] Get billing error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/payments/session/:sessionId/notify-all - Send bill notifications to all players
router.post('/session/:sessionId/notify-all', verifyLiffToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { liffUrl } = req.body;

    // Get session
    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    // Get registrations with pending status
    const { data: registrations } = await supabase
      .from('registrations')
      .select('*')
      .eq('session_id', sessionId)
      .eq('paid_status', 'pending');

    if (!registrations || registrations.length === 0) {
      return res.json({ success: true, message: 'No pending payments to notify' });
    }

    // Get matches for games played calculation
    const { data: matches } = await supabase
      .from('matches')
      .select('*')
      .eq('session_id', sessionId);

    // Calculate bill
    const bill = calculateBill(session, registrations, matches || []);

    // Send notifications
    const results = await Promise.allSettled(
      bill.players
        .filter(p => p.paidStatus === 'pending')
        .map(async (player) => {
          const registration = registrations.find(r => r.user_id === player.userId);
          
          return sendBillNotification({
            userId: player.userId,
            displayName: player.displayName,
            amount: player.amountDue,
            sessionName: session.name,
            gamesPlayed: player.gamesPlayed,
            liffUrl: liffUrl || `https://liff.line.me/${process.env.VITE_LIFF_ID}/billing/${sessionId}`,
          });
        })
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failCount = results.length - successCount;

    res.json({
      success: true,
      data: {
        sent: successCount,
        failed: failCount,
      },
    });
  } catch (error) {
    console.error('[payments] Notify all error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/payments/registration/:regId/upload-slip - Upload payment slip
router.post('/registration/:regId/upload-slip', verifyLiffToken, async (req: Request, res: Response) => {
  try {
    const { regId } = req.params;
    const { slipUrl } = req.body;

    if (!slipUrl) {
      return res.status(400).json({ success: false, error: 'Missing slipUrl' });
    }

    // Verify ownership
    const { data: registration } = await supabase
      .from('registrations')
      .select('*')
      .eq('id', regId)
      .single();

    if (!registration) {
      return res.status(404).json({ success: false, error: 'Registration not found' });
    }

    // Note: In production, verify userId matches registration.user_id

    // Update slip URL
    const { error } = await supabase
      .from('registrations')
      .update({ slip_url: slipUrl })
      .eq('id', regId);

    if (error) {
      console.error('[payments] Upload slip error:', error);
      return res.status(500).json({ success: false, error: 'Failed to upload slip' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[payments] Upload slip error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /api/payments/registration/:regId/approve - Approve payment (admin only)
router.patch('/registration/:regId/approve', verifyLiffToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const { regId } = req.params;
    const adminUserId = (req as Request & { user?: { sub: string } }).user?.sub;

    // Get registration
    const { data: registration } = await supabase
      .from('registrations')
      .select('*, sessions(*)')
      .eq('id', regId)
      .single();

    if (!registration) {
      return res.status(404).json({ success: false, error: 'Registration not found' });
    }

    // Update payment status
    const { data: updated, error } = await supabase
      .from('registrations')
      .update({ 
        paid_status: 'approved',
        amount_due: registration.amount_due,
      })
      .eq('id', regId)
      .select()
      .single();

    if (error) {
      console.error('[payments] Approve error:', error);
      return res.status(500).json({ success: false, error: 'Failed to approve payment' });
    }

    // Record in payments table
    await supabase.from('payments').insert({
      registration_id: regId,
      amount: registration.amount_due,
      slip_url: registration.slip_url,
      status: 'approved',
      approved_by: adminUserId,
      approved_at: new Date().toISOString(),
    });

    // Send confirmation message
    try {
      await sendPaymentApprovedNotification({
        userId: registration.user_id,
        displayName: registration.display_name,
        amount: registration.amount_due || 0,
        sessionName: (registration.sessions as Record<string, unknown>).name as string,
        paidAt: new Date().toLocaleDateString('th-TH'),
        liffUrl: `https://liff.line.me/${process.env.VITE_LIFF_ID}/stats`,
      });
    } catch (notifyError) {
      console.error('[payments] Send notification error:', notifyError);
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('[payments] Approve error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export { router as paymentsRouter };
