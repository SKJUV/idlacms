import React, { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  UsersIcon, 
  BookOpenIcon, 
  ClockIcon,
  CheckCircle2Icon
} from './Icons';
import { account, databases, APPWRITE_CONFIG, isAppwriteDbConfigured, Query } from '../lib/appwrite';
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

  const renderStudents = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-text-primary font-sans">Mes Étudiants</h2>
      <p className="text-sm text-text-secondary">Liste des étudiants inscrits à vos programmes.</p>
      
      <div className="bg-bg-secondary border border-border-primary rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-bg-primary/50 border-b border-border-primary text-xs uppercase font-bold text-text-secondary">
            <tr>
              <th className="p-4">Étudiant</th>
              <th className="p-4">Programme</th>
              <th className="p-4">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-primary">
            {students.length > 0 ? students.map(s => (
              <tr key={s.$id} className="hover:bg-bg-primary/30 transition-colors">
                <div className="p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold text-xs">
                    {s.initials || s.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="font-semibold text-text-primary">{s.name}</span>
                </div>
                <td className="p-4 text-text-secondary">{s.program}</td>
                <td className="p-4 text-text-secondary">{s.email}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={3} className="p-8 text-center text-text-secondary">Aucun étudiant trouvé pour vos programmes.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

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
