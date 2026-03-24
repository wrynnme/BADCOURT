// ════ SessionSummary Component (Stub) ════
import React from 'react';

interface SessionSummaryProps {
  totalGames: number;
  totalPlayers: number;
  totalCost: number;
  collected: number;
  outstanding: number;
}

export default function SessionSummary({
  totalGames,
  totalPlayers,
  totalCost,
  collected,
  outstanding,
}: SessionSummaryProps) {
  return (
    <div className="card">
      <h3 className="font-semibold mb-3">สรุปก๊วน</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-500">จำนวนเกม</div>
          <div className="font-semibold">{totalGames} เกม</div>
        </div>
        <div>
          <div className="text-gray-500">จำนวนผู้เล่น</div>
          <div className="font-semibold">{totalPlayers} คน</div>
        </div>
        <div>
          <div className="text-gray-500">รวมเงิน</div>
          <div className="font-semibold">฿{totalCost.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-gray-500">จ่ายแล้ว</div>
          <div className="font-semibold text-green-600">฿{collected.toLocaleString()}</div>
        </div>
        <div className="col-span-2">
          <div className="text-gray-500">ค้างชำระ</div>
          <div className="font-semibold text-red-600">฿{outstanding.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}
