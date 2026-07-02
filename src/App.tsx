import { useState, useEffect } from 'react';
import Header from './components/Header';
import AdminSidebar from './components/AdminSidebar';
import PublicPortal from './components/PublicPortal';
import ApplicationForm from './components/ApplicationForm';
import ApplicationSuccess from './components/ApplicationSuccess';
import CandidatePortal from './components/CandidatePortal';
import AdminPortal from './components/AdminPortal';
import { Program } from './types';
import { programsData } from './data/mockData';
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
  const [candidateLoggedIn, setCandidateLoggedIn] = useState(() => localStorage.getItem('candidateLoggedIn') === 'true');
  const [adminLoggedIn, setAdminLoggedIn] = useState(() => localStorage.getItem('adminLoggedIn') === 'true');
  const [adminPassword, setAdminPassword] = useState(() => localStorage.getItem('adminPassword') || 'Admin2026!');
  const [programs, setPrograms] = useState<Program[]>(programsData);

  // Registered Candidate Info
  const [candidateName, setCandidateName] = useState('Jean Dupont');
  const [selectedProgram, setSelectedProgram] = useState('Executive MBA Stratégie Digitale');

  const handleApplicationSuccess = (name: string, prog: string, email: string) => {
    setCandidateName(name);
    setSelectedProgram(prog);
    // Persist candidate info so CandidatePortal can read it
    localStorage.setItem('candidateName', name);
    localStorage.setItem('candidateProgram', prog);
    localStorage.setItem('candidateEmail', email);
    setActiveTab('success');
  };

  const handleLogout = () => {
    setCandidateLoggedIn(false);
    setAdminLoggedIn(false);
    setActiveTab('home');
  };

  const handleCandidateLoginSuccess = () => {
    setCandidateLoggedIn(true);
    setActiveTab('candidate-dashboard');
  };

  const handleAdminLoginSuccess = () => {
    setAdminLoggedIn(true);
    setActiveTab('admin-dashboard');
  };

  useEffect(() => {
    localStorage.setItem('candidateLoggedIn', String(candidateLoggedIn));
  }, [candidateLoggedIn]);

  useEffect(() => {
    localStorage.setItem('adminLoggedIn', String(adminLoggedIn));
  }, [adminLoggedIn]);

  useEffect(() => {
    localStorage.setItem('adminPassword', adminPassword);
  }, [adminPassword]);

  useEffect(() => {
    const adminPaths: ActiveTab[] = ['admin-dashboard', 'admin-users', 'admin-add-user', 'admin-programmes'];
    const candidatePaths: ActiveTab[] = ['candidate-dashboard'];

    if (adminPaths.includes(activeTab) && !adminLoggedIn) {
      setActiveTab('admin-login');
    }
    if (candidatePaths.includes(activeTab) && !candidateLoggedIn) {
      setActiveTab('candidate-login');
    }
  }, [activeTab, adminLoggedIn, candidateLoggedIn]);

  const isCMSorDashboard = ['admin-dashboard', 'admin-users', 'admin-add-user', 'admin-programmes', 'candidate-dashboard'].includes(activeTab);
  const isLightPage = isCMSorDashboard || ['programmes', 'actualites', 'temoignages'].includes(activeTab);

  return (
    <div className={`min-h-screen overflow-x-hidden ${isLightPage ? 'bg-[#f8f9ff]' : 'bg-[#00020e]'}`}>
      {/* Dynamic Header for Visiteur/Visitor pages */}
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onLoginClick={() => {
          setCandidateLoggedIn(false);
          setActiveTab('candidate-login');
        }}
        onAdminLoginClick={() => {
          setAdminLoggedIn(false);
          setActiveTab('admin-login');
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
            onLoginSuccess={handleCandidateLoginSuccess}
            onBackToHome={() => setActiveTab('home')}
            candidateName={candidateName}
            selectedProgram={selectedProgram}
          />
        )}

        {/* ADMIN CMS PORTAL VIEWS */}
        {['admin-login', 'admin-dashboard', 'admin-users', 'admin-add-user', 'admin-programmes'].includes(activeTab) && (
          <AdminPortal 
            activeTab={activeTab as any}
            setActiveTab={setActiveTab}
            isLoggedIn={adminLoggedIn}
            onLoginSuccess={handleAdminLoginSuccess}
            adminPassword={adminPassword}
            setAdminPassword={setAdminPassword}
            programs={programs}
            setPrograms={setPrograms}
          />
        )}
      </main>

    </div>
  );
}
