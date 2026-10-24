import React from 'react';
import { UserCheck, Eye } from 'lucide-react';
import { PreRegistration, ActivityLog } from '../../types';

interface AdminDashboardProps {
  preRegistrations: PreRegistration[];
  activityLogs: ActivityLog[];
  setSelectedPreRegId: (id: string | null) => void;
  setActiveTab: (tab: any) => void;
}

export default function AdminDashboard({
  preRegistrations,
  activityLogs,
  setSelectedPreRegId,
  setActiveTab,
}: AdminDashboardProps) {
  const totalInscriptions = preRegistrations.length;
  const accepted = preRegistrations.filter((p) => p.status === 'Accepted').length;
  const rejected = preRegistrations.filter((p) => p.status === 'Rejected').length;
  const pending = preRegistrations.filter((p) => p.status === 'In Review' || p.status === 'New').length;
  const processed = accepted + rejected;
  const admissionRate = processed > 0 ? Math.round((accepted / processed) * 100) : 0;
  const processedRate = totalInscriptions > 0 ? Math.round((processed / totalInscriptions) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Key KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-bg-secondary p-6 rounded-2xl border border-border-primary shadow-sm space-y-2">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Toutes les demandes</p>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-text-primary">{totalInscriptions}</span>
            <span className="text-xs text-text-secondary font-bold bg-bg-primary px-2 py-0.5 rounded flex items-center gap-0.5 border border-border-primary/50">
              Total
            </span>
          </div>
        </div>

        <div className="bg-bg-secondary p-6 rounded-2xl border border-border-primary shadow-sm space-y-2">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Taux d'admission</p>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-text-primary">{admissionRate}%</span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">{accepted} Admis</span>
          </div>
        </div>

        <div className="bg-bg-secondary p-6 rounded-2xl border border-border-primary shadow-sm space-y-2">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Dossiers à réviser</p>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-text-primary">{pending}</span>
            <span className="text-xs text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded">Action requise</span>
          </div>
        </div>

        <div className="bg-bg-secondary p-6 rounded-2xl border border-border-primary shadow-sm space-y-2">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Dossiers traités</p>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-text-primary">{processedRate}%</span>
            <span className="text-xs text-[#006c49] dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-0.5">
              Complétés
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Table of pending pre-registrations */}
        <div className="lg:col-span-8 bg-bg-secondary border border-border-primary rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 border-b border-border-primary flex justify-between items-center bg-bg-primary/50">
            <h3 className="font-sans font-bold text-base text-text-primary flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#006c49] dark:text-emerald-400" />
              Demandes de Pré-inscriptions Récentes
            </h3>
            <span className="text-xs font-bold text-[#006c49] dark:text-emerald-300 bg-[#6ffbbe]/20 px-2.5 py-1 rounded-full">Admissions</span>
          </div>

          <div className="overflow-x-auto flex-grow">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-bg-primary/50 text-text-secondary border-b border-border-primary font-bold uppercase">
                  <th className="p-4">Candidat</th>
                  <th className="p-4">Filière d'intérêt</th>
                  <th className="p-4">Date de dépôt</th>
                  <th className="p-4 text-center">Décision adm.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary/50">
                {preRegistrations.map((p) => (
                  <tr key={p.id} className="hover:bg-bg-primary/40 transition-colors">
                    <td className="p-4 font-semibold text-text-primary">
                      <div>{p.name}</div>
                      <div className="text-[10px] text-text-secondary font-medium">{p.email}</div>
                    </td>
                    <td className="p-4 font-medium text-text-secondary">{p.program}</td>
                    <td className="p-4 text-text-secondary">{p.dateApplied}</td>
                    <td className="p-4">
                      {p.status === 'Accepted' && (
                        <span className="mx-auto block text-center w-24 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
                          Admis d'office
                        </span>
                      )}
                      {p.status === 'Rejected' && (
                        <span className="mx-auto block text-center w-24 py-1 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-400 font-bold text-[10px]">
                          Refusé
                        </span>
                      )}
                      {p.status !== 'Accepted' && p.status !== 'Rejected' && (
                        <button
                          onClick={() => {
                            setSelectedPreRegId(p.id);
                            setActiveTab('admin-preregistrations');
                          }}
                          className="mx-auto flex items-center gap-1.5 bg-[#006c49] hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                          title="Examiner le dossier"
                        >
                          <Eye className="w-3.5 h-3.5" /> Examiner
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CMS Activity Logs */}
        <div className="lg:col-span-4 bg-bg-secondary border border-border-primary rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-sans font-bold text-base text-text-primary">Journal d'activité CMS</h3>

            <div className="space-y-4">
              {activityLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="flex gap-3 text-xs leading-relaxed border-l-2 border-brand-primary/40 pl-3">
                  <div>
                    <span className="font-bold text-text-primary">{log.user}</span>{' '}
                    <span className="text-text-secondary">{log.text}</span>
                    <div className="text-[10px] text-text-secondary/70 mt-1">{log.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('admin-users')}
            className="w-full mt-6 text-center border border-border-primary hover:bg-bg-primary text-text-primary text-xs font-bold py-2.5 rounded-lg transition-all cursor-pointer"
          >
            Gérer les comptes utilisateurs
          </button>
        </div>
      </div>
    </div>
  );
}
