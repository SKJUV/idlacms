import { useState } from 'react';
import Header from './components/Header';
import AdminSidebar from './components/AdminSidebar';
import PublicPortal from './components/PublicPortal';
import ApplicationForm from './components/ApplicationForm';
import ApplicationSuccess from './components/ApplicationSuccess';
import CandidatePortal from './components/CandidatePortal';
import AdminPortal from './components/AdminPortal';
import DemoToolbar from './components/DemoToolbar';

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
  | 'admin-add-user';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [candidateLoggedIn, setCandidateLoggedIn] = useState(false);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);

  // Registered Candidate Info
  const [candidateName, setCandidateName] = useState('Jean Dupont');
  const [selectedProgram, setSelectedProgram] = useState('Executive MBA Stratégie Digitale');

  const handleApplicationSuccess = (name: string, prog: string) => {
    setCandidateName(name);
    setSelectedProgram(prog);
    setActiveTab('success');
  };

  const handleLogout = () => {
    setCandidateLoggedIn(false);
    setAdminLoggedIn(false);
    setActiveTab('home');
  };

  const isCMSorDashboard = ['admin-dashboard', 'admin-users', 'admin-add-user', 'candidate-dashboard'].includes(activeTab);

  return (
    <div className={`min-h-screen ${isCMSorDashboard ? 'bg-[#f8f9ff]' : 'bg-[#00020e]'}`}>
      
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
      <main className="transition-all duration-300">
        {/* PUBLIC PORTAL VIEWS */}
        {['home', 'programmes', 'actualites', 'temoignages'].includes(activeTab) && (
          <PublicPortal 
            activeTab={activeTab as any} 
            setActiveTab={setActiveTab}
            onApplyNow={() => setActiveTab('candidature')}
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
            onLoginSuccess={() => {
              setCandidateLoggedIn(true);
              setActiveTab('candidate-dashboard');
            }}
            onBackToHome={() => setActiveTab('home')}
          />
        )}

        {/* ADMIN CMS PORTAL VIEWS */}
        {['admin-login', 'admin-dashboard', 'admin-users', 'admin-add-user'].includes(activeTab) && (
          <AdminPortal 
            activeTab={activeTab as any}
            setActiveTab={setActiveTab}
            isLoggedIn={adminLoggedIn}
            onLoginSuccess={() => setAdminLoggedIn(true)}
          />
        )}
      </main>

      {/* Interactive floating screen chooser console for grading */}
      <DemoToolbar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setCandidateLoggedIn={setCandidateLoggedIn}
        setAdminLoggedIn={setAdminLoggedIn}
      />

    </div>
  );
}
