import { useState, useEffect } from 'react';
import Header from './components/Header';
import AdminSidebar from './components/AdminSidebar';
import PublicPortal from './components/PublicPortal';
import ApplicationForm from './components/ApplicationForm';
import ApplicationSuccess from './components/ApplicationSuccess';
import StudentPortal from './components/StudentPortal';
import PasswordReset from './components/PasswordReset';
import AdminPortal from './components/AdminPortal';
import { Program, NewsArticle, Testimonial, Donation } from './types';
import { account, databases, APPWRITE_CONFIG, isAppwriteDbConfigured, Query } from './lib/appwrite';

export type ActiveTab =
  | 'home'
  | 'programmes'
  | 'actualites'
  | 'temoignages'
  | 'candidature'
  | 'success'
  | 'student-login'
  | 'student-dashboard'
  | 'student-programs'
  | 'student-catalog'
  | 'student-profile'
  | 'student-settings'
  | 'password-reset'
  | 'admin-login'
  | 'admin-dashboard'
  | 'admin-users'
  | 'admin-add-user'
  | 'admin-programmes'
  | 'admin-testimonials'
  | 'admin-news'
  | 'admin-preregistrations'
  | 'admin-donations'
  | 'admin-marketing'
  | 'admin-settings';

export type Role = 'guest' | 'student' | 'admin';

const PUBLIC_TABS: ActiveTab[] = ['home', 'programmes', 'actualites', 'temoignages'];
const STUDENT_TABS: ActiveTab[] = [
  'student-login', 'student-dashboard', 'student-programs', 'student-catalog',
  'student-profile', 'student-settings',
];
const ADMIN_TABS: ActiveTab[] = [
  'admin-login', 'admin-dashboard', 'admin-users', 'admin-add-user', 'admin-programmes',
  'admin-testimonials', 'admin-news', 'admin-preregistrations', 'admin-donations', 'admin-marketing',
  'admin-settings',
];
const TAB_TO_PATH: Record<ActiveTab, string> = {
  home: '/',
  programmes: '/programmes',
  actualites: '/actualites',
  temoignages: '/temoignages',
  candidature: '/candidature',
  success: '/candidature/confirmation',
  'student-login': '/etudiant',
  'student-dashboard': '/etudiant/tableau-de-bord',
  'student-programs': '/etudiant/programmes',
  'student-catalog': '/etudiant/catalogue',
  'student-profile': '/etudiant/profil',
  'student-settings': '/etudiant/parametres',
  'password-reset': '/reinitialisation',
  'admin-login': '/admin',
  'admin-dashboard': '/admin/tableau-de-bord',
  'admin-users': '/admin/utilisateurs',
  'admin-add-user': '/admin/utilisateurs/nouveau',
  'admin-programmes': '/admin/programmes',
  'admin-testimonials': '/admin/temoignages',
  'admin-news': '/admin/actualites',
  'admin-preregistrations': '/admin/pre-inscriptions',
  'admin-donations': '/admin/dons',
  'admin-marketing': '/admin/marketing',
  'admin-settings': '/admin/parametres',
};

const tabFromPath = (pathname: string): ActiveTab => {
  const pathOnly = pathname.split('?')[0].split('#')[0];
  const clean = pathOnly.replace(/\/+$/, '') || '/';

  // Routes étudiants protégées → home si accès direct sans session
  const protectedPrefixes = ['/etudiant', '/candidat'];
  if (protectedPrefixes.some((prefix) => clean.startsWith(prefix))) {
    return 'home';
  }

  if (clean === '/candidat' || clean === '/candidat/dossier' || clean === '/candidat/programmes') {
    return 'student-login';
  }

  const found = Object.entries(TAB_TO_PATH).find(([_, path]) => {
    const cleanPath = path.replace(/\/+$/, '') || '/';
    return cleanPath === clean;
  });

  return found ? (found[0] as ActiveTab) : 'home';
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>(() =>
    typeof window !== 'undefined' ? tabFromPath(window.location.pathname) : 'home'
  );
  const [role, setRole] = useState<Role>('guest');
  const [isSessionChecking, setIsSessionChecking] = useState(true);

  // Check active session on mount
  useEffect(() => {
    const checkSession = async () => {
      if (!isAppwriteDbConfigured()) {
        setIsSessionChecking(false);
        return;
      }
      try {
        const user = await account.get();
        if (user) {
          const userEmail = user.email.toLowerCase().trim();
          let isCmsAdmin = false;

          // Check if user is in cmsUsers collection (Admin)
          if (APPWRITE_CONFIG.collections.cmsUsers) {
            try {
              const res = await databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.cmsUsers,
                [Query.equal('email', userEmail)]
              );
              if (res.documents.length > 0) {
                isCmsAdmin = true;
              }
            } catch (err) {
              console.warn("Erreur lors de la vérification de l'accès CMS :", err);
            }
          }

          if (isCmsAdmin) {
            setRole('admin');
            if (activeTab === 'admin-login') {
              setActiveTab('admin-dashboard');
            }
          } else {
            setRole('student');
            if (activeTab === 'student-login') {
              setActiveTab('student-dashboard');
            }
          }
        }
      } catch (err) {
        console.log("Aucune session active détectée.");
      } finally {
        setIsSessionChecking(false);
      }
    };
    checkSession();
  }, []);

  // Theme management (Dark / Light)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return 'dark'; // Default to dark theme
    }
    return 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Synchronise URL with current view
  useEffect(() => {
    const target = TAB_TO_PATH[activeTab];
    const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
    const cleanTarget = target.replace(/\/+$/, '') || '/';
    
    if (currentPath !== cleanTarget) {
      window.history.pushState({ tab: activeTab }, '', target);
    }
  }, [activeTab]);

  // Back/Forward browser navigation support
  useEffect(() => {
    const onPopState = () => setActiveTab(tabFromPath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Listen to window focus to detect session shifts (e.g. logging into a different account in another tab)
  useEffect(() => {
    const handleFocus = async () => {
      if (!isAppwriteDbConfigured()) return;
      try {
        const user = await account.get();
        if (user) {
          const userEmail = user.email.toLowerCase().trim();
          const storedEmail = sessionStorage.getItem('idla_portal_session_email');
          
          if (storedEmail && storedEmail.toLowerCase().trim() !== userEmail) {
            // Session was hijacked/changed in another tab!
            console.warn("Session change detected. Logging out tab.");
            sessionStorage.removeItem('idla_portal_session_email');
            setRole('guest');
            setActiveTab('home');
            clearAppwriteSession();
          }
        } else {
          // Cookie session is gone!
          const storedEmail = sessionStorage.getItem('idla_portal_session_email');
          if (storedEmail) {
            sessionStorage.removeItem('idla_portal_session_email');
            setRole('guest');
            setActiveTab('home');
          }
        }
      } catch (err) {
        // Session might be expired/deleted
        const storedEmail = sessionStorage.getItem('idla_portal_session_email');
        if (storedEmail) {
          sessionStorage.removeItem('idla_portal_session_email');
          setRole('guest');
          setActiveTab('home');
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [role, activeTab]);

  // Database Real Records States (Removed default MockData initialization)
  const [programs, setPrograms] = useState<Program[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [pendingTestimonials, setPendingTestimonials] = useState<Testimonial[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);

  // Candidate identity from ApplicationForm
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidateTempPassword, setCandidateTempPassword] = useState('');

  // Fetch data directly from Appwrite (Strict Database, no silent mock fallback)
  useEffect(() => {
    if (!isAppwriteDbConfigured()) {
      setDbError("Configuration Appwrite manquante. Veuillez renseigner le fichier .env.");
      return;
    }

    const loadPublicContent = async () => {
      try {
        setDbError(null);

        // Fetch Programs
        if (APPWRITE_CONFIG.collections.programs) {
          const res = await databases.listDocuments(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.programs);
          if (res.documents.length > 0) {
            setPrograms(
              res.documents.map((doc: any) => ({
                id: doc.$id,
                title: doc.title,
                description: doc.description,
                type: doc.type,
                category: doc.category,
                duration: doc.duration,
                image: doc.image,
                isNew: doc.isNew,
              }))
            );
          }
        }

        // Fetch News
        if (APPWRITE_CONFIG.collections.news) {
          const res = await databases.listDocuments(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.news);
          if (res.documents.length > 0) {
            setNews(
              res.documents.map((doc: any) => ({
                id: doc.$id,
                title: doc.title,
                description: doc.description,
                date: new Date(doc.date).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                }),
                category: doc.category,
                image: doc.image,
                isFeatured: doc.isFeatured,
              }))
            );
          }
        }

        // Fetch Testimonials
        if (APPWRITE_CONFIG.collections.testimonials) {
          const res = await databases.listDocuments(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.testimonials);
          if (res.documents.length > 0) {
            setTestimonials(
              res.documents.map((doc: any) => ({
                id: doc.$id,
                name: doc.name,
                role: doc.role,
                text: doc.text,
                image: doc.image,
                promo: doc.promo,
                category: doc.category,
                isFeatured: doc.isFeatured,
              }))
            );
          }
        }
      } catch (err: any) {
        console.error("Impossible d'accéder au serveur Appwrite:", err);
        if (err.type === 'project_paused' || err.code === 403) {
          setDbError(
            "Le projet Appwrite est suspendu pour inactivité. Veuillez restaurer le projet depuis la console Appwrite Cloud (https://cloud.appwrite.io) pour réactiver la base de données."
          );
        } else {
          setDbError("Erreur de connexion à la base de données Appwrite. Vérifiez votre configuration réseau.");
        }
      }
    };

    loadPublicContent();
  }, []);

  const clearAppwriteSession = () => {
    account.deleteSession({ sessionId: 'current' }).catch(() => {});
  };

  const handleApplicationSuccess = (name: string, email: string, tempPass?: string) => {
    setCandidateName(name);
    setCandidateEmail(email);
    setCandidateTempPassword(tempPass || '');
    setActiveTab('success');
  };

  const handleApplyToProgram = (programTitle?: string) => {
    setActiveTab('candidature');
  };

  const handleSubmitTestimonial = (t: Omit<Testimonial, 'id' | 'image'>) => {
    setPendingTestimonials((curr) => [
      {
        ...t,
        id: `pending-${Date.now()}`,
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=0d9488&color=fff`,
      },
      ...curr,
    ]);
  };

  const handleSubmitDonation = (d: Pick<Donation, 'donor' | 'email' | 'amount' | 'message'>) => {
    setDonations((curr) => [
      {
        ...d,
        id: `don-${Date.now()}`,
        date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
        status: 'Nouveau',
      },
      ...curr,
    ]);
  };

  const handleLogout = () => {
    clearAppwriteSession();
    sessionStorage.removeItem('idla_portal_session_email');
    setRole('guest');
    setActiveTab('home');
  };

  const openStudentArea = () => {
    if (role === 'student') {
      setActiveTab('student-dashboard');
      return;
    }
    if (role === 'admin') {
      clearAppwriteSession();
      sessionStorage.removeItem('idla_portal_session_email');
    }
    setRole('guest');
    setActiveTab('student-login');
  };

  const openAdminArea = () => {
    if (role === 'admin') {
      setActiveTab('admin-dashboard');
      return;
    }
    clearAppwriteSession();
    sessionStorage.removeItem('idla_portal_session_email');
    setRole('guest');
    setActiveTab('admin-login');
  };

  const isDashboardLayout =
    (role === 'admin' && ADMIN_TABS.includes(activeTab)) ||
    (role === 'student' && STUDENT_TABS.includes(activeTab) && activeTab !== 'student-login');

  const showPublicHeader = role === 'guest';

  if (isSessionChecking) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen overflow-x-hidden bg-bg-primary text-text-primary`}>


      {/* Public Header with Theme Controls */}
      {showPublicHeader && (
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onSignUpClick={() => setActiveTab('candidature')}
          onStudentLoginClick={openStudentArea}
          onAdminLoginClick={openAdminArea}
          theme={theme}
          setTheme={setTheme}
        />
      )}

      {/* Persistent Sidebar for Authenticated Portals */}
      {isDashboardLayout && (
        <AdminSidebar
          role={role}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          theme={theme}
          setTheme={setTheme}
        />
      )}

      <main className={`transition-all duration-300 w-full ${isDashboardLayout ? 'lg:pl-[280px]' : ''}`}>
        {/* PUBLIC WEBPAGE PORTAL */}
        {PUBLIC_TABS.includes(activeTab) && (
          <PublicPortal
            activeTab={activeTab as any}
            setActiveTab={setActiveTab}
            onApplyNow={handleApplyToProgram}
            programs={programs}
            news={news}
            testimonials={testimonials}
            onSubmitTestimonial={handleSubmitTestimonial}
            onSubmitDonation={handleSubmitDonation}
          />
        )}

        {/* APPLICATION STEPPER FORM */}
        {activeTab === 'candidature' && (
          <ApplicationForm
            onSuccess={handleApplicationSuccess}
            onBackToHome={() => {
              if (role === 'student') {
                setActiveTab('student-programs');
              } else {
                setActiveTab('home');
              }
            }}
          />
        )}

        {/* SUBMISSION SUCCESS CONFIRMATION */}
        {activeTab === 'success' && (
          <ApplicationSuccess
            candidateName={candidateName}
            tempPassword={candidateTempPassword}
            onGoToCandidatePortal={async () => {
              // Re-créer la session Appwrite avec les identifiants temporaires
              // pour que StudentPortal puisse charger les candidatures
              if (candidateEmail && candidateTempPassword) {
                try {
                  await account.deleteSession({ sessionId: 'current' }).catch(() => undefined);
                  await account.createEmailPasswordSession({
                    email: candidateEmail.trim().toLowerCase(),
                    password: candidateTempPassword,
                  });
                  sessionStorage.setItem('idla_portal_session_email', candidateEmail.trim().toLowerCase());
                } catch (err) {
                  console.warn('Auto-login après soumission échoué:', err);
                }
              }
              setRole('student');
              setActiveTab('student-dashboard');
            }}
            onBackToHome={() => setActiveTab('home')}
          />
        )}

        {/* MOT DE PASSE OUBLIÉ — PAGE DE RÉINITIALISATION */}
        {activeTab === 'password-reset' && (
          <PasswordReset
            onBackToHome={() => setActiveTab('home')}
            onGoToLogin={() => setActiveTab('student-login')}
          />
        )}

        {/* STUDENT LEARNING PORTAL */}
        {STUDENT_TABS.includes(activeTab) && (
          <StudentPortal
            isLoggedIn={role === 'student'}
            knownEmail={candidateEmail}
            knownName={candidateName}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onLoginSuccess={() => {
              setRole('student');
              setActiveTab('student-dashboard');
            }}
            onBackToHome={() => setActiveTab('home')}
            programs={programs}
            onApplyNow={handleApplyToProgram}
          />
        )}

        {/* CMS ADMINISTRATION CONSOLE */}
        {ADMIN_TABS.includes(activeTab) && (
          <AdminPortal
            activeTab={activeTab as any}
            setActiveTab={setActiveTab}
            isLoggedIn={role === 'admin'}
            onLoginSuccess={() => setRole('admin')}
            programs={programs}
            setPrograms={setPrograms}
            news={news}
            setNews={setNews}
            testimonials={testimonials}
            setTestimonials={setTestimonials}
            pendingTestimonials={pendingTestimonials}
            setPendingTestimonials={setPendingTestimonials}
            donations={donations}
            setDonations={setDonations}
          />
        )}
      </main>
    </div>
  );
}
