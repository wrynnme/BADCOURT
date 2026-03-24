// ════ QueueList Component (Stub) ════
import React from 'react';
import type { Registration } from '../../types';

interface QueueListProps {
  players: Registration[];
}

export default function QueueList({ players }: QueueListProps) {
  return (
    <div className="card">
      <h3 className="font-semibold mb-2">คิวรอ ({players.length})</h3>
      {players.length === 0 ? (
        <p className="text-gray-500 text-sm">ไม่มีคนรอ</p>
      ) : (
        <div className="space-y-2">
          {players.map((player, idx) => (
            <div key={player.id} className="flex items-center gap-3">
              <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-sm">
                {idx + 1}
              </span>
              <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                {player.pictureUrl && (
                  <img src={player.pictureUrl} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <span className="flex-1">{player.displayName}</span>
              <span className="text-sm text-gray-500">{player.gamesPlayed} เกม</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
