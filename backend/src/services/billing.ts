// ════ Billing Service ════
import type { Session, Registration, Match, PlayerBill, SessionBill } from '../../frontend/src/types/index.js';

/**
 * Calculate session bill for all players
 */
export function calculateBill(
  session: Session,
  registrations: Registration[],
  matches: Match[]
): SessionBill {
  if (registrations.length === 0) {
    return {
      sessionId: session.id,
      totalCost: 0,
      courtCount: session.courtCount,
      players: [],
      collected: 0,
      outstanding: 0,
    };
  }

  // Calculate session duration in hours
  const startTime = parseTime(session.startTime);
  const endTime = parseTime(session.endTime);
  const durationHours = (endTime - startTime) / (1000 * 60 * 60);

  // Calculate total cost
  const totalCost = session.feePerHour * session.courtCount * durationHours;

  // Count games played per player
  const gamesPlayedMap = new Map<string, number>();
  
  matches
    .filter(m => m.status === 'done')
    .forEach(match => {
      [...match.team1, ...match.team2].forEach(userId => {
        gamesPlayedMap.set(userId, (gamesPlayedMap.get(userId) || 0) + 1);
      });
    });

  // Calculate amount due for each player
  const players: PlayerBill[] = registrations.map(reg => {
    const gamesPlayed = gamesPlayedMap.get(reg.userId) || 0;
    let amountDue: number;

    if (session.billingMode === 'equal') {
      // Equal split
      amountDue = Math.round(totalCost / registrations.length);
    } else {
      // Split by games played
      const totalGames = Array.from(gamesPlayedMap.values()).reduce((a, b) => a + b, 0);
      
      if (totalGames === 0) {
        amountDue = Math.round(totalCost / registrations.length);
      } else {
        amountDue = Math.round((gamesPlayed / totalGames) * totalCost);
      }
    }

    return {
      userId: reg.userId,
      displayName: reg.displayName,
      pictureUrl: reg.pictureUrl,
      gamesPlayed,
      hoursPlayed: durationHours,
      amountDue,
      paidStatus: reg.paidStatus,
    };
  });

  // Adjust for rounding - ensure total equals totalCost
  if (session.billingMode === 'by_games') {
    const calculatedTotal = players.reduce((sum, p) => sum + p.amountDue, 0);
    const diff = totalCost - calculatedTotal;
    
    if (diff !== 0 && players.length > 0) {
      // Add/subtract the difference to the player with most games
      const sortedByGames = [...players].sort((a, b) => b.gamesPlayed - a.gamesPlayed);
      sortedByGames[0].amountDue += diff;
    }
  }

  // Calculate collected and outstanding
  const collected = players
    .filter(p => p.paidStatus === 'approved' || p.paidStatus === 'onsite')
    .reduce((sum, p) => sum + p.amountDue, 0);

  const outstanding = players
    .filter(p => p.paidStatus === 'pending')
    .reduce((sum, p) => sum + p.amountDue, 0);

  return {
    sessionId: session.id,
    totalCost,
    courtCount: session.courtCount,
    players,
    collected,
    outstanding,
  };
}

/**
 * Parse time string "HH:mm" to Date milliseconds
 */
function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.getTime();
}

/**
 * Generate KhunThong command string
 */
export function generateKhunThongCommand(
  players: PlayerBill[],
  unpaidOnly: boolean = true
): string {
  const targetPlayers = unpaidOnly 
    ? players.filter(p => p.paidStatus === 'pending')
    : players;

  if (targetPlayers.length === 0) {
    return 'ไม่มีผู้เล่นที่ต้องชำระเงิน';
  }

  const totalAmount = targetPlayers.reduce((sum, p) => sum + p.amountDue, 0);
  const mentions = targetPlayers.map(p => `@${p.displayName}`).join(' ');

  return `ขุนทอง เก็บเงิน ${totalAmount} บาท ${mentions}`;
}

/**
 * Calculate hours played from registrations
 */
export function calculateHoursPlayed(
  registrations: Registration[],
  session: Session
): Map<string, number> {
  const hoursPlayed = new Map<string, number>();
  
  // For simplicity, assume all players stayed for full duration
  // In production, track check-in/check-out times
  const startTime = parseTime(session.startTime);
  const endTime = parseTime(session.endTime);
  const durationHours = (endTime - startTime) / (1000 * 60 * 60);

  registrations.forEach(reg => {
    hoursPlayed.set(reg.userId, durationHours);
  });

  return hoursPlayed;
}
