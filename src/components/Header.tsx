import { useState } from 'react';
import { ActiveTab } from '../App';
import { MenuIcon, XIcon, SunIcon, MoonIcon, GraduationCapIcon } from './Icons';

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
  const isPublicTab = ['home', 'programmes', 'actualites', 'temoignages', 'candidature', 'success'].includes(activeTab);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!isPublicTab) return null;

  const navItems = [
    { key: 'home', label: 'Accueil' },
    { key: 'programmes', label: 'Programmes' },
    { key: 'actualites', label: 'Actualités' },
    { key: 'temoignages', label: 'Témoignages' },
  ] as const;

  return (
    <header className="bg-bg-secondary text-text-primary sticky top-0 left-0 w-full z-50 border-b border-border-primary shadow-sm backdrop-blur-md bg-opacity-80">
      <nav className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 md:px-12 w-full max-w-[1440px] mx-auto transition-all duration-200">
        <button
          onClick={() => {
            setActiveTab('home');
            setMobileMenuOpen(false);
          }}
          className="font-sans font-bold text-xl sm:text-2xl tracking-tight text-text-primary hover:opacity-80 transition-opacity flex items-center gap-2"
        >
          <img src="/logo.png" alt="IDLA Logo" className="w-8 h-8 object-contain" />
          IDLA
        </button>

        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key as ActiveTab)}
              className={`font-sans text-sm font-semibold pb-1 border-b-2 transition-all ${
                activeTab === item.key
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-text-secondary hover:text-brand-primary'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg bg-bg-primary hover:bg-border-primary text-text-secondary transition-colors"
            title={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
          >
            {theme === 'dark' ? (
              <SunIcon className="text-amber-500 animate-spin-slow" size={18} />
            ) : (
              <MoonIcon className="text-indigo-600" size={18} />
            )}
          </button>


          {isLoggedIn ? (
            <>
              <button
                onClick={() => {
                  onStudentLoginClick();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-brand-primary px-2 sm:px-3 py-1.5 transition-colors cursor-pointer"
              >
                <GraduationCapIcon className="w-4 h-4 text-brand-primary" />
                <span className="hidden sm:inline">Mon Espace</span>
              </button>
              <button
                onClick={() => {
                  onLogoutClick();
                  setMobileMenuOpen(false);
                }}
                className="bg-red-50 hover:bg-red-100 text-red-600 px-4 sm:px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-sm"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  onStudentLoginClick();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-brand-primary px-2 sm:px-3 py-1.5 transition-colors cursor-pointer"
              >
                <GraduationCapIcon className="w-4 h-4 text-brand-primary" />
                <span className="hidden sm:inline">Connexion</span>
              </button>
              <button
                onClick={() => {
                  onSignUpClick();
                  setMobileMenuOpen(false);
                }}
                className="bg-brand-primary hover:bg-brand-hover text-white px-4 sm:px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-sm"
              >
                Je m'inscris
              </button>
            </>
          )}
          <button
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border-primary text-text-secondary hover:bg-bg-primary md:hidden"
            aria-label="Ouvrir le menu"
          >
            {mobileMenuOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="w-full border-t border-border-primary pt-3 md:hidden">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    setActiveTab(item.key as ActiveTab);
                    setMobileMenuOpen(false);
                  }}
                  className={`rounded-lg px-3 py-2 text-left text-sm font-semibold transition-all ${
                    activeTab === item.key
                      ? 'bg-brand-light text-brand-primary'
                      : 'text-text-secondary hover:bg-bg-primary'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <div className="flex items-center justify-between border-t border-border-primary pt-2 mt-2 px-3">
                {isLoggedIn ? (
                  <>
                    <button
                      onClick={() => {
                        onStudentLoginClick();
                        setMobileMenuOpen(false);
                      }}
                      className="text-xs font-bold text-text-secondary hover:text-brand-primary flex items-center gap-1.5 py-1.5 cursor-pointer"
                    >
                      <GraduationCapIcon className="w-4 h-4 text-brand-primary" />
                      Mon Espace
                    </button>
                    <button
                      onClick={() => {
                        onLogoutClick();
                        setMobileMenuOpen(false);
                      }}
                      className="text-xs font-bold text-red-500 hover:text-red-700 py-1.5 cursor-pointer"
                    >
                      Déconnexion
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        onStudentLoginClick();
                        setMobileMenuOpen(false);
                      }}
                      className="text-xs font-bold text-text-secondary hover:text-brand-primary flex items-center gap-1.5 py-1.5 cursor-pointer"
                    >
                      <GraduationCapIcon className="w-4 h-4 text-brand-primary" />
                      Connexion
                    </button>
                    <button
                      onClick={() => {
                        onAdminLoginClick();
                        setMobileMenuOpen(false);
                      }}
                      className="text-[10px] text-text-secondary/40 hover:text-text-secondary py-1.5 cursor-pointer"
                    >
                      Admin
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
