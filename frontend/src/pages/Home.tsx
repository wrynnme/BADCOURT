// ════ Home Page ════
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiff } from '../hooks/useLiff';
import api from '../lib/api';
import type { Session } from '../types';

type TabType = 'today' | 'week' | 'all';
type StatusBadge = { label: string; className: string };

const statusBadges: Record<Session['status'], StatusBadge> = {
  open: { label: 'เปิดรับ', className: 'badge-green' },
  playing: { label: 'กำลังเล่น', className: 'badge-yellow' },
  ended: { label: 'จบแล้ว', className: 'badge-gray' },
};

export default function Home(): React.ReactElement {
  const navigate = useNavigate();
  const { profile, isLoading: liffLoading } = useLiff();
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (liffLoading) return;
    fetchSessions();
  }, [activeTab, liffLoading]);

  async function fetchSessions() {
    setLoading(true);
    setError(null);
    try {
      const filter = activeTab === 'week' ? 'week' : activeTab === 'today' ? 'today' : undefined;
      const response = await api.getSessions({ filter });
      setSessions(response.data || []);
    } catch (err) {
      console.error('[Home] Fetch sessions error:', err);
      setError('ไม่สามารถโหลดรายการก๊วนได้');
    } finally {
      setLoading(false);
    }
  }

  if (liffLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-primary-500 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">🏸 BadCourt</h1>
            <p className="text-sm opacity-90">สวัสดี {profile?.displayName || 'แขก'}</p>
          </div>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
            {profile?.pictureUrl ? (
              <img src={profile.pictureUrl} alt={profile.displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-200" />
            )}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <nav className="flex">
          {(['today', 'week', 'all'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'today' ? 'วันนี้' : tab === 'week' ? 'สัปดาห์นี้' : 'ทั้งหมด'}
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
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            <p>{error}</p>
            <button onClick={fetchSessions} className="btn-primary mt-2">
              ลองใหม่
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-4xl mb-2">🏸</p>
            <p>ยังไม่มีก๊วนในช่วงนี้</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const badge = statusBadges[session.status];
              return (
                <Link
                  key={session.id}
                  to={`/board/${session.id}`}
                  className="block card card-hover"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{session.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        📅 {session.date} | 🕐 {session.startTime} - {session.endTime}
                      </p>
                      <p className="text-sm text-gray-600">
                        🎾 {session.courtCount} คอร์ท | 👥 {session.maxPlayers} คน
                      </p>
                    </div>
                    <span className={`badge ${badge.className}`}>{badge.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB - Admin only */}
      {profile?.userId && (
        <Link
          to="/admin"
          className="fixed bottom-20 right-4 w-14 h-14 bg-primary-500 text-white rounded-full shadow-lg flex items-center justify-center text-2xl"
        >
          +
        </Link>
      )}
    </div>
  );
}
