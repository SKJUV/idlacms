import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Quote, 
  Newspaper, 
  HeartHandshake, 
  UserCheck, 
  Megaphone, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { ActiveTab } from '../App';

interface AdminSidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onLogout: () => void;
}

export default function AdminSidebar({ activeTab, setActiveTab, onLogout }: AdminSidebarProps) {
  const isCandidateDashboard = activeTab === 'candidate-dashboard';

  const sharedClasses = 'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all lg:w-full lg:px-6 lg:py-3 lg:gap-3 lg:text-left';

  if (isCandidateDashboard) {
    return (
      <aside className="w-full border-b border-[#c6c6cf]/10 bg-[#1a1d1f] text-[#006c49] lg:fixed lg:left-0 lg:top-0 lg:h-full lg:w-[280px] lg:border-r lg:border-b-0 lg:flex lg:flex-col lg:py-6 lg:z-50">
        <div className="px-4 py-4 lg:px-6 lg:mb-10 lg:py-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6ffbbe] flex items-center justify-center shadow-lg">
              <GraduationCap className="w-6 h-6 text-[#00020e]" />
            </div>
            <div>
              <h1 className="font-sans font-bold text-lg text-white leading-none">IDLA Admin</h1>
              <p className="text-white/60 text-[11px] uppercase tracking-wider mt-1">CMS Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:space-y-1 lg:overflow-y-auto lg:px-0 lg:pb-0">
          <button 
            onClick={() => setActiveTab('candidate-dashboard')}
            className={`${sharedClasses} whitespace-nowrap ${
              activeTab === 'candidate-dashboard' 
                ? 'bg-white/10 text-[#6ffbbe] lg:border-l-4 lg:border-[#6ffbbe]' 
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <button 
            className={`${sharedClasses} whitespace-nowrap text-[#6ffbbe]/40 cursor-not-allowed`}
            disabled
          >
            <UserCheck className="w-4 h-4" />
            <span>Ma Candidature</span>
          </button>
          <button 
            onClick={() => setActiveTab('programmes')}
            className={`${sharedClasses} whitespace-nowrap text-white/60 hover:bg-white/5 hover:text-white`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Programmes</span>
          </button>
          <button 
            onClick={() => setActiveTab('actualites')}
            className={`${sharedClasses} whitespace-nowrap text-white/60 hover:bg-white/5 hover:text-white`}
          >
            <Newspaper className="w-4 h-4" />
            <span>Actualités</span>
          </button>
        </nav>

        <div className="mt-0 flex flex-wrap gap-2 border-t border-white/10 p-3 lg:mt-auto lg:flex-col lg:px-4 lg:pt-6 lg:space-y-1">
          <button 
            className={`${sharedClasses} text-white/60 hover:bg-white/5 hover:text-white`}
          >
            <Settings className="w-4 h-4" />
            <span>Paramètres</span>
          </button>
          <button 
            onClick={onLogout}
            className={`${sharedClasses} text-white/60 hover:bg-white/5 hover:text-white`}
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    );
  }

  const isAdminTab = ['admin-dashboard', 'admin-users', 'admin-add-user'].includes(activeTab);
  if (!isAdminTab) return null;

  return (
    <aside className="w-full border-b border-[#c6c6cf]/10 bg-[#1a1d1f] text-white lg:fixed lg:left-0 lg:top-0 lg:h-full lg:w-[280px] lg:border-r lg:border-b-0 lg:flex lg:flex-col lg:py-6 lg:z-50">
      <div className="px-4 py-4 lg:px-6 lg:mb-8 lg:py-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#6ffbbe] flex items-center justify-center text-white shadow-lg">
            <GraduationCap className="w-6 h-6 text-[#00020e]" />
          </div>
          <div>
            <h1 className="font-sans font-bold text-lg text-white leading-none">IDLA Admin</h1>
            <p className="text-white/60 text-xs mt-1">CMS Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:space-y-1 lg:overflow-y-auto lg:px-0 lg:pb-0">
        <button 
          onClick={() => setActiveTab('admin-dashboard')}
          className={`${sharedClasses} whitespace-nowrap ${
            activeTab === 'admin-dashboard' 
              ? 'bg-white/10 text-[#6ffbbe] lg:border-l-4 lg:border-[#6ffbbe]' 
              : 'text-white/60 hover:bg-white/5 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button 
          onClick={() => setActiveTab('admin-users')}
          className={`${sharedClasses} whitespace-nowrap ${
            activeTab === 'admin-users' || activeTab === 'admin-add-user'
              ? 'bg-white/10 text-[#6ffbbe] lg:border-l-4 lg:border-[#6ffbbe]' 
              : 'text-white/60 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Utilisateurs</span>
        </button>

        <button 
          onClick={() => setActiveTab('admin-programmes')}
          className={`${sharedClasses} whitespace-nowrap ${
            activeTab === 'admin-programmes'
              ? 'bg-white/10 text-[#6ffbbe] lg:border-l-4 lg:border-[#6ffbbe]' 
              : 'text-white/60 hover:bg-white/5 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Programmes</span>
        </button>

        <button className={`${sharedClasses} whitespace-nowrap text-white/40 hover:bg-white/5 hover:text-white/80 cursor-not-allowed`} disabled>
          <Quote className="w-4 h-4" />
          <span>Témoignages</span>
        </button>

        <button className={`${sharedClasses} whitespace-nowrap text-white/40 hover:bg-white/5 hover:text-white/80 cursor-not-allowed`} disabled>
          <Newspaper className="w-4 h-4" />
          <span>Actualités</span>
        </button>

        <button className={`${sharedClasses} whitespace-nowrap text-white/40 hover:bg-white/5 hover:text-white/80 cursor-not-allowed`} disabled>
          <HeartHandshake className="w-4 h-4" />
          <span>Soutien & Dons</span>
        </button>

        <button className={`${sharedClasses} whitespace-nowrap text-white/40 hover:bg-white/5 hover:text-white/80 cursor-not-allowed`} disabled>
          <UserCheck className="w-4 h-4" />
          <span>Pré-inscriptions</span>
        </button>

        <button className={`${sharedClasses} whitespace-nowrap text-white/40 hover:bg-white/5 hover:text-white/80 cursor-not-allowed`} disabled>
          <Megaphone className="w-4 h-4" />
          <span>Marketer</span>
        </button>
      </nav>

      <div className="mt-0 flex flex-wrap gap-2 border-t border-white/10 p-3 lg:mt-auto lg:flex-col lg:px-4 lg:pt-4 lg:space-y-1">
        <button className={`${sharedClasses} text-white/60 hover:bg-white/5 hover:text-white`}>
          <Settings className="w-4 h-4" />
          <span>Paramètres</span>
        </button>
        <button 
          onClick={onLogout}
          className={`${sharedClasses} text-white/60 hover:bg-white/5 hover:text-white`}
        >
          <LogOut className="w-4 h-4 text-red-400" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
