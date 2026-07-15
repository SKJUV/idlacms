import React, { useState, useEffect } from 'react';
import { LockIcon, CheckCircle2Icon, AlertCircleIcon, ArrowLeftIcon } from './Icons';
import { account } from '../lib/appwrite';

interface PasswordResetProps {
  onBackToHome: () => void;
  onGoToLogin: () => void;
}

export default function PasswordReset({ onBackToHome, onGoToLogin }: PasswordResetProps) {
  const [userId, setUserId] = useState('');
  const [secret, setSecret] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);

  // Lire userId et secret depuis les paramètres d'URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const uid = params.get('userId');
    const sec = params.get('secret');
    if (!uid || !sec) {
      setInvalidLink(true);
      return;
    }
    setUserId(uid);
    setSecret(sec);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);
    try {
      await account.updateRecovery({
        userId,
        secret,
        password: newPassword,
      });
      setSuccess(true);
    } catch (err: any) {
      console.error('updateRecovery error:', err);
      if (err?.code === 401 || err?.type === 'user_invalid_token') {
        setError('Ce lien de réinitialisation est invalide ou a expiré. Veuillez en demander un nouveau.');
      } else {
        setError(err?.message || 'Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-bg-primary min-h-screen flex items-center justify-center py-12 px-6 relative overflow-hidden text-text-primary">
      {/* Glow background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-primary blur-[150px] rounded-full" />
      </div>

      <div className="max-w-md w-full bg-bg-secondary rounded-2xl border border-border-primary p-8 shadow-2xl relative z-10 space-y-6">

        {/* Header */}
        <div className="text-center space-y-3">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-brand-primary transition-colors mb-2 border border-border-primary px-3 py-1 rounded cursor-pointer"
          >
            <ArrowLeftIcon className="w-3 h-3" /> Retour à l'accueil
          </button>
          <div className="w-14 h-14 bg-brand-light rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <LockIcon className="w-7 h-7 text-brand-primary" />
          </div>
          <h1 className="font-sans font-bold text-2xl text-text-primary">Nouveau mot de passe</h1>
          <p className="text-text-secondary text-xs">Choisissez un nouveau mot de passe sécurisé pour votre compte IDLA.</p>
        </div>

        {/* Lien invalide */}
        {invalidLink && (
          <div className="space-y-4">
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-700 dark:text-red-400 text-sm font-semibold flex items-start gap-3">
              <AlertCircleIcon className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Lien invalide ou manquant</p>
                <p className="text-xs font-normal mt-1">Ce lien de réinitialisation est incorrect. Assurez-vous d'avoir cliqué sur le lien complet reçu par e-mail.</p>
              </div>
            </div>
            <button
              onClick={onGoToLogin}
              className="w-full bg-brand-primary hover:bg-brand-hover text-white py-3 rounded-lg font-bold text-sm transition-all cursor-pointer"
            >
              Retour à la connexion
            </button>
          </div>
        )}

        {/* Succès */}
        {!invalidLink && success && (
          <div className="space-y-4">
            <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-400 text-center space-y-3">
              <CheckCircle2Icon className="w-12 h-12 mx-auto" />
              <div>
                <p className="font-bold text-base">Mot de passe réinitialisé !</p>
                <p className="text-xs font-normal mt-1">Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
              </div>
            </div>
            <button
              onClick={onGoToLogin}
              className="w-full bg-brand-primary hover:bg-brand-hover text-white py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Se connecter
            </button>
          </div>
        )}

        {/* Formulaire */}
        {!invalidLink && !success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-700 dark:text-red-400 text-xs font-semibold flex items-start gap-2">
                <AlertCircleIcon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/60 w-4 h-4" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 caractères"
                  className="w-full bg-bg-primary border border-border-primary rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-primary outline-none text-text-primary"
                  required
                  minLength={8}
                  autoFocus
                />
              </div>
              {/* Indicateur de force */}
              {newPassword.length > 0 && (
                <div className="flex gap-1 mt-1.5">
                  {[...Array(4)].map((_, i) => {
                    const strength =
                      newPassword.length >= 12 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) && /[^a-zA-Z0-9]/.test(newPassword) ? 4
                      : newPassword.length >= 10 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? 3
                      : newPassword.length >= 8 ? 2
                      : 1;
                    return (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                        i < strength
                          ? strength >= 4 ? 'bg-emerald-500'
                          : strength >= 3 ? 'bg-brand-primary'
                          : strength >= 2 ? 'bg-amber-500'
                          : 'bg-rose-500'
                          : 'bg-border-primary'
                      }`} />
                    );
                  })}
                </div>
              )}
              {newPassword.length > 0 && (
                <p className="text-[10px] text-text-secondary">
                  {newPassword.length < 8 ? 'Trop court' :
                   newPassword.length >= 12 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? '✅ Très sécurisé' :
                   newPassword.length >= 8 && /[0-9]/.test(newPassword) ? '🔒 Correct' : '⚠️ Ajoutez des chiffres et majuscules'}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/60 w-4 h-4" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  className={`w-full bg-bg-primary border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 outline-none text-text-primary transition-colors ${
                    confirmPassword.length > 0 && confirmPassword !== newPassword
                      ? 'border-rose-400 focus:ring-rose-400'
                      : confirmPassword.length > 0 && confirmPassword === newPassword
                      ? 'border-emerald-400 focus:ring-emerald-400'
                      : 'border-border-primary focus:ring-brand-primary'
                  }`}
                  required
                />
                {confirmPassword.length > 0 && (
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs">
                    {confirmPassword === newPassword ? '✅' : '❌'}
                  </span>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || newPassword.length < 8 || newPassword !== confirmPassword}
              className="w-full bg-brand-primary hover:bg-brand-hover text-white py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Réinitialisation…</>
              ) : (
                <><LockIcon className="w-4 h-4" /> Enregistrer le nouveau mot de passe</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
