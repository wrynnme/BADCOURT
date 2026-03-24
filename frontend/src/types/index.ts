// ════ BadCourt TypeScript Types ════

// ── Session ──
export interface Session {
  id: string;
  name: string;
  date: string; // ISO date "2025-03-28"
  startTime: string; // "18:00"
  endTime: string; // "20:00"
  courtCount: number; // 1–N (แล้วแต่วัน)
  maxPlayers: number;
  feePerHour: number; // ค่าคอร์ทรวม/ชั่วโมง
  billingMode: 'equal' | 'by_games'; // หารเท่า หรือ ตามเกม
  defaultMatchMode: MatchMode;
  status: 'open' | 'playing' | 'ended';
  createdBy: string; // LINE userId
}

// ── Registration ──
export interface Registration {
  id: string;
  sessionId: string;
  userId: string;
  displayName: string;
  pictureUrl: string;
  joinedAt: string; // ISO datetime
  paidStatus: 'pending' | 'approved' | 'rejected' | 'onsite';
  paymentMethod: 'qr' | 'transfer' | 'onsite';
  slipUrl?: string;
  gamesPlayed: number; // นับจาก matches
  amountDue: number; // คำนวณจาก billing service
}

// ── Match ──
export type MatchMode = 'random' | 'rotation' | 'winner_stays' | 'manual';

export interface Match {
  id: string;
  sessionId: string;
  courtNumber: number; // 1, 2, 3, ...
  roundNumber: number;
  team1: string[]; // [userId, userId]
  team2: string[]; // [userId, userId]
  score1?: number;
  score2?: number;
  winnerId?: 'team1' | 'team2';
  status: 'playing' | 'done';
  startedAt: string;
  endedAt?: string;
}

// ── Billing ──
export interface PlayerBill {
  userId: string;
  displayName: string;
  pictureUrl: string;
  gamesPlayed: number;
  hoursPlayed: number;
  amountDue: number;
  paidStatus: Registration['paidStatus'];
}

export interface SessionBill {
  sessionId: string;
  totalCost: number;
  courtCount: number;
  players: PlayerBill[];
  collected: number;
  outstanding: number;
}

// ── Stats ──
export interface PlayerStats {
  userId: string;
  displayName: string;
  pictureUrl: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  winRate: number; // 0.0–1.0
}

// ── LIFF Profile ──
export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl: string;
  statusMessage?: string;
}

// ── API Response Types ──
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Realtime Event Types ──
export type RealtimeEvent =
  | { type: 'match_created'; payload: Match }
  | { type: 'score_updated'; payload: { matchId: string; score1: number; score2: number } }
  | { type: 'match_ended'; payload: { matchId: string; winnerId: 'team1' | 'team2' } }
  | { type: 'registration_added'; payload: Registration }
  | { type: 'registration_removed'; payload: { userId: string } };

// ── Matchmaking ──
export interface MakeMatchesParams {
  players: Registration[];
  mode: MatchMode;
  courtCount: number;
  prevMatches: Match[];
}

export interface MatchmakingResult {
  matches: Match[];
  queue: Registration[];
}

// ── KhunThong ──
export interface KhunThongCommand {
  amount: number;
  players: { displayName: string; amount: number }[];
  formattedCommand: string;
}
