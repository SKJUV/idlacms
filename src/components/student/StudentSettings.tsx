import React, { useState } from 'react';
import { LockIcon, CheckCircle2Icon, AlertCircleIcon } from '../Icons';
import { account } from '../../lib/appwrite';

interface StudentSettingsProps {
  studentEmail: string;
}

export default function StudentSettings({ studentEmail }: StudentSettingsProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [notifEmail, setNotifEmail] = useState(true);
  const [notifDeadlines, setNotifDeadlines] = useState(true);
  const [selectedLang, setSelectedLang] = useState<'fr' | 'en'>('fr');

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword.length < 8) {
      setErrorMsg('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsUpdating(true);
    try {
      await account.updatePassword({ password: newPassword, oldPassword: currentPassword });
      setSuccessMsg('Mot de passe mis à jour avec succès !');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Update password error:', err);
      setErrorMsg(err.message || 'Impossible de mettre à jour le mot de passe.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 animate-fadeIn">
      <div className="border-b border-border-primary/50 pb-4">
        <h1 className="text-xl font-bold text-text-primary">Paramètres du Compte Étudiant</h1>
        <p className="text-xs text-text-secondary mt-0.5">
          Gérez votre sécurité, vos préférences de notifications et votre langue d'affichage.
        </p>
      </div>

      {/* Security & Password Form */}
      <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-border-primary/40 pb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-light text-brand-primary flex items-center justify-center font-bold">
            <LockIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary">Sécurité & Mot de Passe</h2>
            <p className="text-xs text-text-secondary">Compte : {studentEmail}</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircleIcon className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2Icon className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-secondary">Mot de passe actuel</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-bg-primary border border-border-primary rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-primary text-text-primary"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-secondary">Nouveau mot de passe</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-bg-primary border border-border-primary rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-primary text-text-primary"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-secondary">Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-bg-primary border border-border-primary rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-primary text-text-primary"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isUpdating}
            className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow cursor-pointer"
          >
            {isUpdating ? 'Mise à jour...' : 'Changer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}
