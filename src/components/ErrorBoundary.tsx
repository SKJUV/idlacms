import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export interface ErrorBoundaryProps {
  children: ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-bg-secondary border border-border-primary rounded-3xl p-8 text-center space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto shadow-inner border border-rose-500/20">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-text-primary">Une erreur inattendue est survenue</h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                Notre système a sécurisé votre session. Veuillez recharger la page ou retourner à l'accueil pour continuer.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-bg-primary rounded-xl border border-border-primary text-[11px] font-mono text-rose-600 dark:text-rose-400 text-left overflow-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-md cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Recharger la page
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 bg-bg-primary hover:bg-border-primary/50 text-text-primary border border-border-primary text-xs font-bold px-5 py-3 rounded-xl transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" /> Accueil
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
