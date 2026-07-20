import { useState, useEffect } from 'react';
import Header from './components/Header';
import AdminSidebar from './components/AdminSidebar';
import PublicPortal from './components/PublicPortal';
import ApplicationForm from './components/ApplicationForm';
import ApplicationSuccess from './components/ApplicationSuccess';
import StudentPortal from './components/StudentPortal';
import AdminPortal from './components/AdminPortal';
import TeacherPortal from './components/TeacherPortal';
import { Program, NewsArticle, Testimonial, Donation } from './types';
import { account, databases, APPWRITE_CONFIG, isAppwriteDbConfigured, Query, Permission, Role } from './lib/appwrite';

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
  | 'student-schedule'
  | 'student-catalog'
  | 'student-profile'
  | 'student-settings'
  | 'password-reset'
  | 'admin-login'
  | 'admin-dashboard'
  | 'admin-users'
  | 'admin-teachers'
  | 'admin-add-user'
  | 'admin-programmes'
  | 'admin-testimonials'
  | 'admin-news'
  | 'admin-preregistrations'
  | 'admin-donations'
  | 'admin-marketing'
  | 'admin-settings'
  | 'teacher-dashboard'
  | 'teacher-schedule'
  | 'teacher-students';

export type Role = 'guest' | 'student' | 'admin' | 'teacher';

const PUBLIC_TABS: ActiveTab[] = ['home', 'programmes', 'actualites', 'temoignages'];
const STUDENT_TABS: ActiveTab[] = [
  'student-login', 'student-dashboard', 'student-schedule', 'student-programs', 'student-catalog',
  'student-profile', 'student-settings',
];
const ADMIN_TABS: ActiveTab[] = [
  'admin-login', 'admin-dashboard', 'admin-users', 'admin-teachers', 'admin-add-user', 'admin-programmes',
  'admin-testimonials', 'admin-news', 'admin-preregistrations', 'admin-donations', 'admin-marketing',
  'admin-settings',
];
const TEACHER_TABS: ActiveTab[] = [
  'teacher-dashboard', 'teacher-schedule', 'teacher-students'
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
  'student-schedule': '/etudiant/emploi-du-temps',
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
  'admin-teachers': '/admin/enseignants',
  'teacher-dashboard': '/enseignant/tableau-de-bord',
  'teacher-schedule': '/enseignant/emploi-du-temps',
  'teacher-students': '/enseignant/etudiants',
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
          let userRole: Role = 'student';

          // Check if user is in cmsUsers collection (Admin or Teacher)
          if (APPWRITE_CONFIG.collections.cmsUsers) {
            try {
              const res = await databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.cmsUsers,
                [Query.equal('email', userEmail)]
              );
              if (res.documents.length > 0) {
                const docRole = res.documents[0].role;
                if (docRole === 'teacher') {
                  userRole = 'teacher';
                } else {
                  userRole = 'admin'; // Par défaut si cmsUsers, on considère admin
                }
              }
            } catch (err) {
              console.warn("Erreur lors de la vérification de l'accès CMS :", err);
            }
          }

          setRole(userRole);
          if (userRole === 'admin') {
            if (activeTab === 'admin-login') {
              setActiveTab('admin-dashboard');
            }
          } else if (userRole === 'teacher') {
            if (activeTab === 'admin-login' || activeTab === 'student-login') {
              setActiveTab('teacher-dashboard');
            }
          } else {
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
        // Ignorer silencieusement l'erreur pour ne pas déconnecter l'utilisateur
        // lorsqu'il change simplement d'onglet.
      }
    };
    
    // Le système de déconnexion automatique au changement d'onglet est désactivé
    // pour éviter les déconnexions intempestives liées à Appwrite.
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

  // Fetch data directly from Appwrite (Strict Database + Local backup sync)
  useEffect(() => {
    const loadPublicContent = async () => {
      let localPrograms: Program[] = [];
      try {
        const parsed = JSON.parse(localStorage.getItem('idla_local_programs') || '[]');
        let changed = false;
        localPrograms = parsed.map((p: any) => {
          if (p && p.id === 'unique') {
            changed = true;
            return { ...p, id: `prog-${Math.floor(100000 + Math.random() * 900000)}` };
          }
          return p;
        });
        if (changed) {
          localStorage.setItem('idla_local_programs', JSON.stringify(localPrograms));
        }
      } catch (e) {}

      if (!isAppwriteDbConfigured()) {
        setDbError("Configuration Appwrite manquante. Affichage des programmes en stockage local.");
        if (localPrograms.length > 0) setPrograms(localPrograms);
        return;
      }

      try {
        setDbError(null);

        // Fetch Programs
        if (APPWRITE_CONFIG.collections.programs) {
          const res = await databases.listDocuments(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.programs, [Query.limit(5000), Query.orderDesc('$createdAt')]);
          const remoteProgs = res.documents.map((doc: any) => ({
            id: doc.$id,
            title: doc.title,
            description: doc.description,
            type: doc.type,
            category: doc.category,
            duration: doc.duration,
            image: doc.image,
            isNew: doc.isNew,
          }));
          setPrograms(() => {
            let freshLocal: any[] = [];
            try {
              freshLocal = JSON.parse(localStorage.getItem('idla_local_programs') || '[]');
            } catch (e) {}

            const uniqueMap = new Map<string, any>();
            
            // Add remote programs first (database truth)
            for (const rp of remoteProgs) {
              if (rp && rp.title) {
                const titleKey = rp.title.toLowerCase().trim();
                if (!uniqueMap.has(titleKey)) {
                  uniqueMap.set(titleKey, rp);
                }
              }
            }
            
            // Merge in local programs if not already present by title
            for (const lp of freshLocal) {
              if (lp && lp.title) {
                const titleKey = lp.title.toLowerCase().trim();
                if (!uniqueMap.has(titleKey)) {
                  uniqueMap.set(titleKey, lp);
                }
              }
            }
            
            const finalPrograms = Array.from(uniqueMap.values()).sort((a, b) => a.title.localeCompare(b.title));
            try {
              localStorage.setItem('idla_local_programs', JSON.stringify(finalPrograms));
            } catch (e) {}
            return finalPrograms;
          });
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

        // Fetch News
        if (APPWRITE_CONFIG.collections.news) {
          const res = await databases.listDocuments(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.news, [Query.limit(5000), Query.orderDesc('$createdAt')]);
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
          const res = await databases.listDocuments(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.testimonials, [Query.limit(5000), Query.orderDesc('$createdAt')]);
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
        if (localPrograms.length > 0) setPrograms(localPrograms);
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

  // Synchronisation instantanée de la mémoire locale vers l'état global lors de toute navigation (Public & Etudiants)
  useEffect(() => {
    try {
      const localPrograms: Program[] = JSON.parse(localStorage.getItem('idla_local_programs') || '[]');
      if (localPrograms.length > 0) {
        setPrograms((curr) => {
          const combined = [...localPrograms, ...curr];
          const uniqueMap = new Map<string, Program>();
          combined.forEach((p) => {
            if (p && p.title) {
              const titleKey = p.title.toLowerCase().trim();
              if (!uniqueMap.has(titleKey)) {
                uniqueMap.set(titleKey, p);
              }
            }
          });
          return Array.from(uniqueMap.values());
        });
      }
    } catch (e) {}
  }, [activeTab, role]);

  // Background auto-sync of local programs to cloud when an admin session is active
  useEffect(() => {
    if (role === 'admin' && programs.length > 0 && isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.programs) {
      const syncPrograms = async () => {
        try {
          const res = await databases.listDocuments(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.programs);
          const remoteProgs = res.documents;
          let currentLocal: any[] = [];
          try {
            currentLocal = JSON.parse(localStorage.getItem('idla_local_programs') || '[]');
          } catch (e) {}

          for (const lp of currentLocal) {
            const existsInCloud = remoteProgs.some((cd: any) => cd.$id === lp.id || cd.title?.toLowerCase() === lp.title?.toLowerCase());
            if (!existsInCloud && lp.id && lp.title) {
              const safeCategory = ['Sciences', 'Management', 'Tech', 'Droit', 'Santé', 'Communication'].includes(lp.category)
                ? lp.category
                : 'Tech';
              await databases.createDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.programs,
                lp.id,
                {
                  title: lp.title,
                  description: lp.description || lp.title,
                  type: lp.type || 'Master',
                  category: safeCategory,
                  duration: lp.duration || '1 an',
                  image: lp.image || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
                  isNew: !!lp.isNew,
                },
                [Permission.read(Role.any()), Permission.update(Role.any()), Permission.delete(Role.any())]
              ).catch((e) => console.warn("Auto-sync local program vers cloud:", e));
            }
          }
        } catch (err) {
          console.warn("Erreur auto-sync dans App.tsx:", err);
        }
      };
      syncPrograms();
    }
  }, [role, programs]);

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
    (role === 'student' && STUDENT_TABS.includes(activeTab) && activeTab !== 'student-login') ||
    (role === 'teacher' && TEACHER_TABS.includes(activeTab));

  const showPublicHeader = PUBLIC_TABS.includes(activeTab);

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
          onLogoutClick={handleLogout}
          isLoggedIn={role !== 'guest'}
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
            programs={programs}
          />
        )}

        {/* SUBMISSION SUCCESS CONFIRMATION */}
        {activeTab === 'success' && (
          <ApplicationSuccess
            candidateName={candidateName}
            email={candidateEmail}
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
            onLoginSuccess={async () => {
              try {
                const user = await account.get();
                const userEmail = user.email.toLowerCase().trim();
                let userRole: Role = 'student';
                
                if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.cmsUsers) {
                  const res = await databases.listDocuments(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.collections.cmsUsers,
                    [Query.equal('email', userEmail)]
                  );
                  if (res.documents.length > 0) {
                    const docRole = res.documents[0].role;
                    if (docRole === 'teacher') userRole = 'teacher';
                    else userRole = 'admin';
                  }
                }
                
                setRole(userRole);
                if (userRole === 'teacher') setActiveTab('teacher-dashboard');
                else if (userRole === 'admin') setActiveTab('admin-dashboard');
                else setActiveTab('student-dashboard');
              } catch (err) {
                console.error("Erreur lors de la vérification du rôle de l'utilisateur :", err);
                // Si la requête échoue (ex: problème de permission Appwrite), on affiche une alerte en dev
                alert("La vérification du rôle a échoué. Regardez la console pour l'erreur.");
                setRole('student');
                setActiveTab('student-dashboard');
              }
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

        {/* TEACHER PORTAL */}
        {TEACHER_TABS.includes(activeTab) && (
          <TeacherPortal
            activeTab={activeTab as any}
            setActiveTab={setActiveTab}
            isLoggedIn={role === 'teacher'}
            programs={programs}
          />
        )}
      </main>
    </div>
  );
}
