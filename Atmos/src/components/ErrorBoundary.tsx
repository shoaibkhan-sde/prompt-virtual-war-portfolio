import { Component, ErrorInfo, ReactNode } from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";
import { clientLogger } from "../utils/logger";

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
    clientLogger.error("uncaught_boundary_error", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="ledger-card max-w-md w-full border-accent-red/30 flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-accent-red/10 border border-accent-red/20 flex items-center justify-center text-accent-red animate-pulse">
              <AlertOctagon size={36} />
            </div>
            
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Ledger Sync Suspended
            </h1>
            
            <p className="text-muted text-sm leading-relaxed">
              Atmos encountered an unexpected error processing your carbon ledger transaction state. No carbon was lost in this transaction.
            </p>
            
            {this.state.error && (
              <div className="w-full bg-background border border-border rounded p-3 text-left">
                <p className="text-xs font-mono text-accent-red truncate">
                  {this.state.error.name}: {this.state.error.message}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="ledger-btn-primary w-full bg-gradient-to-r from-accent-red to-red-600 text-white flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} />
              Reset Carbon Ledger
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
