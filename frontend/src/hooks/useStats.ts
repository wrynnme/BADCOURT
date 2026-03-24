// ════ useStats Hook (Stub) ════
import { useState, useEffect } from 'react';
import api from '../lib/api';
import type { PlayerStats } from '../types';

export function useStats(period: 'today' | 'month' | 'all' = 'all') {
  const [leaderboard, setLeaderboard] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [period]);

  async function loadStats() {
    setLoading(true);
    try {
      const response = await api.getLeaderboard(period);
      setLeaderboard(response.data || []);
    } catch (err) {
      console.error('[useStats] Load error:', err);
    } finally {
      setLoading(false);
    }
  }

  return { leaderboard, loading, refresh: loadStats };
}

export default useStats;
