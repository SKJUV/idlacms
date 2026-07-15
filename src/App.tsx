import { useState, useEffect } from 'react';
import Header from './components/Header';
import AdminSidebar from './components/AdminSidebar';
import PublicPortal from './components/PublicPortal';
import ApplicationForm from './components/ApplicationForm';
import ApplicationSuccess from './components/ApplicationSuccess';
import CandidatePortal from './components/CandidatePortal';
import AdminPortal from './components/AdminPortal';
import { Program, NewsArticle, Testimonial, Donation } from './types';
import { programsData, newsData, testimonialsData, donationsData, pendingTestimonialsData } from './data/mockData';
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

// Rôle authentifié — source de vérité unique pour l'espace affiché.
export type Role = 'guest' | 'candidate' | 'admin';

const PUBLIC_TABS: ActiveTab[] = ['home', 'programmes', 'actualites', 'temoignages'];
const CANDIDATE_TABS: ActiveTab[] = ['candidate-login', 'candidate-dashboard'];
const ADMIN_TABS: ActiveTab[] = [
  'admin-login', 'admin-dashboard', 'admin-users', 'admin-add-user', 'admin-programmes',
  'admin-testimonials', 'admin-news', 'admin-preregistrations', 'admin-donations', 'admin-marketing',
  'admin-settings',
];
// Contenus publics consultables par un candidat connecté sans quitter son espace.
const CANDIDATE_BROWSE_TABS: ActiveTab[] = ['programmes', 'actualites'];

// Routage par URL (deep-linking + persistance au rafraîchissement).
// Chaque vue interne correspond à un chemin ; les vues protégées affichent
// automatiquement leur écran de connexion tant que le rôle requis n'est pas actif.
const TAB_TO_PATH: Record<ActiveTab, string> = {
  home: '/',
  programmes: '/programmes',
  actualites: '/actualites',
  temoignages: '/temoignages',
  candidature: '/candidature',
  success: '/candidature/confirmation',
  'candidate-login': '/candidat',
  'candidate-dashboard': '/candidat/dossier',
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
  (acc, [tab, path]) => { acc[path] = tab as ActiveTab; return acc; },
  {} as Record<string, ActiveTab>,
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

  // Synchronise l'URL avec la vue courante (et normalise l'URL initiale).
  useEffect(() => {
    const target = TAB_TO_PATH[activeTab];
    if (window.location.pathname !== target) {
      window.history.pushState({ tab: activeTab }, '', target);
    }
  }, [activeTab]);

  // Prend en charge les boutons Précédent / Suivant du navigateur.
  useEffect(() => {
    const onPopState = () => setActiveTab(tabFromPath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  const [programs, setPrograms] = useState<Program[]>(programsData);
  const [news, setNews] = useState<NewsArticle[]>(newsData);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(testimonialsData);
  // Contenus soumis par le public, en attente de traitement par l'admin.
  const [pendingTestimonials, setPendingTestimonials] = useState<Testimonial[]>(pendingTestimonialsData);
  const [donations, setDonations] = useState<Donation[]>(donationsData);

  // Informations du candidat issues du formulaire de candidature
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');

  // Chargement des contenus publics depuis Appwrite (avec repli sur les données mock)
  useEffect(() => {
    if (!isAppwriteDbConfigured()) return;
    const loadPublicContent = async () => {
      try {
        if (APPWRITE_CONFIG.collections.programs) {
          const res = await databases.listDocuments(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.programs);
          if (res.documents.length > 0) {
            setPrograms(res.documents.map((doc: any) => ({
              id: doc.$id,
              title: doc.title,
              description: doc.description,
              type: doc.type,
              category: doc.category,
              duration: doc.duration,
              image: doc.image,
              isNew: doc.isNew,
            })));
          }
        }
        if (APPWRITE_CONFIG.collections.news) {
          const res = await databases.listDocuments(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.news);
          if (res.documents.length > 0) {
            setNews(res.documents.map((doc: any) => ({
              id: doc.$id,
              title: doc.title,
              description: doc.description,
              date: new Date(doc.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
              category: doc.category,
              image: doc.image,
              isFeatured: doc.isFeatured,
            })));
          }
        }
        if (APPWRITE_CONFIG.collections.testimonials) {
          const res = await databases.listDocuments(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.testimonials);
          if (res.documents.length > 0) {
            setTestimonials(res.documents.map((doc: any) => ({
              id: doc.$id,
              name: doc.name,
              role: doc.role,
              text: doc.text,
              image: doc.image,
              promo: doc.promo,
              category: doc.category,
              isFeatured: doc.isFeatured,
            })));
          }
        }
      } catch (err) {
        console.warn("Échec du chargement des contenus publics depuis Appwrite, utilisation des données mock.", err);
      }
    };
    loadPublicContent();
  }, []);

  // Supprime toute session Appwrite résiduelle pour éviter qu'un rôle hérite
  // de la session d'un autre (ex : l'admin héritant de la session candidat).
  const clearAppwriteSession = () => {
    account.deleteSession({ sessionId: 'current' }).catch(() => {
      /* aucune session active — rien à nettoyer (mode démo/mock) */
    });
  };

  const handleApplicationSuccess = (name: string, prog: string, email: string) => {
    setCandidateName(name);
    setSelectedProgram(prog);
    setCandidateEmail(email);
    setActiveTab('success');
  };

  // Témoignage soumis publiquement par un alumni — entre en file de modération.
  const handleSubmitTestimonial = (t: Omit<Testimonial, 'id' | 'image'>) => {
    setPendingTestimonials((curr) => [
      {
        ...t,
        id: `pending-${Date.now()}`,
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=006c49&color=fff`,
      },
      ...curr,
    ]);
  };

  // Don soumis publiquement — reçu côté admin avec le statut « Nouveau ».
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

  // Ouvre l'espace candidat : si déjà connecté en candidat, va au tableau de bord ;
  // sinon repart d'un état vierge (déconnecte tout rôle précédent) vers la connexion.
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

  // La mise en page « tableau de bord » (fond clair + barre latérale) dépend du rôle
  // authentifié : les écrans de connexion (invité) restent en plein écran sombre.
  // Un candidat connecté conserve sa barre latérale même en consultant les
  // contenus publics (programmes / actualités).
  const isDashboardLayout =
    (role === 'admin' && ADMIN_TABS.includes(activeTab)) ||
    (role === 'candidate' && (activeTab === 'candidate-dashboard' || CANDIDATE_BROWSE_TABS.includes(activeTab)));

  // L'en-tête public n'est destiné qu'aux visiteurs non authentifiés.
  const showPublicHeader = role === 'guest';

  return (
    <div className={`min-h-screen overflow-x-hidden ${isDashboardLayout ? 'bg-[#f8f9ff]' : 'bg-[#00020e]'}`}>
      {/* En-tête public — réservé aux visiteurs (masqué pour candidat / admin connecté) */}
      {showPublicHeader && (
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLoginClick={openCandidateArea}
          onSignUpClick={() => setActiveTab('candidature')}
          onAdminLoginClick={openAdminArea}
        />
      )}

      {/* Barre latérale persistante des espaces authentifiés */}
      {isDashboardLayout && (
        <AdminSidebar
          role={role}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
        />
      )}

      {/* Routeur de vues (piloté par activeTab) */}
      <main className={`transition-all duration-300 w-full ${isDashboardLayout ? 'lg:pl-[280px]' : ''}`}>
        {/* PORTAIL PUBLIC */}
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

        {/* FORMULAIRE DE CANDIDATURE MULTI-ÉTAPES */}
        {activeTab === 'candidature' && (
          <ApplicationForm
            onSuccess={handleApplicationSuccess}
            onBackToHome={() => setActiveTab('home')}
          />
        )}

        {/* CONFIRMATION DE SOUMISSION */}
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

        {/* ESPACE CANDIDAT (connexion + suivi du dossier) */}
        {CANDIDATE_TABS.includes(activeTab) && (
          <CandidatePortal
            isLoggedIn={role === 'candidate'}
            knownEmail={candidateEmail}
            onLoginSuccess={() => {
              setRole('candidate');
              setActiveTab('candidate-dashboard');
            }}
            onBackToHome={() => setActiveTab('home')}
          />
        )}

        {/* ESPACE ADMINISTRATION (CMS) */}
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
