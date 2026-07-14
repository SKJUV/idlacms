import { useState, useEffect } from 'react';
import Header from './components/Header';
import AdminSidebar from './components/AdminSidebar';
import PublicPortal from './components/PublicPortal';
import ApplicationForm from './components/ApplicationForm';
import ApplicationSuccess from './components/ApplicationSuccess';
import CandidatePortal from './components/CandidatePortal';
import AdminPortal from './components/AdminPortal';
import { Program, NewsArticle, Testimonial, Donation } from './types';
import { account, databases, APPWRITE_CONFIG, isAppwriteDbConfigured } from './lib/appwrite';

export type ActiveTab =
  | 'home'
  | 'programmes'
  | 'actualites'
  | 'temoignages'
  | 'candidature'
  | 'success'
  | 'candidate-login'
  | 'candidate-dashboard'
  | 'candidate-programmes'
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

export type Role = 'guest' | 'candidate' | 'admin';

const PUBLIC_TABS: ActiveTab[] = ['home', 'programmes', 'actualites', 'temoignages'];
const CANDIDATE_TABS: ActiveTab[] = ['candidate-login', 'candidate-dashboard', 'candidate-programmes'];
const ADMIN_TABS: ActiveTab[] = [
  'admin-login', 'admin-dashboard', 'admin-users', 'admin-add-user', 'admin-programmes',
  'admin-testimonials', 'admin-news', 'admin-preregistrations', 'admin-donations', 'admin-marketing',
  'admin-settings',
];
const CANDIDATE_BROWSE_TABS: ActiveTab[] = ['programmes', 'actualites'];

const TAB_TO_PATH: Record<ActiveTab, string> = {
  home: '/',
  programmes: '/programmes',
  actualites: '/actualites',
  temoignages: '/temoignages',
  candidature: '/candidature',
  success: '/candidature/confirmation',
  'candidate-login': '/candidat',
  'candidate-dashboard': '/candidat/dossier',
  'candidate-programmes': '/candidat/programmes',
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

const PATH_TO_TAB: Record<string, ActiveTab> = Object.entries(TAB_TO_PATH).reduce(
  (acc, [tab, path]) => {
    acc[path] = tab as ActiveTab;
    return acc;
  },
  {} as Record<string, ActiveTab>
);

const tabFromPath = (pathname: string): ActiveTab => {
  const clean = pathname.replace(/\/+$/, '') || '/';
  return PATH_TO_TAB[clean] ?? 'home';
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>(() =>
    typeof window !== 'undefined' ? tabFromPath(window.location.pathname) : 'home'
  );
  const [role, setRole] = useState<Role>('guest');

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
    if (window.location.pathname !== target) {
      window.history.pushState({ tab: activeTab }, '', target);
    }
  }, [activeTab]);

  // Back/Forward browser navigation support
  useEffect(() => {
    const onPopState = () => setActiveTab(tabFromPath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

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
  const [selectedProgram, setSelectedProgram] = useState('');

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

  const handleApplicationSuccess = (name: string, prog: string, email: string) => {
    setCandidateName(name);
    setSelectedProgram(prog);
    setCandidateEmail(email);
    setActiveTab('success');
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
    setRole('guest');
    setActiveTab('home');
  };

  const openCandidateArea = () => {
    if (role === 'candidate') {
      setActiveTab('candidate-dashboard');
      return;
    }
    if (role === 'admin') clearAppwriteSession();
    setRole('guest');
    setActiveTab('candidate-login');
  };

  const openAdminArea = () => {
    if (role === 'admin') {
      setActiveTab('admin-dashboard');
      return;
    }
    if (role === 'candidate') clearAppwriteSession();
    setRole('guest');
    setActiveTab('admin-login');
  };

  const isDashboardLayout =
    (role === 'admin' && ADMIN_TABS.includes(activeTab)) ||
    (role === 'candidate' && (activeTab === 'candidate-dashboard' || CANDIDATE_BROWSE_TABS.includes(activeTab)));

  const showPublicHeader = role === 'guest';

  return (
    <div className={`min-h-screen overflow-x-hidden bg-bg-primary text-text-primary`}>


      {/* Public Header with Theme Controls */}
      {showPublicHeader && (
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLoginClick={openCandidateArea}
          onSignUpClick={() => setActiveTab('candidature')}
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
            onApplyNow={() => setActiveTab('candidature')}
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
            onBackToHome={() => setActiveTab('home')}
            programs={programs}
          />
        )}

        {/* SUBMISSION SUCCESS CONFIRMATION */}
        {activeTab === 'success' && (
          <ApplicationSuccess
            candidateName={candidateName}
            selectedProgram={selectedProgram}
            onGoToCandidatePortal={() => {
              setRole('candidate');
              setActiveTab('candidate-dashboard');
            }}
            onBackToHome={() => setActiveTab('home')}
          />
        )}

        {/* CANDIDATE STUDY DOSSIER & CHAT */}
        {CANDIDATE_TABS.includes(activeTab) && (
          <CandidatePortal
            isLoggedIn={role === 'candidate'}
            knownEmail={candidateEmail}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onLoginSuccess={() => {
              setRole('candidate');
              setActiveTab('candidate-dashboard');
            }}
            onBackToHome={() => setActiveTab('home')}
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
