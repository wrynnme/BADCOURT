// ════ KhunThong Command Generator ════
// Generates formatted commands for copying to LINE group

import type { PlayerBill, KhunThongCommand } from '../types';

/**
 * Generate a KhunThong command for a group of players
 * 
 * @param players - Array of player bills
 * @param unpaidOnly - Only include players with pending payment (default: true)
 * @returns Formatted KhunThong command
 */
export function generateKhunThongCommand(
  players: PlayerBill[],
  unpaidOnly: boolean = true
): KhunThongCommand {
  const targetPlayers = unpaidOnly
    ? players.filter((p) => p.paidStatus === 'pending')
    : players;

  if (targetPlayers.length === 0) {
    return {
      amount: 0,
      players: [],
      formattedCommand: 'ไม่มีผู้เล่นที่ต้องชำระเงิน',
    };
  }

  const totalAmount = targetPlayers.reduce((sum, p) => sum + p.amountDue, 0);
  const mentions = targetPlayers.map((p) => `@${p.displayName}`).join(' ');

  const formattedCommand = `ขุนทอง เก็บเงิน ${totalAmount} บาท ${mentions}`;

  return {
    amount: totalAmount,
    players: targetPlayers.map((p) => ({
      displayName: p.displayName,
      amount: p.amountDue,
    })),
    formattedCommand,
  };
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('[khunthong] Copy failed:', error);
    
    // Fallback for older browsers
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Format amount in Thai currency
 */
export function formatThaiBaht(amount: number): string {
  return `฿${amount.toLocaleString('th-TH')}`;
}

/**
 * Generate individual KhunThong mentions for each player
 * Useful when you want separate commands
 */
export function generateIndividualKhunThongCommands(
  players: PlayerBill[]
): string[] {
  return players
    .filter((p) => p.paidStatus === 'pending')
    .map(
      (p) =>
        `ขุนทอง เก็บเงิน ${p.amountDue} บาท @${p.displayName}`
    );
}

/**
 * Validate KhunThong command before sending
 */
export function validateKhunThongCommand(command: string): {
  valid: boolean;
  error?: string;
  mentions: string[];
} {
  const mentions = command.match(/@[\w]+/g) || [];
  
  if (!command.startsWith('ขุนทอง')) {
    return {
      valid: false,
      error: 'คำสั่งต้องขึ้นต้นด้วย "ขุนทอง"',
      mentions,
    };
  }
  
  if (!command.includes('เก็บเงิน')) {
    return {
      valid: false,
      error: 'คำสั่งต้องมี "เก็บเงิน"',
      mentions,
    };
  }
  
  if (mentions.length === 0) {
    return {
      valid: false,
      error: 'ต้องมี @mentions อย่างน้อย 1 คน',
      mentions,
    };
  }
  
  return { valid: true, mentions };
}
