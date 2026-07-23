import React, { useState, useRef } from 'react';
import { Plus, Newspaper, Pencil, Trash2, UploadCloud, X, ImageIcon } from 'lucide-react';
import { NewsArticle } from '../../types';
import { databases, storage, APPWRITE_CONFIG, isAppwriteDbConfigured, isAppwriteStorageConfigured, ID } from '../../lib/appwrite';

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

  // Image states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80';

  const resetNewsForm = () => {
    setNewNewsTitle('');
    setNewNewsDescription('');
    setNewNewsCategory('Annonces');
    setImageFile(null);
    setImagePreview('');
    setImageUrl('');
    setUploadError('');
    setEditingNewsId(null);
    setShowAddNewsForm(false);
  };

  const startEditNews = (n: NewsArticle) => {
    setEditingNewsId(n.id);
    setNewNewsTitle(n.title);
    setNewNewsDescription(n.description);
    setNewNewsCategory(n.category);
    setImagePreview(n.image || '');
    setImageUrl(n.image || '');
    setImageFile(null);
    setShowAddNewsForm(true);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Veuillez sélectionner un fichier image (JPG, PNG, WEBP…)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('L\'image ne doit pas dépasser 5 Mo.');
      return;
    }
    setUploadError('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageUrl('');
  };

  const uploadImageToAppwrite = async (file: File): Promise<string> => {
    if (!isAppwriteStorageConfigured()) {
      // Fallback: convert to base64 data URL (works without storage bucket)
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }
    const response = await storage.createFile(
      APPWRITE_CONFIG.buckets.documents,
      ID.unique(),
      file
    );
    // Build public preview URL
    const url = storage.getFileView(APPWRITE_CONFIG.buckets.documents, response.$id);
    return url.toString();
  };

  const handleSubmitNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNewsTitle || !newNewsDescription) return;

    setIsUploading(true);
    setUploadError('');

    // Determine final image URL
    let finalImage = imageUrl || imagePreview || DEFAULT_IMAGE;
    if (imageFile) {
      try {
        finalImage = await uploadImageToAppwrite(imageFile);
      } catch (err) {
        console.error('Échec upload image:', err);
        setUploadError('Échec du téléversement de l\'image. L\'image par défaut sera utilisée.');
        finalImage = DEFAULT_IMAGE;
      }
    }

    if (editingNewsId) {
      setNews((curr) =>
        curr.map((n) =>
          n.id === editingNewsId
            ? { ...n, title: newNewsTitle, description: newNewsDescription, category: newNewsCategory, image: finalImage }
            : n
        )
      );
      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.news) {
        try {
          await databases.updateDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.news,
            editingNewsId,
            { title: newNewsTitle, description: newNewsDescription, category: newNewsCategory, image: finalImage }
          );
        } catch (err) {
          console.error("Échec de la mise à jour de l'actualité sur Appwrite:", err);
        }
      }
      logActivity('article', 'Super Admin', `a modifié l'actualité : ${newNewsTitle}.`);
      setIsUploading(false);
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
      image: finalImage,
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

    setIsUploading(false);
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
        <h3 className="font-sans font-bold text-lg text-[#00020e]">Actualités &amp; communiqués</h3>
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
          className="bg-white border border-[#c6c6cf] rounded-2xl p-6 space-y-5 shadow-sm"
        >
          <p className="text-sm font-bold text-[#00020e]">
            {editingNewsId ? "Modifier l'actualité" : 'Nouvelle actualité'}
          </p>

          {/* Titre */}
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

          {/* Description */}
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

          {/* Catégorie */}
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

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Image de l'actualité</label>

            {/* Preview */}
            {imagePreview ? (
              <div className="relative w-full h-44 rounded-xl overflow-hidden border border-[#c6c6cf] group">
                <img
                  src={imagePreview}
                  alt="Aperçu"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview('');
                    setImageUrl('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow transition-all opacity-80 hover:opacity-100"
                  title="Supprimer l'image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[10px] px-3 py-1.5 font-semibold">
                  {imageFile ? imageFile.name : 'Image actuelle'}
                </div>
              </div>
            ) : (
              <div
                className="w-full h-36 border-2 border-dashed border-[#c6c6cf] rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#006c49] hover:bg-[#006c49]/5 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="w-8 h-8 text-slate-300" />
                <p className="text-xs font-semibold text-slate-400">Cliquez pour choisir une image</p>
                <p className="text-[10px] text-slate-300">JPG, PNG, WEBP — Max 5 Mo</p>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
            />

            {/* Upload button (shown when no preview) */}
            {!imagePreview && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-xs font-bold text-[#006c49] hover:underline"
              >
                <UploadCloud className="w-4 h-4" />
                Téléverser une image depuis l'ordinateur
              </button>
            )}

            {/* OR: URL fallback */}
            {!imageFile && (
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-medium">— ou collez une URL d'image —</p>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImagePreview(e.target.value);
                  }}
                  placeholder="https://exemple.com/image.jpg"
                  className="w-full p-2 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-medium text-slate-600"
                />
              </div>
            )}

            {/* Upload error */}
            {uploadError && (
              <p className="text-xs text-red-500 font-semibold">{uploadError}</p>
            )}
          </div>

          {/* Actions */}
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
              disabled={isUploading}
              className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-6 py-2.5 rounded-lg transition-all flex items-center gap-2 disabled:opacity-60"
            >
              {isUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Téléversement…
                </>
              ) : (
                editingNewsId ? 'Mettre à jour' : "Publier l'actualité"
              )}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-[#c6c6cf] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-400 border-b border-[#c6c6cf]/30 font-bold uppercase">
              <th className="p-4">Image</th>
              <th className="p-4">Titre</th>
              <th className="p-4">Catégorie</th>
              <th className="p-4">Date</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#c6c6cf]/20">
            {news.map((n) => (
              <tr key={n.id} className="hover:bg-slate-50/40">
                <td className="p-4">
                  <div className="w-14 h-10 rounded-lg overflow-hidden bg-slate-100 border border-[#c6c6cf]/30 shrink-0">
                    {n.image ? (
                      <img src={n.image} alt={n.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-slate-300" />
                      </div>
                    )}
                  </div>
                </td>
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
                <td colSpan={5} className="p-8 text-center text-slate-400 italic">
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
