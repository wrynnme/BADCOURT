// ════ useMatchmaking Hook (Stub) ════
import { useState, useCallback } from 'react';
import api from '../lib/api';
import type { Match, MatchMode } from '../types';

export function useMatchmaking(sessionId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMatches = useCallback(async (mode: MatchMode, courtCount: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.createMatches(sessionId, { mode, courtCount });
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'ไม่สามารถสร้างคู่ได้');
        return null;
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาด');
      return null;
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  return { loading, error, createMatches };
}

export default useMatchmaking;
