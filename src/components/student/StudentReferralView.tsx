import React, { useState } from 'react';
import { Gift, Copy, Check } from 'lucide-react';
import { ReferralCode } from '../../types';
import { buildReferralLink } from '../../lib/referral';

interface StudentReferralViewProps {
  myReferralCode?: ReferralCode | null;
}

export default function StudentReferralView({ myReferralCode }: StudentReferralViewProps) {
  const [copiedReferralLink, setCopiedReferralLink] = useState(false);

  const handleCopyLink = () => {
    if (!myReferralCode) return;
    navigator.clipboard.writeText(buildReferralLink(myReferralCode.code));
    setCopiedReferralLink(true);
    setTimeout(() => setCopiedReferralLink(false), 2500);
  };

  return (
    <div className="bg-gradient-to-r from-brand-primary/10 via-brand-light to-emerald-500/10 border border-brand-primary/20 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-border-primary/50 pb-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-primary bg-brand-primary/10 px-2.5 py-0.5 rounded-full border border-brand-primary/20">
            Programme Ambassadeur IDLA
          </span>
          <h3 className="font-sans font-bold text-lg text-text-primary mt-1 flex items-center gap-2">
            <Gift className="w-5 h-5 text-brand-primary" /> Mon Code &amp; Lien de Parrainage Officiel
          </h3>
        </div>
        <span className="text-xs text-text-secondary italic">
          Configuré par l'Administration
        </span>
      </div>

      {myReferralCode ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-bg-secondary p-4 rounded-xl border border-border-primary/50 space-y-1">
              <p className="text-[10px] font-bold uppercase text-text-secondary">Mon Code Parrain</p>
              <p className="text-lg font-mono font-extrabold text-brand-primary">{myReferralCode.code}</p>
            </div>
            <div className="bg-bg-secondary p-4 rounded-xl border border-border-primary/50 space-y-1">
              <p className="text-[10px] font-bold uppercase text-text-secondary">Avantage pour mes Filleuls</p>
              <p className="text-xs font-bold text-text-primary">{myReferralCode.discountReward || 'Frais de dossier offerts'}</p>
            </div>
            <div className="bg-bg-secondary p-4 rounded-xl border border-border-primary/50 space-y-1">
              <p className="text-[10px] font-bold uppercase text-text-secondary">Filleuls Inscrits</p>
              <p className="text-lg font-extrabold text-emerald-600">{myReferralCode.currentUses} {myReferralCode.maxUses ? `/ ${myReferralCode.maxUses}` : ''}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <div className="flex-1 w-full bg-bg-secondary border border-border-primary rounded-xl px-3.5 py-2.5 text-xs font-mono text-text-primary truncate">
              {buildReferralLink(myReferralCode.code)}
            </div>
            <button
              onClick={handleCopyLink}
              className="w-full sm:w-auto bg-brand-primary hover:bg-brand-hover text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0 shadow-sm"
            >
              {copiedReferralLink ? <><Check className="w-4 h-4 text-emerald-400" /> Lien copié !</> : <><Copy className="w-4 h-4" /> Copier mon lien parrain</>}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-bg-secondary/80 border border-border-primary/60 rounded-xl p-5 text-center space-y-2">
          <p className="text-xs font-bold text-text-primary">Vous n'avez pas encore de code de parrainage officiel attribué.</p>
          <p className="text-xs text-text-secondary max-w-xl mx-auto">
            Les liens de parrainage sont créés et attribués individuellement par l'Administration. Contactez le service des admissions pour faire une demande d'activation de votre statut d'Ambassadeur IDLA.
          </p>
        </div>
      )}
    </div>
  );
}
