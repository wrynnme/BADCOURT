// ════ LINE Notify Service ════
import { createClient } from '@supabase/supabase-js';

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface NotifyParams {
  userId: string;
  type: string;
  sessionId?: string;
  payload?: Record<string, unknown>;
}

/**
 * Send LINE Service Message to a user
 * Requires Verified Mini App channel for free Service Messages
 */
async function sendLineServiceMessage(userId: string, messages: object[]): Promise<boolean> {
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: userId,
        messages,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[lineNotify] Push failed:', response.status, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[lineNotify] Push error:', error);
    return false;
  }
}

/**
 * Log notification to database
 */
async function logNotification(params: NotifyParams, success: boolean): Promise<void> {
  try {
    await supabase.from('notifications_log').insert({
      user_id: params.userId,
      type: params.type,
      session_id: params.sessionId,
      payload: params.payload,
      success,
    });
  } catch (error) {
    console.error('[lineNotify] Log error:', error);
  }
}

// ════ Notification Templates ════

interface RegistrationConfirmParams {
  userId: string;
  displayName: string;
  sessionName: string;
  sessionDate: string;
  sessionTime: string;
  registrationNumber: number;
  liffUrl: string;
}

export async function sendRegistrationConfirmation(params: RegistrationConfirmParams): Promise<boolean> {
  const { userId, displayName, sessionName, sessionDate, sessionTime, registrationNumber, liffUrl } = params;

  const messages = [
    {
      type: 'flex',
      altText: `🎾 ลงทะเบียนสำเร็จ!`,
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '✅ ลงทะเบียนสำเร็จ',
              weight: 'bold',
              size: 'lg',
              color: '#00E5A0',
            },
          ],
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            { type: 'text', text: `สวัสดี ${displayName}!`, weight: 'bold' },
            { type: 'text', text: `คุณลงทะเบียนเข้าร่วม "${sessionName}"`, margin: 'md' },
            { type: 'text', text: `📅 ${sessionDate}`, margin: 'sm' },
            { type: 'text', text: `🕐 ${sessionTime}`, margin: 'sm' },
            { type: 'text', text: `🔢 ลำดับที่ ${registrationNumber}`, margin: 'sm' },
          ],
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              action: {
                type: 'uri',
                label: '📋 ดูบอร์ดเกม',
                uri: liffUrl,
              },
              style: 'primary',
              color: '#00E5A0',
            },
          ],
        },
      },
    },
  ];

  const success = await sendLineServiceMessage(userId, messages);
  await logNotification({ userId, type: 'registration_confirm', payload: params }, success);
  return success;
}

interface BillNotifyParams {
  userId: string;
  displayName: string;
  amount: number;
  sessionName: string;
  gamesPlayed: number;
  qrCodeUrl?: string;
  paymentInstructions?: string;
  liffUrl: string;
}

export async function sendBillNotification(params: BillNotifyParams): Promise<boolean> {
  const { userId, displayName, amount, sessionName, gamesPlayed, qrCodeUrl, liffUrl } = params;

  const bodyContents = [
    { type: 'text', text: `💰 ยอดที่ต้องชำระ: ฿${amount.toLocaleString()}`, weight: 'bold', size: 'lg' },
    { type: 'text', text: `📅 ก๊วน: ${sessionName}`, margin: 'md' },
    { type: 'text', text: `🎮 เล่นไป: ${gamesPlayed} เกม`, margin: 'sm' },
  ];

  if (qrCodeUrl) {
    bodyContents.push({
      type: 'image',
      url: qrCodeUrl,
      size: 'md',
      margin: 'md',
    });
  }

  const messages = [
    {
      type: 'flex',
      altText: '📋 แจ้งยอดชำระค่าก๊วน',
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '📋 แจ้งยอดชำระ',
              weight: 'bold',
              size: 'lg',
              color: '#F2A100',
            },
          ],
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: bodyContents,
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              action: {
                type: 'uri',
                label: '📎 แนบสลิป',
                uri: liffUrl,
              },
              style: 'primary',
              color: '#F2A100',
            },
          ],
        },
      },
    },
  ];

  const success = await sendLineServiceMessage(userId, messages);
  await logNotification({ userId, type: 'bill_notify', payload: params }, success);
  return success;
}

interface ReminderParams {
  userId: string;
  displayName: string;
  sessionName: string;
  sessionTime: string;
  location?: string;
  hasUnpaid: boolean;
  unpaidAmount?: number;
  liffUrl: string;
}

export async function sendReminderNotification(params: ReminderParams): Promise<boolean> {
  const { userId, displayName, sessionName, sessionTime, hasUnpaid, unpaidAmount, liffUrl } = params;

  const bodyContents = [
    { type: 'text', text: `📅 ${sessionName}`, weight: 'bold' },
    { type: 'text', text: `🕐 ${sessionTime}`, margin: 'sm' },
  ];

  if (hasUnpaid && unpaidAmount) {
    bodyContents.push({
      type: 'text',
      text: `⚠️ ยอดค้างชำระ: ฿${unpaidAmount.toLocaleString()}`,
      margin: 'md',
      color: '#FF0000',
    });
  }

  const messages = [
    {
      type: 'flex',
      altText: '⏰ แจ้งเตือนก่อนตี 1 ชั่วโมง',
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '⏰ แจ้งเตือน',
              weight: 'bold',
              size: 'lg',
              color: '#F2A100',
            },
          ],
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            { type: 'text', text: `สวัสดี ${displayName}!` },
            { type: 'text', text: 'ก๊วนที่คุณลงทะเบียนจะเริ่มในอีก 1 ชั่วโมง', margin: 'sm' },
            ...bodyContents,
          ],
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              action: {
                type: 'uri',
                label: '📋 ดูบอร์ดเกม',
                uri: liffUrl,
              },
              style: 'primary',
              color: '#F2A100',
            },
          ],
        },
      },
    },
  ];

  const success = await sendLineServiceMessage(userId, messages);
  await logNotification({ userId, type: 'reminder', payload: params }, success);
  return success;
}

interface PaymentApprovedParams {
  userId: string;
  displayName: string;
  amount: number;
  sessionName: string;
  paidAt: string;
  liffUrl: string;
}

export async function sendPaymentApprovedNotification(params: PaymentApprovedParams): Promise<boolean> {
  const { userId, displayName, amount, sessionName, paidAt, liffUrl } = params;

  const messages = [
    {
      type: 'flex',
      altText: '✅ ชำระเงินสำเร็จ',
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '✅ ชำระเงินสำเร็จ',
              weight: 'bold',
              size: 'lg',
              color: '#00E5A0',
            },
          ],
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            { type: 'text', text: `สวัสดี ${displayName}!` },
            { type: 'text', text: `ได้รับชำระเงิน ฿${amount.toLocaleString()}`, margin: 'md' },
            { type: 'text', text: `📅 ก๊วน: ${sessionName}`, margin: 'sm' },
            { type: 'text', text: `🕐 วันที่: ${paidAt}`, margin: 'sm' },
          ],
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              action: {
                type: 'uri',
                label: '📊 ดูสถิติของฉัน',
                uri: liffUrl,
              },
              style: 'primary',
              color: '#00E5A0',
            },
          ],
        },
      },
    },
  ];

  const success = await sendLineServiceMessage(userId, messages);
  await logNotification({ userId, type: 'payment_approved', payload: params }, success);
  return success;
}
