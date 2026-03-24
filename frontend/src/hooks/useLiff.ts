// ════ useLiff Hook ════
import { useLiffContext } from '../contexts/LiffContext';
import type { LiffProfile } from '../types';

/**
 * Hook สำหรับเข้าถึง LIFF functionality
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { profile, isLoggedIn, isLoading, logout } = useLiff();
 *   
 *   if (isLoading) return <Skeleton />;
 *   if (!isLoggedIn) return <LoginButton />;
 *   
 *   return <div>สวัสดี {profile.displayName}</div>;
 * }
 * ```
 */
export function useLiff(): {
  /** ข้อมูลโปรไฟล์ผู้ใช้ */
  profile: LiffProfile | null;
  /** กำลังโหลดข้อมูล */
  isLoading: boolean;
  /** ผู้ใช้ login แล้วหรือยัง */
  isLoggedIn: boolean;
  /** กำลังรันใน LINE App */
  isInClient: boolean;
  /** กำลังรันใน external browser */
  isInExternalBrowser: boolean;
  /** ข้อความ error (ถ้ามี) */
  error: string | null;
  /** ฟังก์ชัน logout */
  logout: () => void;
  /** ดึงข้อมูลโปรไฟล์ใหม่ */
  refreshProfile: () => Promise<void>;
} {
  const context = useLiffContext();

  return {
    profile: context.profile,
    isLoading: context.isLoading,
    isLoggedIn: context.isLoggedIn,
    isInClient: context.isInClient,
    isInExternalBrowser: context.isInExternalBrowser,
    error: context.error,
    logout: context.logout,
    refreshProfile: context.refreshProfile,
  };
}

/**
 * Hook สำหรับดึง userId อย่างเดียว (สำหรับ API calls)
 * จะคอย redirect ไป login ถ้ายังไม่ได้ login
 * 
 * @throws Error ถ้ายังไม่ได้ login
 */
export function useUserId(): string {
  const { profile, isLoggedIn, isLoading } = useLiff();

  if (isLoading) {
    throw new Error('กำลังโหลด...');
  }

  if (!isLoggedIn || !profile) {
    throw new Error('ยังไม่ได้ login');
  }

  return profile.userId;
}

export default useLiff;
