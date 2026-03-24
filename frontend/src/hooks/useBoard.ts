// ════ useBoard Hook (Stub) ════
// TODO: Implement board subscription hook

import { useState, useEffect, useCallback } from 'react';
import { subscribeToBoard, unsubscribeFromBoard } from '../lib/supabase';
import api from '../lib/api';
import type { Match, Registration } from '../types';

export function useBoard(sessionId: string) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    // Load initial data
    loadData();

    // Subscribe to realtime updates
    const channel = subscribeToBoard(sessionId, {
      onMatchCreated: (match) => setMatches(prev => [...prev, match]),
      onScoreUpdated: (matchId, score1, score2) => {
        setMatches(prev => prev.map(m => 
          m.id === matchId ? { ...m, score1, score2 } : m
        ));
      },
      onMatchEnded: (matchId, winnerId) => {
        setMatches(prev => prev.map(m => 
          m.id === matchId ? { ...m, status: 'done', winnerId } : m
        ));
      },
      onRegistrationAdded: (reg) => {
        setRegistrations(prev => [...prev, reg]);
      },
      onRegistrationRemoved: (userId) => {
        setRegistrations(prev => prev.filter(r => r.userId !== userId));
      },
    });

    return () => {
      unsubscribeFromBoard(sessionId);
    };
  }, [sessionId]);

  async function loadData() {
    try {
      const [matchesRes, regsRes] = await Promise.all([
        api.getMatches(sessionId),
        api.getSessionRegistrations(sessionId),
      ]);
      setMatches(matchesRes.data || []);
      setRegistrations(regsRes.data || []);
    } catch (err) {
      console.error('[useBoard] Load error:', err);
    } finally {
      setLoading(false);
    }
  }

  return { matches, registrations, loading, refresh: loadData };
}

export default useBoard;
