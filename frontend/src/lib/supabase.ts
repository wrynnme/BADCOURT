// ════ Supabase Client for Realtime ════
import { createClient, type RealtimeChannel } from '@supabase/supabase-js';
import type { Match, Registration, RealtimeEvent } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Subscribe to board updates for a session
 */
export function subscribeToBoard(
  sessionId: string,
  callbacks: {
    onMatchCreated?: (match: Match) => void;
    onScoreUpdated?: (matchId: string, score1: number, score2: number) => void;
    onMatchEnded?: (matchId: string, winnerId: 'team1' | 'team2') => void;
    onRegistrationAdded?: (registration: Registration) => void;
    onRegistrationRemoved?: (userId: string) => void;
  }
): RealtimeChannel {
  const channel = supabase
    .channel(`board:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'matches',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        const match = payload.new as Match;
        callbacks.onMatchCreated?.(match);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'matches',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        const match = payload.new as Match;
        if (match.status === 'done' && match.winner) {
          callbacks.onMatchEnded?.(match.id, match.winner);
        } else if (match.score1 !== undefined && match.score2 !== undefined) {
          callbacks.onScoreUpdated?.(match.id, match.score1, match.score2);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'registrations',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        const registration = payload.new as Registration;
        callbacks.onRegistrationAdded?.(registration);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'registrations',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        const old = payload.old as { user_id?: string };
        if (old.user_id) {
          callbacks.onRegistrationRemoved?.(old.user_id);
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from board updates
 */
export function unsubscribeFromBoard(sessionId: string): void {
  supabase.removeChannel(supabase.channel(`board:${sessionId}`));
}

/**
 * Broadcast a custom event (for manual mode)
 */
export function broadcastBoardEvent(
  sessionId: string,
  event: RealtimeEvent
): void {
  const channel = supabase.channel(`board:${sessionId}`);
  channel.send({
    type: 'broadcast',
    event: event.type,
    payload: event.payload,
  });
}
