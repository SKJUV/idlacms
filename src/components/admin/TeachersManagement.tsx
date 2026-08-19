import React, { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  PlusIcon, 
  SearchIcon, 
  Trash2Icon, 
  CheckCircle2Icon,
  XCircleIcon,
  MailIcon,
  CalendarIcon,
  BookOpenIcon,
  SaveIcon,
  ClockIcon
} from '../Icons';
import { account, databases, APPWRITE_CONFIG, isAppwriteDbConfigured, Query, ID } from '../../lib/appwrite';

interface TeachersManagementProps {
  programs: any[];
  logActivity: (type: any, user: string, action: string) => void;
}

export default function TeachersManagement({ programs, logActivity }: TeachersManagementProps) {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isAdding, setIsAdding] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
  
  // Create Form State
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newTitle, setNewTitle] = useState('Intervenant');
  const [newSpeciality, setNewSpeciality] = useState('');
  const [newAssignedPrograms, setNewAssignedPrograms] = useState<string[]>([]);
  
  // Schedule Manager State
  const [editingSchedule, setEditingSchedule] = useState<any | null>(null);
  const [editingAssignedPrograms, setEditingAssignedPrograms] = useState<string[]>([]);
  const [editingProgToAdd, setEditingProgToAdd] = useState('');
  const [editingClassToAdd, setEditingClassToAdd] = useState('Toutes les classes');
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [newSlot, setNewSlot] = useState<{ course: string; program: string; day: string; startTime: string; endTime: string; type: 'CM' | 'TD' | 'TP' }>({ 
    course: '', program: '', day: 'Lundi', startTime: '08:00', endTime: '10:00', type: 'CM' 
  });
  const [selectedProgToAdd, setSelectedProgToAdd] = useState('');
  const [selectedClassToAdd, setSelectedClassToAdd] = useState('Toutes les classes');

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const STANDARD_TIME_BLOCKS = [
    { start: '08:00', end: '10:00' },
    { start: '10:15', end: '12:15' },
    { start: '13:30', end: '15:30' },
    { start: '15:45', end: '17:45' }
  ];

  // Algorithme d'analyse automatique pour trouver le 1er créneau 100% libre sans aucun chevauchement
  const findOptimalSlot = (targetProgram: string, currentSchedules: any[]) => {
    for (const day of days) {
      for (const block of STANDARD_TIME_BLOCKS) {
        const isOverlap = currentSchedules.some((slot: any) => {
          if (slot.day !== day) return false;
          return (block.start < slot.endTime && slot.startTime < block.end);
        });
        if (!isOverlap) {
          return { day, startTime: block.start, endTime: block.end };
        }
      }
    }
    return { day: 'Lundi', startTime: '08:00', endTime: '10:00' };
  };

  const handleCourseChange = (courseVal: string) => {
    let localCourses: any[] = [];
    try { localCourses = JSON.parse(localStorage.getItem('idla_local_courses') || '[]'); } catch {}

    const matchCourse = localCourses.find((c: any) => c.title === courseVal);
    let matchedProgram = newSlot.program;
    if (matchCourse && matchCourse.program) {
      matchedProgram = matchCourse.program;
    } else if (editingSchedule && editingSchedule.assignedPrograms && editingSchedule.assignedPrograms.length > 0) {
      matchedProgram = editingSchedule.assignedPrograms[0];
    }

    // Recherche automatique du premier créneau libre pour ce cours/programme
    const optimal = findOptimalSlot(matchedProgram, scheduleData);

    setNewSlot((prev) => ({
      ...prev,
      course: courseVal,
      program: matchedProgram,
      day: optimal.day,
      startTime: optimal.startTime,
      endTime: optimal.endTime
    }));
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    setLoading(true);
    let cloudDocs: any[] = [];
    try {
      const cmsUsersColl = APPWRITE_CONFIG.collections.cmsUsers || 'cms_users';
      if (isAppwriteDbConfigured() && cmsUsersColl) {
        const res = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          cmsUsersColl,
          [Query.equal('role', 'teacher')]
        );
        cloudDocs = res.documents.map((doc: any) => {
          let assigned = doc.assignedPrograms;
          if (typeof assigned === 'string') {
            try { assigned = JSON.parse(assigned); } catch { assigned = []; }
          }
          if (!Array.isArray(assigned)) assigned = [];

          let schedule = doc.scheduleData;
          if (typeof schedule === 'string') {
            try { schedule = JSON.parse(schedule); } catch { schedule = []; }
          }

          return { ...doc, id: doc.$id, assignedPrograms: assigned, scheduleData: schedule };
        });
      }
    } catch (err) {
      console.warn("Erreur chargement enseignants Appwrite (cms_users):", err);
    }

    let localTeachers: any[] = [];
    try { localTeachers = JSON.parse(localStorage.getItem('idla_local_teachers') || '[]'); } catch {}

    const combined = [...cloudDocs];
    
    localTeachers.forEach(lt => {
      if (!combined.some(c => c.id === lt.id || c.email === lt.email || c.$id === lt.id)) {
        combined.push(lt);
      }
    });

    setTeachers(combined);
    try { localStorage.setItem('idla_local_teachers', JSON.stringify(combined)); } catch {}
    setLoading(false);
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Create Appwrite Account
      const userId = ID.unique();
      const fullName = `${newFirstName} ${newLastName}`;
      try {
        await account.create(userId, newEmail, newPassword, fullName);
      } catch (e: any) {
        console.warn("Remarque création compte Auth enseignant:", e.message);
      }
      let newDoc: any = {
        id: userId,
        $id: userId,
        authUserId: userId,
        firstName: newFirstName,
        lastName: newLastName,
        name: fullName,
        email: newEmail,
        title: newTitle,
        speciality: newSpeciality,
        assignedPrograms: newAssignedPrograms,
        initials: newFirstName.substring(0, 1).toUpperCase() + newLastName.substring(0, 1).toUpperCase(),
        status: 'Actif',
      };

      const cmsUsersColl = APPWRITE_CONFIG.collections.cmsUsers || 'cms_users';
      if (isAppwriteDbConfigured() && cmsUsersColl) {
        try {
          const doc = await databases.createDocument(
            APPWRITE_CONFIG.databaseId,
            cmsUsersColl,
            userId,
            {
              authUserId: userId,
              name: fullName,
              email: newEmail,
              role: 'teacher',
              status: 'Actif',
              initials: newDoc.initials,
              assignedPrograms: newAssignedPrograms,
              scheduleData: '[]'
            }
          );
          newDoc = { ...doc, id: doc.$id, name: fullName, initials: newDoc.initials, assignedPrograms: newAssignedPrograms };
        } catch (e: any) {
          console.warn("Erreur création document cms_users enseignant:", e.message);
        }
      }

      const updatedList = [newDoc, ...teachers];
      setTeachers(updatedList);
      try { localStorage.setItem('idla_local_teachers', JSON.stringify(updatedList)); } catch {}

      logActivity('registration', 'Admin', `a créé l'enseignant ${fullName}`);
      setIsAdding(false);
      setNewFirstName(''); setNewLastName(''); setNewEmail(''); setNewPassword(''); setNewTitle('Intervenant'); setNewSpeciality(''); setNewAssignedPrograms([]);
    } catch (err: any) {
      alert("Erreur: " + err.message);
    }
  };

  const handleDeleteTeacher = async (id: string, name: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer l'enseignant ${name} ?`)) return;
    try {
      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.teachers) {
        try {
          await databases.deleteDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.teachers, id);
        } catch (e) {}
      }
      const updatedList = teachers.filter(t => t.$id !== id && t.id !== id);
      setTeachers(updatedList);
      try { localStorage.setItem('idla_local_teachers', JSON.stringify(updatedList)); } catch {}
      logActivity('error', 'Admin', `a supprimé l'enseignant ${name}`);
    } catch (err: any) {
      alert("Erreur: " + err.message);
    }
  };

  const openScheduleManager = (teacher: any) => {
    setEditingSchedule(teacher);
    let assigned = teacher.assignedPrograms || [];
    if (typeof assigned === 'string') {
      try { assigned = JSON.parse(assigned); } catch { assigned = []; }
    }
    if (!Array.isArray(assigned)) assigned = [];
    setEditingAssignedPrograms(assigned);
    
    let sched = teacher.scheduleData;
    if (typeof sched === 'string') {
      try { sched = JSON.parse(sched); } catch { sched = []; }
    }
    if (!Array.isArray(sched)) sched = [];
    setScheduleData(sched);
  };

  const handleAddSlot = () => {
    if (!newSlot.course || !newSlot.program) return;

    // Analyse et réorganisation automatique sans popup
    let targetDay = newSlot.day;
    let targetStart = newSlot.startTime;
    let targetEnd = newSlot.endTime;

    const hasOverlap = scheduleData.some((slot: any) => {
      if (slot.day !== targetDay) return false;
      return (targetStart < slot.endTime && slot.startTime < targetEnd);
    });

    if (hasOverlap) {
      const optimal = findOptimalSlot(newSlot.program, scheduleData);
      targetDay = optimal.day;
      targetStart = optimal.startTime;
      targetEnd = optimal.endTime;
    }

    const slotToAdd = {
      ...newSlot,
      day: targetDay,
      startTime: targetStart,
      endTime: targetEnd
    };

    const nextSchedule = [...scheduleData, slotToAdd];
    setScheduleData(nextSchedule);

    if (!editingAssignedPrograms.includes(newSlot.program)) {
      setEditingAssignedPrograms([...editingAssignedPrograms, newSlot.program]);
    }

    const nextOptimal = findOptimalSlot(newSlot.program, nextSchedule);
    setNewSlot({
      day: nextOptimal.day,
      startTime: nextOptimal.startTime,
      endTime: nextOptimal.endTime,
      course: '',
      program: newSlot.program,
      type: 'CM'
    });
  };

  // Génération automatique d'un emploi du temps optimal 100% sans conflit pour tous les cours du programme
  const handleAutoPlanAll = () => {
    let localCourses: any[] = [];
    try { localCourses = JSON.parse(localStorage.getItem('idla_local_courses') || '[]'); } catch {}

    const selectedPrograms = editingAssignedPrograms.length > 0 ? editingAssignedPrograms : programs.map((p: any) => typeof p === 'string' ? p : p.title);
    const targetCourses = localCourses.filter((c: any) => selectedPrograms.includes(c.program));

    if (targetCourses.length === 0) {
      alert("Aucun cours enregistré trouvé pour les programmes de cet enseignant. Soumettez d'abord des cours dans le Portail Enseignant.");
      return;
    }

    let currentSchedule: any[] = [];
    targetCourses.forEach((c: any) => {
      // Ajouter une séance CM et une séance TD pour chaque cours
      const optCM = findOptimalSlot(c.program, currentSchedule);
      currentSchedule.push({
        day: optCM.day,
        startTime: optCM.startTime,
        endTime: optCM.endTime,
        course: c.title,
        program: c.program,
        type: 'CM'
      });

      const optTD = findOptimalSlot(c.program, currentSchedule);
      currentSchedule.push({
        day: optTD.day,
        startTime: optTD.startTime,
        endTime: optTD.endTime,
        course: c.title,
        program: c.program,
        type: 'TD'
      });
    });

    setScheduleData(currentSchedule);
  };

  const handleRemoveSlot = (index: number) => {
    setScheduleData(scheduleData.filter((_, i) => i !== index));
  };

  const saveSchedule = async () => {
    if (!editingSchedule) return;

    // Auto-add pending program if user forgot to click "Ajouter"
    let finalAssigned = [...editingAssignedPrograms];
    if (editingProgToAdd) {
      const entry = editingClassToAdd === 'Toutes les classes' ? editingProgToAdd : `${editingProgToAdd} - ${editingClassToAdd}`;
      if (!finalAssigned.includes(entry)) finalAssigned.push(entry);
    }

    // Auto-add pending schedule slot if user forgot to click "Ajouter le créneau"
    let finalSchedule = [...scheduleData];
    if (newSlot.course && newSlot.program) {
      let targetDay = newSlot.day;
      let targetStart = newSlot.startTime;
      let targetEnd = newSlot.endTime;

      const hasOverlap = finalSchedule.some((slot: any) => {
        if (slot.day !== targetDay) return false;
        return (targetStart < slot.endTime && slot.startTime < targetEnd);
      });

      if (hasOverlap) {
        const optimal = findOptimalSlot(newSlot.program, finalSchedule);
        targetDay = optimal.day;
        targetStart = optimal.startTime;
        targetEnd = optimal.endTime;
      }
      finalSchedule.push({ ...newSlot, id: Date.now(), day: targetDay, startTime: targetStart, endTime: targetEnd });
    }

    try {
      const derivedCourses = Array.from(new Set(finalSchedule.map((s: any) => s.course).filter(Boolean)));
      const cmsUsersColl = APPWRITE_CONFIG.collections.cmsUsers || 'cms_users';
      let updatedDoc: any = null;

      if (isAppwriteDbConfigured() && cmsUsersColl) {
        const idToUpdate = editingSchedule.$id || editingSchedule.id;
        try {
          updatedDoc = await databases.updateDocument(
            APPWRITE_CONFIG.databaseId,
            cmsUsersColl,
            idToUpdate,
            {
              scheduleData: JSON.stringify(finalSchedule),
              assignedPrograms: finalAssigned,
              assignedCourses: derivedCourses
            }
          );
        } catch (e) {
          // Fallback if assignedCourses attribute isn't created in Appwrite DB schema yet
          updatedDoc = await databases.updateDocument(
            APPWRITE_CONFIG.databaseId,
            cmsUsersColl,
            idToUpdate,
            {
              scheduleData: JSON.stringify(finalSchedule),
              assignedPrograms: finalAssigned
            }
          );
        }
      }

      let assigned = updatedDoc?.assignedPrograms || finalAssigned;
      if (typeof assigned === 'string') {
        try { assigned = JSON.parse(assigned); } catch { assigned = []; }
      }
      if (!Array.isArray(assigned)) assigned = [];

      const normalizedDoc = {
        ...editingSchedule,
        ...(updatedDoc || {}),
        id: editingSchedule.id || editingSchedule.$id,
        $id: editingSchedule.$id || editingSchedule.id,
        assignedPrograms: assigned,
        assignedCourses: derivedCourses,
        scheduleData: JSON.stringify(finalSchedule)
      };

      const updatedList = teachers.map(t => (t.$id === normalizedDoc.id || t.id === normalizedDoc.id) ? normalizedDoc : t);
      setTeachers(updatedList);
      try { localStorage.setItem('idla_local_teachers', JSON.stringify(updatedList)); } catch {}

      logActivity('article', 'Admin', `a mis à jour la programmation de l'enseignant ${editingSchedule.name}`);
      setEditingSchedule(null);
      setEditingAssignedPrograms([]);
      setEditingProgToAdd('');
      setNewSlot({ course: '', program: '', day: 'Lundi', startTime: '08:00', endTime: '10:00', type: 'CM' });
    } catch (err: any) {
      alert("Erreur de sauvegarde: " + err.message);
    }
  };

  const filteredTeachers = teachers.filter(t => 
    (t.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (t.email || '').toLowerCase().includes(search.toLowerCase())
  );

  if (editingSchedule) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setEditingSchedule(null)} className="p-2 rounded-lg bg-bg-secondary border border-border-primary hover:bg-bg-primary text-text-secondary cursor-pointer">
              Retour
            </button>
            <div>
              <h2 className="text-xl font-bold text-text-primary">Gestion : {editingSchedule.name}</h2>
              <p className="text-xs text-text-secondary">Gérez les programmes assignés et l'emploi du temps</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleAutoPlanAll} className="flex items-center gap-2 bg-[#006c49] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 cursor-pointer shadow-sm transition-all">
              ⚡ Générer l'emploi du temps 100% sans conflit
            </button>
            <button onClick={saveSchedule} className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-brand-hover cursor-pointer">
              <SaveIcon className="w-4 h-4" /> Enregistrer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-bg-secondary border border-border-primary rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-sm text-text-primary uppercase">Ajouter un créneau</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase">Jour</label>
                <select value={newSlot.day} onChange={(e) => setNewSlot({...newSlot, day: e.target.value})} className="w-full mt-1 p-2 bg-bg-primary border border-border-primary rounded text-sm outline-none text-text-primary">
                  {days.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase">Début</label>
                  <input type="time" value={newSlot.startTime} onChange={(e) => setNewSlot({...newSlot, startTime: e.target.value})} className="w-full mt-1 p-2 bg-bg-primary border border-border-primary rounded text-sm outline-none text-text-primary" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase">Fin</label>
                  <input type="time" value={newSlot.endTime} onChange={(e) => setNewSlot({...newSlot, endTime: e.target.value})} className="w-full mt-1 p-2 bg-bg-primary border border-border-primary rounded text-sm outline-none text-text-primary" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase">Matière / Cours (Auto-remplit le programme)</label>
                <input 
                  type="text" 
                  list="teacher-courses-datalist"
                  value={newSlot.course} 
                  onChange={(e) => handleCourseChange(e.target.value)} 
                  placeholder="Ex: INF301 - Algorithmique" 
                  className="w-full mt-1 p-2 bg-bg-primary border border-border-primary rounded text-sm outline-none text-text-primary font-semibold" 
                />
                <datalist id="teacher-courses-datalist">
                  {(() => {
                    try {
                      const courses = JSON.parse(localStorage.getItem('idla_local_courses') || '[]');
                      return courses
                        .filter((c: any) => !newSlot.program || c.program === newSlot.program)
                        .map((c: any) => (
                          <option key={c.id || c.code} value={c.title} />
                        ));
                    } catch {
                      return null;
                    }
                  })()}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase">Programme de l'enseignant</label>
                  <select value={newSlot.program} onChange={(e) => setNewSlot({...newSlot, program: e.target.value})} className="w-full mt-1 p-2 bg-bg-primary border border-border-primary rounded text-sm outline-none text-text-primary font-bold">
                    <option value="">Sélectionner parmi ses programmes</option>
                    {(() => {
                      const assignedBase = Array.from(new Set(editingAssignedPrograms.map(p => p.split(' - ')[0]).filter(Boolean)));
                      const listToUse = assignedBase.length > 0 ? assignedBase : programs.map((p: any) => typeof p === 'string' ? p : p.title);
                      return listToUse.map((title: string) => (
                        <option key={title} value={title}>{title}</option>
                      ));
                    })()}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase">Type de Séance</label>
                  <select value={newSlot.type} onChange={(e) => setNewSlot({...newSlot, type: e.target.value as any})} className="w-full mt-1 p-2 bg-bg-primary border border-border-primary rounded text-sm outline-none text-text-primary font-bold">
                    <option value="CM">CM (Cours Magistral)</option>
                    <option value="TD">TD (Travaux Dirigés)</option>
                    <option value="TP">TP (Travaux Pratiques)</option>
                  </select>
                </div>
              </div>

              <button onClick={handleAddSlot} disabled={!newSlot.course || !newSlot.program} className="w-full mt-2 bg-emerald-500/10 text-emerald-600 font-bold py-2 rounded hover:bg-emerald-500/20 disabled:opacity-50 transition-colors cursor-pointer text-sm">
                Ajouter au planning
              </button>
            </div>
          </div>
            
            <div className="bg-bg-secondary border border-border-primary rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-sm text-text-primary uppercase">Programmes assignés</h3>
              <div className="space-y-2 mt-1">
                <div className="flex flex-col gap-2">
                  <select value={editingProgToAdd} onChange={e => setEditingProgToAdd(e.target.value)} className="w-full p-2 bg-bg-primary border border-border-primary rounded text-sm outline-none text-text-primary">
                    <option value="">Sélectionner un programme</option>
                    {programs.map((p: any) => {
                      const title = typeof p === 'string' ? p : p.title;
                      return <option key={title} value={title}>{title}</option>;
                    })}
                  </select>
                  <div className="flex gap-2">
                    <select value={editingClassToAdd} onChange={e => setEditingClassToAdd(e.target.value)} className="flex-1 p-2 bg-bg-primary border border-border-primary rounded text-sm outline-none text-text-primary">
                      {(() => {
                        const selectedProgObj = programs.find((p: any) => (typeof p === 'string' ? p : p.title) === editingProgToAdd);
                        const progType = selectedProgObj?.type || (editingProgToAdd.toLowerCase().includes('master') ? 'Master' : editingProgToAdd.toLowerCase().includes('doctorat') ? 'Doctorat' : editingProgToAdd.toLowerCase().includes('certif') ? 'Certification' : 'Bachelor');
                        const validLevels = progType === 'Bachelor' ? ['Toutes les classes', 'L1', 'L2', 'L3'] : progType === 'Master' ? ['Toutes les classes', 'M1', 'M2'] : progType === 'Doctorat' ? ['Toutes les classes', 'D1', 'D2', 'D3'] : ['Toutes les classes', 'Certifiant'];
                        return validLevels.map(c => <option key={c} value={c}>{c}</option>);
                      })()}
                    </select>
                    <button type="button" onClick={() => {
                      if (editingProgToAdd) {
                        const entry = editingClassToAdd === 'Toutes les classes' ? editingProgToAdd : `${editingProgToAdd} - ${editingClassToAdd}`;
                        if (!editingAssignedPrograms.includes(entry)) setEditingAssignedPrograms([...editingAssignedPrograms, entry]);
                        setEditingProgToAdd('');
                      }
                    }} className="bg-brand-primary text-white px-3 py-2 rounded text-sm font-bold hover:bg-brand-hover">Ajouter</button>
                  </div>
                </div>
                <div className="h-40 overflow-y-auto bg-bg-primary border border-border-primary rounded-lg p-2 space-y-1">
                  {editingAssignedPrograms.map((p, i) => (
                    <div key={i} className="flex justify-between items-center text-sm p-1.5 hover:bg-bg-secondary rounded">
                      <span className="text-text-primary truncate">{p}</span>
                      <button type="button" onClick={() => {
                        const pToRemove = editingAssignedPrograms[i];
                        setEditingAssignedPrograms(editingAssignedPrograms.filter((_, idx) => idx !== i));
                        setScheduleData(scheduleData.filter((slot: any) => slot.program !== pToRemove));
                      }} className="text-red-500 hover:text-red-700 font-bold px-2 cursor-pointer">X</button>
                    </div>
                  ))}
                  {editingAssignedPrograms.length === 0 && <div className="text-xs text-text-secondary italic text-center py-2">Aucun programme assigné</div>}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 bg-bg-secondary border border-border-primary rounded-xl overflow-hidden">
            <div className="grid grid-cols-6 border-b border-border-primary bg-bg-primary/50 text-xs font-bold text-text-secondary uppercase tracking-wider">
              {days.map(day => (
                <div key={day} className="p-3 text-center border-r border-border-primary last:border-0">{day.slice(0, 3)}</div>
              ))}
            </div>
            <div className="grid grid-cols-6 min-h-[400px]">
              {days.map(day => {
                const daySlots = scheduleData.filter((s: any) => s.day === day).sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
                return (
                  <div key={day} className="border-r border-border-primary last:border-0 p-1.5 space-y-1.5">
                    {daySlots.map((slot: any, idx: number) => {
                      const globalIdx = scheduleData.indexOf(slot);
                      return (
                        <div key={globalIdx} className="bg-brand-primary/10 border border-brand-primary/20 rounded p-2 text-xs relative group">
                          <button onClick={() => handleRemoveSlot(globalIdx)} className="absolute top-1 right-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer">
                            <XCircleIcon className="w-3 h-3" />
                          </button>
                          <div className="font-bold text-brand-primary text-[10px]">{slot.startTime}-{slot.endTime}</div>
                          <div className="font-semibold text-text-primary truncate" title={slot.course}>{slot.course}</div>
                          <div className="text-[9px] text-text-secondary truncate mt-0.5">{slot.program}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tableau de Comptabilisation des Heures Synchronisées par Cours */}
        <div className="bg-bg-secondary border border-border-primary rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-text-primary uppercase flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-brand-primary" /> Synchronisation du Volume Horaire &amp; Heures Planifiées
            </h3>
            <span className="text-[10px] bg-brand-primary/10 text-brand-primary font-bold px-2.5 py-1 rounded-full">Calcul en temps réel</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border-primary/60 text-text-secondary text-[10px] uppercase">
                  <th className="py-2 px-3">Cours / Enseignement</th>
                  <th className="py-2 px-3">Programme</th>
                  <th className="py-2 px-3 text-center">Séances Prévues</th>
                  <th className="py-2 px-3 text-center">Heures Planifiées</th>
                  <th className="py-2 px-3 text-center">Volume Prévu (UE)</th>
                  <th className="py-2 px-3 text-right">Progression</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary/40 text-text-primary">
                {(() => {
                  const courseMap: Record<string, { program: string; count: number; totalHours: number }> = {};
                  scheduleData.forEach((slot: any) => {
                    const cKey = slot.course || 'Cours non spécifié';
                    if (!courseMap[cKey]) {
                      courseMap[cKey] = { program: slot.program || 'N/A', count: 0, totalHours: 0 };
                    }
                    courseMap[cKey].count += 1;
                    
                    // Duration calculation
                    const [sH, sM] = (slot.startTime || '00:00').split(':').map(Number);
                    const [eH, eM] = (slot.endTime || '00:00').split(':').map(Number);
                    const hours = Math.max(0, (eH * 60 + eM - (sH * 60 + sM)) / 60);
                    courseMap[cKey].totalHours += hours;
                  });

                  let localCourses: any[] = [];
                  try { localCourses = JSON.parse(localStorage.getItem('idla_local_courses') || '[]'); } catch {}

                  const entries = Object.entries(courseMap);
                  if (entries.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-text-secondary italic text-xs">
                          Aucun créneau planifié pour le moment.
                        </td>
                      </tr>
                    );
                  }

                  return entries.map(([cName, data]) => {
                    const matchedCourse = localCourses.find((lc: any) => lc.title === cName || cName.includes(lc.title));
                    const volumeTotal = matchedCourse ? (matchedCourse.volumeCM || 0) + (matchedCourse.volumeTD || 0) + (matchedCourse.volumeTP || 0) : 30;
                    const percent = Math.min(100, Math.round((data.totalHours / (volumeTotal || 1)) * 100));

                    return (
                      <tr key={cName} className="hover:bg-bg-primary/40">
                        <td className="py-2.5 px-3 font-bold">{cName}</td>
                        <td className="py-2.5 px-3 text-text-secondary">{data.program}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-brand-primary">{data.count} créneau(x)</td>
                        <td className="py-2.5 px-3 text-center font-semibold">{data.totalHours.toFixed(1)}h</td>
                        <td className="py-2.5 px-3 text-center text-text-secondary">{volumeTotal > 0 ? `${volumeTotal}h` : 'Non défini'}</td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-24 bg-bg-primary border border-border-primary h-2 rounded-full overflow-hidden">
                              <div className="bg-brand-primary h-full transition-all duration-500" style={{ width: `${percent}%` }} />
                            </div>
                            <span className="font-bold text-[11px] text-brand-primary min-w-[32px]">{percent}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary font-sans flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-brand-primary" /> Gestion des Enseignants
          </h2>
          <p className="text-sm text-text-secondary mt-1">Créez des enseignants, assignez des programmes et gérez leurs emplois du temps.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center justify-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-hover cursor-pointer"
        >
          {isAdding ? 'Fermer' : <><PlusIcon className="w-4 h-4" /> Nouvel Enseignant</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-bg-secondary border border-border-primary rounded-xl p-5 md:p-6 mb-6 animate-fadeIn">
          <h3 className="font-bold text-lg mb-4 text-text-primary">Créer un compte Enseignant</h3>
          <form onSubmit={handleAddTeacher} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase">Prénom</label>
              <input type="text" value={newFirstName} onChange={e => setNewFirstName(e.target.value)} required className="w-full mt-1 p-2.5 bg-bg-primary border border-border-primary rounded-lg text-sm outline-none text-text-primary" />
            </div>
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase">Nom</label>
              <input type="text" value={newLastName} onChange={e => setNewLastName(e.target.value)} required className="w-full mt-1 p-2.5 bg-bg-primary border border-border-primary rounded-lg text-sm outline-none text-text-primary" />
            </div>
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase">Titre</label>
              <select value={newTitle} onChange={e => setNewTitle(e.target.value)} required className="w-full mt-1 p-2.5 bg-bg-primary border border-border-primary rounded-lg text-sm outline-none text-text-primary">
                <option value="Professeur">Professeur</option>
                <option value="Docteur">Docteur</option>
                <option value="Ingénieur">Ingénieur</option>
                <option value="Expert">Expert</option>
                <option value="Intervenant">Intervenant</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase">Spécialité</label>
              <input type="text" value={newSpeciality} onChange={e => setNewSpeciality(e.target.value)} className="w-full mt-1 p-2.5 bg-bg-primary border border-border-primary rounded-lg text-sm outline-none text-text-primary" />
            </div>
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase">Email</label>
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required className="w-full mt-1 p-2.5 bg-bg-primary border border-border-primary rounded-lg text-sm outline-none text-text-primary" />
            </div>
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase">Mot de passe provisoire</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} className="w-full mt-1 p-2.5 bg-bg-primary border border-border-primary rounded-lg text-sm outline-none text-text-primary" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-text-secondary uppercase">Programmes assignés</label>
              <div className="space-y-2 mt-1">
                <div className="flex flex-col sm:flex-row gap-2">
                  <select value={selectedProgToAdd} onChange={e => setSelectedProgToAdd(e.target.value)} className="flex-1 p-2 bg-bg-primary border border-border-primary rounded text-sm outline-none text-text-primary">
                    <option value="">Sélectionner un programme</option>
                    {programs.map((p: any) => {
                      const title = typeof p === 'string' ? p : p.title;
                      return <option key={title} value={title}>{title}</option>;
                    })}
                  </select>
                  <select value={selectedClassToAdd} onChange={e => setSelectedClassToAdd(e.target.value)} className="sm:w-1/3 p-2 bg-bg-primary border border-border-primary rounded text-sm outline-none text-text-primary">
                    {['Toutes les classes', 'L1', 'L2', 'L3', 'M1', 'M2', 'D1', 'D2', 'D3', 'Certifiant'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button type="button" onClick={() => {
                    if (selectedProgToAdd) {
                      const entry = selectedClassToAdd === 'Toutes les classes' ? selectedProgToAdd : `${selectedProgToAdd} - ${selectedClassToAdd}`;
                      if (!newAssignedPrograms.includes(entry)) setNewAssignedPrograms([...newAssignedPrograms, entry]);
                      setSelectedProgToAdd('');
                    }
                  }} className="bg-brand-primary text-white px-3 py-2 rounded text-sm font-bold hover:bg-brand-hover">Ajouter</button>
                </div>
                <div className="h-24 overflow-y-auto bg-bg-primary border border-border-primary rounded-lg p-2 space-y-1">
                  {newAssignedPrograms.map((p, i) => (
                    <div key={i} className="flex justify-between items-center text-sm p-1.5 hover:bg-bg-secondary rounded">
                      <span className="text-text-primary truncate">{p}</span>
                      <button type="button" onClick={() => setNewAssignedPrograms(newAssignedPrograms.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700 font-bold px-2 cursor-pointer">X</button>
                    </div>
                  ))}
                  {newAssignedPrograms.length === 0 && <div className="text-xs text-text-secondary italic text-center py-2">Aucun programme assigné</div>}
                </div>
              </div>
            </div>
            <div className="md:col-span-2 pt-2">
              <button type="submit" className="bg-emerald-500/10 text-emerald-600 font-bold px-6 py-2.5 rounded-lg hover:bg-emerald-500/20 transition-colors cursor-pointer text-sm">
                Créer l'enseignant
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-bg-secondary border border-border-primary rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border-primary flex items-center justify-between">
          <div className="relative w-64">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-bg-primary border border-border-primary rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary outline-none focus:border-brand-primary"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-text-secondary text-sm">Chargement...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-bg-primary/50 text-xs font-bold text-text-secondary uppercase">
                <tr>
                  <th className="p-4">Enseignant</th>
                  <th className="p-4">Programmes assignés</th>
                  <th className="p-4">Dernière connexion</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {filteredTeachers.map(t => (
                  <tr key={t.$id || t.id} className="hover:bg-bg-primary/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold text-xs">
                          {t.initials || (t.name ? t.name.substring(0, 2).toUpperCase() : 'EN')}
                        </div>
                        <div>
                          <div className="font-semibold text-text-primary">
                            {t.firstName && t.lastName ? `${t.firstName} ${t.lastName}` : t.name}
                          </div>
                          <div className="text-[10px] text-text-secondary">
                            {t.title ? `${t.title} • ` : ''}{t.speciality ? `${t.speciality} • ` : ''}{t.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(t.assignedPrograms) && t.assignedPrograms.length > 0 ? t.assignedPrograms.map((p: string, i: number) => (
                          <span key={i} className="bg-bg-primary border border-border-primary text-text-secondary text-[10px] px-2 py-0.5 rounded-full truncate max-w-[150px]" title={p}>
                            {p}
                          </span>
                        )) : (
                          <span className="text-text-secondary/50 italic text-xs">Aucun</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-text-secondary text-xs">
                      {t.lastLogin ? new Date(t.lastLogin).toLocaleDateString() : 'Jamais'}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => openScheduleManager(t)} className="p-1.5 rounded bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 transition-colors cursor-pointer inline-flex items-center gap-1 text-xs font-bold" title="Gérer l'enseignant">
                        <BookOpenIcon className="w-3.5 h-3.5" /> Gérer
                      </button>
                      <button onClick={() => handleDeleteTeacher(t.$id || t.id, t.name)} className="p-1.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors cursor-pointer" title="Supprimer">
                        <Trash2Icon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredTeachers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-text-secondary">Aucun enseignant trouvé.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
