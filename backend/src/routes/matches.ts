// ════ Matches Routes ════
import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { verifyLiffToken } from '../middleware/verifyLiff.js';
import { isAdmin } from '../middleware/isAdmin.js';
import { makeMatches, type MatchmakingResult } from '../services/matchmaking.js';
import type { MatchMode } from '../../frontend/src/types/index.js';

const router = Router();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// GET /api/matches/session/:sessionId - Get all matches for a session
router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { status } = req.query;

    let query = supabase
      .from('matches')
      .select('*')
      .eq('session_id', sessionId)
      .order('round_number', { ascending: true })
      .order('court_number', { ascending: true });

    if (status && ['playing', 'done'].includes(status as string)) {
      query = query.eq('status', status);
    }

    const { data: matches, error } = await query;

    if (error) {
      console.error('[matches] List error:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch matches' });
    }

    res.json({ success: true, data: matches || [] });
  } catch (error) {
    console.error('[matches] Unexpected error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/matches/session/:sessionId - Create matches for a round
router.post('/session/:sessionId', verifyLiffToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { mode, courtCount, matchType } = req.body as {
      mode: MatchMode;
      courtCount: number;
      matchType?: 'doubles' | 'singles';
    };

    if (!mode || !courtCount) {
      return res.status(400).json({ success: false, error: 'Missing mode or courtCount' });
    }

    if (!['random', 'rotation', 'winner_stays', 'manual'].includes(mode)) {
      return res.status(400).json({ success: false, error: 'Invalid matchmaking mode' });
    }

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    // Get registrations (players waiting in queue)
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('*')
      .eq('session_id', sessionId)
      .order('games_played', { ascending: true })
      .order('joined_at', { ascending: true });

    if (regError) {
      console.error('[matches] Get registrations error:', regError);
      return res.status(500).json({ success: false, error: 'Failed to get players' });
    }

    if (!registrations || registrations.length < 4) {
      return res.status(400).json({ success: false, error: 'Not enough players (need at least 4)' });
    }

    // Get previous matches
    const { data: prevMatches } = await supabase
      .from('matches')
      .select('*')
      .eq('session_id', sessionId)
      .order('round_number', { ascending: false })
      .limit(100);

    // Get current round number
    const maxRound = prevMatches && prevMatches.length > 0 
      ? Math.max(...prevMatches.map(m => m.round_number))
      : 0;

    // Run matchmaking algorithm
    const result: MatchmakingResult = makeMatches({
      players: registrations,
      mode,
      courtCount,
      prevMatches: prevMatches || [],
    });

    if (result.matches.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot create matches with current players',
        queue: result.queue,
      });
    }

    // Insert matches
    const matchesToInsert = result.matches.map(m => ({
      session_id: sessionId,
      court_number: m.courtNumber,
      round_number: maxRound + 1,
      match_mode: mode,
      team1_players: m.team1,
      team2_players: m.team2,
      status: 'playing',
      started_at: new Date().toISOString(),
    }));

    const { data: newMatches, error: insertError } = await supabase
      .from('matches')
      .insert(matchesToInsert)
      .select();

    if (insertError) {
      console.error('[matches] Insert error:', insertError);
      return res.status(500).json({ success: false, error: 'Failed to create matches' });
    }

    // Update session status to playing if not already
    if (session.status === 'open') {
      await supabase
        .from('sessions')
        .update({ status: 'playing' })
        .eq('id', sessionId);
    }

    res.status(201).json({ 
      success: true, 
      data: {
        matches: newMatches,
        queue: result.queue,
      }
    });
  } catch (error) {
    console.error('[matches] Unexpected error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /api/matches/:id - Update match (score, status)
router.patch('/:id', verifyLiffToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { score1, score2, status } = req.body;

    const updates: Record<string, unknown> = {};

    if (score1 !== undefined) updates.score1 = score1;
    if (score2 !== undefined) updates.score2 = score2;
    
    if (status === 'done') {
      updates.status = 'done';
      updates.ended_at = new Date().toISOString();

      // Determine winner
      if (score1 !== undefined && score2 !== undefined) {
        if (score1 > score2) {
          updates.winner = 'team1';
        } else if (score2 > score1) {
          updates.winner = 'team2';
        }
      }
    } else if (status) {
      updates.status = status;
    }

    updates.updated_at = new Date().toISOString();

    const { data: match, error } = await supabase
      .from('matches')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[matches] Update error:', error);
      return res.status(500).json({ success: false, error: 'Failed to update match' });
    }

    if (!match) {
      return res.status(404).json({ success: false, error: 'Match not found' });
    }

    res.json({ success: true, data: match });
  } catch (error) {
    console.error('[matches] Unexpected error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/matches/:id - Cancel/delete a match
router.delete('/:id', verifyLiffToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[matches] Delete error:', error);
      return res.status(500).json({ success: false, error: 'Failed to delete match' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[matches] Unexpected error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export { router as matchesRouter };
