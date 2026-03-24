// ════ Register Page ════
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useLiff } from '../hooks/useLiff';
import api from '../lib/api';
import type { Session, Registration } from '../types';

export default function Register(): React.ReactElement {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { profile } = useLiff();

  const [session, setSession] = useState<Session | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [existingReg, setExistingReg] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'transfer' | 'onsite'>('qr');

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

      // Check if already registered
      if (profile?.userId) {
        const mine = regsRes.data?.find((r: Registration) => r.userId === profile.userId);
        setExistingReg(mine || null);
      }
    } catch (err) {
      console.error('[Register] Load error:', err);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!sessionId) return;
    setSubmitting(true);
    try {
      await api.register(sessionId, paymentMethod);
      toast.success('ลงทะเบียนสำเร็จ!');
      navigate(`/board/${sessionId}`);
    } catch (err: unknown) {
      console.error('[Register] Error:', err);
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'ไม่สามารถลงทะเบียนได้');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!existingReg) return;
    setSubmitting(true);
    try {
      await api.cancelRegistration(existingReg.id);
      toast.success('ยกเลิกการลงทะเบียนแล้ว');
      setExistingReg(null);
      loadData();
    } catch (err) {
      console.error('[Register] Cancel error:', err);
      toast.error('ไม่สามารถยกเลิกได้');
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center text-red-600">
          <p>ไม่พบก๊วนที่ต้องการ</p>
          <button onClick={() => navigate('/')} className="btn-primary mt-2">
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  if (existingReg) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <header className="bg-primary-500 text-white p-4 rounded-lg mb-4">
          <h1 className="text-xl font-bold">{session.name}</h1>
          <p className="text-sm opacity-90">
            {session.date} | {session.startTime} - {session.endTime}
          </p>
        </header>

        <div className="card">
          <div className="text-center py-6">
            <div className="text-5xl mb-3">✅</div>
            <h2 className="text-lg font-semibold">ลงทะเบียนแล้ว</h2>
            <p className="text-gray-600 mt-1">คุณได้ลงทะเบียนเข้าร่วมก๊วนนี้แล้ว</p>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">วิธีชำระเงิน</p>
              <p className="font-medium capitalize">{existingReg.paymentMethod}</p>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">สถานะ</p>
              <p className="font-medium">
                {existingReg.paidStatus === 'pending' && 'รอชำระ'}
                {existingReg.paidStatus === 'approved' && 'ชำระแล้ว'}
                {existingReg.paidStatus === 'onsite' && 'จ่ายหน้างาน'}
              </p>
            </div>

            <div className="mt-6 space-y-2">
              <button onClick={() => navigate(`/board/${sessionId}`)} className="btn-primary w-full">
                ไปที่บอร์ดเกม
              </button>
              {existingReg.paidStatus === 'pending' && (
                <button
                  onClick={handleCancel}
                  disabled={submitting}
                  className="btn-secondary w-full"
                >
                  ยกเลิกการลงทะเบียน
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <header className="bg-primary-500 text-white p-4 rounded-lg mb-4">
        <h1 className="text-xl font-bold">ลงทะเบียนเข้าร่วม</h1>
        <p className="text-sm opacity-90">{session.name}</p>
      </header>

      <div className="card mb-4">
        <h2 className="font-semibold mb-3">รายละเอียดก๊วน</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">📅 วันที่</span>
            <span>{session.date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">🕐 เวลา</span>
            <span>{session.startTime} - {session.endTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">🎾 คอร์ท</span>
            <span>{session.courtCount} คอร์ท</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">👥 รับได้</span>
            <span>{session.maxPlayers} คน</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">💰 ค่าคอร์ท/ชม.</span>
            <span>฿{session.feePerHour}</span>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <h2 className="font-semibold mb-3">ผู้เล่นที่ลงแล้ว ({registrations.length})</h2>
        {registrations.length === 0 ? (
          <p className="text-gray-500 text-sm">ยังไม่มีผู้ลงทะเบียน</p>
        ) : (
          <div className="space-y-2">
            {registrations.map((reg, idx) => (
              <div key={reg.id} className="flex items-center gap-2">
                <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                  {idx + 1}
                </span>
                <span>{reg.displayName}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card mb-4">
        <h2 className="font-semibold mb-3">เลือกวิธีชำระเงิน</h2>
        <div className="space-y-2">
          {[
            { value: 'qr', label: 'QR PromptPay', icon: '📱' },
            { value: 'transfer', label: 'โอนธนาคาร', icon: '🏦' },
            { value: 'onsite', label: 'จ่ายหน้างาน', icon: '💵' },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                paymentMethod === opt.value ? 'border-primary-500 bg-primary-50' : ''
              }`}
            >
              <input
                type="radio"
                name="payment"
                value={opt.value}
                checked={paymentMethod === opt.value}
                onChange={() => setPaymentMethod(opt.value as typeof paymentMethod)}
                className="sr-only"
              />
              <span className="text-xl">{opt.icon}</span>
              <span className="flex-1">{opt.label}</span>
              {paymentMethod === opt.value && (
                <span className="text-primary-500">✓</span>
              )}
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={handleRegister}
        disabled={submitting}
        className="btn-primary w-full py-3 text-lg"
      >
        {submitting ? 'กำลังลงทะเบียน...' : 'ยืนยันการลงทะเบียน'}
      </button>
    </div>
  );
}
