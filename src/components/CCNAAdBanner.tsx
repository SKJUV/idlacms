import React, { useEffect, useState } from 'react';
import { Network, ArrowRight, X, ChevronUp } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface CCNAFloatingAdWidgetProps {
  onApply: () => void;
  embedded?: boolean;
}

/**
 * Petit widget CCNA, même côté que l’ambassadeur (colonne gauche).
 */
export const CCNAFloatingAdWidget: React.FC<CCNAFloatingAdWidgetProps> = ({
  onApply,
  embedded = false,
}) => {
  const { t, language } = useLanguage();
  const [isMinimized, setIsMinimized] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const lang = language === 'en' ? 'en' : 'fr';
  const positionClass = embedded
    ? 'relative'
    : 'fixed bottom-16 left-2 sm:bottom-[4.75rem] sm:left-6';

  useEffect(() => {
    const collapseIfOther = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== 'ccna') {
        setIsMinimized(true);
      }
    };
    window.addEventListener('idla:expand-ad', collapseIfOther);
    return () => window.removeEventListener('idla:expand-ad', collapseIfOther);
  }, []);

  const expand = () => {
    setIsMinimized(false);
    window.dispatchEvent(new CustomEvent('idla:expand-ad', { detail: 'ccna' }));
  };

  if (isDismissed) return null;

  if (isMinimized) {
    return (
      <aside lang={lang} aria-label={t('ccna_ad_title')} className={`${positionClass} z-40 animate-fade-in`}>
        <button
          type="button"
          onClick={expand}
          className="group flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-blue-800 via-sky-700 to-indigo-800 text-white px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-full shadow-2xl border border-sky-300/50 hover:scale-105 transition-all cursor-pointer"
          title={t('ccna_ad_open')}
          aria-label={t('ccna_ad_open')}
        >
          <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
          </span>
          <span className="text-xs font-black tracking-tight">{t('ccna_ad_title')}</span>
          <ChevronUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" aria-hidden="true" />
        </button>
      </aside>
    );
  }

  return (
    <aside
      lang={lang}
      aria-label={t('ccna_ad_title')}
      className={`${positionClass} z-40 w-[min(46vw,168px)] sm:w-full sm:max-w-[210px] lg:max-w-[240px] animate-fade-in`}
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-[#071a3a] to-blue-950 text-white border border-sky-400/40 shadow-[0_12px_40px_rgba(37,99,235,0.28)] p-2 sm:p-3 space-y-1.5 sm:space-y-2.5 backdrop-blur-md">
        <div className="absolute -top-12 -left-12 w-28 h-28 bg-sky-500/20 rounded-full blur-xl pointer-events-none" aria-hidden="true" />

        <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-sky-300">
          <div className="flex items-center gap-1">
            <Network className="w-3 h-3 text-amber-400" aria-hidden="true" />
            <span className="uppercase tracking-wider font-extrabold text-[9.5px]">
              {t('ccna_ad_title')}
            </span>
          </div>
          <div className="flex items-center gap-0.5 text-slate-400">
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="p-1 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
              title={t('ccna_ad_minimize')}
              aria-label={t('ccna_ad_minimize')}
            >
              <span className="text-xs font-bold leading-none" aria-hidden="true">_</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-1 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
              title={t('ccna_ad_close')}
              aria-label={t('ccna_ad_close')}
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onApply}
          className="relative group w-full cursor-pointer overflow-hidden rounded-xl border border-sky-400/30 shadow-md bg-white transition-all duration-300 hover:scale-[1.02] p-0"
          title={t('ccna_ad_register')}
        >
          <img
            src="/flyer_ccna_idla.jpg"
            alt={t('ccna_ad_alt')}
            className="w-full h-auto object-cover max-h-[120px] sm:max-h-[220px] lg:max-h-[290px] object-top"
          />
        </button>

        <p className="hidden sm:block text-[11px] font-semibold leading-snug text-slate-100">
          {t('ccna_ad_tagline')}
        </p>

        <button
          type="button"
          onClick={onApply}
          className="w-full group bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-extrabold text-[11px] sm:text-xs py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-sky-500/25"
        >
          <span>{t('ccna_ad_cta')}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
};
