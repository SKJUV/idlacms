import React, { useState, useRef } from 'react';
import {
  LockIcon, MailIcon, AlertCircleIcon, CheckCircle2Icon,
  ArrowLeftIcon, ChevronRightIcon, AwardIcon, PlayCircleIcon, BookmarkIcon,
  LinkedinIcon, DownloadIcon, FilterIcon, StarIcon, CalendarIcon, SearchIcon,
  SettingsIcon, BellIcon, SaveIcon, ClockIcon, BookOpenIcon,
  ShareIcon, GlobeIcon, CameraIcon, PencilIcon, UsersIcon,
} from './Icons';
import { account } from '../lib/appwrite';
import {
  CourseEnrollment, AssignmentDeadline, Certificate,
  StudentProfile, CourseCatalogItem,
} from '../types';

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_ENROLLMENTS: CourseEnrollment[] = [
  {
    id: 'enr-1', courseId: 'c-1',
    title: 'Intelligence Artificielle : Fondamentaux',
    instructor: 'Dr. Amara Diallo', category: 'Tech', level: 'Intermédiaire',
    duration: '14h 20min', totalLessons: 32, completedLessons: 21,
    progressPercent: 66, status: 'en cours',
    enrolledAt: '2025-09-01', lastAccessedAt: '2026-07-12',
    nextDeadline: '2026-07-20', nextLessonTitle: 'Réseaux de neurones convolutifs',
    image: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80',
  },
  {
    id: 'enr-2', courseId: 'c-2',
    title: 'Stratégie & Management Digitale',
    instructor: 'Prof. Fatou Ndiaye', category: 'Management', level: 'Avancé',
    duration: '10h 00min', totalLessons: 24, completedLessons: 24,
    progressPercent: 100, status: 'terminé',
    enrolledAt: '2025-06-15', lastAccessedAt: '2026-05-30',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
  },
  {
    id: 'enr-3', courseId: 'c-3',
    title: 'Droit International des Contrats',
    instructor: 'Me. Jean-Luc Moreau', category: 'Droit', level: 'Avancé',
    duration: '8h 45min', totalLessons: 18, completedLessons: 4,
    progressPercent: 22, status: 'en cours',
    enrolledAt: '2026-06-01', lastAccessedAt: '2026-07-10',
    nextDeadline: '2026-07-25', nextLessonTitle: 'Arbitrage commercial international',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80',
  },
  {
    id: 'enr-4', courseId: 'c-4',
    title: 'Biostatistiques & Épidémiologie',
    instructor: 'Dr. Claire Mensah', category: 'Santé', level: 'Intermédiaire',
    duration: '11h 15min', totalLessons: 28, completedLessons: 0,
    progressPercent: 0, status: 'non commencé',
    enrolledAt: '2026-07-01',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80',
  },
];

const MOCK_DEADLINES: AssignmentDeadline[] = [
  { id: 'dl-1', courseId: 'c-1', courseTitle: 'Intelligence Artificielle : Fondamentaux', assignmentTitle: 'Projet CNN — Classification d\'images', dueDate: '2026-07-20', isSubmitted: false, priority: 'high' },
  { id: 'dl-2', courseId: 'c-3', courseTitle: 'Droit International des Contrats', assignmentTitle: 'Analyse de cas — Affaire Suez', dueDate: '2026-07-25', isSubmitted: false, priority: 'medium' },
  { id: 'dl-3', courseId: 'c-1', courseTitle: 'Intelligence Artificielle : Fondamentaux', assignmentTitle: 'Quiz hebdomadaire — Module 7', dueDate: '2026-07-17', isSubmitted: true, priority: 'low' },
];

const MOCK_CERTIFICATES: Certificate[] = [
  { id: 'cert-1', courseTitle: 'Stratégie & Management Digitale', issueDate: '2026-06-02', credentialId: 'IDLA-MGT-2026-4F2A', category: 'Management', instructor: 'Prof. Fatou Ndiaye' },
  { id: 'cert-2', courseTitle: 'Introduction à la Data Science', issueDate: '2025-12-15', credentialId: 'IDLA-DS-2025-9C1B', category: 'Tech', instructor: 'Dr. Kofi Asante' },
];

const MOCK_CATALOG: CourseCatalogItem[] = [
  { id: 'c-1', title: 'Intelligence Artificielle : Fondamentaux', instructor: 'Dr. Amara Diallo', category: 'Tech', level: 'Intermédiaire', duration: '14h 20min', rating: 4.8, totalStudents: 1240, image: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80', isNew: true, tags: ['IA', 'Machine Learning', 'Python'] },
  { id: 'c-2', title: 'Stratégie & Management Digitale', instructor: 'Prof. Fatou Ndiaye', category: 'Management', level: 'Avancé', duration: '10h 00min', rating: 4.6, totalStudents: 870, image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80', tags: ['Stratégie', 'Digital', 'Leadership'] },
  { id: 'c-3', title: 'Droit International des Contrats', instructor: 'Me. Jean-Luc Moreau', category: 'Droit', level: 'Avancé', duration: '8h 45min', rating: 4.5, totalStudents: 430, image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80', tags: ['Droit', 'Contrats', 'International'] },
  { id: 'c-4', title: 'Biostatistiques & Épidémiologie', instructor: 'Dr. Claire Mensah', category: 'Santé', level: 'Intermédiaire', duration: '11h 15min', rating: 4.7, totalStudents: 610, image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80', tags: ['Statistiques', 'Santé', 'Recherche'] },
  { id: 'c-5', title: 'Communication & Leadership', instructor: 'Dr. Sylvie Kouassi', category: 'Management', level: 'Débutant', duration: '6h 30min', rating: 4.4, totalStudents: 2100, image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=80', isFeatured: true, tags: ['Communication', 'Leadership'] },
  { id: 'c-6', title: 'Introduction à la Data Science', instructor: 'Dr. Kofi Asante', category: 'Tech', level: 'Débutant', duration: '9h 00min', rating: 4.9, totalStudents: 3200, image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80', isFeatured: true, tags: ['Data', 'Python', 'Statistiques'] },
];

const MOCK_PROFILE: StudentProfile = {
  id: 'stu-1', name: 'Amina Koné', email: 'amina.kone@exemple.com',
  bio: 'Étudiante en Master IA & Sciences des Données. Passionnée par l\'application de l\'intelligence artificielle aux enjeux de santé en Afrique.',
  language: 'fr', joinedAt: '2025-09-01',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const daysUntil = (isoDate: string) => {
  const diff = new Date(isoDate).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

const priorityBadge = (p: AssignmentDeadline['priority']) => {
  if (p === 'high') return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
  if (p === 'medium') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
};

const priorityLabel = (p: AssignmentDeadline['priority']) =>
  p === 'high' ? 'Urgent' : p === 'medium' ? 'Normal' : 'Faible';

const statusBadge = (s: CourseEnrollment['status']) => {
  if (s === 'terminé') return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
  if (s === 'en cours') return 'bg-brand-primary/10 text-brand-primary border-brand-primary/20';
  return 'bg-bg-primary text-text-secondary border-border-primary/40';
};

const statusLabel = (s: CourseEnrollment['status']) =>
  s === 'terminé' ? 'Terminé' : s === 'en cours' ? 'En cours' : 'Non commencé';

const CATEGORIES = ['Tous', 'Tech', 'Management', 'Droit', 'Santé', 'Sciences', 'Communication'];
const LEVELS = ['Tous niveaux', 'Débutant', 'Intermédiaire', 'Avancé'];
const LANGUAGES_UI = [{ value: 'fr', label: 'Français' }, { value: 'en', label: 'English' }];

// ─── Props ─────────────────────────────────────────────────────────────────────

interface StudentPortalProps {
  onBackToHome: () => void;
  onLoginSuccess: () => void;
  isLoggedIn: boolean;
  knownEmail?: string;
  activeTab?: string;
  setActiveTab?: (tab: any) => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function StudentPortal({
  onBackToHome, onLoginSuccess, isLoggedIn, knownEmail, activeTab, setActiveTab,
}: StudentPortalProps) {

  // ── Login state ──
  const [email, setEmail] = useState(knownEmail || '');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // ── Profile state ──
  const [profile, setProfile] = useState<StudentProfile>(MOCK_PROFILE);
  const [editProfile, setEditProfile] = useState(false);
  const [draftName, setDraftName] = useState(profile.name);
  const [draftBio, setDraftBio] = useState(profile.bio);
  const [profileSaved, setProfileSaved] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // ── Account settings state ──
  const [settingsTab, setSettingsTab] = useState<'security' | 'notifications' | 'language'>('security');
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifDeadlines, setNotifDeadlines] = useState(true);
  const [notifNews, setNotifNews] = useState(false);
  const [selectedLang, setSelectedLang] = useState<'fr' | 'en'>(profile.language);
  const [langSaved, setLangSaved] = useState(false);

  // ── Catalog state ──
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('Tous');
  const [filterLevel, setFilterLevel] = useState('Tous niveaux');

  // ── Handlers ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);
    try {
      await account.deleteSession({ sessionId: 'current' }).catch(() => undefined);
      await account.createEmailPasswordSession({ email, password });
      onLoginSuccess();
    } catch (err: any) {
      if (err.type === 'project_paused' || err.code === 403) {
        setLoginError('Le serveur est actuellement suspendu. Veuillez le restaurer depuis la console Appwrite.');
      } else {
        setLoginError('Identifiants incorrects ou serveur inaccessible.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = () => {
    setProfile((p) => ({ ...p, name: draftName, bio: draftBio }));
    setEditProfile(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(''); setPwdSuccess('');
    if (newPwd.length < 8) { setPwdError('Le mot de passe doit comporter au moins 8 caractères.'); return; }
    if (newPwd !== confirmPwd) { setPwdError('Les deux mots de passe ne correspondent pas.'); return; }
    setIsUpdatingPwd(true);
    try {
      await account.updatePassword({ password: newPwd, oldPassword: currentPwd });
      setPwdSuccess('Mot de passe modifié avec succès.');
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err: any) {
      if (err?.code === 401) setPwdError('Mot de passe actuel incorrect.');
      else setPwdError(err?.message || 'Erreur lors de la mise à jour.');
    } finally {
      setIsUpdatingPwd(false);
    }
  };

  const handleSaveLanguage = () => {
    setProfile((p) => ({ ...p, language: selectedLang }));
    setLangSaved(true);
    setTimeout(() => setLangSaved(false), 3000);
  };

  // ── Derived data ──
  const inProgress = MOCK_ENROLLMENTS.filter((e) => e.status === 'en cours');
  const completed = MOCK_ENROLLMENTS.filter((e) => e.status === 'terminé');
  const upcomingDeadlines = MOCK_DEADLINES.filter((d) => !d.isSubmitted).sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  const filteredCatalog = MOCK_CATALOG.filter((c) => {
    const matchQ = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCat = filterCategory === 'Tous' || c.category === filterCategory;
    const matchLvl = filterLevel === 'Tous niveaux' || c.level === filterLevel;
    return matchQ && matchCat && matchLvl;
  });

  // ════════════════════════════════════════════════════════════════════════════
  // LOGIN VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (!isLoggedIn) {
    return (
      <div className="bg-bg-primary min-h-screen flex items-center justify-center py-12 px-6 relative overflow-hidden text-text-primary">
        <div className="absolute inset-0 opacity-10 pointer-events-none z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-primary blur-[150px] rounded-full" />
        </div>
        <div className="max-w-md w-full bg-bg-secondary rounded-2xl border border-border-primary p-8 shadow-2xl relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <button onClick={onBackToHome} className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-brand-primary transition-colors mb-4 border border-border-primary px-3 py-1 rounded cursor-pointer">
              <ArrowLeftIcon className="w-3 h-3" /> Retour au site public
            </button>
            <div className="w-12 h-12 bg-brand-light text-brand-primary rounded-xl flex items-center justify-center font-bold text-2xl mx-auto shadow-sm">📚</div>
            <h1 className="font-sans font-bold text-2xl text-text-primary">Espace Étudiant</h1>
            <p className="text-text-secondary text-xs">Accédez à vos cours, certificats et progression</p>
          </div>
          {loginError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-700 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircleIcon className="w-4 h-4 text-red-500 shrink-0" /><span>{loginError}</span>
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Adresse email</label>
              <div className="relative">
                <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/60 w-4 h-4" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Votre adresse email"
                  className="w-full bg-bg-primary border border-border-primary rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-primary outline-none text-text-primary font-medium" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Mot de passe</label>
                <a href="#" className="text-[10px] text-brand-primary hover:underline font-bold">Oublié ?</a>
              </div>
              <div className="relative">
                <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/60 w-4 h-4" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full bg-bg-primary border border-border-primary rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-primary outline-none text-text-primary" required />
              </div>
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full bg-brand-primary hover:bg-brand-hover text-white py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-60">
              {isLoading ? 'Identification en cours...' : 'Se connecter'}<ChevronRightIcon className="w-4 h-4" />
            </button>
          </form>
          <p className="text-center text-xs text-text-secondary pt-2">
            Pas encore inscrit ?{' '}
            <button onClick={onBackToHome} className="text-brand-primary hover:underline font-bold cursor-pointer">Découvrir nos programmes</button>
          </p>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // DASHBOARD VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (activeTab === 'student-dashboard') {
    return (
      <div className="bg-bg-primary min-h-screen text-text-primary py-8 px-6 md:px-12 transition-all duration-200">
        <div className="max-w-[1440px] mx-auto space-y-8">

          {/* Welcome banner */}
          <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-brand-light border border-brand-primary/30 flex items-center justify-center shrink-0 overflow-hidden">
                {profile.avatarUrl
                  ? <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                  : <span className="text-2xl font-bold text-brand-primary">{profile.name.charAt(0)}</span>}
              </div>
              <div>
                <h1 className="font-sans font-bold text-2xl text-text-primary">Bonjour, {profile.name.split(' ')[0]} !</h1>
                <p className="text-sm text-text-secondary mt-0.5">Vous avez <span className="text-brand-primary font-bold">{inProgress.length} cours</span> en cours et <span className="text-rose-500 font-bold">{upcomingDeadlines.length} échéance{upcomingDeadlines.length !== 1 ? 's' : ''}</span> à venir.</p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button onClick={() => setActiveTab && setActiveTab('student-catalog')} className="inline-flex items-center gap-1.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer">
                <SearchIcon className="w-3.5 h-3.5" /> Explorer le catalogue
              </button>
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Cours inscrits', value: MOCK_ENROLLMENTS.length, icon: BookOpenIcon, color: 'text-brand-primary', bg: 'bg-brand-light' },
              { label: 'En cours', value: inProgress.length, icon: PlayCircleIcon, color: 'text-amber-600', bg: 'bg-amber-500/10' },
              { label: 'Terminés', value: completed.length, icon: CheckCircle2Icon, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
              { label: 'Certificats', value: MOCK_CERTIFICATES.length, icon: AwardIcon, color: 'text-purple-600', bg: 'bg-purple-500/10' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-bg-secondary border border-border-primary rounded-2xl p-5 shadow-sm flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{value}</p>
                  <p className="text-xs text-text-secondary">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Continue learning + Deadlines */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* In-progress courses */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="font-sans font-bold text-base text-text-primary uppercase tracking-wider">Reprendre un cours</h2>
              <div className="space-y-4">
                {inProgress.map((enr) => (
                  <div key={enr.id} className="bg-bg-secondary border border-border-primary rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row">
                    <div className="w-full sm:w-40 h-36 sm:h-auto shrink-0 overflow-hidden">
                      <img src={enr.image} alt={enr.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-5 flex flex-col justify-between gap-3 flex-1">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-sans font-bold text-sm text-text-primary line-clamp-2">{enr.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${statusBadge(enr.status)}`}>{statusLabel(enr.status)}</span>
                        </div>
                        <p className="text-xs text-text-secondary">{enr.instructor}</p>
                        {enr.nextLessonTitle && (
                          <p className="text-xs text-text-secondary mt-1 flex items-center gap-1">
                            <PlayCircleIcon className="w-3 h-3 text-brand-primary shrink-0" />
                            <span className="text-brand-primary font-semibold line-clamp-1">{enr.nextLessonTitle}</span>
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] text-text-secondary">
                          <span>{enr.completedLessons}/{enr.totalLessons} leçons</span>
                          <span className="font-bold text-brand-primary">{enr.progressPercent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-bg-primary rounded-full overflow-hidden">
                          <div className="h-full bg-brand-primary rounded-full transition-all" style={{ width: `${enr.progressPercent}%` }} />
                        </div>
                      </div>
                      <button className="self-start inline-flex items-center gap-1.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer">
                        <PlayCircleIcon className="w-3.5 h-3.5" /> Continuer
                      </button>
                    </div>
                  </div>
                ))}
                {inProgress.length === 0 && (
                  <div className="bg-bg-secondary border border-border-primary rounded-2xl p-8 text-center">
                    <p className="text-sm text-text-secondary italic">Aucun cours en cours pour l'instant.</p>
                    <button onClick={() => setActiveTab && setActiveTab('student-catalog')} className="mt-4 inline-flex items-center gap-1.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer">
                      Explorer le catalogue
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming deadlines */}
            <div className="space-y-4">
              <h2 className="font-sans font-bold text-base text-text-primary uppercase tracking-wider">Échéances à venir</h2>
              <div className="space-y-3">
                {upcomingDeadlines.length === 0 && (
                  <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 text-center">
                    <CheckCircle2Icon className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm text-text-secondary">Tout est à jour !</p>
                  </div>
                )}
                {upcomingDeadlines.map((dl) => {
                  const days = daysUntil(dl.dueDate);
                  return (
                    <div key={dl.id} className="bg-bg-secondary border border-border-primary rounded-2xl p-4 shadow-sm space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-xs font-bold text-text-primary line-clamp-2">{dl.assignmentTitle}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${priorityBadge(dl.priority)}`}>{priorityLabel(dl.priority)}</span>
                      </div>
                      <p className="text-[11px] text-text-secondary line-clamp-1">{dl.courseTitle}</p>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <CalendarIcon className="w-3 h-3 text-text-secondary" />
                        <span className={days <= 3 ? 'text-rose-500 font-bold' : 'text-text-secondary'}>
                          {days <= 0 ? 'Aujourd\'hui' : `Dans ${days} jour${days > 1 ? 's' : ''}`} — {fmtDate(dl.dueDate)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* All enrollments */}
          <div className="space-y-4">
            <h2 className="font-sans font-bold text-base text-text-primary uppercase tracking-wider">Tous mes cours</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {MOCK_ENROLLMENTS.map((enr) => (
                <div key={enr.id} className="bg-bg-secondary border border-border-primary rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                  <div className="h-36 overflow-hidden"><img src={enr.image} alt={enr.title} className="w-full h-full object-cover" /></div>
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-sans font-bold text-xs text-text-primary line-clamp-2 flex-1">{enr.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${statusBadge(enr.status)}`}>{statusLabel(enr.status)}</span>
                    </div>
                    <p className="text-[11px] text-text-secondary">{enr.instructor}</p>
                    <div className="mt-auto space-y-1">
                      <div className="flex justify-between text-[10px] text-text-secondary">
                        <span>{enr.completedLessons}/{enr.totalLessons} leçons</span>
                        <span className="font-bold">{enr.progressPercent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-bg-primary rounded-full overflow-hidden">
                        <div className="h-full bg-brand-primary rounded-full" style={{ width: `${enr.progressPercent}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CATALOG VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (activeTab === 'student-catalog') {
    return (
      <div className="bg-bg-primary min-h-screen text-text-primary py-8 px-6 md:px-12 transition-all duration-200">
        <div className="max-w-[1440px] mx-auto space-y-8">

          <div>
            <h1 className="font-sans font-bold text-2xl text-text-primary">Catalogue de Cours</h1>
            <p className="text-sm text-text-secondary mt-1">Explorez notre offre de formations et inscrivez-vous à de nouveaux cours.</p>
          </div>

          {/* Search + Filters */}
          <div className="bg-bg-secondary border border-border-primary rounded-2xl p-5 shadow-sm space-y-4">
            <div className="relative">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/60 w-4 h-4" />
              <input
                type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un cours, instructeur, tag…"
                className="w-full bg-bg-primary border border-border-primary rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-primary text-text-primary"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <FilterIcon className="w-4 h-4 text-text-secondary" />
                <span className="text-xs text-text-secondary font-semibold">Domaine :</span>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button key={cat} onClick={() => setFilterCategory(cat)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${filterCategory === cat ? 'bg-brand-primary text-white border-brand-primary' : 'bg-bg-primary text-text-secondary border-border-primary hover:border-brand-primary hover:text-brand-primary'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary font-semibold">Niveau :</span>
                <div className="flex flex-wrap gap-1.5">
                  {LEVELS.map((lvl) => (
                    <button key={lvl} onClick={() => setFilterLevel(lvl)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${filterLevel === lvl ? 'bg-brand-primary text-white border-brand-primary' : 'bg-bg-primary text-text-secondary border-border-primary hover:border-brand-primary hover:text-brand-primary'}`}>
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xs text-text-secondary">{filteredCatalog.length} cours trouvé{filteredCatalog.length !== 1 ? 's' : ''}</p>
          </div>

          {/* Course grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCatalog.map((course) => {
              const isEnrolled = MOCK_ENROLLMENTS.some((e) => e.courseId === course.id);
              return (
                <div key={course.id} className="bg-bg-secondary border border-border-primary rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
                  <div className="relative h-44 overflow-hidden">
                    <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      {course.isNew && <span className="bg-brand-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Nouveau</span>}
                      {course.isFeatured && <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Populaire</span>}
                    </div>
                    {isEnrolled && (
                      <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2Icon className="w-3 h-3" /> Inscrit
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col gap-3 flex-1">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold text-brand-primary bg-brand-light px-2 py-0.5 rounded-full">{course.category}</span>
                        <span className="text-[10px] text-text-secondary border border-border-primary px-2 py-0.5 rounded-full">{course.level}</span>
                      </div>
                      <h3 className="font-sans font-bold text-sm text-text-primary line-clamp-2">{course.title}</h3>
                      <p className="text-xs text-text-secondary mt-1">{course.instructor}</p>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-text-secondary">
                      <span className="flex items-center gap-1"><StarIcon className="w-3 h-3 text-amber-500 fill-amber-500" /><span className="font-bold text-text-primary">{course.rating}</span></span>
                      <span className="flex items-center gap-1"><UsersIcon className="w-3 h-3" />{course.totalStudents.toLocaleString('fr-FR')}</span>
                      <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3" />{course.duration}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-auto">
                      {course.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[10px] text-text-secondary bg-bg-primary border border-border-primary/50 px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                    <button className={`w-full py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${isEnrolled ? 'bg-bg-primary border border-brand-primary text-brand-primary hover:bg-brand-light' : 'bg-brand-primary hover:bg-brand-hover text-white'}`}>
                      {isEnrolled ? <><PlayCircleIcon className="w-3.5 h-3.5" /> Reprendre</> : <><BookmarkIcon className="w-3.5 h-3.5" /> S'inscrire</>}
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredCatalog.length === 0 && (
              <div className="col-span-full bg-bg-secondary border border-border-primary rounded-2xl p-12 text-center">
                <SearchIcon className="w-10 h-10 text-text-secondary/40 mx-auto mb-3" />
                <p className="text-sm text-text-secondary">Aucun cours ne correspond à votre recherche.</p>
                <button onClick={() => { setSearchQuery(''); setFilterCategory('Tous'); setFilterLevel('Tous niveaux'); }}
                  className="mt-4 text-brand-primary text-xs font-bold hover:underline cursor-pointer">
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PROFILE VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (activeTab === 'student-profile') {
    return (
      <div className="bg-bg-primary min-h-screen text-text-primary py-8 px-6 md:px-12 transition-all duration-200">
        <div className="max-w-3xl mx-auto space-y-8">

          <div>
            <h1 className="font-sans font-bold text-2xl text-text-primary">Mon Profil</h1>
            <p className="text-sm text-text-secondary mt-1">Gérez votre identité publique sur la plateforme.</p>
          </div>

          {/* Avatar + identity */}
          <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-brand-light border border-brand-primary/30 flex items-center justify-center overflow-hidden">
                  {profile.avatarUrl
                    ? <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                    : <span className="text-4xl font-bold text-brand-primary">{profile.name.charAt(0)}</span>}
                </div>
                <button onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-primary hover:bg-brand-hover text-white rounded-full flex items-center justify-center shadow-md cursor-pointer transition-colors">
                  <CameraIcon className="w-3.5 h-3.5" />
                </button>
                <input ref={avatarInputRef} type="file" className="hidden" accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setProfile((p) => ({ ...p, avatarUrl: URL.createObjectURL(f) }));
                  }} />
              </div>

              {/* Identity */}
              <div className="flex-1 space-y-1">
                {editProfile ? (
                  <input value={draftName} onChange={(e) => setDraftName(e.target.value)}
                    className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-lg font-bold text-text-primary outline-none focus:ring-2 focus:ring-brand-primary" />
                ) : (
                  <h2 className="text-xl font-bold text-text-primary">{profile.name}</h2>
                )}
                <p className="text-sm text-text-secondary">{profile.email}</p>
                <p className="text-xs text-text-secondary">Inscrit depuis le {fmtDate(profile.joinedAt)}</p>
              </div>

              <button onClick={() => { setEditProfile(!editProfile); setDraftName(profile.name); setDraftBio(profile.bio); }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:text-brand-hover border border-brand-primary/30 hover:border-brand-primary px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0">
                <PencilIcon className="w-3.5 h-3.5" /> {editProfile ? 'Annuler' : 'Modifier'}
              </button>
            </div>
          </div>

          {/* Bio */}
          <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-sans font-bold text-sm text-text-primary uppercase tracking-wider">Biographie</h3>
            {editProfile ? (
              <textarea value={draftBio} onChange={(e) => setDraftBio(e.target.value)} rows={4}
                placeholder="Parlez-nous de vous, de vos objectifs et de vos centres d'intérêt…"
                className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:ring-2 focus:ring-brand-primary resize-none" />
            ) : (
              <p className="text-sm text-text-secondary leading-relaxed">{profile.bio || 'Aucune biographie ajoutée.'}</p>
            )}
            {editProfile && (
              <div className="flex items-center gap-3">
                <button onClick={handleSaveProfile}
                  className="inline-flex items-center gap-1.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors cursor-pointer">
                  <SaveIcon className="w-3.5 h-3.5" /> Enregistrer les modifications
                </button>
                {profileSaved && <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2Icon className="w-3.5 h-3.5" /> Profil mis à jour</span>}
              </div>
            )}
            {!editProfile && profileSaved && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2Icon className="w-3.5 h-3.5" /> Profil mis à jour</span>
            )}
          </div>

          {/* Certificates preview */}
          <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-sans font-bold text-sm text-text-primary uppercase tracking-wider">Certificats obtenus</h3>
              <button onClick={() => setActiveTab && setActiveTab('student-certificates')}
                className="text-xs text-brand-primary hover:underline font-bold cursor-pointer flex items-center gap-1">
                Voir tous <ChevronRightIcon className="w-3 h-3" />
              </button>
            </div>
            {MOCK_CERTIFICATES.length === 0
              ? <p className="text-sm text-text-secondary italic">Aucun certificat pour le moment.</p>
              : <div className="flex flex-wrap gap-3">
                  {MOCK_CERTIFICATES.map((cert) => (
                    <div key={cert.id} className="flex items-center gap-2 bg-bg-primary border border-border-primary rounded-xl px-4 py-2.5">
                      <AwardIcon className="w-4 h-4 text-amber-500" />
                      <div>
                        <p className="text-xs font-bold text-text-primary line-clamp-1">{cert.courseTitle}</p>
                        <p className="text-[10px] text-text-secondary">{fmtDate(cert.issueDate)}</p>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>

        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CERTIFICATES VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (activeTab === 'student-certificates') {
    return (
      <div className="bg-bg-primary min-h-screen text-text-primary py-8 px-6 md:px-12 transition-all duration-200">
        <div className="max-w-[1440px] mx-auto space-y-8">

          <div>
            <h1 className="font-sans font-bold text-2xl text-text-primary">Mes Certificats</h1>
            <p className="text-sm text-text-secondary mt-1">Téléchargez vos certificats ou partagez-les directement sur LinkedIn.</p>
          </div>

          {MOCK_CERTIFICATES.length === 0 ? (
            <div className="bg-bg-secondary border border-border-primary rounded-2xl p-12 text-center space-y-4">
              <AwardIcon className="w-14 h-14 text-text-secondary/30 mx-auto" />
              <p className="text-text-secondary text-sm">Vous n'avez pas encore obtenu de certificat.</p>
              <p className="text-text-secondary/60 text-xs">Terminez un cours pour recevoir votre certificat de réussite.</p>
              <button onClick={() => setActiveTab && setActiveTab('student-catalog')}
                className="inline-flex items-center gap-1.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors cursor-pointer">
                Explorer le catalogue
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {MOCK_CERTIFICATES.map((cert) => (
                <div key={cert.id} className="bg-bg-secondary border border-border-primary rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                  {/* Certificate card visual */}
                  <div className="bg-gradient-to-br from-brand-primary/20 via-brand-light to-purple-500/10 p-8 flex flex-col items-center text-center border-b border-border-primary space-y-3">
                    <div className="w-16 h-16 bg-amber-500/10 border-2 border-amber-400/40 rounded-full flex items-center justify-center">
                      <AwardIcon className="w-8 h-8 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Certificat de Réussite</p>
                      <h3 className="font-sans font-bold text-base text-text-primary leading-tight">{cert.courseTitle}</h3>
                      <p className="text-xs text-text-secondary mt-1">{cert.instructor}</p>
                    </div>
                    <div className="bg-bg-secondary/60 border border-border-primary/50 rounded-lg px-3 py-1.5 text-[10px] font-mono text-text-secondary">
                      {cert.credentialId}
                    </div>
                  </div>

                  {/* Meta + actions */}
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-center text-xs text-text-secondary">
                      <span className="flex items-center gap-1"><CalendarIcon className="w-3.5 h-3.5" /> Délivré le {fmtDate(cert.issueDate)}</span>
                      <span className="bg-brand-light text-brand-primary font-bold px-2 py-0.5 rounded-full text-[10px]">{cert.category}</span>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 flex items-center justify-center gap-1.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold py-2.5 rounded-lg transition-colors cursor-pointer">
                        <DownloadIcon className="w-3.5 h-3.5" /> Télécharger PDF
                      </button>
                      <button
                        onClick={() => window.open(`https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(cert.courseTitle)}&organizationId=idla&issueYear=${new Date(cert.issueDate).getFullYear()}&certUrl=https://idla.education/verify/${cert.credentialId}`, '_blank')}
                        className="flex items-center justify-center gap-1.5 bg-[#0077B5] hover:bg-[#005f91] text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
                        title="Ajouter sur LinkedIn"
                      >
                        <LinkedinIcon className="w-3.5 h-3.5" />
                      </button>
                      <button className="flex items-center justify-center gap-1.5 bg-bg-primary hover:bg-bg-secondary border border-border-primary text-text-secondary hover:text-text-primary text-xs font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer" title="Partager">
                        <ShareIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Courses in progress that will earn certificates */}
          {inProgress.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-sans font-bold text-sm text-text-primary uppercase tracking-wider">En route vers vos prochains certificats</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inProgress.map((enr) => (
                  <div key={enr.id} className="bg-bg-secondary border border-border-primary rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                      <AwardIcon className="w-6 h-6 text-amber-500/50" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p className="text-sm font-bold text-text-primary line-clamp-1">{enr.title}</p>
                      <div className="w-full h-1.5 bg-bg-primary rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${enr.progressPercent}%` }} />
                      </div>
                      <p className="text-[11px] text-text-secondary">{enr.progressPercent}% complété — {enr.totalLessons - enr.completedLessons} leçon{enr.totalLessons - enr.completedLessons !== 1 ? 's' : ''} restante{enr.totalLessons - enr.completedLessons !== 1 ? 's' : ''}</p>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-text-secondary shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ACCOUNT SETTINGS VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (activeTab === 'student-settings') {
    return (
      <div className="bg-bg-primary min-h-screen text-text-primary py-8 px-6 md:px-12 transition-all duration-200">
        <div className="max-w-3xl mx-auto space-y-8">

          <div>
            <h1 className="font-sans font-bold text-2xl text-text-primary">Paramètres du Compte</h1>
            <p className="text-sm text-text-secondary mt-1">Gérez la sécurité, les notifications et la langue de votre espace étudiant.</p>
          </div>

          {/* Settings tabs */}
          <div className="flex gap-2 border-b border-border-primary pb-0">
            {([ ['security', 'Sécurité', LockIcon], ['notifications', 'Notifications', BellIcon], ['language', 'Langue', GlobeIcon] ] as const).map(([id, label, Icon]) => (
              <button key={id} onClick={() => setSettingsTab(id as any)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer -mb-px ${settingsTab === id ? 'border-brand-primary text-brand-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>

          {/* Security — change password */}
          {settingsTab === 'security' && (
            <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="font-sans font-bold text-sm text-text-primary">Adresse e-mail</h3>
                <div className="mt-3 flex items-center gap-3">
                  <div className="relative flex-1">
                    <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/60 w-4 h-4" />
                    <input type="email" defaultValue={profile.email} readOnly
                      className="w-full bg-bg-primary border border-border-primary rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary opacity-70 cursor-not-allowed" />
                  </div>
                  <button className="text-xs font-bold text-brand-primary hover:underline cursor-pointer shrink-0">Modifier</button>
                </div>
                <p className="text-[11px] text-text-secondary mt-1.5">La modification de l'adresse e-mail nécessite une vérification.</p>
              </div>

              <div className="border-t border-border-primary/40 pt-6">
                <h3 className="font-sans font-bold text-sm text-text-primary mb-4">Changer le mot de passe</h3>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Mot de passe actuel</label>
                    <div className="relative">
                      <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/60 w-4 h-4" />
                      <input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} placeholder="Votre mot de passe actuel"
                        className="w-full bg-bg-primary border border-border-primary rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-primary text-text-primary" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Nouveau mot de passe</label>
                      <div className="relative">
                        <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/60 w-4 h-4" />
                        <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="Min. 8 caractères"
                          className="w-full bg-bg-primary border border-border-primary rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-primary text-text-primary" required />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Confirmer</label>
                      <div className="relative">
                        <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/60 w-4 h-4" />
                        <input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} placeholder="Même mot de passe"
                          className="w-full bg-bg-primary border border-border-primary rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-primary text-text-primary" required />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <button type="submit" disabled={isUpdatingPwd}
                      className="inline-flex items-center gap-1.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-60">
                      <SaveIcon className="w-3.5 h-3.5" /> {isUpdatingPwd ? 'Modification…' : 'Modifier le mot de passe'}
                    </button>
                    {pwdError && <p className="text-xs text-red-600 font-semibold flex items-center gap-1"><AlertCircleIcon className="w-3.5 h-3.5" />{pwdError}</p>}
                    {pwdSuccess && <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2Icon className="w-3.5 h-3.5" />{pwdSuccess}</p>}
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Notifications */}
          {settingsTab === 'notifications' && (
            <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 shadow-sm space-y-6">
              <p className="text-sm text-text-secondary">Choisissez les événements pour lesquels vous souhaitez recevoir des notifications.</p>
              {([
                { key: 'email', label: 'Notifications par e-mail', desc: 'Recevoir un e-mail pour les mises à jour importantes de votre compte.', value: notifEmail, setter: setNotifEmail },
                { key: 'deadlines', label: 'Rappels d\'échéances', desc: 'Être notifié 48h avant la date limite d\'un devoir.', value: notifDeadlines, setter: setNotifDeadlines },
                { key: 'news', label: 'Nouveautés & Actualités', desc: 'Recevoir les dernières nouvelles de l\'IDLA et les nouveaux cours.', value: notifNews, setter: setNotifNews },
              ]).map(({ key, label, desc, value, setter }) => (
                <div key={key} className="flex items-center justify-between gap-6 pb-5 border-b border-border-primary/30 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-bold text-text-primary">{label}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{desc}</p>
                  </div>
                  <button onClick={() => setter(!value)} role="switch" aria-checked={value}
                    className={`relative shrink-0 w-11 h-6 rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-bg-secondary ${value ? 'bg-brand-primary' : 'bg-border-primary'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Language */}
          {settingsTab === 'language' && (
            <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 shadow-sm space-y-5">
              <p className="text-sm text-text-secondary">Choisissez la langue d'affichage de l'interface.</p>
              <div className="flex flex-col gap-3">
                {LANGUAGES_UI.map(({ value, label }) => (
                  <label key={value} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${selectedLang === value ? 'border-brand-primary bg-brand-light' : 'border-border-primary hover:border-brand-primary/50'}`}>
                    <input type="radio" name="language" value={value} checked={selectedLang === value} onChange={() => setSelectedLang(value as 'fr' | 'en')} className="accent-brand-primary w-4 h-4" />
                    <div>
                      <p className="text-sm font-bold text-text-primary">{label}</p>
                      <p className="text-xs text-text-secondary">{value === 'fr' ? 'Interface entièrement en français' : 'Switch the interface to English'}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleSaveLanguage}
                  className="inline-flex items-center gap-1.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors cursor-pointer">
                  <SaveIcon className="w-3.5 h-3.5" /> Appliquer
                </button>
                {langSaved && <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2Icon className="w-3.5 h-3.5" /> Préférence enregistrée</span>}
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  // Fallback — redirect to dashboard for any unknown student tab
  return null;
}
