import React, { useState, useEffect, type FormEvent } from 'react';
import { 
  FileTextIcon, ShieldAlertIcon as ShieldAlert, CheckCircle2Icon as CheckCircle2, 
  SendIcon as Send, ArrowLeftIcon, AlertTriangleIcon as AlertTriangle, 
  GraduationCapIcon, ClockIcon, DownloadIcon, CopyIcon, SunIcon, MoonIcon
} from './Icons';
import { CustomForm, CustomFormResponse, NewsArticle, Program } from '../types';
import { databases, APPWRITE_CONFIG, isAppwriteDbConfigured, ID } from '../lib/appwrite';
import { generateFormPdfBase64 } from '../lib/pdfFormGenerator';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

interface FormPageProps {
  formId?: string;
  onBack: () => void;
  newsList?: NewsArticle[];
  programs?: Program[];
  theme?: 'light' | 'dark';
  setTheme?: (theme: 'light' | 'dark') => void;
}

export default function FormPage({ formId: initialFormId, onBack, newsList = [], programs = [], theme = 'light', setTheme }: FormPageProps) {
  const { t, language } = useLanguage();
  const [form, setForm] = useState<CustomForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [receiptRef, setReceiptRef] = useState('');
  const [pdfBase64Data, setPdfBase64Data] = useState('');

  // Extract formId from URL query string if not passed directly
  const effectiveFormId = React.useMemo(() => {
    if (initialFormId) return initialFormId;
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const queryId = searchParams.get('id') || searchParams.get('formId') || searchParams.get('article');
      if (queryId) return queryId;
    }
    return '';
  }, [initialFormId]);

  // Load form from Appwrite Cloud DB
  useEffect(() => {
    const loadForm = async () => {
      setLoading(true);
      setError('');

      if (!effectiveFormId) {
        // Fallback: load first active custom form
        if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.customForms) {
          try {
            const listRes = await databases.listDocuments(
              APPWRITE_CONFIG.databaseId, 
              APPWRITE_CONFIG.collections.customForms
            );
            if (listRes.documents.length > 0) {
              const doc = listRes.documents[0];
              setForm({
                id: doc.$id,
                title: doc.title,
                description: doc.description || '',
                createdAt: doc.createdAt,
                fields: JSON.parse(doc.fields || '[]')
              });
              setLoading(false);
              return;
            }
          } catch (e) {}
        }
        setError('Aucun formulaire spécifié.');
        setLoading(false);
        return;
      }

      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.customForms) {
        try {
          let doc: any = null;
          try {
            doc = await databases.getDocument(
              APPWRITE_CONFIG.databaseId, 
              APPWRITE_CONFIG.collections.customForms, 
              effectiveFormId
            );
          } catch {
            const listRes = await databases.listDocuments(
              APPWRITE_CONFIG.databaseId, 
              APPWRITE_CONFIG.collections.customForms
            );
            doc = listRes.documents.find((d: any) => d.$id === effectiveFormId || d.title === effectiveFormId) || listRes.documents[0];
          }

          if (doc) {
            setForm({
              id: doc.$id,
              title: doc.title,
              description: doc.description || '',
              createdAt: doc.createdAt,
              fields: JSON.parse(doc.fields || '[]')
            });
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error("Erreur chargement formulaire:", err);
        }
      }

      setError('Formulaire introuvable ou indisponible.');
      setLoading(false);
    };

    loadForm();
  }, [effectiveFormId]);

  // Submit Handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setEmailError('');

    const respondentName = formValues['Nom complet'] || formValues['Nom & Prénom'] || formValues['Nom'] || formValues['Nom de famille'] || 'Candidat IDLA';

    // Strict Email Detection
    const emailKey = Object.keys(formValues).find(
      k => k.toLowerCase().includes('email') || k.toLowerCase().includes('e-mail') || k.toLowerCase().includes('courriel')
    );
    const respondentEmail = emailKey ? String(formValues[emailKey]).trim() : '';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!respondentEmail || !emailRegex.test(respondentEmail)) {
      setEmailError("⚠️ Veuillez renseigner une adresse e-mail exacte et valide (ex: candidat@gmail.com). Votre fiche officielle PDF et votre récépissé de validation y seront transmis.");
      return;
    }

    setIsSubmitting(true);
    const refNum = `REF-IDLA-${Math.floor(100000 + Math.random() * 900000)}`;
    setReceiptRef(refNum);

    const newResponseId = isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.formResponses ? ID.unique() : `resp-${Date.now()}`;
    const newResponse: CustomFormResponse = {
      id: newResponseId,
      formId: form.id,
      formTitle: form.title,
      submittedAt: new Date().toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }),
      respondentName,
      respondentEmail,
      data: formValues
    };

    // Store in Appwrite Cloud DB
    if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.formResponses) {
      try {
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.formResponses,
          newResponseId,
          {
            formId: newResponse.formId,
            formTitle: newResponse.formTitle,
            respondentName: newResponse.respondentName,
            respondentEmail: newResponse.respondentEmail,
            submittedAt: newResponse.submittedAt,
            data: JSON.stringify(newResponse.data)
          }
        );
      } catch (err) {
        console.error("Erreur enregistrement réponse Appwrite:", err);
      }
    }

    // PDF & Dual Email Send
    try {
      const pdfB64 = generateFormPdfBase64(form, formValues, refNum);
      setPdfBase64Data(pdfB64);

      const emailBodyHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #166534; color: white; padding: 28px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px; font-weight: bold;">IDLA ACADEMY</h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Institut Supérieur de Formation & d'Innovation</p>
          </div>
          <div style="padding: 28px; color: #1e293b; line-height: 1.6;">
            <h3 style="color: #166534; margin-top: 0;">Confirmation de Candidature & Récépissé Officiel</h3>
            <p>Bonjour <strong>${respondentName}</strong>,</p>
            <p>Votre dossier pour le formulaire <strong>${form.title}</strong> a bien été enregistré par l'administration académique IDLA.</p>
            <div style="background-color: #f1f5f9; padding: 14px 18px; border-radius: 10px; font-weight: bold; color: #166534; display: inline-block; margin: 12px 0;">
              Référence officielle du dossier : ${refNum}
            </div>
            <p>Veuillez trouver <strong>ci-joint votre récépissé d'inscription et fiche de candidature au format PDF</strong>.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <h4 style="color: #166534; margin-bottom: 10px;">Récapitulatif des informations enregistrées :</h4>
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              ${Object.entries(formValues).map(([k, v], i) => `
                <tr style="background-color: ${i % 2 === 0 ? '#f8fafc' : '#ffffff'};">
                  <td style="padding: 8px 12px; font-weight: bold; width: 40%; color: #475569;">${k}</td>
                  <td style="padding: 8px 12px; color: #0f172a;">${Array.isArray(v) ? v.join(', ') : v}</td>
                </tr>
              `).join('')}
            </table>
          </div>
          <div style="background-color: #f8fafc; text-align: center; padding: 18px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
            IDLA Academy — <a href="https://www.idlaacademy.online" style="color: #166534; font-weight: bold; text-decoration: none;">www.idlaacademy.online</a><br />
            Assistance admissions : <a href="mailto:admissions@idlaacademy.online" style="color: #166534;">admissions@idlaacademy.online</a>
          </div>
        </div>
      `;

      await fetch('/api/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: [respondentEmail, 'admissions@idlaacademy.online', 'idlaacademy@gmail.com'],
          subject: `[Récépissé IDLA ${refNum}] Confirmation d'inscription - ${form.title}`,
          html: emailBodyHtml,
          attachments: [
            {
              filename: `Recepisse_Inscription_IDLA_${refNum}.pdf`,
              content: pdfB64,
            }
          ]
        })
      });
    } catch (err) {
      console.error("Erreur génération PDF / Envoi mail:", err);
    }

    setIsSubmitting(false);
    setIsSuccess(true);
  };

  // Download PDF locally
  const handleDownloadPdf = () => {
    if (!pdfBase64Data) return;
    const byteCharacters = atob(pdfBase64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Recepisse_Inscription_IDLA_${receiptRef}.pdf`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-text-secondary">Chargement du formulaire officiel IDLA Academy...</p>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center p-6">
        <div className="bg-bg-secondary p-8 rounded-3xl border border-border-primary max-w-md text-center space-y-4 shadow-xl">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-lg font-bold text-text-primary">Formulaire Non Accessible</h3>
          <p className="text-xs text-text-secondary">{error || "Le formulaire demandé est introuvable."}</p>
          <button
            onClick={onBack}
            className="bg-brand-primary hover:bg-brand-hover text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            ← Retour au portail
          </button>
        </div>
      </div>
    );
  }

  // Parse Fee from Description
  const desc = form.description || '';
  const feeMatch = desc.match(/(\d[\d\s]*\d)\s*FCFA/i);
  const feeAmount = feeMatch ? feeMatch[1] : null;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-bg-primary text-text-primary flex flex-col font-sans">
      {/* ── BARRE DE NAVIGATION EN TÊTE ── */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-bg-secondary/90 backdrop-blur-md border-b border-border-primary shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-bg-primary hover:bg-brand-primary/10 text-text-secondary hover:text-brand-primary border border-border-primary transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Retour</span>
            </button>
            <div className="h-5 w-[1px] bg-border-primary hidden sm:block" />
            <div className="flex items-center gap-2">
              <GraduationCapIcon className="w-6 h-6 text-brand-primary" />
              <span className="font-extrabold text-base tracking-tight text-text-primary">
                IDLA <span className="text-brand-primary">ACADEMY</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Native Language Switcher FR / EN */}
            <LanguageSwitcher />

            {/* Changeur de Thème intégrateur */}
            {setTheme && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-xl bg-bg-primary hover:bg-border-primary/50 text-text-secondary hover:text-text-primary border border-border-primary transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                title={theme === 'dark' ? 'Passer en Mode Clair' : 'Passer en Mode Sombre'}
              >
                {theme === 'dark' ? (
                  <>
                    <SunIcon className="w-4 h-4 text-amber-400" />
                    <span className="hidden sm:inline text-text-primary">Clair</span>
                  </>
                ) : (
                  <>
                    <MoonIcon className="w-4 h-4 text-slate-700" />
                    <span className="hidden sm:inline text-text-primary">Sombre</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── CONTENU PRINCIPAL DE LA PAGE DÉDIÉE ── */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Fil d'Ariane */}
        <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
          <button onClick={onBack} className="hover:text-brand-primary cursor-pointer">Accueil</button>
          <span>/</span>
          <span>Formulaires Officiels</span>
          <span>/</span>
          <span className="text-brand-primary truncate">{form.title}</span>
        </div>

        {/* Hero Section du Formulaire */}
        <div className="bg-gradient-to-br from-brand-primary/15 via-brand-primary/5 to-transparent border border-brand-primary/30 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-primary bg-brand-primary/15 px-3 py-1 rounded-full border border-brand-primary/30 flex items-center gap-1.5">
              <FileTextIcon className="w-3.5 h-3.5" /> Formulaire de Candidature Officiel
            </span>
            <div className="flex items-center gap-3 text-xs font-bold text-text-secondary">
              <span className="flex items-center gap-1"><ClockIcon className="w-4 h-4 text-brand-primary" /> ~3 min</span>
              <span>•</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-brand-primary" /> Récépissé PDF Immédiat</span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              {form.title}
            </h1>
            <p className="text-sm text-text-secondary mt-2 leading-relaxed max-w-3xl">
              {form.description}
            </p>
          </div>
        </div>

        {/* Conteneur Formulaire ou Écran de Succès */}
        {isSuccess ? (
          <div className="bg-white dark:bg-bg-secondary border border-emerald-500/30 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Validation & Enregistrement Effectué
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary">
                Candidature Transmise avec Succès !
              </h2>
              <p className="text-sm text-text-secondary max-w-lg mx-auto leading-relaxed pt-1">
                Vos informations ont été enregistrées avec succès. Votre **récépissé officiel d'inscription (PDF)** a été transmis par e-mail à l'adresse indiquée et à l'administration académique IDLA.
              </p>
            </div>

            <div className="bg-bg-primary p-5 rounded-2xl border border-border-primary max-w-md mx-auto space-y-2 text-left text-xs font-semibold">
              <div className="flex justify-between border-b border-border-primary/60 pb-2">
                <span className="text-text-secondary">Référence dossier :</span>
                <span className="font-extrabold text-brand-primary">{receiptRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Statut du dossier :</span>
                <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> En cours d'analyse
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap justify-center gap-4">
              <button
                onClick={handleDownloadPdf}
                className="bg-brand-primary hover:bg-brand-hover text-white font-extrabold text-xs px-6 py-3.5 rounded-2xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <DownloadIcon className="w-4 h-4" /> Télécharger mon Récépissé PDF
              </button>
              <button
                onClick={onBack}
                className="bg-bg-primary hover:bg-border-primary/50 text-text-primary border border-border-primary font-extrabold text-xs px-6 py-3.5 rounded-2xl transition-all cursor-pointer"
              >
                Retourner à l'accueil
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-bg-secondary border border-border-primary rounded-3xl p-6 sm:p-10 shadow-xl space-y-8">
            {emailError && (
              <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>{emailError}</span>
              </div>
            )}

            {/* Render Fields in Clean Sections */}
            <div className="space-y-6">
              {form.fields.map((f, idx) => {
                const val = formValues[f.label] || '';

                // Filtrage automatique des diplômes académiques (exclut les Certifications)
                const degreePrograms = (programs || []).filter(p => p.type !== 'Certification' && p.category !== 'Certification');
                const degreeTitles = degreePrograms.map(p => p.title);

                const isProgramField = f.label.toLowerCase().includes('filière') || f.label.toLowerCase().includes('programme') || f.label.toLowerCase().includes('formation');

                let availableOptions = f.options || [];

                // Si c'est un champ de filières et qu'il n'a pas d'options explicites, prendre la liste des diplômes académiques
                if (isProgramField && degreeTitles.length > 0 && (availableOptions.length === 0 || availableOptions.some(o => o.includes('Génie') || o.includes('Informatique')))) {
                  availableOptions = degreeTitles;
                }

                // Détection dynamique du Niveau d'études sélectionné
                let selectedLevelVal = '';
                if (f.cascadeParentId) {
                  const parentField = form.fields.find((p) => p.id === f.cascadeParentId);
                  if (parentField) selectedLevelVal = String(formValues[parentField.label] || '');
                }
                if (!selectedLevelVal) {
                  const levelKey = Object.keys(formValues).find(k => k.toLowerCase().includes('niveau'));
                  if (levelKey) selectedLevelVal = String(formValues[levelKey] || '');
                }

                // Application stricte de la logique de Niveau :
                // - BSc / Licence (1ère ou 3ème année) -> Filtre les programmes Bachelor / Licence
                // - Master (4ème année) -> Filtre les programmes Master / MSc / LLM
                if (selectedLevelVal && isProgramField) {
                  const levelLower = selectedLevelVal.toLowerCase();

                  if (levelLower.includes('1ère') || levelLower.includes('1ere') || levelLower.includes('3ème') || levelLower.includes('3eme') || levelLower.includes('licence') || levelLower.includes('bsc') || levelLower.includes('bachelor')) {
                    availableOptions = availableOptions.filter(o => {
                      const oLower = o.toLowerCase();
                      return !oLower.includes('master') && !oLower.includes('msc') && !oLower.includes('ll.m') && !oLower.includes('executive') && !oLower.includes('doctorat');
                    });
                  } else if (levelLower.includes('4ème') || levelLower.includes('4eme') || levelLower.includes('master') || levelLower.includes('msc') || levelLower.includes('5ème')) {
                    availableOptions = availableOptions.filter(o => {
                      const oLower = o.toLowerCase();
                      return oLower.includes('master') || oLower.includes('msc') || oLower.includes('ll.m') || oLower.includes('executive') || oLower.includes('magistère');
                    });
                  }
                }

                return (
                  <div key={f.id} className="space-y-2 bg-bg-primary/50 p-5 rounded-2xl border border-border-primary/60 transition-all hover:border-brand-primary/30">
                    <label className="text-xs font-bold text-text-primary flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-brand-primary bg-brand-primary/10 w-5 h-5 rounded-full flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span>{f.label} {f.required && <span className="text-rose-500">*</span>}</span>
                      </span>
                      {f.required && <span className="text-[10px] text-text-secondary uppercase font-semibold">Obligatoire</span>}
                    </label>

                    {f.helpText && (
                      <p className="text-[11px] text-text-secondary italic pl-6">{f.helpText}</p>
                    )}

                    <div className="pl-6 pt-1">
                      {/* Text Input */}
                      {f.type === 'text' && (
                        <input
                          type="text"
                          required={f.required}
                          value={val}
                          placeholder={f.placeholder || ''}
                          onChange={(e) => setFormValues({ ...formValues, [f.label]: e.target.value })}
                          className="w-full p-3 rounded-xl border border-border-primary bg-white dark:bg-bg-secondary text-text-primary text-xs font-medium outline-none focus:ring-2 focus:ring-brand-primary transition-all shadow-sm"
                        />
                      )}

                      {/* Textarea */}
                      {f.type === 'textarea' && (
                        <textarea
                          rows={3}
                          required={f.required}
                          value={val}
                          placeholder={f.placeholder || ''}
                          onChange={(e) => setFormValues({ ...formValues, [f.label]: e.target.value })}
                          className="w-full p-3 rounded-xl border border-border-primary bg-white dark:bg-bg-secondary text-text-primary text-xs font-medium outline-none focus:ring-2 focus:ring-brand-primary transition-all shadow-sm"
                        />
                      )}

                      {/* Number Input */}
                      {f.type === 'number' && (
                        <input
                          type="number"
                          required={f.required}
                          value={val}
                          placeholder={f.placeholder || ''}
                          onChange={(e) => setFormValues({ ...formValues, [f.label]: e.target.value })}
                          className="w-full p-3 rounded-xl border border-border-primary bg-white dark:bg-bg-secondary text-text-primary text-xs font-medium outline-none focus:ring-2 focus:ring-brand-primary transition-all shadow-sm"
                        />
                      )}

                      {/* Date Input */}
                      {f.type === 'date' && (
                        <input
                          type="date"
                          required={f.required}
                          value={val}
                          onChange={(e) => setFormValues({ ...formValues, [f.label]: e.target.value })}
                          className="w-full p-3 rounded-xl border border-border-primary bg-white dark:bg-bg-secondary text-text-primary text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-primary transition-all shadow-sm"
                        />
                      )}

                      {/* Select Dropdown */}
                      {f.type === 'select' && (
                        <select
                          required={f.required}
                          value={val}
                          onChange={(e) => setFormValues({ ...formValues, [f.label]: e.target.value })}
                          className="w-full p-3 rounded-xl border border-border-primary bg-white dark:bg-bg-secondary text-text-primary text-xs font-extrabold outline-none focus:ring-2 focus:ring-brand-primary transition-all shadow-sm"
                        >
                          <option value="">
                            {isProgramField && !selectedLevelVal
                              ? "-- Veuillez d'abord sélectionner votre Niveau d'études ci-dessus --"
                              : isProgramField && selectedLevelVal
                              ? `-- Sélectionnez votre filière (${availableOptions.length} éligibles) --`
                              : "-- Sélectionnez une option --"}
                          </option>
                          {availableOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}

                      {/* Radio Chips */}
                      {f.type === 'radio' && (
                        <div className="flex flex-wrap gap-2.5 pt-1">
                          {availableOptions.map((opt) => {
                            const selected = val === opt;
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setFormValues({ ...formValues, [f.label]: opt })}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-2 ${
                                  selected
                                    ? 'bg-brand-primary text-white border-brand-primary shadow-md'
                                    : 'bg-white dark:bg-bg-secondary text-text-primary border-border-primary hover:border-brand-primary/50'
                                }`}
                              >
                                <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${selected ? 'border-white bg-white' : 'border-text-secondary'}`}>
                                  {selected && <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />}
                                </div>
                                <span>{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Checkbox Chips */}
                      {f.type === 'checkbox' && (
                        <div className="flex flex-wrap gap-2.5 pt-1">
                          {availableOptions.map((opt) => {
                            const currArr: string[] = Array.isArray(val) ? val : [];
                            const checked = currArr.includes(opt);
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                  const next = checked ? currArr.filter((item) => item !== opt) : [...currArr, opt];
                                  setFormValues({ ...formValues, [f.label]: next });
                                }}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-2 ${
                                  checked
                                    ? 'bg-brand-primary text-white border-brand-primary shadow-md'
                                    : 'bg-white dark:bg-bg-secondary text-text-primary border-border-primary hover:border-brand-primary/50'
                                }`}
                              >
                                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${checked ? 'border-white bg-white' : 'border-text-secondary'}`}>
                                  {checked && <CheckCircle2 className="w-3 h-3 text-brand-primary" />}
                                </div>
                                <span>{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* File Upload */}
                      {f.type === 'file' && (
                        <input
                          type="file"
                          required={f.required}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setFormValues({ ...formValues, [f.label]: `${file.name} (Fichier téléversé)` });
                            }
                          }}
                          className="w-full text-xs text-text-secondary border border-border-primary rounded-xl p-2.5 bg-white dark:bg-bg-secondary cursor-pointer"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Notice Officielle & Procédure de Paiement Bancaire */}
            <div className="bg-bg-primary/80 border border-brand-primary/30 rounded-3xl p-6 space-y-5">
              <div className="flex items-center gap-2.5 text-brand-primary font-extrabold text-sm border-b border-border-primary pb-3">
                <FileTextIcon className="w-5 h-5 text-brand-primary" />
                <span>Notice Officielle & Procédure de Candidature</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed text-text-primary">
                {/* Consignes de Paiement et Banques Partenaires */}
                <div className="space-y-3 bg-white dark:bg-bg-secondary p-4.5 rounded-2xl border border-border-primary">
                  <h4 className="font-extrabold text-brand-primary text-xs flex items-center gap-1.5">
                    💳 Règlement des Frais de Concours (10 000 FCFA)
                  </h4>
                  <p className="text-text-secondary text-[11px]">
                    Le règlement des <strong>10 000 FCFA</strong> de frais d'étude de dossier s'effectue auprès de l'un de nos établissements bancaires partenaires :
                  </p>
                  <div className="space-y-2 pt-1 font-mono text-[11px]">
                    <div className="p-2.5 rounded-xl bg-bg-primary border border-border-primary/80">
                      <span className="font-bold text-text-primary block">🏦 UBA (United Bank for Africa)</span>
                      <span className="text-brand-primary font-extrabold select-all">4187 6212 2553 2696</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-bg-primary border border-border-primary/80">
                      <span className="font-bold text-text-primary block">🏦 Afriland First Bank</span>
                      <span className="text-brand-primary font-extrabold select-all">4413 4502 5790 2247</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-text-secondary italic pt-1">
                    * Note : Le bordereau de paiement est facultatif lors de l'inscription en ligne. Vous pourrez le renseigner ou le téléverser ultérieurement.
                  </p>
                </div>

                {/* Pièces à fournir au dossier (FR / EN) */}
                <div className="space-y-2.5 bg-white dark:bg-bg-secondary p-4.5 rounded-2xl border border-border-primary">
                  <h4 className="font-extrabold text-brand-primary text-xs">
                    📑 Composition Officielle du Dossier (FR / EN)
                  </h4>
                  <ul className="space-y-1.5 text-[11px] text-text-secondary list-disc pl-4">
                    <li>Formulaire d'inscription dûment complété.</li>
                    <li>Copie certifiée conforme de l'acte de naissance.</li>
                    <li>Bulletins de notes des 3 dernières années (2nde, 1ère, Terminale / Form 5, Lower 6th, Upper 6th).</li>
                    <li>Attestation du Probatoire / GCE O-Level.</li>
                    <li>Résultats du Baccalauréat / GCE A-Level (admis ou en attente).</li>
                    <li>Relevés de notes & Attestation de réussite de la Licence (pour Master).</li>
                    <li>CV à jour + Photo d'identité récente.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Bar & Submit */}
            <div className="pt-6 border-t border-border-primary flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-3 rounded-2xl text-xs font-bold text-text-secondary hover:bg-bg-primary border border-border-primary cursor-pointer"
              >
                Annuler et Retourner
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-brand-primary disabled:opacity-50 hover:bg-brand-hover text-white text-xs font-extrabold px-8 py-4 rounded-2xl transition-all flex items-center gap-2.5 cursor-pointer shadow-xl"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Génération Récépissé PDF & Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Transmettre ma Candidature Officielle
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border-primary py-6 bg-white dark:bg-bg-secondary mt-12 text-center text-xs text-text-secondary">
        <p>© 2026 IDLA Academy. Tous droits réservés. Plateforme officielle d'admission et d'inscription.</p>
      </footer>
    </div>
  );
}
