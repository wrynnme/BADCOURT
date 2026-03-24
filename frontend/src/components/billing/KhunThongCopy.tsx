// ════ KhunThongCopy Component (Stub) ════
import React, { useState } from 'react';
import { generateKhunThongCommand, copyToClipboard } from '../../lib/khunthong';
import type { PlayerBill } from '../../types';
import toast from 'react-hot-toast';

interface KhunThongCopyProps {
  players: PlayerBill[];
  unpaidOnly?: boolean;
}

export default function KhunThongCopy({ players, unpaidOnly = true }: KhunThongCopyProps) {
  const [command, setCommand] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleGenerate = () => {
    const cmd = generateKhunThongCommand(players, unpaidOnly);
    setCommand(cmd.formattedCommand);
    setShowModal(true);
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(command);
    if (success) {
      toast.success('คัดลอกคำสั่งแล้ว!');
      setShowModal(false);
    } else {
      toast.error('ไม่สามารถคัดลอกได้');
    }
  };

  return (
    <>
      <button onClick={handleGenerate} className="btn-secondary w-full">
        📋 คำสั่งขุนทอง
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-4 w-full max-w-md">
            <h3 className="font-semibold mb-3">คำสั่งขุนทอง</h3>
            <div className="p-3 bg-gray-100 rounded-lg mb-4 break-words">
              {command}
            </div>
            <div className="flex gap-3">
              <button onClick={handleCopy} className="flex-1 btn-primary">
                📋 คัดลอก
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 btn-secondary">
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
