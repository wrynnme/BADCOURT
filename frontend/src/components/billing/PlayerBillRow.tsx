// ════ PlayerBillRow Component (Stub) ════
import React from 'react';
import type { PlayerBill } from '../../types';

interface PlayerBillRowProps {
  player: PlayerBill;
  onApprove?: (playerId: string) => void;
}

export default function PlayerBillRow({ player, onApprove }: PlayerBillRowProps) {
  const statusBadge = {
    pending: { label: 'รอ', className: 'badge-red' },
    approved: { label: 'แล้ว', className: 'badge-green' },
    rejected: { label: 'ปฏิเสธ', className: 'badge-red' },
    onsite: { label: 'หน้างาน', className: 'badge-yellow' },
  }[player.paidStatus];

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
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
        <span className={`badge ${statusBadge.className}`}>{statusBadge.label}</span>
      </div>
      {onApprove && player.paidStatus === 'pending' && (
        <button
          onClick={() => onApprove(player.userId)}
          className="text-primary-500 text-sm"
        >
          อนุมัติ
        </button>
      )}
    </div>
  );
}
