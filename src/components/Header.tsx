import { useState } from 'react';
import { ActiveTab } from '../App';
import { MenuIcon, XIcon, SunIcon, MoonIcon, GraduationCapIcon } from './Icons';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onSignUpClick: () => void;
  onStudentLoginClick: () => void;
  onAdminLoginClick: () => void;
  onLogoutClick: () => void;
  isLoggedIn: boolean;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export default function Header({
  activeTab,
  setActiveTab,
  onSignUpClick,
  onStudentLoginClick,
  onAdminLoginClick,
  onLogoutClick,
  isLoggedIn,
  theme,
  setTheme,
}: HeaderProps) {
  const { t } = useLanguage();
  const isPublicTab = ['home', 'programmes', 'actualites', 'temoignages', 'candidature', 'success'].includes(activeTab);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!isPublicTab) return null;

  const navItems = [
    { key: 'home', label: t('nav_home') },
    { key: 'programmes', label: t('nav_programs') },
    { key: 'actualites', label: t('nav_news') },
    { key: 'temoignages', label: t('nav_testimonials') },
  ] as const;

  return (
    <header className="bg-bg-secondary text-text-primary sticky top-0 left-0 w-full z-50 border-b border-border-primary shadow-sm backdrop-blur-md bg-opacity-95">
      <nav className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 md:px-8 py-2.5 sm:py-3 w-full max-w-[1440px] mx-auto transition-all duration-200">
        
        {/* LOGO & BRAND */}
        <button
          onClick={() => {
            setActiveTab('home');
            setMobileMenuOpen(false);
          }}
          className="hover:opacity-80 transition-opacity flex items-center gap-2 text-left shrink-0 cursor-pointer"
        >
          <img src="/logo.png" alt="IDLA Logo" className="w-9 h-9 sm:w-12 sm:h-12 object-contain drop-shadow-md shrink-0" />
          <div className="flex flex-col justify-center">
            <span className="font-sans font-black text-lg sm:text-2xl tracking-tight text-text-primary leading-none">IDLA</span>
            <span className="text-[9px] sm:text-[10px] font-bold text-brand-primary tracking-wider uppercase mt-0.5 hidden xl:block">
              International Distance Learning Academy
            </span>
          </div>
        </button>

        {/* DESKTOP NAVIGATION LINKS */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key as ActiveTab)}
              className={`font-sans text-sm font-semibold pb-1 border-b-2 transition-all cursor-pointer ${
                activeTab === item.key
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-text-secondary hover:text-brand-primary'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* RIGHT CONTROLS & ACTIONS */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Native Language Switcher FR / EN */}
          <LanguageSwitcher />

          {/* Theme Toggle Button */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl bg-bg-primary hover:bg-border-primary text-text-secondary transition-colors shrink-0 border border-border-primary/50 cursor-pointer"
            title={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
          >
            {theme === 'dark' ? (
              <SunIcon className="text-amber-500 animate-spin-slow" size={17} />
            ) : (
              <MoonIcon className="text-indigo-600" size={17} />
            )}
          </button>

          {/* Desktop/Tablet Student Area & CTA Buttons */}
          {isLoggedIn ? (
            <>
              <button
                onClick={() => {
                  onStudentLoginClick();
                  setMobileMenuOpen(false);
                }}
                className="hidden sm:flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-text-secondary hover:text-brand-primary px-2.5 py-1.5 transition-colors cursor-pointer shrink-0"
              >
                <GraduationCapIcon className="w-4 h-4 text-brand-primary" />
                <span className="hidden md:inline">{t('nav_student_space')}</span>
              </button>
              <button
                onClick={() => {
                  onLogoutClick();
                  setMobileMenuOpen(false);
                }}
                className="hidden sm:inline-flex bg-red-50 hover:bg-red-100 text-red-600 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer shrink-0"
              >
                {t('nav_logout')}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  onStudentLoginClick();
                  setMobileMenuOpen(false);
                }}
                className="hidden sm:flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-text-secondary hover:text-brand-primary px-2.5 py-1.5 transition-colors cursor-pointer shrink-0"
              >
                <GraduationCapIcon className="w-4 h-4 text-brand-primary" />
                <span className="hidden md:inline">{t('nav_login')}</span>
              </button>
              <button
                onClick={() => {
                  onSignUpClick();
                  setMobileMenuOpen(false);
                }}
                className="hidden sm:inline-flex bg-brand-primary hover:bg-brand-hover text-white px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer shrink-0"
              >
                {t('nav_apply')}
              </button>
            </>
          )}

          {/* 3-BARS HAMBURGER MENU BUTTON (ALWAYS VISIBLE & FRAMED ON MOBILE) */}
          <button
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-bg-primary border border-border-primary text-text-primary hover:bg-border-primary/50 transition-all md:hidden shrink-0 shadow-xs cursor-pointer"
            aria-label="Ouvrir le menu"
          >
            {mobileMenuOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>

        {/* MOBILE SLIDE-DOWN DRAWER MENU */}
        {mobileMenuOpen && (
          <div className="w-full border-t border-border-primary pt-3 pb-2 mt-2 md:hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-2">
              {/* Navigation Links */}
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    setActiveTab(item.key as ActiveTab);
                    setMobileMenuOpen(false);
                  }}
                  className={`rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === item.key
                      ? 'bg-brand-light text-brand-primary font-bold'
                      : 'text-text-secondary hover:bg-bg-primary hover:text-text-primary'
                  }`}
                >
                  {item.label}
                </button>
              ))}

              {/* Mobile CTA Primary Button */}
              {!isLoggedIn && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      onSignUpClick();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-brand-primary hover:bg-brand-hover text-white py-3 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{t('nav_apply')}</span>
                  </button>
                </div>
              )}

              {/* Mobile Account Actions Footer */}
              <div className="flex items-center justify-between border-t border-border-primary/60 pt-3 mt-1 px-2">
                {isLoggedIn ? (
                  <>
                    <button
                      onClick={() => {
                        onStudentLoginClick();
                        setMobileMenuOpen(false);
                      }}
                      className="text-xs font-bold text-text-primary hover:text-brand-primary flex items-center gap-1.5 py-1.5 cursor-pointer"
                    >
                      <GraduationCapIcon className="w-4 h-4 text-brand-primary" />
                      <span>{t('nav_student_space')}</span>
                    </button>
                    <button
                      onClick={() => {
                        onLogoutClick();
                        setMobileMenuOpen(false);
                      }}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 py-1.5 cursor-pointer bg-rose-50 dark:bg-rose-950/30 px-3 py-1.5 rounded-lg border border-rose-500/20"
                    >
                      {t('nav_logout')}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        onStudentLoginClick();
                        setMobileMenuOpen(false);
                      }}
                      className="text-xs font-bold text-text-primary hover:text-brand-primary flex items-center gap-1.5 py-1.5 cursor-pointer"
                    >
                      <GraduationCapIcon className="w-4 h-4 text-brand-primary" />
                      <span>{t('nav_login')}</span>
                    </button>
                    <button
                      onClick={() => {
                        onAdminLoginClick();
                        setMobileMenuOpen(false);
                      }}
                      className="text-[11px] font-semibold text-text-secondary/60 hover:text-text-primary py-1.5 cursor-pointer"
                    >
                      Administration →
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
