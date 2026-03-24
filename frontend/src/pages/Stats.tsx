// ════ Stats Page ════
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import type { PlayerStats } from '../types';

export default function Stats(): React.ReactElement {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId?: string }>();

  const [leaderboard, setLeaderboard] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'month' | 'all'>('all');

  useEffect(() => {
    loadLeaderboard();
  }, [period]);

  async function loadLeaderboard() {
    setLoading(true);
    try {
      const response = await api.getLeaderboard(period);
      setLeaderboard(response.data || []);
    } catch (err) {
      console.error('[Stats] Load error:', err);
    } finally {
      setLoading(false);
    }
  }

  const rankColors = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-primary-500 text-white p-4">
        <h1 className="text-xl font-bold">🏆 อันดับผู้เล่น</h1>
      </header>

      {/* Period Tabs */}
      <div className="bg-white border-b">
        <nav className="flex">
          {([
            { key: 'today', label: 'วันนี้' },
            { key: 'month', label: 'เดือนนี้' },
            { key: 'all', label: 'ตลอดกาล' },
          ] as { key: typeof period; label: string }[]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setPeriod(tab.key)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 ${
                period === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>ยังไม่มีข้อมูลอันดับ</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((player, idx) => (
              <div
                key={player.userId}
                className="card flex items-center gap-3"
              >
                <div className={`w-8 text-center font-bold ${
                  idx < 3 ? rankColors[idx] : 'text-gray-500'
                }`}>
                  {idx + 1}
                </div>
                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                  {player.pictureUrl && (
                    <img
                      src={player.pictureUrl}
                      alt={player.displayName}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{player.displayName}</div>
                  <div className="text-sm text-gray-500">
                    {player.gamesPlayed} เกม | {player.wins} ชนะ {player.losses} แพ้
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-primary-600">
                    {player.winRate}%
                  </div>
                  <div className="text-xs text-gray-500">win rate</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
