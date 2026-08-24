import React from 'react';
import { HeartHandshake, CheckCircle2, Trash2 } from 'lucide-react';
import { Donation } from '../../types';

interface DonationsProps {
  donations: Donation[];
  setDonations: React.Dispatch<React.SetStateAction<Donation[]>>;
  logActivity: (type: 'registration' | 'article' | 'error' | 'alumni', user: string, text: string) => Promise<void>;
}

export default function Donations({
  donations,
  setDonations,
  logActivity,
}: DonationsProps) {
  const handleConfirmDonation = (id: string) => {
    setDonations((curr) => curr.map((d) => (d.id === id ? { ...d, status: 'Confirmé' } : d)));
    const target = donations.find((d) => d.id === id);
    if (target) {
      logActivity(
        'alumni',
        'Super Admin',
        `a confirmé le don de ${target.donor} (${target.amount.toLocaleString('fr-FR')} FCFA).`
      );
    }
  };

  const handleDeleteDonation = (id: string) => {
    setDonations((curr) => curr.filter((d) => d.id !== id));
  };

  return (
    <div className="space-y-6">
      <h3 className="font-sans font-bold text-lg text-text-primary">Soutien & Dons</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-bg-secondary p-6 rounded-2xl border border-border-primary shadow-sm space-y-2">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Total collecté</p>
          <span className="text-3xl font-extrabold text-text-primary">
            {donations.reduce((sum, d) => sum + d.amount, 0).toLocaleString('fr-FR')}{' '}
            <span className="text-sm text-text-secondary">FCFA</span>
          </span>
        </div>
        <div className="bg-bg-secondary p-6 rounded-2xl border border-border-primary shadow-sm space-y-2">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Nombre de dons</p>
          <span className="text-3xl font-extrabold text-text-primary">{donations.length}</span>
        </div>
        <div className="bg-bg-secondary p-6 rounded-2xl border border-border-primary shadow-sm space-y-2">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Don moyen</p>
          <span className="text-3xl font-extrabold text-text-primary">
            {(donations.length
              ? Math.round(donations.reduce((s, d) => s + d.amount, 0) / donations.length)
              : 0
            ).toLocaleString('fr-FR')}{' '}
            <span className="text-sm text-text-secondary">FCFA</span>
          </span>
        </div>
      </div>

      <p className="text-xs text-text-secondary">Dons reçus via le formulaire public « Faire un don » du site.</p>

      <div className="bg-bg-secondary border border-border-primary rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-bg-primary text-text-secondary border-b border-border-primary/50 font-bold uppercase">
              <th className="p-4">Donateur</th>
              <th className="p-4">Montant</th>
              <th className="p-4">Message</th>
              <th className="p-4">Date</th>
              <th className="p-4">Statut</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-primary/40">
            {donations.map((d) => (
              <tr key={d.id} className="hover:bg-bg-primary/50 transition-colors">
                <td className="p-4 font-semibold text-text-primary">
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="w-3.5 h-3.5 text-brand-primary shrink-0" /> {d.donor}
                  </div>
                  <div className="text-[10px] text-text-secondary font-medium pl-5">{d.email}</div>
                </td>
                <td className="p-4 font-bold text-brand-primary whitespace-nowrap">
                  {d.amount.toLocaleString('fr-FR')} FCFA
                </td>
                <td className="p-4 text-text-secondary max-w-[200px]">
                  <span className="line-clamp-2">{d.message || '—'}</span>
                </td>
                <td className="p-4 text-text-secondary whitespace-nowrap">{d.date}</td>
                <td className="p-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      d.status === 'Confirmé'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    ● {d.status}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex justify-center items-center gap-1">
                    {d.status !== 'Confirmé' && (
                      <button
                        onClick={() => handleConfirmDonation(d.id)}
                        title="Confirmer la réception"
                        className="text-emerald-600 hover:text-emerald-700 p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteDonation(d.id)}
                      title="Supprimer"
                      className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {donations.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-text-secondary italic">
                  Aucun don reçu pour l'instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
