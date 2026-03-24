// ════ useBilling Hook (Stub) ════
import { useState, useCallback } from 'react';
import api from '../lib/api';
import type { SessionBill } from '../types';

export function useBilling(sessionId: string) {
  const [bill, setBill] = useState<SessionBill | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBilling = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getBilling(sessionId);
      setBill(response.data);
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const notifyAll = useCallback(async () => {
    try {
      const response = await api.notifyAllPlayers(sessionId);
      return response;
    } catch (err) {
      return { success: false, error: 'ไม่สามารถส่งบิลได้' };
    }
  }, [sessionId]);

  return { bill, loading, error, loadBilling, notifyAll };
}

export default useBilling;
