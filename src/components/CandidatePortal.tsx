import React, { useState, useRef, useEffect } from 'react';
import {
  Lock,
  Mail,
  Send,
  User,
  GraduationCap,
  CheckCircle2,
  Clock,
  Upload,
  AlertCircle,
  FileText,
  ChevronRight,
  ArrowLeft,
  ChevronUp,
  MessageSquare,
  XCircle
} from 'lucide-react';
import { account, databases, storage, APPWRITE_CONFIG, isAppwriteDbConfigured, isAppwriteStorageConfigured, ID, Query } from '../lib/appwrite';

interface CandidatePortalProps {
  onBackToHome: () => void;
  onLoginSuccess: () => void;
  isLoggedIn: boolean;
  knownEmail?: string;
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

// Identifiants de démonstration (mode mock, sans Appwrite).
const DEMO_CANDIDATE = { email: 'jean.dupont@email.com', password: 'password123' };

export default function CandidatePortal({ onBackToHome, onLoginSuccess, isLoggedIn, knownEmail }: CandidatePortalProps) {
  // Login Form States
  const [email, setEmail] = useState(knownEmail || '');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Real application record (null tant que non trouvé / non chargé)
  const [application, setApplication] = useState<any>(null);
  const [isLoadingApplication, setIsLoadingApplication] = useState(false);

  // Dashboard / Interactive states
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([
    { sender: 'advisor', text: 'Bonjour, j\'ai bien reçu votre dossier. N\'hésitez pas à me contacter ici pour toute question sur votre candidature.', time: 'Aujourd\'hui' }
  ]);
  const [candidateDocs, setCandidateDocs] = useState<CandidateDoc[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Charge le dossier réel du candidat (candidature, documents, messages) depuis Appwrite
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
        if (appsRes.documents.length === 0) {
          setApplication(null);
          return;
        }
        const doc = appsRes.documents[0];
        setApplication(doc);

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
          }
        }
      } catch (err) {
        console.warn("Impossible de charger le dossier du candidat depuis Appwrite.", err);
      } finally {
        setIsLoadingApplication(false);
      }
    };

    loadDossier();
  }, [isLoggedIn, email]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const matchesLocalFallback = email === DEMO_CANDIDATE.email && password === DEMO_CANDIDATE.password;

    // Mode autonome (backend non configuré) : authentification locale.
    if (!isAppwriteDbConfigured()) {
      if (matchesLocalFallback) {
        onLoginSuccess();
      } else {
        setLoginError('Identifiants incorrects. Vérifiez votre email et votre mot de passe.');
      }
      return;
    }

    // Backend configuré : authentification réelle via Appwrite (session propre).
    setIsLoading(true);
    try {
      await account.deleteSession({ sessionId: 'current' }).catch(() => undefined);
      await account.createEmailPasswordSession({ email, password });
      onLoginSuccess();
    } catch (err: any) {
      // Seule une panne réseau (backend injoignable) autorise le repli local ;
      // un refus explicite d'Appwrite (401…) n'est jamais contourné.
      const isNetworkError = err?.name === 'TypeError' || err?.code === undefined || err?.code === 0;
      if (isNetworkError && matchesLocalFallback) {
        console.warn('Backend injoignable — repli sur la session locale.', err);
        onLoginSuccess();
      } else {
        console.warn('Connexion candidat Appwrite refusée.', err);
        setLoginError('Identifiants incorrects. Vérifiez votre email et votre mot de passe.');
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
          // Téléverser le fichier dans le bucket Appwrite
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
        setCandidateDocs((curr) => [
          ...curr,
          { name: file.name, size: formatSize(file.size), date: 'À l\'instant' }
        ]);
      } finally {
        setIsUploading(false);
      }
    }
  };

  // LOGIN PAGE VIEW
  if (!isLoggedIn) {
    return (
      <div className="bg-[#00020e] min-h-screen flex items-center justify-center py-12 px-6 relative overflow-hidden text-white">
        {/* Glow Background */}
        <div className="absolute inset-0 opacity-25 pointer-events-none z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#006c49] blur-[150px] rounded-full"></div>
        </div>

        <div className="max-w-md w-full bg-[#161922] rounded-2xl border border-white/10 p-8 shadow-2xl relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <button
              onClick={onBackToHome}
              className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors mb-4 border border-white/10 px-3 py-1 rounded"
            >
              <ArrowLeft className="w-3 h-3" />
              Retour au site public
            </button>
            <div className="w-12 h-12 bg-[#6ffbbe] text-[#00020e] rounded-xl flex items-center justify-center font-bold text-2xl mx-auto shadow-lg">
              🎓
            </div>
            <h1 className="font-sans font-bold text-2xl">Espace Candidat</h1>
            <p className="text-white/60 text-xs">Accédez au suivi d'étude de votre candidature IDLA</p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-200 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-white/60 tracking-wider">Adresse email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre adresse email"
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#6ffbbe] outline-none text-white font-medium placeholder:text-white/25"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase font-bold text-white/60 tracking-wider">Mot de passe</label>
                <a href="#" className="text-[10px] text-[#6ffbbe] hover:underline font-bold">Oublié ?</a>
              </div>
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
              className="w-full bg-[#006c49] hover:bg-[#6ffbbe] hover:text-[#00020e] text-white py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              {isLoading ? 'Identification en cours...' : 'Se connecter'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs text-white/40">
              Pas encore candidat ?{' '}
              <button onClick={onBackToHome} className="text-[#6ffbbe] hover:underline font-bold">
                Déposez un dossier
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Données dérivées du dossier réel (repli neutre si aucune candidature liée au compte)
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
    if (state === 'complete') return { border: 'border-[#006c49]', text: 'text-[#006c49]', opacity: '' };
    if (state === 'active') return { border: 'border-amber-500', text: 'text-amber-600', opacity: '' };
    return { border: 'border-[#c6c6cf]/60', text: 'text-slate-400', opacity: 'opacity-50' };
  };

  // LOGGED IN DASHBOARD VIEW
  return (
    <div className="bg-[#f8f9ff] min-h-screen text-[#0b1c30] py-8 px-6 md:px-12 ml-0 transition-all duration-200">
      <div className="max-w-[1440px] mx-auto space-y-8">

        {/* Welcome Top Banner */}
        <div className="bg-white border border-[#c6c6cf] rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#00020e] overflow-hidden border border-[#c6c6cf] shrink-0 flex items-center justify-center">
              <User className="w-8 h-8 text-white/60" />
            </div>
            <div>
              <h1 className="font-sans font-bold text-2xl text-[#00020e]">Bonjour, {displayName} !</h1>
              <p className="text-sm text-[#45464e] font-semibold mt-0.5">Dossier {dossierNumber} • {displayProgram}</p>
              {!application && !isLoadingApplication && (
                <p className="text-xs text-amber-600 font-semibold mt-1">Aucune candidature n'est encore associée à ce compte. Déposez votre dossier depuis la page d'accueil.</p>
              )}
            </div>
          </div>
          {isAccepted ? (
            <div className="flex items-center gap-2.5 bg-emerald-500/10 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Statut : Candidature acceptée — félicitations !</span>
            </div>
          ) : isRejected ? (
            <div className="flex items-center gap-2.5 bg-rose-500/10 text-rose-700 px-4 py-2 rounded-xl text-xs font-bold border border-rose-500/20">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>Statut : Candidature non retenue pour cette session</span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 bg-amber-500/10 text-amber-700 px-4 py-2 rounded-xl text-xs font-bold border border-amber-500/20">
              <Clock className="w-4 h-4 shrink-0" />
              <span>Statut : Dossier en cours d'évaluation par l'administration académique</span>
            </div>
          )}
        </div>

        {/* Stepper Progress tracking timeline */}
        <div className="bg-white border border-[#c6c6cf] rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          <h3 className="font-sans font-bold text-base text-[#00020e] uppercase tracking-wider">État d'évaluation du dossier</h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">

            {/* Step 1 : Soumis */}
            <div className={`space-y-2 border-l-4 md:border-l-0 md:border-t-4 ${stepClasses(stepState(1)).border} pl-4 md:pl-0 pt-0 md:pt-4 ${stepClasses(stepState(1)).opacity}`}>
              <div className={`flex items-center gap-1.5 ${stepClasses(stepState(1)).text} font-bold text-xs`}>
                <CheckCircle2 className="w-4 h-4" />
                <span>Étape 1 : Soumis</span>
              </div>
              <p className="font-bold text-sm text-[#00020e]">Candidature Enregistrée</p>
              <p className="text-xs text-slate-400">Le dossier a été déposé en ligne avec succès.</p>
            </div>

            {/* Step 2 : Analyse académique */}
            <div className={`space-y-2 border-l-4 md:border-l-0 md:border-t-4 ${stepClasses(stepState(2)).border} pl-4 md:pl-0 pt-0 md:pt-4 ${stepClasses(stepState(2)).opacity}`}>
              <div className={`flex items-center gap-1.5 ${stepClasses(stepState(2)).text} font-bold text-xs`}>
                {stepState(2) === 'active' ? <Clock className="w-4 h-4 animate-spin-slow" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Étape 2 : Analyse académique</span>
              </div>
              <p className="font-bold text-sm text-[#00020e]">Étude des pièces justificatives</p>
              <p className="text-xs text-slate-400">Notre équipe examine l'adéquation de vos relevés.</p>
            </div>

            {/* Step 3 : Évaluation orale */}
            <div className={`space-y-2 border-l-4 md:border-l-0 md:border-t-4 ${stepClasses(stepState(3)).border} pl-4 md:pl-0 pt-0 md:pt-4 ${stepClasses(stepState(3)).opacity}`}>
              <div className={`flex items-center gap-1.5 ${stepClasses(stepState(3)).text} font-semibold text-xs`}>
                {stepState(3) === 'complete' && <CheckCircle2 className="w-4 h-4" />}
                <span>Étape 3 : Évaluation orale</span>
              </div>
              <p className="font-bold text-sm text-[#00020e]">Entretien de motivation</p>
              <p className="text-xs text-slate-400">Présentation de votre projet devant le jury académique.</p>
            </div>

            {/* Step 4 : Délibération */}
            <div className={`space-y-2 border-l-4 md:border-l-0 md:border-t-4 ${stepClasses(stepState(4)).border} pl-4 md:pl-0 pt-0 md:pt-4 ${stepClasses(stepState(4)).opacity}`}>
              <div className={`flex items-center gap-1.5 ${stepClasses(stepState(4)).text} font-semibold text-xs`}>
                {stepState(4) === 'complete' && <CheckCircle2 className="w-4 h-4" />}
                <span>Étape 4 : Délibération</span>
              </div>
              <p className="font-bold text-sm text-[#00020e]">Décision d'Admission</p>
              <p className="text-xs text-slate-400">
                {isRejected ? 'Décision : candidature non retenue pour cette session.' : 'Notification finale d\'acceptation par courrier officiel.'}
              </p>
            </div>

          </div>
        </div>

        {/* Dynamic Split Screen : Advisor chat + Documents panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Documents Panel */}
          <div className="lg:col-span-6 bg-white border border-[#c6c6cf] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#c6c6cf]/30">
              <h3 className="font-sans font-bold text-base text-[#00020e] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#006c49]" />
                Mon Dossier de Pièces
              </h3>
              <button
                onClick={() => docInputRef.current?.click()}
                disabled={isUploading}
                className="bg-[#006c49]/10 hover:bg-[#006c49]/20 text-[#006c49] text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
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
                <p className="text-xs text-slate-400 italic">Aucun document téléversé pour l'instant.</p>
              )}
              {candidateDocs.map((doc, idx) => (
                <div key={doc.id ?? idx} className="flex items-center justify-between p-3.5 bg-slate-50 border border-[#c6c6cf]/30 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#006c49]/10 text-[#006c49] flex items-center justify-center font-bold">
                      PDF
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#00020e] line-clamp-1">{doc.name}</p>
                      <p className="text-[10px] text-slate-400">{doc.size} • Chargé {doc.date}</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-[#006c49]" />
                </div>
              ))}
            </div>
          </div>

          {/* Advisor Chat Panel */}
          <div className="lg:col-span-6 bg-white border border-[#c6c6cf] rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[400px]">
            {/* Advisor profile header */}
            <div className="bg-[#00020e] text-white p-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-[#6ffbbe]">
                  <GraduationCap className="w-5 h-5 text-[#6ffbbe]" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">Sophie Vallet</h4>
                  <p className="text-[10px] text-[#6ffbbe] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6ffbbe]"></span>
                    Conseillère des Admissions
                  </p>
                </div>
              </div>
              <MessageSquare className="w-4 h-4 text-white/50" />
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
                        ? 'bg-[#006c49] text-white rounded-tr-none'
                        : 'bg-slate-100 text-[#0b1c30] rounded-tl-none border border-[#c6c6cf]/40'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 px-1">{m.time}</span>
                </div>
              ))}
            </div>

            {/* Chat entry form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-[#c6c6cf]/30 bg-slate-50 flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Rédiger votre réponse..."
                className="flex-grow bg-white border border-[#c6c6cf] rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#006c49]"
              />
              <button
                type="submit"
                className="bg-[#006c49] text-white p-2 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

          </div>

        </div>

      </div>
    </div>
  );
}
