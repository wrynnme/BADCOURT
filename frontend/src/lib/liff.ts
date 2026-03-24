// ════ LIFF SDK Singleton ════
import liff from '@line/liff';
import type { LiffProfile } from '../types';

const LIFF_ID = import.meta.env.VITE_LIFF_ID || '';

class LiffService {
  private initialized = false;
  private loginPromise: Promise<void> | null = null;

  /**
   * Initialize LIFF SDK
   * Must be called before any other LIFF operations
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      await liff.init({ liffId: LIFF_ID });
      this.initialized = true;
    } catch (error) {
      console.error('[LIFF] Init failed:', error);
      throw new Error('ไม่สามารถเริ่มต้น LIFF ได้');
    }
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return liff.isLoggedIn();
  }

  /**
   * Redirect to LINE login
   */
  login(): void {
    if (!this.initialized) {
      throw new Error('LIFF ยังไม่ได้เริ่มต้น');
    }
    
    // Store current URL to redirect back after login
    const returnUrl = window.location.href;
    liff.login({ redirectUri: returnUrl });
  }

  /**
   * Logout and clear session
   */
  logout(): void {
    liff.logout();
    this.initialized = false;
  }

  /**
   * Get user's profile
   */
  async getProfile(): Promise<LiffProfile> {
    if (!this.initialized) {
      throw new Error('LIFF ยังไม่ได้เริ่มต้น');
    }

    if (!liff.isLoggedIn()) {
      throw new Error('ยังไม่ได้ login');
    }

    try {
      const profile = await liff.getProfile();
      return {
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl || '',
        statusMessage: profile.statusMessage || '',
      };
    } catch (error) {
      console.error('[LIFF] Get profile failed:', error);
      throw new Error('ไม่สามารถดึงข้อมูลโปรไฟล์ได้');
    }
  }

  /**
   * Get ID token from LINE
   */
  getIDToken(): string | null {
    return liff.getIDToken();
  }

  /**
   * Check if running in LINE browser
   */
  isInClient(): boolean {
    return liff.isInClient();
  }

  /**
   * Check if running in external browser
   */
  isInExternalBrowser(): boolean {
    return !liff.isInClient();
  }

  /**
   * Open window with external URL
   */
  async openExternalWindow(url: string, options?: { subWindowId?: string }): Promise<void> {
    await liff.openWindow({ url, external: true, ...options });
  }

  /**
   * Send messages to chat
   */
  async sendMessages(messages: object[]): Promise<void> {
    if (!liff.isInClient()) {
      throw new Error('สามารถส่งข้อความได้เฉพาะใน LINE App เท่านั้น');
    }
    await liff.sendMessages(messages);
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return liff.getAccessToken();
  }

  /**
   * Scan code (for future QR code feature)
   */
  async scanCode(): Promise<string> {
    if (!liff.isInClient()) {
      throw new Error('สามารถสแกน QR ได้เฉพาะใน LINE App เท่านั้น');
    }
    return await liff.scanCode();
  }
}

// Export singleton instance
export const liffService = new LiffService();
export default liffService;
