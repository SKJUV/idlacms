import React from 'react';
import { Gift, ArrowRight, X, Users, Star, Shield } from 'lucide-react';
import OfficialDocLinks from './OfficialDocLinks';

interface AmbassadorAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: () => void;
  language?: 'fr' | 'en';
}

/**
 * Popup d'annonce du programme ambassadeur, même logique que le modal MScFE.
 */
export const AmbassadorAdModal: React.FC<AmbassadorAdModalProps> = ({
  isOpen,
  onClose,
  onRegister,
  language = 'fr',
}) => {
  if (!isOpen) return null;

  const isEn = language === 'en';

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ambassador-ad-title"
    >
      <div
        className="relative max-w-3xl w-full max-h-[92vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl border border-emerald-400/40 shadow-[0_0_60px_rgba(16,185,129,0.28)] p-5 sm:p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer border border-white/10"
          title={isEn ? 'Close' : 'Fermer'}
          aria-label={isEn ? 'Close announcement' : 'Fermer l’annonce'}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md">
            <Gift className="w-3.5 h-3.5" />
            {isEn ? 'Official announcement' : 'Annonce officielle'}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {isEn ? '110 ambassadors • CEMAC' : '110 ambassadeurs • CEMAC'}
          </span>
        </div>

        <div className="space-y-2">
          <h3 id="ambassador-ad-title" className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            {isEn
              ? 'Become an Official IDLA Ambassador'
              : 'Devenez Ambassadeur Officiel IDLA'}
          </h3>
          <p className="text-sm text-emerald-100/90 leading-relaxed">
            {isEn
              ? 'Join the official MScFE ambassador network: receive a personal referral link, recommend candidates, and access the official commission and scholarship scale (50,000 FCFA per validated student).'
              : 'Rejoignez le réseau officiel des ambassadeurs MScFE : recevez un lien de parrainage personnel, recommandez des candidats, et accédez au barème officiel de commissions et de bourse personnelle (50 000 FCFA par étudiant validé).'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <Users className="w-4 h-4 text-emerald-300 mb-1.5" />
            <div className="text-[10px] font-bold text-emerald-300 uppercase">
              {isEn ? 'Commission' : 'Commission'}
            </div>
            <div className="text-xs font-black text-white">50 000 FCFA</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <Star className="w-4 h-4 text-amber-300 mb-1.5" />
            <div className="text-[10px] font-bold text-emerald-300 uppercase">
              {isEn ? 'Personal grant' : 'Bourse personnelle'}
            </div>
            <div className="text-xs font-black text-white">
              {isEn ? 'Up to 2 years covered' : 'Jusqu’à 2 ans couverts'}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <Shield className="w-4 h-4 text-sky-300 mb-1.5" />
            <div className="text-[10px] font-bold text-emerald-300 uppercase">
              {isEn ? 'Deadline' : 'Échéance'}
            </div>
            <div className="text-xs font-black text-white">20 déc. 2027</div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-bold text-emerald-200">
            {isEn ? 'Official guides — French & English' : 'Guides officiels — français et anglais'}
          </p>
          <OfficialDocLinks variant="ambassador" compact />
        </div>

        <button
          onClick={onRegister}
          className="w-full group bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-600 hover:from-emerald-400 hover:to-sky-500 text-white font-black text-sm sm:text-base py-3.5 px-6 rounded-2xl transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 cursor-pointer hover:scale-[1.01]"
        >
          <Gift className="w-5 h-5" />
          <span>{isEn ? 'Register as Ambassador' : "S'inscrire comme ambassadeur"}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
