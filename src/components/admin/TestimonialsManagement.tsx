import React, { useState } from 'react';
import { Quote, Pencil, Trash2, CheckCircle2, XCircle, X } from 'lucide-react';
import { Testimonial } from '../../types';
import { databases, APPWRITE_CONFIG, isAppwriteDbConfigured } from '../../lib/appwrite';

interface TestimonialsManagementProps {
  testimonials: Testimonial[];
  setTestimonials: React.Dispatch<React.SetStateAction<Testimonial[]>>;
  pendingTestimonials: Testimonial[];
  setPendingTestimonials: React.Dispatch<React.SetStateAction<Testimonial[]>>;
  logActivity: (type: 'registration' | 'article' | 'error' | 'alumni', user: string, text: string) => Promise<void>;
}

export default function TestimonialsManagement({
  testimonials,
  setTestimonials,
  pendingTestimonials,
  setPendingTestimonials,
  logActivity,
}: TestimonialsManagementProps) {
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);

  const handleApproveTestimonial = async (id: string) => {
    const target = pendingTestimonials.find((t) => t.id === id);
    if (!target) return;
    const approved: Testimonial = {
      ...target,
      id: `test-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    setPendingTestimonials((curr) => curr.filter((t) => t.id !== id));
    setTestimonials((curr) => [approved, ...curr]);

    if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.testimonials) {
      try {
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.testimonials,
          approved.id,
          {
            name: approved.name,
            role: approved.role,
            text: approved.text,
            image: approved.image,
            promo: approved.promo,
            category: approved.category,
          }
        );
      } catch (err) {
        console.error("Échec de la publication du témoignage sur Appwrite:", err);
      }
    }
    logActivity('alumni', 'Super Admin', `a approuvé et publié le témoignage de ${target.name}.`);
  };

  const handleRejectTestimonial = (id: string) => {
    const target = pendingTestimonials.find((t) => t.id === id);
    setPendingTestimonials((curr) => curr.filter((t) => t.id !== id));
    if (target) {
      logActivity('error', 'Super Admin', `a rejeté le témoignage soumis par ${target.name}.`);
    }
  };

  const handleSaveEditedTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTestimonial) return;
    const edited = editingTestimonial;
    setTestimonials((curr) => curr.map((t) => (t.id === edited.id ? edited : t)));

    if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.testimonials) {
      try {
        await databases.updateDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.testimonials,
          edited.id,
          {
            name: edited.name,
            role: edited.role,
            text: edited.text,
            promo: edited.promo,
            category: edited.category,
          }
        );
      } catch (err) {
        console.error("Échec de la mise à jour du témoignage sur Appwrite:", err);
      }
    }
    logActivity('alumni', 'Super Admin', `a modifié le témoignage de ${edited.name}.`);
    setEditingTestimonial(null);
  };

  const handleDeleteTestimonial = async (id: string) => {
    const target = testimonials.find((t) => t.id === id);
    setTestimonials((curr) => curr.filter((t) => t.id !== id));

    if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.testimonials) {
      try {
        await databases.deleteDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.testimonials,
          id
        );
      } catch (err) {
        console.error("Échec de la suppression du témoignage sur Appwrite:", err);
      }
    }
    if (target) {
      logActivity('alumni', 'Super Admin', `a supprimé le témoignage de ${target.name}.`);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-sans font-bold text-lg text-[#00020e]">Témoignages</h3>
        <p className="text-xs text-slate-400 mt-1">
          Les alumni soumettent leurs témoignages via le site public. Approuvez-les pour les publier.
        </p>
      </div>

      {/* File de modération */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-[#00020e] uppercase tracking-wider flex items-center gap-2">
          En attente de modération
          {pendingTestimonials.length > 0 && (
            <span className="bg-amber-500/10 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {pendingTestimonials.length}
            </span>
          )}
        </h4>
        {pendingTestimonials.length === 0 ? (
          <p className="p-6 text-center text-xs text-slate-400 italic bg-white rounded-2xl border border-[#c6c6cf]">
            Aucune soumission en attente.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingTestimonials.map((t) => (
              <div
                key={t.id}
                className="bg-white p-5 rounded-2xl border border-amber-500/30 shadow-sm space-y-3"
              >
                <p className="text-xs text-[#0b1c30] italic leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-3 border-t border-[#c6c6cf]/30">
                  <img
                    className="w-9 h-9 rounded-full object-cover border border-[#c6c6cf]"
                    alt={t.name}
                    src={t.image}
                  />
                  <div className="flex-grow">
                    <h4 className="font-bold text-xs text-[#00020e]">{t.name}</h4>
                    <p className="text-[10px] text-slate-400">
                      {t.role} • {t.promo}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveTestimonial(t.id)}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approuver
                  </button>
                  <button
                    onClick={() => handleRejectTestimonial(t.id)}
                    className="flex-1 bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 text-[11px] font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Rejeter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Témoignages publiés */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-[#00020e] uppercase tracking-wider">
          Publiés sur le site ({testimonials.length})
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="bg-white p-6 rounded-2xl border border-[#c6c6cf] shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Quote className="w-6 h-6 text-[#006c49]" />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingTestimonial(t)}
                      title="Modifier"
                      className="text-slate-500 hover:text-[#006c49] p-1.5 hover:bg-slate-100 rounded transition-all"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTestimonial(t.id)}
                      title="Supprimer"
                      className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-[#0b1c30] italic leading-relaxed">"{t.text}"</p>
              </div>
              <div className="flex items-center gap-3 pt-4 mt-4 border-t border-[#c6c6cf]/30">
                <img
                  className="w-10 h-10 rounded-full object-cover border border-[#c6c6cf]"
                  alt={t.name}
                  src={t.image}
                />
                <div>
                  <h4 className="font-bold text-xs text-[#00020e]">{t.name}</h4>
                  <p className="text-[10px] text-slate-400">
                    {t.role} • {t.promo}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {testimonials.length === 0 && (
            <p className="col-span-full p-8 text-center text-slate-400 italic bg-white rounded-2xl border border-[#c6c6cf]">
              Aucun témoignage publié.
            </p>
          )}
        </div>
      </div>

      {/* MODALE — Édition d'un témoignage publié */}
      {editingTestimonial && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
          onClick={() => setEditingTestimonial(null)}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#c6c6cf]/40 bg-slate-50">
              <h3 className="font-bold text-base text-[#00020e]">Modifier le témoignage</h3>
              <button
                onClick={() => setEditingTestimonial(null)}
                className="text-slate-400 hover:text-[#00020e]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEditedTestimonial} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nom</label>
                  <input
                    type="text"
                    value={editingTestimonial.name}
                    onChange={(e) =>
                      setEditingTestimonial({ ...editingTestimonial, name: e.target.value })
                    }
                    className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Promotion</label>
                  <input
                    type="text"
                    value={editingTestimonial.promo}
                    onChange={(e) =>
                      setEditingTestimonial({ ...editingTestimonial, promo: e.target.value })
                    }
                    className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Fonction</label>
                <input
                  type="text"
                  value={editingTestimonial.role}
                  onChange={(e) =>
                    setEditingTestimonial({ ...editingTestimonial, role: e.target.value })
                  }
                  className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Témoignage</label>
                <textarea
                  value={editingTestimonial.text}
                  onChange={(e) =>
                    setEditingTestimonial({ ...editingTestimonial, text: e.target.value })
                  }
                  rows={4}
                  className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs"
                  required
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingTestimonial(null)}
                  className="px-5 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 border border-[#c6c6cf]/40"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-6 py-2.5 rounded-lg"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
