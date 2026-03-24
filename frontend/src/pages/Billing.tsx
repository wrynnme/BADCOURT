// ════ Billing Page ════
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { generateKhunThongCommand, copyToClipboard } from '../lib/khunthong';
import type { SessionBill, Session } from '../types';

export default function Billing(): React.ReactElement {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [bill, setBill] = useState<SessionBill | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showKhunThong, setShowKhunThong] = useState(false);
  const [khunThongCommand, setKhunThongCommand] = useState('');

  useEffect(() => {
    if (!sessionId) return;
    loadBilling();
  }, [sessionId]);

  async function loadBilling() {
    if (!sessionId) return;
    setLoading(true);
    try {
      const [billRes, sessionRes] = await Promise.all([
        api.getBilling(sessionId),
        api.getSession(sessionId),
      ]);
      setBill(billRes.data);
      setSession(sessionRes.data);
    } catch (err) {
      console.error('[Billing] Load error:', err);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  }

  async function handleNotifyAll() {
    if (!sessionId) return;
    setSending(true);
    try {
      const response = await api.notifyAllPlayers(sessionId);
      if (response.success) {
        toast.success(`ส่งบิลให้ ${response.data.sent} คนแล้ว`);
      } else {
        toast.error(response.error || 'ไม่สามารถส่งบิลได้');
      }
    } catch (err) {
      console.error('[Billing] Notify error:', err);
      toast.error('ไม่สามารถส่งบิลได้');
    } finally {
      setSending(false);
    }
  }

  function handleShowKhunThong() {
    if (!bill) return;
    const cmd = generateKhunThongCommand(bill.players, true);
    setKhunThongCommand(cmd.formattedCommand);
    setShowKhunThong(true);
  }

  async function handleCopyKhunThong() {
    const success = await copyToClipboard(khunThongCommand);
    if (success) {
      toast.success('คัดลอกคำสั่งแล้ว!');
      setShowKhunThong(false);
    } else {
      toast.error('ไม่สามารถคัดลอกได้');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!bill || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>ไม่พบข้อมูลการเงิน</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-primary-500 text-white p-4">
        <h1 className="text-xl font-bold">คิดเงิน</h1>
        <p className="text-sm opacity-90">{session.name}</p>
      </header>

      <div className="p-4">
        {/* Summary Card */}
        <div className="card mb-4 bg-primary-50">
          <h2 className="font-semibold mb-3">สรุปยอด</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>ค่าคอร์ท/ชม.</span>
              <span>฿{session.feePerHour}</span>
            </div>
            <div className="flex justify-between">
              <span>จำนวนคอร์ท</span>
              <span>{session.courtCount} คอร์ท</span>
            </div>
            <div className="flex justify-between">
              <span>ระยะเวลา</span>
              <span>{session.startTime} - {session.endTime}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-semibold text-lg">
                <span>ยอดรวม</span>
                <span>฿{bill.totalCost.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex justify-between text-green-600">
              <span>เก็บได้</span>
              <span>฿{bill.collected.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>ค้างชำระ</span>
              <span>฿{bill.outstanding.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={handleNotifyAll}
            disabled={sending || bill.outstanding === 0}
            className="btn-primary py-3"
          >
            📱 ส่งบิลทั้งหมด
          </button>
          <button
            onClick={handleShowKhunThong}
            className="btn-secondary py-3"
          >
            📋 คำสั่งขุนทอง
          </button>
        </div>

        {/* Player List */}
        <div className="card">
          <h2 className="font-semibold mb-3">รายละเอียดผู้เล่น</h2>
          <div className="space-y-3">
            {bill.players.map((player) => (
              <div key={player.userId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                  {player.pictureUrl && (
                    <img src={player.pictureUrl} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{player.displayName}</div>
                  <div className="text-sm text-gray-500">
                    {player.gamesPlayed} เกม | {player.hoursPlayed} ชม.
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">฿{player.amountDue.toLocaleString()}</div>
                  <span className={`badge ${
                    player.paidStatus === 'approved' ? 'badge-green' :
                    player.paidStatus === 'onsite' ? 'badge-yellow' :
                    'badge-red'
                  }`}>
                    {player.paidStatus === 'pending' && 'รอ'}
                    {player.paidStatus === 'approved' && 'แล้ว'}
                    {player.paidStatus === 'onsite' && 'หน้างาน'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KhunThong Modal */}
      {showKhunThong && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-4 w-full max-w-md">
            <h3 className="font-semibold mb-3">คำสั่งขุนทอง</h3>
            <div className="p-3 bg-gray-100 rounded-lg mb-4 break-words">
              {khunThongCommand}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCopyKhunThong}
                className="flex-1 btn-primary"
              >
                📋 คัดลอก
              </button>
              <button
                onClick={() => setShowKhunThong(false)}
                className="flex-1 btn-secondary"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
