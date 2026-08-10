import React from 'react';
import { SearchIcon, FilterIcon, RotateCcwIcon, BookOpenIcon, GraduationCapIcon, LayersIcon, ClockIcon } from './Icons';

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

export const PROGRAM_TYPES = ['Tous', 'Bachelor', 'Master', 'Doctorat', 'Certification', 'Diplôme'];

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
  { label: 'Toutes durées', value: 'Toutes' },
  { label: 'Courte (< 6 mois)', value: 'courte' },
  { label: '1 - 2 ans', value: 'moyenne' },
  { label: '3 ans et +', value: 'longue' },
];

interface ProgramFilterBarProps {
  filters: FilterState;
  onFilterChange: (updater: (prev: FilterState) => FilterState) => void;
  onReset: () => void;
  totalResults?: number;
  className?: string;
  variant?: 'hero' | 'standard' | 'compact';
}

export default function ProgramFilterBar({
  filters,
  onFilterChange,
  onReset,
  totalResults,
  className = '',
  variant = 'standard'
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

  return (
    <div className={`bg-bg-secondary border border-border-primary rounded-2xl p-4 md:p-6 shadow-sm space-y-4 transition-all ${className}`}>
      {/* Upper row: Search input + Results Badge + Reset */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/60 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="Rechercher par mot-clé, spécialité, domaine ou certification..."
            className="w-full bg-bg-primary border border-border-primary rounded-xl pl-10 pr-9 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 outline-none focus:ring-2 focus:ring-brand-primary transition-all font-medium"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange((prev) => ({ ...prev, search: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary text-xs font-bold w-5 h-5 rounded-full bg-bg-secondary flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
          {totalResults !== undefined && (
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-brand-light text-brand-primary border border-brand-primary/20 whitespace-nowrap">
              {totalResults} {totalResults > 1 ? 'programmes trouvés' : 'programme trouvé'}
            </span>
          )}

          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/50 transition-all cursor-pointer shadow-sm"
              title="Réinitialiser tous les filtres"
            >
              <RotateCcwIcon className="w-3.5 h-3.5" />
              <span>Réinitialiser {activeCount > 0 && `(${activeCount})`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Select Dropdowns for Type, Category, Level, Duration */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-border-primary/50">
        {/* Type de diplôme */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1">
            <GraduationCapIcon className="w-3 h-3 text-brand-primary" /> Type de Diplôme
          </label>
          <select
            value={filters.type}
            onChange={(e) => onFilterChange((prev) => ({ ...prev, type: e.target.value }))}
            className="w-full bg-bg-primary border border-border-primary rounded-xl px-3 py-2 text-xs font-semibold text-text-primary outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
          >
            {PROGRAM_TYPES.map((t) => (
              <option key={t} value={t}>
                {t === 'Tous' ? 'Tous les types' : t}
              </option>
            ))}
          </select>
        </div>

        {/* Domaine / Catégorie */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1">
            <BookOpenIcon className="w-3 h-3 text-brand-primary" /> Domaine d'étude
          </label>
          <select
            value={filters.category}
            onChange={(e) => onFilterChange((prev) => ({ ...prev, category: e.target.value }))}
            className="w-full bg-bg-primary border border-border-primary rounded-xl px-3 py-2 text-xs font-semibold text-text-primary outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
          >
            {PROGRAM_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'Tous' ? 'Tous les domaines' : cat === 'Tech' ? 'Informatique & Tech' : cat === 'Management' ? 'Business & Management' : cat === 'Communication' ? 'Théologie & Philosophie' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Niveau */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1">
            <LayersIcon className="w-3 h-3 text-brand-primary" /> Niveau requis
          </label>
          <select
            value={filters.level}
            onChange={(e) => onFilterChange((prev) => ({ ...prev, level: e.target.value }))}
            className="w-full bg-bg-primary border border-border-primary rounded-xl px-3 py-2 text-xs font-semibold text-text-primary outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
          >
            {PROGRAM_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl === 'Tous' ? 'Tous les niveaux' : lvl}
              </option>
            ))}
          </select>
        </div>

        {/* Durée */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1">
            <ClockIcon className="w-3 h-3 text-brand-primary" /> Durée globale
          </label>
          <select
            value={filters.duration}
            onChange={(e) => onFilterChange((prev) => ({ ...prev, duration: e.target.value }))}
            className="w-full bg-bg-primary border border-border-primary rounded-xl px-3 py-2 text-xs font-semibold text-text-primary outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
          >
            {PROGRAM_DURATIONS.map((dur) => (
              <option key={dur.value} value={dur.value}>
                {dur.label}
              </option>
            ))}
          </select>
        </div>
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
      const d = (p.duration || '').toLowerCase();
      if (filters.duration === 'courte' && !d.includes('mois') && !d.includes('semaine') && !d.includes('certif')) {
        return false;
      }
      if (filters.duration === 'moyenne' && !d.includes('1 ans') && !d.includes('1.5 ans') && !d.includes('2 ans') && !d.includes('12 mois')) {
        return false;
      }
      if (filters.duration === 'longue' && !d.includes('3 ans') && !d.includes('4 ans') && !d.includes('5 ans') && !d.includes('36 mois')) {
        return false;
      }
    }

    return true;
  });
}
