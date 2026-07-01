import { useState } from 'react';
import { Sparkles, Eye, Code, ChevronDown, ChevronUp, Layers, HelpCircle } from 'lucide-react';
import { ActiveTab } from '../App';

interface DemoToolbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  setCandidateLoggedIn: (status: boolean) => void;
  setAdminLoggedIn: (status: boolean) => void;
}

export default function DemoToolbar({ activeTab, setActiveTab, setCandidateLoggedIn, setAdminLoggedIn }: DemoToolbarProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const tabs: { label: string; tab: ActiveTab; group: string; setup?: () => void }[] = [
    { label: 'Accueil Public', tab: 'home', group: 'Visiteur' },
    { label: 'Programmes', tab: 'programmes', group: 'Visiteur' },
    { label: 'Actualités', tab: 'actualites', group: 'Visiteur' },
    { label: 'Témoignages', tab: 'temoignages', group: 'Visiteur' },
    
    { label: 'Formulaire Candidature', tab: 'candidature', group: 'Admissions' },
    { label: 'Confirmation Soumission', tab: 'success', group: 'Admissions' },
    
    { 
      label: 'Connexion Candidat', 
      tab: 'candidate-login', 
      group: 'Espace Candidat',
      setup: () => setCandidateLoggedIn(false)
    },
    { 
      label: 'Dashboard Candidat (Jean Dupont)', 
      tab: 'candidate-dashboard', 
      group: 'Espace Candidat',
      setup: () => setCandidateLoggedIn(true)
    },
    
    { 
      label: 'Connexion Admin', 
      tab: 'admin-login', 
      group: 'Espace Admin (CMS)',
      setup: () => setAdminLoggedIn(false)
    },
    { 
      label: 'Dashboard Admin', 
      tab: 'admin-dashboard', 
      group: 'Espace Admin (CMS)',
      setup: () => setAdminLoggedIn(true)
    },
    { 
      label: 'Gestion Utilisateurs', 
      tab: 'admin-users', 
      group: 'Espace Admin (CMS)',
      setup: () => setAdminLoggedIn(true)
    }
  ];

  const handleTabClick = (t: typeof tabs[0]) => {
    if (t.setup) t.setup();
    setActiveTab(t.tab);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] max-w-full px-4">
      <div className="bg-[#00020e]/95 backdrop-blur border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 w-[900px] max-w-[95vw]">
        
        {/* Toolbar Header / Toggle bar */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between px-6 py-3 cursor-pointer select-none border-b border-white/10 hover:bg-white/5"
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6ffbbe] animate-pulse"></span>
            <span className="font-mono text-xs font-bold text-[#6ffbbe] tracking-wider uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Panneau de Navigation Interactive • IDLA CMS Demo
            </span>
          </div>
          <div className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-xs font-semibold">
            <span>{isExpanded ? 'Masquer' : 'Afficher les Écrans'}</span>
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        </div>

        {/* Shortcuts grid */}
        {isExpanded && (
          <div className="p-4 bg-[#11131c]/50 grid grid-cols-1 md:grid-cols-4 gap-4 max-h-[300px] overflow-y-auto">
            {['Visiteur', 'Admissions', 'Espace Candidat', 'Espace Admin (CMS)'].map((group) => (
              <div key={group} className="space-y-2">
                <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest border-b border-white/5 pb-1">
                  {group}
                </h4>
                <div className="space-y-1">
                  {tabs
                    .filter((t) => t.group === group)
                    .map((t) => {
                      const isActive = activeTab === t.tab;
                      return (
                        <button
                          key={t.tab}
                          onClick={() => handleTabClick(t)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                            isActive
                              ? 'bg-[#006c49] text-white font-bold'
                              : 'text-white/60 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span className="truncate">{t.label}</span>
                          {isActive && <Eye className="w-3.5 h-3.5 text-[#6ffbbe] shrink-0" />}
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
