import React, { useState, useEffect } from 'react';
import {
  LockIcon,
  MailIcon,
  ArrowLeftIcon,
  BellIcon,
  SparklesIcon,
  XIcon,
  XCircleIcon,
} from './Icons';
import { Program, NewsArticle, Testimonial, User, PreRegistration, ActivityLog, Donation, Campaign } from '../types';
import { account, databases, APPWRITE_CONFIG, isAppwriteDbConfigured, ID } from '../lib/appwrite';

import AdminDashboard from './admin/AdminDashboard';
import UsersManagement from './admin/UsersManagement';
import AddUser from './admin/AddUser';
import ProgramsManagement from './admin/ProgramsManagement';
import TestimonialsManagement from './admin/TestimonialsManagement';
import NewsManagement from './admin/NewsManagement';
import PreRegistrations from './admin/PreRegistrations';
import Donations from './admin/Donations';
import Marketing from './admin/Marketing';
import CmsSettings from './admin/CmsSettings';

type AdminTab =
  | 'admin-login' | 'admin-dashboard' | 'admin-users' | 'admin-add-user' | 'admin-programmes'
  | 'admin-testimonials' | 'admin-news' | 'admin-preregistrations' | 'admin-donations' | 'admin-marketing'
  | 'admin-settings';

interface AdminPortalProps {
  activeTab: AdminTab;
  setActiveTab: (tab: any) => void;
  isLoggedIn: boolean;
  onLoginSuccess: () => void;
  programs: Program[];
  setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
  news: NewsArticle[];
  setNews: React.Dispatch<React.SetStateAction<NewsArticle[]>>;
  testimonials: Testimonial[];
  setTestimonials: React.Dispatch<React.SetStateAction<Testimonial[]>>;
  pendingTestimonials: Testimonial[];
  setPendingTestimonials: React.Dispatch<React.SetStateAction<Testimonial[]>>;
  donations: Donation[];
  setDonations: React.Dispatch<React.SetStateAction<Donation[]>>;
}

const DEMO_ADMIN = { email: 'admin@idla.edu', password: 'admin123' };

export default function AdminPortal({
  activeTab,
  setActiveTab,
  isLoggedIn,
  onLoginSuccess,
  programs,
  setPrograms,
  news,
  setNews,
  testimonials,
  setTestimonials,
  pendingTestimonials,
  setPendingTestimonials,
  donations,
  setDonations,
}: AdminPortalProps) {
  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // CMS database records states (Initialized to empty arrays as requested - no MockData fallbacks)
  const [usersList, setUsersList] = useState<User[]>([]);
  const [preRegistrations, setPreRegistrations] = useState<PreRegistration[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Notifications bell dropdown
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastSeenLogCount, setLastSeenLogCount] = useState(0);

  // Pre-registrations selected ID
  const [selectedPreRegId, setSelectedPreRegId] = useState<string | null>(null);

  // Marketing campaigns state
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  // CMS Settings States
  const [settingsName, setSettingsName] = useState('Jean-Sébastien Dupont');
  const [settingsEmail, setSettingsEmail] = useState('js.dupont@idla.edu');
  const [settingsSiteName, setSettingsSiteName] = useState('IDLA CMS');
  const [settingsAdmissionsOpen, setSettingsAdmissionsOpen] = useState(true);
  const [settingsEmailNotif, setSettingsEmailNotif] = useState(true);

  // Activity logger helper
  const logActivity = async (type: 'registration' | 'article' | 'error' | 'alumni', user: string, text: string) => {
    const newLog: ActivityLog = {
      id: Math.random().toString(),
      type,
      user,
      text,
      time: "À l'instant",
    };
    setActivityLogs((curr) => [newLog, ...curr]);

    if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.logs) {
      try {
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.logs,
          ID.unique(),
          {
            type,
            user,
            text,
            time: "À l'instant",
          }
        );
      } catch (err) {
        console.error("Impossible de sauvegarder le log d'activité sur Appwrite:", err);
      }
    }
  };

  // Fetch Appwrite Data on Login
  useEffect(() => {
    const fetchData = async () => {
      if (!isAppwriteDbConfigured()) {
        console.warn("Appwrite DB n'est pas configurée.");
        return;
      }
      try {
        if (APPWRITE_CONFIG.collections.cmsUsers) {
          const usersRes = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.cmsUsers
          );
          if (usersRes.documents.length > 0) {
            setUsersList(
              usersRes.documents.map((doc: any) => ({
                id: doc.$id,
                name: doc.name,
                email: doc.email,
                role: doc.role,
                status: doc.status,
                lastLogin: doc.lastLogin ? new Date(doc.lastLogin).toLocaleString('fr-FR') : 'Jamais',
                initials: doc.initials || doc.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
                avatar: doc.avatar,
              }))
            );
          }
        }

        const appsRes = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.applications
        );
        if (appsRes.documents.length > 0) {
          setPreRegistrations(
            appsRes.documents.map((doc: any) => ({
              id: doc.$id,
              name: doc.name,
              email: doc.email,
              program: doc.program,
              dateApplied: doc.dateApplied || 'Récemment',
              status: doc.status || 'New',
              initials: doc.initials || doc.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
            }))
          );
        }

        if (APPWRITE_CONFIG.collections.logs) {
          const logsRes = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.logs
          );
          if (logsRes.documents.length > 0) {
            setActivityLogs(
              logsRes.documents.map((doc: any) => ({
                id: doc.$id,
                type: doc.type,
                user: doc.user,
                text: doc.text,
                time: doc.time || "À l'instant",
              }))
            );
          }
        }
      } catch (err) {
        console.warn("Échec du chargement de la base de données Appwrite.", err);
      }
    };

    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const matchesLocalFallback = email === DEMO_ADMIN.email && password === DEMO_ADMIN.password;

    if (!isAppwriteDbConfigured()) {
      setLoginError("La base de données Appwrite n'est pas configurée.");
      return;
    }

    setIsLoading(true);
    try {
      await account.deleteSession({ sessionId: 'current' }).catch(() => undefined);
      await account.createEmailPasswordSession({ email, password });
      onLoginSuccess();
    } catch (err: any) {
      console.warn('Connexion Appwrite refusée.', err);
      if (err.type === 'project_paused' || err.code === 403) {
        setLoginError('Le serveur de base de données est actuellement suspendu pour inactivité. Veuillez le restaurer depuis la console Appwrite.');
      } else {
        setLoginError('Identifiants incorrects ou serveur de base de données inaccessible.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (
    name: string,
    email: string,
    role: User['role'],
    status: User['status']
  ) => {
    const names = name.split(' ');
    const initials = names.map((n) => n[0]).join('').toUpperCase().slice(0, 2);

    const newUser: User = {
      id: Math.floor(1000 + Math.random() * 9000).toString(),
      name,
      email,
      role,
      status,
      lastLogin: "À l'instant",
      initials: initials || 'UN',
    };

    setUsersList((curr) => [newUser, ...curr]);

    if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.cmsUsers) {
      try {
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.cmsUsers,
          newUser.id,
          {
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            status: newUser.status,
            initials: newUser.initials,
            lastLogin: new Date().toISOString(),
          }
        );
      } catch (err) {
        console.error("Échec de la création de l'utilisateur sur Appwrite:", err);
      }
    }

    logActivity('registration', 'Super Admin', `a créé l'utilisateur CMS : ${name} (${role}).`);
  };

  const handleDeleteUser = async (id: string) => {
    const targetUser = usersList.find((u) => u.id === id);
    setUsersList((curr) => curr.filter((u) => u.id !== id));

    if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.cmsUsers) {
      try {
        await databases.deleteDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.cmsUsers, id);
      } catch (err) {
        console.error("Échec de la suppression de l'utilisateur sur Appwrite:", err);
      }
    }

    if (targetUser) {
      logActivity('error', 'Super Admin', `a supprimé l'utilisateur CMS : ${targetUser.name}.`);
    }
  };

  // LOGIN SCREEN VIEW
  if (!isLoggedIn) {
    return (
      <div className="bg-bg-primary min-h-screen flex items-center justify-center py-12 px-6 relative overflow-hidden text-text-primary">
        {/* Particle/Grid lines Simulation overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        </div>

        <div className="max-w-md w-full bg-bg-secondary rounded-2xl border border-border-primary p-8 shadow-2xl relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <button
              onClick={() => setActiveTab('home')}
              className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-brand-primary transition-colors mb-4 border border-border-primary px-3 py-1 rounded cursor-pointer"
            >
              <ArrowLeftIcon className="w-3 h-3" />
              Retour au site public
            </button>
            <div className="w-12 h-12 bg-brand-light text-brand-primary rounded-xl flex items-center justify-center mx-auto border border-brand-primary/20">
              <SparklesIcon className="w-6 h-6" size={24} />
            </div>
            <h1 className="font-sans font-bold text-2xl text-text-primary tracking-tight">Accès Sécurisé CMS</h1>
            <p className="text-text-secondary text-xs">Identifiez-vous pour accéder à la console d'administration</p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-700 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
              <XCircleIcon className="w-4 h-4 text-red-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Compte Administrateur</label>
              <div className="relative">
                <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/50 w-4 h-4" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Adresse email professionnelle"
                  className="w-full bg-bg-primary border border-border-primary rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-primary outline-none text-text-primary font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Clé de sécurité</label>
              <div className="relative">
                <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/50 w-4 h-4" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-bg-primary border border-border-primary rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-primary outline-none text-text-primary"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-primary hover:bg-brand-hover text-white py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
            >
              {isLoading ? 'Authentification...' : 'Valider les privilèges'}
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-[11px] text-text-secondary">
              Accès réservé au personnel autorisé de l'IDLA.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // LOGGED IN MODULE VIEWS
  const view = activeTab === 'admin-login' ? 'admin-dashboard' : activeTab;
  const unreadCount = Math.max(0, activityLogs.length - lastSeenLogCount);
  const toggleNotifications = () => {
    setShowNotifications((open) => {
      const next = !open;
      if (next) setLastSeenLogCount(activityLogs.length);
      return next;
    });
  };

  return (
    <div className="bg-bg-primary min-h-screen text-text-primary py-8 px-6 md:px-10">
      {/* Top action header */}
      <header className="flex justify-between items-center pb-6 border-b border-border-primary/30 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-text-primary uppercase tracking-wide">IDLA CMS Académique</h2>
          <p className="text-xs text-text-secondary mt-1">Gouvernance du Portail d'Admissions et de Contenus</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={toggleNotifications}
              className="p-2 text-text-secondary hover:text-text-primary bg-bg-secondary rounded-lg border border-border-primary relative cursor-pointer"
              title="Notifications"
            >
              <BellIcon className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <div className="absolute right-0 mt-2 w-80 bg-bg-secondary rounded-xl border border-border-primary shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border-primary/40 bg-bg-primary">
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Notifications</h4>
                    <button onClick={() => setShowNotifications(false)} className="text-text-secondary hover:text-text-primary cursor-pointer">
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-border-primary/20">
                    {activityLogs.length === 0 && (
                      <p className="px-4 py-6 text-center text-xs text-text-secondary italic">Aucune notification.</p>
                    )}
                    {activityLogs.map((log) => (
                      <div key={log.id} className="px-4 py-3 hover:bg-bg-primary flex gap-3">
                        <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                          log.type === 'error' ? 'bg-rose-500'
                          : log.type === 'registration' ? 'bg-emerald-500'
                          : log.type === 'alumni' ? 'bg-indigo-500' : 'bg-amber-500'
                        }`} />
                        <div className="text-xs leading-relaxed">
                          <span className="font-bold text-text-primary">{log.user}</span>{' '}
                          <span className="text-text-secondary">{log.text}</span>
                          <div className="text-[10px] text-text-secondary mt-0.5">{log.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-light text-brand-primary flex items-center justify-center font-bold text-xs border border-brand-primary/20">
              {settingsName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'AD'}
            </div>
            <div>
              <p className="text-xs font-bold leading-none text-text-primary">{settingsName || 'Administrateur'}</p>
              <p className="text-[10px] text-brand-primary font-semibold mt-0.5">Super Admin</p>
            </div>
          </div>
        </div>
      </header>

      {/* MODULAR VIEWS ROUTER */}
      {view === 'admin-dashboard' && (
        <AdminDashboard
          preRegistrations={preRegistrations}
          activityLogs={activityLogs}
          setSelectedPreRegId={setSelectedPreRegId}
          setActiveTab={setActiveTab}
        />
      )}

      {view === 'admin-users' && (
        <UsersManagement
          usersList={usersList}
          setUsersList={setUsersList}
          handleDeleteUser={handleDeleteUser}
          setActiveTab={setActiveTab}
          logActivity={logActivity}
        />
      )}

      {view === 'admin-add-user' && (
        <AddUser
          onCreateUser={handleCreateUser}
          setActiveTab={setActiveTab}
        />
      )}

      {view === 'admin-programmes' && (
        <ProgramsManagement
          programs={programs}
          setPrograms={setPrograms}
          logActivity={logActivity}
        />
      )}

      {view === 'admin-testimonials' && (
        <TestimonialsManagement
          testimonials={testimonials}
          setTestimonials={setTestimonials}
          pendingTestimonials={pendingTestimonials}
          setPendingTestimonials={setPendingTestimonials}
          logActivity={logActivity}
        />
      )}

      {view === 'admin-news' && (
        <NewsManagement
          news={news}
          setNews={setNews}
          logActivity={logActivity}
        />
      )}

      {view === 'admin-preregistrations' && (
        <PreRegistrations
          preRegistrations={preRegistrations}
          setPreRegistrations={setPreRegistrations}
          selectedPreRegId={selectedPreRegId}
          setSelectedPreRegId={setSelectedPreRegId}
          logActivity={logActivity}
        />
      )}

      {view === 'admin-donations' && (
        <Donations
          donations={donations}
          setDonations={setDonations}
          logActivity={logActivity}
        />
      )}

      {view === 'admin-marketing' && (
        <Marketing
          campaigns={campaigns}
          setCampaigns={setCampaigns}
          logActivity={logActivity}
        />
      )}

      {view === 'admin-settings' && (
        <CmsSettings
          settingsName={settingsName}
          setSettingsName={setSettingsName}
          settingsEmail={settingsEmail}
          setSettingsEmail={setSettingsEmail}
          settingsSiteName={settingsSiteName}
          setSettingsSiteName={setSettingsSiteName}
          settingsAdmissionsOpen={settingsAdmissionsOpen}
          setSettingsAdmissionsOpen={setSettingsAdmissionsOpen}
          settingsEmailNotif={settingsEmailNotif}
          setSettingsEmailNotif={setSettingsEmailNotif}
          logActivity={logActivity}
        />
      )}
    </div>
  );
}
