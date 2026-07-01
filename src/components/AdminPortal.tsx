import React, { useState, useMemo } from 'react';
import { 
  Lock, 
  Mail, 
  Search, 
  UserPlus, 
  Trash2, 
  Filter, 
  TrendingUp, 
  Users, 
  GraduationCap, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  UserCheck, 
  BookOpen, 
  Plus, 
  ArrowLeft,
  Settings,
  Bell,
  Sparkles,
  Award
} from 'lucide-react';
import { Program, User, PreRegistration, ActivityLog } from '../types';
import { initialUsers, preRegistrationsData, activityLogsData } from '../data/mockData';

interface AdminPortalProps {
  activeTab: 'admin-login' | 'admin-dashboard' | 'admin-users' | 'admin-add-user' | 'admin-programmes';
  setActiveTab: (tab: any) => void;
  isLoggedIn: boolean;
  onLoginSuccess: () => void;
  programs: Program[];
  setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
}

export default function AdminPortal({ activeTab, setActiveTab, isLoggedIn, onLoginSuccess }: AdminPortalProps) {
  // Login Form States
  const [email, setEmail] = useState('admin@idla.edu');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // CMS database records states (with persistent in-memory session changes)
  const [usersList, setUsersList] = useState<User[]>(initialUsers);
  const [preRegistrations, setPreRegistrations] = useState<PreRegistration[]>(preRegistrationsData);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(activityLogsData);

  // New User creation Form States
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'Super Admin' | 'Admin' | 'Writer' | 'Marketer' | 'OC'>('Admin');
  const [newUserStatus, setNewUserStatus] = useState<'Actif' | 'Inactif' | 'Bloqué'>('Actif');

  // New Program creation Form States
  const [newProgramTitle, setNewProgramTitle] = useState('');
  const [newProgramDescription, setNewProgramDescription] = useState('');
  const [newProgramType, setNewProgramType] = useState<'Master' | 'Doctorat' | 'Certification' | 'Bachelor'>('Master');
  const [newProgramCategory, setNewProgramCategory] = useState<'Sciences' | 'Management' | 'Tech' | 'Droit' | 'Santé' | 'Communication'>('Tech');
  const [newProgramDuration, setNewProgramDuration] = useState('2 ans (Full-time)');
  const [newProgramImage, setNewProgramImage] = useState('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80');
  const [newProgramIsNew, setNewProgramIsNew] = useState(true);

  // New Alumni Form States
  const [alumniName, setAlumniName] = useState('Jean-Pierre Mvogo');
  const [alumniRole, setAlumniRole] = useState('VP Global Strategy at Orange');
  const [alumniPromo, setAlumniPromo] = useState('Promo 2018');
  const [alumniQuote, setAlumniQuote] = useState('L\'IDLA m\'a inculqué la discipline et la rigueur d\'analyse requises pour diriger des équipes mondiales.');

  // Users Filter States
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUserStatusFilter, setSelectedUserStatusFilter] = useState<string>('Tous');

  // Handlers
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    setTimeout(() => {
      if (email === 'admin@idla.edu' && password === 'admin123') {
        onLoginSuccess();
        setActiveTab('admin-dashboard');
      } else {
        setLoginError('Accès refusé. Utilisez admin@idla.edu / admin123');
      }
      setIsLoading(false);
    }, 700);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    const names = newUserName.split(' ');
    const initials = names.map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const newUser: User = {
      id: Math.floor(1000 + Math.random() * 9000).toString(),
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      status: newUserStatus,
      lastLogin: 'À l\'instant',
      initials: initials || 'UN'
    };

    setUsersList((curr) => [newUser, ...curr]);
    
    // Add activity log
    const newLog: ActivityLog = {
      id: Math.random().toString(),
      type: 'registration',
      user: 'Super Admin',
      text: `a créé l'utilisateur CMS : ${newUserName} (${newUserRole}).`,
      time: 'À l\'instant'
    };
    setActivityLogs((curr) => [newLog, ...curr]);

    // Reset Form
    setNewUserName('');
    setNewUserEmail('');
    setActiveTab('admin-users');
  };

  const handleCreateProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgramTitle || !newProgramDescription) return;

    const newProgram: Program = {
      id: `prog-${Math.floor(1000 + Math.random() * 9000)}`,
      title: newProgramTitle,
      description: newProgramDescription,
      type: newProgramType,
      category: newProgramCategory,
      duration: newProgramDuration,
      image: newProgramImage,
      isNew: newProgramIsNew
    };

    setPrograms((curr) => [newProgram, ...curr]);

    const newLog: ActivityLog = {
      id: Math.random().toString(),
      type: 'article',
      user: 'Super Admin',
      text: `a ajouté un nouveau programme : ${newProgramTitle}.`,
      time: 'À l\'instant'
    };
    setActivityLogs((curr) => [newLog, ...curr]);

    setNewProgramTitle('');
    setNewProgramDescription('');
    setNewProgramType('Master');
    setNewProgramCategory('Tech');
    setNewProgramDuration('2 ans (Full-time)');
    setNewProgramImage('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80');
    setNewProgramIsNew(true);
    setActiveTab('admin-programmes');
  };

  const handleDeleteUser = (id: string) => {
    const targetUser = usersList.find(u => u.id === id);
    setUsersList((curr) => curr.filter((u) => u.id !== id));
    
    // Add activity log
    if (targetUser) {
      const newLog: ActivityLog = {
        id: Math.random().toString(),
        type: 'error',
        user: 'Super Admin',
        text: `a supprimé l'utilisateur CMS : ${targetUser.name}.`,
        time: 'À l\'instant'
      };
      setActivityLogs((curr) => [newLog, ...curr]);
    }
  };

  const handleApprovePreRegistration = (id: string) => {
    setPreRegistrations((curr) => 
      curr.map((p) => p.id === id ? { ...p, status: 'Accepted' } : p)
    );
  };

  const handleDenyPreRegistration = (id: string) => {
    setPreRegistrations((curr) => 
      curr.map((p) => p.id === id ? { ...p, status: 'Rejected' } : p)
    );
  };

  const handleSaveAlumniProfile = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newLog: ActivityLog = {
      id: Math.random().toString(),
      type: 'alumni',
      user: 'Super Admin',
      text: `a mis à jour la success story de l'Alumni : ${alumniName}.`,
      time: 'À l\'instant'
    };
    setActivityLogs((curr) => [newLog, ...curr]);
    
    alert(`Success Story de l'Alumni ${alumniName} enregistrée avec succès !`);
  };

  // Filter computation for Users list
  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                            u.email.toLowerCase().includes(userSearchQuery.toLowerCase());
      const matchesStatus = selectedUserStatusFilter === 'Tous' || u.status === selectedUserStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [usersList, userSearchQuery, selectedUserStatusFilter]);

  // LOGIN SCREEN VIEW
  if (!isLoggedIn && activeTab === 'admin-login') {
    return (
      <div className="bg-[#00020e] min-h-screen flex items-center justify-center py-12 px-6 relative overflow-hidden text-white">
        
        {/* Particle/Grid lines Simulation overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        </div>

        <div className="max-w-md w-full bg-[#161922] rounded-2xl border border-white/10 p-8 shadow-2xl relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-500/10 text-[#6ffbbe] rounded-xl flex items-center justify-center mx-auto border border-[#6ffbbe]/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="font-sans font-bold text-2xl text-white tracking-tight">Accès Sécurisé CMS</h1>
            <p className="text-white/60 text-xs">Identifiez-vous pour gérer les admissions d'IDLA CMS</p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-200 text-xs font-semibold flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-white/60 tracking-wider">Compte Administrateur</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#6ffbbe] outline-none text-white font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-white/60 tracking-wider">Clé de sécurité</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#6ffbbe] outline-none text-white"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#006c49] hover:bg-[#6ffbbe] hover:text-[#00020e] text-white py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? 'Authentification...' : 'Valider les privilèges'}
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-[11px] text-white/40">
              Indentifiants Démo : <span className="text-[#6ffbbe] font-semibold">admin@idla.edu / admin123</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // LOGGED IN MODULE VIEWS
  return (
    <div className="bg-[#f8f9ff] min-h-screen text-[#0b1c30] pl-[280px] py-8 pr-8">
      
      {/* Top action header */}
      <header className="flex justify-between items-center pb-6 border-b border-[#c6c6cf]/30 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#00020e] uppercase tracking-wide">IDLA CMS Académique</h2>
          <p className="text-xs text-slate-400 mt-1">Gouvernance du Portail d'Admissions et de Contenus</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-slate-400 hover:text-[#0b1c30] bg-white rounded-lg border border-[#c6c6cf] relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500"></span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#00020e] text-white flex items-center justify-center font-bold text-xs">
              JS
            </div>
            <div>
              <p className="text-xs font-bold leading-none text-[#00020e]">J-S. Dupont</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Super Admin</p>
            </div>
          </div>
        </div>
      </header>

      {/* DASHBOARD VIEW MODULE */}
      {activeTab === 'admin-dashboard' && (
        <div className="space-y-8">
          
          {/* Key KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-[#c6c6cf] shadow-sm space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Inscriptions globales</p>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-[#00020e]">1,248</span>
                <span className="text-xs text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> +12%
                </span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#c6c6cf] shadow-sm space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Taux d'admission</p>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-[#00020e]">18.4%</span>
                <span className="text-xs text-amber-600 font-bold bg-amber-500/10 px-2 py-0.5 rounded">Sélectif</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#c6c6cf] shadow-sm space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dossiers à réviser</p>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-[#00020e]">
                  {preRegistrations.filter(p => p.status === 'In Review' || p.status === 'New').length}
                </span>
                <span className="text-xs text-rose-600 font-bold bg-rose-500/10 px-2 py-0.5 rounded">Action requise</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#c6c6cf] shadow-sm space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Score Sols Éco-Design</p>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-[#00020e]">94/100</span>
                <span className="text-xs text-[#006c49] font-bold bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-0.5">
                  Optimal
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Table of pending pre-registrations */}
            <div className="lg:col-span-8 bg-white border border-[#c6c6cf] rounded-2xl overflow-hidden shadow-sm flex flex-col">
              <div className="p-6 border-b border-[#c6c6cf]/30 flex justify-between items-center bg-slate-50">
                <h3 className="font-sans font-bold text-base text-[#00020e] flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#006c49]" />
                  Demandes de Pré-inscriptions Récentes
                </h3>
                <span className="text-xs font-bold text-[#006c49] bg-[#6ffbbe]/20 px-2.5 py-1 rounded-full">Admissions</span>
              </div>

              <div className="overflow-x-auto flex-grow">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 border-b border-[#c6c6cf]/30 font-bold uppercase">
                      <th className="p-4">Candidat</th>
                      <th className="p-4">Filière d'intérêt</th>
                      <th className="p-4">Date de dépôt</th>
                      <th className="p-4 text-center">Décision adm.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c6c6cf]/20">
                    {preRegistrations.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-semibold text-[#00020e]">
                          <div>{p.name}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{p.email}</div>
                        </td>
                        <td className="p-4 font-medium text-slate-600">{p.program}</td>
                        <td className="p-4 text-slate-400">{p.dateApplied}</td>
                        <td className="p-4">
                          {p.status === 'Accepted' && (
                            <span className="mx-auto block text-center w-24 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 font-bold text-[10px]">
                              Admis d'office
                            </span>
                          )}
                          {p.status === 'Rejected' && (
                            <span className="mx-auto block text-center w-24 py-1 rounded-lg bg-rose-500/10 text-rose-700 font-bold text-[10px]">
                              Refusé
                            </span>
                          )}
                          {p.status !== 'Accepted' && p.status !== 'Rejected' && (
                            <div className="flex justify-center items-center gap-2">
                              <button 
                                onClick={() => handleApprovePreRegistration(p.id)}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white p-1.5 rounded transition-all"
                                title="Accepter la pré-inscription"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDenyPreRegistration(p.id)}
                                className="bg-rose-500 hover:bg-rose-600 text-white p-1.5 rounded transition-all"
                                title="Refuser le dossier"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CMS Activity Logs */}
            <div className="lg:col-span-4 bg-white border border-[#c6c6cf] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="font-sans font-bold text-base text-[#00020e]">Journal d'activité CMS</h3>
                
                <div className="space-y-4">
                  {activityLogs.slice(0, 4).map((log) => (
                    <div key={log.id} className="flex gap-3 text-xs leading-relaxed border-l-2 border-slate-100 pl-3">
                      <div>
                        <span className="font-bold text-[#00020e]">{log.user}</span>{' '}
                        <span className="text-[#45464e]">{log.text}</span>
                        <div className="text-[10px] text-slate-400 mt-1">{log.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <button 
                onClick={() => setActiveTab('admin-users')}
                className="w-full mt-6 text-center border border-[#c6c6cf] hover:bg-slate-50 text-xs font-bold py-2.5 rounded-lg transition-all"
              >
                Gérer les comptes utilisateurs
              </button>
            </div>

          </div>

        </div>
      )}

      {/* USERS MANAGEMENT MODULE */}
      {activeTab === 'admin-users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-sans font-bold text-lg text-[#00020e]">Comptes d'accès IDLA CMS</h3>
            <button 
              onClick={() => setActiveTab('admin-add-user')}
              className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow"
            >
              <UserPlus className="w-4 h-4" />
              Ajouter un utilisateur
            </button>
          </div>

          {/* User management search bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-[#c6c6cf] shadow-sm">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
              <input 
                className="w-full bg-slate-50 border border-[#c6c6cf] rounded-lg pl-9 pr-4 py-1.5 text-xs outline-none" 
                placeholder="Rechercher par nom ou email..." 
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              {['Tous', 'Actif', 'Inactif', 'Bloqué'].map((st) => (
                <button 
                  key={st}
                  onClick={() => setSelectedUserStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                    selectedUserStatusFilter === st 
                      ? 'bg-[#00020e] text-white' 
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border border-[#c6c6cf]/40'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white border border-[#c6c6cf] rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 border-b border-[#c6c6cf]/30 font-bold uppercase">
                  <th className="p-4 w-20">ID</th>
                  <th className="p-4">Utilisateur</th>
                  <th className="p-4">Rôle</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4">Dernière activité</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c6c6cf]/20">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/40">
                    <td className="p-4 font-bold text-slate-400">#{u.id}</td>
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center overflow-hidden border border-[#c6c6cf]/30">
                        {u.avatar ? (
                          <img className="w-full h-full object-cover" alt={u.name} src={u.avatar} />
                        ) : (
                          u.initials
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-[#00020e]">{u.name}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{u.email}</div>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-600">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        u.role === 'Super Admin' ? 'bg-[#006c49]/10 text-[#006c49]' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        u.status === 'Actif' 
                          ? 'bg-emerald-500/10 text-emerald-700' 
                          : u.status === 'Bloqué' 
                          ? 'bg-red-500/10 text-red-700' 
                          : 'bg-amber-500/10 text-amber-700'
                      }`}>
                        ● {u.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">{u.lastLogin}</td>
                    <td className="p-4">
                      {u.id !== '8821' ? ( // Protect main Super Admin from deletion
                        <button 
                          onClick={() => handleDeleteUser(u.id)}
                          className="mx-auto block text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded transition-all"
                          title="Supprimer l'utilisateur"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[9px] text-slate-300 italic block text-center">Système</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE USER FORM VIEW */}
      {activeTab === 'admin-add-user' && (
        <div className="max-w-2xl bg-white border border-[#c6c6cf] rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-[#c6c6cf]/30">
            <button 
              onClick={() => setActiveTab('admin-users')}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors border border-[#c6c6cf]/50 text-slate-500"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h3 className="font-sans font-bold text-base text-[#00020e]">Créer un nouvel utilisateur</h3>
              <p className="text-[11px] text-slate-400">Renseignez les détails du compte de l'équipe IDLA</p>
            </div>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Nom complet *</label>
              <input 
                type="text" 
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="ex: Marie-Louise Mba"
                className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-medium" 
                required 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Adresse email *</label>
              <input 
                type="email" 
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="ex: ml.mba@idla.edu"
                className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-medium" 
                required 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Rôle CMS académique *</label>
                <select 
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-bold text-[#00020e]"
                >
                  <option value="Admin">Admin</option>
                  <option value="Writer">Writer (Rédacteur Actualités)</option>
                  <option value="Marketer">Marketer</option>
                  <option value="OC">OC (Conseiller Admissions)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Statut initial *</label>
                <select 
                  value={newUserStatus}
                  onChange={(e) => setNewUserStatus(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-bold text-[#00020e]"
                >
                  <option value="Actif">Actif</option>
                  <option value="Inactif">Inactif</option>
                </select>
              </div>
            </div>

            <div className="pt-6 flex justify-end gap-3 border-t border-[#c6c6cf]/30">
              <button 
                type="button"
                onClick={() => setActiveTab('admin-users')}
                className="px-5 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 border border-[#c6c6cf]/40 transition-colors"
              >
                Annuler
              </button>
              <button 
                type="submit"
                className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-6 py-2.5 rounded-lg transition-all"
              >
                Enregistrer l'utilisateur
              </button>
            </div>
          </form>
        </div>
      )}



    </div>
  );
}
