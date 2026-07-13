import React from 'react';
import {
  ArrowLeftIcon as ArrowLeft,
  CheckCircle2Icon as CheckCircle2,
  XCircleIcon as XCircle,
  FileTextIcon as FileText,
  EyeIcon as Eye,
} from '../Icons';
import { PreRegistration } from '../../types';
import { databases, APPWRITE_CONFIG, isAppwriteDbConfigured } from '../../lib/appwrite';

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

  // --- Vue détail : examen approfondi du dossier ---
  if (selected) {
    const statusBadge =
      selected.status === 'Accepted'
        ? { cls: 'bg-emerald-500/10 text-emerald-700', label: 'Dossier admis' }
        : selected.status === 'Rejected'
        ? { cls: 'bg-rose-500/10 text-rose-700', label: 'Dossier refusé' }
        : { cls: 'bg-amber-500/10 text-amber-700', label: "En cours d'examen" };

    return (
      <div className="space-y-6 max-w-4xl">
        <button
          onClick={() => setSelectedPreRegId(null)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-text-primary border border-border-primary/60 hover:bg-bg-primary px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à la liste
        </button>

        <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-border-primary/40">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-lg shrink-0">
                {selected.initials}
              </div>
              <div>
                <h3 className="font-sans font-bold text-xl text-text-primary">{selected.name}</h3>
                <p className="text-xs text-slate-400">
                  {selected.email}
                  {selected.phone ? ` • ${selected.phone}` : ''}
                </p>
              </div>
            </div>
            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${statusBadge.cls}`}>
              {statusBadge.label}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {[
              ["Filière d'intérêt", selected.program],
              ['Date de dépôt', selected.dateApplied],
              ['Nationalité', selected.nationality || '—'],
              ['Dernier diplôme', selected.highestDegree || '—'],
              ["Année d'obtention", selected.graduationYear ? String(selected.graduationYear) : '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {label}
                </p>
                <p className="text-sm font-semibold text-[#00020e] mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {selected.motivation && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Lettre de motivation
              </p>
              <p className="text-sm text-[#45464e] leading-relaxed bg-slate-50 border border-[#c6c6cf]/40 rounded-xl p-4">
                {selected.motivation}
              </p>
            </div>
          )}

          {/* Pièces jointes */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Pièces justificatives
            </p>
            <div className="flex flex-wrap gap-2">
              {selected.documents && selected.documents.length > 0 ? (
                selected.documents.map((doc) => (
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

          <div className="pt-6 flex flex-wrap justify-end gap-3 border-t border-[#c6c6cf]/30">
            {selected.status !== 'Accepted' && selected.status !== 'Rejected' ? (
              <>
                <button
                  onClick={() => {
                    handleDenyPreRegistration(selected.id);
                  }}
                  className="flex items-center gap-1.5 bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-bold px-5 py-2.5 rounded-lg transition-all"
                >
                  <XCircle className="w-4 h-4" /> Refuser le dossier
                </button>
                <button
                  onClick={() => {
                    handleApprovePreRegistration(selected.id);
                  }}
                  className="flex items-center gap-1.5 bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" /> Accepter le candidat
                </button>
              </>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Décision déjà rendue. Vous pouvez revenir à la liste.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Vue liste ---
  return (
    <div className="space-y-6">
      <h3 className="font-sans font-bold text-lg text-[#00020e]">
        Pré-inscriptions & candidatures
      </h3>
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
    </div>
  );
}
