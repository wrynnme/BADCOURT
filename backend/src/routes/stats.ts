// ════ Stats Routes ════
import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// GET /api/stats/session/:id - Session stats summary
router.get('/session/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get session
    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    // Get registrations
    const { data: registrations } = await supabase
      .from('registrations')
      .select('*')
      .eq('session_id', id);

    // Get matches
    const { data: matches } = await supabase
      .from('matches')
      .select('*')
      .eq('session_id', id);

    // Calculate stats
    const totalGames = matches?.filter(m => m.status === 'done').length || 0;
    const totalPlayers = registrations?.length || 0;
    const paidPlayers = registrations?.filter(r => r.paid_status === 'approved' || r.paid_status === 'onsite').length || 0;
    const pendingPlayers = registrations?.filter(r => r.paid_status === 'pending').length || 0;

    // Calculate total collected and outstanding
    const totalCost = session.fee_per_hour * session.court_count * 
      ((new Date(`2000-01-01 ${session.end_time}`).getTime() - 
        new Date(`2000-01-01 ${session.start_time}`).getTime()) / (1000 * 60 * 60));

    const collected = registrations
      ?.filter(r => r.paid_status === 'approved' || r.paid_status === 'onsite')
      .reduce((sum, r) => sum + (r.amount_due || 0), 0) || 0;

    const outstanding = registrations
      ?.filter(r => r.paid_status === 'pending')
      .reduce((sum, r) => sum + (r.amount_due || 0), 0) || 0;

    res.json({
      success: true,
      data: {
        session,
        stats: {
          totalGames,
          totalPlayers,
          paidPlayers,
          pendingPlayers,
          totalCost,
          collected,
          outstanding,
        },
      },
    });
  } catch (error) {
    console.error('[stats] Session error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/stats/leaderboard - Player rankings
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const { period = 'all' } = req.query;

    let query = supabase
      .from('users')
      .select('line_user_id, display_name, picture_url, total_games, total_wins')
      .order('total_wins', { ascending: false })
      .limit(50);

    if (period === 'today') {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's matches
      const { data: todayMatches } = await supabase
        .from('matches')
        .select('*')
        .gte('started_at', today);

      // Calculate wins per user for today
      const userWins = new Map<string, number>();
      const userGames = new Map<string, number>();

      todayMatches?.forEach(match => {
        if (match.status === 'done') {
          const winnerTeam = match.winner === 'team1' ? match.team1_players : match.team2_players;
          winnerTeam.forEach(userId => {
            userWins.set(userId, (userWins.get(userId) || 0) + 1);
          });
          [...match.team1_players, ...match.team2_players].forEach(userId => {
            userGames.set(userId, (userGames.get(userId) || 0) + 1);
          });
        }
      });

      // Get users who played today
      const userIds = [...new Set([...userWins.keys(), ...userGames.keys()])];
      
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .in('line_user_id', userIds);

      const leaderboard = users?.map(user => ({
        line_user_id: user.line_user_id,
        display_name: user.display_name,
        picture_url: user.picture_url,
        total_games: userGames.get(user.line_user_id) || 0,
        total_wins: userWins.get(user.line_user_id) || 0,
      })).sort((a, b) => b.total_wins - a.total_wins) || [];

      return res.json({ success: true, data: leaderboard });
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('[stats] Leaderboard error:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' });
    }

    const leaderboard = users?.map(user => ({
      line_user_id: user.line_user_id,
      display_name: user.display_name,
      picture_url: user.picture_url,
      total_games: user.total_games,
      total_wins: user.total_wins,
      win_rate: user.total_games > 0 
        ? Math.round((user.total_wins / user.total_games) * 100) 
        : 0,
    })) || [];

    res.json({ success: true, data: leaderboard });
  } catch (error) {
    console.error('[stats] Leaderboard error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/stats/player/:userId - Player detailed stats
router.get('/player/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('line_user_id', userId)
      .single();

    if (!user) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }

    // Get recent matches
    const { data: matches } = await supabase
      .from('matches')
      .select('*')
      .or(`team1_players.cs.{${userId}},team2_players.cs.{${userId}}`)
      .order('started_at', { ascending: false })
      .limit(20);

    // Calculate streak
    let currentStreak = 0;
    let streakType: 'win' | 'loss' | null = null;

    for (const match of matches || []) {
      if (match.status !== 'done') continue;

      const isOnTeam1 = match.team1_players.includes(userId);
      const won = (isOnTeam1 && match.winner === 'team1') || (!isOnTeam1 && match.winner === 'team2');

      if (streakType === null) {
        streakType = won ? 'win' : 'loss';
        currentStreak = 1;
      } else if ((won && streakType === 'win') || (!won && streakType === 'loss')) {
        currentStreak++;
      } else {
        break;
      }
    }

    res.json({
      success: true,
      data: {
        ...user,
        win_rate: user.total_games > 0 
          ? Math.round((user.total_wins / user.total_games) * 100) 
          : 0,
        current_streak: currentStreak,
        streak_type: streakType,
        recent_matches: matches,
      },
    });
  } catch (error) {
    console.error('[stats] Player error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export { router as statsRouter };
