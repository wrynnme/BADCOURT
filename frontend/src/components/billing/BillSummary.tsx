// ════ BillSummary Component (Stub) ════
import React from 'react';
import type { SessionBill } from '../../types';

interface BillSummaryProps {
  bill: SessionBill;
}

export default function BillSummary({ bill }: BillSummaryProps) {
  return (
    <div className="card bg-primary-50">
      <h3 className="font-semibold mb-3">สรุปยอด</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>ยอดรวม</span>
          <span className="font-semibold">฿{bill.totalCost.toLocaleString()}</span>
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
  );
}
