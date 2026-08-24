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
        <h3 className="font-sans font-bold text-lg text-text-primary">Témoignages</h3>
        <p className="text-xs text-text-secondary mt-1">
          Les alumni soumettent leurs témoignages via le site public. Approuvez-les pour les publier.
        </p>
      </div>

      {/* File de modération */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
          En attente de modération
          {pendingTestimonials.length > 0 && (
            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {pendingTestimonials.length}
            </span>
          )}
        </h4>
        {pendingTestimonials.length === 0 ? (
          <p className="p-6 text-center text-xs text-text-secondary italic bg-bg-secondary rounded-2xl border border-border-primary">
            Aucune soumission en attente.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingTestimonials.map((t) => (
              <div
                key={t.id}
                className="bg-bg-secondary p-5 rounded-2xl border border-amber-500/30 shadow-sm space-y-3"
              >
                <p className="text-xs text-text-primary italic leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-3 border-t border-border-primary/40">
                  <img
                    className="w-9 h-9 rounded-full object-cover border border-border-primary"
                    alt={t.name}
                    src={t.image}
                  />
                  <div className="flex-grow">
                    <h4 className="font-bold text-xs text-text-primary">{t.name}</h4>
                    <p className="text-[10px] text-text-secondary">
                      {t.role} • {t.promo}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveTestimonial(t.id)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approuver
                  </button>
                  <button
                    onClick={() => handleRejectTestimonial(t.id)}
                    className="flex-1 bg-bg-primary border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[11px] font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
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
        <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
          Publiés sur le site ({testimonials.length})
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="bg-bg-secondary p-6 rounded-2xl border border-border-primary shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Quote className="w-6 h-6 text-brand-primary" />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingTestimonial(t)}
                      title="Modifier"
                      className="text-text-secondary hover:text-brand-primary p-1.5 hover:bg-bg-primary rounded transition-all cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTestimonial(t.id)}
                      title="Supprimer"
                      className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-text-primary italic leading-relaxed">"{t.text}"</p>
              </div>
              <div className="flex items-center gap-3 pt-4 mt-4 border-t border-border-primary/40">
                <img
                  className="w-10 h-10 rounded-full object-cover border border-border-primary"
                  alt={t.name}
                  src={t.image}
                />
                <div>
                  <h4 className="font-bold text-xs text-text-primary">{t.name}</h4>
                  <p className="text-[10px] text-text-secondary">
                    {t.role} • {t.promo}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {testimonials.length === 0 && (
            <p className="col-span-full p-8 text-center text-text-secondary italic bg-bg-secondary rounded-2xl border border-border-primary">
              Aucun témoignage publié.
            </p>
          )}
        </div>
      </div>

      {/* MODALE — Édition d'un témoignage publié */}
      {editingTestimonial && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setEditingTestimonial(null)}
        >
          <div
            className="bg-bg-secondary border border-border-primary w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary/50 bg-bg-primary">
              <h3 className="font-bold text-base text-text-primary">Modifier le témoignage</h3>
              <button
                onClick={() => setEditingTestimonial(null)}
                className="text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEditedTestimonial} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">Nom</label>
                  <input
                    type="text"
                    value={editingTestimonial.name}
                    onChange={(e) =>
                      setEditingTestimonial({ ...editingTestimonial, name: e.target.value })
                    }
                    className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">Promotion</label>
                  <input
                    type="text"
                    value={editingTestimonial.promo}
                    onChange={(e) =>
                      setEditingTestimonial({ ...editingTestimonial, promo: e.target.value })
                    }
                    className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary uppercase">Fonction</label>
                <input
                  type="text"
                  value={editingTestimonial.role}
                  onChange={(e) =>
                    setEditingTestimonial({ ...editingTestimonial, role: e.target.value })
                  }
                  className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary uppercase">Témoignage</label>
                <textarea
                  value={editingTestimonial.text}
                  onChange={(e) =>
                    setEditingTestimonial({ ...editingTestimonial, text: e.target.value })
                  }
                  rows={4}
                  className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs"
                  required
                />
              </div>
              <div className="pt-2 flex justify-end gap-3 border-t border-border-primary/50">
                <button
                  type="button"
                  onClick={() => setEditingTestimonial(null)}
                  className="px-5 py-2 rounded-lg text-xs font-bold text-text-secondary hover:bg-bg-primary border border-border-primary cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md cursor-pointer transition-all"
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
