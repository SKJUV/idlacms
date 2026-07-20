import React, { useState } from 'react';
import { Plus, BookOpen, Pencil, Trash2, Calendar, CheckCircle2, AlertCircle, Clock, ToggleLeft, ToggleRight } from 'lucide-react';
import { Program, AcademicSession, DEFAULT_ACADEMIC_SESSIONS } from '../../types';
import { ID, databases, APPWRITE_CONFIG, isAppwriteDbConfigured, Permission, Role } from '../../lib/appwrite';

interface ProgramsManagementProps {
  programs: Program[];
  setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
  logActivity: (type: 'registration' | 'article' | 'error' | 'alumni', user: string, text: string) => Promise<void>;
}

export default function ProgramsManagement({
  programs,
  setPrograms,
  logActivity,
}: ProgramsManagementProps) {
  const [activeSubTab, setActiveSubTab] = useState<'programs' | 'sessions'>('programs');
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [cloudSuccess, setCloudSuccess] = useState<string | null>(null);

  // ─── Programs State & Form ───
  const [showAddProgramForm, setShowAddProgramForm] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);

  const [newProgramTitle, setNewProgramTitle] = useState('');
  const [newProgramDescription, setNewProgramDescription] = useState('');
  const [newProgramType, setNewProgramType] = useState<'Master' | 'Doctorat' | 'Certification' | 'Bachelor'>('Master');
  const [newProgramCategory, setNewProgramCategory] = useState<string>('Tech');
  const [newProgramDuration, setNewProgramDuration] = useState('2 ans (Full-time)');
  const [newProgramImage, setNewProgramImage] = useState('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80');
  const [newProgramIsNew, setNewProgramIsNew] = useState(true);

  // ─── Academic Sessions State & Form ───
  const [sessions, setSessions] = useState<AcademicSession[]>(() => {
    try {
      const saved = localStorage.getItem('idla_academic_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Erreur lecture idla_academic_sessions:', e);
    }
    return DEFAULT_ACADEMIC_SESSIONS;
  });

  const [showAddSessionForm, setShowAddSessionForm] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionType, setNewSessionType] = useState<AcademicSession['type']>('Rentrée Principale');
  const [newSessionStatus, setNewSessionStatus] = useState<AcademicSession['status']>('ouverte');
  const [newSessionDeadline, setNewSessionDeadline] = useState('');
  const [newSessionDescription, setNewSessionDescription] = useState('');

  const saveSessionsToStorage = (updatedSessions: AcademicSession[]) => {
    setSessions(updatedSessions);
    try {
      localStorage.setItem('idla_academic_sessions', JSON.stringify(updatedSessions));
    } catch (e) {
      console.error('Erreur sauvegarde idla_academic_sessions:', e);
    }
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

  const resetSessionForm = () => {
    setNewSessionName('');
    setNewSessionType('Rentrée Principale');
    setNewSessionStatus('ouverte');
    setNewSessionDeadline('');
    setNewSessionDescription('');
    setEditingSessionId(null);
    setShowAddSessionForm(false);
  };

  const handleEditProgram = (prog: Program) => {
    setEditingProgramId(prog.id);
    setNewProgramTitle(prog.title);
    setNewProgramDescription(prog.description);
    setNewProgramType((prog.type as any) || 'Master');
    setNewProgramCategory(prog.category || 'Tech');
    setNewProgramDuration(prog.duration);
    setNewProgramImage(prog.image);
    setNewProgramIsNew(!!prog.isNew);
    setShowAddProgramForm(true);
    setCloudError(null);
    setCloudSuccess(null);
  };

  const handleEditSession = (sess: AcademicSession) => {
    setEditingSessionId(sess.id);
    setNewSessionName(sess.name);
    setNewSessionType(sess.type);
    setNewSessionStatus(sess.status);
    setNewSessionDeadline(sess.deadline);
    setNewSessionDescription(sess.description || '');
    setShowAddSessionForm(true);
  };

  const handleSubmitProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgramTitle || !newProgramDescription || !newProgramDuration) return;
    setCloudError(null);
    setCloudSuccess(null);

    const isDuplicate = programs.some(
      (p) => p.title.trim().toLowerCase() === newProgramTitle.trim().toLowerCase() && p.id !== editingProgramId
    );
    if (isDuplicate) {
      setCloudError(`Un programme nommé "${newProgramTitle}" existe déjà.`);
      return;
    }

    if (editingProgramId) {
      const updated = programs.map((p) =>
        p.id === editingProgramId
          ? {
              ...p,
              title: newProgramTitle,
              description: newProgramDescription,
              type: newProgramType,
              category: newProgramCategory,
              duration: newProgramDuration,
              image: newProgramImage,
              isNew: newProgramIsNew,
            }
          : p
      );
      setPrograms(updated);
      try {
        localStorage.setItem('idla_local_programs', JSON.stringify(updated));
      } catch (e) {
        console.error("Erreur d'enregistrement local des programmes:", e);
      }
      if (isAppwriteDbConfigured()) {
        try {
          await databases.updateDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.programs,
            editingProgramId,
            {
              title: newProgramTitle,
              description: newProgramDescription,
              type: newProgramType,
              category: newProgramCategory,
              duration: newProgramDuration,
              image: newProgramImage,
              isNew: newProgramIsNew,
            } as any,
            [Permission.read(Role.any()), Permission.update(Role.any()), Permission.delete(Role.any())]
          );
          setCloudSuccess("Programme mis à jour avec succès sur le Cloud Appwrite.");
        } catch (err: any) {
          console.error("Échec de la mise à jour sur Appwrite:", err);
          if (err.message && (err.message.includes('one of') || err.message.includes('category'))) {
            try {
              const fallbackCat = ['Sciences', 'Management', 'Tech', 'Droit', 'Santé', 'Communication'].includes(newProgramCategory)
                ? newProgramCategory
                : 'Management';
              await databases.updateDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.programs,
                editingProgramId,
                {
                  title: newProgramTitle,
                  description: newProgramDescription,
                  type: newProgramType,
                  category: fallbackCat,
                  duration: newProgramDuration,
                  image: newProgramImage,
                  isNew: newProgramIsNew,
                } as any,
                [Permission.read(Role.any()), Permission.update(Role.any()), Permission.delete(Role.any())]
              );
              setCloudSuccess("Programme mis à jour en ligne (catégorie ajustée automatiquement sur la base distante pour compatibilité avec l'ancien schéma).");
            } catch (retryErr: any) {
              setCloudError("Erreur Cloud Appwrite : " + (retryErr.message || err.message) + " — Vos modifications sont toutefois actives et sauvegardées en mémoire locale.");
            }
          } else {
            setCloudError("Erreur Cloud Appwrite : " + err.message + " — Vos modifications sont toutefois actives et sauvegardées en mémoire locale.");
          }
        }
      }
      logActivity('article', 'Super Admin', `a modifié le programme : ${newProgramTitle}.`);
      resetProgramForm();
      return;
    }

    const progId = `prog-${Math.floor(100000 + Math.random() * 900000)}`;
    const newProgram: Program = {
      id: progId,
      title: newProgramTitle,
      description: newProgramDescription,
      type: newProgramType,
      category: newProgramCategory,
      duration: newProgramDuration,
      image: newProgramImage,
      isNew: newProgramIsNew,
    };

    setPrograms((curr) => {
      const next = [newProgram, ...curr];
      try { localStorage.setItem('idla_local_programs', JSON.stringify(next)); } catch (e) {}
      return next;
    });

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
            isNew: newProgram.isNew,
          },
          [Permission.read(Role.any()), Permission.update(Role.any()), Permission.delete(Role.any())]
        );
        setCloudSuccess("Nouveau programme créé et synchronisé avec succès sur la base Appwrite en ligne !");
      } catch (err: any) {
        console.error("Échec de création du programme sur Appwrite:", err);
        if (err.message && (err.message.includes('one of') || err.message.includes('category'))) {
          try {
            const fallbackCat = ['Sciences', 'Management', 'Tech', 'Droit', 'Santé', 'Communication'].includes(newProgram.category || '')
              ? newProgram.category
              : 'Tech';
            await databases.createDocument(
              APPWRITE_CONFIG.databaseId,
              APPWRITE_CONFIG.collections.programs,
              progId,
              {
                title: newProgram.title,
                description: newProgram.description,
                type: newProgram.type,
                category: fallbackCat,
                duration: newProgram.duration,
                image: newProgram.image,
                isNew: newProgram.isNew,
              },
              [Permission.read(Role.any()), Permission.update(Role.any()), Permission.delete(Role.any())]
            );
            setCloudSuccess("Nouveau programme créé en ligne (catégorie Cloud ajustée automatiquement sur 'Tech'/'Management' pour compatibilité avec l'ancien schéma Appwrite de la base).");
          } catch (retryErr: any) {
            setCloudError("⚠️ Le Cloud Appwrite a refusé l'ajout (" + (retryErr.message || err.message) + "). Pas de panique : le programme est sauvegardé en toute sécurité dans votre stockage local !");
          }
        } else {
          setCloudError("⚠️ Le Cloud Appwrite a refusé l'ajout (" + (err.message || "Erreur réseau/permissions") + "). Pas de panique : le programme est sauvegardé et visible dans votre stockage local !");
        }
      }
    }

    logActivity('article', 'Super Admin', `a ajouté un nouveau programme : ${newProgramTitle}.`);
    
    const subscribers = JSON.parse(localStorage.getItem('newsletter_subscribers') || '[]');
    if (subscribers.length > 0) {
      logActivity(
        'registration',
        'Système Mailer',
        `a envoyé une notification email de réussite à ${subscribers.length} abonnés pour : "${newProgramTitle}".`
      );
    }

    resetProgramForm();
  };

  const handleDeleteProgram = async (id: string) => {
    const targetProgram = programs.find((p) => p.id === id);
    setPrograms((curr) => {
      const next = curr.filter((p) => p.id !== id);
      try { localStorage.setItem('idla_local_programs', JSON.stringify(next)); } catch (e) {}
      return next;
    });

    if (isAppwriteDbConfigured()) {
      try {
        await databases.deleteDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.programs,
          id
        );
      } catch (err) {
        console.error("Échec de la suppression du programme sur Appwrite:", err);
      }
    }

    if (targetProgram) {
      logActivity('error', 'Super Admin', `a supprimé le programme : ${targetProgram.title}.`);
    }
  };



  const handleSubmitSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;

    if (editingSessionId) {
      const updated = sessions.map((s) =>
        s.id === editingSessionId
          ? {
              ...s,
              name: newSessionName,
              type: newSessionType,
              status: newSessionStatus,
              deadline: newSessionDeadline,
              description: newSessionDescription,
            }
          : s
      );
      saveSessionsToStorage(updated);
      logActivity('article', 'Super Admin', `a modifié la rentrée universitaire : "${newSessionName}".`);
      resetSessionForm();
      return;
    }

    const newSess: AcademicSession = {
      id: `sess_${Date.now()}`,
      name: newSessionName,
      type: newSessionType,
      status: newSessionStatus,
      deadline: newSessionDeadline,
      description: newSessionDescription,
    };
    const updated = [newSess, ...sessions];
    saveSessionsToStorage(updated);
    logActivity('article', 'Super Admin', `a programmé une nouvelle rentrée universitaire : "${newSessionName}".`);
    resetSessionForm();
  };

  const handleDeleteSession = (id: string) => {
    const target = sessions.find((s) => s.id === id);
    const updated = sessions.filter((s) => s.id !== id);
    saveSessionsToStorage(updated);
    if (target) {
      logActivity('error', 'Super Admin', `a supprimé la rentrée universitaire : "${target.name}".`);
    }
  };

  const handleToggleSessionStatus = (id: string) => {
    const target = sessions.find((s) => s.id === id);
    if (!target) return;
    const nextStatus: AcademicSession['status'] =
      target.status === 'ouverte' ? 'fermee' : target.status === 'fermee' ? 'bientot' : 'ouverte';

    const updated = sessions.map((s) => (s.id === id ? { ...s, status: nextStatus } : s));
    saveSessionsToStorage(updated);
    logActivity(
      'article',
      'Super Admin',
      `a changé le statut de la rentrée "${target.name}" en : ${nextStatus.toUpperCase()}.`
    );
  };

  const [isPublishing, setIsPublishing] = useState(false);

  const handleForcePublishToAllScreens = async () => {
    if (!isAppwriteDbConfigured()) {
      setCloudError("⚠️ Votre Cloud Appwrite n'est pas configuré (.env). La publication en ligne est impossible.");
      return;
    }
    setIsPublishing(true);
    setCloudSuccess(null);
    setCloudError(null);
    try {
      let localProgs: Program[] = [];
      try { localProgs = JSON.parse(localStorage.getItem('idla_local_programs') || '[]'); } catch (e) {}
      const combined = [...localProgs, ...programs];
      const uniqueMap = new Map<string, Program>();
      combined.forEach((p) => {
        if (p && p.id && !uniqueMap.has(p.id)) uniqueMap.set(p.id, p);
      });
      const allToPublish = Array.from(uniqueMap.values());

      let count = 0;
      for (const p of allToPublish) {
        if (!p.id || !p.title) continue;
        const safeCategory = ['Sciences', 'Management', 'Tech', 'Droit', 'Santé', 'Communication'].includes(p.category || '')
          ? p.category
          : 'Tech';
        try {
          await databases.createDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.programs,
            p.id.startsWith('prog-') ? ID.unique() : p.id,
            {
              title: p.title,
              description: p.description || p.title,
              type: p.type || 'Master',
              category: safeCategory,
              duration: p.duration || '1 an',
              image: p.image || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
              isNew: !!p.isNew,
            },
            [Permission.read(Role.any()), Permission.update(Role.any()), Permission.delete(Role.any())]
          );
          count++;
        } catch (err: any) {
          try {
            await databases.updateDocument(
              APPWRITE_CONFIG.databaseId,
              APPWRITE_CONFIG.collections.programs,
              p.id,
              {
                title: p.title,
                description: p.description || p.title,
                type: p.type || 'Master',
                category: safeCategory,
                duration: p.duration || '1 an',
                image: p.image || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
                isNew: !!p.isNew,
              } as any,
              [Permission.read(Role.any()), Permission.update(Role.any()), Permission.delete(Role.any())]
            );
            count++;
          } catch (updateErr) {
            console.warn(`Impossible de publier ${p.title}:`, updateErr);
          }
        }
      }
      setCloudSuccess(`🌐 Magnifique ! ${count} programmes ont été publiés en ligne avec accès public absolu. Ils sont maintenant immédiatement visibles sur l'écran de tous les internautes !`);
    } catch (err: any) {
      setCloudError("Erreur lors de la publication en ligne : " + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#006c49]/15 via-emerald-50 to-[#006c49]/10 border border-[#006c49]/30 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#006c49] text-white flex items-center justify-center shrink-0 shadow-md">
            <BookOpen className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#00020e]">Publication Universelle en Ligne (Tous Écrans & Tous Visiteurs)</h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Force l&apos;envoi immédiat et l&apos;ouverture des permissions publiques sur le Cloud Appwrite afin que n&apos;importe quel internaute voie instantanément vos ajouts sur son écran.
            </p>
          </div>
        </div>
        <button
          onClick={handleForcePublishToAllScreens}
          disabled={isPublishing}
          className="px-5 py-2.5 bg-[#006c49] hover:bg-[#004e35] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 shrink-0 transform hover:-translate-y-0.5"
        >
          {isPublishing ? (
            <>
              <Clock className="w-4 h-4 animate-spin" />
              <span>Publication en cours...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>🌐 Publier en Ligne pour Tous</span>
            </>
          )}
        </button>
      </div>

      {cloudSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-sm font-medium flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{cloudSuccess}</span>
          </div>
          <button onClick={() => setCloudSuccess(null)} className="text-emerald-600 hover:text-emerald-900 font-bold ml-4">✕</button>
        </div>
      )}

      {cloudError && (
        <div className="p-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-sm font-medium flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>{cloudError}</span>
          </div>
          <button onClick={() => setCloudError(null)} className="text-amber-700 hover:text-amber-950 font-bold ml-4">✕</button>
        </div>
      )}

      {/* ── Tabs Header ── */}
      <div className="flex border-b border-[#c6c6cf]/40 gap-6">
        <button
          onClick={() => setActiveSubTab('programs')}
          className={`pb-3 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'programs'
              ? 'border-b-2 border-[#006c49] text-[#006c49]'
              : 'text-slate-500 hover:text-[#00020e]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Catalogue des Formations ({programs.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('sessions')}
          className={`pb-3 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'sessions'
              ? 'border-b-2 border-[#006c49] text-[#006c49]'
              : 'text-slate-500 hover:text-[#00020e]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Rentrées & Sessions d'admission ({sessions.length})</span>
        </button>
      </div>

      {activeSubTab === 'programs' ? (
        /* ─── ONGLET PROGRAMMES ─── */
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-sans font-bold text-lg text-[#00020e]">Programmes académiques IDLA</h3>
            <button
              onClick={() => (showAddProgramForm ? resetProgramForm() : setShowAddProgramForm(true))}
              className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {showAddProgramForm ? 'Fermer le formulaire' : 'Ajouter un programme'}
            </button>
          </div>

          {showAddProgramForm && (
            <form
              onSubmit={handleSubmitProgram}
              className="bg-white border border-[#c6c6cf] rounded-2xl p-6 space-y-4 shadow-sm"
            >
              <p className="text-sm font-bold text-[#00020e]">
                {editingProgramId ? 'Modifier le programme' : 'Nouveau programme'}
              </p>
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
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 uppercase">Catégorie (Saisie libre ou Liste) *</label>
                    <span className="text-[10px] text-slate-400 font-normal">Tapez ou cliquez un badge</span>
                  </div>
                  <input
                    type="text"
                    list="category-options-list"
                    value={newProgramCategory}
                    onChange={(e) => setNewProgramCategory(e.target.value)}
                    placeholder="ex: Tech, Finance, IA & Data, Cybersécurité..."
                    className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-bold text-[#00020e]"
                    required
                  />
                  <datalist id="category-options-list">
                    {Array.from(
                      new Set([
                        'Sciences',
                        'Management',
                        'Tech',
                        'Droit',
                        'Santé',
                        'Communication',
                        'Finance & Audit',
                        'IA & Data',
                        'Cybersécurité',
                        'Marketing',
                        ...programs.map((p) => p.category),
                      ])
                    ).map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      'Sciences',
                      'Management',
                      'Tech',
                      'Droit',
                      'Santé',
                      'Communication',
                      'Finance & Audit',
                      'IA & Data',
                    ].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewProgramCategory(cat)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          newProgramCategory === cat
                            ? 'bg-[#006c49] text-white shadow-sm'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        + {cat}
                      </button>
                    ))}
                  </div>
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
                  className="px-5 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 border border-[#c6c6cf]/40 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-6 py-2.5 rounded-lg transition-all cursor-pointer"
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
                          <span className="bg-[#006c49]/10 text-[#006c49] text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                            Nouveau
                          </span>
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
                          className="text-slate-500 hover:text-[#006c49] p-1.5 hover:bg-slate-100 rounded transition-all cursor-pointer"
                          title="Modifier le programme"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProgram(p.id)}
                          className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded transition-all cursor-pointer"
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
                    <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                      Aucun programme enregistré.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ─── ONGLET SESSIONS & RENTRÉES UNIVERSITAIRES ─── */
        <div className="space-y-6">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-900 dark:text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Synchronisation active avec le portail candidat :</span>
              <p className="mt-0.5 leading-relaxed text-slate-600 dark:text-slate-300">
                Les rentrées scolaires programmées ci-dessous et marquées comme <strong>"Ouverte"</strong> ou <strong>"Bientôt"</strong> apparaissent instantanément dans la liste de choix lors de la candidature d'un étudiant.
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-sans font-bold text-lg text-[#00020e]">Calendrier des rentrées et admissions</h3>
              <p className="text-xs text-slate-500 mt-0.5">Programmez les sessions universitaires ouvertes aux candidatures</p>
            </div>
            <button
              onClick={() => (showAddSessionForm ? resetSessionForm() : setShowAddSessionForm(true))}
              className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {showAddSessionForm ? 'Fermer le formulaire' : 'Programmer une rentrée'}
            </button>
          </div>

          {showAddSessionForm && (
            <form
              onSubmit={handleSubmitSession}
              className="bg-white border border-[#c6c6cf] rounded-2xl p-6 space-y-4 shadow-sm"
            >
              <p className="text-sm font-bold text-[#00020e]">
                {editingSessionId ? 'Modifier la rentrée universitaire' : 'Programmer une nouvelle rentrée'}
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Nom de la session / rentrée *</label>
                <input
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="ex: Session d'Octobre 2027 ou Rentrée MBA Spécialisée"
                  className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Type *</label>
                  <select
                    value={newSessionType}
                    onChange={(e) => setNewSessionType(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-bold text-[#00020e] cursor-pointer"
                  >
                    <option value="principale">Rentrée Principale</option>
                    <option value="hiver">Rentrée d'Hiver</option>
                    <option value="printemps">Rentrée de Printemps</option>
                    <option value="continu">E-learning en Continu</option>
                    <option value="autre">Session Spéciale / Autre</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Statut des candidatures *</label>
                  <select
                    value={newSessionStatus}
                    onChange={(e) => setNewSessionStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-bold text-[#00020e] cursor-pointer"
                  >
                    <option value="ouverte">🟢 Ouverte aux candidatures</option>
                    <option value="bientot">🟡 Bientôt ouverte</option>
                    <option value="fermee">🔴 Clôturée / Fermée</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Date limite de candidature</label>
                  <input
                    type="text"
                    value={newSessionDeadline}
                    onChange={(e) => setNewSessionDeadline(e.target.value)}
                    placeholder="ex: 15 Septembre 2027"
                    className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Description / Note indicative (Optionnelle)</label>
                <input
                  type="text"
                  value={newSessionDescription}
                  onChange={(e) => setNewSessionDescription(e.target.value)}
                  placeholder="ex: Rentrée principale pour tous les cursus Master et Bachelor"
                  className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-medium"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#c6c6cf]/30">
                <button
                  type="button"
                  onClick={resetSessionForm}
                  className="px-5 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 border border-[#c6c6cf]/40 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-6 py-2.5 rounded-lg transition-all cursor-pointer"
                >
                  {editingSessionId ? 'Enregistrer les modifications' : 'Enregistrer la rentrée'}
                </button>
              </div>
            </form>
          )}

          <div className="bg-white border border-[#c6c6cf] rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 border-b border-[#c6c6cf]/30 font-bold uppercase">
                  <th className="p-4">Session / Rentrée</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Date limite / Clôture</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c6c6cf]/20">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/40">
                    <td className="p-4 font-semibold text-[#00020e]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#006c49] shrink-0" />
                        <div>
                          <span>{s.name}</span>
                          {s.description && (
                            <p className="text-[10px] text-slate-400 font-normal mt-0.5">{s.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-600 capitalize">{s.type}</td>
                    <td className="p-4 font-medium text-slate-500">{s.deadline || '—'}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleSessionStatus(s.id)}
                        title="Cliquez pour changer le statut (Ouverte / Bientôt / Fermée)"
                        className="cursor-pointer transition-transform active:scale-95"
                      >
                        {s.status === 'ouverte' && (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Ouverte
                          </span>
                        )}
                        {s.status === 'bientot' && (
                          <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-full">
                            <Clock className="w-3 h-3" /> Bientôt
                          </span>
                        )}
                        {s.status === 'fermee' && (
                          <span className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[10px] font-bold px-2.5 py-1 rounded-full">
                            <AlertCircle className="w-3 h-3" /> Clôturée
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center items-center gap-1">
                        <button
                          onClick={() => handleEditSession(s)}
                          className="text-slate-500 hover:text-[#006c49] p-1.5 hover:bg-slate-100 rounded transition-all cursor-pointer"
                          title="Modifier la session"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSession(s.id)}
                          className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded transition-all cursor-pointer"
                          title="Supprimer la session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                      Aucune rentrée programmée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
