import React, { useState, useEffect } from 'react';
import {
  Plus, Pencil, Trash2, X, FileText, Link as LinkIcon, Copy, Check, Eye,
  Sparkles, FileSpreadsheet, Layers, ChevronDown, ChevronUp
} from 'lucide-react';
import { CustomForm, CustomFormField, CustomFormResponse } from '../../types';
import { databases, APPWRITE_CONFIG, isAppwriteDbConfigured, ID } from '../../lib/appwrite';
import FormBuilderOptionTags from './FormBuilderOptionTags';

interface FormsManagementProps {
  logActivity: (type: 'registration' | 'article' | 'error' | 'alumni', user: string, text: string) => Promise<void>;
}

export default function FormsManagement({ logActivity }: FormsManagementProps) {
  const [activeTab, setActiveTab] = useState<'forms' | 'responses'>('forms');
  const [customForms, setCustomForms] = useState<CustomForm[]>([]);
  const [formResponses, setFormResponses] = useState<CustomFormResponse[]>([]);

  // ── Fetch Forms & Responses ──
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
          console.error("Erreur récupération formulaires Appwrite:", e);
        }
      } else {
        try {
          const saved = localStorage.getItem('idla_custom_forms');
          if (saved) setCustomForms(JSON.parse(saved));
        } catch (e) {}
      }
    };

    const fetchResponses = async () => {
      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.formResponses) {
        try {
          const res = await databases.listDocuments(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.formResponses);
          const responses: CustomFormResponse[] = res.documents.map(d => ({
            id: d.$id,
            formId: d.formId,
            formTitle: d.formTitle,
            newsId: d.newsId,
            newsTitle: d.newsTitle,
            respondentName: d.respondentName,
            respondentEmail: d.respondentEmail,
            submittedAt: d.submittedAt,
            data: JSON.parse(d.data || '{}')
          }));
          setFormResponses(responses);
        } catch (e) {
          console.error("Erreur récupération réponses Appwrite:", e);
        }
      } else {
        try {
          const saved = localStorage.getItem('idla_form_responses');
          if (saved) setFormResponses(JSON.parse(saved));
        } catch (e) {}
      }
    };

    fetchForms();
    fetchResponses();
  }, []);

  // ── Sync Local Storage ──
  useEffect(() => {
    if (!isAppwriteDbConfigured() || !APPWRITE_CONFIG.collections.customForms) {
      try {
        localStorage.setItem('idla_custom_forms', JSON.stringify(customForms));
      } catch (e) {}
    }
  }, [customForms]);

  useEffect(() => {
    if (!isAppwriteDbConfigured() || !APPWRITE_CONFIG.collections.formResponses) {
      try {
        localStorage.setItem('idla_form_responses', JSON.stringify(formResponses));
      } catch (e) {}
    }
  }, [formResponses]);

  // ── Copy Link ──
  const [copiedFormId, setCopiedFormId] = useState<string | null>(null);
  const handleCopyFormLink = (formId: string) => {
    const link = `${window.location.origin}/formulaire?id=${formId}`;
    navigator.clipboard.writeText(link);
    setCopiedFormId(formId);
    setTimeout(() => setCopiedFormId(null), 2500);
  };

  // ── Form Builder State ──
  const [showAddFormModal, setShowAddFormModal] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [builderTitle, setBuilderTitle] = useState('');
  const [builderDescription, setBuilderDescription] = useState('');
  const [builderFields, setBuilderFields] = useState<CustomFormField[]>([]);

  // ── Response Detail State ──
  const [selectedResponse, setSelectedResponse] = useState<CustomFormResponse | null>(null);
  const [filterFormId, setFilterFormId] = useState<string>('all');

  const resetFormBuilder = () => {
    setBuilderTitle('');
    setBuilderDescription('');
    setBuilderFields([
      { id: 'f_1', label: 'Nom complet', type: 'text', required: true, placeholder: 'ex: Jean Dupont' },
      { id: 'f_2', label: 'Adresse email', type: 'text', required: true, placeholder: 'ex: jean.dupont@email.com' }
    ]);
    setEditingFormId(null);
    setShowAddFormModal(false);
  };

  const handleStartEditForm = (f: CustomForm) => {
    setEditingFormId(f.id);
    setBuilderTitle(f.title);
    setBuilderDescription(f.description);
    setBuilderFields(f.fields || []);
    setShowAddFormModal(true);
  };

  const handleAddField = () => {
    const newId = `f_${Date.now().toString(36)}`;
    setBuilderFields([
      ...builderFields,
      {
        id: newId,
        label: `Nouveau champ ${builderFields.length + 1}`,
        type: 'text',
        required: false,
        placeholder: ''
      }
    ]);
  };

  const handleAddPresetField = (preset: 'fullName' | 'email' | 'phone' | 'birthDate' | 'cni' | 'level' | 'program') => {
    const newId = `f_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`;
    let newField: CustomFormField;

    switch (preset) {
      case 'fullName':
        newField = { id: newId, label: 'Nom & Prénom complets', type: 'text', required: true, placeholder: 'ex: Marie-Claire MBA' };
        break;
      case 'email':
        newField = { id: newId, label: 'Adresse e-mail valide', type: 'text', required: true, placeholder: 'ex: candidate@email.com' };
        break;
      case 'phone':
        newField = { id: newId, label: 'Numéro WhatsApp / Téléphone', type: 'text', required: true, placeholder: 'ex: +237 6XX XX XX XX' };
        break;
      case 'birthDate':
        newField = { id: newId, label: 'Date de naissance', type: 'date', required: true };
        break;
      case 'cni':
        newField = { id: newId, label: 'Numéro CNI ou Passeport', type: 'text', required: true, placeholder: 'ex: 10829384920' };
        break;
      case 'level':
        newField = {
          id: newId,
          label: 'Niveau académique actuel',
          type: 'select',
          required: true,
          options: ['Baccalauréat / GCE A-Level', 'Licence 1 / Niveau 1', 'Licence 2 / Niveau 2', 'Licence 3 / Bachelor', 'Master 1', 'Master 2 / MBA', 'Doctorat']
        };
        break;
      case 'program':
        newField = {
          id: newId,
          label: 'Filière / Programme IDLA souhaité',
          type: 'select',
          required: true,
          options: ['Cybersécurité & Réseaux', 'Génie Logiciel & IA', 'Management & Stratégie', 'Finance & Audit', 'Marketing Digital', 'Droit des Affaires']
        };
        break;
      default:
        return;
    }

    setBuilderFields([...builderFields, newField]);
  };

  const handleUpdateField = (id: string, key: keyof CustomFormField, val: any) => {
    setBuilderFields(builderFields.map(f => f.id === id ? { ...f, [key]: val } : f));
  };

  const handleRemoveField = (id: string) => {
    setBuilderFields(builderFields.filter(f => f.id !== id));
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === builderFields.length - 1) return;
    const nextFields = [...builderFields];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = nextFields[index];
    nextFields[index] = nextFields[targetIdx];
    nextFields[targetIdx] = temp;
    setBuilderFields(nextFields);
  };

  const handleDuplicateField = (id: string) => {
    const target = builderFields.find(f => f.id === id);
    if (!target) return;
    const clone: CustomFormField = {
      ...JSON.parse(JSON.stringify(target)),
      id: `f_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`,
      label: `${target.label} (Copie)`
    };
    const idx = builderFields.findIndex(f => f.id === id);
    const updated = [...builderFields];
    updated.splice(idx + 1, 0, clone);
    setBuilderFields(updated);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!builderTitle.trim() || builderFields.length === 0) return;

    if (editingFormId) {
      const updatedForms = customForms.map(f => f.id === editingFormId ? {
        ...f,
        title: builderTitle,
        description: builderDescription,
        fields: builderFields
      } : f);
      setCustomForms(updatedForms);

      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.customForms) {
        try {
          await databases.updateDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.customForms,
            editingFormId,
            {
              title: builderTitle,
              description: builderDescription,
              fields: JSON.stringify(builderFields)
            }
          );
        } catch (err) {
          console.error("Échec de mise à jour du formulaire sur Appwrite:", err);
        }
      }
      logActivity('article', 'Super Admin', `a modifié le formulaire : ${builderTitle}.`);
      resetFormBuilder();
      return;
    }

    const newFormId = `form-${Date.now().toString(36)}`;
    const newForm: CustomForm = {
      id: newFormId,
      title: builderTitle,
      description: builderDescription,
      fields: builderFields,
      createdAt: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    setCustomForms([newForm, ...customForms]);

    if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.customForms) {
      try {
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.customForms,
          newFormId,
          {
            title: newForm.title,
            description: newForm.description,
            createdAt: newForm.createdAt,
            fields: JSON.stringify(newForm.fields)
          }
        );
      } catch (err) {
        console.error("Échec création formulaire Appwrite:", err);
      }
    }

    logActivity('article', 'Super Admin', `a créé le formulaire dynamique : ${builderTitle}.`);
    resetFormBuilder();
  };

  const handleDeleteForm = async (id: string) => {
    const target = customForms.find(f => f.id === id);
    setCustomForms(customForms.filter(f => f.id !== id));

    if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.customForms) {
      try {
        await databases.deleteDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.customForms,
          id
        );
      } catch (err) {
        console.error("Échec de suppression du formulaire sur Appwrite:", err);
      }
    }

    if (target) {
      logActivity('error', 'Super Admin', `a supprimé le formulaire : ${target.title}.`);
    }
  };

  const filteredResponses = filterFormId === 'all'
    ? formResponses
    : formResponses.filter(r => r.formId === filterFormId);

  const handleExportCSV = () => {
    if (filteredResponses.length === 0) return;
    const keys = Array.from(new Set(filteredResponses.flatMap(r => Object.keys(r.data || {}))));
    const header = ['ID', 'Formulaire', 'Nom', 'Email', 'Date de soumission', ...keys];
    const rows = filteredResponses.map(r => [
      `"${r.id}"`,
      `"${r.formTitle || ''}"`,
      `"${r.respondentName || ''}"`,
      `"${r.respondentEmail || ''}"`,
      `"${r.submittedAt || ''}"`,
      ...keys.map(k => `"${String(r.data?.[k] ?? '').replace(/"/g, '""')}"`)
    ]);

    const csvContent = [header.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reponses_formulaires_IDLA_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* ── Subtabs ── */}
      <div className="flex border-b border-border-primary/50 gap-6">
        <button
          onClick={() => setActiveTab('forms')}
          className={`pb-3 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'forms'
              ? 'border-b-2 border-brand-primary text-brand-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Créateur & Formulaires Actifs ({customForms.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('responses')}
          className={`pb-3 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'responses'
              ? 'border-b-2 border-brand-primary text-brand-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Réponses Reçues ({formResponses.length})</span>
        </button>
      </div>

      {/* ── Tab 1 : Formulaires Sur Mesure (Builder) ── */}
      {activeTab === 'forms' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-bold text-sm text-text-primary uppercase tracking-wider">Gestionnaire de Formulaires</h4>
              <p className="text-xs text-text-secondary mt-0.5">Créez des formulaires dynamiques avec validation d'âge et pièces jointes.</p>
            </div>
            <button
              onClick={() => (showAddFormModal ? resetFormBuilder() : setShowAddFormModal(true))}
              className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {showAddFormModal ? 'Fermer le constructeur' : 'Créer un nouveau formulaire'}
            </button>
          </div>

          {/* Form Builder Card */}
          {showAddFormModal && (
            <form onSubmit={handleSaveForm} className="bg-bg-secondary border border-border-primary rounded-2xl p-6 space-y-6 shadow-md">
              <div className="border-b border-border-primary/50 pb-4 flex justify-between items-center">
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
                    placeholder="ex: Candidature rapide — Session Spéciale"
                    className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs font-bold"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-text-secondary uppercase">Description / Consignes pour le candidat</label>
                  <textarea
                    rows={2}
                    value={builderDescription}
                    onChange={(e) => setBuilderDescription(e.target.value)}
                    placeholder="ex: Complétez tous les champs ci-dessous. Vos informations resteront strictement confidentielles."
                    className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs"
                  />
                </div>
              </div>

              {/* Fields Builder */}
              <div className="space-y-4 pt-2">
                {/* One-Click Presets Bar */}
                <div className="bg-brand-primary/5 p-3 rounded-xl border border-brand-primary/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-brand-primary uppercase flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-brand-primary" /> Modèles de champs prêts à l'emploi (Insertion en 1 clic)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button type="button" onClick={() => handleAddPresetField('fullName')} className="px-2.5 py-1 bg-bg-secondary hover:bg-brand-primary hover:text-white border border-border-primary rounded-lg text-[11px] font-bold text-text-primary transition-all flex items-center gap-1 cursor-pointer">
                      + 👤 Nom & Prénom
                    </button>
                    <button type="button" onClick={() => handleAddPresetField('email')} className="px-2.5 py-1 bg-bg-secondary hover:bg-brand-primary hover:text-white border border-border-primary rounded-lg text-[11px] font-bold text-text-primary transition-all flex items-center gap-1 cursor-pointer">
                      + 📧 Adresse E-mail
                    </button>
                    <button type="button" onClick={() => handleAddPresetField('phone')} className="px-2.5 py-1 bg-bg-secondary hover:bg-brand-primary hover:text-white border border-border-primary rounded-lg text-[11px] font-bold text-text-primary transition-all flex items-center gap-1 cursor-pointer">
                      + 📱 Téléphone
                    </button>
                    <button type="button" onClick={() => handleAddPresetField('birthDate')} className="px-2.5 py-1 bg-bg-secondary hover:bg-brand-primary hover:text-white border border-border-primary rounded-lg text-[11px] font-bold text-text-primary transition-all flex items-center gap-1 cursor-pointer">
                      + 📅 Date de Naissance
                    </button>
                    <button type="button" onClick={() => handleAddPresetField('cni')} className="px-2.5 py-1 bg-bg-secondary hover:bg-brand-primary hover:text-white border border-border-primary rounded-lg text-[11px] font-bold text-text-primary transition-all flex items-center gap-1 cursor-pointer">
                      + 🆔 CNI / Passeport
                    </button>
                    <button type="button" onClick={() => handleAddPresetField('level')} className="px-2.5 py-1 bg-bg-secondary hover:bg-brand-primary hover:text-white border border-border-primary rounded-lg text-[11px] font-bold text-text-primary transition-all flex items-center gap-1 cursor-pointer">
                      + 📊 Niveau d'études
                    </button>
                    <button type="button" onClick={() => handleAddPresetField('program')} className="px-2.5 py-1 bg-bg-secondary hover:bg-brand-primary hover:text-white border border-border-primary rounded-lg text-[11px] font-bold text-text-primary transition-all flex items-center gap-1 cursor-pointer">
                      + 🎓 Filière IDLA
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center border-b border-border-primary/50 pb-2 pt-2">
                  <h5 className="font-bold text-xs text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-brand-primary" /> Structure & Champs ({builderFields.length})
                  </h5>
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="text-xs font-bold text-brand-primary bg-brand-primary/10 hover:bg-brand-primary hover:text-white px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter un champ personnalisé
                  </button>
                </div>

                <div className="space-y-4">
                  {builderFields.map((field, idx) => (
                    <div key={field.id} className="bg-bg-primary border border-border-primary rounded-xl p-4 space-y-3 relative group transition-all hover:border-brand-primary/40 shadow-sm">
                      <div className="flex items-center justify-between gap-3 border-b border-border-primary/50 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded">
                            Champ #{idx + 1}
                          </span>
                          <span className="text-[11px] font-bold text-text-secondary">
                            (ID: {field.id})
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleMoveField(idx, 'up')}
                              className="p-1 text-text-secondary hover:text-brand-primary hover:bg-bg-secondary rounded cursor-pointer"
                              title="Déplacer vers le haut"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                          )}
                          {idx < builderFields.length - 1 && (
                            <button
                              type="button"
                              onClick={() => handleMoveField(idx, 'down')}
                              className="p-1 text-text-secondary hover:text-brand-primary hover:bg-bg-secondary rounded cursor-pointer"
                              title="Déplacer vers le bas"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDuplicateField(field.id)}
                            className="p-1 text-text-secondary hover:text-brand-primary hover:bg-bg-secondary rounded cursor-pointer"
                            title="Dupliquer ce champ"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveField(field.id)}
                            className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-500/10 rounded cursor-pointer ml-1"
                            title="Supprimer ce champ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-text-secondary uppercase">Texte indicatif (Placeholder)</label>
                          <input
                            type="text"
                            value={field.placeholder || ''}
                            onChange={(e) => handleUpdateField(field.id, 'placeholder', e.target.value)}
                            placeholder="ex: Saisissez votre réponse ici..."
                            className="w-full p-2 rounded-lg border border-border-primary bg-bg-secondary text-text-primary text-xs"
                          />
                        </div>

                        {/* Help text */}
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[10px] font-bold text-text-secondary uppercase">Message d'aide / Infobulle (Facultatif)</label>
                          <input
                            type="text"
                            value={field.helpText || ''}
                            onChange={(e) => handleUpdateField(field.id, 'helpText', e.target.value)}
                            placeholder="ex: Indiquez votre numéro actif sur WhatsApp..."
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

                        {/* Age Constraint (Date fields only) */}
                        {field.type === 'date' && (
                          <div className="md:col-span-3 bg-amber-500/5 border border-amber-500/30 rounded-xl p-3 space-y-2">
                            <label className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase flex items-center gap-1.5">
                              🔒 Contrainte d'âge (Validation automatique)
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-text-secondary uppercase">Âge minimum (ans)</label>
                                <input
                                  type="number"
                                  min={0}
                                  max={120}
                                  value={field.minAge ?? ''}
                                  onChange={(e) => handleUpdateField(field.id, 'minAge', e.target.value ? Number(e.target.value) : undefined)}
                                  placeholder="ex: 16"
                                  className="w-full p-2 rounded-lg border border-border-primary bg-bg-secondary text-text-primary text-xs font-bold"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-text-secondary uppercase">Âge maximum (ans)</label>
                                <input
                                  type="number"
                                  min={0}
                                  max={120}
                                  value={field.maxAge ?? ''}
                                  onChange={(e) => handleUpdateField(field.id, 'maxAge', e.target.value ? Number(e.target.value) : undefined)}
                                  placeholder="ex: 60"
                                  className="w-full p-2 rounded-lg border border-border-primary bg-bg-secondary text-text-primary text-xs font-bold"
                                />
                              </div>
                            </div>
                            <p className="text-[10px] text-text-secondary italic">
                              Laissez vide pour ne pas appliquer de contrainte d'âge.
                            </p>
                          </div>
                        )}

                        {/* Option parent cascade */}
                        {['select', 'radio', 'checkbox'].includes(field.type) && (
                          <div className="space-y-1 md:col-span-2">
                            <label className="text-[10px] font-bold text-brand-primary uppercase">
                              Dépendance (Lier ce champ au résultat d'un autre)
                            </label>
                            <select
                              value={field.cascadeParentId || ''}
                              onChange={(e) => handleUpdateField(field.id, 'cascadeParentId', e.target.value || undefined)}
                              className="w-full p-2 rounded-lg border border-brand-primary/40 bg-bg-secondary text-text-primary text-xs font-bold"
                            >
                              <option value="">-- Indépendant (Affiche toutes les options) --</option>
                              {builderFields.filter(f => f.id !== field.id).map(f => (
                                <option key={f.id} value={f.id}>
                                  🔗 Lié au champ : {f.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* WhatsApp-Style Option Tags Input */}
                        {['select', 'radio', 'checkbox'].includes(field.type) && (
                          <div className="space-y-1 md:col-span-3 pt-2">
                            <label className="text-[10px] font-bold text-brand-primary uppercase flex items-center gap-1">
                              <span>Options de réponse (Style WhatsApp / Tags)</span>
                            </label>
                            <FormBuilderOptionTags
                              options={field.options || []}
                              onChange={(newOpts) => handleUpdateField(field.id, 'options', newOpts)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 flex justify-end gap-3 border-t border-border-primary/50">
                <button
                  type="button"
                  onClick={resetFormBuilder}
                  className="px-5 py-2 rounded-lg text-xs font-bold text-text-secondary hover:bg-bg-primary border border-border-primary cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
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
                  className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition-all shadow-sm"
                >
                  Créer votre premier formulaire
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab 2 : Réponses Reçues & Export CSV ── */}
      {activeTab === 'responses' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-sm text-text-primary uppercase tracking-wider">Réponses aux formulaires</h4>
              <p className="text-xs text-text-secondary mt-0.5">Consultez et exportez toutes les soumissions effectuées par les candidats.</p>
            </div>

            <div className="flex items-center gap-3">
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
                <tr className="bg-bg-primary text-text-secondary border-b border-border-primary/50 font-bold uppercase">
                  <th className="p-4">Formulaire</th>
                  <th className="p-4">Nom du Répondant</th>
                  <th className="p-4">Email / Contact</th>
                  <th className="p-4">Date de soumission</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary/40">
                {filteredResponses.map((resp) => (
                  <tr key={resp.id} className="hover:bg-bg-primary/50 transition-colors">
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedResponse(null)}>
          <div className="bg-bg-secondary text-text-primary w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-border-primary space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary/50 bg-bg-primary">
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

            <div className="p-4 border-t border-border-primary/50 flex justify-end">
              <button
                onClick={() => setSelectedResponse(null)}
                className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-5 py-2 rounded-xl cursor-pointer shadow-sm"
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
