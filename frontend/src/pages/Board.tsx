// ════ Board Page ════
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiff } from '../hooks/useLiff';
import { subscribeToBoard, unsubscribeFromBoard } from '../lib/supabase';
import api from '../lib/api';
import type { Session, Match, Registration } from '../types';

export default function Board(): React.ReactElement {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { profile } = useLiff();
  
  const [session, setSession] = useState<Session | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingScores, setUpdatingScores] = useState<Set<string>>(new Set());

  // Load initial data
  useEffect(() => {
    if (!sessionId) return;
    loadData();
    
    // Subscribe to realtime updates
    const channel = subscribeToBoard(sessionId, {
      onMatchCreated: (match) => {
        setMatches((prev) => [...prev, match]);
      },
      onScoreUpdated: (matchId, score1, score2) => {
        setMatches((prev) =>
          prev.map((m) =>
            m.id === matchId ? { ...m, score1, score2 } : m
          )
        );
      },
      onMatchEnded: (matchId, winnerId) => {
        setMatches((prev) =>
          prev.map((m) =>
            m.id === matchId ? { ...m, status: 'done', winnerId } : m
          )
        );
      },
      onRegistrationAdded: (reg) => {
        setRegistrations((prev) => [...prev, reg]);
      },
      onRegistrationRemoved: (userId) => {
        setRegistrations((prev) => prev.filter((r) => r.userId !== userId));
      },
    });

    return () => {
      unsubscribeFromBoard(sessionId);
    };
  }, [sessionId]);

  async function loadData() {
    if (!sessionId) return;
    setLoading(true);
    setError(null);

    try {
      const [sessionRes, matchesRes, regsRes] = await Promise.all([
        api.getSession(sessionId),
        api.getMatches(sessionId),
        api.getSessionRegistrations(sessionId),
      ]);

      setSession(sessionRes.data);
      setMatches(matchesRes.data || []);
      setRegistrations(regsRes.data || []);
    } catch (err) {
      console.error('[Board] Load error:', err);
      setError('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  }

  const handleScoreUpdate = useCallback(
    async (matchId: string, team: 'team1' | 'team2', score: number) => {
      setUpdatingScores((prev) => new Set(prev).add(matchId));
      try {
        const match = matches.find((m) => m.id === matchId);
        if (!match) return;

        const updates: { score1?: number; score2?: number } = {};
        if (team === 'team1') {
          updates.score1 = score;
        } else {
          updates.score2 = score;
        }

        await api.updateMatch(matchId, updates);
      } catch (err) {
        console.error('[Board] Score update error:', err);
      } finally {
        setUpdatingScores((prev) => {
          const next = new Set(prev);
          next.delete(matchId);
          return next;
        });
      }
    },
    [matches]
  );

  const handleEndMatch = useCallback(async (matchId: string) => {
    setUpdatingScores((prev) => new Set(prev).add(matchId));
    try {
      await api.updateMatch(matchId, { status: 'done' });
    } catch (err) {
      console.error('[Board] End match error:', err);
    } finally {
      setUpdatingScores((prev) => {
        const next = new Set(prev);
        next.delete(matchId);
        return next;
      });
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>กำลังโหลดบอร์ด...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center text-red-600">
          <p>{error || 'ไม่พบข้อมูลก๊วน'}</p>
          <button onClick={loadData} className="btn-primary mt-2">
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  // Filter active matches and queue
  const activeMatches = matches.filter((m) => m.status === 'playing');
  const completedMatches = matches.filter((m) => m.status === 'done');
  const playingUsers = new Set([
    ...activeMatches.flatMap((m) => [...m.team1, ...m.team2]),
  ]);
  const queue = registrations.filter((r) => !playingUsers.has(r.userId));

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-primary-500 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{session.name}</h1>
            <p className="text-sm opacity-90">
              🎾 {session.courtCount} คอร์ท | {session.date}
            </p>
          </div>
          <button
            onClick={() => navigate(`/register/${sessionId}`)}
            className="px-3 py-1 bg-white/20 rounded-lg text-sm"
          >
            ลงชื่อ
          </button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Active Matches */}
        <section>
          <h2 className="text-lg font-semibold mb-2">กำลังเล่น ({activeMatches.length})</h2>
          {activeMatches.length === 0 ? (
            <div className="card text-center text-gray-500 py-6">
              <p>ยังไม่มีคู่ที่กำลังเล่น</p>
              <button
                onClick={() => navigate(`/create-match/${sessionId}`)}
                className="btn-primary mt-2"
              >
                จัดคู่เลย
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {activeMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onScoreUpdate={handleScoreUpdate}
                  onEndMatch={handleEndMatch}
                  isUpdating={updatingScores.has(match.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Queue */}
        <section>
          <h2 className="text-lg font-semibold mb-2">คิวรอ ({queue.length})</h2>
          {queue.length === 0 ? (
            <div className="card text-center text-gray-500 py-4">
              <p>ไม่มีคนรอ</p>
            </div>
          ) : (
            <div className="card">
              <div className="space-y-2">
                {queue.map((reg, idx) => (
                  <div key={reg.id} className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-sm">
                      {idx + 1}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                      {reg.pictureUrl && (
                        <img src={reg.pictureUrl} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <span className="flex-1">{reg.displayName}</span>
                    <span className="text-sm text-gray-500">{reg.gamesPlayed} เกม</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Completed Matches */}
        {completedMatches.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-2">ผลการแข่งขัน</h2>
            <div className="space-y-2">
              {completedMatches.map((match) => (
                <div key={match.id} className="card text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 text-center">
                      <span className={match.winnerId === 'team1' ? 'font-bold' : ''}>
                        {match.team1.join(', ')}
                      </span>
                    </div>
                    <div className="px-4 font-bold">
                      {match.score1} - {match.score2}
                    </div>
                    <div className="flex-1 text-center">
                      <span className={match.winnerId === 'team2' ? 'font-bold' : ''}>
                        {match.team2.join(', ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate(`/create-match/${sessionId}`)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-primary-500 text-white rounded-full shadow-lg flex items-center justify-center text-2xl"
      >
        ⚙️
      </button>
    </div>
  );
}

// Match Card Component
interface MatchCardProps {
  match: Match;
  onScoreUpdate: (matchId: string, team: 'team1' | 'team2', score: number) => void;
  onEndMatch: (matchId: string) => void;
  isUpdating: boolean;
}

function MatchCard({ match, onScoreUpdate, onEndMatch, isUpdating }: MatchCardProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">คอร์ท {match.courtNumber}</span>
        <span className="badge badge-yellow">กำลังเล่น</span>
      </div>

      <div className="flex items-center justify-between">
        {/* Team 1 */}
        <div className="flex-1">
          <div className="text-sm text-gray-600 mb-1">ทีม 1</div>
          <div className="font-medium">{match.team1.join(' & ')}</div>
        </div>

        {/* Score */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={match.score1 ?? ''}
            onChange={(e) => onScoreUpdate(match.id, 'team1', parseInt(e.target.value) || 0)}
            disabled={isUpdating}
            className="w-12 h-12 text-center text-xl font-bold border rounded-lg"
            min={0}
          />
          <span className="text-xl">-</span>
          <input
            type="number"
            value={match.score2 ?? ''}
            onChange={(e) => onScoreUpdate(match.id, 'team2', parseInt(e.target.value) || 0)}
            disabled={isUpdating}
            className="w-12 h-12 text-center text-xl font-bold border rounded-lg"
            min={0}
          />
        </div>

        {/* Team 2 */}
        <div className="flex-1 text-right">
          <div className="text-sm text-gray-600 mb-1">ทีม 2</div>
          <div className="font-medium">{match.team2.join(' & ')}</div>
        </div>
      </div>

      <button
        onClick={() => onEndMatch(match.id)}
        disabled={isUpdating}
        className="w-full btn-primary mt-3"
      >
        จบเกม บันทึกผล
      </button>
    </div>
  );
}
