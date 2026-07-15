import { useState } from 'react';
import { LogIn, Menu, ShieldCheck, X } from 'lucide-react';
import { ActiveTab } from '../App';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onLoginClick: () => void;
  onSignUpClick: () => void;
  onAdminLoginClick: () => void;
}

export default function Header({ activeTab, setActiveTab, onLoginClick, onSignUpClick, onAdminLoginClick }: HeaderProps) {
  const isPublicTab = ['home', 'programmes', 'actualites', 'temoignages', 'candidature', 'success'].includes(activeTab);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!isPublicTab) return null;

  const navItems = [
    { key: 'home', label: 'Accueil' },
    { key: 'programmes', label: 'Programmes' },
    { key: 'actualites', label: 'Actualités' },
    { key: 'temoignages', label: 'Témoignages' }
  ] as const;

  return (
    <header className="bg-[#00020e] text-white sticky top-0 left-0 w-full z-50 shadow-md">
      <nav className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 md:px-12 w-full max-w-[1440px] mx-auto transition-all duration-200">
        <button 
          onClick={() => {
            setActiveTab('home');
            setMobileMenuOpen(false);
          }} 
          className="font-sans font-bold text-xl sm:text-2xl tracking-tight text-white hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <span className="w-8 h-8 rounded-lg bg-[#6ffbbe] text-[#00020e] flex items-center justify-center">
            🎓
          </span>
          IDLA
        </button>

        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <button 
              key={item.key}
              onClick={() => setActiveTab(item.key as ActiveTab)}
              className={`font-sans text-sm font-semibold pb-1 border-b-2 transition-all ${
                activeTab === item.key ? 'border-[#6ffbbe] text-[#6ffbbe]' : 'border-transparent text-white/80 hover:text-[#6ffbbe]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onAdminLoginClick}
            title="Espace Administration"
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-white/40 hover:text-[#6ffbbe] px-2 py-1.5 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin
          </button>
          <button
            onClick={() => { onLoginClick(); setMobileMenuOpen(false); }}
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-white/80 hover:text-white px-3 py-1.5 transition-colors"
          >
            <LogIn className="w-4 h-4 text-[#6ffbbe]" />
            Connexion
          </button>
          <button
            onClick={() => { onSignUpClick(); setMobileMenuOpen(false); }}
            className="bg-[#006c49] hover:bg-[#6ffbbe] hover:text-[#00020e] text-white px-4 sm:px-5 py-2 rounded-lg text-sm font-bold transition-all"
          >
            Je m'inscris
          </button>
          <button
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white/80 hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Ouvrir le menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="w-full border-t border-white/10 pt-3 md:hidden">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    setActiveTab(item.key as ActiveTab);
                    setMobileMenuOpen(false);
                  }}
                  className={`rounded-lg px-3 py-2 text-left text-sm font-semibold transition-all ${
                    activeTab === item.key ? 'bg-white/10 text-[#6ffbbe]' : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => { onAdminLoginClick(); setMobileMenuOpen(false); }}
                className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-white/50 hover:bg-white/10 hover:text-white transition-all flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-[#6ffbbe]" />
                Espace Administration
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
