import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Newspaper, Pencil, Trash2, UploadCloud, X, ImageIcon, 
  FileText, Link as LinkIcon, Copy, Check, Eye, Download, Sparkles, 
  FileSpreadsheet, HelpCircle, Layers, CheckSquare, Calendar, ChevronDown, AlignLeft
} from 'lucide-react';
import { NewsArticle, CustomForm, CustomFormField, CustomFormResponse, User } from '../../types';
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
  // Configuration EmailJS depuis les variables d'environnement (ou valeurs par défaut)
  const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
  const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
  const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';
  const [activeTab, setActiveTab] = useState<'articles' | 'forms' | 'responses'>('articles');

  // ---------------------------------------------------------------------------
  // FORMS STATE & PERSISTENCE
  // ---------------------------------------------------------------------------
  const [customForms, setCustomForms] = useState<CustomForm[]>(() => {
    try {
      const saved = localStorage.getItem('idla_custom_forms');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    // Default demo form if empty
    return [
      {
        id: 'form-demo-1',
        title: 'Formulaire de Pré-candidature Express 2026',
        description: 'Veuillez renseigner vos informations pour faire valider votre profil académique.',
        createdAt: new Date().toLocaleDateString('fr-FR'),
        fields: [
          { id: 'f1', label: 'Nom complet', type: 'text', required: true, placeholder: 'ex: Jean Dupont' },
          { id: 'f2', label: 'Adresse e-mail', type: 'text', required: true, placeholder: 'jean.dupont@exemple.com' },
          { id: 'f3', label: 'Niveau d\'études actuel', type: 'select', required: true, options: ['Baccalauréat', 'Licence / Bachelor', 'Master', 'Doctorat'] },
          { id: 'f4', label: 'Motivations', type: 'textarea', required: false, placeholder: 'Décrivez brièvement votre projet professionnel…' },
          { id: 'f5', label: 'Relevé de notes / CNI (Document)', type: 'file', required: false }
        ]
      }
    ];
  });

  const [formResponses, setFormResponses] = useState<CustomFormResponse[]>(() => {
    try {
      const saved = localStorage.getItem('idla_form_responses');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'resp-demo-1',
        formId: 'form-demo-1',
        formTitle: 'Formulaire de Pré-candidature Express 2026',
        submittedAt: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        respondentName: 'Paul Kengne',
        respondentEmail: 'paul.kengne@exemple.com',
        data: {
          'Nom complet': 'Paul Kengne',
          'Adresse e-mail': 'paul.kengne@exemple.com',
          'Niveau d\'études actuel': 'Licence / Bachelor',
          'Motivations': 'Je souhaite poursuivre en Master Ingénierie Logicielle à l\'IDLA.',
          'Relevé de notes / CNI (Document)': 'cni_kengne.pdf (Joint)'
        }
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('idla_custom_forms', JSON.stringify(customForms));
    } catch (e) {}
  }, [customForms]);

  useEffect(() => {
    try {
      localStorage.setItem('idla_form_responses', JSON.stringify(formResponses));
    } catch (e) {}
  }, [formResponses]);

  // Copy link handler
  const [copiedFormId, setCopiedFormId] = useState<string | null>(null);
  const handleCopyFormLink = (formId: string) => {
    const link = `${window.location.origin}/#form-${formId}`;
    navigator.clipboard.writeText(link);
    setCopiedFormId(formId);
    setTimeout(() => setCopiedFormId(null), 2500);
  };

  // ---------------------------------------------------------------------------
  // NEWS MANAGEMENT STATE
  // ---------------------------------------------------------------------------
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
        setUploadError('Appwrite indisponible, utilisation de l\'image en mode local.');
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
              image: finalImage 
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
        ).then(() => {
          console.log('E-mails de notification envoyés avec succès.');
        }).catch((err) => {
          console.error('Erreur lors de l\'envoi des e-mails :', err);
        });
      }
    } else {
      console.warn("Configuration EmailJS manquante. Les notifications par e-mail n'ont pas été envoyées.");
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

  // ---------------------------------------------------------------------------
  // FORM BUILDER STATE & HANDLERS
  // ---------------------------------------------------------------------------
  const [showAddFormModal, setShowAddFormModal] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [builderTitle, setBuilderTitle] = useState('');
  const [builderDescription, setBuilderDescription] = useState('');
  const [builderFields, setBuilderFields] = useState<CustomFormField[]>([
    { id: 'f_1', label: 'Nom & Prénom', type: 'text', required: true, placeholder: 'Saisissez votre nom complet' }
  ]);

  const resetFormBuilder = () => {
    setBuilderTitle('');
    setBuilderDescription('');
    setBuilderFields([
      { id: 'f_1', label: 'Nom & Prénom', type: 'text', required: true, placeholder: 'Saisissez votre nom complet' }
    ]);
    setEditingFormId(null);
    setShowAddFormModal(false);
  };

  const handleAddField = () => {
    const newF: CustomFormField = {
      id: `f_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      label: 'Nouveau champ',
      type: 'text',
      required: false,
      placeholder: ''
    };
    setBuilderFields((prev) => [...prev, newF]);
  };

  const handleRemoveField = (fieldId: string) => {
    setBuilderFields((prev) => prev.filter((f) => f.id !== fieldId));
  };

  const handleUpdateField = (fieldId: string, key: keyof CustomFormField, val: any) => {
    setBuilderFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, [key]: val } : f))
    );
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!builderTitle.trim()) return;

    if (editingFormId) {
      setCustomForms((prev) =>
        prev.map((f) =>
          f.id === editingFormId
            ? { ...f, title: builderTitle, description: builderDescription, fields: builderFields }
            : f
        )
      );
      logActivity('article', 'Super Admin', `a mis à jour le formulaire : ${builderTitle}.`);
    } else {
      const newFormId = `form-${Date.now()}`;
      const createdForm: CustomForm = {
        id: newFormId,
        title: builderTitle,
        description: builderDescription,
        fields: builderFields,
        createdAt: new Date().toLocaleDateString('fr-FR')
      };
      setCustomForms((prev) => [createdForm, ...prev]);
      logActivity('article', 'Super Admin', `a créé le formulaire sur mesure : ${builderTitle}.`);
    }

    resetFormBuilder();
  };

  const handleStartEditForm = (form: CustomForm) => {
    setEditingFormId(form.id);
    setBuilderTitle(form.title);
    setBuilderDescription(form.description);
    setBuilderFields(form.fields || []);
    setShowAddFormModal(true);
  };

  const handleDeleteForm = (formId: string) => {
    const target = customForms.find((f) => f.id === formId);
    setCustomForms((prev) => prev.filter((f) => f.id !== formId));
    if (target) {
      logActivity('article', 'Super Admin', `a supprimé le formulaire : ${target.title}.`);
    }
  };

  // ---------------------------------------------------------------------------
  // RESPONSES VIEW MODAL & EXPORT
  // ---------------------------------------------------------------------------
  const [selectedResponse, setSelectedResponse] = useState<CustomFormResponse | null>(null);
  const [filterFormId, setFilterFormId] = useState<string>('all');

  const filteredResponses = formResponses.filter(
    (r) => filterFormId === 'all' || r.formId === filterFormId
  );

  const handleExportCSV = () => {
    if (filteredResponses.length === 0) return;
    
    // Build CSV content
    const headers = ['ID', 'Formulaire', 'Date', 'Nom', 'Email', 'Données'];
    const rows = filteredResponses.map((r) => [
      r.id,
      `"${(r.formTitle || '').replace(/"/g, '""')}"`,
      r.submittedAt,
      `"${(r.respondentName || '').replace(/"/g, '""')}"`,
      `"${(r.respondentEmail || '').replace(/"/g, '""')}"`,
      `"${JSON.stringify(r.data).replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reponses_formulaires_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bg-secondary p-4 rounded-2xl border border-border-primary">
        <div>
          <h3 className="font-sans font-bold text-lg text-text-primary flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-brand-primary" />
            Gestion des Actualités & Formulaires
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Publiez des articles et créez des formulaires dynamiques sans modifier la base de données.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-bg-primary p-1 rounded-xl border border-border-primary shrink-0">
          <button
            onClick={() => setActiveTab('articles')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'articles'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" /> Actualités ({news.length})
          </button>
          <button
            onClick={() => setActiveTab('forms')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'forms'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Formulaires ({customForms.length})
          </button>
          <button
            onClick={() => setActiveTab('responses')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'responses'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Réponses ({formResponses.length})
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1 : ACTUALITÉS & ARTICLES */}
      {/* ===================================================================== */}
      {activeTab === 'articles' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-sm text-text-primary uppercase tracking-wider">Articles publiés</h4>
            <button
              onClick={() => (showAddNewsForm ? resetNewsForm() : setShowAddNewsForm(true))}
              className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {showAddNewsForm ? 'Fermer le formulaire' : 'Publier une actualité'}
            </button>
          </div>

          {/* Formulaire ajout/édition d'actualité */}
          {showAddNewsForm && (
            <form
              onSubmit={handleSubmitNews}
              className="bg-bg-secondary border border-border-primary rounded-2xl p-6 space-y-5 shadow-sm"
            >
              <p className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-primary" />
                {editingNewsId ? "Modifier l'actualité" : 'Nouvelle actualité'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Titre */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-text-secondary uppercase">Titre de l'actualité *</label>
                  <input
                    type="text"
                    value={newNewsTitle}
                    onChange={(e) => setNewNewsTitle(e.target.value)}
                    placeholder="ex: Ouverture des pré-inscriptions à la session d'Automne 2026"
                    className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs font-medium"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-text-secondary uppercase">Description & Contenu *</label>
                  <textarea
                    value={newNewsDescription}
                    onChange={(e) => setNewNewsDescription(e.target.value)}
                    rows={4}
                    placeholder="Décrivez l'actualité en détail..."
                    className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs font-medium"
                    required
                  />
                </div>

                {/* Catégorie */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">Catégorie</label>
                  <select
                    value={newNewsCategory}
                    onChange={(e) => setNewNewsCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs font-bold"
                  >
                    <option value="Annonces">Annonces</option>
                    <option value="Événements">Événements</option>
                    <option value="Académique">Académique</option>
                    <option value="Partenariats">Partenariats</option>
                    <option value="Alumni">Alumni</option>
                  </select>
                </div>

                {/* Dates de l'événement */}
                {newNewsCategory === 'Événements' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-text-secondary uppercase">Date de début</label>
                      <input
                        type="date"
                        value={eventStartDate}
                        onChange={(e) => setEventStartDate(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-text-secondary uppercase">Date de fin</label>
                      <input
                        type="date"
                        value={eventEndDate}
                        onChange={(e) => setEventEndDate(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs font-medium"
                      />
                    </div>
                  </div>
                )}

                {/* Rattaché à un Formulaire sur mesure */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-brand-primary uppercase flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Formulaire sur mesure associé (Facultatif)
                  </label>
                  <select
                    value={attachedFormId}
                    onChange={(e) => {
                      setAttachedFormId(e.target.value);
                      if (e.target.value) setAttachedFormUrl('');
                    }}
                    className="w-full p-2.5 rounded-lg border border-brand-primary/40 bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs font-bold"
                  >
                    <option value="">-- Aucun formulaire rattaché --</option>
                    {customForms.map((f) => (
                      <option key={f.id} value={f.id}>
                        📋 {f.title} ({f.fields.length} champs)
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-text-secondary">
                    Un bouton "Remplir le formulaire" apparaîtra sous l'actualité pour les visiteurs.
                  </p>
                </div>

                {/* Ou Lien externe de formulaire */}
                {!attachedFormId && (
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-text-secondary uppercase flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5" /> Ou Lien externe de formulaire (Google Forms, Typeform, etc.)
                    </label>
                    <input
                      type="url"
                      value={attachedFormUrl}
                      onChange={(e) => setAttachedFormUrl(e.target.value)}
                      placeholder="https://forms.google.com/..."
                      className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs font-medium"
                    />
                  </div>
                )}
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase">Image de l'actualité</label>

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
                    className="w-full h-36 border-2 border-dashed border-border-primary rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-primary hover:bg-brand-primary/5 transition-all"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="w-8 h-8 text-text-secondary/40" />
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
                    <p className="text-[10px] text-text-secondary font-medium">— ou coller l'URL d'une image —</p>
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

                {uploadError && <p className="text-xs text-red-500 font-semibold">{uploadError}</p>}
              </div>

              {/* Actions */}
              <div className="pt-4 flex justify-end gap-3 border-t border-border-primary">
                <button
                  type="button"
                  onClick={resetNewsForm}
                  className="px-5 py-2 rounded-lg text-xs font-bold text-text-secondary hover:bg-bg-primary border border-border-primary transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-6 py-2.5 rounded-lg transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer shadow"
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
                <tr className="bg-bg-primary text-text-secondary border-b border-border-primary font-bold uppercase">
                  <th className="p-4">Image</th>
                  <th className="p-4">Titre</th>
                  <th className="p-4">Catégorie</th>
                  <th className="p-4">Formulaire associé</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary/50">
                {news.map((n) => {
                  const linkedForm = customForms.find((f) => f.id === n.formId);
                  return (
                    <tr key={n.id} className="hover:bg-bg-primary/40 transition-colors">
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
                      <td className="p-4 font-medium text-text-secondary">{n.category}</td>
                      <td className="p-4">
                        {linkedForm ? (
                          <span className="bg-brand-primary/10 text-brand-primary font-bold text-[11px] px-2.5 py-1 rounded-full border border-brand-primary/20 flex items-center gap-1 w-fit">
                            <FileText className="w-3 h-3" /> {linkedForm.title}
                          </span>
                        ) : n.formUrl ? (
                          <a href={n.formUrl} target="_blank" rel="noreferrer" className="text-sky-600 font-bold text-[11px] hover:underline flex items-center gap-1">
                            <LinkIcon className="w-3 h-3" /> Lien externe
                          </a>
                        ) : (
                          <span className="text-text-secondary/40 italic">Aucun</span>
                        )}
                      </td>
                      <td className="p-4 text-text-secondary">{n.date}</td>
                      <td className="p-4">
                        <div className="flex justify-center items-center gap-1">
                          <button
                            onClick={() => handleCopyLink(n.id)}
                            title={copySuccessId === n.id ? "Lien copié !" : "Copier le lien public"}
                            className="text-sky-500 hover:text-sky-700 p-1.5 hover:bg-sky-500/10 rounded transition-all cursor-pointer"
                          >
                            {copySuccessId === n.id ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => startEditNews(n)}
                            title="Modifier"
                            className="text-text-secondary hover:text-brand-primary p-1.5 hover:bg-bg-primary rounded transition-all cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteNews(n.id)}
                            title="Supprimer"
                            className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-500/10 rounded transition-all cursor-pointer"
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
      )}

      {/* ===================================================================== */}
      {/* TAB 2 : FORMULAIRES SUR MESURE (FORM BUILDER) */}
      {/* ===================================================================== */}
      {activeTab === 'forms' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-bold text-sm text-text-primary uppercase tracking-wider">Gestionnaire de Formulaires</h4>
              <p className="text-xs text-text-secondary mt-0.5">Créez des formulaires dynamiques avec des champs personnalisés.</p>
            </div>
            <button
              onClick={() => (showAddFormModal ? resetFormBuilder() : setShowAddFormModal(true))}
              className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {showAddFormModal ? 'Fermer le constructeur' : 'Créer un nouveau formulaire'}
            </button>
          </div>

          {/* Form Builder Modal / Card */}
          {showAddFormModal && (
            <form onSubmit={handleSaveForm} className="bg-bg-secondary border border-border-primary rounded-2xl p-6 space-y-6 shadow-md">
              <div className="border-b border-border-primary pb-4 flex justify-between items-center">
                <h4 className="font-bold text-base text-text-primary flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-primary" />
                  {editingFormId ? 'Modifier le formulaire' : 'Créateur de formulaire sur mesure'}
                </h4>
                <button type="button" onClick={resetFormBuilder} className="text-text-secondary hover:text-text-primary cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-text-secondary uppercase">Titre du formulaire *</label>
                  <input
                    type="text"
                    required
                    value={builderTitle}
                    onChange={(e) => setBuilderTitle(e.target.value)}
                    placeholder="ex: Formulaire de candidature rapide - Session Spéciale"
                    className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs font-bold"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-text-secondary uppercase">Description / Consignes pour le candidat</label>
                  <textarea
                    rows={2}
                    value={builderDescription}
                    onChange={(e) => setBuilderDescription(e.target.value)}
                    placeholder="ex: Veuillez compléter l'ensemble des champs suivants. Vos données seront analysées confidentiellement."
                    className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs"
                  />
                </div>
              </div>

              {/* Fields Builder */}
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center border-b border-border-primary pb-2">
                  <h5 className="font-bold text-xs text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-brand-primary" /> Champs du formulaire ({builderFields.length})
                  </h5>
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="text-xs font-bold text-brand-primary bg-brand-primary/10 hover:bg-brand-primary hover:text-white px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter un champ
                  </button>
                </div>

                <div className="space-y-4">
                  {builderFields.map((field, idx) => (
                    <div key={field.id} className="bg-bg-primary border border-border-primary rounded-xl p-4 space-y-3 relative group">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded">
                          Champ #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveField(field.id)}
                          className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-500/10 rounded cursor-pointer"
                          title="Supprimer ce champ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Field Label */}
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[10px] font-bold text-text-secondary uppercase">Intitulé de la question / Champ *</label>
                          <input
                            type="text"
                            required
                            value={field.label}
                            onChange={(e) => handleUpdateField(field.id, 'label', e.target.value)}
                            placeholder="ex: Numéro de téléphone / Niveau d'étude"
                            className="w-full p-2 rounded-lg border border-border-primary bg-bg-secondary text-text-primary text-xs font-semibold"
                          />
                        </div>

                        {/* Field Type */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-text-secondary uppercase">Type de champ</label>
                          <select
                            value={field.type}
                            onChange={(e) => handleUpdateField(field.id, 'type', e.target.value)}
                            className="w-full p-2 rounded-lg border border-border-primary bg-bg-secondary text-text-primary text-xs font-bold"
                          >
                            <option value="text">Texte court</option>
                            <option value="textarea">Texte long (Zone de texte)</option>
                            <option value="number">Nombre / Chiffres</option>
                            <option value="date">Date</option>
                            <option value="select">Liste déroulante</option>
                            <option value="radio">Choix unique (Radio)</option>
                            <option value="checkbox">Case à cocher</option>
                            <option value="file">Pièce jointe / Document</option>
                          </select>
                        </div>

                        {/* Placeholder */}
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[10px] font-bold text-text-secondary uppercase">Texte indicatif (Placeholder)</label>
                          <input
                            type="text"
                            value={field.placeholder || ''}
                            onChange={(e) => handleUpdateField(field.id, 'placeholder', e.target.value)}
                            placeholder="ex: Saisissez votre réponse ici..."
                            className="w-full p-2 rounded-lg border border-border-primary bg-bg-secondary text-text-primary text-xs"
                          />
                        </div>

                        {/* Required toggle */}
                        <div className="flex items-center gap-2 pt-4">
                          <input
                            type="checkbox"
                            id={`req_${field.id}`}
                            checked={field.required}
                            onChange={(e) => handleUpdateField(field.id, 'required', e.target.checked)}
                            className="w-4 h-4 text-brand-primary rounded accent-brand-primary cursor-pointer"
                          />
                          <label htmlFor={`req_${field.id}`} className="text-xs font-bold text-text-primary cursor-pointer">
                            Champ obligatoire
                          </label>
                        </div>

                        {/* Options if select / radio / checkbox */}
                        {['select', 'radio', 'checkbox'].includes(field.type) && (
                          <div className="space-y-1 md:col-span-3 pt-1">
                            <label className="text-[10px] font-bold text-brand-primary uppercase">
                              Options possibles (séparées par des virgules)
                            </label>
                            <input
                              type="text"
                              value={(field.options || []).join(', ')}
                              onChange={(e) =>
                                handleUpdateField(
                                  field.id,
                                  'options',
                                  e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                                )
                              }
                              placeholder="ex: Option A, Option B, Option C"
                              className="w-full p-2 rounded-lg border border-brand-primary/40 bg-bg-secondary text-text-primary text-xs font-medium"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 flex justify-end gap-3 border-t border-border-primary">
                <button
                  type="button"
                  onClick={resetFormBuilder}
                  className="px-5 py-2 rounded-lg text-xs font-bold text-text-secondary hover:bg-bg-primary border border-border-primary cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-6 py-2.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow"
                >
                  {editingFormId ? 'Enregistrer les modifications' : 'Enregistrer le formulaire'}
                </button>
              </div>
            </form>
          )}

          {/* List of Custom Forms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {customForms.map((form) => {
              const responsesForThisForm = formResponses.filter((r) => r.formId === form.id);
              const isCopied = copiedFormId === form.id;
              return (
                <div key={form.id} className="bg-bg-secondary border border-border-primary rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-bold text-base text-text-primary">{form.title}</h4>
                        <p className="text-xs text-text-secondary mt-1 line-clamp-2">{form.description || 'Aucune description.'}</p>
                      </div>
                      <span className="bg-brand-primary/10 text-brand-primary font-bold text-[10px] px-2.5 py-1 rounded-full border border-brand-primary/20 shrink-0">
                        {form.fields.length} champs
                      </span>
                    </div>

                    {/* Preview of fields */}
                    <div className="bg-bg-primary p-3 rounded-xl border border-border-primary space-y-1.5 text-xs">
                      <p className="font-bold text-[10px] text-text-secondary uppercase tracking-wider">Aperçu des champs :</p>
                      <ul className="space-y-1 text-text-primary">
                        {form.fields.slice(0, 3).map((f) => (
                          <li key={f.id} className="flex items-center gap-2 text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0" />
                            <span className="font-semibold">{f.label}</span>
                            <span className="text-text-secondary text-[10px]">({f.type}{f.required ? ' *' : ''})</span>
                          </li>
                        ))}
                        {form.fields.length > 3 && (
                          <li className="text-[10px] text-text-secondary italic pt-0.5">
                            + {form.fields.length - 3} autres champs…
                          </li>
                        )}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between text-xs text-text-secondary pt-1">
                      <span>Créé le {form.createdAt}</span>
                      <span className="font-bold text-brand-primary">{responsesForThisForm.length} réponse(s) reçue(s)</span>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="pt-4 border-t border-border-primary/50 flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => handleCopyFormLink(form.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:bg-brand-primary/10 px-3 py-1.5 rounded-lg border border-brand-primary/20 transition-all cursor-pointer"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {isCopied ? 'Lien copié !' : 'Copier le lien direct'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartEditForm(form)}
                        className="p-2 text-text-secondary hover:text-brand-primary hover:bg-bg-primary rounded-lg transition-all cursor-pointer"
                        title="Modifier le formulaire"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteForm(form.id)}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {customForms.length === 0 && (
              <div className="col-span-2 bg-bg-secondary border border-border-primary rounded-2xl p-12 text-center space-y-3">
                <FileText className="w-12 h-12 text-text-secondary/30 mx-auto" />
                <p className="text-sm text-text-secondary font-medium">Aucun formulaire sur mesure créé.</p>
                <button
                  onClick={() => setShowAddFormModal(true)}
                  className="bg-brand-primary text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Créer votre premier formulaire
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3 : RÉPONSES REÇUES */}
      {/* ===================================================================== */}
      {activeTab === 'responses' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-sm text-text-primary uppercase tracking-wider">Réponses aux formulaires</h4>
              <p className="text-xs text-text-secondary mt-0.5">Consultez et exportez toutes les soumissions effectuées par les candidats.</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Filter by Form */}
              <select
                value={filterFormId}
                onChange={(e) => setFilterFormId(e.target.value)}
                className="bg-bg-secondary border border-border-primary text-text-primary text-xs font-bold px-3 py-2 rounded-xl outline-none"
              >
                <option value="all">Tous les formulaires ({formResponses.length})</option>
                {customForms.map((f) => (
                  <option key={f.id} value={f.id}>{f.title}</option>
                ))}
              </select>

              <button
                onClick={handleExportCSV}
                disabled={filteredResponses.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow cursor-pointer disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" /> Exporter (CSV)
              </button>
            </div>
          </div>

          {/* Table of responses */}
          <div className="bg-bg-secondary border border-border-primary rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-bg-primary text-text-secondary border-b border-border-primary font-bold uppercase">
                  <th className="p-4">Formulaire</th>
                  <th className="p-4">Nom du Répondant</th>
                  <th className="p-4">Email / Contact</th>
                  <th className="p-4">Date de soumission</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary/50">
                {filteredResponses.map((resp) => (
                  <tr key={resp.id} className="hover:bg-bg-primary/40 transition-colors">
                    <td className="p-4 font-bold text-text-primary">{resp.formTitle}</td>
                    <td className="p-4 font-semibold text-text-primary">{resp.respondentName || 'Anonyme'}</td>
                    <td className="p-4 text-text-secondary">{resp.respondentEmail || 'Non spécifié'}</td>
                    <td className="p-4 text-text-secondary">{resp.submittedAt}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedResponse(resp)}
                        className="bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 mx-auto"
                      >
                        <Eye className="w-3.5 h-3.5" /> Voir les détails
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredResponses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-text-secondary italic">
                      Aucune réponse enregistrée pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Détails Réponse */}
      {selectedResponse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedResponse(null)}>
          <div className="bg-bg-secondary text-text-primary w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-border-primary space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary bg-bg-primary">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-primary" /> Détail de la réponse
              </h4>
              <button onClick={() => setSelectedResponse(null)} className="text-text-secondary hover:text-text-primary cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="bg-bg-primary p-4 rounded-xl border border-border-primary space-y-1">
                <p className="font-bold text-sm text-text-primary">{selectedResponse.formTitle}</p>
                <p className="text-xs text-text-secondary">Soumis le {selectedResponse.submittedAt}</p>
              </div>

              <div className="space-y-3">
                <p className="font-bold text-xs uppercase tracking-wider text-brand-primary">Réponses fournies :</p>
                {Object.entries(selectedResponse.data || {}).map(([key, value]) => (
                  <div key={key} className="bg-bg-primary p-3 rounded-lg border border-border-primary/60 space-y-1">
                    <p className="text-[11px] font-bold text-text-secondary uppercase">{key}</p>
                    <p className="text-xs font-semibold text-text-primary whitespace-pre-wrap">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-border-primary flex justify-end">
              <button
                onClick={() => setSelectedResponse(null)}
                className="bg-brand-primary text-white text-xs font-bold px-5 py-2 rounded-lg cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
