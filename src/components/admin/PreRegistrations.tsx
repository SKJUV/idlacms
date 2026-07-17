import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeftIcon as ArrowLeft,
  CheckCircle2Icon as CheckCircle2,
  XCircleIcon as XCircle,
  FileTextIcon as FileText,
  EyeIcon as Eye,
  ClockIcon as Clock,
  DownloadIcon as Download,
  AlertCircleIcon as AlertCircleIcon,
} from '../Icons';
import { Mail, MessageSquare, Send, Users, ExternalLink, StickyNote, ChevronDown, PlusCircle, BookOpen } from 'lucide-react';
import { PreRegistration, DEFAULT_ACADEMIC_SESSIONS } from '../../types';
import { programsData } from '../../data/mockData';
import { databases, storage, APPWRITE_CONFIG, isAppwriteDbConfigured, ID, Query } from '../../lib/appwrite';

interface PreRegistrationsProps {
  preRegistrations: PreRegistration[];
  setPreRegistrations: React.Dispatch<React.SetStateAction<PreRegistration[]>>;
  selectedPreRegId: string | null;
  setSelectedPreRegId: (id: string | null) => void;
  logActivity: (type: 'registration' | 'article' | 'error' | 'alumni', user: string, text: string) => Promise<void>;
}

// Helpers
const STATUS_STEPS = ['New', 'In Review', 'Accepted', 'Rejected'] as const;
const statusConfig = (s: string) => {
  if (s === 'Accepted') return { cls: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20', label: 'Admis', dot: 'bg-emerald-500' };
  if (s === 'Rejected') return { cls: 'bg-rose-500/10 text-rose-700 border-rose-500/20', label: 'Refusé', dot: 'bg-rose-500' };
  if (s === 'In Review') return { cls: 'bg-amber-500/10 text-amber-700 border-amber-500/20', label: 'En examen', dot: 'bg-amber-500' };
  return { cls: 'bg-sky-500/10 text-sky-700 border-sky-500/20', label: 'Nouveau', dot: 'bg-sky-500' };
};

export default function PreRegistrations({
  preRegistrations, setPreRegistrations, selectedPreRegId, setSelectedPreRegId, logActivity,
}: PreRegistrationsProps) {

  const [viewMode, setViewMode] = useState<'candidates' | 'registered_no_course' | 'applications'>('candidates');
  const [manualEnrollProgram, setManualEnrollProgram] = useState(programsData[0]?.title || 'Master en Cybersécurité');
  const [manualEnrollSession, setManualEnrollSession] = useState(DEFAULT_ACADEMIC_SESSIONS[0]?.name || "Session d'Octobre 2026");
  const [isEnrollingManual, setIsEnrollingManual] = useState(false);
  const [showManualEnrollForm, setShowManualEnrollForm] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [selectedAppIdForChat, setSelectedAppIdForChat] = useState<string | null>(null);
  const [adminReply, setAdminReply] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [notesSaved, setNotesSaved] = useState<Record<string, string>>({});
  const [savingNote, setSavingNote] = useState(false);
  const [appwriteDocs, setAppwriteDocs] = useState<any[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | 'accept' | 'reject'>(null);
  const [statusFilter, setStatusFilter] = useState<string>('Tous');
  const [searchQ, setSearchQ] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Sync back to localStorage when preRegistrations changes
  useEffect(() => {
    if (preRegistrations && preRegistrations.length > 0) {
      try {
        localStorage.setItem('idla_local_applications', JSON.stringify(preRegistrations));
      } catch (e) {
        console.warn("Erreur sync idla_local_applications:", e);
      }
    }
  }, [preRegistrations]);

  // Handlers statut
  const handleApprovePreRegistration = async (id: string) => {
    setPreRegistrations((curr) => curr.map((p) => (p.id === id ? { ...p, status: 'Accepted' } : p)));
    setConfirmAction(null);
    if (isAppwriteDbConfigured()) {
      try {
        await databases.updateDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.applications, id, { status: 'Accepted' });
        logActivity('registration', 'Admin', `a approuvé la candidature #${id.slice(-6).toUpperCase()}.`);
      } catch (err) { console.error('Approve error:', err); }
    }
  };

  const handleDenyPreRegistration = async (id: string) => {
    setPreRegistrations((curr) => curr.map((p) => (p.id === id ? { ...p, status: 'Rejected' } : p)));
    setConfirmAction(null);
    if (isAppwriteDbConfigured()) {
      try {
        await databases.updateDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.applications, id, { status: 'Rejected' });
        logActivity('error', 'Admin', `a refusé la candidature #${id.slice(-6).toUpperCase()}.`);
      } catch (err) { console.error('Deny error:', err); }
    }
  };

  const handleSetInReview = async (id: string) => {
    setPreRegistrations((curr) => curr.map((p) => (p.id === id ? { ...p, status: 'In Review' } : p)));
    if (isAppwriteDbConfigured()) {
      try {
        await databases.updateDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.applications, id, { status: 'In Review' });
        logActivity('registration', 'Admin', `a mis en examen la candidature #${id.slice(-6).toUpperCase()}.`);
      } catch (err) { console.error('InReview error:', err); }
    }
  };

  // Données dérivées
  const selected = preRegistrations.find((p) => p.id === selectedPreRegId) || null;
  const candidateApps = selected ? preRegistrations.filter((p) => p.email === selected.email) : [];

  // Charger documents Appwrite et chat quand on ouvre un dossier
  useEffect(() => {
    if (!selected) { setAppwriteDocs([]); setChatMessages([]); return; }
    setSelectedAppIdForChat(selected.id);

    // Charger documents depuis candidate_documents
    if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.candidateDocuments) {
      setDocsLoading(true);
      databases.listDocuments(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.candidateDocuments, [Query.equal('applicationId', selected.id)])
        .then((res) => setAppwriteDocs(res.documents))
        .catch(() => setAppwriteDocs([]))
        .finally(() => setDocsLoading(false));
    }

    // Charger note admin depuis localStorage
    const savedNote = localStorage.getItem(`admin_note_${selected.id}`) || '';
    setAdminNote(savedNote);
  }, [selectedPreRegId]);

  // Charger chat
  useEffect(() => {
    if (!selectedAppIdForChat || !isAppwriteDbConfigured() || !APPWRITE_CONFIG.collections.messages) {
      setChatMessages([]); return;
    }
    databases.listDocuments(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.messages, [
      Query.equal('applicationId', selectedAppIdForChat), Query.orderAsc('createdAt'),
    ]).then((res) => {
      if (res.documents.length > 0) {
        setChatMessages(res.documents.map((d: any) => ({
          id: d.$id, sender: d.sender, text: d.text,
          time: new Date(d.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
        })));
      } else {
        setChatMessages([{ sender: 'advisor', text: "Bonjour, j'ai bien reçu votre dossier. N'hésitez pas à me contacter pour toute question.", time: "Aujourd'hui" }]);
      }
    }).catch(() => setChatMessages([]));
  }, [selectedAppIdForChat]);

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReply.trim() || !selectedAppIdForChat) return;
    const text = adminReply;
    setAdminReply('');
    const newMsg = { sender: 'advisor', text, time: new Date().toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) };
    setChatMessages((curr) => [...curr, newMsg]);
    if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.messages) {
      await databases.createDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.messages, ID.unique(), {
        applicationId: selectedAppIdForChat, sender: 'advisor', text, createdAt: new Date().toISOString(),
      }).catch(console.error);
    }
  };

  const handleSaveNote = () => {
    if (!selected) return;
    setSavingNote(true);
    localStorage.setItem(`admin_note_${selected.id}`, adminNote);
    setNotesSaved((prev) => ({ ...prev, [selected.id]: adminNote }));
    setTimeout(() => setSavingNote(false), 1000);
  };

  // Handlers pour inscription manuelle par l'admin d'un candidat inscrit sans cours
  const handleManualEnrollCandidate = async () => {
    if (!selected || !manualEnrollProgram) return;
    setIsEnrollingManual(true);
    try {
      const blankApp = selected.applications.find((a: any) => !a.program || a.program === 'Inscription seule');
      let updatedOrNewId = `app_${Date.now()}`;
      if (blankApp) {
        updatedOrNewId = blankApp.id;
        setPreRegistrations((curr) =>
          curr.map((p) =>
            p.id === blankApp.id
              ? {
                  ...p,
                  program: manualEnrollProgram,
                  motivation: `${manualEnrollSession} | Inscription manuelle par l'administrateur`,
                  status: 'Accepted',
                }
              : p
          )
        );
        if (isAppwriteDbConfigured()) {
          try {
            await databases.updateDocument(
              APPWRITE_CONFIG.databaseId,
              APPWRITE_CONFIG.collections.applications,
              blankApp.id,
              {
                program: manualEnrollProgram,
                motivation: `${manualEnrollSession} | Inscription manuelle par l'administrateur`,
                status: 'Accepted',
              }
            );
          } catch (e) {
            console.error('Erreur inscription manuelle Appwrite DB:', e);
          }
        }
      } else {
        const newApp: PreRegistration = {
          ...selected.applications[0],
          id: updatedOrNewId,
          program: manualEnrollProgram,
          motivation: `${manualEnrollSession} | Inscription manuelle par l'administrateur`,
          status: 'Accepted' as const,
          dateApplied: new Date().toISOString(),
        };
        setPreRegistrations((curr) => [newApp, ...curr]);
        if (isAppwriteDbConfigured()) {
          try {
            await databases.createDocument(
              APPWRITE_CONFIG.databaseId,
              APPWRITE_CONFIG.collections.applications,
              ID.unique(),
              {
                firstName: selected.name.split(' ')[0] || selected.name,
                lastName: selected.name.split(' ').slice(1).join(' ') || '',
                name: selected.name,
                email: selected.email,
                phone: selected.phone || '',
                program: manualEnrollProgram,
                dateApplied: new Date().toISOString(),
                status: 'Accepted',
                motivation: `${manualEnrollSession} | Inscription manuelle par l'administrateur`,
                initials: selected.initials,
              }
            );
          } catch (e) {
            console.error('Erreur création inscription manuelle Appwrite DB:', e);
          }
        }
      }
      logActivity(
        'registration',
        'Super Admin',
        `a inscrit manuellement ${selected.name} à la formation : "${manualEnrollProgram}".`
      );
      setShowManualEnrollForm(false);
    } finally {
      setIsEnrollingManual(false);
    }
  };

  // Grouper par candidat
  const candidatesMap = preRegistrations.reduce((acc, curr) => {
    const key = curr.email;
    if (!acc[key]) acc[key] = { email: key, name: curr.name, initials: curr.initials, phone: curr.phone, nationality: curr.nationality, highestDegree: curr.highestDegree, graduationYear: curr.graduationYear, motivation: curr.motivation, documents: curr.documents || [], applications: [], courseApplications: [] };
    acc[key].applications.push(curr);
    if (curr.program && curr.program !== 'Inscription seule') {
      acc[key].courseApplications.push(curr);
    }
    if (curr.phone) acc[key].phone = curr.phone;
    if (curr.nationality) acc[key].nationality = curr.nationality;
    if (curr.highestDegree) acc[key].highestDegree = curr.highestDegree;
    if (curr.graduationYear) acc[key].graduationYear = curr.graduationYear;
    if (curr.motivation) acc[key].motivation = curr.motivation;
    if (curr.documents?.length) acc[key].documents = Array.from(new Set([...acc[key].documents, ...curr.documents]));
    return acc;
  }, {} as Record<string, any>);

  const candidatesList = Object.values(candidatesMap).map((c: any) => ({
    ...c,
    isRegisteredOnly: c.courseApplications.length === 0,
  }));

  // Filtres liste
  const filteredApps = preRegistrations
    .filter((p) => p.program && p.program !== 'Inscription seule')
    .filter((p) => {
      const matchStatus = statusFilter === 'Tous' || p.status === statusFilter;
      const matchSearch = !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase()) || p.email.toLowerCase().includes(searchQ.toLowerCase()) || (p.program || '').toLowerCase().includes(searchQ.toLowerCase());
      return matchStatus && matchSearch;
    });

  const filteredCandidates = candidatesList.filter((c: any) => {
    if (viewMode === 'registered_no_course' && !c.isRegisteredOnly) return false;
    const matchStatus = statusFilter === 'Tous' || c.applications.some((a: any) => a.status === statusFilter);
    const matchSearch = !searchQ || c.name.toLowerCase().includes(searchQ.toLowerCase()) || c.email.toLowerCase().includes(searchQ.toLowerCase());
    return matchStatus && matchSearch;
  });

  // ════════════════ VUE DÉTAIL DOSSIER ════════════════
  if (selected) {
    const currentApp = candidateApps.find((a) => a.id === selectedAppIdForChat) || candidateApps[0];
    const sc = statusConfig(currentApp?.status || 'New');
    const savedNote = notesSaved[selected.id] ?? localStorage.getItem(`admin_note_${selected.id}`) ?? '';
    const allDocs = [...(selected.documents || []), ...appwriteDocs.map((d: any) => d.name)].filter(Boolean);

    return (
      <div className="space-y-5 max-w-7xl">
        {/* Back */}
        <button onClick={() => setSelectedPreRegId(null)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-text-primary border border-[#c6c6cf]/60 hover:bg-bg-primary px-3 py-1.5 rounded-lg cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Retour à la liste
        </button>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* ── Colonne gauche : profil + dossier ── */}
          <div className="xl:col-span-7 space-y-5">

            {/* Header candidat */}
            <div className="bg-white border border-[#c6c6cf] rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#c6c6cf]/40">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-xl shrink-0">
                    {selected.initials}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-[#00020e]">{selected.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <Mail className="w-3 h-3" />{selected.email}
                      {selected.phone && <><span className="opacity-30">•</span> {selected.phone}</>}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold border shrink-0 ${sc.cls}`}>
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${sc.dot} mr-1.5`} />
                  {sc.label}
                </span>
              </div>

              {/* Infos personnelles */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 pt-5">
                {[
                  ['Nationalité', selected.nationality],
                  ['Dernier diplôme', selected.highestDegree],
                  ["Année d'obtention", selected.graduationYear ? String(selected.graduationYear) : null],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                    <p className="text-sm font-semibold text-[#00020e] mt-0.5">{value}</p>
                  </div>
                ))}
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Dossier n°</p>
                  <p className="text-sm font-mono font-semibold text-[#00020e] mt-0.5">#{selected.id.slice(-6).toUpperCase()}</p>
                </div>
              </div>
            </div>

            {/* Notification & Inscription Manuelle pour candidat sans cours */}
            {selected.isRegisteredOnly && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <AlertCircleIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-amber-900">Étudiant inscrit sans cours sélectionné</h4>
                      <p className="text-xs text-amber-800/80 mt-0.5 leading-relaxed">
                        Cet étudiant ({selected.email}) s'est inscrit sur le portail IDLA mais n'a pas encore postulé à une formation. Vous pouvez l'inscrire directement depuis cet espace.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowManualEnrollForm(!showManualEnrollForm)}
                    className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    {showManualEnrollForm ? 'Fermer' : 'Inscrire à un cours'}
                  </button>
                </div>

                {showManualEnrollForm && (
                  <div className="bg-white border border-amber-200/80 rounded-xl p-4 space-y-3 pt-3">
                    <p className="text-xs font-bold text-[#00020e] flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#006c49]" /> Sélectionner le programme académique :
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <select
                        value={manualEnrollProgram}
                        onChange={(e) => setManualEnrollProgram(e.target.value)}
                        className="w-full p-2 rounded-lg border border-[#c6c6cf] text-xs font-semibold text-[#00020e] focus:ring-2 focus:ring-[#006c49] outline-none"
                      >
                        {programsData.map((p) => (
                          <option key={p.id} value={p.title}>{p.title} ({p.type})</option>
                        ))}
                      </select>
                      <select
                        value={manualEnrollSession}
                        onChange={(e) => setManualEnrollSession(e.target.value)}
                        className="w-full p-2 rounded-lg border border-[#c6c6cf] text-xs font-semibold text-[#00020e] focus:ring-2 focus:ring-[#006c49] outline-none"
                      >
                        {DEFAULT_ACADEMIC_SESSIONS.map((s) => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => setShowManualEnrollForm(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleManualEnrollCandidate}
                        disabled={isEnrollingManual}
                        className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-4 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isEnrollingManual ? 'Inscription en cours...' : 'Valider l\'inscription immédiate'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Candidatures de ce candidat */}
            <div className="bg-white border border-[#c6c6cf] rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="font-bold text-sm text-[#00020e] uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-primary" /> Programmes postulés ({candidateApps.length})
              </h4>
              <div className="space-y-3">
                {candidateApps.map((app) => {
                  const badge = statusConfig(app.status || 'New');
                  const isSelected = selectedAppIdForChat === app.id;
                  return (
                    <div key={app.id} onClick={() => setSelectedAppIdForChat(app.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${isSelected ? 'border-brand-primary bg-brand-light/30' : 'border-border-primary/50 hover:bg-slate-50'}`}>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[#00020e] line-clamp-2">{app.program || 'Inscription seule (pas encore postulé)'}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Déposé le {new Date(app.dateApplied || '').toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.cls}`}>{badge.label}</span>
                          {app.status !== 'Accepted' && app.status !== 'Rejected' && (
                            <div className="flex gap-1.5">
                              {app.status !== 'In Review' && (
                                <button onClick={() => handleSetInReview(app.id)}
                                  className="bg-amber-50 border border-amber-300 text-amber-700 hover:bg-amber-100 text-[10px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer">
                                  En examen
                                </button>
                              )}
                              <button onClick={() => { setSelectedAppIdForChat(app.id); setConfirmAction('reject'); }}
                                className="bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 text-[10px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer">
                                Refuser
                              </button>
                              <button onClick={() => { setSelectedAppIdForChat(app.id); setConfirmAction('accept'); }}
                                className="bg-[#006c49] hover:bg-slate-800 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer">
                                Accepter
                              </button>
                            </div>
                          )}
                          {(app.status === 'Accepted' || app.status === 'Rejected') && (
                            <button onClick={() => handleSetInReview(app.id)}
                              className="text-[10px] text-slate-500 hover:underline cursor-pointer">Remettre en examen</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Modale confirmation */}
              {confirmAction && currentApp && (
                <div className="bg-slate-50 border-2 border-amber-400 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-bold text-[#00020e]">
                    {confirmAction === 'accept' ? '✅ Confirmer l\'admission' : '❌ Confirmer le refus'} pour :<br />
                    <span className="text-brand-primary">{currentApp.program}</span>
                  </p>
                  <p className="text-xs text-slate-500">Cette action sera enregistrée dans la base de données et notifiée au candidat.</p>
                  <div className="flex gap-2">
                    <button onClick={() => confirmAction === 'accept' ? handleApprovePreRegistration(currentApp.id) : handleDenyPreRegistration(currentApp.id)}
                      className={`text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer ${confirmAction === 'accept' ? 'bg-[#006c49] hover:bg-slate-800' : 'bg-rose-500 hover:bg-rose-700'}`}>
                      Confirmer
                    </button>
                    <button onClick={() => setConfirmAction(null)} className="bg-white border border-[#c6c6cf] text-slate-600 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer">Annuler</button>
                  </div>
                </div>
              )}
            </div>

            {/* Motivation */}
            {selected.motivation && (
              <div className="bg-white border border-[#c6c6cf] rounded-2xl p-6 shadow-sm space-y-3">
                <h4 className="font-bold text-sm text-[#00020e] uppercase tracking-wider">Lettre de motivation</h4>
                <blockquote className="text-sm text-[#45464e] leading-relaxed bg-slate-50 border-l-4 border-brand-primary rounded-r-xl p-4 italic">
                  "{selected.motivation}"
                </blockquote>
              </div>
            )}

            {/* Pièces justificatives */}
            <div className="bg-white border border-[#c6c6cf] rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="font-bold text-sm text-[#00020e] uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-brand-primary" /> Pièces justificatives</span>
                {docsLoading && <span className="text-[10px] text-slate-400 animate-pulse">Chargement…</span>}
              </h4>
              {allDocs.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Aucune pièce jointe disponible.</p>
              ) : (
                <div className="space-y-2">
                  {allDocs.map((doc: string, i: number) => {
                    const appDoc = appwriteDocs.find((d: any) => d.name === doc);
                    const fileExt = doc.split('.').pop()?.toUpperCase() || 'DOC';
                    const extColor = fileExt === 'PDF' ? 'bg-rose-500/10 text-rose-600' : 'bg-sky-500/10 text-sky-600';
                    return (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-[#c6c6cf]/50 rounded-xl">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 ${extColor}`}>{fileExt}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#00020e] truncate">{doc}</p>
                            {appDoc && (
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {appDoc.mimeType} • {new Date(appDoc.$createdAt).toLocaleDateString('fr-FR')}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {appDoc ? (
                            <>
                              <a
                                href={storage.getFileDownload(APPWRITE_CONFIG.buckets.documents, appDoc.fileId).toString()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-slate-500 hover:text-brand-primary cursor-pointer"
                                title="Télécharger"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                              <a
                                href={storage.getFileView(APPWRITE_CONFIG.buckets.documents, appDoc.fileId).toString()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-slate-500 hover:text-brand-primary cursor-pointer"
                                title="Ouvrir"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Lien non disponible</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notes internes admin */}
            <div className="bg-white border border-[#c6c6cf] rounded-2xl p-6 shadow-sm space-y-3">
              <h4 className="font-bold text-sm text-[#00020e] uppercase tracking-wider flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-amber-500" /> Notes internes (visibles uniquement par l'admin)
              </h4>
              <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={4}
                placeholder="Observations, décisions intermédiaires, contacts effectués…"
                className="w-full bg-slate-50 border border-[#c6c6cf] rounded-xl px-3 py-2.5 text-xs text-[#00020e] outline-none focus:ring-2 focus:ring-brand-primary resize-none" />
              <div className="flex items-center gap-3">
                <button onClick={handleSaveNote}
                  className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors">
                  {savingNote ? 'Enregistré ✓' : 'Enregistrer la note'}
                </button>
                {savedNote && <span className="text-[11px] text-slate-400 italic line-clamp-1">Dernière note : "{savedNote.slice(0, 40)}{savedNote.length > 40 ? '…' : ''}"</span>}
              </div>
            </div>
          </div>

          {/* ── Colonne droite : chat + timeline ── */}
          <div className="xl:col-span-5 space-y-5">

            {/* Timeline statut */}
            <div className="bg-white border border-[#c6c6cf] rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="font-bold text-sm text-[#00020e] uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-primary" /> Suivi du dossier
              </h4>
              <div className="relative pl-5">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-[#c6c6cf]/50" />
                {[
                  { step: 1, label: 'Dossier déposé', desc: `Par ${selected.name}`, done: true },
                  { step: 2, label: 'En cours d\'analyse', desc: 'Examen académique des pièces', done: currentApp?.status === 'In Review' || currentApp?.status === 'Accepted' },
                  { step: 3, label: 'Entretien de motivation', desc: 'Jury académique IDLA', done: currentApp?.status === 'Accepted' },
                  { step: 4, label: 'Décision finale', desc: currentApp?.status === 'Accepted' ? '✅ Admis — félicitations !' : currentApp?.status === 'Rejected' ? '❌ Candidature non retenue' : 'En attente', done: currentApp?.status === 'Accepted' || currentApp?.status === 'Rejected' },
                ].map(({ step, label, desc, done }) => (
                  <div key={step} className="relative mb-5 last:mb-0 pl-5">
                    <div className={`absolute -left-3 top-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold ${done ? 'bg-brand-primary border-brand-primary text-white' : 'bg-white border-[#c6c6cf] text-slate-400'}`}>
                      {done ? '✓' : step}
                    </div>
                    <p className={`text-xs font-bold ${done ? 'text-[#00020e]' : 'text-slate-400'}`}>{label}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat conseillère / candidat */}
            <div className="bg-white border border-[#c6c6cf] rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[400px]">
              <div className="bg-slate-50 p-4 border-b border-[#c6c6cf]/40 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center border border-brand-primary text-brand-primary">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#00020e]">Messagerie candidat</h4>
                    <p className="text-[10px] text-slate-400 line-clamp-1">
                      {candidateApps.find((a) => a.id === selectedAppIdForChat)?.program || 'Sélectionnez un programme'}
                    </p>
                  </div>
                </div>
                {candidateApps.length > 1 && (
                  <select value={selectedAppIdForChat || ''} onChange={(e) => setSelectedAppIdForChat(e.target.value)}
                    className="text-[10px] bg-white border border-[#c6c6cf] rounded-lg px-2 py-1 text-[#00020e] cursor-pointer">
                    {candidateApps.map((a) => <option key={a.id} value={a.id}>{a.program.slice(0, 30)}…</option>)}
                  </select>
                )}
              </div>

              <div className="flex-grow p-4 overflow-y-auto space-y-3 max-h-[300px]">
                {chatMessages.map((m, idx) => (
                  <div key={idx} className={`flex flex-col max-w-[85%] ${m.sender === 'advisor' ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed ${m.sender === 'advisor' ? 'bg-brand-primary text-white rounded-tr-none' : 'bg-slate-100 text-[#00020e] rounded-tl-none border border-border-primary/30'}`}>
                      {m.text}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 px-1">{m.time}</span>
                  </div>
                ))}
                {chatMessages.length === 0 && <p className="text-xs text-slate-400 italic text-center pt-8">Aucun message échangé.</p>}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendAdminReply} className="p-3 border-t border-[#c6c6cf]/40 bg-slate-50 flex gap-2 shrink-0">
                <input type="text" value={adminReply} onChange={(e) => setAdminReply(e.target.value)}
                  placeholder={selectedAppIdForChat ? 'Répondre au candidat...' : 'Sélectionnez un programme...'}
                  disabled={!selectedAppIdForChat}
                  className="flex-grow bg-white border border-[#c6c6cf] rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-brand-primary text-[#00020e] disabled:opacity-50" />
                <button type="submit" disabled={!selectedAppIdForChat}
                  className="bg-brand-primary text-white p-2 rounded-lg hover:bg-brand-hover cursor-pointer disabled:opacity-50 flex items-center">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ════════════════ VUE LISTE ════════════════
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-bold text-lg text-[#00020e]">Inscrits & Candidatures aux formations</h3>
          <p className="text-xs text-slate-500 mt-0.5">Consultez tous les étudiants inscrits sur le portail IDLA (avec ou sans cours) et leurs dossiers</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl border border-[#c6c6cf]/40 shrink-0 flex-wrap gap-1">
          <button onClick={() => setViewMode('candidates')}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'candidates' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-text-primary'}`}>
            <Users className="w-3.5 h-3.5" /> Tous les inscrits ({candidatesList.length})
          </button>
          <button onClick={() => setViewMode('registered_no_course')}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'registered_no_course' ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-700 hover:bg-amber-50 border border-amber-200/60'}`}>
            <AlertCircleIcon className="w-3.5 h-3.5" /> Inscrits sans cours ({candidatesList.filter((c: any) => c.isRegisteredOnly).length})
          </button>
          <button onClick={() => setViewMode('applications')}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'applications' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-text-primary'}`}>
            <FileText className="w-3.5 h-3.5" /> Candidatures cours ({preRegistrations.filter(p => p.program && p.program !== 'Inscription seule').length})
          </button>
        </div>
      </div>

      {/* Barre de recherche + filtre statut */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input type="text" value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
          placeholder="Rechercher un candidat, email, programme…"
          className="flex-1 bg-white border border-[#c6c6cf] rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-brand-primary text-[#00020e]" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-[#c6c6cf] rounded-xl px-3 py-2.5 text-xs text-[#00020e] cursor-pointer outline-none focus:ring-2 focus:ring-brand-primary">
          <option value="Tous">Tous les statuts</option>
          <option value="New">Nouveau</option>
          <option value="In Review">En examen</option>
          <option value="Accepted">Admis</option>
          <option value="Rejected">Refusé</option>
        </select>
      </div>

      {viewMode === 'candidates' || viewMode === 'registered_no_course' ? (
        <div className="bg-white border border-[#c6c6cf] rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 border-b border-[#c6c6cf]/30 font-bold uppercase text-[10px]">
                <th className="p-4">Candidat / Étudiant</th>
                <th className="p-4 hidden md:table-cell">Contact</th>
                <th className="p-4">Programmes postulés & Statut</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c6c6cf]/20">
              {filteredCandidates.map((c: any) => (
                <tr key={c.email} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-[11px] shrink-0">{c.initials}</div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-[#00020e]">{c.name}</p>
                          {c.isRegisteredOnly && (
                            <span className="bg-amber-500/15 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded">
                              Sans cours
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell text-slate-500">{c.phone || '—'}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {c.isRegisteredOnly ? (
                        <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-300/60 px-2.5 py-1 rounded-md text-[10px] font-bold">
                          ⚡ Inscrit au portail IDLA (En attente d'inscription à un cours)
                        </span>
                      ) : (
                        c.courseApplications.map((app: any) => {
                          const badge = statusConfig(app.status || 'New');
                          return (
                            <span key={app.id} className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${badge.cls}`}>
                              {app.program.slice(0, 32)}{app.program.length > 32 ? '…' : ''} • {badge.label}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <button onClick={() => setSelectedPreRegId(c.applications[0].id)}
                      className="mx-auto flex items-center gap-1.5 bg-[#006c49] hover:bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer shadow-xs">
                      <Eye className="w-3.5 h-3.5" /> Dossier
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCandidates.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-slate-400 italic">Aucun candidat trouvé.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-[#c6c6cf] rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 border-b border-[#c6c6cf]/30 font-bold uppercase text-[10px]">
                <th className="p-4">Candidat</th>
                <th className="p-4">Programme</th>
                <th className="p-4 hidden md:table-cell">Date</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-center">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c6c6cf]/20">
              {filteredApps.map((p) => {
                const badge = statusConfig(p.status || 'New');
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-[#00020e]">{p.name}</p>
                      <p className="text-[10px] text-slate-400">{p.email}</p>
                    </td>
                    <td className="p-4 text-slate-600 max-w-[200px]">
                      <p className="line-clamp-2">{p.program || 'Inscription seule'}</p>
                    </td>
                    <td className="p-4 text-slate-400 hidden md:table-cell whitespace-nowrap">
                      {p.dateApplied ? new Date(p.dateApplied).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.cls}`}>{badge.label}</span>
                    </td>
                    <td className="p-4">
                      <button onClick={() => setSelectedPreRegId(p.id)}
                        className="mx-auto flex items-center gap-1.5 bg-[#006c49] hover:bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer">
                        <Eye className="w-3.5 h-3.5" /> Examiner
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredApps.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400 italic">Aucune candidature trouvée.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
