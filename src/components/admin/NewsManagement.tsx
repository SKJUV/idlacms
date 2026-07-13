import React, { useState } from 'react';
import { Plus, Newspaper, Pencil, Trash2 } from 'lucide-react';
import { NewsArticle } from '../../types';
import { databases, APPWRITE_CONFIG, isAppwriteDbConfigured } from '../../lib/appwrite';

interface NewsManagementProps {
  news: NewsArticle[];
  setNews: React.Dispatch<React.SetStateAction<NewsArticle[]>>;
  logActivity: (type: 'registration' | 'article' | 'error' | 'alumni', user: string, text: string) => Promise<void>;
}

export default function NewsManagement({
  news,
  setNews,
  logActivity,
}: NewsManagementProps) {
  const [showAddNewsForm, setShowAddNewsForm] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);

  // Form states
  const [newNewsTitle, setNewNewsTitle] = useState('');
  const [newNewsDescription, setNewNewsDescription] = useState('');
  const [newNewsCategory, setNewNewsCategory] = useState<'Événements' | 'Académique' | 'Partenariats' | 'Annonces' | 'Alumni'>('Annonces');

  const resetNewsForm = () => {
    setNewNewsTitle('');
    setNewNewsDescription('');
    setNewNewsCategory('Annonces');
    setEditingNewsId(null);
    setShowAddNewsForm(false);
  };

  const startEditNews = (n: NewsArticle) => {
    setEditingNewsId(n.id);
    setNewNewsTitle(n.title);
    setNewNewsDescription(n.description);
    setNewNewsCategory(n.category);
    setShowAddNewsForm(true);
  };

  const handleSubmitNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNewsTitle || !newNewsDescription) return;

    if (editingNewsId) {
      setNews((curr) =>
        curr.map((n) =>
          n.id === editingNewsId
            ? { ...n, title: newNewsTitle, description: newNewsDescription, category: newNewsCategory }
            : n
        )
      );
      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.news) {
        try {
          await databases.updateDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.news,
            editingNewsId,
            { title: newNewsTitle, description: newNewsDescription, category: newNewsCategory }
          );
        } catch (err) {
          console.error("Échec de la mise à jour de l'actualité sur Appwrite:", err);
        }
      }
      logActivity('article', 'Super Admin', `a modifié l'actualité : ${newNewsTitle}.`);
      resetNewsForm();
      return;
    }

    const id = `news-${Math.floor(1000 + Math.random() * 9000)}`;
    const newArticle: NewsArticle = {
      id,
      title: newNewsTitle,
      description: newNewsDescription,
      date: new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      category: newNewsCategory,
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    };

    setNews((curr) => [newArticle, ...curr]);

    if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.news) {
      try {
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.news,
          id,
          {
            title: newArticle.title,
            description: newArticle.description,
            date: new Date().toISOString(),
            category: newArticle.category,
            image: newArticle.image,
          }
        );
      } catch (err) {
        console.error("Échec de la création de l'actualité sur Appwrite:", err);
      }
    }

    logActivity('article', 'Super Admin', `a publié l'actualité : ${newNewsTitle}.`);
    
    const subscribers = JSON.parse(localStorage.getItem('newsletter_subscribers') || '[]');
    if (subscribers.length > 0) {
      logActivity(
        'registration',
        'Système Mailer',
        `a envoyé une notification email de réussite à ${subscribers.length} abonnés pour : "${newNewsTitle}".`
      );
    }

    resetNewsForm();
  };

  const handleDeleteNews = async (id: string) => {
    const target = news.find((n) => n.id === id);
    setNews((curr) => curr.filter((n) => n.id !== id));

    if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.news) {
      try {
        await databases.deleteDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.news,
          id
        );
      } catch (err) {
        console.error("Échec de la suppression de l'actualité sur Appwrite:", err);
      }
    }
    if (target) {
      logActivity('article', 'Super Admin', `a supprimé l'actualité : ${target.title}.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-sans font-bold text-lg text-[#00020e]">Actualités & communiqués</h3>
        <button
          onClick={() => (showAddNewsForm ? resetNewsForm() : setShowAddNewsForm(true))}
          className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow"
        >
          <Plus className="w-4 h-4" />
          {showAddNewsForm ? 'Fermer le formulaire' : 'Publier une actualité'}
        </button>
      </div>

      {showAddNewsForm && (
        <form
          onSubmit={handleSubmitNews}
          className="bg-white border border-[#c6c6cf] rounded-2xl p-6 space-y-4 shadow-sm"
        >
          <p className="text-sm font-bold text-[#00020e]">
            {editingNewsId ? "Modifier l'actualité" : 'Nouvelle actualité'}
          </p>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Titre *</label>
            <input
              type="text"
              value={newNewsTitle}
              onChange={(e) => setNewNewsTitle(e.target.value)}
              placeholder="ex: Ouverture des inscriptions 2026"
              className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-medium"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Description *</label>
            <textarea
              value={newNewsDescription}
              onChange={(e) => setNewNewsDescription(e.target.value)}
              rows={3}
              className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-medium"
              required
            />
          </div>
          <div className="space-y-1.5 md:w-1/2">
            <label className="text-xs font-bold text-slate-500 uppercase">Catégorie</label>
            <select
              value={newNewsCategory}
              onChange={(e) => setNewNewsCategory(e.target.value as any)}
              className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-bold text-[#00020e]"
            >
              <option value="Annonces">Annonces</option>
              <option value="Événements">Événements</option>
              <option value="Académique">Académique</option>
              <option value="Partenariats">Partenariats</option>
              <option value="Alumni">Alumni</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-[#c6c6cf]/30">
            <button
              type="button"
              onClick={resetNewsForm}
              className="px-5 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 border border-[#c6c6cf]/40 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-6 py-2.5 rounded-lg transition-all"
            >
              {editingNewsId ? 'Mettre à jour' : "Publier l'actualité"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-[#c6c6cf] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-400 border-b border-[#c6c6cf]/30 font-bold uppercase">
              <th className="p-4">Titre</th>
              <th className="p-4">Catégorie</th>
              <th className="p-4">Date</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#c6c6cf]/20">
            {news.map((n) => (
              <tr key={n.id} className="hover:bg-slate-50/40">
                <td className="p-4 font-semibold text-[#00020e]">
                  <div className="flex items-center gap-2">
                    <Newspaper className="w-3.5 h-3.5 text-[#006c49] shrink-0" />
                    <span className="line-clamp-1">{n.title}</span>
                  </div>
                </td>
                <td className="p-4 font-medium text-slate-600">{n.category}</td>
                <td className="p-4 text-slate-400">{n.date}</td>
                <td className="p-4">
                  <div className="flex justify-center items-center gap-1">
                    <button
                      onClick={() => startEditNews(n)}
                      title="Modifier"
                      className="text-slate-500 hover:text-[#006c49] p-1.5 hover:bg-slate-100 rounded transition-all"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteNews(n.id)}
                      title="Supprimer"
                      className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {news.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400 italic">
                  Aucune actualité publiée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
