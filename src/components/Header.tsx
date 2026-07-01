import { Shield, LogIn } from 'lucide-react';
import { ActiveTab } from '../App';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onLoginClick: () => void;
  onSignUpClick: () => void;
}

export default function Header({ activeTab, setActiveTab, onLoginClick, onSignUpClick }: HeaderProps) {
  const isPublicTab = ['home', 'programmes', 'actualites', 'temoignages', 'candidature', 'success'].includes(activeTab);

  if (!isPublicTab) return null;

  return (
    <header className="bg-[#00020e] text-white sticky top-0 left-0 w-full z-50 shadow-md">
      <nav className="flex justify-between items-center px-6 md:px-12 py-4 w-full max-w-[1440px] mx-auto transition-all duration-200">
        <button 
          onClick={() => setActiveTab('home')} 
          className="font-sans font-bold text-2xl tracking-tight text-white hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <span className="w-8 h-8 rounded-lg bg-[#6ffbbe] text-[#00020e] flex items-center justify-center">
            🎓
          </span>
          IDLA CMS
        </button>

        <div className="hidden md:flex items-center gap-8">
          <button 
            onClick={() => setActiveTab('home')}
            className={`font-sans text-sm font-semibold pb-1 border-b-2 transition-all ${
              activeTab === 'home' ? 'border-[#6ffbbe] text-[#6ffbbe]' : 'border-transparent text-white/80 hover:text-[#6ffbbe]'
            }`}
          >
            Accueil
          </button>
          <button 
            onClick={() => setActiveTab('programmes')}
            className={`font-sans text-sm font-semibold pb-1 border-b-2 transition-all ${
              activeTab === 'programmes' ? 'border-[#6ffbbe] text-[#6ffbbe]' : 'border-transparent text-white/80 hover:text-[#6ffbbe]'
            }`}
          >
            Programmes
          </button>
          <button 
            onClick={() => setActiveTab('actualites')}
            className={`font-sans text-sm font-semibold pb-1 border-b-2 transition-all ${
              activeTab === 'actualites' ? 'border-[#6ffbbe] text-[#6ffbbe]' : 'border-transparent text-white/80 hover:text-[#6ffbbe]'
            }`}
          >
            Actualités
          </button>
          <button 
            onClick={() => setActiveTab('temoignages')}
            className={`font-sans text-sm font-semibold pb-1 border-b-2 transition-all ${
              activeTab === 'temoignages' ? 'border-[#6ffbbe] text-[#6ffbbe]' : 'border-transparent text-white/80 hover:text-[#6ffbbe]'
            }`}
          >
            Témoignages
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={onLoginClick}
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-white/80 hover:text-white px-3 py-1.5 transition-colors"
          >
            <LogIn className="w-4 h-4 text-[#6ffbbe]" />
            Connexion
          </button>
          <button 
            onClick={onSignUpClick}
            className="bg-[#006c49] hover:bg-[#6ffbbe] hover:text-[#00020e] text-white px-5 py-2 rounded-lg text-sm font-bold transition-all"
          >
            Je m'inscris
          </button>
        </div>
      </nav>
    </header>
  );
}
