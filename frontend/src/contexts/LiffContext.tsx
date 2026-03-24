// ════ LIFF Context ════
import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { liffService } from '../lib/liff';
import type { LiffProfile } from '../types';

interface LiffContextValue {
  profile: LiffProfile | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  isInClient: boolean;
  isInExternalBrowser: boolean;
  error: string | null;
  liff: typeof liffService;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const LiffContext = createContext<LiffContextValue | undefined>(undefined);

interface LiffProviderProps {
  children: ReactNode;
  requireLogin?: boolean; // Default: true
}

export function LiffProvider({ children, requireLogin = true }: LiffProviderProps) {
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isInClient = liffService.isInClient();
  const isInExternalBrowser = !isInClient;

  const isLoggedIn = liffService.isLoggedIn();

  const refreshProfile = useCallback(async () => {
    if (!liffService.isLoggedIn()) {
      setProfile(null);
      return;
    }

    try {
      const data = await liffService.getProfile();
      setProfile(data);
      setError(null);
    } catch (err) {
      console.error('[LiffContext] Refresh profile failed:', err);
      setError(err instanceof Error ? err.message : 'ดึงข้อมูลล้มเหลว');
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initLiff = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Check external browser
        if (!liffService.isInClient()) {
          // External browser - show warning but don't block
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }

        // Initialize LIFF
        await liffService.init();

        // Check login status
        if (!liffService.isLoggedIn()) {
          if (requireLogin) {
            liffService.login();
            return;
          }
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }

        // Get profile
        const data = await liffService.getProfile();
        if (mounted) {
          setProfile(data);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[LiffContext] Init failed:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'เริ่มต้น LIFF ล้มเหลว');
          setIsLoading(false);
        }
      }
    };

    initLiff();

    return () => {
      mounted = false;
    };
  }, [requireLogin]);

  const logout = useCallback(() => {
    liffService.logout();
    setProfile(null);
    window.location.reload();
  }, []);

  const value: LiffContextValue = {
    profile,
    isLoading,
    isLoggedIn,
    isInClient,
    isInExternalBrowser,
    error,
    liff: liffService,
    logout,
    refreshProfile,
  };

  return <LiffContext.Provider value={value}>{children}</LiffContext.Provider>;
}

export function useLiffContext(): LiffContextValue {
  const context = useContext(LiffContext);
  if (!context) {
    throw new Error('useLiffContext must be used within LiffProvider');
  }
  return context;
}

export default LiffContext;
