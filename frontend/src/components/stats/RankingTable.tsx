// ════ RankingTable Component (Stub) ════
import React from 'react';
import type { PlayerStats } from '../../types';

interface RankingTableProps {
  players: PlayerStats[];
}

export default function RankingTable({ players }: RankingTableProps) {
  const rankColors = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];

  return (
    <div className="space-y-3">
      {players.map((player, idx) => (
        <div key={player.userId} className="card flex items-center gap-3">
          <div className={`w-8 text-center font-bold ${idx < 3 ? rankColors[idx] : 'text-gray-500'}`}>
            {idx + 1}
          </div>
          <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
            {player.pictureUrl && (
              <img src={player.pictureUrl} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex-1">
            <div className="font-medium">{player.displayName}</div>
            <div className="text-sm text-gray-500">
              {player.gamesPlayed} เกม | {player.wins} ชนะ {player.losses} แพ้
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-primary-600">
              {player.winRate}%
            </div>
            <div className="text-xs text-gray-500">win rate</div>
          </div>
        </div>
      ))}
    </div>
  );
}
