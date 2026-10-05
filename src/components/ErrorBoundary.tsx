import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    // If it was a storage quota error, clear stale large keys from localStorage
    if (error.message?.includes('QuotaExceededError') || error.name === 'QuotaExceededError') {
      try {
        localStorage.clear();
      } catch {
        // ignore
      }
    }
  }

  private handleReset = () => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border-2 border-[#D4AF37] shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-[#0F2E22]">Ayobami SAM Ventures</h2>
            <p className="text-xs text-gray-600 font-medium">
              The application encountered a temporary display issue, likely due to browser storage limits.
            </p>
            <button
              onClick={this.handleReset}
              className="w-full py-3 rounded-xl bg-[#0F2E22] hover:bg-[#1B4332] text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Application & Clear Local Cache</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
