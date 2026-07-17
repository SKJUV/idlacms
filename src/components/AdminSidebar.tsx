import React from 'react';
import { ActiveTab, Role } from '../App';
import {
  TrendingUpIcon,
  UsersIcon,
  BookOpenIcon,
  QuoteIcon,
  NewspaperIcon,
  HeartHandshakeIcon,
  UserCheckIcon,
  MegaphoneIcon,
  SettingsIcon,
  LogOutIcon,
  GraduationCapIcon,
  SunIcon,
  MoonIcon,
  AwardIcon,
  UserIcon,
  SearchIcon,
} from './Icons';

interface AdminSidebarProps {
  role: Role;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const sharedClasses =
  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all lg:w-full lg:px-6 lg:py-3 lg:gap-3 lg:text-left cursor-pointer';

interface NavLink {
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  target: ActiveTab;
  activeOn: ActiveTab[];
}

export default function AdminSidebar({ role, activeTab, setActiveTab, onLogout, theme, setTheme }: AdminSidebarProps) {
  const studentLinks: NavLink[] = [
    { label: 'Tableau de bord', icon: TrendingUpIcon, target: 'student-dashboard', activeOn: ['student-dashboard'] },
    { label: 'Mes Programmes', icon: BookOpenIcon, target: 'student-programs', activeOn: ['student-programs'] },
    { label: 'Catalogue', icon: SearchIcon, target: 'student-catalog', activeOn: ['student-catalog'] },
    { label: 'Profil', icon: UserIcon, target: 'student-profile', activeOn: ['student-profile'] },
    { label: 'Paramètres', icon: SettingsIcon, target: 'student-settings', activeOn: ['student-settings'] },
  ];

  const adminLinks: NavLink[] = [
    { label: 'Dashboard', icon: TrendingUpIcon, target: 'admin-dashboard', activeOn: ['admin-dashboard', 'admin-login'] },
    { label: 'Utilisateurs', icon: UsersIcon, target: 'admin-users', activeOn: ['admin-users', 'admin-add-user'] },
    { label: 'Programmes', icon: BookOpenIcon, target: 'admin-programmes', activeOn: ['admin-programmes'] },
    { label: 'Témoignages', icon: QuoteIcon, target: 'admin-testimonials', activeOn: ['admin-testimonials'] },
    { label: 'Actualités', icon: NewspaperIcon, target: 'admin-news', activeOn: ['admin-news'] },
    { label: 'Soutien & Dons', icon: HeartHandshakeIcon, target: 'admin-donations', activeOn: ['admin-donations'] },
    { label: 'Inscrits & Candidatures', icon: UserCheckIcon, target: 'admin-preregistrations', activeOn: ['admin-preregistrations'] },
    { label: 'Marketing', icon: MegaphoneIcon, target: 'admin-marketing', activeOn: ['admin-marketing'] },
  ];

  const isStudent = role === 'student';
  const links = isStudent ? studentLinks : adminLinks;
  const title = isStudent ? 'Espace Étudiant' : 'IDLA Admin';
  const subtitle = isStudent ? 'Ma formation' : 'CMS Portal';

  return (
    <aside className="w-full border-b border-border-primary bg-bg-secondary text-text-primary lg:fixed lg:left-0 lg:top-0 lg:h-full lg:w-[280px] lg:border-r lg:border-b-0 lg:flex lg:flex-col lg:py-6 lg:z-50 shadow-sm">
      <div className="px-4 py-4 lg:px-6 lg:mb-8 lg:py-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-md">
            <img src="/logo.png" alt="IDLA Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-sans font-bold text-lg text-text-primary leading-none">{title}</h1>
            <p className="text-text-secondary text-[11px] uppercase tracking-wider mt-1">{subtitle}</p>
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
                  ? 'bg-brand-light text-brand-primary lg:border-l-4 lg:border-brand-primary'
                  : 'text-text-secondary hover:bg-bg-primary hover:text-text-primary'
              }`}
            >
              <Icon className="w-4 h-4" size={16} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-0 flex flex-wrap gap-2 border-t border-border-primary p-3 lg:mt-auto lg:flex-col lg:px-4 lg:pt-4 lg:space-y-1">
        {!isStudent && (
          <button
            onClick={() => setActiveTab('admin-settings')}
            className={`${sharedClasses} ${
              activeTab === 'admin-settings'
                ? 'bg-brand-light text-brand-primary lg:border-l-4 lg:border-brand-primary'
                : 'text-text-secondary hover:bg-bg-primary hover:text-text-primary'
            }`}
          >
            <SettingsIcon className="w-4 h-4" size={16} />
            <span>Paramètres</span>
          </button>
        )}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={`${sharedClasses} text-text-secondary hover:bg-bg-primary hover:text-text-primary`}
        >
          {theme === 'dark' ? (
            <SunIcon className="w-4 h-4 text-amber-500 animate-spin-slow" size={16} />
          ) : (
            <MoonIcon className="w-4 h-4 text-indigo-600" size={16} />
          )}
          <span>Thème : {theme === 'dark' ? 'Clair' : 'Sombre'}</span>
        </button>
        <button
          onClick={onLogout}
          className={`${sharedClasses} text-text-secondary hover:bg-bg-primary hover:text-text-primary`}
        >
          <LogOutIcon className="w-4 h-4 text-red-500" size={16} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
