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
  SaveIcon
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
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newAssignedPrograms, setNewAssignedPrograms] = useState<string[]>([]);
  
  // Schedule Manager State
  const [editingSchedule, setEditingSchedule] = useState<any | null>(null);
  const [editingAssignedPrograms, setEditingAssignedPrograms] = useState<string[]>([]);
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [newSlot, setNewSlot] = useState({ day: 'Lundi', startTime: '08:00', endTime: '10:00', course: '', program: '' });

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    setLoading(true);
    try {
      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.cmsUsers) {
        const res = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.cmsUsers,
          [Query.equal('role', 'teacher')]
        );
        setTeachers(res.documents);
      }
    } catch (err) {
      console.warn("Erreur chargement enseignants:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Create Appwrite Account
      const userId = ID.unique();
      await account.create(userId, newEmail, newPassword, newName);
      
      // 2. Create in cmsUsers
      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.cmsUsers) {
        const doc = await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.cmsUsers,
          userId,
          {
            name: newName,
            email: newEmail,
            role: 'teacher',
            assignedPrograms: newAssignedPrograms,
            scheduleData: '[]',
            initials: newName.substring(0, 2).toUpperCase()
          }
        );
        setTeachers([doc, ...teachers]);
      }
      logActivity('registration', 'Admin', `a créé l'enseignant ${newName}`);
      setIsAdding(false);
      setNewName(''); setNewEmail(''); setNewPassword(''); setNewAssignedPrograms([]);
    } catch (err: any) {
      alert("Erreur: " + err.message);
    }
  };

  const handleDeleteTeacher = async (id: string, name: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer l'enseignant ${name} ?`)) return;
    try {
      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.cmsUsers) {
        await databases.deleteDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.cmsUsers, id);
      }
      setTeachers(teachers.filter(t => t.$id !== id && t.id !== id));
      logActivity('error', 'Admin', `a supprimé l'enseignant ${name}`);
    } catch (err: any) {
      alert("Erreur: " + err.message);
    }
  };

  const openScheduleManager = (teacher: any) => {
    setEditingSchedule(teacher);
    setEditingAssignedPrograms(teacher.assignedPrograms || []);
    try {
      setScheduleData(teacher.scheduleData ? JSON.parse(teacher.scheduleData) : []);
    } catch {
      setScheduleData([]);
    }
  };

  const handleAddSlot = () => {
    if (!newSlot.course || !newSlot.program) return;
    setScheduleData([...scheduleData, { ...newSlot }]);
    setNewSlot({ day: 'Lundi', startTime: '08:00', endTime: '10:00', course: '', program: '' });
  };

  const handleRemoveSlot = (index: number) => {
    setScheduleData(scheduleData.filter((_, i) => i !== index));
  };

  const saveSchedule = async () => {
    if (!editingSchedule) return;
    try {
      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.cmsUsers) {
        const idToUpdate = editingSchedule.$id || editingSchedule.id;
        const updatedDoc = await databases.updateDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.cmsUsers,
          idToUpdate,
          {
            scheduleData: JSON.stringify(scheduleData),
            assignedPrograms: editingAssignedPrograms
          }
        );
        setTeachers(teachers.map(t => (t.$id === idToUpdate || t.id === idToUpdate) ? updatedDoc : t));
        logActivity('article', 'Admin', `a mis à jour le profil de l'enseignant ${editingSchedule.name}`);
        setEditingSchedule(null);
        setEditingAssignedPrograms([]);
      }
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
          <button onClick={saveSchedule} className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-hover cursor-pointer">
            <SaveIcon className="w-4 h-4" /> Enregistrer
          </button>
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
                <label className="text-[10px] font-bold text-text-secondary uppercase">Programme</label>
                <select value={newSlot.program} onChange={(e) => setNewSlot({...newSlot, program: e.target.value})} className="w-full mt-1 p-2 bg-bg-primary border border-border-primary rounded text-sm outline-none text-text-primary">
                  <option value="">Sélectionner</option>
                  {editingAssignedPrograms.map((p: string) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase">Matière / Cours</label>
                <input type="text" value={newSlot.course} onChange={(e) => setNewSlot({...newSlot, course: e.target.value})} placeholder="Ex: Algèbre linéaire" className="w-full mt-1 p-2 bg-bg-primary border border-border-primary rounded text-sm outline-none text-text-primary" />
              </div>
              <button onClick={handleAddSlot} disabled={!newSlot.course || !newSlot.program} className="w-full mt-2 bg-emerald-500/10 text-emerald-600 font-bold py-2 rounded hover:bg-emerald-500/20 disabled:opacity-50 transition-colors cursor-pointer text-sm">
                Ajouter au planning
              </button>
            </div>
          </div>
            
            <div className="bg-bg-secondary border border-border-primary rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-sm text-text-primary uppercase">Programmes assignés</h3>
              <div className="mt-1 h-48 overflow-y-auto bg-bg-primary border border-border-primary rounded-lg p-2 space-y-1">
                {programs.map((p: any) => (
                  <label key={p.id || p.title} className="flex items-center gap-2 p-1 hover:bg-bg-secondary rounded cursor-pointer text-sm text-text-primary">
                    <input 
                      type="checkbox" 
                      checked={editingAssignedPrograms.includes(p.title)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditingAssignedPrograms([...editingAssignedPrograms, p.title]);
                        } else {
                          setEditingAssignedPrograms(editingAssignedPrograms.filter(prog => prog !== p.title));
                        }
                      }}
                      className="rounded border-border-primary text-brand-primary focus:ring-brand-primary"
                    />
                    <span className="truncate" title={p.title}>{p.title}</span>
                  </label>
                ))}
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
              <label className="text-xs font-bold text-text-secondary uppercase">Nom complet</label>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)} required className="w-full mt-1 p-2.5 bg-bg-primary border border-border-primary rounded-lg text-sm outline-none text-text-primary" />
            </div>
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase">Email</label>
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required className="w-full mt-1 p-2.5 bg-bg-primary border border-border-primary rounded-lg text-sm outline-none text-text-primary" />
            </div>
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase">Mot de passe provisoire</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} className="w-full mt-1 p-2.5 bg-bg-primary border border-border-primary rounded-lg text-sm outline-none text-text-primary" />
            </div>
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase">Programmes assignés</label>
              <div className="mt-1 h-32 overflow-y-auto bg-bg-primary border border-border-primary rounded-lg p-2 space-y-1">
                {programs.map((p: any) => (
                  <label key={p.id || p.title} className="flex items-center gap-2 p-1 hover:bg-bg-secondary rounded cursor-pointer text-sm text-text-primary">
                    <input 
                      type="checkbox" 
                      checked={newAssignedPrograms.includes(p.title)}
                      onChange={(e) => {
                        if (e.target.checked) setNewAssignedPrograms([...newAssignedPrograms, p.title]);
                        else setNewAssignedPrograms(newAssignedPrograms.filter(title => title !== p.title));
                      }}
                      className="accent-brand-primary"
                    />
                    <span className="truncate">{p.title}</span>
                  </label>
                ))}
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
                          <div className="font-semibold text-text-primary">{t.name}</div>
                          <div className="text-[10px] text-text-secondary">{t.email}</div>
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
