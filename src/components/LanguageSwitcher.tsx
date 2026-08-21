import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'en' : 'fr');
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`p-2 rounded-xl bg-bg-primary hover:bg-border-primary/60 text-text-primary transition-all flex items-center gap-1.5 text-xs font-black cursor-pointer border border-border-primary/60 shadow-xs ${className}`}
      title={language === 'fr' ? 'Switch to English (EN)' : 'Passer en Français (FR)'}
    >
      <span className="text-base leading-none">{language === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
      <span className="font-extrabold uppercase text-[11px]">{language === 'fr' ? 'FR' : 'EN'}</span>
    </button>
  );
}
