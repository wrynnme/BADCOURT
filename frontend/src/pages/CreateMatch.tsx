// ════ CreateMatch Page ════
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import type { Session, Registration, MatchMode } from '../types';

const matchModes: { value: MatchMode; label: string; description: string }[] = [
  { value: 'random', label: 'สุ่ม', description: 'สุ่มจับคู่ผู้เล่น' },
  { value: 'rotation', label: 'หมุนเวียน', description: 'คนเล่นน้อยได้เล่นก่อน' },
  { value: 'winner_stays', label: 'ชนะอยู่', description: 'ทีมชนะเล่นต่อ ทีมแพ้ลงคิว' },
  { value: 'manual', label: 'เลือกเอง', description: 'แอดมินจัดคู่เอง' },
];

export default function CreateMatch(): React.ReactElement {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<Session | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<MatchMode>('random');
  const [courtCount, setCourtCount] = useState(1);

  useEffect(() => {
    if (!sessionId) return;
    loadData();
  }, [sessionId]);

  async function loadData() {
    if (!sessionId) return;
    setLoading(true);
    try {
      const [sessionRes, regsRes] = await Promise.all([
        api.getSession(sessionId),
        api.getSessionRegistrations(sessionId),
      ]);
      setSession(sessionRes.data);
      setRegistrations(regsRes.data || []);
      setMode(sessionRes.data?.defaultMatchMode || 'random');
    } catch (err) {
      console.error('[CreateMatch] Load error:', err);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateMatches() {
    if (!sessionId) return;
    setSubmitting(true);
    try {
      const response = await api.createMatches(sessionId, {
        mode,
        courtCount,
      });

      if (response.success) {
        toast.success(`สร้าง ${response.data.matches?.length || 0} คู่สำเร็จ`);
        navigate(`/board/${sessionId}`);
      } else {
        toast.error(response.error || 'ไม่สามารถสร้างคู่ได้');
      }
    } catch (err) {
      console.error('[CreateMatch] Error:', err);
      toast.error('ไม่สามารถสร้างคู่ได้');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>ไม่พบก๊วน</p>
      </div>
    );
  }

  const availableCourts = Math.min(session.courtCount, Math.floor(registrations.length / 4));

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <header className="mb-4">
        <h1 className="text-xl font-bold">จัดคู่</h1>
        <p className="text-gray-600">{session.name}</p>
      </header>

      <div className="card mb-4">
        <h2 className="font-semibold mb-3">เลือกโหมด</h2>
        <div className="space-y-2">
          {matchModes.map((m) => (
            <label
              key={m.value}
              className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                mode === m.value ? 'border-primary-500 bg-primary-50' : ''
              }`}
            >
              <input
                type="radio"
                name="mode"
                value={m.value}
                checked={mode === m.value}
                onChange={() => setMode(m.value)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                mode === m.value ? 'border-primary-500' : 'border-gray-300'
              }`}>
                {mode === m.value && (
                  <div className="w-3 h-3 rounded-full bg-primary-500" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium">{m.label}</div>
                <div className="text-sm text-gray-500">{m.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="card mb-4">
        <h2 className="font-semibold mb-3">เลือกจำนวนคอร์ท</h2>
        <div className="flex gap-2">
          {Array.from({ length: availableCourts }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setCourtCount(n)}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                courtCount === n
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {n} คอร์ท
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          มีผู้เล่น {registrations.length} คน (เล่นได้สูงสุด {availableCourts} คอร์ท)
        </p>
      </div>

      <button
        onClick={handleCreateMatches}
        disabled={submitting || registrations.length < 4}
        className="btn-primary w-full py-3 text-lg"
      >
        {submitting ? 'กำลังจัดคู่...' : 'จัดคู่เลย'}
      </button>

      {registrations.length < 4 && (
        <p className="text-sm text-red-500 text-center mt-2">
          ต้องมีผู้เล่นอย่างน้อย 4 คนจึงจะจัดคู่ได้
        </p>
      )}
    </div>
  );
}
