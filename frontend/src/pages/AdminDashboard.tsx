// ════ AdminDashboard Page ════
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';

interface DashboardStats {
  today: { sessions: number; players: number; matches: number };
  totals: { users: number; sessions: number; pendingPayments: number };
}

export default function AdminDashboard(): React.ReactElement {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '18:00',
    endTime: '20:00',
    courtCount: 2,
    maxPlayers: 16,
    feePerHour: 200,
    billingMode: 'equal' as const,
    defaultMatchMode: 'random' as const,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const response = await api.getAdminDashboard();
      setStats(response.data);
    } catch (err) {
      console.error('[Admin] Dashboard error:', err);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSession(e: React.FormEvent) {
    e.preventDefault();
    try {
      const response = await api.createSession(formData);
      if (response.success) {
        toast.success('สร้างก๊วนสำเร็จ!');
        setShowCreateForm(false);
        setFormData({
          ...formData,
          name: '',
        });
        loadDashboard();
      } else {
        toast.error(response.error || 'ไม่สามารถสร้างก๊วนได้');
      }
    } catch (err) {
      console.error('[Admin] Create error:', err);
      toast.error('ไม่สามารถสร้างก๊วนได้');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-primary-500 text-white p-4">
        <h1 className="text-xl font-bold">⚙️ แอดมิน</h1>
      </header>

      <div className="p-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="card text-center">
            <div className="text-3xl font-bold text-primary-600">{stats?.totals.users || 0}</div>
            <div className="text-sm text-gray-500">ผู้ใช้ทั้งหมด</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-primary-600">{stats?.totals.pendingPayments || 0}</div>
            <div className="text-sm text-gray-500">รอชำระ</div>
          </div>
        </div>

        {/* Today's Stats */}
        <div className="card mb-4">
          <h2 className="font-semibold mb-3">📅 วันนี้</h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-2xl font-bold">{stats?.today.sessions || 0}</div>
              <div className="text-xs text-gray-500">ก๊วน</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats?.today.players || 0}</div>
              <div className="text-xs text-gray-500">ผู้เล่น</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats?.today.matches || 0}</div>
              <div className="text-xs text-gray-500">เกม</div>
            </div>
          </div>
        </div>

        {/* Create Session */}
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary w-full mb-4"
        >
          {showCreateForm ? '✕ ยกเลิก' : '+ สร้างก๊วนใหม่'}
        </button>

        {showCreateForm && (
          <form onSubmit={handleCreateSession} className="card mb-4">
            <h2 className="font-semibold mb-3">สร้างก๊วนใหม่</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">ชื่อก๊วน</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="เช่น ก๊วนวันศุกร์"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">วันที่</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">จำนวนคอร์ท</label>
                  <input
                    type="number"
                    value={formData.courtCount}
                    onChange={(e) => setFormData({ ...formData, courtCount: parseInt(e.target.value) || 1 })}
                    className="input"
                    min={1}
                    max={8}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">เริ่ม</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">เลิก</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">รับได้ (คน)</label>
                  <input
                    type="number"
                    value={formData.maxPlayers}
                    onChange={(e) => setFormData({ ...formData, maxPlayers: parseInt(e.target.value) || 4 })}
                    className="input"
                    min={4}
                    max={100}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">ค่าคอร์ท/ชม.</label>
                  <input
                    type="number"
                    value={formData.feePerHour}
                    onChange={(e) => setFormData({ ...formData, feePerHour: parseInt(e.target.value) || 0 })}
                    className="input"
                    min={0}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary w-full">
                สร้างก๊วน
              </button>
            </div>
          </form>
        )}

        {/* Navigation */}
        <div className="card">
          <h2 className="font-semibold mb-3">ลิงก์ด่วน</h2>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/stats')}
              className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
            >
              📊 ดูสถิติ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
