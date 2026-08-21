import React from 'react';
import { useLanguage, SupportedLanguage } from '../context/LanguageContext';

interface LanguageSwitcherProps {
  className?: string;
  compact?: boolean;
}

export default function LanguageSwitcher({ className = '', compact = false }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`inline-flex items-center bg-bg-primary/80 dark:bg-bg-secondary p-1 rounded-2xl border border-border-primary shadow-xs transition-all ${className}`}>
      <button
        type="button"
        onClick={() => setLanguage('fr')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
          language === 'fr'
            ? 'bg-brand-primary text-white shadow-md scale-105'
            : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary dark:hover:bg-bg-primary/60'
        }`}
        title="Passer en Français (FR)"
      >
        <span className="text-sm leading-none">🇫🇷</span>
        <span>FR</span>
      </button>

      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
          language === 'en'
            ? 'bg-brand-primary text-white shadow-md scale-105'
            : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary dark:hover:bg-bg-primary/60'
        }`}
        title="Switch to English (EN)"
      >
        <span className="text-sm leading-none">🇬🇧</span>
        <span>EN</span>
      </button>
    </div>
  );
}
