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
import { account, databases, APPWRITE_CONFIG, isAppwriteDbConfigured, ID, Permission, Role, Query } from '../lib/appwrite';

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
import TeachersManagement from './admin/TeachersManagement';
import EmailAutomationSection from './admin/EmailAutomationSection';

type AdminTab =
  | 'admin-login' | 'admin-dashboard' | 'admin-users' | 'admin-add-user' | 'admin-programmes'
  | 'admin-testimonials' | 'admin-news' | 'admin-preregistrations' | 'admin-[#006c49]' | 'admin-donations' | 'admin-marketing'
  | 'admin-settings' | 'admin-teachers' | 'admin-profile' | 'admin-email-automation';

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
  const [settingsName, setSettingsName] = useState('Administrateur');
  const [settingsEmail, setSettingsEmail] = useState('');
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

  // Fetch Appwrite & Local Data on Login or Tab Change
  useEffect(() => {
    const fetchData = async () => {
      // 1. Charger immédiatement les inscriptions et programmes locaux depuis localStorage
      let localApps: any[] = [];
      let localPrograms: any[] = [];
      try {
        localApps = JSON.parse(localStorage.getItem('idla_local_applications') || '[]');
        localApps = localApps.filter((a: any) => {
          const name = (a.name || '').toLowerCase();
          return !['pre-1', 'pre-2', 'pre-3'].includes(a.id) && !name.includes('jean dupont') && !name.includes('jean-sebastien') && !name.includes('jean sebastien');
        });
        const parsedProgs = JSON.parse(localStorage.getItem('idla_local_programs') || '[]');
        let changed = false;
        localPrograms = parsedProgs.map((p: any) => {
          if (p && p.id === 'unique') {
            changed = true;
            return { ...p, id: `prog-${Math.floor(100000 + Math.random() * 900000)}` };
          }
          return p;
        });
        if (changed) {
          localStorage.setItem('idla_local_programs', JSON.stringify(localPrograms));
        }
      } catch (e) {
        console.warn("Erreur lecture localStorage:", e);
      }

      try {
        import('../lib/appwrite').then(async ({ account }) => {
          const user = await account.get();
          if (user) {
            setSettingsName(user.name || 'Administrateur');
            setSettingsEmail(user.email || '');
          }
        }).catch(() => {});
      } catch (e) {}

      if (!isAppwriteDbConfigured()) {
        console.warn("Appwrite DB n'est pas configurée. Affichage en stockage local/mémoire.");
        if (localApps.length > 0) setPreRegistrations(localApps);
        if (localPrograms.length > 0) setPrograms(localPrograms);
        return;
      }

      try {
        if (APPWRITE_CONFIG.collections.programs) {
          const progsRes = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.programs,
            [Query.limit(5000), Query.orderDesc('$createdAt')]
          );
          const remoteProgs = progsRes.documents.map((doc: any) => ({
            id: doc.$id,
            title: doc.title,
            description: doc.description,
            type: doc.type,
            category: doc.category,
            duration: doc.duration,
            image: doc.image,
            isNew: doc.isNew,
          }));
          let currentLocal: any[] = [];
          try { currentLocal = JSON.parse(localStorage.getItem('idla_local_programs') || '[]'); } catch (e) {}
          const uniqueMap = new Map<string, any>();
          // On garde les programmes locaux qui ont un ID commençant par 'prog-' et qui ne sont pas dans le cloud
          // (au cas où ils n'ont pas pu être synchronisés)
          for (const lp of currentLocal) {
            if (lp && lp.id) uniqueMap.set(lp.id, lp);
          }
          // On écrase avec les données plus récentes du Cloud
          for (const rp of remoteProgs) {
            if (rp && rp.id) uniqueMap.set(rp.id, rp);
          }
          const finalPrograms = Array.from(uniqueMap.values()).sort((a, b) => a.title.localeCompare(b.title));
          try { localStorage.setItem('idla_local_programs', JSON.stringify(finalPrograms)); } catch (e) {}
          // Sync complete
          setPrograms(finalPrograms);
        } else {
          setPrograms((curr) => {
            let freshLocal: any[] = [];
            try { freshLocal = JSON.parse(localStorage.getItem('idla_local_programs') || '[]'); } catch (e) {}
            const combined = [...freshLocal, ...curr];
            const uniqueMap = new Map<string, any>();
            combined.forEach((p) => {
              if (p && p.title) {
                const titleKey = p.title.toLowerCase().trim();
                if (!uniqueMap.has(titleKey)) uniqueMap.set(titleKey, p);
              }
            });
            return Array.from(uniqueMap.values());
          });
        }

        let adminEmails = new Set<string>();
        if (APPWRITE_CONFIG.collections.cmsUsers) {
          const usersRes = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.cmsUsers,
            [Query.limit(5000), Query.orderDesc('$createdAt')]
          );
          adminEmails = new Set(usersRes.documents.map((d: any) => (d.email || '').toLowerCase()));
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
          APPWRITE_CONFIG.collections.applications,
          [Query.limit(5000), Query.orderDesc('$createdAt')]
        );
        const remoteApps = appsRes.documents.map((doc: any) => ({
          id: doc.$id,
          name: doc.name,
          email: doc.email,
          program: doc.program,
          dateApplied: doc.dateApplied || 'Récemment',
          status: doc.status || 'New',
          initials: doc.initials || doc.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
          phone: doc.phone,
          nationality: doc.nationality,
          highestDegree: doc.highestDegree,
          graduationYear: doc.graduationYear,
          motivation: doc.motivation,
          documents: doc.files ? JSON.parse(doc.files).map((f: any) => f.name) : [],
        }));

        setPreRegistrations(() => {
          const uniqueMap = new Map<string, any>();
          for (const rApp of remoteApps) {
            if (rApp && rApp.id) {
              const email = (rApp.email || '').toLowerCase();
              const name = (rApp.name || '').toLowerCase();
              const isFake = ['pre-1', 'pre-2', 'pre-3'].includes(rApp.id) || name.includes('jean dupont') || name.includes('jean-sebastien') || name.includes('jean sebastien');
              if (!isFake && !adminEmails.has(email)) {
                uniqueMap.set(rApp.id, rApp);
              }
            }
          }
          
          const finalApps = Array.from(uniqueMap.values());
          try { localStorage.setItem('idla_local_applications', JSON.stringify(finalApps)); } catch (e) {}
          return finalApps;
        });

        if (APPWRITE_CONFIG.collections.logs) {
          const logsRes = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.logs,
            [Query.limit(5000), Query.orderDesc('$createdAt')]
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
        console.warn("Échec du chargement d'Appwrite DB. Utilisation du backup local.", err);
        if (localApps.length > 0) setPreRegistrations(localApps);
        if (localPrograms.length > 0) setPrograms(localPrograms);
      }
    };

    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn, activeTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');


    if (!isAppwriteDbConfigured()) {
      setLoginError("La base de données Appwrite n'est pas configurée.");
      return;
    }

    setIsLoading(true);
    try {
      await account.deleteSession({ sessionId: 'current' }).catch(() => undefined);
      await account.createEmailPasswordSession({ email, password });
      sessionStorage.setItem('idla_portal_session_email', email.trim().toLowerCase());
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
    <div className="bg-bg-primary min-h-screen text-text-primary py-6 px-4 sm:px-6 md:px-10">
      {/* Top action header */}
      <header className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 md:gap-0 pb-6 border-b border-border-primary/30 mb-8">
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

      {view === 'admin-teachers' && (
        <TeachersManagement
          programs={programs}
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
          usersList={usersList}
        />
      )}

      {view === 'admin-preregistrations' && (
        <PreRegistrations
          preRegistrations={preRegistrations}
          setPreRegistrations={setPreRegistrations}
          selectedPreRegId={selectedPreRegId}
          setSelectedPreRegId={setSelectedPreRegId}
          logActivity={logActivity}
          onNavigateTab={(tab) => setActiveTab(tab as any)}
        />
      )}

      {view === 'admin-donations' && (
        <Donations
          donations={donations}
          setDonations={setDonations}
          logActivity={logActivity}
        />
      )}

      {view === 'admin-email-automation' && (() => {
        const candidatesMap = preRegistrations.reduce((acc, curr) => {
          const key = (curr.email || '').trim().toLowerCase();
          if (!key) return acc;
          if (!acc[key]) {
            acc[key] = {
              email: curr.email,
              name: curr.name,
              initials: curr.initials,
              phone: curr.phone,
              nationality: curr.nationality,
              highestDegree: curr.highestDegree,
              graduationYear: curr.graduationYear,
              motivation: curr.motivation,
              documents: curr.documents || [],
              applications: [],
              courseApplications: [],
            };
          }
          acc[key].applications.push(curr);
          if (curr.program && curr.program !== 'Inscription seule') {
            acc[key].courseApplications.push(curr);
          }
          return acc;
        }, {} as Record<string, any>);

        const candidatesList = Object.values(candidatesMap).map((c: any) => ({
          ...c,
          isRegisteredOnly: c.courseApplications.length === 0,
        }));

        return <EmailAutomationSection candidates={candidatesList} />;
      })()}

      {view === 'admin-marketing' && (
        <Marketing
          campaigns={campaigns}
          setCampaigns={setCampaigns}
          logActivity={logActivity}
          programs={programs}
          usersList={usersList}
          preRegistrations={preRegistrations}
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

      {view === 'admin-profile' && (
        <div className="space-y-8 animate-fadeIn">
          <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-brand-light border border-brand-primary/30 flex items-center justify-center text-brand-primary font-bold text-3xl shrink-0">
                {settingsName.charAt(0) || 'A'}
              </div>
              <div className="space-y-1">
                <h1 className="font-sans font-bold text-2xl text-text-primary">{settingsName}</h1>
                <p className="text-sm text-text-secondary">{settingsEmail}</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-light text-brand-primary border border-brand-primary/20">
                    Administrateur Système IDLA
                  </span>
                  <span className="text-xs text-text-secondary">Statut: Actif</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('admin-settings')}
              className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow cursor-pointer"
            >
              Modifier les paramètres
            </button>
          </div>

          <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-text-primary border-b border-border-primary pb-3">
              Informations du Compte Admin
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-bg-primary border border-border-primary/50 space-y-1">
                <span className="text-text-secondary uppercase font-bold tracking-wider">Nom Administrateur</span>
                <p className="text-sm font-bold text-text-primary">{settingsName}</p>
              </div>
              <div className="p-4 rounded-xl bg-bg-primary border border-border-primary/50 space-y-1">
                <span className="text-text-secondary uppercase font-bold tracking-wider">Adresse E-mail Officielle</span>
                <p className="text-sm font-bold text-text-primary">{settingsEmail}</p>
              </div>
              <div className="p-4 rounded-xl bg-bg-primary border border-border-primary/50 space-y-1">
                <span className="text-text-secondary uppercase font-bold tracking-wider">Nom de la Plateforme</span>
                <p className="text-sm font-bold text-text-primary">{settingsSiteName}</p>
              </div>
              <div className="p-4 rounded-xl bg-bg-primary border border-border-primary/50 space-y-1">
                <span className="text-text-secondary uppercase font-bold tracking-wider">État des Inscriptions</span>
                <p className="text-sm font-bold text-emerald-600">{settingsAdmissionsOpen ? 'Ouvertes' : 'Fermées'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
