// ════ PromptPay QR Generator ════
// Using promptpay-qr library

interface QRPayload {
  payload: string;
  expiry: Date;
}

/**
 * Generate PromptPay QR payload
 * 
 * @param promptPayNumber - PromptPay number (mobile or ID card)
 * @param amount - Amount to pay (optional)
 * @returns QR payload string
 */
export function generatePromptPayQR(
  promptPayNumber: string,
  amount?: number
): QRPayload {
  // Dynamic import to avoid SSR issues
  const payloadGenerator = require('promptpay-qr');

  const qrPayload = payloadGenerator(promptPayNumber, {
    amount: amount || undefined,
  });

  return {
    payload: qrPayload,
    expiry: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiry
  };
}

/**
 * Format amount for display
 */
export function formatAmount(amount: number): string {
  return `฿${amount.toLocaleString('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Validate PromptPay number format
 * Supports:
 * - Mobile number (10 digits starting with 0)
 * - ID card number (13 digits)
 */
export function isValidPromptPayNumber(number: string): boolean {
  const cleanNumber = number.replace(/[\s-]/g, '');
  
  // Mobile: 0812345678
  if (/^0\d{9}$/.test(cleanNumber)) {
    return true;
  }
  
  // ID card: 1-2345-67890-12-1
  if (/^\d{13}$/.test(cleanNumber)) {
    return true;
  }
  
  return false;
}

/**
 * Format PromptPay number for display
 */
export function formatPromptPayNumber(number: string): string {
  const clean = number.replace(/[\s-]/g, '');
  
  if (/^0\d{9}$/.test(clean)) {
    // Format as mobile: 081-234-5678
    return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
  }
  
  if (/^\d{13}$/.test(clean)) {
    // Format as ID: 1-2345-67890-12-1
    return `${clean.slice(0, 1)}-${clean.slice(1, 5)}-${clean.slice(5, 10)}-${clean.slice(10, 12)}-${clean.slice(12)}`;
  }
  
  return number;
}
