import React, { useState, useEffect, useRef } from 'react';
import { 
  CalendarIcon, 
  UsersIcon, 
  BookOpenIcon, 
  ClockIcon,
  CheckCircle2Icon,
  ArrowLeftIcon,
  GraduationCapIcon,
  SendIcon,
  MessageSquareIcon
} from './Icons';
import { 
  Paperclip, Video, FileText, Download, ExternalLink, X, Sparkles, Plus, 
  Link as LinkIcon, FileCheck
} from 'lucide-react';
import { account, databases, storage, APPWRITE_CONFIG, isAppwriteDbConfigured, isAppwriteStorageConfigured, Query, ID } from '../lib/appwrite';

interface TeacherPortalProps {
  activeTab: 'teacher-dashboard' | 'teacher-schedule' | 'teacher-students';
  setActiveTab: (tab: any) => void;
  isLoggedIn: boolean;
  programs: any[];
}

export default function TeacherPortal({ activeTab, setActiveTab, isLoggedIn, programs }: TeacherPortalProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);

  // Chat states
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Attachment & Meeting States
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingPlatform, setMeetingPlatform] = useState<'Google Meet' | 'Zoom' | 'Microsoft Teams' | 'Webex' | 'Autre'>('Google Meet');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [isUploadingChatFile, setIsUploadingChatFile] = useState(false);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  const getClassChatId = (programName: string) => {
    let hash = 0;
    for (let i = 0; i < programName.length; i++) {
      hash = ((hash << 5) - hash) + programName.charCodeAt(i);
      hash |= 0;
    }
    return `cls_${Math.abs(hash)}`;
  };

  useEffect(() => {
    if (activeTab !== 'teacher-students') {
      setSelectedProgram(null);
    }
  }, [activeTab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    if (!selectedProgram || !isLoggedIn) return;
    const loadClassMessages = async () => {
      try {
        if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.messages) {
          const classId = getClassChatId(selectedProgram);
          const msgRes = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.messages,
            [Query.equal('applicationId', classId), Query.orderAsc('createdAt')]
          );
          setChatHistory(msgRes.documents.map((m: any) => {
            let parsedText = m.text;
            let sName = m.sender === 'advisor' ? 'Enseignant' : 'Étudiant';
            let msgType = 'text';
            let extraData: any = {};

            try {
              const data = JSON.parse(m.text);
              if (data.t || data.type) {
                parsedText = data.t || '';
                sName = data.n || sName;
                msgType = data.type || 'text';
                extraData = {
                  fileName: data.fileName,
                  fileUrl: data.fileUrl,
                  fileSize: data.fileSize,
                  fileType: data.fileType,
                  meetingUrl: data.meetingUrl,
                  meetingTitle: data.meetingTitle,
                  meetingPlatform: data.meetingPlatform,
                  meetingTime: data.meetingTime,
                };
              }
            } catch (e) {}

            return {
              sender: m.sender,
              text: parsedText,
              type: msgType,
              ...extraData,
              time: new Date(m.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
              senderName: sName
            };
          }));
        }
      } catch (err) {
        console.warn("Erreur chargement messages de classe:", err);
      }
    };
    loadClassMessages();
  }, [selectedProgram, isLoggedIn]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedProgram) return;

    const text = chatMessage;
    setChatMessage('');
    const userMsg = { sender: 'advisor', text, type: 'text', time: 'À l\'instant', senderName: profile?.name || 'Enseignant' };
    setChatHistory((curr) => [...curr, userMsg]);

    const canPersist = isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.messages;
    if (canPersist) {
      try {
        const payloadStr = JSON.stringify({ n: profile?.name || 'Enseignant', t: text, type: 'text' });
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.messages,
          ID.unique(),
          { 
            applicationId: getClassChatId(selectedProgram), 
            sender: 'advisor', 
            text: payloadStr, 
            createdAt: new Date().toISOString()
          }
        );
      } catch (err) {
        console.error("Erreur envoi message Appwrite:", err);
      }
    }
  };

  const handleSendFileMessage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProgram) return;

    setIsUploadingChatFile(true);
    let finalUrl = '';
    const formattedSize = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} Mo`
      : `${Math.round(file.size / 1024)} Ko`;

    try {
      if (isAppwriteStorageConfigured()) {
        const res = await storage.createFile(APPWRITE_CONFIG.buckets.documents, ID.unique(), file);
        finalUrl = storage.getFileView(APPWRITE_CONFIG.buckets.documents, res.$id).toString();
      } else {
        finalUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }
    } catch (err) {
      console.error("Erreur téléversement fichier chat:", err);
      setIsUploadingChatFile(false);
      return;
    }

    const fileMsg = {
      sender: 'advisor',
      senderName: profile?.name || 'Enseignant',
      text: `Document joint : ${file.name}`,
      type: 'file',
      fileName: file.name,
      fileUrl: finalUrl,
      fileSize: formattedSize,
      fileType: file.type,
      time: 'À l\'instant'
    };

    setChatHistory((curr) => [...curr, fileMsg]);
    setIsUploadingChatFile(false);

    if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.messages) {
      try {
        const payloadStr = JSON.stringify({
          n: profile?.name || 'Enseignant',
          t: `Document joint : ${file.name}`,
          type: 'file',
          fileName: file.name,
          fileUrl: finalUrl,
          fileSize: formattedSize,
          fileType: file.type
        });

        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.messages,
          ID.unique(),
          {
            applicationId: getClassChatId(selectedProgram),
            sender: 'advisor',
            text: payloadStr,
            createdAt: new Date().toISOString()
          }
        );
      } catch (err) {
        console.error("Erreur enregistrement message fichier Appwrite:", err);
      }
    }
  };

  const handleSendMeetingMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim() || !meetingUrl.trim() || !selectedProgram) return;

    const meetingMsg = {
      sender: 'advisor',
      senderName: profile?.name || 'Enseignant',
      text: `Réunion en direct : ${meetingTitle}`,
      type: 'meeting',
      meetingTitle,
      meetingPlatform,
      meetingUrl,
      meetingTime: meetingTime || "Aujourd'hui",
      time: 'À l\'instant'
    };

    setChatHistory((curr) => [...curr, meetingMsg]);
    setShowMeetingModal(false);
    setMeetingTitle('');
    setMeetingUrl('');
    setMeetingTime('');

    if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.messages) {
      try {
        const payloadStr = JSON.stringify({
          n: profile?.name || 'Enseignant',
          t: `Réunion en direct : ${meetingTitle}`,
          type: 'meeting',
          meetingTitle,
          meetingPlatform,
          meetingUrl,
          meetingTime: meetingTime || "Aujourd'hui"
        });

        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.messages,
          ID.unique(),
          {
            applicationId: getClassChatId(selectedProgram),
            sender: 'advisor',
            text: payloadStr,
            createdAt: new Date().toISOString()
          }
        );
      } catch (err) {
        console.error("Erreur enregistrement réunion Appwrite:", err);
      }
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;

    const loadTeacherData = async () => {
      try {
        const currentAccount = await account.get();
        const userEmail = currentAccount.email;

        if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.cmsUsers) {
          const userRes = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.cmsUsers,
            [Query.equal('email', userEmail)]
          );
          if (userRes.documents.length > 0) {
            const userDoc = userRes.documents[0];
            let assigned = userDoc.assignedPrograms || [];
            if (typeof assigned === 'string') {
              try { assigned = JSON.parse(assigned); } catch (e) { assigned = []; }
            }
            setProfile({
              name: userDoc.name,
              email: userDoc.email,
              assignedPrograms: assigned
            });
          } else {
            setProfile({
              name: currentAccount.name || 'Enseignant IDLA',
              email: userEmail,
              assignedPrograms: ['Master Ingénierie Logicielle']
            });
          }
        } else {
          setProfile({
            name: currentAccount.name || 'Enseignant IDLA',
            email: userEmail,
            assignedPrograms: ['Master Ingénierie Logicielle', 'Certification Cybersecurity']
          });
        }

        if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.applications) {
          const appsRes = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.applications,
            [Query.equal('status', 'Accepted')]
          );
          setStudents(appsRes.documents);
        } else {
          setStudents([
            { id: '1', name: 'Paul Kengne', email: 'paul.kengne@exemple.com', program: 'Master Ingénierie Logicielle' },
            { id: '2', name: 'Marie Ngo', email: 'marie.ngo@exemple.com', program: 'Master Ingénierie Logicielle' },
            { id: '3', name: 'Samuel Mbida', email: 'samuel.mbida@exemple.com', program: 'Certification Cybersecurity' }
          ]);
        }
      } catch (err) {
        console.error("Erreur chargement profil enseignant:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTeacherData();
  }, [isLoggedIn]);

  if (loading) {
    return (
      <div className="flex-1 p-8 pt-24 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-text-secondary">Chargement de votre espace enseignant...</p>
        </div>
      </div>
    );
  }

  const myPrograms = profile?.assignedPrograms || [];

  const renderDashboard = () => (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-light border border-brand-primary/30 flex items-center justify-center shrink-0 text-brand-primary font-bold text-2xl">
            {profile?.name?.charAt(0) || 'E'}
          </div>
          <div>
            <h1 className="font-sans font-bold text-2xl text-text-primary">Espace Enseignant — {profile?.name}</h1>
            <p className="text-sm text-text-secondary mt-0.5">
              Bienvenue sur votre portail académique. Gérez vos cours, vos classes et votre emploi du temps.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab('teacher-students')} 
            className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow flex items-center gap-2 cursor-pointer"
          >
            <MessageSquareIcon className="w-4 h-4" /> Discussion de classe
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-light text-brand-primary flex items-center justify-center shrink-0">
            <BookOpenIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-text-primary">{myPrograms.length}</div>
            <div className="text-xs text-text-secondary font-medium mt-0.5">Programmes enseignés</div>
          </div>
        </div>

        <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <UsersIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-text-primary">
              {students.filter(s => myPrograms.includes(s.program)).length}
            </div>
            <div className="text-xs text-text-secondary font-medium mt-0.5">Étudiants suivis</div>
          </div>
        </div>

        <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-text-primary">Session 2026</div>
            <div className="text-xs text-text-secondary font-medium mt-0.5">Semestre en cours</div>
          </div>
        </div>
      </div>

      {/* Mes Cours / Formations */}
      <div className="space-y-4">
        <h2 className="font-sans font-bold text-lg text-text-primary">Mes Matières &amp; Formations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {myPrograms.map((progTitle: string) => {
            const classStudents = students.filter(s => s.program === progTitle);
            return (
              <div key={progTitle} className="bg-bg-secondary border border-border-primary rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-brand-primary font-bold text-xs uppercase tracking-wider">
                    <GraduationCapIcon className="w-4 h-4" />
                    <span>Programme d'excellence</span>
                  </div>
                  <h3 className="font-bold text-lg text-text-primary">{progTitle}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Promotion académique IDLA. Encadrement des projets, cours interactifs en direct et suivi personnalisé.
                  </p>
                </div>
                <div className="pt-4 border-t border-border-primary flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <UsersIcon className="w-4 h-4 text-brand-primary" />
                    <span className="font-bold text-text-primary">{classStudents.length}</span> étudiants inscrits
                  </div>
                  <button 
                    onClick={() => { setSelectedProgram(progTitle); setActiveTab('teacher-students'); }}
                    className="text-xs font-bold text-brand-primary hover:underline cursor-pointer flex items-center gap-1"
                  >
                    Ouvrir la classe &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderSchedule = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-sans font-bold text-2xl text-text-primary">Mon Emploi du Temps</h2>
          <p className="text-xs text-text-secondary mt-1">Consultez vos créneaux d'enseignement hebdomadaires.</p>
        </div>
      </div>

      <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'].map((day, idx) => (
            <div key={day} className="bg-bg-primary border border-border-primary rounded-xl p-4 space-y-3">
              <div className="font-bold text-sm text-text-primary pb-2 border-b border-border-primary flex items-center justify-between">
                <span>{day}</span>
                <span className="text-[10px] text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full font-bold">Jour {idx + 1}</span>
              </div>

              {idx === 0 || idx === 2 ? (
                <div className="bg-bg-secondary border-l-4 border-brand-primary p-3 rounded-lg space-y-1 shadow-sm">
                  <div className="text-[10px] font-bold text-brand-primary flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" /> 09h00 - 11h00
                  </div>
                  <div className="font-bold text-xs text-text-primary">Cours en direct (Visio)</div>
                  <div className="text-[10px] text-text-secondary">{myPrograms[0] || 'Master Ingénierie'}</div>
                </div>
              ) : idx === 1 || idx === 3 ? (
                <div className="bg-bg-secondary border-l-4 border-emerald-500 p-3 rounded-lg space-y-1 shadow-sm">
                  <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" /> 14h00 - 16h00
                  </div>
                  <div className="font-bold text-xs text-text-primary">Travaux Pratiques / Projets</div>
                  <div className="text-[10px] text-text-secondary">{myPrograms[1] || myPrograms[0] || 'Programme IDLA'}</div>
                </div>
              ) : (
                <div className="p-4 text-center text-text-secondary/40 text-xs italic">Aucun créneau</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStudents = () => {
    const classStudents = selectedProgram 
      ? students.filter(s => s.program === selectedProgram)
      : [];

    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="font-sans font-bold text-2xl text-text-primary">Mes Étudiants &amp; Chat de classe</h2>
            <p className="text-xs text-text-secondary mt-1">Échangez avec vos étudiants, partagez des cours et créez des réunions en direct.</p>
          </div>

          <div className="w-full sm:w-72">
            <select
              value={selectedProgram || ''}
              onChange={(e) => setSelectedProgram(e.target.value || null)}
              className="w-full bg-bg-secondary border border-border-primary text-text-primary font-bold text-xs p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="">-- Sélectionner une classe --</option>
              {myPrograms.map((p: string) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {!selectedProgram ? (
          <div className="bg-bg-secondary border border-border-primary rounded-2xl p-12 text-center space-y-3">
            <UsersIcon className="w-12 h-12 text-text-secondary/30 mx-auto" />
            <p className="text-sm font-semibold text-text-secondary">Veuillez sélectionner une classe dans le menu ci-dessus pour afficher la liste des étudiants et le chat.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Liste des étudiants de la classe (1/3) */}
            <div className="bg-bg-secondary border border-border-primary rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border-primary pb-3">
                <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
                  <UsersIcon className="w-4 h-4 text-brand-primary" /> Étudiants inscrits ({classStudents.length})
                </h3>
              </div>

              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {classStudents.map((s) => (
                  <div key={s.id || s.email} className="p-3 bg-bg-primary rounded-xl border border-border-primary/60 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-light border border-brand-primary/30 text-brand-primary font-bold text-xs flex items-center justify-center shrink-0">
                      {s.name?.substring(0, 2).toUpperCase() || 'ET'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-text-primary truncate">{s.name}</p>
                      <p className="text-[10px] text-text-secondary truncate">{s.email}</p>
                    </div>
                  </div>
                ))}
                {classStudents.length === 0 && (
                  <p className="text-xs text-text-secondary italic text-center py-6">Aucun étudiant dans cette classe pour le moment.</p>
                )}
              </div>
            </div>

            {/* Chat de classe & Outils ergonomiques (2/3) */}
            <div className="lg:col-span-2 bg-bg-secondary border border-border-primary rounded-2xl overflow-hidden flex flex-col shadow-sm min-h-[520px]">
              {/* Header du Chat */}
              <div className="p-4 border-b border-border-primary bg-bg-primary flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <MessageSquareIcon className="w-5 h-5 text-brand-primary" />
                  <div>
                    <h3 className="font-bold text-sm text-text-primary">{selectedProgram}</h3>
                    <p className="text-[10px] text-text-secondary">Espace d'échange, partage de fichiers &amp; réunions en direct</p>
                  </div>
                </div>

                {/* Quick Actions Header */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMeetingModal(true)}
                    className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5" /> Créer une Visio
                  </button>
                </div>
              </div>

              {/* Chat History Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-bg-primary/20">
                {chatHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-text-secondary space-y-2 opacity-60 my-12">
                    <MessageSquareIcon className="w-12 h-12 text-brand-primary/40" />
                    <p className="text-sm font-semibold">Aucun message dans cette classe.</p>
                    <p className="text-xs text-text-secondary text-center max-w-sm">
                      Utilisez les boutons ci-dessous pour lancer une discussion, transmettre des cours ou partager un lien de visioconférence.
                    </p>
                  </div>
                ) : (
                  chatHistory.map((msg, idx) => {
                    const isMe = msg.sender === 'advisor' && (msg.senderName === profile?.name || !msg.senderName);
                    return (
                      <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-sm ${
                          isMe ? 'bg-brand-primary text-white rounded-br-none' : 'bg-bg-primary border border-border-primary text-text-primary rounded-bl-none'
                        }`}>
                          {!isMe && (
                            <div className="text-[11px] font-bold text-brand-primary mb-1 flex items-center gap-1">
                              <span>{msg.senderName || 'Étudiant'}</span>
                            </div>
                          )}

                          {/* 1. FILE MESSAGE */}
                          {msg.type === 'file' ? (
                            <div className={`p-3.5 rounded-xl border flex flex-col gap-2.5 ${
                              isMe ? 'bg-white/10 border-white/20 text-white' : 'bg-bg-secondary border-border-primary text-text-primary'
                            }`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                  isMe ? 'bg-white/20 text-white' : 'bg-brand-primary/10 text-brand-primary'
                                }`}>
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-xs truncate">{msg.fileName || msg.text}</p>
                                  {msg.fileSize && <p className={`text-[10px] ${isMe ? 'text-white/80' : 'text-text-secondary'}`}>{msg.fileSize}</p>}
                                </div>
                              </div>
                              {msg.fileUrl && (
                                <a
                                  href={msg.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  download={msg.fileName}
                                  className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    isMe ? 'bg-white text-brand-primary hover:bg-white/90' : 'bg-brand-primary text-white hover:bg-brand-hover'
                                  }`}
                                >
                                  <Download className="w-3.5 h-3.5" /> Télécharger / Consulter
                                </a>
                              )}
                            </div>
                          ) : msg.type === 'meeting' ? (
                            /* 2. MEETING MESSAGE */
                            <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
                              isMe ? 'bg-white/10 border-white/20 text-white' : 'bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-indigo-500/10 border-sky-500/30 text-text-primary'
                            }`}>
                              <div className="flex items-center justify-between gap-2 border-b border-current/20 pb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Video className="w-3 h-3 animate-pulse" /> {msg.meetingPlatform || 'Visioconférence'}
                                </span>
                                {msg.meetingTime && <span className="text-[10px] opacity-80 font-medium">{msg.meetingTime}</span>}
                              </div>

                              <div>
                                <p className="font-bold text-sm leading-snug">{msg.meetingTitle || msg.text}</p>
                                <p className="text-[11px] opacity-80 mt-1">Session de cours en direct préparée par l'enseignant.</p>
                              </div>

                              {msg.meetingUrl && (
                                <a
                                  href={msg.meetingUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-md transform hover:-translate-y-0.5 cursor-pointer"
                                >
                                  <Video className="w-4 h-4" /> Rejoindre le cours en direct 🚀
                                </a>
                              )}
                            </div>
                          ) : (
                            /* 3. STANDARD TEXT MESSAGE */
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                          )}

                          <div className={`text-[10px] mt-1.5 text-right ${isMe ? 'text-white/70' : 'text-text-secondary'}`}>
                            {msg.time}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Toolbar */}
              <div className="p-3 border-t border-border-primary bg-bg-primary shrink-0 space-y-2">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  {/* File Attachment Button */}
                  <button
                    type="button"
                    onClick={() => chatFileInputRef.current?.click()}
                    disabled={isUploadingChatFile}
                    className="p-2.5 text-text-secondary hover:text-brand-primary bg-bg-secondary hover:bg-brand-primary/10 border border-border-primary rounded-xl transition-all cursor-pointer"
                    title="Joindre un cours / document (PDF, Word, Image)"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <input
                    ref={chatFileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleSendFileMessage}
                  />

                  {/* Meeting Link Button */}
                  <button
                    type="button"
                    onClick={() => setShowMeetingModal(true)}
                    className="p-2.5 text-sky-600 hover:text-sky-700 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-xl transition-all cursor-pointer"
                    title="Partager un lien de réunion (Google Meet, Zoom...)"
                  >
                    <Video className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Écrivez un message à la classe..."
                    className="flex-1 bg-bg-secondary border border-border-primary rounded-xl px-4 py-2.5 text-xs text-text-primary focus:ring-2 focus:ring-brand-primary outline-none"
                  />

                  <button
                    type="submit"
                    disabled={!chatMessage.trim()}
                    className="bg-brand-primary hover:bg-brand-hover disabled:opacity-50 text-white px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center shadow"
                  >
                    <SendIcon className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* MODALE : Partager un lien de Réunion / Visio */}
        {showMeetingModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowMeetingModal(false)}>
            <div className="bg-bg-secondary text-text-primary w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-border-primary space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary bg-bg-primary">
                <h4 className="font-bold text-sm flex items-center gap-2 text-sky-600">
                  <Video className="w-5 h-5" /> Partager un cours en visio
                </h4>
                <button onClick={() => setShowMeetingModal(false)} className="text-text-secondary hover:text-text-primary cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSendMeetingMessage} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">Intitulé du cours / Sujet *</label>
                  <input
                    type="text"
                    required
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    placeholder="ex: Session en direct — Chapitre 3"
                    className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary text-xs outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">Plateforme de visio</label>
                  <select
                    value={meetingPlatform}
                    onChange={(e) => setMeetingPlatform(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary text-xs font-bold outline-none"
                  >
                    <option value="Google Meet">Google Meet</option>
                    <option value="Zoom">Zoom</option>
                    <option value="Microsoft Teams">Microsoft Teams</option>
                    <option value="Webex">Cisco Webex</option>
                    <option value="Autre">Autre plateforme</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">Lien de la visioconférence (URL) *</label>
                  <input
                    type="url"
                    required
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    placeholder="https://meet.google.com/abc-defg-hij"
                    className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary text-xs outline-none focus:ring-2 focus:ring-brand-primary font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">Horaire (facultatif)</label>
                  <input
                    type="text"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    placeholder="ex: Aujourd'hui à 15h00"
                    className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary text-xs outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-border-primary flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowMeetingModal(false)}
                    className="px-4 py-2 rounded-lg text-xs font-bold text-text-secondary hover:bg-bg-primary border border-border-primary cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-5 py-2 rounded-lg cursor-pointer shadow flex items-center gap-1.5"
                  >
                    <Video className="w-4 h-4" /> Partager la réunion
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 p-6 md:p-8 pt-24 lg:pt-8 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {activeTab === 'teacher-dashboard' && renderDashboard()}
        {activeTab === 'teacher-schedule' && renderSchedule()}
        {activeTab === 'teacher-students' && renderStudents()}
      </div>
    </div>
  );
}
