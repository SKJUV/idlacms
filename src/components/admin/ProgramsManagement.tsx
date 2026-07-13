import React, { useState } from 'react';
import { Plus, BookOpen, Pencil, Trash2 } from 'lucide-react';
import { Program } from '../../types';
import { databases, APPWRITE_CONFIG, isAppwriteDbConfigured } from '../../lib/appwrite';

interface ProgramsManagementProps {
  programs: Program[];
  setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
  logActivity: (type: 'registration' | 'article' | 'error' | 'alumni', user: string, text: string) => Promise<void>;
}

export default function ProgramsManagement({
  programs,
  setPrograms,
  logActivity,
}: ProgramsManagementProps) {
  const [showAddProgramForm, setShowAddProgramForm] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);

  // New Program Form States
  const [newProgramTitle, setNewProgramTitle] = useState('');
  const [newProgramDescription, setNewProgramDescription] = useState('');
  const [newProgramType, setNewProgramType] = useState<'Master' | 'Doctorat' | 'Certification' | 'Bachelor'>('Master');
  const [newProgramCategory, setNewProgramCategory] = useState<'Sciences' | 'Management' | 'Tech' | 'Droit' | 'Santé' | 'Communication'>('Tech');
  const [newProgramDuration, setNewProgramDuration] = useState('2 ans (Full-time)');
  const [newProgramImage, setNewProgramImage] = useState('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80');
  const [newProgramIsNew, setNewProgramIsNew] = useState(true);

  const resetProgramForm = () => {
    setNewProgramTitle('');
    setNewProgramDescription('');
    setNewProgramType('Master');
    setNewProgramCategory('Tech');
    setNewProgramDuration('2 ans (Full-time)');
    setNewProgramImage('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80');
    setNewProgramIsNew(true);
    setEditingProgramId(null);
    setShowAddProgramForm(false);
  };

  const startEditProgram = (p: Program) => {
    setEditingProgramId(p.id);
    setNewProgramTitle(p.title);
    setNewProgramDescription(p.description);
    setNewProgramType(p.type);
    setNewProgramCategory(p.category);
    setNewProgramDuration(p.duration);
    setNewProgramImage(p.image);
    setNewProgramIsNew(!!p.isNew);
    setShowAddProgramForm(true);
  };

  const handleSubmitProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgramTitle || !newProgramDescription) return;

    if (editingProgramId) {
      const updated: Partial<Program> = {
        title: newProgramTitle,
        description: newProgramDescription,
        type: newProgramType,
        category: newProgramCategory,
        duration: newProgramDuration,
        image: newProgramImage,
        isNew: newProgramIsNew,
      };
      setPrograms((curr) =>
        curr.map((p) => (p.id === editingProgramId ? { ...p, ...updated } : p))
      );
      if (isAppwriteDbConfigured()) {
        try {
          await databases.updateDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.programs,
            editingProgramId,
            updated as any
          );
        } catch (err) {
          console.error("Échec de la mise à jour du programme sur Appwrite:", err);
        }
      }
      logActivity('article', 'Super Admin', `a modifié le programme : ${newProgramTitle}.`);
      resetProgramForm();
      return;
    }

    const progId = `prog-${Math.floor(1000 + Math.random() * 9500)}`;
    const newProgram: Program = {
      id: progId,
      title: newProgramTitle,
      description: newProgramDescription,
      type: newProgramType,
      category: newProgramCategory,
      duration: newProgramDuration,
      image: newProgramImage,
      isNew: newProgramIsNew,
    };

    setPrograms((curr) => [newProgram, ...curr]);

    if (isAppwriteDbConfigured()) {
      try {
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.programs,
          progId,
          {
            title: newProgram.title,
            description: newProgram.description,
            type: newProgram.type,
            category: newProgram.category,
            duration: newProgram.duration,
            image: newProgram.image,
            isNew: newProgram.isNew,
          }
        );
      } catch (err) {
        console.error("Échec de création du programme sur Appwrite:", err);
      }
    }

    logActivity('article', 'Super Admin', `a ajouté un nouveau programme : ${newProgramTitle}.`);
    resetProgramForm();
  };

  const handleDeleteProgram = async (id: string) => {
    const targetProgram = programs.find((p) => p.id === id);
    setPrograms((curr) => curr.filter((p) => p.id !== id));

    if (isAppwriteDbConfigured()) {
      try {
        await databases.deleteDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.programs,
          id
        );
      } catch (err) {
        console.error("Échec de la suppression du programme sur Appwrite:", err);
      }
    }

    if (targetProgram) {
      logActivity('error', 'Super Admin', `a supprimé le programme : ${targetProgram.title}.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-sans font-bold text-lg text-[#00020e]">Programmes académiques IDLA</h3>
        <button
          onClick={() => (showAddProgramForm ? resetProgramForm() : setShowAddProgramForm(true))}
          className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow"
        >
          <Plus className="w-4 h-4" />
          {showAddProgramForm ? 'Fermer le formulaire' : 'Ajouter un programme'}
        </button>
      </div>

      {showAddProgramForm && (
        <form
          onSubmit={handleSubmitProgram}
          className="bg-white border border-[#c6c6cf] rounded-2xl p-6 space-y-4 shadow-sm"
        >
          <p className="text-sm font-bold text-[#00020e]">
            {editingProgramId ? 'Modifier le programme' : 'Nouveau programme'}
          </p>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Titre du programme *</label>
            <input
              type="text"
              value={newProgramTitle}
              onChange={(e) => setNewProgramTitle(e.target.value)}
              placeholder="ex: Master en Cybersécurité"
              className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-medium"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Description *</label>
            <textarea
              value={newProgramDescription}
              onChange={(e) => setNewProgramDescription(e.target.value)}
              placeholder="Description courte du programme"
              rows={3}
              className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Type *</label>
              <select
                value={newProgramType}
                onChange={(e) => setNewProgramType(e.target.value as any)}
                className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-bold text-[#00020e]"
              >
                <option value="Master">Master</option>
                <option value="Doctorat">Doctorat</option>
                <option value="Certification">Certification</option>
                <option value="Bachelor">Bachelor</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Catégorie *</label>
              <select
                value={newProgramCategory}
                onChange={(e) => setNewProgramCategory(e.target.value as any)}
                className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-bold text-[#00020e]"
              >
                <option value="Sciences">Sciences</option>
                <option value="Management">Management</option>
                <option value="Tech">Tech</option>
                <option value="Droit">Droit</option>
                <option value="Santé">Santé</option>
                <option value="Communication">Communication</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Durée *</label>
              <input
                type="text"
                value={newProgramDuration}
                onChange={(e) => setNewProgramDuration(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-medium"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">URL Image *</label>
              <input
                type="text"
                value={newProgramImage}
                onChange={(e) => setNewProgramImage(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-medium"
                required
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
            <input
              type="checkbox"
              checked={newProgramIsNew}
              onChange={(e) => setNewProgramIsNew(e.target.checked)}
              className="w-4 h-4 text-[#006c49] border-[#c6c6cf] rounded focus:ring-[#006c49]"
            />
            Marquer comme "Nouveau"
          </label>

          <div className="pt-4 flex justify-end gap-3 border-t border-[#c6c6cf]/30">
            <button
              type="button"
              onClick={resetProgramForm}
              className="px-5 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 border border-[#c6c6cf]/40 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-6 py-2.5 rounded-lg transition-all"
            >
              {editingProgramId ? 'Mettre à jour' : 'Enregistrer le programme'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-[#c6c6cf] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-400 border-b border-[#c6c6cf]/30 font-bold uppercase">
              <th className="p-4">Programme</th>
              <th className="p-4">Type</th>
              <th className="p-4">Catégorie</th>
              <th className="p-4">Durée</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#c6c6cf]/20">
            {programs.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/40">
                <td className="p-4 font-semibold text-[#00020e]">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-[#006c49] shrink-0" />
                    <span>{p.title}</span>
                    {p.isNew && (
                      <span className="bg-[#006c49]/10 text-[#006c49] text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                        Nouveau
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4 font-medium text-slate-600">{p.type}</td>
                <td className="p-4 font-medium text-slate-600">{p.category}</td>
                <td className="p-4 text-slate-400">{p.duration}</td>
                <td className="p-4">
                  <div className="flex justify-center items-center gap-1">
                    <button
                      onClick={() => startEditProgram(p)}
                      className="text-slate-500 hover:text-[#006c49] p-1.5 hover:bg-slate-100 rounded transition-all"
                      title="Modifier le programme"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProgram(p.id)}
                      className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded transition-all"
                      title="Supprimer le programme"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {programs.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                  Aucun programme enregistré.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
