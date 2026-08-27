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
import { EVENT_REGISTRATION_FORM } from './PublicPortal';

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

  // Constant default form ID for Concours
  const DEFAULT_CONCOURS_FORM_ID = '6a86f5cc003484813061';

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

  // Load form from Appwrite Cloud DB or LocalStorage
  useEffect(() => {
    const loadForm = async () => {
      setLoading(true);
      setError('');

      const targetFormId = effectiveFormId || DEFAULT_CONCOURS_FORM_ID;

      // 0. Formulaire d'événement système
      if (targetFormId === 'system_event_registration') {
        setForm(EVENT_REGISTRATION_FORM);
        setLoading(false);
        return;
      }

      // 1. Recherche prioritaire dans les formulaires personnalisés locaux (localStorage)
      try {
        const localForms = JSON.parse(localStorage.getItem('idla_custom_forms') || '[]');
        if (Array.isArray(localForms) && localForms.length > 0) {
          const foundLocal = localForms.find((f: any) => f.id === targetFormId);
          if (foundLocal) {
            setForm(foundLocal);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn("Erreur lecture localForms:", e);
      }

      // 2. Recherche sur la base de données Appwrite Cloud
      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.customForms) {
        try {
          let doc: any = null;

          // Essai A: Récupération directe par ID exact
          try {
            doc = await databases.getDocument(
              APPWRITE_CONFIG.databaseId, 
              APPWRITE_CONFIG.collections.customForms, 
              targetFormId
            );
          } catch (docErr) {
            // Essai B: Recherche dans la liste globale si l'ID n'a pas répondu directement
            const listRes = await databases.listDocuments(
              APPWRITE_CONFIG.databaseId, 
              APPWRITE_CONFIG.collections.customForms
            );
            // On cherche l'ID exact en priorité. Fallback Concours uniquement si aucun ID n'était spécifié
            doc = listRes.documents.find((d: any) => d.$id === targetFormId) ||
                  (!effectiveFormId
                    ? listRes.documents.find((d: any) => 
                        d.$id === DEFAULT_CONCOURS_FORM_ID || 
                        d.$id === 'form_concours_1_3_4_b52s6y' ||
                        (d.title && d.title.toLowerCase().includes('concours'))
                      ) || listRes.documents[0]
                    : null);
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

            if (typeof window !== 'undefined' && !window.location.search.includes('id=')) {
              window.history.replaceState({}, '', `${window.location.pathname}?id=${doc.$id}`);
            }
            return;
          }
        } catch (err) {
          console.error("Erreur chargement formulaire Appwrite:", err);
        }
      }

      // 3. Fallback local alternatif si l'ID n'a pas été trouvé sur le cloud
      try {
        const localForms = JSON.parse(localStorage.getItem('idla_custom_forms') || '[]');
        if (Array.isArray(localForms) && localForms.length > 0) {
          // Si aucun ID spécifié, prendre le 1er local
          if (!effectiveFormId) {
            setForm(localForms[0]);
            setLoading(false);
            return;
          }
        }
      } catch (e) {}

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

    // Validate age constraints on all date fields
    for (const f of form.fields) {
      if (f.type === 'date' && (f.minAge != null || f.maxAge != null)) {
        const dateVal = formValues[f.label];
        if (dateVal) {
          const today = new Date();
          const birth = new Date(dateVal);
          let age = today.getFullYear() - birth.getFullYear();
          const monthDiff = today.getMonth() - birth.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
          if (f.minAge != null && age < f.minAge) {
            setEmailError(`⚠️ Le champ « ${f.label} » exige un âge minimum de ${f.minAge} ans. L'âge calculé (${age} ans) est insuffisant.`);
            return;
          }
          if (f.maxAge != null && age > f.maxAge) {
            setEmailError(`⚠️ Le champ « ${f.label} » exige un âge maximum de ${f.maxAge} ans. L'âge calculé (${age} ans) dépasse la limite.`);
            return;
          }
        }
      }
    }

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

    // Auto-open official Concours PDF document hosted on Appwrite Storage
    try {
      const appwritePdfUrl = 'https://cloud.appwrite.io/v1/storage/buckets/documents/files/dossier_concours_idla_2026/view?project=6a44f36c002ed43aca9a';
      if (typeof window !== 'undefined') {
        window.open(appwritePdfUrl, '_blank');
      }
    } catch (e) {}
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
          <button onClick={onBack} className="hover:text-brand-primary cursor-pointer">{t('nav_home')}</button>
          <span>/</span>
          <span>{t('nav_forms')}</span>
          <span>/</span>
          <span className="text-brand-primary truncate">{form.title}</span>
        </div>

        {/* Hero Section du Formulaire */}
        <div className="bg-gradient-to-br from-brand-primary/15 via-brand-primary/5 to-transparent border border-brand-primary/30 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-primary bg-brand-primary/15 px-3 py-1 rounded-full border border-brand-primary/30 flex items-center gap-1.5">
              <FileTextIcon className="w-3.5 h-3.5" /> {t('form_hero_badge')}
            </span>
            <div className="flex items-center gap-3 text-xs font-bold text-text-secondary">
              <span className="flex items-center gap-1"><ClockIcon className="w-4 h-4 text-brand-primary" /> ~3 {t('common_minutes')}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-brand-primary" /> {t('form_pdf_receipt_info')}</span>
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
          <div className="bg-bg-secondary border border-border-primary rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> Enregistrement Confirmé
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary">
                Candidature Transmise avec Succès !
              </h2>
              <p className="text-sm text-text-secondary max-w-lg mx-auto leading-relaxed pt-1">
                Vos informations ont été enregistrées avec succès. Le document des modalités du programme a été ouvert et votre fiche d'inscription officielle a été transmise par e-mail.
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
              <a
                href="https://cloud.appwrite.io/v1/storage/buckets/documents/files/dossier_concours_idla_2026/view?project=6a44f36c002ed43aca9a"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-brand-primary hover:bg-brand-hover text-white font-extrabold text-xs px-6 py-3.5 rounded-2xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <FileTextIcon className="w-4 h-4" /> {t('form_modalites_programmes') || 'Modalités des programmes'}
              </a>
              <button
                onClick={handleDownloadPdf}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3.5 rounded-2xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <DownloadIcon className="w-4 h-4" /> {t('form_download_pdf') || "Fiche d'inscription à télécharger (à joindre au dossier)"}
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
                      {f.type === 'date' && (() => {
                        const today = new Date();
                        const maxDate = f.minAge != null
                          ? new Date(today.getFullYear() - f.minAge, today.getMonth(), today.getDate()).toISOString().split('T')[0]
                          : undefined;
                        const minDate = f.maxAge != null
                          ? new Date(today.getFullYear() - f.maxAge, today.getMonth(), today.getDate()).toISOString().split('T')[0]
                          : undefined;

                        let ageError = '';
                        if (val) {
                          const birth = new Date(val);
                          let age = today.getFullYear() - birth.getFullYear();
                          const monthDiff = today.getMonth() - birth.getMonth();
                          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
                          if (f.minAge != null && age < f.minAge) ageError = `Le candidat doit avoir au moins ${f.minAge} ans.`;
                          if (f.maxAge != null && age > f.maxAge) ageError = `Le candidat ne doit pas dépasser ${f.maxAge} ans.`;
                        }

                        return (
                          <div className="space-y-1">
                            <input
                              type="date"
                              required={f.required}
                              value={val}
                              max={maxDate}
                              min={minDate}
                              onChange={(e) => setFormValues({ ...formValues, [f.label]: e.target.value })}
                              className={`w-full p-3 rounded-xl border bg-white dark:bg-bg-secondary text-text-primary text-xs font-semibold outline-none focus:ring-2 transition-all shadow-sm ${ageError ? 'border-rose-500 focus:ring-rose-500' : 'border-border-primary focus:ring-brand-primary'}`}
                            />
                            {ageError && (
                              <p className="text-[11px] font-bold text-rose-600 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1.5 rounded-lg flex items-center gap-1">
                                ⚠️ {ageError}
                              </p>
                            )}
                            {(f.minAge != null || f.maxAge != null) && !ageError && (
                              <p className="text-[10px] text-text-secondary italic">
                                {f.minAge != null && f.maxAge != null
                                  ? `Âge requis : entre ${f.minAge} et ${f.maxAge} ans.`
                                  : f.minAge != null
                                  ? `Âge minimum requis : ${f.minAge} ans.`
                                  : `Âge maximum autorisé : ${f.maxAge} ans.`}
                              </p>
                            )}
                          </div>
                        );
                      })()}

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

            {/* Notice Officielle & Procédure de Paiement Bancaire (Uniquement pour le Concours) */}
            {(form.id === DEFAULT_CONCOURS_FORM_ID || 
              form.id === '6a86f5cc003484813061' || 
              form.id === 'form_concours_1_3_4_b52s6y' ||
              (form.title && form.title.toLowerCase().includes('concours'))) && (
              <div className="bg-bg-primary/80 border border-brand-primary/30 rounded-3xl p-6 space-y-5">
                <div className="flex items-center gap-2.5 text-brand-primary font-extrabold text-sm border-b border-border-primary pb-3">
                  <FileTextIcon className="w-5 h-5 text-brand-primary" />
                  <span>{t('form_notice_title')}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs leading-relaxed text-text-primary">
                  {/* Lieux d'Évaluation (Afrique Centrale - Uniquement les Pays) */}
                  <div className="space-y-3 bg-white dark:bg-bg-secondary p-4.5 rounded-2xl border border-border-primary flex flex-col justify-between">
                    <div className="space-y-2">
                      <h4 className="font-extrabold text-brand-primary text-xs flex items-center gap-1.5">
                        🌍 {t('form_eval_locations_title')}
                      </h4>
                      <p className="text-text-secondary text-[11px]">
                        {t('form_eval_locations_desc')}
                      </p>
                    </div>
                    <div className="space-y-1.5 pt-1 text-[11px]">
                      <div className="p-1.5 px-2 rounded-xl bg-bg-primary border border-border-primary/80 font-bold text-text-primary flex items-center gap-2">
                        <span>{t('form_eval_cameroon')}</span>
                      </div>
                      <div className="p-1.5 px-2 rounded-xl bg-bg-primary border border-border-primary/80 font-bold text-text-primary flex items-center gap-2">
                        <span>{t('form_eval_gabon')}</span>
                      </div>
                      <div className="p-1.5 px-2 rounded-xl bg-bg-primary border border-border-primary/80 font-bold text-text-primary flex items-center gap-2">
                        <span>{t('form_eval_congo')}</span>
                      </div>
                      <div className="p-1.5 px-2 rounded-xl bg-bg-primary border border-border-primary/80 font-bold text-text-primary flex items-center gap-2">
                        <span>{t('form_eval_tchad')}</span>
                      </div>
                      <div className="p-1.5 px-2 rounded-xl bg-bg-primary border border-border-primary/80 font-bold text-text-primary flex items-center gap-2">
                        <span>{t('form_eval_rca')}</span>
                      </div>
                      <div className="p-1.5 px-2 rounded-xl bg-bg-primary border border-border-primary/80 font-bold text-text-primary flex items-center gap-2">
                        <span>{t('form_eval_guinea')}</span>
                      </div>
                      <div className="p-1.5 px-2 rounded-xl bg-bg-primary border border-border-primary/80 font-bold text-text-primary flex items-center gap-2">
                        <span>{t('form_eval_rdc')}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-brand-primary font-bold pt-1 border-t border-border-primary/60">
                      {t('form_eval_online_note')}
                    </p>
                  </div>

                  {/* Consignes de Paiement et Banques Partenaires */}
                  <div className="space-y-3 bg-white dark:bg-bg-secondary p-4.5 rounded-2xl border border-border-primary flex flex-col justify-between">
                    <div className="space-y-2">
                      <h4 className="font-extrabold text-brand-primary text-xs flex items-center gap-1.5">
                        💳 {t('form_fee_title')}
                      </h4>
                      <p className="text-text-secondary text-[11px]">
                        {t('form_fee_desc')}
                      </p>
                    </div>
                    <div className="space-y-2 pt-1 font-mono text-[11px]">
                      <div className="p-2.5 rounded-xl bg-bg-primary border border-border-primary/80">
                        <span className="font-bold text-text-primary block">{t('form_bank_uba')}</span>
                        <span className="text-brand-primary font-extrabold select-all">4187 6212 2553 2696</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-bg-primary border border-border-primary/80">
                        <span className="font-bold text-text-primary block">{t('form_bank_afriland')}</span>
                        <span className="text-brand-primary font-extrabold select-all">4413 4502 5790 2247</span>
                      </div>
                    </div>
                  </div>

                  {/* Pièces à fournir au dossier (FR / EN) */}
                  <div className="space-y-2.5 bg-white dark:bg-bg-secondary p-4.5 rounded-2xl border border-border-primary">
                    <h4 className="font-extrabold text-brand-primary text-xs">
                      📑 {t('form_dossier_title')}
                    </h4>
                    <ul className="space-y-1.5 text-[11px] text-text-secondary list-disc pl-4">
                      <li>{t('doc_1')}</li>
                      <li>{t('doc_2')}</li>
                      <li>{t('doc_3')}</li>
                      <li>{t('doc_4')}</li>
                      <li>{t('doc_5')}</li>
                      <li>{t('doc_6')}</li>
                      <li>{t('doc_7')}</li>
                    </ul>
                  </div>

                  {/* Modalités de Dépôt du Dossier */}
                  <div className="space-y-3 bg-white dark:bg-bg-secondary p-4.5 rounded-2xl border border-border-primary flex flex-col justify-between">
                    <div className="space-y-2">
                      <h4 className="font-extrabold text-brand-primary text-xs flex items-center gap-1.5">
                        📦 {t('form_submission_title')}
                      </h4>
                      <p className="text-text-secondary text-[11px]">
                        Le dossier de candidature peut être transmis via l'une des deux modalités officielles suivantes :
                      </p>
                    </div>
                    <div className="space-y-2.5 pt-1 text-[11px]">
                      <div className="p-2.5 rounded-xl bg-bg-primary border border-border-primary/80 space-y-1">
                        <span className="font-bold text-text-primary block">{t('form_submission_online')}</span>
                        <span className="text-brand-primary font-extrabold select-all text-[11px] block break-all">{t('form_submission_online_email')}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-bg-primary border border-border-primary/80 space-y-1">
                        <span className="font-bold text-text-primary block">{t('form_submission_physical')}</span>
                        <span className="text-brand-primary font-extrabold text-[11px] block">{t('form_submission_physical_address')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Bar & Submit */}
            <div className="pt-6 border-t border-border-primary flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-3 rounded-2xl text-xs font-bold text-text-secondary hover:bg-bg-primary border border-border-primary cursor-pointer"
              >
                {t('common_cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-brand-primary disabled:opacity-50 hover:bg-brand-hover text-white text-xs font-extrabold px-8 py-4 rounded-2xl transition-all flex items-center gap-2.5 cursor-pointer shadow-xl"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('form_submitting')}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {t('form_submit_btn')}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border-primary py-6 bg-white dark:bg-bg-secondary mt-12 text-center text-xs text-text-secondary">
        <p>{t('footer_rights')}</p>
      </footer>
    </div>
  );
}
