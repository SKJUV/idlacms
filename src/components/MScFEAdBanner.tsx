import React, { useState } from 'react';
import { 
  Flame, 
  Sparkles, 
  ArrowRight, 
  FileText, 
  Download, 
  X, 
  ChevronUp, 
  Globe
} from 'lucide-react';

interface TopBarBannerProps {
  onApply: () => void;
  onViewModal: () => void;
  onDismiss: () => void;
}

/**
 * Top Announcement Bar positioned directly below the main navigation header.
 */
export const MScFETopBarBanner: React.FC<TopBarBannerProps> = ({
  onApply,
  onViewModal,
  onDismiss,
}) => {
  return (
    <aside 
      aria-label="Bourse d'Excellence MScFE" 
      className="bg-gradient-to-r from-sky-700 via-blue-700 to-indigo-800 text-white py-2 px-3 sm:px-6 shadow-md border-b border-sky-400/30 sticky top-[57px] sm:top-[65px] z-40 backdrop-blur-md bg-opacity-95"
    >
      <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-2.5 text-xs">
        {/* Left: Badge & Description */}
        <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider bg-amber-400 text-slate-950 shadow-sm shrink-0 animate-pulse">
            <Flame className="w-3 h-3 text-red-600 fill-red-600" />
            Bourse d'Excellence 2027
          </span>
          <p className="font-bold text-white text-xs sm:text-[13px] leading-tight truncate sm:whitespace-normal">
            <span className="text-sky-200">Master Ingénierie Financière (MScFE) : </span>
            <span className="font-extrabold text-amber-300">Frais de scolarité 100% couverts ($38 612 USD)</span>
            <span className="text-white/80 hidden lg:inline"> — Sous-région Afrique Centrale (CEMAC - CEEAC - Cameroun) • Cohorte Janvier 2027</span>
          </p>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onApply}
            className="bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold px-3.5 py-1.5 rounded-xl transition-all shadow-sm hover:shadow text-xs flex items-center gap-1.5 cursor-pointer hover:scale-105"
          >
            <span>S'inscrire</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onViewModal}
            className="bg-white/15 hover:bg-white/25 text-white font-bold px-3 py-1.5 rounded-xl transition-all text-xs flex items-center gap-1.5 cursor-pointer border border-white/20"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Voir le Flyer Publicitaire</span>
          </button>
          <button
            onClick={onDismiss}
            className="p-1 text-white/70 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-white/10"
            title="Masquer le bandeau"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

interface FloatingAdWidgetProps {
  onGoToBourse: () => void;
  onViewModal?: () => void;
  t?: (key: any) => string;
}

/**
 * Clean & Aesthetic Floating Scholarship Widget on the Extreme Right.
 */
export const MScFEFloatingAdWidget: React.FC<FloatingAdWidgetProps> = ({
  onGoToBourse,
  onViewModal,
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
          onClick={onViewModal || onGoToBourse}
          className="relative group cursor-pointer overflow-hidden rounded-xl border border-sky-400/30 shadow-md bg-slate-950 transition-all duration-300 transform hover:scale-[1.02]"
          title="Cliquer pour afficher le flyer officiel"
        >
          <img
            src="/flyer_bourse_mscfe_2027.webp"
            alt="Bourse d'Excellence MScFE"
            className="w-full h-auto object-cover max-h-[290px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-2.5">
            <span className="text-[11px] font-extrabold text-white bg-sky-600/90 backdrop-blur-xs px-3 py-1 rounded-lg border border-sky-400/40">
              Voir le Flyer
            </span>
          </div>
        </div>

        {/* Single Action Button */}
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

interface AdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
}

/**
 * Modal displaying the official flyer graphic and scholarship details.
 */
export const MScFEAdModal: React.FC<AdModalProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative max-w-4xl w-full max-h-[92vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 text-white rounded-3xl border border-sky-400/40 shadow-[0_0_60px_rgba(2,132,199,0.35)] p-5 sm:p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer border border-white/10"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header Badge */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md">
            <Flame className="w-3.5 h-3.5 text-red-600 fill-red-600 animate-bounce" />
            Campagne Officielle • Cohorte Janvier 2027
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Frais de scolarité 100% couverts ($38 612 USD)
          </span>
        </div>

        {/* Main Grid: Flyer on left, Content on right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left: Flyer Image card */}
          <div className="md:col-span-5 flex flex-col items-center gap-3">
            <div className="relative group overflow-hidden rounded-2xl border-2 border-sky-400/40 shadow-2xl bg-slate-950 transition-all transform hover:scale-[1.01]">
              <img
                src="/flyer_bourse_mscfe_2027.webp"
                alt="Flyer Officiel Bourse MScFE 2027"
                className="w-full h-auto object-cover max-h-[380px] sm:max-h-[440px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                <a
                  href="/Flyer_Bourse_MScFE_2027.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-brand-primary text-white text-xs font-extrabold px-4 py-2 rounded-xl shadow-lg hover:bg-brand-hover transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ouvrir le PDF HD</span>
                </a>
              </div>
            </div>
            <a
              href="/Flyer_Bourse_MScFE_2027.pdf"
              download="IDLA_Flyer_Bourse_MScFE_2027.pdf"
              className="text-xs font-extrabold text-sky-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger le Document Officiel (PDF)</span>
            </a>
          </div>

          {/* Right: Pitch & Actions */}
          <div className="md:col-span-7 space-y-4">
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                Master of Science in Financial Engineering (MScFE)
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-sky-200 mt-1">
                Bourse d'Excellence Internationale • $38 612 USD pris en charge
              </p>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Une formation d'élite combinant finance quantitative, intelligence artificielle, modélisation mathématique et programmation de pointe. Ouverte aux titulaires au minimum d'une Licence ou d'un Bachelor.
            </p>

            {/* Key Highlights Cards */}
            <div className="grid grid-cols-2 gap-2.5 pt-1 text-left">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="text-[10px] font-bold text-sky-300 uppercase">Prise en charge</div>
                <div className="text-xs sm:text-sm font-black text-emerald-400">100% Scolarité ($38 612 USD)</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="text-[10px] font-bold text-sky-300 uppercase">Cohorte</div>
                <div className="text-xs sm:text-sm font-black text-amber-300">Janvier 2027</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="text-[10px] font-bold text-sky-300 uppercase">Niveau requis</div>
                <div className="text-xs sm:text-sm font-black text-white">Licence / Bachelor min.</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="text-[10px] font-bold text-sky-300 uppercase flex items-center gap-1">
                  <Globe className="w-3 h-3 text-sky-400" />
                  <span>Campus</span>
                </div>
                <div className="text-xs sm:text-sm font-black text-white">Campus IDLA Yaoundé, Cameroun</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={onApply}
                className="w-full group bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-600 hover:from-emerald-400 hover:to-sky-500 text-white font-black text-sm sm:text-base py-3.5 px-6 rounded-2xl transition-all shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 flex items-center justify-center gap-2.5 cursor-pointer hover:scale-[1.01]"
              >
                <FileText className="w-5 h-5" />
                <span>Postuler à la Bourse Dès Maintenant</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
