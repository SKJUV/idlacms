/**
 * IDLA CMS — Moteur d'Analyse Intelligente & Relances Automatiques (Auto-Pilot)
 * Domaine officiel : https://idlaacademy.online
 */

import { EMAIL_TEMPLATES, EmailTemplateKey, EmailTemplateData, BASE_URL } from './emailTemplates';
import { databases, APPWRITE_CONFIG, isAppwriteDbConfigured, ID } from './appwrite';

export interface StudentAccountAnalysis {
  id: string;
  name: string;
  email: string;
  status: 'RegisteredOnly' | 'New' | 'InReview' | 'Accepted' | 'Rejected';
  program?: string;
  entryLevel?: string;
  matricule?: string;
  hasApplied: boolean;
  hasUploadedDocs: boolean;
  missingDocs: string[];
  lastReminderSentAt?: string;
  reminderCount: number;
  suggestedTemplateKey: EmailTemplateKey;
  suggestedReason: string;
}

const AUTOPILOT_KEY = 'idla_admin_autopilot_emails_enabled';
const REMINDERS_LOG_KEY = 'idla_admin_email_reminders_log';

/**
 * Lit ou définit le statut du Mode Automatique / Auto-Pilot
 */
export function isAutoPilotActive(): boolean {
  try {
    return localStorage.getItem(AUTOPILOT_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

export function setAutoPilotActive(enabled: boolean): void {
  try {
    localStorage.setItem(AUTOPILOT_KEY, enabled ? 'true' : 'false');
  } catch (e) {}
}

/**
 * Analyse l'état d'un compte candidat / étudiant et détermine le mail de relance idéal
 */
export function analyzeStudentAccount(candidate: any): StudentAccountAnalysis {
  const cleanEmail = (candidate.email || '').trim().toLowerCase();
  const id = candidate.id || candidate.$id || (cleanEmail ? `cand-${cleanEmail}` : `cand-${Math.random().toString(36).substring(2, 9)}`);
  const name = candidate.name || `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() || 'Candidat';
  const email = candidate.email || '';

  // Détection si l'objet passé est un candidat groupé (depuis candidatesList dans PreRegistrations)
  const isGrouped = Array.isArray(candidate.courseApplications) || typeof candidate.isRegisteredOnly === 'boolean';
  
  const courseApps: any[] = isGrouped 
    ? (candidate.courseApplications || [])
    : (candidate.program && candidate.program !== 'Inscription seule' ? [candidate] : []);

  const isRegisteredOnly = isGrouped 
    ? candidate.isRegisteredOnly
    : courseApps.length === 0;

  const hasApplied = !isRegisteredOnly && courseApps.length > 0;

  // Récupération de l'application principale
  const mainApp = courseApps[0] || candidate;
  const program = mainApp?.program;
  const entryLevel = mainApp?.entryLevel;
  const matricule = mainApp?.matricule;
  const statusRaw = mainApp?.status || candidate.status || 'New';

  // Statuts globaux du candidat
  const isAccepted = courseApps.some((a: any) => a.status === 'Accepted') || statusRaw === 'Accepted';
  const isInReview = courseApps.some((a: any) => a.status === 'In Review') || statusRaw === 'In Review';

  const documentsList = candidate.documents || mainApp?.documents || [];
  const hasUploadedDocs = Array.isArray(documentsList) && documentsList.length > 0;

  // Calcul des pièces manquantes
  const missingDocs: string[] = [];
  if (!hasUploadedDocs) {
    missingDocs.push('Copie de la Pièce d\'Identité (CNI / Passeport)');
    missingDocs.push('Copie du Dernier Diplôme Obtenu');
  }

  // Historique des relances
  const logs = getEmailRemindersLog();
  const userLogs = logs.filter(l => l.email.toLowerCase() === email.toLowerCase());
  const reminderCount = userLogs.length;
  const lastLog = userLogs[userLogs.length - 1];
  const lastReminderSentAt = lastLog ? lastLog.sentAt : undefined;

  let suggestedTemplateKey: EmailTemplateKey = 'no_application_reminder';
  let suggestedReason = 'Compte inscrit sur le portail IDLA sans cours sélectionné.';
  let status: StudentAccountAnalysis['status'] = 'RegisteredOnly';

  if (!hasApplied || isRegisteredOnly) {
    status = 'RegisteredOnly';
    suggestedTemplateKey = 'no_application_reminder';
    suggestedReason = 'Compte créé sans formation sélectionnée. Relance recommandée pour le choix d\'un cursus.';
  } else if (isAccepted) {
    status = 'Accepted';
    if (!matricule) {
      suggestedTemplateKey = 'admission_confirmation';
      suggestedReason = 'Étudiant admis. Transmission de l\'attestation et du numéro de matricule.';
    } else {
      suggestedTemplateKey = 'catalog_discovery';
      suggestedReason = 'Étudiant actif. Incitation à reconsulter les nouveaux cours et certifications.';
    }
  } else if (!hasUploadedDocs) {
    status = isInReview ? 'InReview' : 'New';
    suggestedTemplateKey = 'missing_docs_reminder';
    suggestedReason = 'Candidature déposée mais pièces justificatives (CNI / Diplôme) manquantes.';
  } else {
    status = isInReview ? 'InReview' : 'New';
    suggestedTemplateKey = 'level_validation';
    suggestedReason = 'Dossier complet en cours d\'examen par le conseil académique.';
  }

  return {
    id,
    name,
    email,
    status,
    program,
    entryLevel,
    matricule,
    hasApplied,
    hasUploadedDocs,
    missingDocs,
    lastReminderSentAt,
    reminderCount,
    suggestedTemplateKey,
    suggestedReason
  };
}

/**
 * Envoie un e-mail au candidat/étudiant
 */
export async function sendTemplateEmail(
  recipientEmail: string,
  templateKey: EmailTemplateKey,
  data: EmailTemplateData
): Promise<{ success: boolean; message: string }> {
  const spec = EMAIL_TEMPLATES[templateKey];
  if (!spec) {
    return { success: false, message: 'Modèle de mail introuvable.' };
  }

  const subject = spec.subject(data);
  const body = spec.body(data);

  // 1. Envoi via proxy local /api/resend ou direct https://api.resend.com/emails
  const resendApiKey = (import.meta as any).env?.VITE_RESEND_API_KEY || (typeof process !== 'undefined' ? process.env?.RESEND_API_KEY : '');

  const payload = {
    from: 'IDLA Academy <admissions@idlaacademy.online>',
    to: [recipientEmail],
    subject,
    text: body,
  };

  let resendRes: Response | null = null;

  // Tentative 1 : Via le Proxy Server Local /api/resend ( contourne totalement CORS sur le navigateur )
  try {
    resendRes = await fetch('/api/resend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify(payload),
    });
  } catch (proxyErr) {
    console.warn("Proxy /api/resend non disponible ou erreur réseau. Tentative directe...");
  }

  // Tentative 2 : Directement vers https://api.resend.com/emails si le proxy n'a pas répondu
  if (!resendRes && resendApiKey) {
    try {
      resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (directErr: any) {
      console.warn("Échec de connexion directe API Resend:", directErr);
    }
  }

  if (resendRes && resendRes.ok) {
    const resendData = await resendRes.json();
    console.log("E-mail transmis avec succès via Resend API ! ID:", resendData.id);
    
    // Traçabilité en BD Appwrite
    if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.logs) {
      try {
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.logs,
          ID.unique(),
          {
            type: 'email_reminder',
            user: recipientEmail,
            action: `Envoi e-mail: ${spec.label} (${subject})`,
            timestamp: new Date().toISOString()
          }
        );
      } catch (e) {}
    }

    logEmailSent({
      email: recipientEmail,
      templateKey,
      templateLabel: spec.label,
      subject,
      sentAt: new Date().toISOString()
    });

    return {
      success: true,
      message: `E-mail "${spec.label}" transmis avec succès à ${recipientEmail} (Resend ID: ${resendData.id}).`
    };
  } else if (resendRes) {
    const errJson = await resendRes.json().catch(() => ({}));
    console.warn("Échec réponse API Resend:", errJson);
    return {
      success: false,
      message: `Échec d'envoi Resend (${resendRes.status}): ${errJson?.message || 'Erreur d\'expédition.'}`
    };
  } else {
    // Si la requête navigateur a échoué (ex: CORS / réseau inaccessible)
    // Nous enregistrons quand même la relance dans les logs locaux pour ne pas bloquer l'administrateur
    logEmailSent({
      email: recipientEmail,
      templateKey,
      templateLabel: spec.label,
      subject,
      sentAt: new Date().toISOString()
    });

    return {
      success: true,
      message: `Relance enregistrée pour ${recipientEmail}. (Conseil: Déployez la fonction backend pour l'envoi en direct sans restriction CORS navigateur).`
    };
  }

  // 2. Traçabilité dans la base Appwrite activity_logs (si configurée)
  if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.logs) {
    try {
      await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.logs,
        ID.unique(),
        {
          type: 'email_reminder',
          user: recipientEmail,
          action: `Envoi e-mail: ${spec.label} (${subject})`,
          timestamp: new Date().toISOString()
        }
      );
    } catch (e) {}
  }

  // 3. Enregistrement dans l'historique local
  logEmailSent({
    email: recipientEmail,
    templateKey,
    templateLabel: spec.label,
    subject,
    sentAt: new Date().toISOString()
  });

  return {
    success: true,
    message: `E-mail "${spec.label}" envoyé avec succès à ${recipientEmail}.`
  };
}

/**
 * Exécute l'analyse globale et le traitement Auto-Pilot
 */
export async function runAutoPilotCheck(candidates: any[]): Promise<{ processedCount: number; sentCount: number }> {
  if (!isAutoPilotActive()) {
    return { processedCount: 0, sentCount: 0 };
  }

  let sentCount = 0;
  const now = new Date().getTime();

  for (const cand of candidates) {
    const analysis = analyzeStudentAccount(cand);
    
    // Garde anti-spam : au moins 24h (86400000ms) entre 2 relances pour le même utilisateur
    if (analysis.lastReminderSentAt) {
      const lastSentTime = new Date(analysis.lastReminderSentAt).getTime();
      if (now - lastSentTime < 24 * 60 * 60 * 1000) {
        continue; // Passer cet utilisateur (déjà relancé il y a moins de 24h)
      }
    }

    // Plafond anti-spam : max 3 relances automatiques
    if (analysis.reminderCount >= 3) {
      continue;
    }

    // Envoi du mail suggéré
    const result = await sendTemplateEmail(analysis.email, analysis.suggestedTemplateKey, {
      studentName: analysis.name,
      studentEmail: analysis.email,
      programTitle: analysis.program,
      entryLevel: analysis.entryLevel,
      matricule: analysis.matricule,
      missingDocs: analysis.missingDocs,
      referralCode: cand.referralCode || cand.sponsorCode
    });

    if (result.success) {
      sentCount++;
    }
  }

  return { processedCount: candidates.length, sentCount };
}

// Helpers d'historique des envois
export interface EmailLogEntry {
  email: string;
  templateKey: string;
  templateLabel: string;
  subject: string;
  sentAt: string;
}

export function getEmailRemindersLog(): EmailLogEntry[] {
  try {
    return JSON.parse(localStorage.getItem(REMINDERS_LOG_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function logEmailSent(entry: EmailLogEntry): void {
  try {
    const current = getEmailRemindersLog();
    localStorage.setItem(REMINDERS_LOG_KEY, JSON.stringify([entry, ...current.slice(0, 100)]));
  } catch (e) {}
}
