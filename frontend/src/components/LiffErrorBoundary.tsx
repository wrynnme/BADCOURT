// ════ LIFF Error Boundary ════
import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class LiffErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[LiffErrorBoundary] Error caught:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-gray-600 mb-4">
              ไม่สามารถเริ่มต้นแอปพลิเคชันได้
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              ลองใหม่
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Loading skeleton during LIFF initialization
 */
export function LiffLoadingSkeleton(): ReactNode {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">กำลังเริ่มต้น...</p>
      </div>
    </div>
  );
}

/**
 * Warning screen for external browser users
 */
export function ExternalBrowserWarning(): ReactNode {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="text-6xl mb-4">📱</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">กรุณาเปิดใน LINE</h2>
        <p className="text-gray-600 mb-4">
          แอปพลิเคชันนี้ต้องเปิดผ่าน LINE App เท่านั้น
        </p>
        <p className="text-sm text-gray-500">
          กรุณาคลิกลิงก์ที่ได้รับใน LINE เพื่อเปิดใช้งาน
        </p>
      </div>
    </div>
  );
}

export default LiffErrorBoundary;
