import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Sparkles, 
  ArrowRight, 
  FileText, 
  Download, 
  X, 
  CheckCircle2, 
  Award, 
  GraduationCap, 
  ExternalLink,
  ChevronUp,
  Maximize2
} from 'lucide-react';

interface MScFEAdBannerProps {
  onApply: () => void;
  t: (key: any) => string;
  onDownloadPolicy?: (lang: 'fr' | 'en') => void;
}

/**
 * 1. IN-PAGE DISPLAY AD BANNER (Billboard / Leaderboard Format)
 * Designed to look and feel like an official, high-impact sponsored display advertisement.
 */
export const MScFEInPageBanner: React.FC<{
  onApply: () => void;
  onViewModal: () => void;
  t: (key: any) => string;
  variant?: 'billboard' | 'compact';
}> = ({ onApply, onViewModal, t, variant = 'billboard' }) => {
  return (
    <div className="relative group w-full overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-[#031b33] to-slate-900 border-2 border-sky-400/40 shadow-[0_10px_40px_rgba(2,132,199,0.25)] transition-all duration-300 hover:border-sky-400/70 hover:shadow-[0_15px_50px_rgba(2,132,199,0.35)] text-white">
      {/* Background ambient lighting effects */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* AD SPONSOR TAG RIBBON */}
      <div className="relative z-10 px-6 pt-4 pb-2 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold tracking-wider uppercase">
        <div className="flex items-center gap-2">
          <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-black flex items-center gap-1 shadow-sm">
            <Flame className="w-3 h-3 text-red-600 fill-red-600 animate-pulse" />
            ANNONCE OFFICIELLE
          </span>
          <span className="text-sky-300 font-semibold hidden sm:inline">
            • BOURSE D'EXCELLENCE CEMAC / CEEAC
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-emerald-300 font-extrabold">CANDIDATURES OUVERTES</span>
          <span className="text-slate-500">• IDLA & WorldQuant</span>
        </div>
      </div>

      {/* BANNER CORE CONTENT */}
      <div className="relative z-10 p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Interactive Flyer Thumbnail */}
        <div className="lg:col-span-4 flex flex-col items-center sm:items-start">
          <div 
            onClick={onViewModal}
            className="relative cursor-pointer group/img overflow-hidden rounded-2xl border-2 border-sky-400/40 shadow-xl bg-slate-950 transition-all duration-300 transform group-hover:scale-[1.02]"
          >
            <img
              src="/flyer_bourse_mscfe_2027.webp"
              alt="Flyer Officiel Bourse MScFE 2027"
              className="w-full h-auto max-h-[220px] object-cover"
            />
            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center p-3 text-center">
              <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/30 text-white">
                <Maximize2 className="w-3.5 h-3.5" />
                Agrandir le Flyer
              </span>
            </div>
            <div className="absolute top-2 left-2 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow">
              Bourse 100%
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2 text-[11px] font-bold">
            <button
              onClick={onViewModal}
              className="text-sky-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <FileText className="w-3 h-3" />
              <span>Aperçu HD</span>
            </button>
            <span className="text-slate-600">•</span>
            <a
              href="/Flyer_Bourse_MScFE_2027.pdf"
              download="IDLA_Flyer_Bourse_MScFE_2027.pdf"
              className="text-slate-300 hover:text-white transition-colors flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span>Télécharger PDF</span>
            </a>
          </div>
        </div>

        {/* Center / Right: Promotional Pitch and High-Converting Actions */}
        <div className="lg:col-span-8 space-y-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Master of Science in Financial Engineering (MScFE)
            </div>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight">
              Bourse d'Excellence Internationale : <span className="text-amber-300">100% Prise en Charge</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Bénéficiez d'une bourse complète d'une valeur de <strong className="text-emerald-400 font-bold">$38 612 USD</strong> pour la prestigieuse formation WorldQuant University & IDLA. Énergie solaire & connexion fibre optique Cisco 24/7 au campus de Yaoundé.
            </p>
          </div>

          {/* Quick value badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-bold">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              100% Frais de scolarité offerts
            </span>
            <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
              Cohorte Janvier 2027
            </span>
            <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-purple-400" />
              Diplôme US / International
            </span>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <button
              onClick={onApply}
              className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-600 hover:from-emerald-400 hover:to-sky-500 text-white font-black text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>{t('mscfe_ad_apply_now')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </button>

            <button
              onClick={onViewModal}
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-3 rounded-xl border border-white/15 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-sky-300" />
              <span>{t('mscfe_flyer_view')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 2. TOP STICKY ANNOUNCEMENT BANNER
 */
export const MScFETopBarBanner: React.FC<{
  onApply: () => void;
  onViewModal: () => void;
  onDismiss: () => void;
  t: (key: any) => string;
}> = ({ onApply, onViewModal, onDismiss, t }) => {
  return (
    <aside aria-label="Bourse d'Excellence MScFE" className="bg-gradient-to-r from-sky-700 via-blue-700 to-indigo-800 text-white py-2 px-3 sm:px-6 shadow-md border-b border-sky-400/30 sticky top-[60px] z-40 backdrop-blur-md bg-opacity-95">
      <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider bg-amber-400 text-slate-950 shadow-sm shrink-0 animate-pulse">
            <Flame className="w-3 h-3 text-red-600 fill-red-600" />
            {t('mscfe_ad_banner_badge')}
          </span>
          <p className="font-bold text-white text-xs sm:text-[13px] leading-tight truncate sm:whitespace-normal">
            <span className="text-sky-200 hidden md:inline">Master Ingénierie Financière (MScFE) : </span>
            <span className="font-extrabold text-amber-300">{t('mscfe_ad_banner_highlight')}</span>
            <span className="text-white/80 hidden lg:inline"> — {t('mscfe_ad_banner_subtitle')}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onApply}
            className="bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold px-3.5 py-1.5 rounded-xl transition-all shadow-sm hover:shadow text-xs flex items-center gap-1.5 cursor-pointer hover:scale-105"
          >
            <span>{t('nav_apply')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onViewModal}
            className="bg-white/15 hover:bg-white/25 text-white font-bold px-3 py-1.5 rounded-xl transition-all text-xs flex items-center gap-1 cursor-pointer border border-white/20"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('mscfe_flyer_view')}</span>
            <span className="sm:hidden">Flyer</span>
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

/**
 * 3. FLOATING STICKY AD BANNER (Corner / Bottom Dock Widget)
 * Floats on the bottom-right of the screen across all tabs, ensuring maximum visibility
 * exactly like a sponsored web ad banner with minimize and expand controls.
 */
export const MScFEFloatingAdWidget: React.FC<{
  onApply: () => void;
  onViewModal: () => void;
  t: (key: any) => string;
}> = ({ onApply, onViewModal, t }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-5 right-5 z-40 animate-bounce">
        <button
          onClick={() => setIsMinimized(false)}
          className="group flex items-center gap-2 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 text-white px-4 py-2.5 rounded-full shadow-2xl border-2 border-sky-400/50 hover:scale-105 transition-all cursor-pointer"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
          </span>
          <span className="text-xs font-black tracking-tight">🎓 Bourse MScFE (100%)</span>
          <ChevronUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 max-w-[360px] sm:max-w-[400px] w-full animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-[#031d36] text-white border-2 border-sky-400/50 shadow-[0_12px_45px_rgba(2,132,199,0.4)] p-4 space-y-3">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header bar */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 text-[10px] font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5 text-amber-300">
            <Flame className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />
            <span>ANNONCE BOURSE • JANV. 2027</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
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

        {/* Content body with flyer thumbnail */}
        <div className="flex items-center gap-3">
          <div 
            onClick={onViewModal}
            className="w-20 h-24 shrink-0 rounded-xl overflow-hidden border border-sky-400/40 shadow cursor-pointer group/thumb relative"
          >
            <img
              src="/flyer_bourse_mscfe_2027.webp"
              alt="Flyer MScFE"
              className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
              <Maximize2 className="w-3 h-3 text-white" />
            </div>
          </div>

          <div className="space-y-1 flex-1 min-w-0">
            <h4 className="text-xs sm:text-sm font-black text-white leading-tight">
              Bourse 100% MScFE
            </h4>
            <p className="text-[11px] text-emerald-400 font-extrabold leading-tight">
              $38 612 USD pris en charge
            </p>
            <p className="text-[10px] text-slate-300 leading-snug line-clamp-2">
              Master en Ingénierie Financière • WorldQuant University & IDLA.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onApply}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xs py-2 px-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Postuler</span>
            <ArrowRight className="w-3 h-3" />
          </button>
          <button
            onClick={onViewModal}
            className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs py-2 px-3 rounded-xl border border-white/15 transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <FileText className="w-3 h-3 text-sky-300" />
            <span>Flyer</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * 4. INTERSTITIAL POP-UP ANNOUNCEMENT MODAL ("Message Pop-up")
 */
export const MScFEAdModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  onDownloadPolicy?: (lang: 'fr' | 'en') => void;
  dontShowAgain: boolean;
  setDontShowAgain: (val: boolean) => void;
  t: (key: any) => string;
}> = ({
  isOpen,
  onClose,
  onApply,
  onDownloadPolicy,
  dontShowAgain,
  setDontShowAgain,
  t,
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
          title={t('mscfe_ad_close')}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header Badge */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md">
            <Flame className="w-3.5 h-3.5 text-red-600 fill-red-600 animate-bounce" />
            {t('mscfe_ad_modal_tag')}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {t('mscfe_ad_banner_highlight')}
          </span>
        </div>

        {/* Main Grid: Flyer on left, Content on right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left: Flyer Image card */}
          <div className="md:col-span-5 flex flex-col items-center gap-3">
            <div className="relative group overflow-hidden rounded-2xl border-2 border-sky-400/40 shadow-2xl bg-slate-950 transition-all transform hover:scale-[1.01]">
              <img
                src="/flyer_bourse_mscfe_2027.webp"
                alt="Affiche Officielle Bourse MScFE 2027"
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
              <span>{t('mscfe_flyer_download')}</span>
            </a>
          </div>

          {/* Right: Pitch & Actions */}
          <div className="md:col-span-7 space-y-4">
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                {t('mscfe_ad_modal_title')}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-sky-200 mt-1">
                Master in Financial Engineering (MScFE) • IDLA & WorldQuant University
              </p>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              {t('mscfe_ad_modal_desc')}
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
                <div className="text-[10px] font-bold text-sky-300 uppercase">Campus Yaoundé</div>
                <div className="text-xs sm:text-sm font-black text-white">Solaire 24/7 & Fibre Cisco</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={onApply}
                className="w-full group bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-600 hover:from-emerald-400 hover:to-sky-500 text-white font-black text-sm sm:text-base py-3.5 px-6 rounded-2xl transition-all shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 flex items-center justify-center gap-2.5 cursor-pointer hover:scale-[1.01]"
              >
                <FileText className="w-5 h-5" />
                <span>{t('mscfe_ad_apply_now')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </button>

              {onDownloadPolicy && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => onDownloadPolicy('fr')}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold text-xs py-2.5 px-3 rounded-xl border border-white/15 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-300" />
                    <span>{t('mscfe_policy_btn_fr')}</span>
                  </button>
                  <button
                    onClick={() => onDownloadPolicy('en')}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold text-xs py-2.5 px-3 rounded-xl border border-white/15 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-300" />
                    <span>{t('mscfe_policy_btn_en')}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Dismiss controls */}
            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/10">
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="rounded border-slate-700 text-brand-primary focus:ring-brand-primary"
                />
                <span>{t('mscfe_ad_dont_show_again')}</span>
              </label>
              <button
                onClick={onClose}
                className="hover:text-white underline cursor-pointer"
              >
                {t('mscfe_ad_close')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
