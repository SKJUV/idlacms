import React, { useState, useMemo } from 'react';
import {
  Lock,
  Mail,
  Search,
  UserPlus,
  Trash2,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  UserCheck,
  BookOpen,
  Plus,
  ArrowLeft,
  Bell,
  Sparkles,
  Quote,
  Newspaper,
  HeartHandshake,
  Megaphone,
  X,
  Pencil,
  Settings,
  Save,
  FileText,
  Eye,
} from 'lucide-react';
import { Program, NewsArticle, Testimonial, User, PreRegistration, ActivityLog, Donation, Campaign } from '../types';
import { initialUsers, preRegistrationsData, activityLogsData, campaignsData } from '../data/mockData';
import { account, databases, APPWRITE_CONFIG, isAppwriteDbConfigured, ID } from '../lib/appwrite';

type AdminTab =
  | 'admin-login' | 'admin-dashboard' | 'admin-users' | 'admin-add-user' | 'admin-programmes'
  | 'admin-testimonials' | 'admin-news' | 'admin-preregistrations' | 'admin-donations' | 'admin-marketing'
  | 'admin-settings';

interface AdminPortalProps {
  activeTab: AdminTab;
  setActiveTab: (tab: any) => void;
  isLoggedIn: boolean;
  onLoginSuccess: () => void;
  programs: Program[];
  setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
  news: NewsArticle[];
  setNews: React.Dispatch<React.SetStateAction<NewsArticle[]>>;
  testimonials: Testimonial[];
  setTestimonials: React.Dispatch<React.SetStateAction<Testimonial[]>>;
  pendingTestimonials: Testimonial[];
  setPendingTestimonials: React.Dispatch<React.SetStateAction<Testimonial[]>>;
  donations: Donation[];
  setDonations: React.Dispatch<React.SetStateAction<Donation[]>>;
}

// Identifiants de démonstration (mode mock, sans Appwrite).
const DEMO_ADMIN = { email: 'admin@idla.edu', password: 'admin123' };

export default function AdminPortal({
  activeTab,
  setActiveTab,
  isLoggedIn,
  onLoginSuccess,
  programs,
  setPrograms,
  news,
  setNews,
  testimonials,
  setTestimonials,
  pendingTestimonials,
  setPendingTestimonials,
  donations,
  setDonations,
}: AdminPortalProps) {
  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // CMS database records states (with persistent in-memory session changes)
  const [usersList, setUsersList] = useState<User[]>(initialUsers);
  const [preRegistrations, setPreRegistrations] = useState<PreRegistration[]>(preRegistrationsData);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(activityLogsData);

  // Notifications (cloche) — s'appuient sur le journal d'activité.
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastSeenLogCount, setLastSeenLogCount] = useState(0);

  // Témoignages — édition d'un témoignage publié (modale)
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);

  // Formulaire d'actualité (création + édition)
  const [showAddNewsForm, setShowAddNewsForm] = useState(false);
  const [newNewsTitle, setNewNewsTitle] = useState('');
  const [newNewsDescription, setNewNewsDescription] = useState('');
  const [newNewsCategory, setNewNewsCategory] = useState<'Événements' | 'Académique' | 'Partenariats' | 'Annonces' | 'Alumni'>('Annonces');
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);

  // Édition d'un programme
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);

  // Utilisateurs — édition (modale)
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Pré-inscriptions — dossier sélectionné pour examen approfondi
  const [selectedPreRegId, setSelectedPreRegId] = useState<string | null>(null);

  // Marketing / Campagnes (CRUD complet)
  const [campaigns, setCampaigns] = useState<Campaign[]>(campaignsData);
  const [showAddCampaignForm, setShowAddCampaignForm] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [campaignName, setCampaignName] = useState('');
  const [campaignChannel, setCampaignChannel] = useState('Email + Réseaux');
  const [campaignReach, setCampaignReach] = useState('');

  // Paramètres CMS
  const [settingsName, setSettingsName] = useState('Jean-Sébastien Dupont');
  const [settingsEmail, setSettingsEmail] = useState('js.dupont@idla.edu');
  const [settingsSiteName, setSettingsSiteName] = useState('IDLA CMS');
  const [settingsAdmissionsOpen, setSettingsAdmissionsOpen] = useState(true);
  const [settingsEmailNotif, setSettingsEmailNotif] = useState(true);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Appwrite activity logger helper
  const logActivity = async (type: 'registration' | 'article' | 'error' | 'alumni', user: string, text: string) => {
    const newLog: ActivityLog = {
      id: Math.random().toString(),
      type,
      user,
      text,
      time: 'À l\'instant'
    };
    setActivityLogs((curr) => [newLog, ...curr]);

    if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.logs) {
      try {
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.logs,
          ID.unique(),
          {
            type,
            user,
            text,
            time: 'À l\'instant'
          }
        );
      } catch (err) {
        console.error("Impossible de sauvegarder le log d'activité sur Appwrite:", err);
      }
    }
  };

  // Chargement des données Appwrite au montage
  React.useEffect(() => {
    const fetchData = async () => {
      if (!isAppwriteDbConfigured()) {
        console.log("Appwrite DB n'est pas configurée dans le fichier .env (variables vides). Utilisation du mode mock.");
        return;
      }
      try {
        // Charger les utilisateurs CMS (les programmes sont déjà chargés au niveau de App.tsx)
        if (APPWRITE_CONFIG.collections.cmsUsers) {
          const usersRes = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.cmsUsers
          );
          if (usersRes.documents.length > 0) {
            setUsersList(usersRes.documents.map((doc: any) => ({
              id: doc.$id,
              name: doc.name,
              email: doc.email,
              role: doc.role,
              status: doc.status,
              lastLogin: doc.lastLogin ? new Date(doc.lastLogin).toLocaleString('fr-FR') : 'Jamais',
              initials: doc.initials || doc.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
              avatar: doc.avatar,
            })));
          }
        }

        // Charger les candidatures/pré-inscriptions
        const appsRes = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.applications
        );
        if (appsRes.documents.length > 0) {
          const loadedApps = appsRes.documents.map((doc: any) => ({
            id: doc.$id,
            name: doc.name,
            email: doc.email,
            program: doc.program,
            dateApplied: doc.dateApplied || 'Récemment',
            status: doc.status || 'New',
            initials: doc.initials || doc.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
          }));
          setPreRegistrations(loadedApps);
        }

        // Charger les logs d'activités
        if (APPWRITE_CONFIG.collections.logs) {
          const logsRes = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.logs
          );
          if (logsRes.documents.length > 0) {
            const loadedLogs = logsRes.documents.map((doc: any) => ({
              id: doc.$id,
              type: doc.type,
              user: doc.user,
              text: doc.text,
              time: doc.time || 'À l\'instant'
            }));
            setActivityLogs(loadedLogs);
          }
        }
      } catch (err) {
        console.warn("Échec du chargement de la base de données Appwrite. Vérifiez la configuration de la console.", err);
      }
    };
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn]);

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

  // Users Filter States
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUserStatusFilter, setSelectedUserStatusFilter] = useState<string>('Tous');

  // Programmes panel toggle
  const [showAddProgramForm, setShowAddProgramForm] = useState(false);

  // Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const matchesLocalFallback = email === DEMO_ADMIN.email && password === DEMO_ADMIN.password;

    // Mode autonome (backend non configuré) : authentification locale.
    if (!isAppwriteDbConfigured()) {
      if (matchesLocalFallback) {
        onLoginSuccess();
        setActiveTab('admin-dashboard');
      } else {
        setLoginError('Accès refusé. Vérifiez vos identifiants et réessayez.');
      }
      return;
    }

    // Backend configuré : authentification réelle via Appwrite (session propre).
    setIsLoading(true);
    try {
      await account.deleteSession({ sessionId: 'current' }).catch(() => undefined);
      await account.createEmailPasswordSession({ email, password });
      onLoginSuccess();
      setActiveTab('admin-dashboard');
    } catch (err: any) {
      // Seule une panne réseau (backend injoignable) autorise le repli local ;
      // un refus explicite d'Appwrite (401…) n'est jamais contourné.
      const isNetworkError = err?.name === 'TypeError' || err?.code === undefined || err?.code === 0;
      if (isNetworkError && matchesLocalFallback) {
        console.warn('Backend injoignable — repli sur la session locale.', err);
        onLoginSuccess();
        setActiveTab('admin-dashboard');
      } else {
        console.warn('Connexion administrateur Appwrite refusée.', err);
        setLoginError('Accès refusé. Vérifiez vos identifiants et réessayez.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
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

    if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.cmsUsers) {
      try {
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.cmsUsers,
          newUser.id,
          {
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            status: newUser.status,
            initials: newUser.initials,
            lastLogin: new Date().toISOString(),
          }
        );
      } catch (err) {
        console.error("Échec de la création de l'utilisateur sur Appwrite:", err);
      }
    }

    // Add activity log with Appwrite support
    logActivity('registration', 'Super Admin', `a créé l'utilisateur CMS : ${newUserName} (${newUserRole}).`);

    // Reset Form
    setNewUserName('');
    setNewUserEmail('');
    setActiveTab('admin-users');
  };

  const resetProgramForm = () => {
    setNewProgramTitle('');
    setNewProgramDescription('');
    setNewProgramType('Master');
    setNewProgramCategory('Tech');
    setNewProgramDuration('2 ans (Full-time)');
    setNewProgramImage('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80');
    setNewProgramIsNew(true);
    setEditingProgramId(null);
    setShowAddProgramForm(false);
  };

  const startEditProgram = (p: Program) => {
    setEditingProgramId(p.id);
    setNewProgramTitle(p.title);
    setNewProgramDescription(p.description);
    setNewProgramType(p.type);
    setNewProgramCategory(p.category);
    setNewProgramDuration(p.duration);
    setNewProgramImage(p.image);
    setNewProgramIsNew(!!p.isNew);
    setShowAddProgramForm(true);
  };

  const handleSubmitProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgramTitle || !newProgramDescription) return;

    if (editingProgramId) {
      const updated: Partial<Program> = {
        title: newProgramTitle,
        description: newProgramDescription,
        type: newProgramType,
        category: newProgramCategory,
        duration: newProgramDuration,
        image: newProgramImage,
        isNew: newProgramIsNew,
      };
      setPrograms((curr) => curr.map((p) => p.id === editingProgramId ? { ...p, ...updated } : p));
      if (isAppwriteDbConfigured()) {
        try {
          await databases.updateDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.programs, editingProgramId, updated as any);
        } catch (err) {
          console.error("Échec de la mise à jour du programme sur Appwrite:", err);
        }
      }
      logActivity('article', 'Super Admin', `a modifié le programme : ${newProgramTitle}.`);
      resetProgramForm();
      return;
    }

    const progId = `prog-${Math.floor(1000 + Math.random() * 9500)}`;
    const newProgram: Program = {
      id: progId,
      title: newProgramTitle,
      description: newProgramDescription,
      type: newProgramType,
      category: newProgramCategory,
      duration: newProgramDuration,
      image: newProgramImage,
      isNew: newProgramIsNew
    };

    setPrograms((curr) => [newProgram, ...curr]);

    if (isAppwriteDbConfigured()) {
      try {
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.programs,
          progId,
          {
            title: newProgram.title,
            description: newProgram.description,
            type: newProgram.type,
            category: newProgram.category,
            duration: newProgram.duration,
            image: newProgram.image,
            isNew: newProgram.isNew
          }
        );
      } catch (err) {
        console.error("Échec de création du programme sur Appwrite:", err);
      }
    }

    logActivity('article', 'Super Admin', `a ajouté un nouveau programme : ${newProgramTitle}.`);
    resetProgramForm();
  };

  const handleDeleteUser = async (id: string) => {
    const targetUser = usersList.find(u => u.id === id);
    setUsersList((curr) => curr.filter((u) => u.id !== id));

    if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.cmsUsers) {
      try {
        await databases.deleteDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.cmsUsers, id);
      } catch (err) {
        console.error("Échec de la suppression de l'utilisateur sur Appwrite:", err);
      }
    }

    if (targetUser) {
      logActivity('error', 'Super Admin', `a supprimé l'utilisateur CMS : ${targetUser.name}.`);
    }
  };

  const handleDeleteProgram = async (id: string) => {
    const targetProgram = programs.find(p => p.id === id);
    setPrograms((curr) => curr.filter((p) => p.id !== id));

    if (isAppwriteDbConfigured()) {
      try {
        await databases.deleteDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.programs, id);
      } catch (err) {
        console.error("Échec de la suppression du programme sur Appwrite:", err);
      }
    }

    if (targetProgram) {
      logActivity('article', 'Super Admin', `a supprimé le programme : ${targetProgram.title}.`);
    }
  };

  // --- Témoignages (modération des soumissions alumni) ---
  const handleApproveTestimonial = async (id: string) => {
    const target = pendingTestimonials.find(t => t.id === id);
    if (!target) return;
    const approved: Testimonial = { ...target, id: `test-${Math.floor(1000 + Math.random() * 9000)}` };
    setPendingTestimonials((curr) => curr.filter((t) => t.id !== id));
    setTestimonials((curr) => [approved, ...curr]);

    if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.testimonials) {
      try {
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.testimonials,
          approved.id,
          { name: approved.name, role: approved.role, text: approved.text, image: approved.image, promo: approved.promo, category: approved.category }
        );
      } catch (err) {
        console.error("Échec de la publication du témoignage sur Appwrite:", err);
      }
    }
    logActivity('alumni', 'Super Admin', `a approuvé et publié le témoignage de ${target.name}.`);
  };

  const handleRejectTestimonial = (id: string) => {
    const target = pendingTestimonials.find(t => t.id === id);
    setPendingTestimonials((curr) => curr.filter((t) => t.id !== id));
    if (target) logActivity('error', 'Super Admin', `a rejeté le témoignage soumis par ${target.name}.`);
  };

  const handleSaveEditedTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTestimonial) return;
    const edited = editingTestimonial;
    setTestimonials((curr) => curr.map((t) => t.id === edited.id ? edited : t));

    if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.testimonials) {
      try {
        await databases.updateDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.testimonials,
          edited.id,
          { name: edited.name, role: edited.role, text: edited.text, promo: edited.promo, category: edited.category }
        );
      } catch (err) {
        console.error("Échec de la mise à jour du témoignage sur Appwrite:", err);
      }
    }
    logActivity('alumni', 'Super Admin', `a modifié le témoignage de ${edited.name}.`);
    setEditingTestimonial(null);
  };

  const handleDeleteTestimonial = async (id: string) => {
    const target = testimonials.find(t => t.id === id);
    setTestimonials((curr) => curr.filter((t) => t.id !== id));

    if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.testimonials) {
      try {
        await databases.deleteDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.testimonials, id);
      } catch (err) {
        console.error("Échec de la suppression du témoignage sur Appwrite:", err);
      }
    }
    if (target) logActivity('alumni', 'Super Admin', `a supprimé le témoignage de ${target.name}.`);
  };

  // --- Actualités (création + édition) ---
  const resetNewsForm = () => {
    setNewNewsTitle('');
    setNewNewsDescription('');
    setNewNewsCategory('Annonces');
    setEditingNewsId(null);
    setShowAddNewsForm(false);
  };

  const startEditNews = (n: NewsArticle) => {
    setEditingNewsId(n.id);
    setNewNewsTitle(n.title);
    setNewNewsDescription(n.description);
    setNewNewsCategory(n.category);
    setShowAddNewsForm(true);
  };

  const handleSubmitNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNewsTitle || !newNewsDescription) return;

    if (editingNewsId) {
      // Mise à jour
      setNews((curr) => curr.map((n) => n.id === editingNewsId
        ? { ...n, title: newNewsTitle, description: newNewsDescription, category: newNewsCategory }
        : n));
      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.news) {
        try {
          await databases.updateDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.news, editingNewsId,
            { title: newNewsTitle, description: newNewsDescription, category: newNewsCategory });
        } catch (err) {
          console.error("Échec de la mise à jour de l'actualité sur Appwrite:", err);
        }
      }
      logActivity('article', 'Super Admin', `a modifié l'actualité : ${newNewsTitle}.`);
      resetNewsForm();
      return;
    }

    const id = `news-${Math.floor(1000 + Math.random() * 9000)}`;
    const newArticle: NewsArticle = {
      id,
      title: newNewsTitle,
      description: newNewsDescription,
      date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
      category: newNewsCategory,
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    };

    setNews((curr) => [newArticle, ...curr]);

    if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.news) {
      try {
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.news,
          id,
          {
            title: newArticle.title,
            description: newArticle.description,
            date: new Date().toISOString(),
            category: newArticle.category,
            image: newArticle.image,
          }
        );
      } catch (err) {
        console.error("Échec de la création de l'actualité sur Appwrite:", err);
      }
    }

    logActivity('article', 'Super Admin', `a publié l'actualité : ${newNewsTitle}.`);
    resetNewsForm();
  };

  const handleDeleteNews = async (id: string) => {
    const target = news.find(n => n.id === id);
    setNews((curr) => curr.filter((n) => n.id !== id));

    if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.news) {
      try {
        await databases.deleteDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.news, id);
      } catch (err) {
        console.error("Échec de la suppression de l'actualité sur Appwrite:", err);
      }
    }
    if (target) logActivity('article', 'Super Admin', `a supprimé l'actualité : ${target.title}.`);
  };

  // --- Soutien & Dons (reçus via le formulaire public) ---
  const handleConfirmDonation = (id: string) => {
    setDonations((curr) => curr.map((d) => d.id === id ? { ...d, status: 'Confirmé' } : d));
    const target = donations.find(d => d.id === id);
    if (target) logActivity('alumni', 'Super Admin', `a confirmé le don de ${target.donor} (${target.amount.toLocaleString('fr-FR')} FCFA).`);
  };

  const handleDeleteDonation = (id: string) => {
    setDonations((curr) => curr.filter((d) => d.id !== id));
  };

  // --- Marketing / Campagnes (CRUD complet) ---
  const resetCampaignForm = () => {
    setCampaignName('');
    setCampaignChannel('Email + Réseaux');
    setCampaignReach('');
    setEditingCampaignId(null);
    setShowAddCampaignForm(false);
  };

  const startEditCampaign = (c: Campaign) => {
    setEditingCampaignId(c.id);
    setCampaignName(c.name);
    setCampaignChannel(c.channel);
    setCampaignReach(String(c.reach));
    setShowAddCampaignForm(true);
  };

  const handleSubmitCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName) return;
    const reach = Number(campaignReach) || 0;
    if (editingCampaignId) {
      setCampaigns((curr) => curr.map((c) => c.id === editingCampaignId
        ? { ...c, name: campaignName, channel: campaignChannel, reach }
        : c));
      logActivity('article', 'Super Admin', `a modifié la campagne : ${campaignName}.`);
    } else {
      const newCampaign: Campaign = {
        id: `camp-${Math.floor(1000 + Math.random() * 9000)}`,
        name: campaignName,
        channel: campaignChannel,
        status: 'Active',
        reach,
      };
      setCampaigns((curr) => [newCampaign, ...curr]);
      logActivity('article', 'Super Admin', `a créé la campagne : ${campaignName}.`);
    }
    resetCampaignForm();
  };

  const handleDeleteCampaign = (id: string) => {
    setCampaigns((curr) => curr.filter((c) => c.id !== id));
  };

  const toggleCampaignStatus = (id: string) => {
    setCampaigns((curr) =>
      curr.map((c) => c.id === id ? { ...c, status: c.status === 'Active' ? 'En pause' : 'Active' } : c)
    );
  };

  // --- Utilisateurs (édition) ---
  const handleSaveEditedUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const edited = editingUser;
    setUsersList((curr) => curr.map((u) => u.id === edited.id ? edited : u));

    if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.cmsUsers) {
      try {
        await databases.updateDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.cmsUsers, edited.id,
          { name: edited.name, email: edited.email, role: edited.role, status: edited.status });
      } catch (err) {
        console.error("Échec de la mise à jour de l'utilisateur sur Appwrite:", err);
      }
    }
    logActivity('registration', 'Super Admin', `a modifié l'utilisateur CMS : ${edited.name}.`);
    setEditingUser(null);
  };

  // --- Paramètres ---
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaved(true);
    logActivity('article', 'Super Admin', `a mis à jour les paramètres du CMS.`);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const handleApprovePreRegistration = async (id: string) => {
    setPreRegistrations((curr) => 
      curr.map((p) => p.id === id ? { ...p, status: 'Accepted' } : p)
    );

    if (isAppwriteDbConfigured()) {
      try {
        await databases.updateDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.applications,
          id,
          { status: 'Accepted' }
        );
        logActivity('registration', 'Admin', `a approuvé la candidature ID #${id}.`);
      } catch (err) {
        console.error("Failed to approve application on Appwrite:", err);
      }
    } else {
      logActivity('registration', 'Admin', `a approuvé la candidature ID #${id}.`);
    }
  };

  const handleDenyPreRegistration = async (id: string) => {
    setPreRegistrations((curr) => 
      curr.map((p) => p.id === id ? { ...p, status: 'Rejected' } : p)
    );

    if (isAppwriteDbConfigured()) {
      try {
        await databases.updateDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.applications,
          id,
          { status: 'Rejected' }
        );
        logActivity('error', 'Admin', `a rejeté la candidature ID #${id}.`);
      } catch (err) {
        console.error("Failed to reject application on Appwrite:", err);
      }
    } else {
      logActivity('error', 'Admin', `a rejeté la candidature ID #${id}.`);
    }
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

  // LOGIN SCREEN VIEW — affiché pour toute vue admin tant que l'admin n'est pas authentifié.
  if (!isLoggedIn) {
    return (
      <div className="bg-[#00020e] min-h-screen flex items-center justify-center py-12 px-6 relative overflow-hidden text-white">
        
        {/* Particle/Grid lines Simulation overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        </div>

        <div className="max-w-md w-full bg-[#161922] rounded-2xl border border-white/10 p-8 shadow-2xl relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <button
              onClick={() => setActiveTab('home')}
              className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors mb-4 border border-white/10 px-3 py-1 rounded"
            >
              <ArrowLeft className="w-3 h-3" />
              Retour au site public
            </button>
            <div className="w-12 h-12 bg-emerald-500/10 text-[#6ffbbe] rounded-xl flex items-center justify-center mx-auto border border-[#6ffbbe]/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="font-sans font-bold text-2xl text-white tracking-tight">Accès Sécurisé CMS</h1>
            <p className="text-white/60 text-xs">Identifiez-vous pour accéder à la console d'administration</p>
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
                  placeholder="Adresse email professionnelle"
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#6ffbbe] outline-none text-white font-medium placeholder:text-white/25"
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
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#6ffbbe] outline-none text-white placeholder:text-white/25"
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
              Accès réservé au personnel autorisé de l'IDLA.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // LOGGED IN MODULE VIEWS
  // L'URL /admin (tab 'admin-login') affiche le tableau de bord une fois authentifié.
  const view = activeTab === 'admin-login' ? 'admin-dashboard' : activeTab;
  const unreadCount = Math.max(0, activityLogs.length - lastSeenLogCount);
  const toggleNotifications = () => {
    setShowNotifications((open) => {
      const next = !open;
      if (next) setLastSeenLogCount(activityLogs.length);
      return next;
    });
  };
  return (
    <div className="bg-[#f8f9ff] min-h-screen text-[#0b1c30] py-8 px-6 md:px-10">

      {/* Top action header */}
      <header className="flex justify-between items-center pb-6 border-b border-[#c6c6cf]/30 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#00020e] uppercase tracking-wide">IDLA CMS Académique</h2>
          <p className="text-xs text-slate-400 mt-1">Gouvernance du Portail d'Admissions et de Contenus</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={toggleNotifications}
              className="p-2 text-slate-400 hover:text-[#0b1c30] bg-white rounded-lg border border-[#c6c6cf] relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-[#c6c6cf] shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#c6c6cf]/40 bg-slate-50">
                    <h4 className="text-xs font-bold text-[#00020e] uppercase tracking-wider">Notifications</h4>
                    <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-[#00020e]">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-[#c6c6cf]/20">
                    {activityLogs.length === 0 && (
                      <p className="px-4 py-6 text-center text-xs text-slate-400 italic">Aucune notification.</p>
                    )}
                    {activityLogs.map((log) => (
                      <div key={log.id} className="px-4 py-3 hover:bg-slate-50 flex gap-3">
                        <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                          log.type === 'error' ? 'bg-rose-500'
                          : log.type === 'registration' ? 'bg-emerald-500'
                          : log.type === 'alumni' ? 'bg-indigo-500' : 'bg-amber-500'
                        }`} />
                        <div className="text-xs leading-relaxed">
                          <span className="font-bold text-[#00020e]">{log.user}</span>{' '}
                          <span className="text-[#45464e]">{log.text}</span>
                          <div className="text-[10px] text-slate-400 mt-0.5">{log.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#00020e] text-white flex items-center justify-center font-bold text-xs">
              {settingsName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'AD'}
            </div>
            <div>
              <p className="text-xs font-bold leading-none text-[#00020e]">{settingsName || 'Administrateur'}</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Super Admin</p>
            </div>
          </div>
        </div>
      </header>

      {/* DASHBOARD VIEW MODULE */}
      {view === 'admin-dashboard' && (
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
                            <button
                              onClick={() => { setSelectedPreRegId(p.id); setActiveTab('admin-preregistrations'); }}
                              className="mx-auto flex items-center gap-1.5 bg-[#006c49] hover:bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all"
                              title="Examiner le dossier"
                            >
                              <Eye className="w-3.5 h-3.5" /> Examiner
                            </button>
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
      {view === 'admin-users' && (
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
                      <div className="flex justify-center items-center gap-1">
                        <button
                          onClick={() => setEditingUser(u)}
                          className="text-slate-500 hover:text-[#006c49] p-1.5 hover:bg-slate-100 rounded transition-all"
                          title="Modifier l'utilisateur"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {u.id !== '8821' ? ( // Protège le Super Admin principal de la suppression
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded transition-all"
                            title="Supprimer l'utilisateur"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[9px] text-slate-300 italic">Système</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE USER FORM VIEW */}
      {view === 'admin-add-user' && (
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

      {/* PROGRAMMES MANAGEMENT MODULE */}
      {view === 'admin-programmes' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-sans font-bold text-lg text-[#00020e]">Programmes académiques IDLA</h3>
            <button
              onClick={() => showAddProgramForm ? resetProgramForm() : setShowAddProgramForm(true)}
              className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow"
            >
              <Plus className="w-4 h-4" />
              {showAddProgramForm ? 'Fermer le formulaire' : 'Ajouter un programme'}
            </button>
          </div>

          {showAddProgramForm && (
            <form onSubmit={handleSubmitProgram} className="bg-white border border-[#c6c6cf] rounded-2xl p-6 space-y-4 shadow-sm">
              <p className="text-sm font-bold text-[#00020e]">{editingProgramId ? 'Modifier le programme' : 'Nouveau programme'}</p>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Titre du programme *</label>
                <input
                  type="text"
                  value={newProgramTitle}
                  onChange={(e) => setNewProgramTitle(e.target.value)}
                  placeholder="ex: Master en Cybersécurité"
                  className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Description *</label>
                <textarea
                  value={newProgramDescription}
                  onChange={(e) => setNewProgramDescription(e.target.value)}
                  placeholder="Description courte du programme"
                  rows={3}
                  className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Type *</label>
                  <select
                    value={newProgramType}
                    onChange={(e) => setNewProgramType(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-bold text-[#00020e]"
                  >
                    <option value="Master">Master</option>
                    <option value="Doctorat">Doctorat</option>
                    <option value="Certification">Certification</option>
                    <option value="Bachelor">Bachelor</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Catégorie *</label>
                  <select
                    value={newProgramCategory}
                    onChange={(e) => setNewProgramCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-bold text-[#00020e]"
                  >
                    <option value="Sciences">Sciences</option>
                    <option value="Management">Management</option>
                    <option value="Tech">Tech</option>
                    <option value="Droit">Droit</option>
                    <option value="Santé">Santé</option>
                    <option value="Communication">Communication</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Durée *</label>
                  <input
                    type="text"
                    value={newProgramDuration}
                    onChange={(e) => setNewProgramDuration(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-medium"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">URL Image *</label>
                  <input
                    type="text"
                    value={newProgramImage}
                    onChange={(e) => setNewProgramImage(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-medium"
                    required
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                <input
                  type="checkbox"
                  checked={newProgramIsNew}
                  onChange={(e) => setNewProgramIsNew(e.target.checked)}
                  className="w-4 h-4 text-[#006c49] border-[#c6c6cf] rounded focus:ring-[#006c49]"
                />
                Marquer comme "Nouveau"
              </label>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#c6c6cf]/30">
                <button
                  type="button"
                  onClick={resetProgramForm}
                  className="px-5 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 border border-[#c6c6cf]/40 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-6 py-2.5 rounded-lg transition-all"
                >
                  {editingProgramId ? 'Mettre à jour' : 'Enregistrer le programme'}
                </button>
              </div>
            </form>
          )}

          <div className="bg-white border border-[#c6c6cf] rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 border-b border-[#c6c6cf]/30 font-bold uppercase">
                  <th className="p-4">Programme</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Catégorie</th>
                  <th className="p-4">Durée</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c6c6cf]/20">
                {programs.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/40">
                    <td className="p-4 font-semibold text-[#00020e]">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-[#006c49] shrink-0" />
                        <span>{p.title}</span>
                        {p.isNew && (
                          <span className="bg-[#006c49]/10 text-[#006c49] text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Nouveau</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-600">{p.type}</td>
                    <td className="p-4 font-medium text-slate-600">{p.category}</td>
                    <td className="p-4 text-slate-400">{p.duration}</td>
                    <td className="p-4">
                      <div className="flex justify-center items-center gap-1">
                        <button
                          onClick={() => startEditProgram(p)}
                          className="text-slate-500 hover:text-[#006c49] p-1.5 hover:bg-slate-100 rounded transition-all"
                          title="Modifier le programme"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProgram(p.id)}
                          className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded transition-all"
                          title="Supprimer le programme"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {programs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 italic">Aucun programme enregistré.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TÉMOIGNAGES — MODÉRATION DES SOUMISSIONS ALUMNI */}
      {view === 'admin-testimonials' && (
        <div className="space-y-8">
          <div>
            <h3 className="font-sans font-bold text-lg text-[#00020e]">Témoignages</h3>
            <p className="text-xs text-slate-400 mt-1">Les alumni soumettent leurs témoignages via le site public. Approuvez-les pour les publier.</p>
          </div>

          {/* File de modération */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#00020e] uppercase tracking-wider flex items-center gap-2">
              En attente de modération
              {pendingTestimonials.length > 0 && (
                <span className="bg-amber-500/10 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{pendingTestimonials.length}</span>
              )}
            </h4>
            {pendingTestimonials.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400 italic bg-white rounded-2xl border border-[#c6c6cf]">Aucune soumission en attente.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingTestimonials.map((t) => (
                  <div key={t.id} className="bg-white p-5 rounded-2xl border border-amber-500/30 shadow-sm space-y-3">
                    <p className="text-xs text-[#0b1c30] italic leading-relaxed">"{t.text}"</p>
                    <div className="flex items-center gap-3 pt-3 border-t border-[#c6c6cf]/30">
                      <img className="w-9 h-9 rounded-full object-cover border border-[#c6c6cf]" alt={t.name} src={t.image} />
                      <div className="flex-grow">
                        <h4 className="font-bold text-xs text-[#00020e]">{t.name}</h4>
                        <p className="text-[10px] text-slate-400">{t.role} • {t.promo}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleApproveTestimonial(t.id)}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approuver
                      </button>
                      <button onClick={() => handleRejectTestimonial(t.id)}
                        className="flex-1 bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 text-[11px] font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all">
                        <XCircle className="w-3.5 h-3.5" /> Rejeter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Témoignages publiés */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#00020e] uppercase tracking-wider">Publiés sur le site ({testimonials.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div key={t.id} className="bg-white p-6 rounded-2xl border border-[#c6c6cf] shadow-sm flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Quote className="w-6 h-6 text-[#006c49]" />
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditingTestimonial(t)} title="Modifier"
                          className="text-slate-500 hover:text-[#006c49] p-1.5 hover:bg-slate-100 rounded transition-all">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteTestimonial(t.id)} title="Supprimer"
                          className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-[#0b1c30] italic leading-relaxed">"{t.text}"</p>
                  </div>
                  <div className="flex items-center gap-3 pt-4 mt-4 border-t border-[#c6c6cf]/30">
                    <img className="w-10 h-10 rounded-full object-cover border border-[#c6c6cf]" alt={t.name} src={t.image} />
                    <div>
                      <h4 className="font-bold text-xs text-[#00020e]">{t.name}</h4>
                      <p className="text-[10px] text-slate-400">{t.role} • {t.promo}</p>
                    </div>
                  </div>
                </div>
              ))}
              {testimonials.length === 0 && (
                <p className="col-span-full p-8 text-center text-slate-400 italic bg-white rounded-2xl border border-[#c6c6cf]">Aucun témoignage publié.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ACTUALITÉS MANAGEMENT MODULE */}
      {view === 'admin-news' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-sans font-bold text-lg text-[#00020e]">Actualités & communiqués</h3>
            <button
              onClick={() => showAddNewsForm ? resetNewsForm() : setShowAddNewsForm(true)}
              className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow"
            >
              <Plus className="w-4 h-4" />
              {showAddNewsForm ? 'Fermer le formulaire' : 'Publier une actualité'}
            </button>
          </div>

          {showAddNewsForm && (
            <form onSubmit={handleSubmitNews} className="bg-white border border-[#c6c6cf] rounded-2xl p-6 space-y-4 shadow-sm">
              <p className="text-sm font-bold text-[#00020e]">{editingNewsId ? "Modifier l'actualité" : 'Nouvelle actualité'}</p>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Titre *</label>
                <input type="text" value={newNewsTitle} onChange={(e) => setNewNewsTitle(e.target.value)}
                  placeholder="ex: Ouverture des inscriptions 2026"
                  className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-medium" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Description *</label>
                <textarea value={newNewsDescription} onChange={(e) => setNewNewsDescription(e.target.value)} rows={3}
                  className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-medium" required />
              </div>
              <div className="space-y-1.5 md:w-1/2">
                <label className="text-xs font-bold text-slate-500 uppercase">Catégorie</label>
                <select value={newNewsCategory} onChange={(e) => setNewNewsCategory(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-bold text-[#00020e]">
                  <option value="Annonces">Annonces</option>
                  <option value="Événements">Événements</option>
                  <option value="Académique">Académique</option>
                  <option value="Partenariats">Partenariats</option>
                  <option value="Alumni">Alumni</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-[#c6c6cf]/30">
                <button type="button" onClick={resetNewsForm}
                  className="px-5 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 border border-[#c6c6cf]/40 transition-colors">Annuler</button>
                <button type="submit" className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-6 py-2.5 rounded-lg transition-all">{editingNewsId ? 'Mettre à jour' : "Publier l'actualité"}</button>
              </div>
            </form>
          )}

          <div className="bg-white border border-[#c6c6cf] rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 border-b border-[#c6c6cf]/30 font-bold uppercase">
                  <th className="p-4">Titre</th>
                  <th className="p-4">Catégorie</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c6c6cf]/20">
                {news.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50/40">
                    <td className="p-4 font-semibold text-[#00020e]">
                      <div className="flex items-center gap-2">
                        <Newspaper className="w-3.5 h-3.5 text-[#006c49] shrink-0" />
                        <span className="line-clamp-1">{n.title}</span>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-600">{n.category}</td>
                    <td className="p-4 text-slate-400">{n.date}</td>
                    <td className="p-4">
                      <div className="flex justify-center items-center gap-1">
                        <button onClick={() => startEditNews(n)} title="Modifier"
                          className="text-slate-500 hover:text-[#006c49] p-1.5 hover:bg-slate-100 rounded transition-all">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteNews(n.id)} title="Supprimer"
                          className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {news.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-400 italic">Aucune actualité publiée.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRÉ-INSCRIPTIONS MODULE */}
      {view === 'admin-preregistrations' && (() => {
        const selected = preRegistrations.find(p => p.id === selectedPreRegId) || null;

        // --- Vue détail : examen approfondi du dossier ---
        if (selected) {
          const statusBadge = selected.status === 'Accepted'
            ? { cls: 'bg-emerald-500/10 text-emerald-700', label: 'Dossier admis' }
            : selected.status === 'Rejected'
            ? { cls: 'bg-rose-500/10 text-rose-700', label: 'Dossier refusé' }
            : { cls: 'bg-amber-500/10 text-amber-700', label: 'En cours d\'examen' };
          return (
            <div className="space-y-6 max-w-4xl">
              <button onClick={() => setSelectedPreRegId(null)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#00020e] border border-[#c6c6cf]/50 px-3 py-1.5 rounded-lg transition-colors">
                <ArrowLeft className="w-4 h-4" /> Retour à la liste
              </button>

              <div className="bg-white border border-[#c6c6cf] rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#c6c6cf]/30">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#00020e] text-white flex items-center justify-center font-bold text-lg shrink-0">{selected.initials}</div>
                    <div>
                      <h3 className="font-sans font-bold text-xl text-[#00020e]">{selected.name}</h3>
                      <p className="text-xs text-slate-400">{selected.email}{selected.phone ? ` • ${selected.phone}` : ''}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${statusBadge.cls}`}>{statusBadge.label}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  {[
                    ['Filière d\'intérêt', selected.program],
                    ['Date de dépôt', selected.dateApplied],
                    ['Nationalité', selected.nationality || '—'],
                    ['Dernier diplôme', selected.highestDegree || '—'],
                    ['Année d\'obtention', selected.graduationYear ? String(selected.graduationYear) : '—'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                      <p className="text-sm font-semibold text-[#00020e] mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>

                {selected.motivation && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lettre de motivation</p>
                    <p className="text-sm text-[#45464e] leading-relaxed bg-slate-50 border border-[#c6c6cf]/40 rounded-xl p-4">{selected.motivation}</p>
                  </div>
                )}

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Pièces justificatives</p>
                  <div className="flex flex-wrap gap-2">
                    {(selected.documents && selected.documents.length > 0) ? selected.documents.map((doc) => (
                      <span key={doc} className="inline-flex items-center gap-1.5 bg-slate-50 border border-[#c6c6cf]/50 text-xs font-medium text-[#0b1c30] px-3 py-1.5 rounded-lg">
                        <FileText className="w-3.5 h-3.5 text-[#006c49]" /> {doc}
                      </span>
                    )) : <span className="text-xs text-slate-400 italic">Aucune pièce jointe.</span>}
                  </div>
                </div>

                <div className="pt-6 flex flex-wrap justify-end gap-3 border-t border-[#c6c6cf]/30">
                  {selected.status !== 'Accepted' && selected.status !== 'Rejected' ? (
                    <>
                      <button onClick={() => { handleDenyPreRegistration(selected.id); }}
                        className="flex items-center gap-1.5 bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-bold px-5 py-2.5 rounded-lg transition-all">
                        <XCircle className="w-4 h-4" /> Refuser le dossier
                      </button>
                      <button onClick={() => { handleApprovePreRegistration(selected.id); }}
                        className="flex items-center gap-1.5 bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-all">
                        <CheckCircle2 className="w-4 h-4" /> Accepter le candidat
                      </button>
                    </>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Décision déjà rendue. Vous pouvez revenir à la liste.</p>
                  )}
                </div>
              </div>
            </div>
          );
        }

        // --- Vue liste ---
        return (
          <div className="space-y-6">
            <h3 className="font-sans font-bold text-lg text-[#00020e]">Pré-inscriptions & candidatures</h3>
            <div className="bg-white border border-[#c6c6cf] rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 border-b border-[#c6c6cf]/30 font-bold uppercase">
                    <th className="p-4">Candidat</th>
                    <th className="p-4">Filière d'intérêt</th>
                    <th className="p-4">Date de dépôt</th>
                    <th className="p-4">Statut</th>
                    <th className="p-4 text-center">Dossier</th>
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
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          p.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-700'
                          : p.status === 'Rejected' ? 'bg-rose-500/10 text-rose-700'
                          : 'bg-amber-500/10 text-amber-700'
                        }`}>{p.status === 'Accepted' ? 'Admis' : p.status === 'Rejected' ? 'Refusé' : 'À examiner'}</span>
                      </td>
                      <td className="p-4">
                        <button onClick={() => setSelectedPreRegId(p.id)}
                          className="mx-auto flex items-center gap-1.5 bg-[#006c49] hover:bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all"
                          title="Examiner le dossier">
                          <Eye className="w-3.5 h-3.5" /> Examiner le dossier
                        </button>
                      </td>
                    </tr>
                  ))}
                  {preRegistrations.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-400 italic">Aucune pré-inscription en attente.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* SOUTIEN & DONS MODULE */}
      {view === 'admin-donations' && (
        <div className="space-y-6">
          <h3 className="font-sans font-bold text-lg text-[#00020e]">Soutien & Dons</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-[#c6c6cf] shadow-sm space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total collecté</p>
              <span className="text-3xl font-extrabold text-[#00020e]">
                {donations.reduce((sum, d) => sum + d.amount, 0).toLocaleString('fr-FR')} <span className="text-sm text-slate-400">FCFA</span>
              </span>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-[#c6c6cf] shadow-sm space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nombre de dons</p>
              <span className="text-3xl font-extrabold text-[#00020e]">{donations.length}</span>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-[#c6c6cf] shadow-sm space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Don moyen</p>
              <span className="text-3xl font-extrabold text-[#00020e]">
                {(donations.length ? Math.round(donations.reduce((s, d) => s + d.amount, 0) / donations.length) : 0).toLocaleString('fr-FR')} <span className="text-sm text-slate-400">FCFA</span>
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400">Dons reçus via le formulaire public « Faire un don » du site.</p>

          <div className="bg-white border border-[#c6c6cf] rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 border-b border-[#c6c6cf]/30 font-bold uppercase">
                  <th className="p-4">Donateur</th>
                  <th className="p-4">Montant</th>
                  <th className="p-4">Message</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c6c6cf]/20">
                {donations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/40">
                    <td className="p-4 font-semibold text-[#00020e]">
                      <div className="flex items-center gap-2"><HeartHandshake className="w-3.5 h-3.5 text-[#006c49] shrink-0" /> {d.donor}</div>
                      <div className="text-[10px] text-slate-400 font-medium pl-5">{d.email}</div>
                    </td>
                    <td className="p-4 font-bold text-[#006c49] whitespace-nowrap">{d.amount.toLocaleString('fr-FR')} FCFA</td>
                    <td className="p-4 text-slate-500 max-w-[200px]"><span className="line-clamp-2">{d.message || '—'}</span></td>
                    <td className="p-4 text-slate-400 whitespace-nowrap">{d.date}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        d.status === 'Confirmé' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'
                      }`}>● {d.status}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center items-center gap-1">
                        {d.status !== 'Confirmé' && (
                          <button onClick={() => handleConfirmDonation(d.id)} title="Confirmer la réception"
                            className="text-emerald-600 hover:text-emerald-700 p-1.5 hover:bg-emerald-50 rounded transition-all">
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDeleteDonation(d.id)} title="Supprimer"
                          className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {donations.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-400 italic">Aucun don reçu pour l'instant.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MARKETER MODULE — CRUD complet des campagnes */}
      {view === 'admin-marketing' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-sans font-bold text-lg text-[#00020e]">Campagnes marketing</h3>
            <button
              onClick={() => showAddCampaignForm ? resetCampaignForm() : setShowAddCampaignForm(true)}
              className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow"
            >
              <Plus className="w-4 h-4" />
              {showAddCampaignForm ? 'Fermer le formulaire' : 'Nouvelle campagne'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-[#c6c6cf] shadow-sm space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Campagnes actives</p>
              <span className="text-3xl font-extrabold text-[#00020e]">{campaigns.filter(c => c.status === 'Active').length}</span>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-[#c6c6cf] shadow-sm space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Portée cumulée</p>
              <span className="text-3xl font-extrabold text-[#00020e]">{campaigns.reduce((s, c) => s + c.reach, 0).toLocaleString('fr-FR')}</span>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-[#c6c6cf] shadow-sm space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Taux d'engagement</p>
              <span className="text-3xl font-extrabold text-[#00020e]">6.4%</span>
            </div>
          </div>

          {showAddCampaignForm && (
            <form onSubmit={handleSubmitCampaign} className="bg-white border border-[#c6c6cf] rounded-2xl p-6 space-y-4 shadow-sm">
              <p className="text-sm font-bold text-[#00020e]">{editingCampaignId ? 'Modifier la campagne' : 'Nouvelle campagne'}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nom *</label>
                  <input type="text" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="ex: Campagne Bourses 2026"
                    className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-medium" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Canal</label>
                  <input type="text" value={campaignChannel} onChange={(e) => setCampaignChannel(e.target.value)} placeholder="ex: Email + Réseaux"
                    className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Portée estimée</label>
                  <input type="number" min="0" value={campaignReach} onChange={(e) => setCampaignReach(e.target.value)} placeholder="ex: 5000"
                    className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-medium" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-[#c6c6cf]/30">
                <button type="button" onClick={resetCampaignForm}
                  className="px-5 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 border border-[#c6c6cf]/40 transition-colors">Annuler</button>
                <button type="submit" className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-6 py-2.5 rounded-lg transition-all">{editingCampaignId ? 'Mettre à jour' : 'Créer la campagne'}</button>
              </div>
            </form>
          )}

          <div className="bg-white border border-[#c6c6cf] rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 border-b border-[#c6c6cf]/30 font-bold uppercase">
                  <th className="p-4">Campagne</th>
                  <th className="p-4">Canal</th>
                  <th className="p-4">Portée</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c6c6cf]/20">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/40">
                    <td className="p-4 font-semibold text-[#00020e]">
                      <div className="flex items-center gap-2"><Megaphone className="w-3.5 h-3.5 text-[#006c49] shrink-0" /> {c.name}</div>
                    </td>
                    <td className="p-4 font-medium text-slate-600">{c.channel}</td>
                    <td className="p-4 text-slate-500">{c.reach.toLocaleString('fr-FR')}</td>
                    <td className="p-4">
                      <button onClick={() => toggleCampaignStatus(c.id)} title="Changer le statut"
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                          c.status === 'Active' ? 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20' : 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/20'
                        }`}>● {c.status}</button>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center items-center gap-1">
                        <button onClick={() => startEditCampaign(c)} title="Modifier"
                          className="text-slate-500 hover:text-[#006c49] p-1.5 hover:bg-slate-100 rounded transition-all">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteCampaign(c.id)} title="Supprimer"
                          className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {campaigns.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-400 italic">Aucune campagne. Créez-en une.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PARAMÈTRES MODULE */}
      {view === 'admin-settings' && (
        <div className="space-y-6 max-w-3xl">
          <h3 className="font-sans font-bold text-lg text-[#00020e]">Paramètres</h3>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="bg-white border border-[#c6c6cf] rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-[#00020e] uppercase tracking-wider">Profil administrateur</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nom complet</label>
                  <input type="text" value={settingsName} onChange={(e) => setSettingsName(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                  <input type="email" value={settingsEmail} onChange={(e) => setSettingsEmail(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-sm" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#c6c6cf] rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-[#00020e] uppercase tracking-wider">Préférences du CMS</h4>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Nom du site</label>
                <input type="text" value={settingsSiteName} onChange={(e) => setSettingsSiteName(e.target.value)}
                  className="w-full md:w-1/2 p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-sm" />
              </div>
              <label className="flex items-center justify-between py-2 border-t border-[#c6c6cf]/30 cursor-pointer">
                <span className="text-sm font-medium text-[#0b1c30]">Admissions ouvertes</span>
                <input type="checkbox" checked={settingsAdmissionsOpen} onChange={(e) => setSettingsAdmissionsOpen(e.target.checked)}
                  className="w-4 h-4 text-[#006c49] border-[#c6c6cf] rounded focus:ring-[#006c49]" />
              </label>
              <label className="flex items-center justify-between py-2 border-t border-[#c6c6cf]/30 cursor-pointer">
                <span className="text-sm font-medium text-[#0b1c30]">Notifications par email</span>
                <input type="checkbox" checked={settingsEmailNotif} onChange={(e) => setSettingsEmailNotif(e.target.checked)}
                  className="w-4 h-4 text-[#006c49] border-[#c6c6cf] rounded focus:ring-[#006c49]" />
              </label>
            </div>

            <div className="flex items-center justify-end gap-3">
              {settingsSaved && <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Enregistré</span>}
              <button type="submit" className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-6 py-2.5 rounded-lg transition-all flex items-center gap-1.5">
                <Save className="w-4 h-4" /> Enregistrer les paramètres
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODALE — Édition d'un témoignage publié */}
      {editingTestimonial && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={() => setEditingTestimonial(null)}>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#c6c6cf]/40 bg-slate-50">
              <h3 className="font-bold text-base text-[#00020e]">Modifier le témoignage</h3>
              <button onClick={() => setEditingTestimonial(null)} className="text-slate-400 hover:text-[#00020e]"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveEditedTestimonial} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nom</label>
                  <input type="text" value={editingTestimonial.name} onChange={(e) => setEditingTestimonial({ ...editingTestimonial, name: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Promotion</label>
                  <input type="text" value={editingTestimonial.promo} onChange={(e) => setEditingTestimonial({ ...editingTestimonial, promo: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Fonction</label>
                <input type="text" value={editingTestimonial.role} onChange={(e) => setEditingTestimonial({ ...editingTestimonial, role: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Témoignage</label>
                <textarea value={editingTestimonial.text} onChange={(e) => setEditingTestimonial({ ...editingTestimonial, text: e.target.value })} rows={4}
                  className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs" required />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingTestimonial(null)}
                  className="px-5 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 border border-[#c6c6cf]/40">Annuler</button>
                <button type="submit" className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-6 py-2.5 rounded-lg">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE — Édition d'un utilisateur */}
      {editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={() => setEditingUser(null)}>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#c6c6cf]/40 bg-slate-50">
              <h3 className="font-bold text-base text-[#00020e]">Modifier l'utilisateur</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-[#00020e]"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveEditedUser} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Nom complet</label>
                <input type="text" value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                <input type="email" value={editingUser.email} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Rôle</label>
                  <select value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as User['role'] })}
                    className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-bold text-[#00020e]">
                    <option value="Super Admin">Super Admin</option>
                    <option value="Admin">Admin</option>
                    <option value="Writer">Writer</option>
                    <option value="Marketer">Marketer</option>
                    <option value="OC">OC</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Statut</label>
                  <select value={editingUser.status} onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as User['status'] })}
                    className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-bold text-[#00020e]">
                    <option value="Actif">Actif</option>
                    <option value="Inactif">Inactif</option>
                    <option value="Bloqué">Bloqué</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingUser(null)}
                  className="px-5 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 border border-[#c6c6cf]/40">Annuler</button>
                <button type="submit" className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-6 py-2.5 rounded-lg">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
