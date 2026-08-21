import React, { useState } from 'react';
import { GraduationCapIcon, SparklesIcon as Sparkles, XIcon as X, SendIcon as Send, CheckCircle2Icon as CheckCircle2 } from './Icons';

interface EntranceModalProps {
  onOpenConcoursForm: () => void;
}

export default function EntranceModal({ onOpenConcoursForm }: EntranceModalProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const handleAction = () => {
    onOpenConcoursForm();
  };

  return (
    <div className="fixed bottom-6 left-6 z-[200] font-sans">
      {/* ── 1. POP-UP / CARTE D'ANNONCE EXPANSIONNELLE ── */}
      {(isOpen || isHovered) && (
        <div 
          className="absolute bottom-16 left-0 w-[310px] sm:w-[360px] bg-white dark:bg-bg-secondary text-text-primary p-5 rounded-3xl shadow-2xl border-2 border-rose-500/50 dark:border-rose-500/40 animate-in fade-in slide-in-from-bottom-4 duration-300"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Header de la carte d'annonce */}
          <div className="flex items-start justify-between gap-2 border-b border-border-primary/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <span className="text-[11px] font-black tracking-wider uppercase text-rose-700 dark:text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                Concours Officiel 2026-2027
              </span>
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); setIsHovered(false); }}
              className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-bg-primary transition-all cursor-pointer"
              title="Fermer l'annonce"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Corps de l'annonce */}
          <div className="py-3 space-y-2">
            <h4 className="font-extrabold text-sm sm:text-base text-text-primary leading-snug">
              2026-2027 ONSITE AND ONLINE ADMISSION CONCOURS IDLA FOR AFRICA
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Les candidatures au Concours Direct International IDLA sont ouvertes pour l'ensemble des pays d'Afrique (Présentiel & Formation en Ligne).
            </p>

            <div className="bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-2xl flex items-center justify-between text-xs font-bold text-rose-800 dark:text-rose-300">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-rose-600" />
                <span>Sessions Présentiel & En Ligne</span>
              </span>
              <span className="bg-white dark:bg-bg-primary px-2.5 py-0.5 rounded-lg text-[11px] border border-rose-500/20 font-black text-rose-600 dark:text-rose-400">
                Candidatures Ouvertes
              </span>
            </div>
          </div>

          {/* Bouton d'action direct vers le formulaire (ROUGE) */}
          <div className="pt-1">
            <button
              onClick={handleAction}
              className="w-full bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-700 hover:to-red-800 text-white font-extrabold text-xs px-4 py-3 rounded-2xl transition-all shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 flex items-center justify-center gap-2 cursor-pointer group"
            >
              <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              <span>S'inscrire au Concours Direct</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 2. CERCLE FLOTTANT ANIME DANS LE COIN BAS GAUCHE (BOUTON ROUGE A VAGUES ONDULATOIRES) ── */}
      <div 
        className="relative group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onClick={() => {
          setIsOpen(!isOpen);
          handleAction();
        }}
      >
        {/* Vagues Ondulatoires Répétées ROUGES (Radar Waves Ripple Effect) */}
        <span className="absolute -inset-2 rounded-full bg-rose-500/40 animate-ping opacity-75"></span>
        <span className="absolute -inset-4 rounded-full bg-rose-400/20 animate-pulse"></span>
        <span className="absolute -inset-6 rounded-full border border-rose-500/30 animate-ping duration-1000"></span>

        {/* Bouton Cercle Principal Clignotant ROUGE */}
        <div className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-rose-600 via-red-600 to-amber-500 text-white flex items-center justify-center shadow-[0_0_25px_rgba(244,63,94,0.7)] border-2 border-white dark:border-bg-secondary transform transition-all duration-300 group-hover:scale-110">
          <GraduationCapIcon className="w-7 h-7 text-white animate-pulse" />
          
          {/* Badge Clignotant d'Alerte Nouveauté */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-90"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-white dark:border-bg-secondary"></span>
          </span>
        </div>

        {/* Tooltip au survol */}
        <div className="absolute left-16 top-3 bg-slate-900 text-white text-[11px] font-extrabold px-3 py-1 rounded-xl whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden sm:block">
          Concours IDLA 2026-2027 • Inscrivez-vous !
        </div>
      </div>
    </div>
  );
}
