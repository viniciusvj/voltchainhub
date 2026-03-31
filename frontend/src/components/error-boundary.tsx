'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Erro capturado:', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 rounded-xl bg-volt-dark-800 border border-red-900/50 text-center space-y-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-900/20 border border-red-700/40">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-gray-100">
              Algo deu errado
            </h2>
            <p className="text-sm text-gray-400 max-w-sm">
              {this.state.error?.message
                ? this.state.error.message
                : 'Ocorreu um erro inesperado. Por favor, tente novamente.'}
            </p>
          </div>

          <button
            onClick={this.handleRetry}
            className="mt-2 px-5 py-2 rounded-lg bg-[#0066FF] hover:bg-[#0052CC] text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#0066FF]/50"
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
