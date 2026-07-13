import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

interface AddUserProps {
  onCreateUser: (
    name: string,
    email: string,
    role: 'Super Admin' | 'Admin' | 'Writer' | 'Marketer' | 'OC',
    status: 'Actif' | 'Inactif' | 'Bloqué'
  ) => Promise<void>;
  setActiveTab: (tab: any) => void;
}

export default function AddUser({ onCreateUser, setActiveTab }: AddUserProps) {
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'Super Admin' | 'Admin' | 'Writer' | 'Marketer' | 'OC'>('Admin');
  const [newUserStatus, setNewUserStatus] = useState<'Actif' | 'Inactif' | 'Bloqué'>('Actif');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreateUser(newUserName, newUserEmail, newUserRole, newUserStatus);
      setNewUserName('');
      setNewUserEmail('');
      setActiveTab('admin-users');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl bg-white border border-[#c6c6cf] rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-[#c6c6cf]/30">
        <button
          onClick={() => setActiveTab('admin-users')}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors border border-[#c6c6cf]/50 text-slate-500"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h3 className="font-sans font-bold text-base text-[#00020e]">Créer un nouvel utilisateur</h3>
          <p className="text-[11px] text-slate-400">Renseignez les détails du compte de l'équipe IDLA</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase">Nom complet *</label>
          <input
            type="text"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            placeholder="ex: Marie-Louise Mba"
            className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-medium"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase">Adresse email *</label>
          <input
            type="email"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            placeholder="ex: ml.mba@idla.edu"
            className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-medium"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Rôle CMS académique *</label>
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as any)}
              className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-bold text-[#00020e]"
              disabled={isSubmitting}
            >
              <option value="Admin">Admin</option>
              <option value="Writer">Writer (Rédacteur Actualités)</option>
              <option value="Marketer">Marketer</option>
              <option value="OC">OC (Conseiller Admissions)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Statut initial *</label>
            <select
              value={newUserStatus}
              onChange={(e) => setNewUserStatus(e.target.value as any)}
              className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-bold text-[#00020e]"
              disabled={isSubmitting}
            >
              <option value="Actif">Actif</option>
              <option value="Inactif">Inactif</option>
            </select>
          </div>
        </div>

        <div className="pt-6 flex justify-end gap-3 border-t border-[#c6c6cf]/30">
          <button
            type="button"
            onClick={() => setActiveTab('admin-users')}
            className="px-5 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 border border-[#c6c6cf]/40 transition-colors"
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-6 py-2.5 rounded-lg transition-all"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enregistrement...' : "Enregistrer l'utilisateur"}
          </button>
        </div>
      </form>
    </div>
  );
}
