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
  
  if (isCandidateDashboard) {
    // Custom sidebar for Candidate
    return (
      <aside className="bg-[#1a1d1f] text-[#006c49] fixed left-0 top-0 h-full w-[280px] border-r border-[#c6c6cf] flex flex-col py-6 z-50">
        <div className="px-6 mb-10">
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

        <nav className="flex-1 space-y-1">
          <button 
            onClick={() => setActiveTab('candidate-dashboard')}
            className={`w-full px-6 py-3 flex items-center gap-3 font-semibold text-sm transition-all text-left ${
              activeTab === 'candidate-dashboard' 
                ? 'bg-white/10 text-[#6ffbbe] border-l-4 border-[#6ffbbe]' 
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <button 
            className="w-full px-6 py-3 flex items-center gap-3 font-semibold text-sm transition-all text-left text-[#6ffbbe]/40 cursor-not-allowed"
            disabled
          >
            <UserCheck className="w-4 h-4" />
            <span>Ma Candidature</span>
          </button>
          <button 
            onClick={() => setActiveTab('programmes')}
            className="w-full px-6 py-3 flex items-center gap-3 font-semibold text-sm transition-all text-left text-white/60 hover:bg-white/5 hover:text-white"
          >
            <BookOpen className="w-4 h-4" />
            <span>Programmes</span>
          </button>
          <button 
            onClick={() => setActiveTab('actualites')}
            className="w-full px-6 py-3 flex items-center gap-3 font-semibold text-sm transition-all text-left text-white/60 hover:bg-white/5 hover:text-white"
          >
            <Newspaper className="w-4 h-4" />
            <span>Actualités</span>
          </button>
        </nav>

        <div className="mt-auto px-4 border-t border-white/10 pt-6 space-y-1">
          <button 
            className="w-full px-6 py-3 flex items-center gap-3 font-semibold text-sm text-white/60 hover:bg-white/5 hover:text-white transition-all text-left"
          >
            <Settings className="w-4 h-4" />
            <span>Paramètres</span>
          </button>
          <button 
            onClick={onLogout}
            className="w-full px-6 py-3 flex items-center gap-3 font-semibold text-sm text-white/60 hover:bg-white/5 hover:text-white transition-all text-left"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    );
  }

  // Admin CMS Sidebar
  const isAdminTab = ['admin-dashboard', 'admin-users', 'admin-add-user'].includes(activeTab);
  if (!isAdminTab) return null;

  return (
    <aside className="bg-[#1a1d1f] text-white fixed left-0 top-0 h-full w-[280px] border-r border-[#c6c6cf]/10 flex flex-col py-6 z-50">
      <div className="px-6 mb-8">
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

      <nav className="flex-1 space-y-1 overflow-y-auto">
        <button 
          onClick={() => setActiveTab('admin-dashboard')}
          className={`w-full px-6 py-3 flex items-center gap-3 font-semibold text-sm transition-all text-left ${
            activeTab === 'admin-dashboard' 
              ? 'bg-white/10 text-[#6ffbbe] border-l-4 border-[#6ffbbe]' 
              : 'text-white/60 hover:bg-white/5 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button 
          onClick={() => setActiveTab('admin-users')}
          className={`w-full px-6 py-3 flex items-center gap-3 font-semibold text-sm transition-all text-left ${
            activeTab === 'admin-users' || activeTab === 'admin-add-user'
              ? 'bg-white/10 text-[#6ffbbe] border-l-4 border-[#6ffbbe]' 
              : 'text-white/60 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Utilisateurs</span>
        </button>



        <button className="w-full px-6 py-3 flex items-center gap-3 font-semibold text-sm text-white/40 hover:bg-white/5 hover:text-white/80 transition-all text-left cursor-not-allowed" disabled>
          <BookOpen className="w-4 h-4" />
          <span>Programmes</span>
        </button>

        <button className="w-full px-6 py-3 flex items-center gap-3 font-semibold text-sm text-white/40 hover:bg-white/5 hover:text-white/80 transition-all text-left cursor-not-allowed" disabled>
          <Quote className="w-4 h-4" />
          <span>Témoignages</span>
        </button>

        <button className="w-full px-6 py-3 flex items-center gap-3 font-semibold text-sm text-white/40 hover:bg-white/5 hover:text-white/80 transition-all text-left cursor-not-allowed" disabled>
          <Newspaper className="w-4 h-4" />
          <span>Actualités</span>
        </button>

        <button className="w-full px-6 py-3 flex items-center gap-3 font-semibold text-sm text-white/40 hover:bg-white/5 hover:text-white/80 transition-all text-left cursor-not-allowed" disabled>
          <HeartHandshake className="w-4 h-4" />
          <span>Soutien & Dons</span>
        </button>

        <button className="w-full px-6 py-3 flex items-center gap-3 font-semibold text-sm text-white/40 hover:bg-white/5 hover:text-white/80 transition-all text-left cursor-not-allowed" disabled>
          <UserCheck className="w-4 h-4" />
          <span>Pré-inscriptions</span>
        </button>

        <button className="w-full px-6 py-3 flex items-center gap-3 font-semibold text-sm text-white/40 hover:bg-white/5 hover:text-white/80 transition-all text-left cursor-not-allowed" disabled>
          <Megaphone className="w-4 h-4" />
          <span>Marketer</span>
        </button>
      </nav>

      <div className="px-4 pt-4 border-t border-white/10 mt-auto space-y-1">
        <button className="w-full px-6 py-3 flex items-center gap-3 font-semibold text-sm text-white/60 hover:bg-white/5 hover:text-white transition-all text-left">
          <Settings className="w-4 h-4" />
          <span>Paramètres</span>
        </button>
        <button 
          onClick={onLogout}
          className="w-full px-6 py-3 flex items-center gap-3 font-semibold text-sm text-white/60 hover:bg-white/5 hover:text-white transition-all text-left"
        >
          <LogOut className="w-4 h-4 text-red-400" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
