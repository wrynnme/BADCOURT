// ════ SessionCard Component (Stub) ════
import React from 'react';
import type { Session } from '../../types';

interface SessionCardProps {
  session: Session;
  registeredCount?: number;
  onClick?: () => void;
}

export default function SessionCard({ session, registeredCount = 0, onClick }: SessionCardProps) {
  const statusBadge = {
    open: { label: 'เปิดรับ', className: 'badge-green' },
    playing: { label: 'กำลังเล่น', className: 'badge-yellow' },
    ended: { label: 'จบแล้ว', className: 'badge-gray' },
  }[session.status];

  const fillPercent = (registeredCount / session.maxPlayers) * 100;

  return (
    <div className="card card-hover cursor-pointer" onClick={onClick}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold">{session.name}</h3>
        <span className={`badge ${statusBadge.className}`}>{statusBadge.label}</span>
      </div>
      
      <p className="text-sm text-gray-600">
        📅 {session.date} | 🕐 {session.startTime} - {session.endTime}
      </p>
      <p className="text-sm text-gray-600">
        🎾 {session.courtCount} คอร์ท | 👥 {registeredCount}/{session.maxPlayers}
      </p>
      
      {/* Capacity bar */}
      <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary-500 transition-all"
          style={{ width: `${fillPercent}%` }}
        />
      </div>
    </div>
  );
}
