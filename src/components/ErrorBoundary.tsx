import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Mornigami ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background text-text-primary">
          <div className="max-w-lg w-full bg-surface border border-border rounded-3xl p-8 shadow-xl text-center space-y-6 animate-in fade-in-50 duration-300">
            <div className="w-16 h-16 rounded-2xl bg-danger/10 text-danger mx-auto flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl font-black text-text-primary">
                {this.props.fallbackTitle || 'A fold slipped out of place'}
              </h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                An unexpected application error occurred while rendering this view.
                Don't worry, your cloud data in Firestore remains secure.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-background/80 border border-border rounded-2xl p-4 text-left font-mono text-xs text-danger overflow-x-auto max-h-40">
                <p className="font-bold">{this.state.error.name}: {this.state.error.message}</p>
                {this.state.error.stack && (
                  <pre className="text-[10px] text-text-tertiary mt-2 whitespace-pre-wrap">
                    {this.state.error.stack.split('\n').slice(0, 4).join('\n')}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleReset}
                className="w-full sm:w-auto h-9 text-xs font-bold gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </Button>
              <Button
                size="sm"
                onClick={this.handleReload}
                className="w-full sm:w-auto h-9 text-xs font-bold"
              >
                Reload Page
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleClearAndReload}
                className="w-full sm:w-auto h-9 text-xs font-bold text-danger hover:bg-danger-bg hover:text-danger gap-2 border-danger/30"
                title="Clears corrupted local cache and reloads"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Cache</span>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
