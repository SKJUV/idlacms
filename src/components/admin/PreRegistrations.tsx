import React, { useState, useEffect } from 'react';
import {
  ArrowLeftIcon as ArrowLeft,
  CheckCircle2Icon as CheckCircle2,
  XCircleIcon as XCircle,
  FileTextIcon as FileText,
  EyeIcon as Eye,
} from '../Icons';
import { Mail, MessageSquare, Send, User, Users } from 'lucide-react';
import { PreRegistration } from '../../types';
import { databases, APPWRITE_CONFIG, isAppwriteDbConfigured, ID, Query } from '../../lib/appwrite';

interface PreRegistrationsProps {
  preRegistrations: PreRegistration[];
  setPreRegistrations: React.Dispatch<React.SetStateAction<PreRegistration[]>>;
  selectedPreRegId: string | null;
  setSelectedPreRegId: (id: string | null) => void;
  logActivity: (type: 'registration' | 'article' | 'error' | 'alumni', user: string, text: string) => Promise<void>;
}

export default function PreRegistrations({
  preRegistrations,
  setPreRegistrations,
  selectedPreRegId,
  setSelectedPreRegId,
  logActivity,
}: PreRegistrationsProps) {
  const [viewMode, setViewMode] = useState<'candidates' | 'applications'>('candidates');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [selectedAppIdForChat, setSelectedAppIdForChat] = useState<string | null>(null);
  const [adminReply, setAdminReply] = useState('');

  const handleApprovePreRegistration = async (id: string) => {
    setPreRegistrations((curr) =>
      curr.map((p) => (p.id === id ? { ...p, status: 'Accepted' } : p))
    );

    if (isAppwriteDbConfigured()) {
      try {
        await databases.updateDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.applications,
          id,
          { status: 'Accepted' }
        );
        logActivity('registration', 'Admin', `a approuvé la candidature ID #${id}.`);
      } catch (err) {
        console.error("Failed to approve application on Appwrite:", err);
      }
    } else {
      logActivity('registration', 'Admin', `a approuvé la candidature ID #${id}.`);
    }
  };

  const handleDenyPreRegistration = async (id: string) => {
    setPreRegistrations((curr) =>
      curr.map((p) => (p.id === id ? { ...p, status: 'Rejected' } : p))
    );

    if (isAppwriteDbConfigured()) {
      try {
        await databases.updateDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.applications,
          id,
          { status: 'Rejected' }
        );
        logActivity('error', 'Admin', `a rejeté la candidature ID #${id}.`);
      } catch (err) {
        console.error("Failed to reject application on Appwrite:", err);
      }
    } else {
      logActivity('error', 'Admin', `a rejeté la candidature ID #${id}.`);
    }
  };

  const selected = preRegistrations.find((p) => p.id === selectedPreRegId) || null;
  
  const candidateApps = selected
    ? preRegistrations.filter((p) => p.email === selected.email)
    : [];

  const candidateInfo = selected ? {
    name: selected.name,
    email: selected.email,
    initials: selected.initials,
    phone: candidateApps.find(a => a.phone)?.phone || selected.phone || '—',
    nationality: candidateApps.find(a => a.nationality)?.nationality || selected.nationality || '—',
    highestDegree: candidateApps.find(a => a.highestDegree)?.highestDegree || selected.highestDegree || '—',
    graduationYear: candidateApps.find(a => a.graduationYear)?.graduationYear || selected.graduationYear || '—',
    documents: Array.from(new Set(candidateApps.flatMap(a => a.documents || []))),
  } : null;

  // Default chat to the selected application
  useEffect(() => {
    if (selected) {
      setSelectedAppIdForChat(selected.id);
    } else {
      setSelectedAppIdForChat(null);
    }
  }, [selectedPreRegId]);

  // Load chat messages when selectedAppIdForChat changes
  useEffect(() => {
    if (!selectedAppIdForChat || !isAppwriteDbConfigured() || !APPWRITE_CONFIG.collections.messages) {
      setChatMessages([]);
      return;
    }
    
    let isMounted = true;
    const fetchChat = async () => {
      try {
        const res = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.messages,
          [Query.equal('applicationId', selectedAppIdForChat), Query.orderAsc('createdAt')]
        );
        if (isMounted) {
          if (res.documents.length > 0) {
            setChatMessages(res.documents.map((d: any) => ({
              id: d.$id,
              sender: d.sender,
              text: d.text,
              time: new Date(d.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
            })));
          } else {
            setChatMessages([
              { sender: 'advisor', text: 'Bonjour, j\'ai bien reçu votre dossier. N\'hésitez pas à me contacter ici pour toute question sur votre candidature.', time: 'Aujourd\'hui' }
            ]);
          }
        }
      } catch (err) {
        console.error("Failed to load chat messages in admin panel:", err);
      }
    };
    fetchChat();
    return () => {
      isMounted = false;
    };
  }, [selectedAppIdForChat]);

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReply.trim() || !selectedAppIdForChat) return;
    
    const text = adminReply;
    setAdminReply('');
    
    const newMsg = {
      sender: 'advisor',
      text,
      time: new Date().toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((curr) => [...curr, newMsg]);
    
    if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.messages) {
      try {
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.messages,
          ID.unique(),
          {
            applicationId: selectedAppIdForChat,
            sender: 'advisor',
            text,
            createdAt: new Date().toISOString(),
          }
        );
      } catch (err) {
        console.error("Failed to send chat message from admin:", err);
      }
    }
  };

  // Group applications by unique email
  const candidatesMap = preRegistrations.reduce((acc, curr) => {
    const email = curr.email;
    if (!acc[email]) {
      acc[email] = {
        email,
        name: curr.name,
        initials: curr.initials,
        phone: curr.phone,
        nationality: curr.nationality,
        highestDegree: curr.highestDegree,
        graduationYear: curr.graduationYear,
        motivation: curr.motivation,
        documents: curr.documents || [],
        applications: [],
      };
    }
    acc[email].applications.push(curr);
    
    // Choose latest details
    if (curr.phone) acc[email].phone = curr.phone;
    if (curr.nationality) acc[email].nationality = curr.nationality;
    if (curr.highestDegree) acc[email].highestDegree = curr.highestDegree;
    if (curr.graduationYear) acc[email].graduationYear = curr.graduationYear;
    if (curr.motivation) acc[email].motivation = curr.motivation;
    if (curr.documents && curr.documents.length > 0) {
      acc[email].documents = Array.from(new Set([...acc[email].documents, ...curr.documents]));
    }
    return acc;
  }, {} as Record<string, {
    email: string;
    name: string;
    initials: string;
    phone?: string;
    nationality?: string;
    highestDegree?: string;
    graduationYear?: string | number;
    motivation?: string;
    documents: string[];
    applications: PreRegistration[];
  }>);

  const candidatesList = Object.values(candidatesMap);

  // --- Vue détail : examen approfondi du dossier ---
  if (selected && candidateInfo) {
    return (
      <div className="space-y-6 max-w-7xl">
        <button
          onClick={() => setSelectedPreRegId(null)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-text-primary border border-[#c6c6cf]/60 hover:bg-bg-primary px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à la liste
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Profile and Applications */}
          <div className="lg:col-span-7 bg-white border border-[#c6c6cf] rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            
            {/* Header info */}
            <div className="flex items-center gap-4 pb-6 border-b border-[#c6c6cf]/40">
              <div className="w-14 h-14 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-lg shrink-0">
                {candidateInfo.initials}
              </div>
              <div>
                <h3 className="font-sans font-bold text-xl text-[#00020e]">{candidateInfo.name}</h3>
                <p className="text-xs text-slate-400">
                  {candidateInfo.email}
                  {candidateInfo.phone ? ` • ${candidateInfo.phone}` : ''}
                </p>
              </div>
            </div>

            {/* Profile fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {[
                ['Nationalité', candidateInfo.nationality],
                ['Dernier diplôme', candidateInfo.highestDegree],
                ["Année d'obtention", candidateInfo.graduationYear ? String(candidateInfo.graduationYear) : '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {label}
                  </p>
                  <p className="text-sm font-semibold text-[#00020e] mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {/* List of Applications */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Programmes postulés ({candidateApps.length})
              </p>
              <div className="space-y-3">
                {candidateApps.map((app) => {
                  const statusBadge =
                    app.status === 'Accepted'
                      ? { cls: 'bg-emerald-500/10 text-emerald-700', label: 'Admis' }
                      : app.status === 'Rejected'
                      ? { cls: 'bg-rose-500/10 text-rose-700', label: 'Refusé' }
                      : { cls: 'bg-amber-500/10 text-amber-700', label: 'À examiner' };
                  
                  const isChatSelected = selectedAppIdForChat === app.id;

                  return (
                    <div 
                      key={app.id} 
                      onClick={() => setSelectedAppIdForChat(app.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                        isChatSelected 
                          ? 'border-brand-primary bg-brand-light/35' 
                          : 'border-border-primary/50 bg-slate-50 hover:bg-slate-100/60'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#00020e]">{app.program}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Postulé le {app.dateApplied}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${statusBadge.cls}`}>
                          {statusBadge.label}
                        </span>
                        {app.status !== 'Accepted' && app.status !== 'Rejected' && (
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleDenyPreRegistration(app.id)}
                              className="bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                            >
                              Refuser
                            </button>
                            <button
                              onClick={() => handleApprovePreRegistration(app.id)}
                              className="bg-[#006c49] hover:bg-slate-800 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                            >
                              Accepter
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Motivation and Documents */}
            {selected.motivation && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Lettre de motivation
                </p>
                <p className="text-xs text-[#45464e] leading-relaxed bg-slate-50 border border-border-primary/30 rounded-xl p-4">
                  {selected.motivation}
                </p>
              </div>
            )}

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Pièces justificatives
              </p>
              <div className="flex flex-wrap gap-2">
                {candidateInfo.documents.length > 0 ? (
                  candidateInfo.documents.map((doc) => (
                    <span
                      key={doc}
                      className="inline-flex items-center gap-1.5 bg-slate-50 border border-[#c6c6cf]/50 text-xs font-medium text-[#0b1c30] px-3 py-1.5 rounded-lg"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#006c49]" /> {doc}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">Aucune pièce jointe.</span>
                )}
              </div>
            </div>

          </div>

          {/* Right Panel: Advisor Chat for the selected application */}
          <div className="lg:col-span-5 bg-white border border-[#c6c6cf] rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[450px]">
            {/* Chat header */}
            <div className="bg-slate-50 p-4 border-b border-[#c6c6cf]/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center border border-brand-primary text-brand-primary">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#00020e]">Messagerie Candidat</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                    Sujet : {candidateApps.find(a => a.id === selectedAppIdForChat)?.program || 'Sélectionnez un programme'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages history */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4 max-h-[350px]">
              {chatMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col max-w-[85%] ${
                    m.sender === 'advisor' ? 'ml-auto items-end' : 'mr-auto items-start'
                  }`}
                >
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      m.sender === 'advisor'
                        ? 'bg-brand-primary text-white rounded-tr-none'
                        : 'bg-slate-100 text-[#00020e] rounded-tl-none border border-border-primary/40'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 px-1">{m.time}</span>
                </div>
              ))}
              {chatMessages.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center pt-8">Aucun message échangé.</p>
              )}
            </div>

            {/* Reply entry form */}
            <form onSubmit={handleSendAdminReply} className="p-3 border-t border-[#c6c6cf]/40 bg-slate-50 flex gap-2">
              <input
                type="text"
                value={adminReply}
                onChange={(e) => setAdminReply(e.target.value)}
                placeholder={selectedAppIdForChat ? "Répondre au candidat..." : "Sélectionnez une candidature pour écrire..."}
                disabled={!selectedAppIdForChat}
                className="flex-grow bg-white border border-[#c6c6cf] rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-brand-primary text-[#00020e]"
              />
              <button
                type="submit"
                disabled={!selectedAppIdForChat}
                className="bg-brand-primary text-white p-2 rounded-lg hover:bg-brand-hover transition-colors shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- Vue liste ---
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="font-sans font-bold text-lg text-[#00020e]">
          Pré-inscriptions & candidatures
        </h3>
        
        {/* Toggle buttons */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-[#c6c6cf]/40">
          <button
            onClick={() => setViewMode('candidates')}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              viewMode === 'candidates'
                ? 'bg-white text-brand-primary shadow-sm'
                : 'text-slate-500 hover:text-text-primary'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Par Candidats ({candidatesList.length})
          </button>
          <button
            onClick={() => setViewMode('applications')}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              viewMode === 'applications'
                ? 'bg-white text-brand-primary shadow-sm'
                : 'text-slate-500 hover:text-text-primary'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Par Candidatures ({preRegistrations.length})
          </button>
        </div>
      </div>

      {viewMode === 'candidates' ? (
        <div className="bg-white border border-[#c6c6cf] rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 border-b border-[#c6c6cf]/30 font-bold uppercase">
                <th className="p-4">Candidat</th>
                <th className="p-4">Téléphone</th>
                <th className="p-4">Programmes postulés</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c6c6cf]/20">
              {candidatesList.map((c) => (
                <tr key={c.email} className="hover:bg-slate-50/50">
                  <td className="p-4 font-semibold text-[#00020e]">
                    <div>{c.name}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{c.email}</div>
                  </td>
                  <td className="p-4 font-medium text-slate-600">{c.phone || '—'}</td>
                  <td className="p-4 text-slate-600 font-medium">
                    <div className="flex flex-wrap gap-1.5">
                      {c.applications.map((app) => {
                        const statusBadge =
                          app.status === 'Accepted'
                            ? 'bg-emerald-500/10 text-emerald-700'
                            : app.status === 'Rejected'
                            ? 'bg-rose-500/10 text-rose-700'
                            : 'bg-amber-500/10 text-amber-700';
                        return (
                          <span 
                            key={app.id} 
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusBadge}`}
                          >
                            {app.program}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => setSelectedPreRegId(c.applications[0].id)}
                      className="mx-auto flex items-center gap-1.5 bg-[#006c49] hover:bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Gérer le candidat
                    </button>
                  </td>
                </tr>
              ))}
              {candidatesList.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400 italic">
                    Aucun candidat trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-[#c6c6cf] rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 border-b border-[#c6c6cf]/30 font-bold uppercase">
                <th className="p-4">Candidat</th>
                <th className="p-4">Filière d'intérêt</th>
                <th className="p-4">Date de dépôt</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-center">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c6c6cf]/20">
              {preRegistrations.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="p-4 font-semibold text-[#00020e]">
                    <div>{p.name}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{p.email}</div>
                  </td>
                  <td className="p-4 font-medium text-slate-600">{p.program}</td>
                  <td className="p-4 text-slate-400">{p.dateApplied}</td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        p.status === 'Accepted'
                          ? 'bg-emerald-500/10 text-emerald-700'
                          : p.status === 'Rejected'
                          ? 'bg-rose-500/10 text-rose-700'
                          : 'bg-amber-500/10 text-amber-700'
                      }`}
                    >
                      {p.status === 'Accepted'
                        ? 'Admis'
                        : p.status === 'Rejected'
                        ? 'Refusé'
                        : 'À examiner'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => setSelectedPreRegId(p.id)}
                      className="mx-auto flex items-center gap-1.5 bg-[#006c49] hover:bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all"
                      title="Examiner le dossier"
                    >
                      <Eye className="w-3.5 h-3.5" /> Examiner le dossier
                    </button>
                  </td>
                </tr>
              ))}
              {preRegistrations.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                    Aucune pré-inscription en attente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
