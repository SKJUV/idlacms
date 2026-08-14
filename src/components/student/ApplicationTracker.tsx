import React, { useState } from 'react';
import { PreRegistration } from '../../types';
import { DownloadIcon, FileTextIcon, CheckCircle2Icon, AlertCircleIcon, UploadCloudIcon } from '../Icons';
import { downloadAdmissionLetterPdf, generateMatricule } from '../../lib/admissionLetter';

interface ApplicationTrackerProps {
  applications: PreRegistration[];
  studentEmail: string;
  studentName: string;
  onApplyNewProgram: () => void;
}

export default function ApplicationTracker({
  applications,
  studentEmail,
  studentName,
  onApplyNewProgram,
}: ApplicationTrackerProps) {
  const [selectedAppId, setSelectedAppId] = useState<string | null>(
    applications.length > 0 ? applications[0].id : null
  );

  const selectedApp = applications.find((a) => a.id === selectedAppId) || applications[0];

  const getStatusBadge = (status: string) => {
    if (status === 'Accepted') return { cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: 'Admis ✓' };
    if (status === 'Rejected') return { cls: 'bg-rose-500/10 text-rose-600 border-rose-500/20', label: 'Non retenu' };
    if (status === 'In Review') return { cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: 'En examen' };
    return { cls: 'bg-sky-500/10 text-sky-600 border-sky-500/20', label: 'Candidature Reçue' };
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-primary/50 pb-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Suivi de vos Candidatures IDLA</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Consultez l'avancement de vos dossiers et téléchargez vos attestations d'admission officielles.
          </p>
        </div>
        <button
          onClick={onApplyNewProgram}
          className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow cursor-pointer"
        >
          + Nouvelle Candidature
        </button>
      </div>

      {applications.length === 0 ? (
        <div className="bg-bg-secondary border border-border-primary rounded-2xl p-8 text-center space-y-3">
          <FileTextIcon className="w-12 h-12 text-text-secondary mx-auto opacity-50" />
          <h2 className="text-base font-bold text-text-primary">Aucune candidature enregistrée</h2>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            Vous n'avez pas encore soumis de dossier d'admission. Explorez le catalogue et postulez au programme de votre choix.
          </p>
          <button
            onClick={onApplyNewProgram}
            className="bg-brand-primary text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow cursor-pointer mt-2 inline-block"
          >
            Déposer un dossier d'admission →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Applications Sidebar */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Vos Dossiers ({applications.length})</h3>
            {applications.map((app) => {
              const badge = getStatusBadge(app.status);
              const isSelected = app.id === selectedAppId;
              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedAppId(app.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-brand-light/30 border-brand-primary shadow-sm'
                      : 'bg-bg-secondary border-border-primary hover:border-border-primary/80'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.cls}`}>
                      {badge.label}
                    </span>
                    <span className="text-[10px] text-text-secondary">{app.dateApplied || 'Récemment'}</span>
                  </div>
                  <h4 className="font-bold text-sm text-text-primary line-clamp-1">{app.program || 'Candidature IDLA'}</h4>
                  <p className="text-xs text-text-secondary mt-1">{app.email || studentEmail}</p>
                </div>
              );
            })}
          </div>

          {/* Selected Application Details */}
          {selectedApp && (
            <div className="lg:col-span-2 bg-bg-secondary border border-border-primary rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-primary/40 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-brand-primary tracking-wider">Dossier de Candidature</span>
                  <h2 className="text-lg font-bold text-text-primary">{selectedApp.program || 'Programme Académique'}</h2>
                  <p className="text-xs text-text-secondary mt-0.5">Identifiant : #{selectedApp.id.slice(-8).toUpperCase()}</p>
                </div>
                {selectedApp.status === 'Accepted' && (
                  <button
                    onClick={() =>
                      downloadAdmissionLetterPdf({
                        name: selectedApp.name || studentName,
                        email: selectedApp.email || studentEmail,
                        program: selectedApp.program || 'Programme Académique IDLA',
                        entryLevel: selectedApp.entryLevel || 'M1',
                        matricule: selectedApp.matricule || generateMatricule(selectedApp.id),
                      })
                    }
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <DownloadIcon className="w-4 h-4" />
                    Télécharger l'Attestation Officielle PDF
                  </button>
                )}
              </div>

              {/* Status Timeline */}
              <div className="p-4 rounded-xl bg-bg-primary border border-border-primary/50 space-y-3">
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">État d'Avancement de l'Examen</h4>
                <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-semibold">
                  <div className={`p-2 rounded-lg border ${selectedApp.status ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' : 'bg-bg-secondary text-text-secondary'}`}>
                    1. Reçu
                  </div>
                  <div className={`p-2 rounded-lg border ${['In Review', 'Accepted'].includes(selectedApp.status) ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' : 'bg-bg-secondary text-text-secondary'}`}>
                    2. Examen
                  </div>
                  <div className={`p-2 rounded-lg border ${selectedApp.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' : 'bg-bg-secondary text-text-secondary'}`}>
                    3. Décision
                  </div>
                  <div className={`p-2 rounded-lg border ${selectedApp.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' : 'bg-bg-secondary text-text-secondary'}`}>
                    4. Inscription
                  </div>
                </div>
              </div>

              {/* Applicant Info Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-bg-primary border border-border-primary/50 space-y-1">
                  <span className="text-text-secondary uppercase font-bold text-[10px]">Candidat</span>
                  <p className="font-bold text-text-primary text-sm">{selectedApp.name || studentName}</p>
                  <p className="text-text-secondary">{selectedApp.email || studentEmail}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-bg-primary border border-border-primary/50 space-y-1">
                  <span className="text-text-secondary uppercase font-bold text-[10px]">Statut Admissions</span>
                  <p className="font-bold text-emerald-600 text-sm">{selectedApp.status === 'Accepted' ? 'Candidat Admis ✓' : 'Dossier en Cours d\'Examen'}</p>
                  <p className="text-text-secondary">{selectedApp.matricule ? `Matricule : ${selectedApp.matricule}` : 'Matricule généré à la confirmation'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
