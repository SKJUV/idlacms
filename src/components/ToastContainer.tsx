import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[99999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-4 sm:p-0">
      {toasts.map((toast) => {
        const getIcon = () => {
          switch (toast.type) {
            case 'success':
              return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
            case 'error':
              return <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />;
            case 'warning':
              return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
            default:
              return <Info className="w-5 h-5 text-sky-500 shrink-0" />;
          }
        };

        const getBorderColor = () => {
          switch (toast.type) {
            case 'success':
              return 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/30';
            case 'error':
              return 'border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/30';
            case 'warning':
              return 'border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/30';
            default:
              return 'border-sky-500/30 bg-sky-500/5 dark:bg-sky-950/30';
          }
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-md shadow-xl bg-white dark:bg-bg-secondary text-text-primary ${getBorderColor()} transition-all animate-in fade-in slide-in-from-top-4 duration-300`}
            role="alert"
          >
            <div className="pt-0.5">{getIcon()}</div>
            <div className="flex-1 text-xs font-semibold leading-relaxed text-text-primary">
              {toast.message}
            </div>
            <button
              onClick={() => onRemove(toast.id)}
              className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shrink-0"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
