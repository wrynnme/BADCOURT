// ════ Cron Jobs Service ════
import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import { sendReminderNotification, sendBillNotification } from './lineNotify.js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const VITE_LIFF_ID = process.env.VITE_LIFF_ID || '';

/**
 * Send reminders 1 hour before session starts
 * Runs every 5 minutes
 */
async function sendSessionReminders(): Promise<void> {
  try {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 65 * 60 * 1000);
    
    // Find sessions starting in about 1 hour
    const targetTime = oneHourLater.toTimeString().slice(0, 5); // "HH:mm"
    const targetDate = oneHourLater.toISOString().split('T')[0];

    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('date', targetDate)
      .eq('start_time', targetTime)
      .eq('status', 'open');

    if (!sessions || sessions.length === 0) {
      return;
    }

    for (const session of sessions) {
      // Get registrations
      const { data: registrations } = await supabase
        .from('registrations')
        .select('*')
        .eq('session_id', session.id);

      if (!registrations || registrations.length === 0) {
        continue;
      }

      // Send reminders to each player
      for (const reg of registrations) {
        const hasUnpaid = reg.paid_status === 'pending';
        const unpaidAmount = hasUnpaid ? reg.amount_due : 0;

        await sendReminderNotification({
          userId: reg.user_id,
          displayName: reg.display_name,
          sessionName: session.name,
          sessionTime: `${session.start_time} - ${session.end_time}`,
          hasUnpaid,
          unpaidAmount,
          liffUrl: `https://liff.line.me/${VITE_LIFF_ID}/board/${session.id}`,
        });
      }

      console.log(`[cron] Sent ${registrations.length} reminders for session ${session.id}`);
    }
  } catch (error) {
    console.error('[cron] Send reminders error:', error);
  }
}

/**
 * Send overdue payment reminders
 * Runs daily at 20:00 Asia/Bangkok
 */
async function sendOverdueReminders(): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get sessions from today and past that have pending payments
    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('status', 'ended')
      .lte('date', today);

    if (!sessions || sessions.length === 0) {
      return;
    }

    for (const session of sessions) {
      // Get pending registrations
      const { data: registrations } = await supabase
        .from('registrations')
        .select('*')
        .eq('session_id', session.id)
        .eq('paid_status', 'pending');

      if (!registrations || registrations.length === 0) {
        continue;
      }

      // Get matches for games played count
      const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .eq('session_id', session.id);

      // Send notifications
      for (const reg of registrations) {
        const gamesPlayed = matches
          ? matches.filter(m => 
              m.status === 'done' && 
              [...m.team1_players, ...m.team2_players].includes(reg.user_id)
            ).length
          : 0;

        await sendBillNotification({
          userId: reg.user_id,
          displayName: reg.display_name,
          amount: reg.amount_due || 0,
          sessionName: session.name,
          gamesPlayed,
          liffUrl: `https://liff.line.me/${VITE_LIFF_ID}/billing/${session.id}`,
        });
      }

      console.log(`[cron] Sent ${registrations.length} overdue reminders for session ${session.id}`);
    }
  } catch (error) {
    console.error('[cron] Send overdue reminders error:', error);
  }
}

/**
 * Start all cron jobs
 */
export function startCronJobs(): void {
  console.log('[cron] Starting cron jobs...');

  // Session reminders - every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    sendSessionReminders();
  });

  // Overdue reminders - daily at 20:00 (7pm Bangkok is 14:00 UTC)
  cron.schedule('0 14 * * *', () => {
    sendOverdueReminders();
  });

  console.log('[cron] Cron jobs scheduled');
}
