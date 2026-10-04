import React, { useState } from 'react';
import { Gift, ArrowRight, X, ChevronUp } from 'lucide-react';

interface AmbassadorFloatingAdWidgetProps {
  onRegister: () => void;
  language?: 'fr' | 'en';
}

/**
 * Widget flottant ambassadeur — même format compact que la bourse MScFE.
 * Pas de popup : carte uniquement.
 */
export const AmbassadorFloatingAdWidget: React.FC<AmbassadorFloatingAdWidgetProps> = ({
  onRegister,
  language = 'fr',
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const isEn = language === 'en';

  if (isDismissed) return null;

  if (isMinimized) {
    return (
      <aside
        aria-label={isEn ? 'Ambassador program' : 'Programme ambassadeur'}
        className="fixed bottom-5 left-4 sm:left-6 z-40 animate-fade-in"
      >
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="group flex items-center gap-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 text-white px-3.5 py-2 rounded-full shadow-2xl border border-emerald-400/50 hover:scale-105 transition-all cursor-pointer"
          title={isEn ? 'Show ambassador announcement' : 'Afficher l’annonce ambassadeur'}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
          </span>
          <span className="text-xs font-black tracking-tight">
            {isEn ? 'Ambassador' : 'Ambassadeur'}
          </span>
          <ChevronUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </aside>
    );
  }

  return (
    <aside
      aria-label={isEn ? 'Ambassador program' : 'Programme ambassadeur'}
      className="fixed bottom-5 left-4 sm:left-6 z-40 max-w-[210px] sm:max-w-[240px] w-full animate-fade-in"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-[#031b33] to-slate-900 text-white border border-emerald-400/40 shadow-[0_12px_40px_rgba(16,185,129,0.28)] p-3 space-y-2.5 backdrop-blur-md">
        <div className="absolute -top-12 -left-12 w-28 h-28 bg-emerald-500/20 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-emerald-300">
          <div className="flex items-center gap-1">
            <Gift className="w-3 h-3 text-amber-400" />
            <span className="uppercase tracking-wider font-extrabold text-[9.5px]">
              {isEn ? 'Ambassador' : 'Ambassadeur'}
            </span>
          </div>
          <div className="flex items-center gap-0.5 text-slate-400">
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="p-1 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
              title={isEn ? 'Minimize' : 'Réduire'}
            >
              <span className="text-xs font-bold leading-none">_</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-1 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
              title={isEn ? 'Close' : 'Fermer'}
              aria-label={isEn ? 'Close' : 'Fermer'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onRegister}
          className="relative group w-full cursor-pointer overflow-hidden rounded-xl border border-emerald-400/30 shadow-md bg-slate-950 transition-all duration-300 hover:scale-[1.02] p-0"
          title={isEn ? 'Register as ambassador' : "S'inscrire comme ambassadeur"}
        >
          <img
            src="/flyer_ambassadeur_idla.webp?v=2"
            alt={isEn ? 'IDLA Ambassador Program' : 'Programme Ambassadeur IDLA'}
            className="w-full h-auto object-cover max-h-[290px]"
          />
        </button>

        <button
          type="button"
          onClick={onRegister}
          className="w-full group bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-600 hover:from-emerald-400 hover:to-sky-500 text-white font-extrabold text-xs py-2.5 px-3 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-emerald-500/25"
        >
          <span>{isEn ? 'Become Ambassador' : 'Devenir Ambassadeur'}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </aside>
  );
};
