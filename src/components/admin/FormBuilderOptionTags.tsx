import React, { useState } from 'react';
import { PlusIcon as Plus, XIcon as X, ChevronUpIcon as ArrowUp, ChevronDownIcon as ArrowDown } from '../Icons';

interface FormBuilderOptionTagsProps {
  options: string[];
  onChange: (options: string[]) => void;
}

export default function FormBuilderOptionTags({ options, onChange }: FormBuilderOptionTagsProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !options.includes(trimmed)) {
      onChange([...options, trimmed]);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newOptions = [...options];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOptions.length) return;
    const temp = newOptions[index];
    newOptions[index] = newOptions[targetIndex];
    newOptions[targetIndex] = temp;
    onChange(newOptions);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Saisissez une option puis appuyez sur Entrée (ou +)"
          className="flex-1 p-2 rounded-lg border border-brand-primary/40 bg-bg-secondary text-text-primary text-xs font-medium focus:ring-2 focus:ring-brand-primary outline-none"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="bg-brand-primary disabled:opacity-40 hover:bg-brand-hover text-white px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      {/* Liste des badges style WhatsApp / Tags */}
      {options.length > 0 ? (
        <div className="flex flex-wrap gap-2 pt-1 p-2 bg-brand-primary/5 rounded-xl border border-brand-primary/20">
          {options.map((opt, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-semibold shadow-sm transition-all hover:bg-brand-hover group"
            >
              <span>{opt}</span>
              <div className="flex items-center gap-0.5 border-l border-white/20 pl-1.5">
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => handleMove(idx, 'up')}
                    className="hover:bg-white/20 p-0.5 rounded text-white/80 hover:text-white"
                    title="Monter"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                )}
                {idx < options.length - 1 && (
                  <button
                    type="button"
                    onClick={() => handleMove(idx, 'down')}
                    className="hover:bg-white/20 p-0.5 rounded text-white/80 hover:text-white"
                    title="Descendre"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="hover:bg-rose-500 p-0.5 rounded text-white/90 hover:text-white transition-colors"
                  title="Supprimer cette option"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-text-secondary italic">Aucune option ajoutée. Saisissez une option ci-dessus.</p>
      )}
    </div>
  );
}
