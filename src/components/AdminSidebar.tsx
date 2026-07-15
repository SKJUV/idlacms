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
import type { ComponentType } from 'react';
import { ActiveTab, Role } from '../App';

interface AdminSidebarProps {
  role: Role;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onLogout: () => void;
}

const sharedClasses =
  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all lg:w-full lg:px-6 lg:py-3 lg:gap-3 lg:text-left';

// Un lien de navigation dont les tabs actifs déclenchent la surbrillance.
interface NavLink {
  label: string;
  icon: ComponentType<{ className?: string }>;
  target: ActiveTab;
  activeOn: ActiveTab[];
}

export default function AdminSidebar({ role, activeTab, setActiveTab, onLogout }: AdminSidebarProps) {
  const candidateLinks: NavLink[] = [
    { label: 'Dashboard', icon: LayoutDashboard, target: 'candidate-dashboard', activeOn: ['candidate-dashboard'] },
    { label: 'Programmes', icon: BookOpen, target: 'programmes', activeOn: ['programmes'] },
    { label: 'Actualités', icon: Newspaper, target: 'actualites', activeOn: ['actualites'] },
  ];

  const adminLinks: NavLink[] = [
    { label: 'Dashboard', icon: LayoutDashboard, target: 'admin-dashboard', activeOn: ['admin-dashboard', 'admin-login'] },
    { label: 'Utilisateurs', icon: Users, target: 'admin-users', activeOn: ['admin-users', 'admin-add-user'] },
    { label: 'Programmes', icon: BookOpen, target: 'admin-programmes', activeOn: ['admin-programmes'] },
    { label: 'Témoignages', icon: Quote, target: 'admin-testimonials', activeOn: ['admin-testimonials'] },
    { label: 'Actualités', icon: Newspaper, target: 'admin-news', activeOn: ['admin-news'] },
    { label: 'Soutien & Dons', icon: HeartHandshake, target: 'admin-donations', activeOn: ['admin-donations'] },
    { label: 'Pré-inscriptions', icon: UserCheck, target: 'admin-preregistrations', activeOn: ['admin-preregistrations'] },
    { label: 'Marketer', icon: Megaphone, target: 'admin-marketing', activeOn: ['admin-marketing'] },
  ];

  const isCandidate = role === 'candidate';
  const links = isCandidate ? candidateLinks : adminLinks;
  const title = isCandidate ? 'Espace Candidat' : 'IDLA Admin';
  const subtitle = isCandidate ? 'Suivi de candidature' : 'CMS Portal';

  return (
    <aside className="w-full border-b border-[#c6c6cf]/10 bg-[#1a1d1f] text-white lg:fixed lg:left-0 lg:top-0 lg:h-full lg:w-[280px] lg:border-r lg:border-b-0 lg:flex lg:flex-col lg:py-6 lg:z-50">
      <div className="px-4 py-4 lg:px-6 lg:mb-8 lg:py-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#6ffbbe] flex items-center justify-center shadow-lg">
            <GraduationCap className="w-6 h-6 text-[#00020e]" />
          </div>
          <div>
            <h1 className="font-sans font-bold text-lg text-white leading-none">{title}</h1>
            <p className="text-white/60 text-[11px] uppercase tracking-wider mt-1">{subtitle}</p>
          </div>
        </div>
      </div>

      <nav className="flex overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:space-y-1 lg:overflow-y-auto lg:px-0 lg:pb-0">
        {links.map(({ label, icon: Icon, target, activeOn }) => {
          const isActive = activeOn.includes(activeTab);
          return (
            <button
              key={label}
              onClick={() => setActiveTab(target)}
              className={`${sharedClasses} whitespace-nowrap ${
                isActive
                  ? 'bg-white/10 text-[#6ffbbe] lg:border-l-4 lg:border-[#6ffbbe]'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-0 flex flex-wrap gap-2 border-t border-white/10 p-3 lg:mt-auto lg:flex-col lg:px-4 lg:pt-4 lg:space-y-1">
        {!isCandidate && (
          <button
            onClick={() => setActiveTab('admin-settings')}
            className={`${sharedClasses} ${
              activeTab === 'admin-settings'
                ? 'bg-white/10 text-[#6ffbbe] lg:border-l-4 lg:border-[#6ffbbe]'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Paramètres</span>
          </button>
        )}
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
