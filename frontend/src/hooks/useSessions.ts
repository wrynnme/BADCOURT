// ════ useSessions Hook (Stub) ════
// TODO: Implement session management hooks

import { useState, useEffect } from 'react';
import api from '../lib/api';
import type { Session } from '../types';

export function useSessions(filter?: string) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, [filter]);

  async function loadSessions() {
    setLoading(true);
    try {
      const response = await api.getSessions({ filter });
      setSessions(response.data || []);
    } catch (err) {
      setError('ไม่สามารถโหลดรายการก๊วนได้');
    } finally {
      setLoading(false);
    }
  }

  return { sessions, loading, error, refresh: loadSessions };
}

export default useSessions;
