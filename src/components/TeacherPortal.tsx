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
import { account, databases, APPWRITE_CONFIG, isAppwriteDbConfigured, Query, ID } from '../lib/appwrite';
import { TeacherScheduleSlot } from '../types';

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
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
            try {
              const data = JSON.parse(m.text);
              if (data.t) {
                parsedText = data.t;
                sName = data.n || sName;
              }
            } catch (e) {}

            return {
              sender: m.sender,
              text: parsedText,
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
    const userMsg = { sender: 'advisor', text, time: 'À l\'instant', senderName: profile.name };
    setChatHistory((curr) => [...curr, userMsg]);

    const canPersist = isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.messages;
    if (canPersist) {
      try {
        const payloadStr = JSON.stringify({ n: profile.name, t: text });
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

  useEffect(() => {
    if (!isLoggedIn) return;

    const loadTeacherData = async () => {
      setLoading(true);
      try {
        const u = await account.get();
        if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.cmsUsers) {
          const res = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.cmsUsers,
            [Query.equal('email', u.email.toLowerCase().trim())]
          );
          if (res.documents.length > 0) {
            const userDoc = res.documents[0];
            setProfile({
              name: userDoc.name || u.name,
              email: u.email,
              assignedPrograms: userDoc.assignedPrograms || [],
              scheduleData: userDoc.scheduleData ? JSON.parse(userDoc.scheduleData) : []
            });
            
            // Load students for assigned programs
            if (APPWRITE_CONFIG.collections.applications && userDoc.assignedPrograms?.length > 0) {
              try {
                const studentsRes = await databases.listDocuments(
                  APPWRITE_CONFIG.databaseId,
                  APPWRITE_CONFIG.collections.applications,
                  [
                    Query.equal('status', 'Accepted'),
                    Query.limit(5000)
                  ]
                );
                
                const myStudents = studentsRes.documents.filter((doc: any) => 
                  userDoc.assignedPrograms.includes(doc.program)
                );
                setStudents(myStudents);
              } catch (err: any) {
                console.error("Erreur de permission ou de chargement des étudiants (Applications):", err);
                if (err.code === 401 || err.code === 403) {
                  alert("Attention : Votre compte n'a pas les droits pour lire la table des candidatures. Demandez à l'administrateur de mettre à jour les permissions Appwrite.");
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn("Erreur chargement données enseignant:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTeacherData();
  }, [isLoggedIn]);

  if (loading) {
    return (
      <div className="flex-1 p-8 pt-24 lg:pt-8 min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 p-8 pt-24 lg:pt-8 min-h-screen text-center">
        <h2 className="text-xl font-bold text-red-500">Profil enseignant introuvable</h2>
      </div>
    );
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-text-primary font-sans">Bonjour, {profile.name}</h2>
      <p className="text-text-secondary text-sm">Bienvenue sur votre espace enseignant. Voici un aperçu de vos activités.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-bg-secondary border border-border-primary rounded-xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <BookOpenIcon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-text-primary text-sm uppercase">Programmes assignés</h3>
          </div>
          <div className="text-3xl font-extrabold text-text-primary">{profile.assignedPrograms.length}</div>
        </div>
        
        <div className="bg-bg-secondary border border-border-primary rounded-xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <UsersIcon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-text-primary text-sm uppercase">Étudiants Inscrits</h3>
          </div>
          <div className="text-3xl font-extrabold text-text-primary">{students.length}</div>
        </div>
        
        <div className="bg-bg-secondary border border-border-primary rounded-xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
              <ClockIcon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-text-primary text-sm uppercase">Heures de cours (Semaine)</h3>
          </div>
          <div className="text-3xl font-extrabold text-text-primary">
            {profile.scheduleData.length * 2}h
          </div>
        </div>
      </div>
      
      {renderSchedule()}
    </div>
  );

  const renderSchedule = () => {
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-primary font-sans">Mon Emploi du Temps</h2>
        </div>
        
        <div className="bg-bg-secondary border border-border-primary rounded-xl overflow-hidden">
          <div className="grid grid-cols-6 border-b border-border-primary bg-bg-primary/50 text-xs font-bold text-text-secondary uppercase tracking-wider">
            {days.map(day => (
              <div key={day} className="p-4 text-center border-r border-border-primary last:border-0">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-6 min-h-[300px]">
            {days.map(day => {
              const daySlots = profile.scheduleData.filter((s: any) => s.day === day).sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
              return (
                <div key={day} className="border-r border-border-primary last:border-0 p-2 space-y-2">
                  {daySlots.map((slot: any, idx: number) => (
                    <div key={idx} className="bg-brand-primary/10 border border-brand-primary/20 rounded-lg p-3 text-sm">
                      <div className="font-bold text-brand-primary text-[11px] mb-1">{slot.startTime} - {slot.endTime}</div>
                      <div className="font-semibold text-text-primary text-xs leading-tight mb-1.5">{slot.course}</div>
                      <div className="text-[10px] text-text-secondary">{slot.program}</div>
                    </div>
                  ))}
                  {daySlots.length === 0 && (
                    <div className="text-center py-4 text-[10px] text-text-secondary/50">Aucun cours</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderStudents = () => {
    if (!selectedProgram) {
      return (
        <div className="space-y-6 animate-fadeIn">
          <h2 className="text-xl font-bold text-text-primary font-sans">Mes Classes</h2>
          <p className="text-sm text-text-secondary">Sélectionnez une classe pour voir la liste des étudiants inscrits.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {profile.assignedPrograms.map((programName: string) => {
              const studentsInProgram = students.filter(s => s.program === programName).length;
              return (
                <div 
                  key={programName}
                  onClick={() => setSelectedProgram(programName)}
                  className="bg-bg-secondary border border-border-primary hover:border-brand-primary/50 hover:shadow-lg rounded-xl p-6 cursor-pointer transition-all duration-300 group flex flex-col items-center text-center gap-4"
                >
                  <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 group-hover:bg-brand-primary/20 flex items-center justify-center text-brand-primary transition-colors">
                    <GraduationCapIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary text-lg group-hover:text-brand-primary transition-colors">{programName}</h3>
                    <p className="text-sm text-text-secondary mt-1">{studentsInProgram} étudiant{studentsInProgram !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              );
            })}
            
            {profile.assignedPrograms.length === 0 && (
              <div className="col-span-full p-8 text-center bg-bg-secondary border border-border-primary rounded-xl">
                <p className="text-text-secondary">Vous n'avez pas de classes assignées.</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    const filteredStudents = students.filter(s => s.program === selectedProgram);

    return (
      <div className="space-y-6 animate-fadeIn h-[calc(100vh-140px)] flex flex-col">
        <div className="flex items-center gap-4 shrink-0">
          <button 
            onClick={() => setSelectedProgram(null)}
            className="p-2 rounded-lg bg-bg-secondary border border-border-primary hover:bg-bg-primary text-text-secondary cursor-pointer transition-colors"
            title="Retour aux classes"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-text-primary font-sans flex items-center gap-2">
              Classe <span className="text-text-secondary font-normal text-sm">/ {selectedProgram}</span>
            </h2>
            <p className="text-sm text-text-secondary">Gérez vos étudiants et discutez avec la classe.</p>
          </div>
        </div>
        
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
          {/* Colonne Liste des étudiants (1/3) */}
          <div className="lg:col-span-1 bg-bg-secondary border border-border-primary rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border-primary bg-bg-primary/50 shrink-0">
              <h3 className="font-bold text-sm text-text-primary uppercase flex items-center gap-2">
                <UsersIcon className="w-4 h-4" /> Étudiants ({filteredStudents.length})
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-border-primary">
                  {filteredStudents.length > 0 ? filteredStudents.map(s => (
                    <tr key={s.$id} className="hover:bg-bg-primary/30 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold text-xs shrink-0">
                            {s.initials || s.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-text-primary truncate">{s.name}</div>
                            <div className="text-[10px] text-text-secondary truncate">{s.email}</div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td className="p-8 text-center text-text-secondary text-xs">Aucun étudiant dans cette classe.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Colonne Chat de classe (2/3) */}
          <div className="lg:col-span-2 bg-bg-secondary border border-border-primary rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border-primary bg-bg-primary/50 shrink-0 flex justify-between items-center">
              <h3 className="font-bold text-sm text-text-primary uppercase flex items-center gap-2">
                <MessageSquareIcon className="w-4 h-4" /> Discussion de classe
              </h3>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-text-secondary space-y-2 opacity-50">
                  <MessageSquareIcon className="w-12 h-12" />
                  <p className="text-sm">Aucun message pour le moment. Soyez le premier à écrire à la classe !</p>
                </div>
              ) : (
                chatHistory.map((msg, idx) => {
                  const isMe = msg.sender === 'advisor' && msg.senderName === profile?.name;
                  return (
                    <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${isMe ? 'bg-brand-primary text-white rounded-br-none' : 'bg-bg-primary border border-border-primary text-text-primary rounded-bl-none'}`}>
                        {!isMe && <div className="text-[10px] font-bold text-brand-primary mb-1">{msg.senderName}</div>}
                        <p className="text-sm">{msg.text}</p>
                        <div className={`text-[10px] mt-1 ${isMe ? 'text-brand-light/70' : 'text-text-secondary'}`}>{msg.time}</div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-4 border-t border-border-primary bg-bg-primary/50 shrink-0">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Écrivez un message à la classe..."
                  className="flex-1 bg-bg-primary border border-border-primary rounded-lg px-4 py-2 text-sm text-text-primary focus:border-brand-primary outline-none"
                />
                <button
                  type="submit"
                  disabled={!chatMessage.trim()}
                  className="bg-brand-primary hover:bg-brand-hover disabled:opacity-50 text-white p-2.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                >
                  <SendIcon className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
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
