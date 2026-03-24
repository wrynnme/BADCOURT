// ════ CourtBoard Component (Stub) ════
import React from 'react';
import type { Match, Registration } from '../../types';
import MatchCard from './MatchCard';
import QueueList from './QueueList';

interface CourtBoardProps {
  matches: Match[];
  queue: Registration[];
  courtCount: number;
  onScoreUpdate: (matchId: string, team: 'team1' | 'team2', score: number) => void;
  onEndMatch: (matchId: string) => void;
}

export default function CourtBoard({
  matches,
  queue,
  courtCount,
  onScoreUpdate,
  onEndMatch,
}: CourtBoardProps) {
  const activeMatches = matches.filter((m) => m.status === 'playing');

  return (
    <div className="space-y-4">
      {/* Courts */}
      <div className="grid gap-4">
        {Array.from({ length: courtCount }, (_, i) => {
          const match = activeMatches.find((m) => m.courtNumber === i + 1);
          return (
            <div key={i} className="card">
              <h3 className="font-semibold mb-2">คอร์ท {i + 1}</h3>
              {match ? (
                <MatchCard
                  match={match}
                  onScoreUpdate={onScoreUpdate}
                  onEndMatch={onEndMatch}
                  isUpdating={false}
                />
              ) : (
                <p className="text-gray-500 text-sm">ว่าง</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Queue */}
      <QueueList players={queue} />
    </div>
  );
}
