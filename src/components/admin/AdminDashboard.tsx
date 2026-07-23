import React from 'react';
import { TrendingUp, UserCheck, Eye } from 'lucide-react';
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
        <div className="bg-white p-6 rounded-2xl border border-[#c6c6cf] shadow-sm space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Toutes les demandes</p>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#00020e]">{totalInscriptions}</span>
            <span className="text-xs text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded flex items-center gap-0.5">
              Total
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#c6c6cf] shadow-sm space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Taux d'admission</p>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#00020e]">{admissionRate}%</span>
            <span className="text-xs text-amber-600 font-bold bg-amber-500/10 px-2 py-0.5 rounded">{accepted} Admis</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#c6c6cf] shadow-sm space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dossiers à réviser</p>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#00020e]">{pending}</span>
            <span className="text-xs text-rose-600 font-bold bg-rose-500/10 px-2 py-0.5 rounded">Action requise</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#c6c6cf] shadow-sm space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dossiers traités</p>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#00020e]">{processedRate}%</span>
            <span className="text-xs text-[#006c49] font-bold bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-0.5">
              Complétés
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Table of pending pre-registrations */}
        <div className="lg:col-span-8 bg-white border border-[#c6c6cf] rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 border-b border-[#c6c6cf]/30 flex justify-between items-center bg-slate-50">
            <h3 className="font-sans font-bold text-base text-[#00020e] flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#006c49]" />
              Demandes de Pré-inscriptions Récentes
            </h3>
            <span className="text-xs font-bold text-[#006c49] bg-[#6ffbbe]/20 px-2.5 py-1 rounded-full">Admissions</span>
          </div>

          <div className="overflow-x-auto flex-grow">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 border-b border-[#c6c6cf]/30 font-bold uppercase">
                  <th className="p-4">Candidat</th>
                  <th className="p-4">Filière d'intérêt</th>
                  <th className="p-4">Date de dépôt</th>
                  <th className="p-4 text-center">Décision adm.</th>
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
                      {p.status === 'Accepted' && (
                        <span className="mx-auto block text-center w-24 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 font-bold text-[10px]">
                          Admis d'office
                        </span>
                      )}
                      {p.status === 'Rejected' && (
                        <span className="mx-auto block text-center w-24 py-1 rounded-lg bg-rose-500/10 text-rose-700 font-bold text-[10px]">
                          Refusé
                        </span>
                      )}
                      {p.status !== 'Accepted' && p.status !== 'Rejected' && (
                        <button
                          onClick={() => {
                            setSelectedPreRegId(p.id);
                            setActiveTab('admin-preregistrations');
                          }}
                          className="mx-auto flex items-center gap-1.5 bg-[#006c49] hover:bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all"
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
        <div className="lg:col-span-4 bg-white border border-[#c6c6cf] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-sans font-bold text-base text-[#00020e]">Journal d'activité CMS</h3>

            <div className="space-y-4">
              {activityLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="flex gap-3 text-xs leading-relaxed border-l-2 border-slate-100 pl-3">
                  <div>
                    <span className="font-bold text-[#00020e]">{log.user}</span>{' '}
                    <span className="text-[#45464e]">{log.text}</span>
                    <div className="text-[10px] text-slate-400 mt-1">{log.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('admin-users')}
            className="w-full mt-6 text-center border border-[#c6c6cf] hover:bg-slate-50 text-xs font-bold py-2.5 rounded-lg transition-all"
          >
            Gérer les comptes utilisateurs
          </button>
        </div>
      </div>
    </div>
  );
}
