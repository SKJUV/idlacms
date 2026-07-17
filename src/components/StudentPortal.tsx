import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  LockIcon, MailIcon, AlertCircleIcon, CheckCircle2Icon,
  ArrowLeftIcon, ChevronRightIcon, AwardIcon, PlayCircleIcon, BookmarkIcon,
  LinkedinIcon, DownloadIcon, FilterIcon, StarIcon, CalendarIcon, SearchIcon,
  BellIcon, SaveIcon, ClockIcon, BookOpenIcon,
  ShareIcon, GlobeIcon, CameraIcon, PencilIcon, UsersIcon, SettingsIcon,
  SendIcon, MessageSquareIcon, UploadIcon, FileTextIcon,
} from './Icons';
import { account, databases, storage, APPWRITE_CONFIG, isAppwriteDbConfigured, isAppwriteStorageConfigured, ID, Query } from '../lib/appwrite';
import {
  CourseEnrollment, AssignmentDeadline, Certificate,
  StudentProfile, CourseCatalogItem,
} from '../types';
import { programsData } from '../data/mockData';

// ─── Constantes ────────────────────────────────────────────────────────────────

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
];

const MOCK_DEADLINES: AssignmentDeadline[] = [
  { id: 'dl-1', courseId: 'c-1', courseTitle: 'Intelligence Artificielle : Fondamentaux', assignmentTitle: "Projet CNN — Classification d'images", dueDate: '2026-07-20', isSubmitted: false, priority: 'high' },
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
  bio: "Étudiante en Master IA & Sciences des Données. Passionnée par l'application de l'intelligence artificielle aux enjeux de santé en Afrique.",
  language: 'fr', joinedAt: '2025-09-01',
};

const CATEGORIES = ['Tous', 'Tech', 'Management', 'Droit', 'Santé', 'Sciences', 'Communication'];
const LEVELS = ['Tous niveaux', 'Débutant', 'Intermédiaire', 'Avancé'];
const LANGUAGES_UI = [{ value: 'fr', label: 'Français' }, { value: 'en', label: 'English' }];

// ─── Helpers ───────────────────────────────────────────────────────────────────

const daysUntil = (isoDate: string) => Math.ceil((new Date(isoDate).getTime() - Date.now()) / 86400000);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

const fmtSize = (bytes?: number) => {
  if (!bytes) return '—';
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fmtDateTime = (iso?: string) => {
  if (!iso) return 'À l\'instant';
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

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

const appStatusBadge = (s: string) => {
  if (s === 'Accepted') return { cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20', label: 'Admis ✓' };
  if (s === 'Rejected') return { cls: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20', label: 'Non retenu' };
  if (s === 'In Review') return { cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', label: 'En examen' };
  return { cls: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20', label: 'Nouveau' };
};

// ─── Props ─────────────────────────────────────────────────────────────────────

interface StudentPortalProps {
  onBackToHome: () => void;
  onLoginSuccess: () => void;
  isLoggedIn: boolean;
  knownEmail?: string;
  knownName?: string;
  activeTab?: string;
  setActiveTab?: (tab: any) => void;
  programs?: any[];
  onApplyNow?: (programTitle?: string) => void;
}

// ─── Composant Principal ────────────────────────────────────────────────────────

export default function StudentPortal({
  onBackToHome, onLoginSuccess, isLoggedIn, knownEmail, knownName, activeTab, setActiveTab, programs, onApplyNow,
}: StudentPortalProps) {

  // ── Login ──
  const [email, setEmail] = useState(knownEmail || '');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState(knownEmail || '');

  // ── Applications réelles Appwrite ──
  const [applications, setApplications] = useState<any[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);

  // ── Suivi de candidature et messagerie intégrés ──
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [candidateDocs, setCandidateDocs] = useState<any[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [activeUploadType, setActiveUploadType] = useState<'cni' | 'diplome' | null>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Profile ──
  const [profile, setProfile] = useState<StudentProfile>(() => ({
    ...MOCK_PROFILE,
    ...(knownName ? { name: knownName } : {}),
    ...(knownEmail ? { email: knownEmail } : {}),
  }));
  const [editProfile, setEditProfile] = useState(false);
  const [draftName, setDraftName] = useState(knownName || MOCK_PROFILE.name);
  const [draftBio, setDraftBio] = useState(MOCK_PROFILE.bio);
  const [profileSaved, setProfileSaved] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // ── Paramètres ──
  const [settingsTab, setSettingsTab] = useState<'security' | 'notifications' | 'language'>('security');
  const [mustChangePwd, setMustChangePwd] = useState(false);
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

  // ── Catalogue ──
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('Tous');
  const [filterLevel, setFilterLevel] = useState('Tous niveaux');

  // ── Programmes : section active ──
  const [progSection, setProgSection] = useState<'mes-candidatures' | 'explorer'>('mes-candidatures');

  // ── Soumission de candidature depuis le catalogue étudiant (Wizard en 3 étapes) ──
  const [applyingProgram, setApplyingProgram] = useState<{ title: string; category?: string; duration?: string } | null>(null);
  const [applyStep, setApplyStep] = useState<number>(1);
  const [applySession, setApplySession] = useState("Session d'Octobre 2026");
  const [applyMotivation, setApplyMotivation] = useState('');
  const [applyCniFile, setApplyCniFile] = useState<File | null>(null);
  const [applyDiplomaFile, setApplyDiplomaFile] = useState<File | null>(null);
  const [applyResumeFile, setApplyResumeFile] = useState<File | null>(null);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [applySuccessProgram, setApplySuccessProgram] = useState<string | null>(null);

  // ── Charger le profil et les candidatures réelles depuis Appwrite ──
  useEffect(() => {
    if (!isLoggedIn) return;

    const initStudentData = async () => {
      setAppsLoading(true);
      try {
        const prefs = await account.getPrefs().catch(() => null);
        setMustChangePwd(!!prefs?.mustChangePassword);

        const u = await account.get();
        const userEmail = u.email.toLowerCase().trim();
        
        // Priorité : knownName (saisi dans le formulaire) > nom Appwrite > profil actuel
        const resolvedName = knownName || u.name || profile.name;
        setProfile((p) => ({ ...p, email: userEmail, name: resolvedName }));
        setDraftName(resolvedName);

        if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.applications) {
          const res = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.applications,
            [Query.equal('email', userEmail)]
          );
          setApplications(res.documents);
        }
      } catch (err) {
        console.warn("Erreur lors de l'initialisation du portail étudiant :", err);
      } finally {
        setAppsLoading(false);
      }
    };

    initStudentData();
  }, [isLoggedIn]);

  // ── Auto-scroll du chat ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // ── Charger les documents et messages de la candidature sélectionnée ──
  useEffect(() => {
    if (!selectedAppId || !isLoggedIn) return;

    const loadDossierDetails = async () => {
      try {
        // 1. Charger les documents
        if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.candidateDocuments) {
          const docsRes = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.candidateDocuments,
            [Query.equal('applicationId', selectedAppId)]
          );
          setCandidateDocs(docsRes.documents.map((d: any) => ({
            id: d.$id,
            name: d.name,
            size: fmtSize(d.sizeBytes),
            date: fmtDateTime(d.uploadedAt),
          })));
        } else {
          setCandidateDocs([]);
        }

        // 2. Charger les messages du chat
        if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.messages) {
          const msgRes = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.messages,
            [Query.equal('applicationId', selectedAppId), Query.orderAsc('createdAt')]
          );
          if (msgRes.documents.length > 0) {
            setChatHistory(msgRes.documents.map((m: any) => ({
              sender: m.sender,
              text: m.text,
              time: fmtDateTime(m.createdAt),
            })));
          } else {
            setChatHistory([
              { sender: 'advisor', text: 'Bonjour, j\'ai bien reçu votre dossier. N\'hésitez pas à me contacter ici pour toute question sur votre candidature.', time: 'Aujourd\'hui' }
            ]);
          }
        }
      } catch (err) {
        console.warn("Impossible de charger les détails du dossier:", err);
      }
    };

    loadDossierDetails();
  }, [selectedAppId, isLoggedIn]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedAppId) return;

    const text = chatMessage;
    setChatMessage('');
    const userMsg = { sender: 'candidate' as const, text, time: 'À l\'instant' };
    setChatHistory((curr) => [...curr, userMsg]);

    const canPersist = isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.messages;
    if (canPersist) {
      try {
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.messages,
          ID.unique(),
          { applicationId: selectedAppId, sender: 'candidate', text, createdAt: new Date().toISOString() }
        );
      } catch (err) {
        console.error("Échec de l'enregistrement du message sur Appwrite:", err);
      }
    }

    // Réponse automatique de Sophie Vallet
    setTimeout(async () => {
      const replyText = 'Merci beaucoup pour votre message ! Je transmets immédiatement votre dossier au jury d\'admission pour étude approfondie. Je vous recontacte dès que possible.';
      setChatHistory((curr) => [...curr, { sender: 'advisor' as const, text: replyText, time: 'À l\'instant' }]);
      if (canPersist) {
        try {
          await databases.createDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.messages,
            ID.unique(),
            { applicationId: selectedAppId, sender: 'advisor', text: replyText, createdAt: new Date().toISOString() }
          );
        } catch (err) {
          console.error("Échec de l'enregistrement de la réponse sur Appwrite:", err);
        }
      }
    }, 1500);
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0 && selectedAppId && activeUploadType) {
      const file = selectedFiles[0];
      setIsUploadingDoc(true);
      const docType = activeUploadType;
      const prefixedName = docType === 'cni' ? `[CNI] ${file.name}` : `[Diplôme] ${file.name}`;

      try {
        let fileId = '';
        if (isAppwriteStorageConfigured()) {
          const response = await storage.createFile(
            APPWRITE_CONFIG.buckets.documents,
            ID.unique(),
            file
          );
          fileId = response.$id;
        }

        if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.candidateDocuments) {
          await databases.createDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.candidateDocuments,
            ID.unique(),
            {
              applicationId: selectedAppId,
              fileId,
              name: prefixedName,
              sizeBytes: file.size,
              mimeType: file.type,
              uploadedBy: 'candidate',
              uploadedAt: new Date().toISOString(),
            }
          );
        }

        setCandidateDocs((curr) => {
          const filtered = curr.filter(d => {
            if (docType === 'cni') return !d.name.startsWith('[CNI]');
            return !d.name.startsWith('[Diplôme]');
          });
          return [
            ...filtered,
            { name: prefixedName, size: fmtSize(file.size), date: 'À l\'instant' }
          ];
        });
      } catch (err: any) {
        console.error("Échec du téléversement sur Appwrite:", err);
      } finally {
        setIsUploadingDoc(false);
      }
    }
  };

  const handleConfirmApplication = async () => {
    if (!applyingProgram) return;
    setIsSubmittingApplication(true);
    setApplyError('');

    try {
      const user = await account.get().catch(() => null);
      const userEmail = profile.email || user?.email || knownEmail || '';
      if (!userEmail) {
        setApplyError("Impossible d'identifier votre compte. Veuillez vous reconnecter.");
        setIsSubmittingApplication(false);
        return;
      }

      let newAppId = `app_${Date.now()}`;

      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.applications) {
        // Vérifier si un dossier initial d'inscription (sans programme ou 'Inscription seule') existe
        const blankApp = applications.find((a) => !a.program || a.program === 'Inscription seule');
        if (blankApp) {
          newAppId = blankApp.$id || blankApp.id;
          const updatedDoc = await databases.updateDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.applications,
            newAppId,
            {
              program: applyingProgram.title,
              dateApplied: new Date().toISOString(),
              status: 'New',
              motivation: `${applySession} | ${applyMotivation}`.trim(),
            }
          );
          setApplications((apps) =>
            apps.map((a) => ((a.$id === blankApp.$id || a.id === blankApp.id) ? { ...a, ...updatedDoc, program: applyingProgram.title } : a))
          );
        } else {
          // Créer une nouvelle candidature pour ce programme spécifique
          const createdDoc = await databases.createDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.applications,
            ID.unique(),
            {
              firstName: profile.name.split(' ')[0] || profile.name,
              lastName: profile.name.split(' ').slice(1).join(' ') || '',
              name: profile.name,
              email: userEmail,
              phone: profile.phone || '',
              program: applyingProgram.title,
              dateApplied: new Date().toISOString(),
              status: 'New',
              motivation: `${applySession} | ${applyMotivation}`.trim(),
              initials: profile.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2),
            }
          );
          newAppId = createdDoc.$id || createdDoc.id;
          setApplications((apps) => [createdDoc, ...apps]);
        }

        // ── Enregistrement des documents joints dans Appwrite candidateDocuments ──
        if (APPWRITE_CONFIG.collections.candidateDocuments) {
          const docsToUpload = [
            { file: applyCniFile, prefix: '[CNI]' },
            { file: applyDiplomaFile, prefix: '[Diplôme]' },
            { file: applyResumeFile, prefix: '[CV]' }
          ].filter(item => item.file !== null);

          for (const item of docsToUpload) {
            if (!item.file) continue;
            try {
              let fileUrl = '#';
              if (APPWRITE_CONFIG.buckets?.documents) {
                const uploadedFile = await storage.createFile(
                  APPWRITE_CONFIG.buckets.documents,
                  ID.unique(),
                  item.file
                );
                fileUrl = storage.getFileView(APPWRITE_CONFIG.buckets.documents, uploadedFile.$id).toString();
              }
              await databases.createDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.candidateDocuments,
                ID.unique(),
                {
                  applicationId: newAppId,
                  name: `${item.prefix} ${item.file.name}`,
                  url: fileUrl,
                  uploadedAt: new Date().toISOString(),
                  sizeBytes: item.file.size,
                }
              );
            } catch (docErr) {
              console.warn(`Erreur lors de l'enregistrement du document ${item.file.name}:`, docErr);
            }
          }
        }
      } else {
        const mockNewApp = {
          id: newAppId,
          name: profile.name,
          email: profile.email,
          program: applyingProgram.title,
          dateApplied: new Date().toISOString(),
          status: 'New' as const,
          initials: profile.name.slice(0, 2).toUpperCase(),
          motivation: `${applySession} | ${applyMotivation}`.trim(),
        };
        setApplications((apps) => [mockNewApp, ...apps]);
      }

      const submittedTitle = applyingProgram.title;
      setApplySuccessProgram(submittedTitle);
      setApplyingProgram(null);
      setApplyStep(1);
      setApplyMotivation('');
      setApplyCniFile(null);
      setApplyDiplomaFile(null);
      setApplyResumeFile(null);
      setProgSection('mes-candidatures');
    } catch (err: any) {
      console.error("Erreur lors de la soumission de candidature :", err);
      setApplyError(err?.message || "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  // ── Handlers ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);
    try {
      await account.deleteSession({ sessionId: 'current' }).catch(() => undefined);
      await account.createEmailPasswordSession({ email, password });
      sessionStorage.setItem('idla_portal_session_email', email.trim().toLowerCase());
      onLoginSuccess();
    } catch (err: any) {
      if (err.type === 'project_paused' || err.code === 403) {
        setLoginError('Le serveur est suspendu. Veuillez le restaurer depuis la console Appwrite.');
      } else {
        setLoginError('Identifiants incorrects ou serveur inaccessible.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      await account.createRecovery({
        email: resetEmail,
        url: `${window.location.origin}/reinitialisation`,
      });
      setResetSent(true);
    } catch (err: any) {
      setLoginError("Impossible d'envoyer l'e-mail de réinitialisation. Vérifiez l'adresse saisie.");
    } finally {
      setResetLoading(false);
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
    if (newPwd.length < 8) { setPwdError('Min. 8 caractères requis.'); return; }
    if (newPwd !== confirmPwd) { setPwdError('Les mots de passe ne correspondent pas.'); return; }
    setIsUpdatingPwd(true);
    try {
      await account.updatePassword({ password: newPwd, oldPassword: currentPwd });
      await account.updatePrefs({ mustChangePassword: false });
      setMustChangePwd(false);
      setPwdSuccess('Mot de passe modifié avec succès !');
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

  // ── Données dérivées ──
  const enrollments = applications
    .filter((app) => app.status === 'Accepted')
    .map((app) => {
      const progDetail = (programs || []).find((p) => p.title === app.program);
      return {
        id: app.$id,
        courseId: progDetail?.id || app.$id,
        title: app.program,
        instructor: 'Jury académique IDLA',
        category: progDetail?.category || 'Formation',
        level: 'Tous niveaux',
        duration: progDetail?.duration || '12 mois',
        progressPercent: 0,
        status: 'en cours' as const,
        enrolledAt: app.dateApplied || app.$createdAt,
        image: progDetail?.image || 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
      };
    });

  const inProgress = enrollments;
  const completed: any[] = [];
  const upcomingDeadlines: any[] = [];

  const filteredCatalog = (programs || []).filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchQ = !q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
    const matchCat = filterCategory === 'Tous' || c.category === filterCategory;
    return matchQ && matchCat;
  });

  // Programmes IDLA complets depuis la base de données (pour la section "Explorer")
  const allPrograms = programs || [];

  // ════════════════════════════════════════════════════════════════════════════
  // LOGIN VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (!isLoggedIn) {
    if (showReset) {
      return (
        <div className="bg-bg-primary min-h-screen flex items-center justify-center py-12 px-6 relative overflow-hidden text-text-primary">
          <div className="absolute inset-0 opacity-10 pointer-events-none z-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-primary blur-[150px] rounded-full" />
          </div>
          <div className="max-w-md w-full bg-bg-secondary rounded-2xl border border-border-primary p-8 shadow-2xl relative z-10 space-y-6">
            <div className="text-center space-y-2">
              <button onClick={() => setShowReset(false)} className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-brand-primary transition-colors mb-4 border border-border-primary px-3 py-1 rounded cursor-pointer">
                <ArrowLeftIcon className="w-3 h-3" /> Retour à la connexion
              </button>
              <div className="w-12 h-12 bg-brand-light rounded-xl flex items-center justify-center text-2xl mx-auto">🔑</div>
              <h1 className="font-sans font-bold text-2xl text-text-primary">Mot de passe oublié</h1>
              <p className="text-text-secondary text-xs">Saisissez votre adresse e-mail pour recevoir un lien de réinitialisation.</p>
            </div>
            {resetSent ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm font-semibold text-center space-y-2">
                <CheckCircle2Icon className="w-8 h-8 mx-auto" />
                <p>E-mail envoyé ! Vérifiez votre boîte mail et cliquez sur le lien reçu.</p>
                <button onClick={() => { setShowReset(false); setResetSent(false); }} className="text-xs text-brand-primary hover:underline cursor-pointer">Retour à la connexion</button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                {loginError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-700 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
                    <AlertCircleIcon className="w-4 h-4 shrink-0" /><span>{loginError}</span>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Adresse email</label>
                  <div className="relative">
                    <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/60 w-4 h-4" />
                    <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="Votre adresse email"
                      className="w-full bg-bg-primary border border-border-primary rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-primary outline-none text-text-primary font-medium" required />
                  </div>
                </div>
                <button type="submit" disabled={resetLoading}
                  className="w-full bg-brand-primary hover:bg-brand-hover text-white py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60">
                  {resetLoading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
                </button>
              </form>
            )}
          </div>
        </div>
      );
    }

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
            <p className="text-text-secondary text-xs">Accédez à vos cours, candidatures et progression</p>
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
                <button type="button" onClick={() => { setResetEmail(email); setShowReset(true); setLoginError(''); }}
                  className="text-[10px] text-brand-primary hover:underline font-bold cursor-pointer">Oublié ?</button>
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

  // ── Banner mustChangePassword (affiché sur toutes les vues authentifiées) ──
  const MustChangePwdBanner = mustChangePwd ? (
    <div className="bg-amber-500/10 border-2 border-amber-500 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
          <LockIcon className="w-4 h-4" />
        </div>
        <div>
          <p className="font-bold text-sm text-amber-700 dark:text-amber-400">⚠️ Mot de passe temporaire actif</p>
          <p className="text-xs text-text-secondary mt-0.5">Pour sécuriser votre compte, modifiez votre mot de passe dès maintenant.</p>
        </div>
      </div>
      <button onClick={() => { setSettingsTab('security'); setActiveTab && setActiveTab('student-settings'); }}
        className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5">
        <LockIcon className="w-3.5 h-3.5" /> Modifier maintenant
      </button>
    </div>
  ) : null;

  // ── Helper pour rendre les modales de candidature (Wizard & Succès) dans chaque onglet ──
  const renderApplicationModals = () => (
    <>
      {/* ── Modale de candidature (Wizard 3 étapes) ── */}
      {applyingProgram && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bg-secondary border border-border-primary rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-primary/40 pb-3">
              <div>
                <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
                  🎓 Soumettre ma candidature
                </h3>
                <p className="text-[11px] font-semibold text-brand-primary mt-0.5">
                  {applyStep === 1 && "Étape 1 sur 3 — Choix de session & Motivation"}
                  {applyStep === 2 && "Étape 2 sur 3 — Pièces justificatives du dossier"}
                  {applyStep === 3 && "Étape 3 sur 3 — Validation sur l'honneur"}
                </p>
              </div>
              <button 
                onClick={() => { setApplyingProgram(null); setApplyError(''); setApplyStep(1); }}
                className="text-text-secondary hover:text-text-primary text-sm font-bold p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Barre de progression */}
            <div className="w-full bg-border-primary/30 h-1.5 rounded-full overflow-hidden flex">
              <div className={`bg-brand-primary h-full transition-all duration-300 ${applyStep === 1 ? 'w-1/3' : applyStep === 2 ? 'w-2/3' : 'w-full'}`} />
            </div>

            {/* ── Étape 1 : Programme & Session ── */}
            {applyStep === 1 && (
              <div className="space-y-4 text-xs text-text-secondary">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Formation sélectionnée</span>
                  <div className="mt-1 p-3 bg-brand-light/40 border border-brand-primary/30 rounded-xl text-text-primary font-bold text-sm">
                    ▸ {applyingProgram.title}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-text-primary uppercase text-[10px] tracking-wider">
                    Rentrée universitaire souhaitée *
                  </label>
                  <select
                    value={applySession}
                    onChange={(e) => setApplySession(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-bg-primary border border-border-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs text-text-primary font-semibold cursor-pointer"
                  >
                    <option value="Session d'Octobre 2026">Session d'Octobre 2026 (Rentée principale)</option>
                    <option value="Session de Janvier 2027">Session de Janvier 2027 (Rentrée d'hiver)</option>
                    <option value="Session d'Avril 2027">Session d'Avril 2027 (Rentrée de printemps)</option>
                    <option value="Rentrées permanentes (E-learning)">Rentrée immédiate en continu (E-learning libre)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-text-primary uppercase text-[10px] tracking-wider">
                    Motivation / Objectif professionnel (Optionnel)
                  </label>
                  <textarea
                    value={applyMotivation}
                    onChange={(e) => setApplyMotivation(e.target.value)}
                    placeholder="Pourquoi souhaitez-vous suivre cette formation ? Quels sont vos objectifs à l'issue du cursus ?"
                    rows={4}
                    className="w-full p-2.5 rounded-lg bg-bg-primary border border-border-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs text-text-primary resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3 border-t border-border-primary/40">
                  <button
                    onClick={() => { setApplyingProgram(null); setApplyStep(1); }}
                    className="px-4 py-2 border border-border-primary rounded-xl text-xs font-bold text-text-secondary hover:bg-bg-primary transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => setApplyStep(2)}
                    className="px-6 py-2 bg-brand-primary hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    Étape suivante →
                  </button>
                </div>
              </div>
            )}

            {/* ── Étape 2 : Dépôt des documents ── */}
            {applyStep === 2 && (
              <div className="space-y-4 text-xs text-text-secondary">
                <div className="bg-amber-500/10 border-l-4 border-amber-500 p-3 rounded text-amber-800 dark:text-amber-300 text-[11px] font-medium leading-relaxed">
                  📎 Pour que votre admissibilité soit prononcée par le jury, veuillez joindre vos justificatifs (formats PDF, JPG ou PNG acceptés, max 10 Mo par fichier).
                </div>

                <div className="space-y-3">
                  {/* CNI */}
                  <div className="p-3 bg-bg-primary border border-border-primary rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text-primary text-xs flex items-center gap-1.5">
                        🪪 Pièce d'identité (CNI ou Passeport) *
                      </span>
                      {applyCniFile && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2Icon className="w-3 h-3" /> Fichier sélectionné
                        </span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setApplyCniFile(e.target.files?.[0] || null)}
                      className="w-full text-[11px] text-text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20 cursor-pointer"
                    />
                  </div>

                  {/* Diplôme */}
                  <div className="p-3 bg-bg-primary border border-border-primary rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text-primary text-xs flex items-center gap-1.5">
                        🎓 Dernier Diplôme obtenu ou Attestation *
                      </span>
                      {applyDiplomaFile && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2Icon className="w-3 h-3" /> Fichier sélectionné
                        </span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setApplyDiplomaFile(e.target.files?.[0] || null)}
                      className="w-full text-[11px] text-text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20 cursor-pointer"
                    />
                  </div>

                  {/* CV ou Relevés de notes */}
                  <div className="p-3 bg-bg-primary border border-border-primary rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text-primary text-xs flex items-center gap-1.5">
                        📄 CV ou Relevés de notes <span className="text-text-secondary font-normal">(Optionnel)</span>
                      </span>
                      {applyResumeFile && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2Icon className="w-3 h-3" /> Fichier sélectionné
                        </span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) => setApplyResumeFile(e.target.files?.[0] || null)}
                      className="w-full text-[11px] text-text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20 cursor-pointer"
                    />
                  </div>
                </div>

                {applyError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 dark:text-red-400 font-semibold text-[11px]">
                    ⚠️ {applyError}
                  </div>
                )}

                <div className="pt-2 flex justify-between gap-3 border-t border-border-primary/40">
                  <button
                    onClick={() => { setApplyError(''); setApplyStep(1); }}
                    className="px-4 py-2 border border-border-primary rounded-xl text-xs font-bold text-text-secondary hover:bg-bg-primary transition-all cursor-pointer"
                  >
                    ← Précédent
                  </button>
                  <button
                    onClick={() => {
                      if (!applyCniFile || !applyDiplomaFile) {
                        setApplyError('Veuillez joindre au moins votre Pièce d\'identité et votre dernier Diplôme afin d\'étudier votre dossier.');
                        return;
                      }
                      setApplyError('');
                      setApplyStep(3);
                    }}
                    className="px-6 py-2 bg-brand-primary hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    Vérifier mon dossier →
                  </button>
                </div>
              </div>
            )}

            {/* ── Étape 3 : Récapitulatif & Soumission ── */}
            {applyStep === 3 && (
              <div className="space-y-4 text-xs text-text-secondary">
                <div className="bg-bg-primary p-4 rounded-xl border border-border-primary space-y-2.5">
                  <h4 className="font-bold text-text-primary text-xs border-b border-border-primary/40 pb-2">📋 Récapitulatif de candidature</h4>
                  <div className="grid grid-cols-3 gap-1 py-1">
                    <span className="font-semibold text-text-secondary">Candidat :</span>
                    <span className="col-span-2 font-bold text-text-primary">{profile.name} ({profile.email})</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 py-1">
                    <span className="font-semibold text-text-secondary">Formation :</span>
                    <span className="col-span-2 font-bold text-brand-primary">{applyingProgram.title}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 py-1">
                    <span className="font-semibold text-text-secondary">Rentrée :</span>
                    <span className="col-span-2 font-bold text-text-primary">{applySession}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 py-1">
                    <span className="font-semibold text-text-secondary">Pièces jointes :</span>
                    <div className="col-span-2 space-y-1 font-mono text-[11px] text-text-primary">
                      <div>✅ CNI : <span className="font-bold">{applyCniFile?.name}</span></div>
                      <div>✅ Diplôme : <span className="font-bold">{applyDiplomaFile?.name}</span></div>
                      {applyResumeFile && <div>✅ Optionnel : <span className="font-bold">{applyResumeFile.name}</span></div>}
                    </div>
                  </div>
                </div>

                <label className="flex items-start gap-2.5 p-3 bg-brand-light/30 border border-brand-primary/20 rounded-xl cursor-pointer">
                  <input type="checkbox" defaultChecked required className="mt-0.5 accent-brand-primary w-4 h-4 cursor-pointer" />
                  <span className="text-[11px] text-text-primary font-medium leading-relaxed">
                    Je certifie sur l'honneur l'exactitude des informations fournies et l'authenticité des documents annexés à ce dossier de candidature.
                  </span>
                </label>

                {applyError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 dark:text-red-400 font-semibold text-[11px]">
                    ⚠️ {applyError}
                  </div>
                )}

                <div className="pt-2 flex justify-between gap-3 border-t border-border-primary/40">
                  <button
                    onClick={() => { setApplyError(''); setApplyStep(2); }}
                    disabled={isSubmittingApplication}
                    className="px-4 py-2 border border-border-primary rounded-xl text-xs font-bold text-text-secondary hover:bg-bg-primary transition-all cursor-pointer"
                  >
                    ← Précédent
                  </button>
                  <button
                    onClick={handleConfirmApplication}
                    disabled={isSubmittingApplication}
                    className="flex-1 py-2.5 bg-brand-primary hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingApplication ? 'Envoi en cours...' : 'Transmettre mon dossier au jury 🚀'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modale de succès après soumission d'une candidature ── */}
      {applySuccessProgram && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bg-secondary border border-border-primary rounded-2xl max-w-md w-full p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-500/10 animate-pulse">
              <CheckCircle2Icon className="w-8 h-8 stroke-[3]" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-2xl text-text-primary">Candidature Soumise !</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Votre dossier pour le programme <strong className="text-brand-primary">{applySuccessProgram}</strong> a été transmis avec succès au service des admissions de l'IDLA.
              </p>
            </div>
            <div className="bg-bg-primary p-4 rounded-xl border border-border-primary/40 text-left text-xs text-text-secondary space-y-2">
              <p className="font-bold text-text-primary flex items-center gap-1.5">
                📋 Ce qui va se passer ensuite :
              </p>
              <ul className="list-disc list-inside space-y-1.5 leading-relaxed">
                <li>Votre conseiller pédagogique va étudier votre candidature.</li>
                <li>Vous pouvez suivre l'avancement et envoyer des messages depuis l'onglet <strong className="text-text-primary">Mes Candidatures</strong>.</li>
              </ul>
            </div>
            <button
              onClick={() => setApplySuccessProgram(null)}
              className="w-full py-3 bg-brand-primary hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Voir ma candidature →
            </button>
          </div>
        </div>
      )}
    </>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // DASHBOARD VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (activeTab === 'student-dashboard') {
    return (
      <div className="bg-bg-primary min-h-screen text-text-primary py-8 px-6 md:px-12 transition-all duration-200">
        <div className="max-w-[1440px] mx-auto space-y-6">

          {MustChangePwdBanner}

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
                <p className="text-sm text-text-secondary mt-0.5">
                  <span className="text-brand-primary font-bold">{inProgress.length} cours</span> en cours •{' '}
                  <span className="text-amber-500 font-bold">{applications.length} candidature{applications.length !== 1 ? 's' : ''}</span> suivies
                </p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button onClick={() => setActiveTab && setActiveTab('student-programs')}
                className="inline-flex items-center gap-1.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer">
                <BookOpenIcon className="w-3.5 h-3.5" /> Mes programmes
              </button>
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Cours inscrits', value: enrollments.length, icon: BookOpenIcon, color: 'text-brand-primary', bg: 'bg-brand-light', onClick: () => setActiveTab && setActiveTab('student-programs') },
              { label: 'En cours', value: inProgress.length, icon: PlayCircleIcon, color: 'text-amber-600', bg: 'bg-amber-500/10', onClick: () => {} },
              { label: 'Terminés', value: completed.length, icon: CheckCircle2Icon, color: 'text-emerald-600', bg: 'bg-emerald-500/10', onClick: () => {} },
            ].map(({ label, value, icon: Icon, color, bg, onClick }) => (
              <button key={label} onClick={onClick}
                className="bg-bg-secondary border border-border-primary rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow text-left cursor-pointer">
                <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{value}</p>
                  <p className="text-xs text-text-secondary">{label}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Candidatures actives depuis Appwrite */}
          {applications.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-sans font-bold text-base text-text-primary uppercase tracking-wider">Mes Candidatures</h2>
                <button onClick={() => setActiveTab && setActiveTab('student-programs')} className="text-xs text-brand-primary hover:underline font-bold cursor-pointer flex items-center gap-1">
                  Voir tout <ChevronRightIcon className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {applications.slice(0, 3).map((app) => {
                  const badge = appStatusBadge(app.status);
                  return (
                    <div key={app.$id} className="bg-bg-secondary border border-border-primary rounded-2xl p-5 shadow-sm space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-sm text-text-primary line-clamp-2 flex-1">{app.program}</h3>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${badge.cls}`}>{badge.label}</span>
                      </div>
                      <p className="text-xs text-text-secondary">
                        Déposé le {new Date(app.dateApplied || app.$createdAt).toLocaleDateString('fr-FR')}
                      </p>
                      {app.status === 'Accepted' && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                          <CheckCircle2Icon className="w-3.5 h-3.5" /> Félicitations ! Vous êtes admis(e).
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reprendre un cours */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h2 className="font-sans font-bold text-base text-text-primary uppercase tracking-wider">Reprendre un cours</h2>
              {inProgress.length === 0 ? (
                <div className="bg-bg-secondary border border-border-primary rounded-2xl p-8 text-center">
                  <p className="text-sm text-text-secondary italic">Aucun cours en cours.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {inProgress.map((enr) => (
                    <div key={enr.id} className="bg-bg-secondary border border-border-primary rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row">
                      <div className="w-full sm:w-36 h-32 sm:h-auto shrink-0 overflow-hidden">
                        <img src={enr.image} alt={enr.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-5 flex flex-col justify-between gap-3 flex-1">
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-bold text-sm text-text-primary line-clamp-2">{enr.title}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${statusBadge(enr.status)}`}>{statusLabel(enr.status)}</span>
                          </div>
                          <p className="text-xs text-text-secondary">{enr.instructor}</p>
                          {enr.nextLessonTitle && (
                            <p className="text-xs mt-1 flex items-center gap-1">
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
                            <div className="h-full bg-brand-primary rounded-full" style={{ width: `${enr.progressPercent}%` }} />
                          </div>
                        </div>
                        <button className="self-start inline-flex items-center gap-1.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer">
                          <PlayCircleIcon className="w-3.5 h-3.5" /> Continuer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Échéances */}
            <div className="space-y-4">
              <h2 className="font-sans font-bold text-base text-text-primary uppercase tracking-wider">Échéances</h2>
              <div className="space-y-3">
                {upcomingDeadlines.length === 0 ? (
                  <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 text-center">
                    <CheckCircle2Icon className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm text-text-secondary">Tout est à jour !</p>
                  </div>
                ) : upcomingDeadlines.map((dl) => {
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
                          {days <= 0 ? "Aujourd'hui" : `Dans ${days} jour${days > 1 ? 's' : ''}`} — {fmtDate(dl.dueDate)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        {renderApplicationModals()}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MES PROGRAMMES VIEW (candidatures réelles + explorer catalogue)
  // ════════════════════════════════════════════════════════════════════════════
  if (activeTab === 'student-programs') {
    const STEP: Record<string, number> = { New: 1, 'In Review': 2, Accepted: 4, Rejected: 2 };

    return (
      <div className="bg-bg-primary min-h-screen text-text-primary py-8 px-6 md:px-12 transition-all duration-200">
        <div className="max-w-[1440px] mx-auto space-y-6">

          {MustChangePwdBanner}

          <div>
            <h1 className="font-sans font-bold text-2xl text-text-primary">Mes Programmes</h1>
            <p className="text-sm text-text-secondary mt-1">Suivez vos candidatures et explorez de nouvelles formations.</p>
          </div>

          {/* Onglets de section */}
          <div className="flex gap-1 bg-bg-secondary border border-border-primary p-1 rounded-xl w-fit">
            {([
              ['mes-candidatures', 'Mes candidatures', `(${applications.length})`],
              ['explorer', 'Explorer d\'autres programmes', ''],
            ] as const).map(([key, label, count]) => (
              <button key={key} onClick={() => { setProgSection(key); setSelectedAppId(null); }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${progSection === key ? 'bg-brand-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>
                {label} {count && <span className="opacity-70">{count}</span>}
              </button>
            ))}
          </div>

          {/* ── Section : Mes candidatures ── */}
          {progSection === 'mes-candidatures' && (
            <div className="space-y-4">
              {appsLoading ? (
                <div className="bg-bg-secondary border border-border-primary rounded-2xl p-12 text-center">
                  <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-text-secondary">Chargement de vos candidatures…</p>
                </div>
              ) : applications.length === 0 ? (
                <div className="bg-bg-secondary border border-border-primary rounded-2xl p-12 text-center space-y-4">
                  <BookOpenIcon className="w-12 h-12 text-text-secondary/30 mx-auto" />
                  <p className="text-text-secondary text-sm">Vous n'avez pas encore soumis de candidature.</p>
                  <button onClick={() => setProgSection('explorer')}
                    className="inline-flex items-center gap-1.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-5 py-2.5 rounded-lg cursor-pointer">
                    Explorer les programmes
                  </button>
                </div>
              ) : selectedAppId ? (
                (() => {
                  const app = applications.find((a) => a.$id === selectedAppId);
                  if (!app) {
                    setSelectedAppId(null);
                    return null;
                  }
                  const badge = appStatusBadge(app.status || 'New');
                  const step = STEP[app.status] ?? 1;
                  const stepState = (n: number) => {
                    if (step > n) return 'complete';
                    if (step === n) return 'active';
                    return 'upcoming';
                  };
                  const stepClasses = (state: 'complete' | 'active' | 'upcoming') => {
                    if (state === 'complete') return { border: 'border-brand-primary', text: 'text-brand-primary', opacity: '' };
                    if (state === 'active') return { border: 'border-amber-500', text: 'text-amber-500', opacity: '' };
                    return { border: 'border-border-primary/50', text: 'text-text-secondary', opacity: 'opacity-40' };
                  };
                  return (
                    <div className="space-y-6">
                      {/* Back button and title */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bg-secondary border border-border-primary rounded-2xl p-5 shadow-sm">
                        <div className="space-y-2">
                          <button onClick={() => setSelectedAppId(null)}
                            className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-brand-primary transition-colors border border-border-primary px-3 py-1.5 rounded cursor-pointer">
                            <ArrowLeftIcon className="w-3 h-3" /> Retour à mes candidatures
                          </button>
                          <h2 className="font-sans font-bold text-lg text-text-primary mt-1">{app.program}</h2>
                          <p className="text-xs text-text-secondary">Dossier n° #{app.$id.slice(-6).toUpperCase()}</p>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-xs font-bold border w-fit ${badge.cls}`}>{badge.label}</span>
                      </div>

                      {/* Timeline stepper (Spacious) */}
                      <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                        <h3 className="font-sans font-bold text-sm text-text-primary uppercase tracking-wider">État d'évaluation du dossier</h3>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
                          {/* Step 1 : Soumis */}
                          <div className={`space-y-2 border-l-4 md:border-l-0 md:border-t-4 ${stepClasses(stepState(1)).border} pl-4 md:pl-0 pt-0 md:pt-4 ${stepClasses(stepState(1)).opacity}`}>
                            <div className={`flex items-center gap-1.5 ${stepClasses(stepState(1)).text} font-bold text-xs`}>
                              <CheckCircle2Icon className="w-4 h-4" />
                              <span>Étape 1 : Soumis</span>
                            </div>
                            <p className="font-bold text-xs text-text-primary">Candidature Enregistrée</p>
                            <p className="text-[11px] text-text-secondary">Le dossier a été déposé en ligne avec succès.</p>
                          </div>

                          {/* Step 2 : Analyse académique */}
                          <div className={`space-y-2 border-l-4 md:border-l-0 md:border-t-4 ${stepClasses(stepState(2)).border} pl-4 md:pl-0 pt-0 md:pt-4 ${stepClasses(stepState(2)).opacity}`}>
                            <div className={`flex items-center gap-1.5 ${stepClasses(stepState(2)).text} font-bold text-xs`}>
                              {stepState(2) === 'active' ? <ClockIcon className="w-4 h-4 animate-spin-slow" /> : <CheckCircle2Icon className="w-4 h-4" />}
                              <span>Étape 2 : Analyse académique</span>
                            </div>
                            <p className="font-bold text-xs text-text-primary">Étude des pièces</p>
                            <p className="text-[11px] text-text-secondary">Notre équipe examine l'adéquation de vos relevés.</p>
                          </div>

                          {/* Step 3 : Évaluation orale */}
                          <div className={`space-y-2 border-l-4 md:border-l-0 md:border-t-4 ${stepClasses(stepState(3)).border} pl-4 md:pl-0 pt-0 md:pt-4 ${stepClasses(stepState(3)).opacity}`}>
                            <div className={`flex items-center gap-1.5 ${stepClasses(stepState(3)).text} font-semibold text-xs`}>
                              {stepState(3) === 'complete' && <CheckCircle2Icon className="w-4 h-4" />}
                              <span>Étape 3 : Évaluation orale</span>
                            </div>
                            <p className="font-bold text-xs text-text-primary">Entretien de motivation</p>
                            <p className="text-[11px] text-text-secondary">Présentation de votre projet devant le jury académique.</p>
                          </div>

                          {/* Step 4 : Délibération */}
                          <div className={`space-y-2 border-l-4 md:border-l-0 md:border-t-4 ${stepClasses(stepState(4)).border} pl-4 md:pl-0 pt-0 md:pt-4 ${stepClasses(stepState(4)).opacity}`}>
                            <div className={`flex items-center gap-1.5 ${stepClasses(stepState(4)).text} font-semibold text-xs`}>
                              {stepState(4) === 'complete' && <CheckCircle2Icon className="w-4 h-4" />}
                              <span>Étape 4 : Délibération</span>
                            </div>
                            <p className="font-bold text-xs text-text-primary">Décision d'Admission</p>
                            <p className="text-[11px] text-text-secondary">
                              {app.status === 'Rejected' ? 'Décision : candidature non retenue.' : 'Notification finale d\'acceptation.'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Split screen : upload + chat */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Documents Upload Panel */}
                        <div className="lg:col-span-6 bg-bg-secondary border border-border-primary rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                          <h3 className="font-sans font-bold text-sm text-text-primary pb-2 border-b border-border-primary/30 flex items-center gap-2">
                            <FileTextIcon className="w-5 h-5 text-brand-primary" />
                            Pièces justificatives
                          </h3>

                          {(() => {
                            const appProg = programs?.find((p) => p.title === app.program);
                            const isAppCert = appProg?.type === 'Certification';
                            const studentCni = candidateDocs.find((d) => d.name.startsWith('[CNI]'));
                            const studentDiplome = candidateDocs.find((d) => d.name.startsWith('[Diplôme]'));

                            return (
                              <div className="space-y-4 flex-1">
                                {/* CNI Card */}
                                <div className="bg-bg-primary p-4 rounded-xl border border-border-primary/40 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="text-xs font-bold text-text-primary">1. Carte Nationale d'Identité (CNI)</h4>
                                      <p className="text-[9px] text-text-secondary mt-0.5">Format requis : PDF, Word (Max: 5 Mo)</p>
                                    </div>
                                    {studentCni ? (
                                      <span className="bg-emerald-500/10 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <CheckCircle2Icon className="w-3.5 h-3.5" /> Chargé
                                      </span>
                                    ) : (
                                      <span className="bg-amber-500/10 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        Manquant
                                      </span>
                                    )}
                                  </div>

                                  {studentCni ? (
                                    <div className="flex items-center justify-between p-2.5 bg-bg-secondary rounded-lg border border-border-primary/40 text-xs">
                                      <div className="flex items-center gap-2 truncate">
                                        <FileTextIcon className="w-4 h-4 text-brand-primary" />
                                        <span className="font-semibold text-text-primary truncate">{studentCni.name.replace('[CNI] ', '')}</span>
                                        <span className="text-[10px] text-text-secondary">({studentCni.size})</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveUploadType('cni');
                                        docInputRef.current?.click();
                                      }}
                                      className="w-full py-2 border-2 border-dashed border-border-primary rounded-lg hover:border-brand-primary hover:bg-bg-secondary text-xs font-semibold text-text-secondary hover:text-brand-primary transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                      <UploadIcon className="w-4 h-4" /> Charger ma CNI
                                    </button>
                                  )}
                                </div>

                                {/* Diploma Card */}
                                {!isAppCert && (
                                  <div className="bg-bg-primary p-4 rounded-xl border border-border-primary/40 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <h4 className="text-xs font-bold text-text-primary">2. Diplôme le plus récent</h4>
                                        <p className="text-[9px] text-text-secondary mt-0.5">Format requis : PDF, Word (Max: 5 Mo)</p>
                                      </div>
                                      {studentDiplome ? (
                                        <span className="bg-emerald-500/10 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                          <CheckCircle2Icon className="w-3.5 h-3.5" /> Chargé
                                        </span>
                                      ) : (
                                        <span className="bg-amber-500/10 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                          Manquant
                                        </span>
                                      )}
                                    </div>

                                    {studentDiplome ? (
                                      <div className="flex items-center justify-between p-2.5 bg-bg-secondary rounded-lg border border-border-primary/40 text-xs">
                                        <div className="flex items-center gap-2 truncate">
                                          <FileTextIcon className="w-4 h-4 text-brand-primary" />
                                          <span className="font-semibold text-text-primary truncate">{studentDiplome.name.replace('[Diplôme] ', '')}</span>
                                          <span className="text-[10px] text-text-secondary">({studentDiplome.size})</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveUploadType('diplome');
                                          docInputRef.current?.click();
                                        }}
                                        className="w-full py-2 border-2 border-dashed border-border-primary rounded-lg hover:border-brand-primary hover:bg-bg-secondary text-xs font-semibold text-text-secondary hover:text-brand-primary transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                      >
                                        <UploadIcon className="w-4 h-4" /> Charger mon Diplôme
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          <input
                            type="file"
                            ref={docInputRef}
                            onChange={handleDocUpload}
                            className="hidden"
                            accept=".pdf,.doc,.docx"
                          />

                          {isUploadingDoc && (
                            <div className="bg-bg-primary p-4 rounded-lg border border-border-primary text-center text-xs font-bold text-brand-primary animate-pulse">
                              Téléversement en cours...
                            </div>
                          )}
                        </div>

                        {/* Advisor Chat Panel */}
                        <div className="lg:col-span-6 bg-bg-secondary border border-border-primary rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[380px] max-h-[420px]">
                          {/* Advisor Profile Header */}
                          <div className="bg-bg-primary p-4 flex items-center justify-between border-b border-border-primary">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center border border-brand-primary/30 shrink-0">
                                🎓
                              </div>
                              <div>
                                <h4 className="font-bold text-xs text-text-primary">Sophie Vallet</h4>
                                <p className="text-[9px] text-brand-primary font-bold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
                                  Conseillère des Admissions
                                </p>
                              </div>
                            </div>
                            <MessageSquareIcon className="w-4 h-4 text-text-secondary" />
                          </div>

                          {/* Chat History Area */}
                          <div className="flex-1 p-4 overflow-y-auto space-y-4">
                            {chatHistory.map((m, idx) => (
                              <div
                                key={idx}
                                className={`flex flex-col max-w-[85%] ${
                                  m.sender === 'candidate' ? 'ml-auto items-end' : 'mr-auto items-start'
                                }`}
                              >
                                <div
                                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                                    m.sender === 'candidate'
                                      ? 'bg-brand-primary text-white rounded-tr-none font-medium shadow-sm'
                                      : 'bg-bg-primary text-text-primary rounded-tl-none border border-border-primary/40 shadow-sm'
                                  }`}
                                >
                                  {m.text}
                                </div>
                                <span className="text-[9px] text-text-secondary mt-1 px-1">{m.time}</span>
                              </div>
                            ))}
                            <div ref={chatEndRef} />
                          </div>

                          {/* Chat Entry Form */}
                          <form onSubmit={handleSendMessage} className="p-3 border-t border-border-primary/30 bg-bg-primary flex gap-2">
                            <input
                              type="text"
                              value={chatMessage}
                              onChange={(e) => setChatMessage(e.target.value)}
                              placeholder="Rédiger votre réponse..."
                              className="flex-grow bg-bg-secondary border border-border-primary rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-brand-primary text-text-primary font-medium"
                            />
                            <button
                              type="submit"
                              className="bg-brand-primary text-white px-3 py-2 rounded-lg hover:bg-brand-hover transition-colors shrink-0 cursor-pointer"
                            >
                              <SendIcon className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {applications.map((app) => {
                    const badge = appStatusBadge(app.status || 'New');
                    const step = STEP[app.status] ?? 1;
                    const steps = [
                      { n: 1, label: 'Déposé' },
                      { n: 2, label: 'En examen' },
                      { n: 3, label: 'Entretien' },
                      { n: 4, label: 'Décision' },
                    ];
                    return (
                      <div key={app.$id} className="bg-bg-secondary border border-border-primary rounded-2xl p-6 shadow-sm space-y-5 flex flex-col justify-between">
                        <div className="space-y-5">
                          {/* Header */}
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-base text-text-primary line-clamp-2">{app.program}</h3>
                              <p className="text-xs text-text-secondary mt-1">
                                Déposé le {new Date(app.dateApplied || app.$createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                              </p>
                            </div>
                            <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold border shrink-0 ${badge.cls}`}>{badge.label}</span>
                          </div>

                          {/* Stepper */}
                          <div className="grid grid-cols-4 gap-1">
                            {steps.map(({ n, label }) => {
                              const isDone = app.status === 'Accepted' || (app.status !== 'Rejected' && n < step) || (app.status === 'Rejected' && n <= step);
                              const isActive = app.status !== 'Accepted' && n === step;
                              return (
                                <div key={n} className={`text-center space-y-1.5 ${isDone || isActive ? '' : 'opacity-40'}`}>
                                  <div className={`h-1 rounded-full ${isDone ? 'bg-brand-primary' : isActive ? 'bg-amber-500' : 'bg-border-primary'}`} />
                                  <div className={`w-5 h-5 rounded-full mx-auto flex items-center justify-center text-[9px] font-bold border-2 ${isDone ? 'bg-brand-primary border-brand-primary text-white' : isActive ? 'border-amber-500 text-amber-600 bg-amber-500/10' : 'border-border-primary text-text-secondary'}`}>
                                    {isDone ? '✓' : n}
                                  </div>
                                  <p className="text-[9px] text-text-secondary font-semibold leading-tight">{label}</p>
                                </div>
                              );
                            })}
                          </div>

                          {/* Message statut */}
                          {app.status === 'Accepted' && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-2">
                              <CheckCircle2Icon className="w-4 h-4 shrink-0" />
                              Félicitations ! Votre candidature a été acceptée.
                            </div>
                          )}
                          {app.status === 'Rejected' && (
                            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-2">
                              <AlertCircleIcon className="w-4 h-4 shrink-0" />
                              Votre candidature n'a pas été retenue pour cette session.
                            </div>
                          )}
                          {(app.status === 'New' || app.status === 'In Review') && (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-2">
                              <ClockIcon className="w-4 h-4 shrink-0" />
                              Votre dossier est en cours d'évaluation.
                            </div>
                          )}

                          {/* Infos candidat */}
                          <div className="grid grid-cols-2 gap-3 text-xs border-t border-border-primary/40 pt-4">
                            {app.highestDegree && (
                              <div>
                                <p className="text-text-secondary font-semibold uppercase text-[9px] tracking-wider">Diplôme</p>
                                <p className="text-text-primary font-bold mt-0.5">{app.highestDegree}</p>
                              </div>
                            )}
                            {app.nationality && (
                              <div>
                                <p className="text-text-secondary font-semibold uppercase text-[9px] tracking-wider">Nationalité</p>
                                <p className="text-text-primary font-bold mt-0.5">{app.nationality}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-text-secondary font-semibold uppercase text-[9px] tracking-wider">Dossier n°</p>
                              <p className="text-text-primary font-bold font-mono mt-0.5">#{app.$id.slice(-6).toUpperCase()}</p>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedAppId(app.$id)}
                          className="w-full mt-5 bg-brand-light text-brand-primary hover:bg-brand-primary hover:text-white py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-brand-primary/20"
                        >
                          <MessageSquareIcon className="w-3.5 h-3.5" />
                          Suivi & Discussion avec un conseiller
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Section : Explorer d'autres programmes ── */}
          {progSection === 'explorer' && (
            <div className="space-y-6">
              {/* Barre de recherche */}
              <div className="relative">
                <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/60 w-4 h-4" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un programme…"
                  className="w-full bg-bg-secondary border border-border-primary rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-primary text-text-primary" />
              </div>

              {/* Filtres catégorie */}
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button key={cat} onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${filterCategory === cat ? 'bg-brand-primary text-white border-brand-primary' : 'bg-bg-secondary text-text-secondary border-border-primary hover:border-brand-primary hover:text-brand-primary'}`}>
                    {cat}
                  </button>
                ))}
              </div>

              {/* Grille programmes */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {allPrograms
                  .filter((p) => {
                    const q = searchQuery.toLowerCase();
                    const matchQ = !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
                    const matchCat = filterCategory === 'Tous' || p.category === filterCategory;
                    return matchQ && matchCat;
                  })
                  .map((prog) => {
                    const alreadyApplied = applications.some((a) => a.program === prog.title);
                    return (
                      <div key={prog.id} className="bg-bg-secondary border border-border-primary rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
                        <div className="relative h-40 overflow-hidden">
                          <img src={prog.image} alt={prog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute top-3 left-3 flex gap-1.5">
                            {prog.isNew && <span className="bg-brand-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Nouveau</span>}
                          </div>
                          {alreadyApplied && (
                            <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2Icon className="w-3 h-3" /> Candidature déposée
                            </div>
                          )}
                        </div>
                        <div className="p-4 flex flex-col gap-3 flex-1">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[10px] font-bold text-brand-primary bg-brand-light px-2 py-0.5 rounded-full">{prog.category}</span>
                              <span className="text-[10px] text-text-secondary border border-border-primary px-2 py-0.5 rounded-full">{prog.type}</span>
                            </div>
                            <h3 className="font-bold text-sm text-text-primary line-clamp-2">{prog.title}</h3>
                            <p className="text-xs text-text-secondary mt-1 line-clamp-2">{prog.description}</p>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-text-secondary mt-auto">
                            <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3" />{prog.duration}</span>
                          </div>
                          <button onClick={() => alreadyApplied ? setProgSection('mes-candidatures') : setApplyingProgram(prog)}
                            className={`w-full py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${alreadyApplied ? 'bg-bg-primary border border-brand-primary text-brand-primary' : 'bg-brand-primary hover:bg-brand-hover text-white'}`}>
                            {alreadyApplied ? <><CheckCircle2Icon className="w-3.5 h-3.5" /> Candidature soumise</> : <><BookmarkIcon className="w-3.5 h-3.5" /> Postuler maintenant</>}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {allPrograms.filter((p) => filterCategory === 'Tous' || p.category === filterCategory).length === 0 && (
                <div className="bg-bg-secondary border border-border-primary rounded-2xl p-12 text-center">
                  <p className="text-sm text-text-secondary">Aucun programme dans cette catégorie.</p>
                </div>
              )}
            </div>
          )}
        </div>
        {renderApplicationModals()}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CATALOGUE VIEW (cours en ligne)
  // ════════════════════════════════════════════════════════════════════════════
  if (activeTab === 'student-catalog') {
    return (
      <div className="bg-bg-primary min-h-screen text-text-primary py-8 px-6 md:px-12 transition-all duration-200">
        <div className="max-w-[1440px] mx-auto space-y-6">
          {MustChangePwdBanner}
          <div>
            <h1 className="font-sans font-bold text-2xl text-text-primary">Catalogue de Cours</h1>
            <p className="text-sm text-text-secondary mt-1">Explorez notre offre de formations en ligne.</p>
          </div>
          <div className="bg-bg-secondary border border-border-primary rounded-2xl p-5 shadow-sm space-y-4">
            <div className="relative">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/60 w-4 h-4" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un cours, instructeur, tag…"
                className="w-full bg-bg-primary border border-border-primary rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-primary text-text-primary" />
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterIcon className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
              {CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${filterCategory === cat ? 'bg-brand-primary text-white border-brand-primary' : 'bg-bg-primary text-text-secondary border-border-primary hover:border-brand-primary hover:text-brand-primary'}`}>
                  {cat}
                </button>
              ))}
              {LEVELS.map((lvl) => (
                <button key={lvl} onClick={() => setFilterLevel(lvl)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${filterLevel === lvl ? 'bg-brand-primary text-white border-brand-primary' : 'bg-bg-primary text-text-secondary border-border-primary hover:border-brand-primary hover:text-brand-primary'}`}>
                  {lvl}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-secondary">{filteredCatalog.length} cours trouvé{filteredCatalog.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCatalog.map((course) => {
              const isEnrolled = enrollments.some((e) => e.title === course.title);
              return (
                <div key={course.id} className="bg-bg-secondary border border-border-primary rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
                  <div className="relative h-44 overflow-hidden">
                    <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      {course.isNew && <span className="bg-brand-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Nouveau</span>}
                    </div>
                    {isEnrolled && (
                      <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2Icon className="w-3 h-3" /> Admis
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col gap-3 flex-1">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold text-brand-primary bg-brand-light px-2 py-0.5 rounded-full">{course.category}</span>
                        <span className="text-[10px] text-text-secondary border border-border-primary px-2 py-0.5 rounded-full">{course.type || 'Formation'}</span>
                      </div>
                      <h3 className="font-bold text-sm text-text-primary line-clamp-2">{course.title}</h3>
                      <p className="text-xs text-text-secondary mt-1 line-clamp-3">{course.description}</p>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-text-secondary mt-auto">
                      <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3" />{course.duration}</span>
                    </div>
                    <button onClick={() => isEnrolled ? (setActiveTab && setActiveTab('student-programs')) : setApplyingProgram(course)}
                      className={`w-full py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${isEnrolled ? 'bg-bg-primary border border-brand-primary text-brand-primary' : 'bg-brand-primary hover:bg-brand-hover text-white'}`}>
                      {isEnrolled ? <><CheckCircle2Icon className="w-3.5 h-3.5" /> Voir mon programme</> : <><BookmarkIcon className="w-3.5 h-3.5" /> Postuler maintenant</>}
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredCatalog.length === 0 && (
              <div className="col-span-full bg-bg-secondary border border-border-primary rounded-2xl p-12 text-center">
                <SearchIcon className="w-10 h-10 text-text-secondary/40 mx-auto mb-3" />
                <p className="text-sm text-text-secondary">Aucun cours ne correspond à votre recherche.</p>
                <button onClick={() => { setSearchQuery(''); setFilterCategory('Tous'); setFilterLevel('Tous niveaux'); }} className="mt-4 text-brand-primary text-xs font-bold hover:underline cursor-pointer">Réinitialiser</button>
              </div>
            )}
          </div>
        </div>
        {renderApplicationModals()}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PROFIL VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (activeTab === 'student-profile') {
    return (
      <div className="bg-bg-primary min-h-screen text-text-primary py-8 px-6 md:px-12 transition-all duration-200">
        <div className="max-w-3xl mx-auto space-y-6">
          {MustChangePwdBanner}
          <div><h1 className="font-sans font-bold text-2xl text-text-primary">Mon Profil</h1></div>

          <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-brand-light border border-brand-primary/30 flex items-center justify-center overflow-hidden">
                  {profile.avatarUrl ? <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" /> : <span className="text-4xl font-bold text-brand-primary">{profile.name.charAt(0)}</span>}
                </div>
                <button onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-primary hover:bg-brand-hover text-white rounded-full flex items-center justify-center shadow-md cursor-pointer">
                  <CameraIcon className="w-3.5 h-3.5" />
                </button>
                <input ref={avatarInputRef} type="file" className="hidden" accept="image/*"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) setProfile((p) => ({ ...p, avatarUrl: URL.createObjectURL(f) })); }} />
              </div>
              <div className="flex-1 space-y-1">
                {editProfile ? (
                  <input value={draftName} onChange={(e) => setDraftName(e.target.value)}
                    className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-lg font-bold text-text-primary outline-none focus:ring-2 focus:ring-brand-primary" />
                ) : <h2 className="text-xl font-bold text-text-primary">{profile.name}</h2>}
                <p className="text-sm text-text-secondary">{profile.email}</p>
                <p className="text-xs text-text-secondary">Inscrit depuis {fmtDate(profile.joinedAt)}</p>
              </div>
              <button onClick={() => { setEditProfile(!editProfile); setDraftName(profile.name); setDraftBio(profile.bio); }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary border border-brand-primary/30 hover:border-brand-primary px-3 py-1.5 rounded-lg cursor-pointer shrink-0">
                <PencilIcon className="w-3.5 h-3.5" /> {editProfile ? 'Annuler' : 'Modifier'}
              </button>
            </div>
          </div>

          <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-text-primary uppercase tracking-wider">Biographie</h3>
            {editProfile ? (
              <textarea value={draftBio} onChange={(e) => setDraftBio(e.target.value)} rows={4}
                className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:ring-2 focus:ring-brand-primary resize-none" />
            ) : <p className="text-sm text-text-secondary leading-relaxed">{profile.bio || 'Aucune biographie.'}</p>}
            {editProfile && (
              <button onClick={handleSaveProfile} className="inline-flex items-center gap-1.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-5 py-2.5 rounded-lg cursor-pointer">
                <SaveIcon className="w-3.5 h-3.5" /> Enregistrer
              </button>
            )}
            {profileSaved && <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2Icon className="w-3.5 h-3.5" /> Profil mis à jour</span>}
          </div>
        </div>
        {renderApplicationModals()}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PARAMÈTRES VIEW — avec vrai changement de mot de passe + mustChangePwd
  // ════════════════════════════════════════════════════════════════════════════
  if (activeTab === 'student-settings') {
    return (
      <div className="bg-bg-primary min-h-screen text-text-primary py-8 px-6 md:px-12 transition-all duration-200">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Banner prioritaire si mot de passe temporaire */}
          {mustChangePwd && (
            <div className="bg-amber-500/10 border-2 border-amber-500 rounded-2xl p-6 shadow-lg space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <LockIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-amber-700 dark:text-amber-400">⚠️ Modification du mot de passe obligatoire</h3>
                  <p className="text-xs text-text-secondary mt-1">Votre compte utilise encore un mot de passe temporaire. Modifiez-le ci-dessous pour sécuriser votre accès.</p>
                </div>
              </div>
              <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase">Mot de passe actuel</label>
                  <input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)}
                    placeholder="Mot de passe temporaire"
                    className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500 text-text-primary" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase">Nouveau mot de passe</label>
                  <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)}
                    placeholder="Min. 8 caractères"
                    className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500 text-text-primary" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase">Confirmer</label>
                  <input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="Même mot de passe"
                    className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500 text-text-primary" required />
                </div>
                <div className="sm:col-span-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <button type="submit" disabled={isUpdatingPwd}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
                    <LockIcon className="w-3.5 h-3.5" /> {isUpdatingPwd ? 'Modification…' : 'Modifier maintenant'}
                  </button>
                  {pwdError && <p className="text-xs text-red-600 font-semibold flex items-center gap-1"><AlertCircleIcon className="w-3.5 h-3.5" />{pwdError}</p>}
                  {pwdSuccess && <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2Icon className="w-3.5 h-3.5" />{pwdSuccess}</p>}
                </div>
              </form>
            </div>
          )}

          <div>
            <h1 className="font-sans font-bold text-2xl text-text-primary">Paramètres du Compte</h1>
            <p className="text-sm text-text-secondary mt-1">Sécurité, notifications et langue.</p>
          </div>

          {/* Onglets */}
          <div className="flex gap-0 border-b border-border-primary">
            {([['security', 'Sécurité', LockIcon], ['notifications', 'Notifications', BellIcon], ['language', 'Langue', GlobeIcon]] as const).map(([id, label, Icon]) => (
              <button key={id} onClick={() => setSettingsTab(id as any)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer -mb-px ${settingsTab === id ? 'border-brand-primary text-brand-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>

          {/* Sécurité */}
          {settingsTab === 'security' && (
            <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="font-bold text-sm text-text-primary mb-3">Adresse e-mail</h3>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/60 w-4 h-4" />
                    <input type="email" defaultValue={profile.email} readOnly className="w-full bg-bg-primary border border-border-primary rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary opacity-70 cursor-not-allowed" />
                  </div>
                  <button className="text-xs font-bold text-brand-primary hover:underline cursor-pointer shrink-0">Modifier</button>
                </div>
              </div>

              <div className="border-t border-border-primary/40 pt-6">
                <h3 className="font-bold text-sm text-text-primary mb-4">Changer le mot de passe</h3>
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
                      className="inline-flex items-center gap-1.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-5 py-2.5 rounded-lg cursor-pointer disabled:opacity-60">
                      <SaveIcon className="w-3.5 h-3.5" /> {isUpdatingPwd ? 'Modification…' : 'Modifier le mot de passe'}
                    </button>
                    {pwdError && <p className="text-xs text-red-600 font-semibold flex items-center gap-1"><AlertCircleIcon className="w-3.5 h-3.5" />{pwdError}</p>}
                    {pwdSuccess && <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2Icon className="w-3.5 h-3.5" />{pwdSuccess}</p>}
                  </div>
                  <p className="text-[11px] text-text-secondary">
                    Mot de passe oublié ?{' '}
                    <button type="button" onClick={async () => {
                      try {
                        await account.createRecovery({ email: profile.email, url: `${window.location.origin}/reinitialisation` });
                        setPwdSuccess('Lien de réinitialisation envoyé à ' + profile.email);
                      } catch { setPwdError("Erreur lors de l'envoi du lien."); }
                    }} className="text-brand-primary hover:underline font-bold cursor-pointer">
                      Recevoir un lien par email
                    </button>
                  </p>
                </form>
              </div>
            </div>
          )}

          {/* Notifications */}
          {settingsTab === 'notifications' && (
            <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 shadow-sm space-y-6">
              {([
                { key: 'email', label: 'Notifications par e-mail', desc: 'Mises à jour importantes de votre compte.', value: notifEmail, setter: setNotifEmail },
                { key: 'deadlines', label: "Rappels d'échéances", desc: 'Notifié 48h avant la date limite.', value: notifDeadlines, setter: setNotifDeadlines },
                { key: 'news', label: 'Nouveautés & Actualités', desc: "Dernières nouvelles de l'IDLA.", value: notifNews, setter: setNotifNews },
              ] as { key: string; label: string; desc: string; value: boolean; setter: React.Dispatch<React.SetStateAction<boolean>> }[]).map(({ key, label, desc, value, setter }) => (
                <div key={key} className="flex items-center justify-between gap-6 pb-5 border-b border-border-primary/30 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-bold text-text-primary">{label}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{desc}</p>
                  </div>
                  <button onClick={() => setter(!value)} role="switch" aria-checked={value}
                    className={`relative shrink-0 w-11 h-6 rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 ${value ? 'bg-brand-primary' : 'bg-border-primary'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Langue */}
          {settingsTab === 'language' && (
            <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex flex-col gap-3">
                {LANGUAGES_UI.map(({ value, label }) => (
                  <label key={value} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${selectedLang === value ? 'border-brand-primary bg-brand-light' : 'border-border-primary hover:border-brand-primary/50'}`}>
                    <input type="radio" name="language" value={value} checked={selectedLang === value} onChange={() => setSelectedLang(value as 'fr' | 'en')} className="accent-brand-primary w-4 h-4" />
                    <div>
                      <p className="text-sm font-bold text-text-primary">{label}</p>
                      <p className="text-xs text-text-secondary">{value === 'fr' ? 'Interface en français' : 'English interface'}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleSaveLanguage} className="inline-flex items-center gap-1.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-5 py-2.5 rounded-lg cursor-pointer">
                  <SaveIcon className="w-3.5 h-3.5" /> Appliquer
                </button>
                {langSaved && <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2Icon className="w-3.5 h-3.5" /> Préférence enregistrée</span>}
              </div>
            </div>
          )}
        </div>
        {renderApplicationModals()}
      </div>
    );
  }

  return null;
}
