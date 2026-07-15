import React, { useState, useRef, useEffect } from 'react';
import {
  LockIcon,
  MailIcon,
  SendIcon,
  UserIcon,
  GraduationCapIcon,
  CheckCircle2Icon,
  ClockIcon,
  UploadIcon,
  AlertCircleIcon,
  FileTextIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  MessageSquareIcon,
  XCircleIcon
} from './Icons';
import { account, databases, storage, APPWRITE_CONFIG, isAppwriteDbConfigured, isAppwriteStorageConfigured, ID, Query } from '../lib/appwrite';

interface CandidatePortalProps {
  onBackToHome: () => void;
  onLoginSuccess: () => void;
  isLoggedIn: boolean;
  knownEmail?: string;
  activeTab?: string;
  setActiveTab?: (tab: any) => void;
}

interface CandidateDoc {
  id?: string;
  name: string;
  size: string;
  date: string;
}

interface ChatMsg {
  sender: 'candidate' | 'advisor';
  text: string;
  time: string;
}

const formatSize = (bytes?: number) => {
  if (!bytes) return '—';
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDateTime = (iso?: string) => {
  if (!iso) return 'À l\'instant';
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const STATUS_STEP: Record<string, number> = { New: 2, 'In Review': 2, Accepted: 4, Rejected: 2 };

export default function CandidatePortal({ onBackToHome, onLoginSuccess, isLoggedIn, knownEmail, activeTab, setActiveTab }: CandidatePortalProps) {
  // Login Form States
  const [email, setEmail] = useState(knownEmail || '');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState(knownEmail || '');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Real application record
  const [application, setApplication] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoadingApplication, setIsLoadingApplication] = useState(false);

  // Password / Settings states
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Dashboard / Interactive states
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([
    { sender: 'advisor', text: 'Bonjour, j\'ai bien reçu votre dossier. N\'hésitez pas à me contacter ici pour toute question sur votre candidature.', time: 'Aujourd\'hui' }
  ]);
  const [candidateDocs, setCandidateDocs] = useState<CandidateDoc[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Charge le dossier réel du candidat depuis Appwrite
  useEffect(() => {
    if (!isLoggedIn) return;
    if (!isAppwriteDbConfigured() || !APPWRITE_CONFIG.collections.applications) return;

    const loadDossier = async () => {
      setIsLoadingApplication(true);
      try {
        const appsRes = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.applications,
          [Query.equal('email', email)]
        );
        setApplications(appsRes.documents);

        if (appsRes.documents.length === 0) {
          setApplication(null);
          return;
        }

        // Determine current application to focus on
        let doc = application;
        if (!doc || !appsRes.documents.some((d: any) => d.$id === doc.$id)) {
          doc = appsRes.documents[0];
          setApplication(doc);
        }

        if (APPWRITE_CONFIG.collections.candidateDocuments) {
          const docsRes = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.candidateDocuments,
            [Query.equal('applicationId', doc.$id)]
          );
          if (docsRes.documents.length > 0) {
            setCandidateDocs(docsRes.documents.map((d: any) => ({
              id: d.$id,
              name: d.name,
              size: formatSize(d.sizeBytes),
              date: formatDateTime(d.uploadedAt),
            })));
          } else {
            setCandidateDocs([]);
          }
        }

        if (APPWRITE_CONFIG.collections.messages) {
          const msgRes = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.messages,
            [Query.equal('applicationId', doc.$id), Query.orderAsc('createdAt')]
          );
          if (msgRes.documents.length > 0) {
            setChatHistory(msgRes.documents.map((m: any) => ({
              sender: m.sender,
              text: m.text,
              time: formatDateTime(m.createdAt),
            })));
          } else {
            setChatHistory([
              { sender: 'advisor', text: 'Bonjour, j\'ai bien reçu votre dossier. N\'hésitez pas à me contacter ici pour toute question sur votre candidature.', time: 'Aujourd\'hui' }
            ]);
          }
        }
      } catch (err) {
        console.warn("Impossible de charger le dossier du candidat depuis Appwrite.", err);
      } finally {
        setIsLoadingApplication(false);
      }
    };

    loadDossier();
  }, [isLoggedIn, email, application?.$id]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const checkPrefs = async () => {
      try {
        const prefs = await account.getPrefs();
        if (prefs && prefs.mustChangePassword) {
          setMustChangePassword(true);
        } else {
          setMustChangePassword(false);
        }
      } catch (err) {
        console.warn("Impossible de récupérer les préférences de l'utilisateur", err);
      }
    };
    checkPrefs();
  }, [isLoggedIn]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setResetLoading(true);
    try {
      await account.createRecovery({
        email: resetEmail,
        url: `${window.location.origin}/candidat/reinitialisation`,
      });
      setResetSent(true);
    } catch (err: any) {
      setLoginError("Impossible d'envoyer le lien. Vérifiez l'adresse e-mail saisie.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!isAppwriteDbConfigured()) {
      setLoginError("La base de données Appwrite n'est pas configurée dans le fichier .env.");
      return;
    }

    setIsLoading(true);
    try {
      await account.deleteSession({ sessionId: 'current' }).catch(() => undefined);
      await account.createEmailPasswordSession({ email, password });
      onLoginSuccess();
    } catch (err: any) {
      console.warn('Connexion candidat Appwrite refusée.', err);
      if (err.type === 'project_paused' || err.code === 403) {
        setLoginError('Le serveur de base de données est actuellement suspendu pour inactivité. Veuillez le restaurer depuis la console Appwrite.');
      } else {
        setLoginError('Identifiants incorrects ou serveur de base de données inaccessible.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const text = chatMessage;
    setChatMessage('');
    const userMsg: ChatMsg = { sender: 'candidate', text, time: 'À l\'instant' };
    setChatHistory((curr) => [...curr, userMsg]);

    const canPersist = isAppwriteDbConfigured() && application && APPWRITE_CONFIG.collections.messages;
    if (canPersist) {
      try {
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.messages,
          ID.unique(),
          { applicationId: application.$id, sender: 'candidate', text, createdAt: new Date().toISOString() }
        );
      } catch (err) {
        console.error("Échec de l'enregistrement du message sur Appwrite:", err);
      }
    }

    // Réponse automatique simulée de la conseillère
    setTimeout(async () => {
      const replyText = 'Merci beaucoup pour votre message ! Je transmets immédiatement votre dossier au jury d\'admission pour étude approfondie. Je vous recontacte dès que possible.';
      setChatHistory((curr) => [...curr, { sender: 'advisor', text: replyText, time: 'À l\'instant' }]);
      if (canPersist) {
        try {
          await databases.createDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.messages,
            ID.unique(),
            { applicationId: application.$id, sender: 'advisor', text: replyText, createdAt: new Date().toISOString() }
          );
        } catch (err) {
          console.error("Échec de l'enregistrement de la réponse sur Appwrite:", err);
        }
      }
    }, 1500);
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const file = selectedFiles[0];
      setIsUploading(true);

      try {
        let fileId = '';
        if (isAppwriteStorageConfigured()) {
          const response = await storage.createFile(
            APPWRITE_CONFIG.buckets.documents,
            ID.unique(),
            file
          );
          fileId = response.$id;
          console.log("Fichier téléversé avec succès sur Appwrite:", response);
        }

        if (isAppwriteDbConfigured() && application && APPWRITE_CONFIG.collections.candidateDocuments) {
          await databases.createDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.candidateDocuments,
            ID.unique(),
            {
              applicationId: application.$id,
              fileId,
              name: file.name,
              sizeBytes: file.size,
              mimeType: file.type,
              uploadedBy: 'candidate',
              uploadedAt: new Date().toISOString(),
            }
          );
        }

        setCandidateDocs((curr) => [
          ...curr,
          { name: file.name, size: formatSize(file.size), date: 'À l\'instant' }
        ]);
      } catch (err: any) {
        console.error("Échec du téléversement sur Appwrite:", err);
      } finally {
        setIsUploading(false);
      }
    }
  };
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsSuccess('');

    if (newPassword.length < 8) {
      setSettingsError('Le nouveau mot de passe doit comporter au moins 8 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setSettingsError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await account.updatePassword({ password: newPassword, oldPassword: currentPassword });
      // Remove mustChangePassword flag
      await account.updatePrefs({ mustChangePassword: false });
      setMustChangePassword(false);
      setSettingsSuccess('Mot de passe modifié avec succès ! Votre compte est maintenant pleinement actif.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error("Échec du changement de mot de passe:", err);
      if (err?.code === 401) {
        setSettingsError('Le mot de passe actuel est incorrect. Veuillez réessayer.');
      } else {
        setSettingsError(err?.message || "Erreur lors de la mise à jour du mot de passe.");
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // LOGIN PAGE VIEW
  if (!isLoggedIn) {
    // ── Vue réinitialisation mot de passe ──
    if (showReset) {
      return (
        <div className="bg-bg-primary min-h-screen flex items-center justify-center py-12 px-6 relative overflow-hidden text-text-primary">
          <div className="absolute inset-0 opacity-10 pointer-events-none z-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-primary blur-[150px] rounded-full" />
          </div>
          <div className="max-w-md w-full bg-bg-secondary rounded-2xl border border-border-primary p-8 shadow-2xl relative z-10 space-y-6">
            <div className="text-center space-y-2">
              <button onClick={() => { setShowReset(false); setResetSent(false); setLoginError(''); }}
                className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-brand-primary transition-colors mb-4 border border-border-primary px-3 py-1 rounded cursor-pointer">
                <ArrowLeftIcon className="w-3 h-3" /> Retour à la connexion
              </button>
              <div className="w-12 h-12 bg-brand-light rounded-xl flex items-center justify-center text-2xl mx-auto">🔑</div>
              <h1 className="font-sans font-bold text-2xl text-text-primary">Mot de passe oublié</h1>
              <p className="text-text-secondary text-xs">Saisissez votre adresse e-mail pour recevoir un lien de réinitialisation.</p>
            </div>
            {resetSent ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm font-semibold text-center space-y-3">
                <CheckCircle2Icon className="w-10 h-10 mx-auto" />
                <p>E-mail envoyé ! Vérifiez votre boîte mail et cliquez sur le lien reçu pour réinitialiser votre mot de passe.</p>
                <button onClick={() => { setShowReset(false); setResetSent(false); }}
                  className="text-xs text-brand-primary hover:underline cursor-pointer">
                  Retour à la connexion
                </button>
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
        {/* Glow Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-primary blur-[150px] rounded-full"></div>
        </div>

        <div className="max-w-md w-full bg-bg-secondary rounded-2xl border border-border-primary p-8 shadow-2xl relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <button
              onClick={onBackToHome}
              className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-brand-primary transition-colors mb-4 border border-border-primary px-3 py-1 rounded cursor-pointer"
            >
              <ArrowLeftIcon className="w-3 h-3" />
              Retour au site public
            </button>
            <div className="w-12 h-12 bg-brand-light text-brand-primary rounded-xl flex items-center justify-center font-bold text-2xl mx-auto shadow-sm">
              🎓
            </div>
            <h1 className="font-sans font-bold text-2xl text-text-primary">Espace Candidat</h1>
            <p className="text-text-secondary text-xs">Accédez au suivi d'étude de votre candidature IDLA</p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-700 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircleIcon className="w-4 h-4 text-red-500 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Adresse email</label>
              <div className="relative">
                <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/60 w-4 h-4" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre adresse email"
                  className="w-full bg-bg-primary border border-border-primary rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-primary outline-none text-text-primary font-medium"
                  required
                />
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
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-bg-primary border border-border-primary rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-primary outline-none text-text-primary"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-primary hover:bg-brand-hover text-white py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              {isLoading ? 'Identification en cours...' : 'Se connecter'}
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs text-text-secondary">
              Pas encore candidat ?{' '}
              <button onClick={onBackToHome} className="text-brand-primary hover:underline font-bold cursor-pointer">
                Déposez un dossier
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard calculations
  const fallbackName = email
    ? email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Candidat';
  const displayName = application?.name || fallbackName;
  const displayProgram = application?.program || 'Programme non renseigné';
  const status: string = application?.status || 'New';
  const isAccepted = status === 'Accepted';
  const isRejected = status === 'Rejected';
  const currentStep = STATUS_STEP[status] ?? 2;
  const dossierNumber = application
    ? `#IDLA-${new Date(application.dateApplied ?? application.$createdAt).getFullYear()}-${application.$id.slice(-4).toUpperCase()}`
    : 'en cours d\'attribution';

  const stepState = (stepNum: number): 'complete' | 'active' | 'pending' => {
    if (isAccepted) return 'complete';
    if (isRejected) return stepNum <= currentStep ? 'complete' : 'pending';
    if (stepNum < currentStep) return 'complete';
    if (stepNum === currentStep) return 'active';
    return 'pending';
  };

  const stepClasses = (state: 'complete' | 'active' | 'pending') => {
    if (state === 'complete') return { border: 'border-brand-primary', text: 'text-brand-primary', opacity: '' };
    if (state === 'active') return { border: 'border-amber-500', text: 'text-amber-600', opacity: '' };
    return { border: 'border-border-primary/60', text: 'text-text-secondary/60', opacity: 'opacity-50' };
  };

  if (activeTab === 'candidate-programmes') {
    return (
      <div className="bg-bg-primary min-h-screen text-text-primary py-8 px-6 md:px-12 ml-0 transition-all duration-200">
        <div className="max-w-[1440px] mx-auto space-y-8">
          {/* Top Header */}
          <div>
            <h1 className="font-sans font-bold text-2xl text-text-primary">Mes Programmes Inscrits</h1>
            <p className="text-sm text-text-secondary mt-1">Retrouvez les programmes d'études auxquels vous avez postulé.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {applications.map((app) => {
              const status = app.status || 'New';
              const statusBadge =
                status === 'Accepted'
                  ? { cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20', label: 'Admis' }
                  : status === 'Rejected'
                  ? { cls: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20', label: 'Non retenu' }
                  : { cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20', label: 'En cours d\'examen' };

              return (
                <div key={app.$id} className="bg-bg-secondary border border-border-primary rounded-2xl p-6 shadow-sm flex flex-col justify-between h-48 hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-sans font-bold text-sm text-text-primary line-clamp-2">{app.program}</h3>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${statusBadge.cls}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mt-2">
                      Déposé le : {new Date(app.dateApplied || app.$createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setApplication(app);
                      if (setActiveTab) setActiveTab('candidate-dashboard');
                    }}
                    className="w-full bg-brand-primary hover:bg-brand-hover text-white py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                  >
                    <span>Suivre mon dossier</span>
                    <ChevronRightIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
            {applications.length === 0 && (
              <div className="col-span-full bg-bg-secondary border border-border-primary rounded-2xl p-8 text-center">
                <p className="text-sm text-text-secondary italic">Vous n'êtes inscrit à aucun programme pour le moment.</p>
                <button
                  onClick={onBackToHome}
                  className="mt-4 inline-flex items-center gap-1.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Découvrir nos programmes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-primary min-h-screen text-text-primary py-8 px-6 md:px-12 ml-0 transition-all duration-200">
      <div className="max-w-[1440px] mx-auto space-y-8">

        {/* Welcome Top Banner */}
        <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-bg-primary overflow-hidden border border-border-primary shrink-0 flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-text-secondary" />
            </div>
            <div>
              <h1 className="font-sans font-bold text-2xl text-text-primary">Bonjour, {displayName} !</h1>
              <p className="text-sm text-text-secondary font-semibold mt-0.5">Dossier {dossierNumber} • {displayProgram}</p>
              {!application && !isLoadingApplication && (
                <p className="text-xs text-amber-600 font-semibold mt-1">Aucune candidature n'est encore associée à ce compte. Déposez votre dossier depuis la page d'accueil.</p>
              )}
            </div>
          </div>
          {isAccepted ? (
            <div className="flex items-center gap-2.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-500/20">
              <CheckCircle2Icon className="w-4 h-4 shrink-0" />
              <span>Statut : Candidature acceptée — félicitations !</span>
            </div>
          ) : isRejected ? (
            <div className="flex items-center gap-2.5 bg-rose-500/10 text-rose-700 dark:text-rose-400 px-4 py-2 rounded-xl text-xs font-bold border border-rose-500/20">
              <XCircleIcon className="w-4 h-4 shrink-0" />
              <span>Statut : Candidature non retenue pour cette session</span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-xl text-xs font-bold border border-amber-500/20">
              <ClockIcon className="w-4 h-4 shrink-0" />
              <span>Statut : Évaluation académique en cours</span>
            </div>
          )}
        </div>

        {/* MUST CHANGE PASSWORD — Priority Banner */}
        {mustChangePassword && (
          <div className="bg-bg-secondary border-2 border-amber-500 rounded-2xl p-6 md:p-8 shadow-lg space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <LockIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-base text-amber-700 dark:text-amber-400">
                  ⚠️ Modification du mot de passe obligatoire
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  Votre compte utilise encore un mot de passe temporaire. Vous devez le modifier immédiatement pour sécuriser votre espace candidat.
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-secondary uppercase">Mot de passe actuel</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Mot de passe temporaire"
                  className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500 text-text-primary"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-secondary uppercase">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 caractères"
                  className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500 text-text-primary"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-secondary uppercase">Confirmer le nouveau</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Même mot de passe"
                  className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500 text-text-primary"
                  required
                />
              </div>
              <div className="sm:col-span-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                >
                  <LockIcon className="w-3.5 h-3.5" />
                  {isUpdatingPassword ? 'Modification en cours...' : 'Modifier mon mot de passe'}
                </button>
                {settingsError && (
                  <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                    <AlertCircleIcon className="w-3.5 h-3.5" /> {settingsError}
                  </p>
                )}
                {settingsSuccess && (
                  <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2Icon className="w-3.5 h-3.5" /> {settingsSuccess}
                  </p>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Stepper Progress Timeline */}
        <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          <h3 className="font-sans font-bold text-base text-text-primary uppercase tracking-wider">État d'évaluation du dossier</h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 : Soumis */}
            <div className={`space-y-2 border-l-4 md:border-l-0 md:border-t-4 ${stepClasses(stepState(1)).border} pl-4 md:pl-0 pt-0 md:pt-4 ${stepClasses(stepState(1)).opacity}`}>
              <div className={`flex items-center gap-1.5 ${stepClasses(stepState(1)).text} font-bold text-xs`}>
                <CheckCircle2Icon className="w-4 h-4" />
                <span>Étape 1 : Soumis</span>
              </div>
              <p className="font-bold text-sm text-text-primary">Candidature Enregistrée</p>
              <p className="text-xs text-text-secondary">Le dossier a été déposé en ligne avec succès.</p>
            </div>

            {/* Step 2 : Analyse académique */}
            <div className={`space-y-2 border-l-4 md:border-l-0 md:border-t-4 ${stepClasses(stepState(2)).border} pl-4 md:pl-0 pt-0 md:pt-4 ${stepClasses(stepState(2)).opacity}`}>
              <div className={`flex items-center gap-1.5 ${stepClasses(stepState(2)).text} font-bold text-xs`}>
                {stepState(2) === 'active' ? <ClockIcon className="w-4 h-4 animate-spin-slow" /> : <CheckCircle2Icon className="w-4 h-4" />}
                <span>Étape 2 : Analyse académique</span>
              </div>
              <p className="font-bold text-sm text-text-primary">Étude des pièces justificatives</p>
              <p className="text-xs text-text-secondary">Notre équipe examine l'adéquation de vos relevés.</p>
            </div>

            {/* Step 3 : Évaluation orale */}
            <div className={`space-y-2 border-l-4 md:border-l-0 md:border-t-4 ${stepClasses(stepState(3)).border} pl-4 md:pl-0 pt-0 md:pt-4 ${stepClasses(stepState(3)).opacity}`}>
              <div className={`flex items-center gap-1.5 ${stepClasses(stepState(3)).text} font-semibold text-xs`}>
                {stepState(3) === 'complete' && <CheckCircle2Icon className="w-4 h-4" />}
                <span>Étape 3 : Évaluation orale</span>
              </div>
              <p className="font-bold text-sm text-text-primary">Entretien de motivation</p>
              <p className="text-xs text-text-secondary">Présentation de votre projet devant le jury académique.</p>
            </div>

            {/* Step 4 : Délibération */}
            <div className={`space-y-2 border-l-4 md:border-l-0 md:border-t-4 ${stepClasses(stepState(4)).border} pl-4 md:pl-0 pt-0 md:pt-4 ${stepClasses(stepState(4)).opacity}`}>
              <div className={`flex items-center gap-1.5 ${stepClasses(stepState(4)).text} font-semibold text-xs`}>
                {stepState(4) === 'complete' && <CheckCircle2Icon className="w-4 h-4" />}
                <span>Étape 4 : Délibération</span>
              </div>
              <p className="font-bold text-sm text-text-primary">Décision d'Admission</p>
              <p className="text-xs text-text-secondary">
                {isRejected ? 'Décision : candidature non retenue pour cette session.' : 'Notification finale d\'acceptation par courrier officiel.'}
              </p>
            </div>
          </div>
        </div>

        {/* Split Screen : Advisor chat + Documents panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Documents Panel */}
          <div className="lg:col-span-6 bg-bg-secondary border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-border-primary/30">
              <h3 className="font-sans font-bold text-base text-text-primary flex items-center gap-2">
                <FileTextIcon className="w-5 h-5 text-brand-primary" />
                Mon Dossier de Pièces
              </h3>
              <button
                onClick={() => docInputRef.current?.click()}
                disabled={isUploading}
                className="bg-brand-light text-brand-primary text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <UploadIcon className="w-3.5 h-3.5" />
                {isUploading ? 'Chargement...' : 'Ajouter'}
              </button>
              <input
                type="file"
                ref={docInputRef}
                onChange={handleDocUpload}
                className="hidden"
                accept=".pdf,.doc,.docx"
              />
            </div>

            <div className="space-y-3">
              {candidateDocs.length === 0 && (
                <p className="text-xs text-text-secondary italic">Aucun document téléversé pour l'instant.</p>
              )}
              {candidateDocs.map((doc, idx) => (
                <div key={doc.id ?? idx} className="flex items-center justify-between p-3.5 bg-bg-primary border border-border-primary/30 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-brand-light text-brand-primary flex items-center justify-center font-bold text-[10px]">
                      PDF
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text-primary line-clamp-1">{doc.name}</p>
                      <p className="text-[10px] text-text-secondary">{doc.size} • Chargé {doc.date}</p>
                    </div>
                  </div>
                  <CheckCircle2Icon className="w-4 h-4 text-brand-primary" />
                </div>
              ))}
            </div>
          </div>

          {/* Advisor Chat Panel */}
          <div className="lg:col-span-6 bg-bg-secondary border border-border-primary rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[400px]">
            {/* Advisor profile header */}
            <div className="bg-bg-primary text-text-primary p-4 flex items-center justify-between border-b border-border-primary">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center border border-brand-primary">
                  <GraduationCapIcon className="w-5 h-5 text-brand-primary" size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-text-primary">Sophie Vallet</h4>
                  <p className="text-[10px] text-brand-primary font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
                    Conseillère des Admissions
                  </p>
                </div>
              </div>
              <MessageSquareIcon className="w-4 h-4 text-text-secondary" />
            </div>

            {/* Chat conversation area */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4 max-h-[250px]">
              {chatHistory.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col max-w-[80%] ${
                    m.sender === 'candidate' ? 'ml-auto items-end' : 'mr-auto items-start'
                  }`}
                >
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      m.sender === 'candidate'
                        ? 'bg-brand-primary text-white rounded-tr-none'
                        : 'bg-bg-primary text-text-primary rounded-tl-none border border-border-primary/40'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[9px] text-text-secondary mt-1 px-1">{m.time}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat entry form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-border-primary/30 bg-bg-primary flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Rédiger votre réponse..."
                className="flex-grow bg-bg-secondary border border-border-primary rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-primary text-text-primary"
              />
              <button
                type="submit"
                className="bg-brand-primary text-white p-2 rounded-lg hover:bg-brand-hover transition-colors shrink-0 cursor-pointer"
              >
                <SendIcon className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
