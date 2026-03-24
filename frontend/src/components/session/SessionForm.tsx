// ════ SessionForm Component (Stub) ════
import React, { useState } from 'react';
import type { Session } from '../../types';

interface SessionFormProps {
  onSubmit: (data: Partial<Session>) => void;
  onCancel?: () => void;
  initialData?: Partial<Session>;
}

export default function SessionForm({ onSubmit, onCancel, initialData }: SessionFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    startTime: initialData?.startTime || '18:00',
    endTime: initialData?.endTime || '20:00',
    courtCount: initialData?.courtCount || 2,
    maxPlayers: initialData?.maxPlayers || 16,
    feePerHour: initialData?.feePerHour || 200,
    billingMode: initialData?.billingMode || 'equal',
    defaultMatchMode: initialData?.defaultMatchMode || 'random',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-600 mb-1">ชื่อก๊วน</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="input"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
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

      <div className="grid grid-cols-2 gap-4">
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

      <div className="grid grid-cols-2 gap-4">
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

      <div className="flex gap-3">
        <button type="submit" className="flex-1 btn-primary">
          บันทึก
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="flex-1 btn-secondary">
            ยกเลิก
          </button>
        )}
      </div>
    </form>
  );
}
