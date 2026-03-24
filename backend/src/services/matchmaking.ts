// ════ Matchmaking Service ════
import type { Registration, Match, MatchMode } from '../../frontend/src/types/index.js';

export interface MakeMatchesParams {
  players: Registration[];
  mode: MatchMode;
  courtCount: number;
  prevMatches: Match[];
}

export interface MatchmakingResult {
  matches: Array<{
    courtNumber: number;
    team1: string[];
    team2: string[];
  }>;
  queue: Registration[];
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Random matchmaking - shuffle and pair players
 */
function matchRandom(players: Registration[], courtCount: number): MatchmakingResult {
  const shuffled = shuffleArray(players);
  const matches: MatchmakingResult['matches'] = [];
  const queue: Registration[] = [];

  // Calculate players needed per round: 4 for doubles, 2 for singles
  const playersPerMatch = 4; // Always doubles for now
  const totalSlots = courtCount * playersPerMatch;

  // If not enough players for all courts, adjust
  const availableCourts = Math.min(courtCount, Math.floor(shuffled.length / playersPerMatch));
  const playersToUse = availableCourts * playersPerMatch;

  // Take players for matches
  const playingNow = shuffled.slice(0, playersToUse);
  const remaining = shuffled.slice(playersToUse);

  // Create matches
  for (let i = 0; i < availableCourts; i++) {
    const offset = i * playersPerMatch;
    const team1 = [playingNow[offset].userId, playingNow[offset + 1].userId];
    const team2 = [playingNow[offset + 2].userId, playingNow[offset + 3].userId];

    matches.push({
      courtNumber: i + 1,
      team1,
      team2,
    });
  }

  // Remaining players go to queue
  queue.push(...remaining);

  console.log(`[matchmaking] Random: created ${matches.length} matches, ${queue.length} in queue`);

  return { matches, queue };
}

/**
 * Rotation matchmaking - players with fewer games play first
 */
function matchRotation(players: Registration[], courtCount: number): MatchmakingResult {
  // Sort by gamesPlayed ascending, then joinedAt ascending
  const sorted = [...players].sort((a, b) => {
    if (a.gamesPlayed !== b.gamesPlayed) {
      return a.gamesPlayed - b.gamesPlayed;
    }
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
  });

  const matches: MatchmakingResult['matches'] = [];
  const queue: Registration[] = [];

  const playersPerMatch = 4;
  const availableCourts = Math.min(courtCount, Math.floor(sorted.length / playersPerMatch));
  const playersToUse = availableCourts * playersPerMatch;

  const playingNow = sorted.slice(0, playersToUse);
  const remaining = sorted.slice(playersToUse);

  for (let i = 0; i < availableCourts; i++) {
    const offset = i * playersPerMatch;
    const team1 = [playingNow[offset].userId, playingNow[offset + 1].userId];
    const team2 = [playingNow[offset + 2].userId, playingNow[offset + 3].userId];

    matches.push({
      courtNumber: i + 1,
      team1,
      team2,
    });
  }

  queue.push(...remaining);

  console.log(`[matchmaking] Rotation: created ${matches.length} matches, ${queue.length} in queue`);

  return { matches, queue };
}

/**
 * Winner stays - winning team stays on court, losing team goes to queue
 */
function matchWinnerStays(players: Registration[], courtCount: number, prevMatches: Match[]): MatchmakingResult {
  const matches: MatchmakingResult['matches'] = [];
  const queue: Registration[] = [];

  // Get last round's matches
  const lastMatches = prevMatches
    .filter(m => m.status === 'done')
    .sort((a, b) => b.roundNumber - a.roundNumber);

  if (lastMatches.length === 0 || lastMatches.length < courtCount) {
    // Not enough previous matches, fall back to rotation
    console.log(`[matchmaking] WinnerStays: falling back to rotation (no prev matches)`);
    return matchRotation(players, courtCount);
  }

  // Check for winners who won too many times in a row (monopoly protection)
  const MAX_CONSECUTIVE_WINS = 3;

  // Get the most recent matches up to courtCount
  const recentMatches = lastMatches.slice(0, courtCount);
  const currentTeams: { team1: string[]; team2: string[]; consecutiveWins: number }[] = [];

  for (const match of recentMatches) {
    let consecutiveWins = 0;
    
    // Count consecutive wins going back
    const playerIds = [...match.team1, ...match.team2];
    for (const prevMatch of lastMatches) {
      if (![...prevMatch.team1, ...prevMatch.team2].some(id => playerIds.includes(id))) {
        break;
      }
      if (prevMatch.winner === match.winner) {
        consecutiveWins++;
      } else {
        break;
      }
    }

    currentTeams.push({
      team1: match.team1,
      team2: match.team2,
      consecutiveWins,
    });
  }

  // Get available players (not in current matches)
  const currentPlayerIds = new Set(currentTeams.flatMap(t => [...t.team1, ...t.team2]));
  const availablePlayers = players.filter(p => !currentPlayerIds.has(p.userId));

  // Sort available players by games played
  availablePlayers.sort((a, b) => a.gamesPlayed - b.gamesPlayed);

  // Create new matches
  for (let i = 0; i < Math.min(courtCount, currentTeams.length); i++) {
    const team = currentTeams[i];
    let team1: string[];
    let team2: string[];

    if (team.consecutiveWins >= MAX_CONSECUTIVE_WINS) {
      // Winning team must rotate out
      // Keep one player from winning team, bring in new players
      const keepPlayer = team.team1[0]; // Keep first player
      const newPlayers = availablePlayers.splice(0, 3);
      
      if (newPlayers.length < 3) {
        queue.push(...availablePlayers);
        break;
      }

      team1 = [keepPlayer, newPlayers[0].userId];
      team2 = [newPlayers[1].userId, newPlayers[2].userId];
      queue.push(...newPlayers);
    } else if (team.winner === 'team1') {
      // Team1 won, they stay
      team1 = team.team1;
      // Team2 (losers) go to queue, bring in new players
      const newPlayers = availablePlayers.splice(0, 2);
      if (newPlayers.length < 2) {
        // Not enough players, use rotation
        queue.push(...availablePlayers);
        continue;
      }
      team2 = [newPlayers[0].userId, newPlayers[1].userId];
      queue.push(...team.team2); // Losers go to queue
      queue.push(...newPlayers);
    } else {
      // Team2 won, they stay
      team2 = team.team2;
      const newPlayers = availablePlayers.splice(0, 2);
      if (newPlayers.length < 2) {
        queue.push(...availablePlayers);
        continue;
      }
      team1 = [newPlayers[0].userId, newPlayers[1].userId];
      queue.push(...team.team1); // Losers go to queue
      queue.push(...newPlayers);
    }

    matches.push({
      courtNumber: i + 1,
      team1,
      team2,
    });
  }

  // Add any remaining players to queue
  queue.push(...availablePlayers);

  console.log(`[matchmaking] WinnerStays: created ${matches.length} matches, ${queue.length} in queue`);

  return { matches, queue };
}

/**
 * Manual matchmaking - frontend handles it, return empty
 */
function matchManual(_players: Registration[], courtCount: number): MatchmakingResult {
  // Manual mode returns empty - frontend will handle drag-and-drop
  console.log(`[matchmaking] Manual: returning ${courtCount} empty slots`);
  
  const matches: MatchmakingResult['matches'] = [];
  for (let i = 0; i < courtCount; i++) {
    matches.push({
      courtNumber: i + 1,
      team1: [],
      team2: [],
    });
  }

  return { matches, queue: _players };
}

/**
 * Main matchmaking function
 */
export function makeMatches(params: MakeMatchesParams): MatchmakingResult {
  const { players, mode, courtCount, prevMatches } = params;

  if (players.length < 4) {
    console.log(`[matchmaking] Not enough players: ${players.length}`);
    return { matches: [], queue: players };
  }

  if (courtCount < 1) {
    console.log(`[matchmaking] Invalid court count: ${courtCount}`);
    return { matches: [], queue: players };
  }

  switch (mode) {
    case 'random':
      return matchRandom(players, courtCount);
    
    case 'rotation':
      return matchRotation(players, courtCount);
    
    case 'winner_stays':
      return matchWinnerStays(players, courtCount, prevMatches);
    
    case 'manual':
      return matchManual(players, courtCount);
    
    default:
      console.error(`[matchmaking] Unknown mode: ${mode}`);
      return { matches: [], queue: players };
  }
}
