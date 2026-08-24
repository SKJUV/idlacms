import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Newspaper, Pencil, Trash2, X, ImageIcon, 
  FileText, Link as LinkIcon, Check, Calendar
} from 'lucide-react';
import { NewsArticle, CustomForm, User } from '../../types';
import { databases, storage, APPWRITE_CONFIG, isAppwriteDbConfigured, isAppwriteStorageConfigured, ID } from '../../lib/appwrite';
import emailjs from '@emailjs/browser';

interface NewsManagementProps {
  news: NewsArticle[];
  setNews: React.Dispatch<React.SetStateAction<NewsArticle[]>>;
  logActivity: (type: 'registration' | 'article' | 'error' | 'alumni', user: string, text: string) => Promise<void>;
  usersList: User[];
}

export default function NewsManagement({
  news,
  setNews,
  logActivity,
  usersList
}: NewsManagementProps) {
  const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
  const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
  const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

  const [customForms, setCustomForms] = useState<CustomForm[]>([]);

  useEffect(() => {
    const fetchForms = async () => {
      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.customForms) {
        try {
          const res = await databases.listDocuments(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.customForms);
          const forms: CustomForm[] = res.documents.map(d => ({
            id: d.$id,
            title: d.title,
            description: d.description || '',
            createdAt: d.createdAt,
            fields: JSON.parse(d.fields || '[]')
          }));
          setCustomForms(forms);
        } catch (e) {
          console.error("Erreur récupération formulaires Appwrite", e);
        }
      } else {
        try {
          const saved = localStorage.getItem('idla_custom_forms');
          if (saved) setCustomForms(JSON.parse(saved));
        } catch (e) {}
      }
    };
    fetchForms();
  }, []);

  // ── News State ──
  const [showAddNewsForm, setShowAddNewsForm] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [newNewsTitle, setNewNewsTitle] = useState('');
  const [newNewsDescription, setNewNewsDescription] = useState('');
  const [newNewsCategory, setNewNewsCategory] = useState<'Événements' | 'Académique' | 'Partenariats' | 'Annonces' | 'Alumni'>('Annonces');
  const [attachedFormId, setAttachedFormId] = useState<string>('');
  const [attachedFormUrl, setAttachedFormUrl] = useState<string>('');
  const [eventStartDate, setEventStartDate] = useState<string>('');
  const [eventEndDate, setEventEndDate] = useState<string>('');
  const [copySuccessId, setCopySuccessId] = useState<string | null>(null);

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
    setAttachedFormId('');
    setAttachedFormUrl('');
    setImageFile(null);
    setImagePreview('');
    setImageUrl('');
    setUploadError('');
    setEventStartDate('');
    setEventEndDate('');
    setEditingNewsId(null);
    setShowAddNewsForm(false);
  };

  const startEditNews = (n: NewsArticle) => {
    setEditingNewsId(n.id);
    setNewNewsTitle(n.title);
    setNewNewsDescription(n.description);
    setNewNewsCategory(n.category);
    setAttachedFormId(n.formId || '');
    setAttachedFormUrl(n.formUrl || '');
    setEventStartDate(n.startDate || '');
    setEventEndDate(n.endDate || '');
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
    const url = storage.getFileView(APPWRITE_CONFIG.buckets.documents, response.$id);
    return url.toString();
  };

  const handleSubmitNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNewsTitle || !newNewsDescription) return;

    setIsUploading(true);
    setUploadError('');

    let finalImage = imageUrl || imagePreview || DEFAULT_IMAGE;
    if (imageFile) {
      const currentFile = imageFile;
      try {
        finalImage = await uploadImageToAppwrite(currentFile);
      } catch (err) {
        console.error('Échec upload image:', err);
        setUploadError('Serveur de stockage distant indisponible, utilisation de l\'image en mode local.');
        finalImage = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(currentFile);
        });
      }
    }

    if (editingNewsId) {
      setNews((curr) =>
        curr.map((n) =>
          n.id === editingNewsId
            ? { 
                ...n, 
                title: newNewsTitle, 
                description: newNewsDescription, 
                category: newNewsCategory, 
                image: finalImage,
                formId: attachedFormId || undefined,
                formUrl: attachedFormUrl || undefined,
                startDate: newNewsCategory === 'Événements' ? eventStartDate : undefined,
                endDate: newNewsCategory === 'Événements' ? eventEndDate : undefined,
              }
            : n
        )
      );
      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.news) {
        try {
          await databases.updateDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.news,
            editingNewsId,
            { 
              title: newNewsTitle, 
              description: newNewsDescription, 
              category: newNewsCategory, 
              image: finalImage,
              formId: attachedFormId || '',
              formUrl: attachedFormUrl || '',
              startDate: eventStartDate || '',
              endDate: eventEndDate || '',
            }
          );
        } catch (err) {
          console.error("Échec de la mise à jour sur Appwrite:", err);
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
      formId: attachedFormId || undefined,
      formUrl: attachedFormUrl || undefined,
      startDate: newNewsCategory === 'Événements' ? eventStartDate : undefined,
      endDate: newNewsCategory === 'Événements' ? eventEndDate : undefined,
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
            formId: attachedFormId || '',
            formUrl: attachedFormUrl || '',
            startDate: eventStartDate || '',
            endDate: eventEndDate || '',
          }
        );
      } catch (err) {
        console.error("Échec de la création sur Appwrite:", err);
      }
    }

    logActivity('article', 'Super Admin', `a publié une nouvelle actualité : ${newNewsTitle}.`);
      
    // Envoi de l'e-mail de notification
    if (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) {
      const nonAdminUsers = usersList.filter(u => u.role !== 'Admin' && u.email);
      if (nonAdminUsers.length > 0) {
        const bccList = nonAdminUsers.map(u => u.email).join(',');
        
        emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          {
            to_name: 'Communauté IDLA',
            bcc: bccList,
            article_title: newArticle.title,
            article_category: newArticle.category,
            article_description: newArticle.description,
            link: window.location.origin + '/actualites',
          },
          EMAILJS_PUBLIC_KEY
        ).catch((err) => {
          console.error('Erreur lors de l\'envoi des e-mails :', err);
        });
      }
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
        console.error("Échec de la suppression sur Appwrite:", err);
      }
    }
    if (target) {
      logActivity('article', 'Super Admin', `a supprimé l'actualité : ${target.title}.`);
    }
  };

  const handleCopyLink = (id: string) => {
    const url = window.location.origin + '/actualites?article=' + id;
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccessId(id);
      setTimeout(() => setCopySuccessId(null), 2000);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-lg text-text-primary">Actualités & Événements IDLA</h3>
          <p className="text-xs text-text-secondary mt-0.5">Publiez des articles, annoncez des webinaires et associez vos formulaires interactifs</p>
        </div>
        <button
          onClick={() => (showAddNewsForm ? resetNewsForm() : setShowAddNewsForm(true))}
          className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {showAddNewsForm ? 'Fermer l\'éditeur' : 'Nouvel Article'}
        </button>
      </div>

      {/* Formulaire d'ajout / édition */}
      {showAddNewsForm && (
        <form onSubmit={handleSubmitNews} className="bg-bg-secondary border border-border-primary rounded-2xl p-6 space-y-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex justify-between items-center border-b border-border-primary/50 pb-3">
            <h4 className="font-bold text-sm text-text-primary flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-brand-primary" />
              {editingNewsId ? "Modifier l'article" : 'Rédiger une actualité'}
            </h4>
            <button type="button" onClick={resetNewsForm} className="text-text-secondary hover:text-text-primary cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-text-secondary uppercase">Titre de l'article *</label>
              <input
                type="text"
                required
                value={newNewsTitle}
                onChange={(e) => setNewNewsTitle(e.target.value)}
                placeholder="ex: Lancement du Concours d'Entrée 2026-2027"
                className="w-full p-2.5 rounded-xl border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary uppercase">Catégorie *</label>
              <select
                value={newNewsCategory}
                onChange={(e) => setNewNewsCategory(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs font-semibold"
              >
                <option value="Annonces">Annonces</option>
                <option value="Événements">Événements</option>
                <option value="Académique">Académique</option>
                <option value="Partenariats">Partenariats</option>
                <option value="Alumni">Alumni</option>
              </select>
            </div>
          </div>

          {/* Dates si Événement */}
          {newNewsCategory === 'Événements' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-brand-primary/5 p-4 rounded-xl border border-brand-primary/20">
              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-primary uppercase flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Date & Heure de début
                </label>
                <input
                  type="datetime-local"
                  value={eventStartDate}
                  onChange={(e) => setEventStartDate(e.target.value)}
                  className="w-full p-2 rounded-lg border border-border-primary bg-bg-secondary text-text-primary text-xs outline-none focus:ring-2 focus:ring-brand-primary font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-primary uppercase flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Date & Heure de fin
                </label>
                <input
                  type="datetime-local"
                  value={eventEndDate}
                  onChange={(e) => setEventEndDate(e.target.value)}
                  className="w-full p-2 rounded-lg border border-border-primary bg-bg-secondary text-text-primary text-xs outline-none focus:ring-2 focus:ring-brand-primary font-semibold"
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary uppercase">Contenu / Description détaillée *</label>
            <textarea
              required
              rows={5}
              value={newNewsDescription}
              onChange={(e) => setNewNewsDescription(e.target.value)}
              placeholder="Détaillez ici l'événement, les conditions d'admission, le programme de la conférence…"
              className="w-full p-3 rounded-xl border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs leading-relaxed"
            />
          </div>

          {/* Formulaire interactif lié */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-bg-primary rounded-xl border border-border-primary/60">
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary uppercase flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-brand-primary" /> Associer un Formulaire IDLA (Recommandé)
              </label>
              <select
                value={attachedFormId}
                onChange={(e) => setAttachedFormId(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-secondary text-text-primary text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="">-- Aucun formulaire IDLA --</option>
                {customForms.map((f) => (
                  <option key={f.id} value={f.id}>{f.title} ({f.fields.length} champs)</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary uppercase flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-brand-primary" /> Ou lien d'inscription externe
              </label>
              <input
                type="url"
                value={attachedFormUrl}
                onChange={(e) => setAttachedFormUrl(e.target.value)}
                placeholder="https://forms.gle/... ou https://t.me/..."
                className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-secondary text-text-primary text-xs outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-secondary uppercase">Illustration de l'article</label>
            {imagePreview ? (
              <div className="relative w-full h-44 rounded-xl overflow-hidden border border-border-primary group">
                <img src={imagePreview} alt="Aperçu" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview('');
                    setImageUrl('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow transition-all cursor-pointer"
                  title="Supprimer l'image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                className="w-full h-32 border-2 border-dashed border-border-primary rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-brand-primary hover:bg-brand-primary/5 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="w-7 h-7 text-text-secondary/40" />
                <p className="text-xs font-semibold text-text-secondary">Cliquez pour téléverser une image</p>
                <p className="text-[10px] text-text-secondary/60">JPG, PNG, WEBP — Max 5 Mo</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
            />

            {!imageFile && (
              <div className="space-y-1">
                <p className="text-[10px] text-text-secondary font-medium">— ou coller l'URL directe d'une image —</p>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImagePreview(e.target.value);
                  }}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2 rounded-lg border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs"
                />
              </div>
            )}

            {uploadError && <p className="text-xs text-rose-500 font-semibold">{uploadError}</p>}
          </div>

          {/* Actions */}
          <div className="pt-3 flex justify-end gap-3 border-t border-border-primary/50">
            <button
              type="button"
              onClick={resetNewsForm}
              className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary hover:bg-bg-primary border border-border-primary cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-6 py-2 rounded-xl transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer shadow-sm"
            >
              {isUploading ? 'Publication…' : editingNewsId ? 'Mettre à jour' : "Publier l'actualité"}
            </button>
          </div>
        </form>
      )}

      {/* Tableau des actualités */}
      <div className="bg-bg-secondary border border-border-primary rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-bg-primary text-text-secondary border-b border-border-primary/50 font-bold uppercase text-[10px]">
              <th className="p-4">Image</th>
              <th className="p-4">Titre</th>
              <th className="p-4">Catégorie</th>
              <th className="p-4">Formulaire associé</th>
              <th className="p-4">Date</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-primary/40">
            {news.map((n) => {
              const linkedForm = customForms.find((f) => f.id === n.formId);
              return (
                <tr key={n.id} className="hover:bg-bg-primary/50 transition-colors">
                  <td className="p-4">
                    <div className="w-14 h-10 rounded-lg overflow-hidden bg-bg-primary border border-border-primary shrink-0">
                      {n.image ? (
                        <img src={n.image} alt={n.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-text-secondary/40" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-semibold text-text-primary">
                    <div className="flex items-center gap-2">
                      <Newspaper className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                      <span className="line-clamp-1">{n.title}</span>
                    </div>
                  </td>
                  <td className="p-4 font-medium text-text-secondary">
                    <span className="px-2.5 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary font-bold text-[10px] border border-brand-primary/20">
                      {n.category}
                    </span>
                  </td>
                  <td className="p-4">
                    {linkedForm ? (
                      <span className="bg-brand-primary/10 text-brand-primary font-bold text-[11px] px-2.5 py-1 rounded-lg border border-brand-primary/20 flex items-center gap-1 w-fit">
                        <FileText className="w-3 h-3" /> {linkedForm.title}
                      </span>
                    ) : n.formUrl ? (
                      <a href={n.formUrl} target="_blank" rel="noreferrer" className="text-brand-primary font-bold text-[11px] hover:underline flex items-center gap-1">
                        <LinkIcon className="w-3 h-3" /> Lien externe
                      </a>
                    ) : (
                      <span className="text-text-secondary/40 italic text-[11px]">Aucun</span>
                    )}
                  </td>
                  <td className="p-4 text-text-secondary whitespace-nowrap">{n.date}</td>
                  <td className="p-4">
                    <div className="flex justify-center items-center gap-1">
                      <button
                        onClick={() => handleCopyLink(n.id)}
                        title={copySuccessId === n.id ? "Lien copié !" : "Copier le lien public"}
                        className="text-brand-primary hover:bg-brand-primary/10 p-1.5 rounded-lg transition-all cursor-pointer"
                      >
                        {copySuccessId === n.id ? <Check className="w-4 h-4 text-emerald-500" /> : <LinkIcon className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => startEditNews(n)}
                        title="Modifier"
                        className="text-text-secondary hover:text-brand-primary hover:bg-bg-primary p-1.5 rounded-lg transition-all cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteNews(n.id)}
                        title="Supprimer"
                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 p-1.5 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {news.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-text-secondary italic">
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
