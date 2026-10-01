import React, { useState } from 'react';
import { ArrowRight, X, ChevronUp, Sparkles } from 'lucide-react';

interface MScFEFloatingAdWidgetProps {
  onGoToBourse: () => void;
  t?: (key: any) => string;
}

/**
 * Clean & Aesthetic Floating Scholarship Widget on the Extreme Right.
 * Displays the official announcement visual on the far right with a direct
 * redirection button to the dedicated scholarship page.
 * Completely free of clutter, popup spam, or "flyer" wording.
 */
export const MScFEFloatingAdWidget: React.FC<MScFEFloatingAdWidgetProps> = ({
  onGoToBourse,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  if (isMinimized) {
    return (
      <aside 
        aria-label="Annonce Bourse d'Excellence"
        className="fixed bottom-5 right-4 sm:right-6 z-40 animate-fade-in"
      >
        <button
          onClick={() => setIsMinimized(false)}
          className="group flex items-center gap-2 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 text-white px-3.5 py-2 rounded-full shadow-2xl border border-sky-400/50 hover:scale-105 transition-all cursor-pointer"
          title="Afficher l'annonce de la bourse"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-black tracking-tight">🎓 Bourse 100% MScFE</span>
          <ChevronUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </aside>
    );
  }

  return (
    <aside 
      aria-label="Bourse d'Excellence MScFE"
      className="fixed bottom-5 right-4 sm:right-6 z-40 max-w-[210px] sm:max-w-[240px] w-full animate-fade-in"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-[#031b33] to-slate-900 text-white border border-sky-400/40 shadow-[0_12px_40px_rgba(2,132,199,0.35)] p-3 space-y-2.5 backdrop-blur-md">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-sky-500/20 rounded-full blur-xl pointer-events-none" />

        {/* Minimal Header Controls */}
        <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-sky-300">
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="uppercase tracking-wider font-extrabold text-[9.5px]">Bourse d'Excellence</span>
          </div>
          <div className="flex items-center gap-0.5 text-slate-400">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
              title="Réduire"
            >
              <span className="text-xs font-bold leading-none">_</span>
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Clickable Image (Far Right Display) */}
        <div 
          onClick={onGoToBourse}
          className="relative group cursor-pointer overflow-hidden rounded-xl border border-sky-400/30 shadow-md bg-slate-950 transition-all duration-300 transform hover:scale-[1.02]"
          title="Cliquer pour accéder à la page de la bourse"
        >
          <img
            src="/flyer_bourse_mscfe_2027.webp"
            alt="Bourse d'Excellence MScFE"
            className="w-full h-auto object-cover max-h-[290px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-2.5">
            <span className="text-[11px] font-extrabold text-white bg-sky-600/90 backdrop-blur-xs px-3 py-1 rounded-lg border border-sky-400/40">
              Voir la Bourse
            </span>
          </div>
        </div>

        {/* Single Aesthetic Action Button */}
        <button
          onClick={onGoToBourse}
          className="w-full group bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-600 hover:from-emerald-400 hover:to-sky-500 text-white font-extrabold text-xs py-2.5 px-3 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-emerald-500/25"
        >
          <span>Découvrir la Bourse</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </aside>
  );
};
