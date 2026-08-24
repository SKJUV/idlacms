import React, { useState } from 'react';
import { Plus, BookOpen, Pencil, Trash2, Calendar, CheckCircle2, AlertCircle, Clock, ArrowLeft, Link as LinkIcon, Check } from 'lucide-react';
import { Program, AcademicSession, DEFAULT_ACADEMIC_SESSIONS, DEFAULT_PROGRAM_DURATIONS } from '../../types';
import { ID, Query, databases, APPWRITE_CONFIG, isAppwriteDbConfigured, Permission, Role } from '../../lib/appwrite';
import ProgramFilterBar, { FilterState, INITIAL_FILTER_STATE, applyProgramFilters } from '../ProgramFilterBar';

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
  const [copySuccessId, setCopySuccessId] = useState<string | null>(null);

  // ─── Programs State, Filters & Form ───
  const [showAddProgramForm, setShowAddProgramForm] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);

  const [adminFilters, setAdminFilters] = useState<FilterState>(INITIAL_FILTER_STATE);

  const filteredAdminPrograms = React.useMemo(() => {
    return applyProgramFilters(programs, adminFilters);
  }, [programs, adminFilters]);

  const [newProgramTitle, setNewProgramTitle] = useState('');
  const [newProgramDescription, setNewProgramDescription] = useState('');
  const [newProgramType, setNewProgramType] = useState<'Master' | 'Doctorat' | 'Certification' | 'Bachelor'>('Master');
  const [newProgramCategory, setNewProgramCategory] = useState<string>('Tech');
  const [newProgramDuration, setNewProgramDuration] = useState(DEFAULT_PROGRAM_DURATIONS['Master']);
  const [newProgramProcedures, setNewProgramProcedures] = useState('');
  const [newProgramImage, setNewProgramImage] = useState('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80');
  const [newProgramPrice, setNewProgramPrice] = useState('');
  const [newProgramIsNew, setNewProgramIsNew] = useState(true);

  const handleProgramTypeChange = (type: 'Master' | 'Doctorat' | 'Certification' | 'Bachelor') => {
    setNewProgramType(type);
    setNewProgramDuration(DEFAULT_PROGRAM_DURATIONS[type] || '3 ans');
  };

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
  const [newSessionType, setNewSessionType] = useState<AcademicSession['type']>('principale');
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
    setNewProgramDuration(DEFAULT_PROGRAM_DURATIONS['Master']);
    setNewProgramProcedures('');
    setNewProgramImage('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80');
    setNewProgramPrice('');
    setNewProgramIsNew(true);
    setEditingProgramId(null);
    setShowAddProgramForm(false);
  };

  const resetSessionForm = () => {
    setNewSessionName('');
    setNewSessionType('principale');
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
    setNewProgramDuration(prog.duration || DEFAULT_PROGRAM_DURATIONS[(prog.type as any) || 'Master']);
    setNewProgramProcedures(prog.procedures || '');
    setNewProgramImage(prog.image);
    setNewProgramPrice(prog.price || '');
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

    // Vérification doublon : exclure le programme en cours d'édition par son ID ET son titre actuel
    const currentProg = programs.find((p) => p.id === editingProgramId);
    const isDuplicate = programs.some(
      (p) =>
        p.title.trim().toLowerCase() === newProgramTitle.trim().toLowerCase() &&
        p.id !== editingProgramId &&
        p.title.trim().toLowerCase() !== (currentProg?.title.trim().toLowerCase() ?? '')
    );
    if (isDuplicate) {
      setCloudError(`Un programme nommé "${newProgramTitle}" existe déjà.`);
      return;
    }

    if (editingProgramId) {
      const updatedData = {
        title: newProgramTitle,
        description: newProgramDescription,
        type: newProgramType,
        category: newProgramCategory,
        duration: newProgramDuration,
        price: newProgramPrice,
        procedures: newProgramProcedures,
        image: newProgramImage,
        isNew: newProgramIsNew,
      };

      // Mise à jour en mémoire et localStorage
      const updated = programs.map((p) =>
        p.id === editingProgramId ? { ...p, ...updatedData } : p
      );
      setPrograms(updated);
      try {
        localStorage.setItem('idla_local_programs', JSON.stringify(updated));
      } catch (e) {
        console.error("Erreur d'enregistrement local des programmes:", e);
      }

      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.programs) {
        const safeCategory = ['Sciences', 'Management', 'Tech', 'Droit', 'Santé', 'Communication'].includes(newProgramCategory)
          ? newProgramCategory
          : 'Tech';

        const tryUpdate = async (cat: string) => {
          await databases.updateDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.programs,
            editingProgramId,
            { ...updatedData, category: cat } as any,
            [Permission.read(Role.any()), Permission.update(Role.team('admins')), Permission.delete(Role.team('admins'))]
          );
        };

        const tryCreate = async (cat: string) => {
          await databases.createDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.programs,
            editingProgramId,
            { ...updatedData, category: cat } as any,
            [Permission.read(Role.any()), Permission.update(Role.team('admins')), Permission.delete(Role.team('admins'))]
          );
        };

        try {
          await tryUpdate(newProgramCategory);
          setCloudSuccess('Programme mis à jour avec succès sur la base de données en ligne.');
        } catch (updateErr: any) {
          console.warn('updateDocument échoué, tentative createDocument:', updateErr);
          if (updateErr.code === 404 || updateErr.type === 'document_not_found') {
            try {
              await tryCreate(safeCategory);
              setCloudSuccess('Programme publié en ligne avec succès.');
            } catch (createErr: any) {
              setCloudError('Modifications sauvegardées localement. Erreur Cloud : ' + (createErr.message || 'inconnue'));
            }
          } else if (updateErr.message && (updateErr.message.includes('one of') || updateErr.message.includes('category'))) {
            try {
              await tryUpdate(safeCategory);
              setCloudSuccess('Programme mis à jour (catégorie ajustée pour compatibilité Cloud).');
            } catch (retryErr: any) {
              setCloudError('Modifications locales OK. Erreur schéma Cloud : ' + (retryErr.message || updateErr.message));
            }
          } else {
            setCloudError('Modifications sauvegardées localement. Erreur Cloud : ' + (updateErr.message || 'inconnue'));
          }
        }
      } else {
        setCloudSuccess('Programme modifié et sauvegardé localement.');
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
      price: newProgramPrice,
      procedures: newProgramProcedures,
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
            price: newProgram.price,
            image: newProgram.image,
            isNew: newProgram.isNew,
          },
          [Permission.read(Role.any()), Permission.update(Role.team('admins')), Permission.delete(Role.team('admins'))]
        );
        setCloudSuccess("Nouveau programme créé et synchronisé avec succès en ligne !");
      } catch (err: any) {
        console.error("Échec de création du programme:", err);
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
                price: newProgram.price,
                image: newProgram.image,
                isNew: newProgram.isNew,
              },
              [Permission.read(Role.any()), Permission.update(Role.team('admins')), Permission.delete(Role.team('admins'))]
            );
            setCloudSuccess("Nouveau programme créé et synchronisé avec succès en ligne !");
          } catch (retryErr: any) {
            setCloudError("Le serveur distant a refusé l'ajout (" + (retryErr.message || err.message) + "). Pas de panique : le programme est sauvegardé en toute sécurité dans votre stockage local !");
          }
        } else {
          setCloudError("Le serveur distant a refusé l'ajout (" + (err.message || "Erreur réseau/permissions") + "). Pas de panique : le programme est sauvegardé et visible dans votre stockage local !");
        }
      }
    }

    logActivity('article', 'Super Admin', `a ajouté un nouveau programme : ${newProgramTitle}.`);
    resetProgramForm();
  };

  const handleDeleteProgram = async (id: string) => {
    const targetProgram = programs.find((p) => p.id === id);

    // 1. Supprimer immédiatement en mémoire + localStorage
    setPrograms((curr) => {
      const next = curr.filter((p) => p.id !== id);
      try { localStorage.setItem('idla_local_programs', JSON.stringify(next)); } catch (e) {}
      return next;
    });

    // 2. Supprimer sur Appwrite avec fallback par titre si ID mismatch
    if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.programs) {
      let deleted = false;

      // Tentative 1 : suppression directe par ID
      try {
        await databases.deleteDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.programs,
          id
        );
        deleted = true;
        setCloudSuccess(`Programme "${targetProgram?.title}" supprimé avec succès sur le Cloud.`);
      } catch (err: any) {
        console.warn('Suppression directe échouée (ID mismatch probable), recherche par titre…', err);
      }

      // Tentative 2 : chercher par titre si l'ID local ≠ ID Appwrite
      if (!deleted && targetProgram?.title) {
        try {
          const res = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.programs,
            [Query.equal('title', targetProgram.title), Query.limit(5)]
          );
          if (res.documents.length > 0) {
            for (const doc of res.documents) {
              await databases.deleteDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.programs,
                doc.$id
              );
            }
            deleted = true;
            setCloudSuccess(`Programme "${targetProgram.title}" supprimé du Cloud (trouvé par titre).`);
          } else {
            setCloudSuccess(`Programme "${targetProgram?.title}" supprimé localement (pas de version en ligne).`);
          }
        } catch (searchErr: any) {
          console.error('Erreur recherche/suppression par titre sur Appwrite:', searchErr);
          setCloudError(`Supprimé localement mais erreur Cloud : ${searchErr.message || 'inconnue'}.`);
        }
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

  return (
    <div className="space-y-6">
      {cloudSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{cloudSuccess}</span>
          </div>
          <button onClick={() => setCloudSuccess(null)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 font-bold ml-4 cursor-pointer">✕</button>
        </div>
      )}

      {cloudError && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{cloudError}</span>
          </div>
          <button onClick={() => setCloudError(null)} className="text-amber-700 dark:text-amber-300 hover:text-amber-900 font-bold ml-4 cursor-pointer">✕</button>
        </div>
      )}

      {/* ── Tabs Header ── */}
      <div className="flex border-b border-border-primary/50 gap-6">
        <button
          onClick={() => setActiveSubTab('programs')}
          className={`pb-3 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'programs'
              ? 'border-b-2 border-brand-primary text-brand-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Catalogue des Cours & Formations ({programs.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('sessions')}
          className={`pb-3 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'sessions'
              ? 'border-b-2 border-brand-primary text-brand-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Rentrées & Sessions d'admission ({sessions.length})</span>
        </button>
      </div>

      {activeSubTab === 'programs' ? (
        /* ─── ONGLET PROGRAMMES ─── */
        <div className="space-y-6">
          {showAddProgramForm ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={resetProgramForm}
                  className="bg-bg-secondary border border-border-primary text-text-secondary hover:bg-bg-primary px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour
                </button>
                <h3 className="font-sans font-bold text-lg text-text-primary">
                  {editingProgramId ? 'Modifier le programme' : 'Nouveau programme'}
                </h3>
              </div>
              <form
                onSubmit={handleSubmitProgram}
                className="bg-bg-secondary border border-border-primary rounded-2xl p-6 space-y-4 shadow-sm"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">Titre du programme *</label>
                  <input
                    type="text"
                    value={newProgramTitle}
                    onChange={(e) => setNewProgramTitle(e.target.value)}
                    placeholder="ex: Master en Cybersécurité"
                    className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs font-medium"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">Description *</label>
                  <textarea
                    value={newProgramDescription}
                    onChange={(e) => setNewProgramDescription(e.target.value)}
                    placeholder="Description courte du programme"
                    rows={3}
                    className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs font-medium"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary uppercase">Type (Durée auto-assignée) *</label>
                    <select
                      value={newProgramType}
                      onChange={(e) => handleProgramTypeChange(e.target.value as any)}
                      className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs font-bold"
                    >
                      <option value="Bachelor">Bachelor (3 ans / L1-L3)</option>
                      <option value="Master">Master (5 ans / Bac+5)</option>
                      <option value="Doctorat">Doctorat (3 ans / Thèse)</option>
                      <option value="Certification">Certification (6 mois / Certifiante)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-text-secondary uppercase">Catégorie (Saisie libre ou Liste) *</label>
                      <span className="text-[10px] text-text-secondary font-normal">Tapez ou cliquez un badge</span>
                    </div>
                    <input
                      type="text"
                      list="category-options-list"
                      value={newProgramCategory}
                      onChange={(e) => setNewProgramCategory(e.target.value)}
                      placeholder="ex: Tech, Finance, IA & Data, Cybersécurité..."
                      className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs font-bold"
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
                              ? 'bg-brand-primary text-white shadow-sm'
                              : 'bg-bg-primary hover:bg-border-primary/50 text-text-secondary border border-border-primary'
                          }`}
                        >
                          + {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary uppercase">Durée de formation *</label>
                    <input
                      type="text"
                      value={newProgramDuration}
                      onChange={(e) => setNewProgramDuration(e.target.value)}
                      placeholder="ex: 3 ans (6 Semestres)"
                      className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs font-medium"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary uppercase">Prix</label>
                    <input
                      type="text"
                      value={newProgramPrice}
                      onChange={(e) => setNewProgramPrice(e.target.value)}
                      placeholder="ex: 2000 € / an"
                      className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary uppercase">URL Image *</label>
                    <input
                      type="text"
                      value={newProgramImage}
                      onChange={(e) => setNewProgramImage(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">Procédures d'admission & Pièces requises par niveau (Optionnel)</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2 bg-bg-primary p-4 rounded-xl border border-border-primary">
                    {[
                      "BEPC", "BAC", "Licence 1", "Licence 2", "Licence 3", 
                      "Master 1", "Master 2", "GCE Ordinary Level (GCE O/L)", "GCE Advanced Level (GCE A/L)"
                    ].map(diploma => (
                      <label key={diploma} className="flex items-start gap-2 text-xs font-semibold text-text-primary cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(newProgramProcedures || '').includes(diploma)}
                          onChange={(e) => {
                            let current = newProgramProcedures ? newProgramProcedures.split(', ') : [];
                            if (e.target.checked) {
                              if (!current.includes(diploma)) current.push(diploma);
                            } else {
                              current = current.filter(d => d !== diploma);
                            }
                            setNewProgramProcedures(current.join(', '));
                          }}
                          className="w-4 h-4 mt-0.5 accent-brand-primary border-border-primary rounded focus:ring-brand-primary cursor-pointer"
                        />
                        <span className="leading-tight">{diploma}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProgramIsNew}
                    onChange={(e) => setNewProgramIsNew(e.target.checked)}
                    className="w-4 h-4 accent-brand-primary border-border-primary rounded focus:ring-brand-primary"
                  />
                  Marquer comme "Nouveau"
                </label>

                <div className="pt-4 flex justify-end gap-3 border-t border-border-primary/50">
                  <button
                    type="button"
                    onClick={resetProgramForm}
                    className="px-5 py-2 rounded-lg text-xs font-bold text-text-secondary hover:bg-bg-primary border border-border-primary transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
                  >
                    {editingProgramId ? 'Mettre à jour' : 'Enregistrer le programme'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-sans font-bold text-lg text-text-primary">Programmes académiques IDLA</h3>
                <button
                  onClick={() => setShowAddProgramForm(true)}
                  className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter un programme
                </button>
              </div>

              <ProgramFilterBar
                filters={adminFilters}
                onFilterChange={setAdminFilters}
                onReset={() => setAdminFilters(INITIAL_FILTER_STATE)}
                totalResults={filteredAdminPrograms.length}
              />

              <div className="bg-bg-secondary border border-border-primary rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-bg-primary text-text-secondary border-b border-border-primary/50 font-bold uppercase">
                      <th className="p-4">Programme</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Catégorie</th>
                      <th className="p-4">Durée</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-primary/40">
                    {filteredAdminPrograms.map((p) => (
                      <tr key={p.id} className="hover:bg-bg-primary/50 transition-colors">
                        <td className="p-4 font-semibold text-text-primary">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                            <span>{p.title}</span>
                            {p.isNew && (
                              <span className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                                Nouveau
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-medium text-text-secondary">{p.type}</td>
                        <td className="p-4 font-medium text-text-secondary">{p.category}</td>
                        <td className="p-4 text-text-secondary">{p.duration}</td>
                        <td className="p-4">
                          <div className="flex justify-center items-center gap-1">
                            <button
                              onClick={() => {
                                const directUrl = `${window.location.origin}/candidature?program=${encodeURIComponent(p.title)}`;
                                navigator.clipboard.writeText(directUrl);
                                setCopySuccessId(p.id);
                                setTimeout(() => setCopySuccessId(null), 3000);
                              }}
                              className="text-brand-primary hover:text-brand-hover p-1.5 hover:bg-bg-primary rounded transition-all cursor-pointer"
                              title={copySuccessId === p.id ? "Lien d'inscription copié !" : "Copier le lien d'inscription direct du programme"}
                            >
                              {copySuccessId === p.id ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <LinkIcon className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleEditProgram(p)}
                              className="text-text-secondary hover:text-brand-primary p-1.5 hover:bg-bg-primary rounded transition-all cursor-pointer"
                              title="Modifier le programme"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProgram(p.id)}
                              className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-all cursor-pointer"
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
                        <td colSpan={5} className="p-8 text-center text-text-secondary italic">
                          Aucun programme enregistré.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ─── ONGLET SESSIONS & RENTRÉES UNIVERSITAIRES ─── */
        <div className="space-y-6">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-900 dark:text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Synchronisation active avec le portail candidat :</span>
              <p className="mt-0.5 leading-relaxed text-text-secondary">
                Les rentrées scolaires programmées ci-dessous et marquées comme <strong>"Ouverte"</strong> ou <strong>"Bientôt"</strong> apparaissent instantanément dans la liste de choix lors de la candidature d'un étudiant.
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-sans font-bold text-lg text-text-primary">Calendrier des rentrées et admissions</h3>
              <p className="text-xs text-text-secondary mt-0.5">Programmez les sessions universitaires ouvertes aux candidatures</p>
            </div>
            <button
              onClick={() => (showAddSessionForm ? resetSessionForm() : setShowAddSessionForm(true))}
              className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {showAddSessionForm ? 'Fermer le formulaire' : 'Programmer une rentrée'}
            </button>
          </div>

          {showAddSessionForm && (
            <form
              onSubmit={handleSubmitSession}
              className="bg-bg-secondary border border-border-primary rounded-2xl p-6 space-y-4 shadow-sm"
            >
              <p className="text-sm font-bold text-text-primary">
                {editingSessionId ? 'Modifier la rentrée universitaire' : 'Programmer une nouvelle rentrée'}
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary uppercase">Nom de la session / rentrée *</label>
                <input
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="ex: Session d'Octobre 2027 ou Rentrée MBA Spécialisée"
                  className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">Type *</label>
                  <select
                    value={newSessionType}
                    onChange={(e) => setNewSessionType(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs font-bold cursor-pointer"
                  >
                    <option value="principale">Rentrée Principale</option>
                    <option value="hiver">Rentrée d'Hiver</option>
                    <option value="printemps">Rentrée de Printemps</option>
                    <option value="continu">E-learning en Continu</option>
                    <option value="autre">Session Spéciale / Autre</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">Statut des candidatures *</label>
                  <select
                    value={newSessionStatus}
                    onChange={(e) => setNewSessionStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs font-bold cursor-pointer"
                  >
                    <option value="ouverte">Ouverte aux candidatures</option>
                    <option value="bientot">Bientôt ouverte</option>
                    <option value="fermee">Clôturée / Fermée</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">Date limite de candidature</label>
                  <input
                    type="text"
                    value={newSessionDeadline}
                    onChange={(e) => setNewSessionDeadline(e.target.value)}
                    placeholder="ex: 15 Septembre 2027"
                    className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary uppercase">Description / Note indicative (Optionnelle)</label>
                <input
                  type="text"
                  value={newSessionDescription}
                  onChange={(e) => setNewSessionDescription(e.target.value)}
                  placeholder="ex: Rentrée principale pour tous les cursus Master et Bachelor"
                  className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs font-medium"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-border-primary/50">
                <button
                  type="button"
                  onClick={resetSessionForm}
                  className="px-5 py-2 rounded-lg text-xs font-bold text-text-secondary hover:bg-bg-primary border border-border-primary transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
                >
                  {editingSessionId ? 'Enregistrer les modifications' : 'Enregistrer la rentrée'}
                </button>
              </div>
            </form>
          )}

          <div className="bg-bg-secondary border border-border-primary rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-bg-primary text-text-secondary border-b border-border-primary/50 font-bold uppercase">
                  <th className="p-4">Session / Rentrée</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Date limite / Clôture</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary/40">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-bg-primary/50 transition-colors">
                    <td className="p-4 font-semibold text-text-primary">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                        <div>
                          <span>{s.name}</span>
                          {s.description && (
                            <p className="text-[10px] text-text-secondary font-normal mt-0.5">{s.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-text-secondary capitalize">{s.type}</td>
                    <td className="p-4 font-medium text-text-secondary">{s.deadline || '—'}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleSessionStatus(s.id)}
                        title="Cliquez pour changer le statut (Ouverte / Bientôt / Fermée)"
                        className="cursor-pointer transition-transform active:scale-95"
                      >
                        {s.status === 'ouverte' && (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Ouverte
                          </span>
                        )}
                        {s.status === 'bientot' && (
                          <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-500/20">
                            <Clock className="w-3 h-3" /> Bientôt
                          </span>
                        )}
                        {s.status === 'fermee' && (
                          <span className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-rose-500/20">
                            <AlertCircle className="w-3 h-3" /> Clôturée
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center items-center gap-1">
                        <button
                          onClick={() => handleEditSession(s)}
                          className="text-text-secondary hover:text-brand-primary p-1.5 hover:bg-bg-primary rounded transition-all cursor-pointer"
                          title="Modifier la session"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSession(s.id)}
                          className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-all cursor-pointer"
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
                    <td colSpan={5} className="p-8 text-center text-text-secondary italic">
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
