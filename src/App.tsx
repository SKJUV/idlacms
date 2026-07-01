import { useState, useEffect } from 'react';
import Header from './components/Header';
import AdminSidebar from './components/AdminSidebar';
import PublicPortal from './components/PublicPortal';
import ApplicationForm from './components/ApplicationForm';
import ApplicationSuccess from './components/ApplicationSuccess';
import CandidatePortal from './components/CandidatePortal';
import AdminPortal from './components/AdminPortal';
import { Program, NewsArticle, Testimonial } from './types';
import { programsData, newsData, testimonialsData } from './data/mockData';
import { databases, APPWRITE_CONFIG, isAppwriteDbConfigured } from './lib/appwrite';
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
  | 'admin-programmes';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [candidateLoggedIn, setCandidateLoggedIn] = useState(false);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [programs, setPrograms] = useState<Program[]>(programsData);
  const [news, setNews] = useState<NewsArticle[]>(newsData);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(testimonialsData);

  // Registered Candidate Info
  const [candidateName, setCandidateName] = useState('Jean Dupont');
  const [candidateEmail, setCandidateEmail] = useState('jean.dupont@email.com');
  const [selectedProgram, setSelectedProgram] = useState('Executive MBA Stratégie Digitale');

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

  const handleApplicationSuccess = (name: string, prog: string, email: string) => {
    setCandidateName(name);
    setSelectedProgram(prog);
    setCandidateEmail(email);
    setActiveTab('success');
  };

  const handleLogout = () => {
    setCandidateLoggedIn(false);
    setAdminLoggedIn(false);
    setActiveTab('home');
  };

  const isCMSorDashboard = ['admin-dashboard', 'admin-users', 'admin-add-user', 'admin-programmes', 'candidate-dashboard'].includes(activeTab);

  return (
    <div className={`min-h-screen overflow-x-hidden ${isCMSorDashboard ? 'bg-[#f8f9ff]' : 'bg-[#00020e]'}`}>
      {/* Dynamic Header for Visiteur/Visitor pages */}
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onLoginClick={() => {
          setCandidateLoggedIn(false);
          setActiveTab('candidate-login');
        }}
        onSignUpClick={() => setActiveTab('candidature')}
      />

      {/* Admin and Candidate persistent Sidebars */}
      {isCMSorDashboard && (
        <AdminSidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onLogout={handleLogout}
        />
      )}

      {/* Dynamic view router switch */}
      <main className={`transition-all duration-300 w-full ${isCMSorDashboard ? 'lg:pl-[280px]' : ''}`}>
        {/* PUBLIC PORTAL VIEWS */}
        {['home', 'programmes', 'actualites', 'temoignages'].includes(activeTab) && (
          <PublicPortal
            activeTab={activeTab as any}
            setActiveTab={setActiveTab}
            onApplyNow={() => setActiveTab('candidature')}
            programs={programs}
            news={news}
            testimonials={testimonials}
          />
        )}

        {/* RECRUITMENT APPLICATION STEPPER FORM */}
        {activeTab === 'candidature' && (
          <ApplicationForm 
            onSuccess={handleApplicationSuccess}
            onBackToHome={() => setActiveTab('home')}
          />
        )}

        {/* ADMISSION SUCCESS CONFIRMATION VIEW */}
        {activeTab === 'success' && (
          <ApplicationSuccess 
            candidateName={candidateName}
            selectedProgram={selectedProgram}
            onGoToCandidatePortal={() => {
              setCandidateLoggedIn(true);
              setActiveTab('candidate-dashboard');
            }}
            onBackToHome={() => setActiveTab('home')}
          />
        )}

        {/* CANDIDATE PORTAL (LOGIN & TRACKING TIMELINE) */}
        {(activeTab === 'candidate-login' || activeTab === 'candidate-dashboard') && (
          <CandidatePortal
            isLoggedIn={candidateLoggedIn}
            knownEmail={candidateEmail}
            onLoginSuccess={() => {
              setCandidateLoggedIn(true);
              setActiveTab('candidate-dashboard');
            }}
            onBackToHome={() => setActiveTab('home')}
          />
        )}

        {/* ADMIN CMS PORTAL VIEWS */}
        {['admin-login', 'admin-dashboard', 'admin-users', 'admin-add-user', 'admin-programmes'].includes(activeTab) && (
          <AdminPortal 
            activeTab={activeTab as any}
            setActiveTab={setActiveTab}
            isLoggedIn={adminLoggedIn}
            onLoginSuccess={() => setAdminLoggedIn(true)}
            programs={programs}
            setPrograms={setPrograms}
          />
        )}
      </main>

    </div>
  );
}
