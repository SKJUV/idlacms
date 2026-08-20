import React from 'react';
import { SearchIcon, FilterIcon, RotateCcwIcon, BookOpenIcon, GraduationCapIcon, LayersIcon, ClockIcon, SparklesIcon } from './Icons';
import { SlidersHorizontal, Check, X } from 'lucide-react';

export interface FilterState {
  search: string;
  type: string;
  category: string;
  level: string;
  duration: string;
}

export const INITIAL_FILTER_STATE: FilterState = {
  search: '',
  type: 'Tous',
  category: 'Tous',
  level: 'Tous',
  duration: 'Toutes',
};

export const PROGRAM_TYPES = ['Tous', 'Bachelor', 'Master', 'Doctorat', 'Certification'];

export const PROGRAM_CATEGORIES = [
  'Tous',
  'Tech',
  'Management',
  'Santé',
  'Comptabilité',
  'Droit',
  'Sciences',
  'Communication'
];

export const PROGRAM_LEVELS = ['Tous', 'Débutant', 'Intermédiaire', 'Avancé'];

export const PROGRAM_DURATIONS = [
  { label: 'Toutes durées', value: 'Toutes', step: 0 },
  { label: 'Courte (< 6 mois)', value: 'courte', step: 1 },
  { label: '1 - 2 ans', value: 'moyenne', step: 2 },
  { label: '3 ans et +', value: 'longue', step: 3 },
];

interface ProgramFilterBarProps {
  filters: FilterState;
  onFilterChange: (updater: (prev: FilterState) => FilterState) => void;
  onReset: () => void;
  totalResults?: number;
  className?: string;
  variant?: 'hero' | 'standard' | 'compact';
  layout?: 'sidebar' | 'top';
}

export default function ProgramFilterBar({
  filters,
  onFilterChange,
  onReset,
  totalResults,
  className = '',
  layout = 'sidebar',
}: ProgramFilterBarProps) {
  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.type !== 'Tous' ||
    filters.category !== 'Tous' ||
    filters.level !== 'Tous' ||
    filters.duration !== 'Toutes';

  const activeCount = [
    filters.search.trim() !== '',
    filters.type !== 'Tous',
    filters.category !== 'Tous',
    filters.level !== 'Tous',
    filters.duration !== 'Toutes',
  ].filter(Boolean).length;

  // Calcul de la valeur numérique du slider de durée
  const currentDurationStep = PROGRAM_DURATIONS.find(d => d.value === filters.duration)?.step || 0;

  const handleDurationSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    const found = PROGRAM_DURATIONS.find(d => d.step === val) || PROGRAM_DURATIONS[0];
    onFilterChange(prev => ({ ...prev, duration: found.value }));
  };

  // ════════════════════════════════════════════════════════════════════════════
  // SIDEBAR LAYOUT (Style Hugging Face : Pills, Tags & Barres de dimensionnement)
  // ════════════════════════════════════════════════════════════════════════════
  if (layout === 'sidebar') {
    return (
      <div className={`bg-bg-secondary border border-border-primary rounded-2xl p-5 shadow-sm space-y-6 ${className}`}>
        {/* Header & Reset */}
        <div className="flex items-center justify-between pb-4 border-b border-border-primary/60">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-brand-primary" />
            <h3 className="font-sans font-bold text-sm text-text-primary uppercase tracking-wider">Filtres & Cursus</h3>
          </div>
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1"
            >
              <RotateCcwIcon className="w-3 h-3" /> Reset {activeCount > 0 && `(${activeCount})`}
            </button>
          )}
        </div>

        {/* Barre de Recherche rapide */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Rechercher</label>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary/60 pointer-events-none" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onFilterChange((prev) => ({ ...prev, search: e.target.value }))}
              placeholder="Spécialité, mot-clé, diplôme..."
              className="w-full bg-bg-primary border border-border-primary rounded-xl pl-9 pr-7 py-2 text-xs text-text-primary placeholder:text-text-secondary/50 outline-none focus:ring-2 focus:ring-brand-primary font-medium"
            />
            {filters.search && (
              <button
                onClick={() => onFilterChange((prev) => ({ ...prev, search: '' }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary text-[10px] font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Section 1 : Types de Cursus (Pill Chips) */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <GraduationCapIcon className="w-3.5 h-3.5 text-brand-primary" />
            Type de Cursus
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PROGRAM_TYPES.map((t) => {
              const isSelected = filters.type === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => onFilterChange((prev) => ({ ...prev, type: isSelected && t !== 'Tous' ? 'Tous' : t }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? 'bg-brand-primary text-white border-brand-primary shadow-sm font-bold'
                      : 'bg-bg-primary hover:bg-border-primary/40 border-border-primary/70 text-text-primary'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                  {t === 'Tous' ? 'Tous les types' : t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2 : Domaines & Disciplines (Pill Chips) */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <BookOpenIcon className="w-3.5 h-3.5 text-brand-primary" />
            Domaines d'Études
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PROGRAM_CATEGORIES.map((cat) => {
              const isSelected = filters.category === cat;
              const labelText = cat === 'Tous' ? 'Tous les domaines' : cat === 'Tech' ? 'Informatique & Tech' : cat === 'Management' ? 'Business & Mgmt' : cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onFilterChange((prev) => ({ ...prev, category: isSelected && cat !== 'Tous' ? 'Tous' : cat }))}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? 'bg-brand-primary text-white border-brand-primary shadow-sm font-bold'
                      : 'bg-bg-primary hover:bg-border-primary/40 border-border-primary/70 text-text-primary'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                  {labelText}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3 : Barre de Dimensionnement / Durée (Range Slider Hugging Face Style) */}
        <div className="space-y-3 pt-2 border-t border-border-primary/50">
          <div className="flex items-center justify-between text-[10px] font-bold text-text-secondary uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <ClockIcon className="w-3.5 h-3.5 text-brand-primary" /> Durée de Formation
            </span>
            <span className="text-brand-primary font-bold text-xs">
              {PROGRAM_DURATIONS.find(d => d.value === filters.duration)?.label || 'Toutes'}
            </span>
          </div>

          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="3"
              step="1"
              value={currentDurationStep}
              onChange={handleDurationSliderChange}
              className="w-full accent-brand-primary cursor-pointer h-2 bg-border-primary rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[9px] font-mono text-text-secondary/70 font-semibold px-0.5">
              <span>Toutes</span>
              <span>&lt; 6 mois</span>
              <span>1 - 2 ans</span>
              <span>3+ ans</span>
            </div>
          </div>
        </div>

        {/* Section 4 : Niveau d'accès requis (Pill Chips) */}
        <div className="space-y-2.5 pt-2 border-t border-border-primary/50">
          <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <LayersIcon className="w-3.5 h-3.5 text-brand-primary" />
            Niveau Requis
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PROGRAM_LEVELS.map((lvl) => {
              const isSelected = filters.level === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => onFilterChange((prev) => ({ ...prev, level: isSelected && lvl !== 'Tous' ? 'Tous' : lvl }))}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? 'bg-brand-primary text-white border-brand-primary shadow-sm font-bold'
                      : 'bg-bg-primary hover:bg-border-primary/40 border-border-primary/70 text-text-primary'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                  {lvl === 'Tous' ? 'Tous niveaux' : lvl}
                </button>
              );
            })}
          </div>
        </div>

        {totalResults !== undefined && (
          <div className="pt-3 border-t border-border-primary/50 text-center">
            <span className="text-xs font-bold text-text-secondary">
              {totalResults} programme{totalResults > 1 ? 's' : ''} disponible{totalResults > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // TOP BAR LAYOUT (Rétrocompatibilité)
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className={`bg-bg-secondary border border-border-primary rounded-2xl p-4 md:p-5 shadow-sm space-y-4 transition-all ${className}`}>
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/60 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="Rechercher par mot-clé, spécialité ou domaine..."
            className="w-full bg-bg-primary border border-border-primary rounded-xl pl-10 pr-9 py-2.5 text-sm text-text-primary outline-none focus:ring-2 focus:ring-brand-primary font-medium"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange((prev) => ({ ...prev, search: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl border border-red-200 cursor-pointer"
          >
            <RotateCcwIcon className="w-3.5 h-3.5" /> Réinitialiser
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-border-primary/50">
        {PROGRAM_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onFilterChange((prev) => ({ ...prev, type: prev.type === t && t !== 'Tous' ? 'Tous' : t }))}
            className={`px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer ${
              filters.type === t ? 'bg-brand-primary text-white border-brand-primary' : 'bg-bg-primary text-text-primary border-border-primary'
            }`}
          >
            {t === 'Tous' ? 'Tous types' : t}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Utility function to filter program array given a FilterState
 */
export function applyProgramFilters<T extends { title: string; description?: string; type?: string; category?: string; level?: string; duration?: string }>(
  programs: T[],
  filters: FilterState
): T[] {
  return programs.filter((p) => {
    // Search matching
    const q = filters.search.toLowerCase().trim();
    if (q) {
      const matchTitle = p.title?.toLowerCase().includes(q);
      const matchDesc = p.description?.toLowerCase().includes(q);
      const matchCategory = p.category?.toLowerCase().includes(q);
      const matchType = p.type?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCategory && !matchType) {
        return false;
      }
    }

    // Type matching
    if (filters.type !== 'Tous' && p.type) {
      if (p.type.toLowerCase().trim() !== filters.type.toLowerCase().trim()) {
        return false;
      }
    }

    // Category matching
    if (filters.category !== 'Tous' && p.category) {
      const catLower = p.category.toLowerCase().trim();
      const targetLower = filters.category.toLowerCase().trim();
      if (!catLower.includes(targetLower) && !targetLower.includes(catLower)) {
        return false;
      }
    }

    // Level matching
    if (filters.level !== 'Tous') {
      const calculatedLevel = p.level || 
        (p.type === 'Doctorat' || p.type === 'Master' ? 'Avancé' : 
         p.type === 'Bachelor' ? 'Intermédiaire' : 'Débutant');
      if (calculatedLevel !== filters.level) {
        return false;
      }
    }

    // Duration matching
    if (filters.duration !== 'Toutes') {
      const d = (p.duration || '').toLowerCase().trim();
      const target = filters.duration.toLowerCase().trim();

      if (target === '6 mois') {
        if (!d.includes('6 mois') && !d.includes('6m') && !d.includes('semaine') && !d.includes('certif') && !d.includes('court')) return false;
      } else if (target === '12 mois') {
        if (!d.includes('12 mois') && !d.includes('1 an') && !d.includes('1ans')) return false;
      } else if (target === '2 ans') {
        if (!d.includes('2 ans') && !d.includes('24 mois') && !d.includes('2ans')) return false;
      } else if (target === '3 ans+') {
        if (!d.includes('3 ans') && !d.includes('4 ans') && !d.includes('5 ans') && !d.includes('36 mois') && !d.includes('doctorat')) return false;
      } else if (!d.includes(target)) {
        return false;
      }
    }

    return true;
  });
}
