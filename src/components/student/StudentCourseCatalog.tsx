import React, { useState, useMemo } from 'react';
import { Program } from '../../types';
import { SearchIcon, BookOpenIcon, ClockIcon } from '../Icons';
import ProgramFilterBar, { FilterState, INITIAL_FILTER_STATE, applyProgramFilters } from '../ProgramFilterBar';

interface StudentCourseCatalogProps {
  programs: Program[];
  onApplyProgram: (programTitle: string) => void;
}

export default function StudentCourseCatalog({ programs, onApplyProgram }: StudentCourseCatalogProps) {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTER_STATE);

  const filteredPrograms = useMemo(() => {
    return applyProgramFilters(programs, filters);
  }, [programs, filters]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-border-primary/50 pb-4">
        <h1 className="text-xl font-bold text-text-primary">Catalogue Général des Formations IDLA</h1>
        <p className="text-xs text-text-secondary mt-0.5">
          Découvrez l'ensemble de nos cursus Master, Bachelor, Doctorat et Certifications professionnelles.
        </p>
      </div>

      {/* Filter Bar Component */}
      <ProgramFilterBar
        filters={filters}
        onFilterChange={(updater) => setFilters(updater)}
        onReset={() => setFilters(INITIAL_FILTER_STATE)}
        totalResults={filteredPrograms.length}
      />

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrograms.map((program) => (
          <div
            key={program.id}
            className="bg-bg-secondary border border-border-primary rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="relative h-44 overflow-hidden bg-border-primary/30">
                <img
                  src={program.image}
                  alt={program.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="px-2.5 py-1 bg-brand-primary text-white font-bold text-[10px] uppercase rounded-full shadow">
                    {program.type}
                  </span>
                  <span className="px-2.5 py-1 bg-bg-secondary/90 text-text-primary font-bold text-[10px] uppercase rounded-full shadow backdrop-blur-md">
                    {program.category}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <h3 className="font-bold text-base text-text-primary line-clamp-1">{program.title}</h3>
                <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">{program.description}</p>
                <div className="flex items-center gap-4 text-xs text-text-secondary pt-1">
                  <div className="flex items-center gap-1.5">
                    <ClockIcon className="w-4 h-4 text-brand-primary" />
                    <span>{program.duration}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 pt-0">
              <button
                onClick={() => onApplyProgram(program.title)}
                className="w-full bg-brand-primary hover:bg-brand-hover text-white py-2.5 rounded-xl font-bold text-xs transition-all shadow cursor-pointer text-center block"
              >
                Postuler à cette formation →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
