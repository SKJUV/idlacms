/**
 * IDLA CMS — Bibliothèque de Modèles d'E-mails Institutionnels
 * Domaine officiel : https://idlaacademy.online
 * Style : Code de vérification institutionnel, sobre, académique, professionnel, 0 émoji.
 */

export const BASE_URL = 'https://idlaacademy.online';

export interface EmailTemplateData {
  studentName?: string;
  studentEmail?: string;
  programTitle?: string;
  entryLevel?: string;
  matricule?: string;
  missingDocs?: string[];
  meetingDate?: string;
  meetingTime?: string;
  meetingPlatform?: string;
  meetingUrl?: string;
  fileName?: string;
  fileType?: string;
  assignmentTitle?: string;
  assignmentDeadline?: string;
  referralCode?: string;
  customLink?: string;
}

export type EmailTemplateKey =
  | 'no_application_reminder'
  | 'missing_docs_reminder'
  | 'admission_confirmation'
  | 'catalog_discovery'
  | 'live_class_reminder'
  | 'new_course_attachment'
  | 'assignment_deadline'
  | 'level_validation'
  | 'attendance_warning'
  | 'password_reset'
  | 'academic_session_start'
  | 'ambassador_invite'
  | 'course_evaluation';

export interface EmailTemplateSpec {
  key: EmailTemplateKey;
  label: string;
  subject: (data: EmailTemplateData) => string;
  body: (data: EmailTemplateData) => string;
  html: (data: EmailTemplateData) => string;
}

export interface HtmlTemplateParams {
  title: string;
  greeting: string;
  paragraphs: string[];
  calloutTitle?: string;
  calloutItems?: { label?: string; value: string }[];
  highlightBox?: {
    label: string;
    code: string;
    subtext?: string;
  };
  ctaButton?: {
    text: string;
    url: string;
  };
  signatureTitle?: string;
}

export function wrapInInstitutionalEmailTemplate(params: HtmlTemplateParams): string {
  const {
    title,
    greeting,
    paragraphs,
    calloutTitle,
    calloutItems,
    highlightBox,
    ctaButton,
    signatureTitle = 'Le Comité d\'Admissions & Secrétariat Académique',
  } = params;

  const paragraphsHtml = paragraphs
    .map(p => `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">${p}</p>`)
    .join('');

  let calloutHtml = '';
  if (calloutTitle || (calloutItems && calloutItems.length > 0)) {
    const itemsHtml = (calloutItems || []).map(item => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        ${item.label ? `<td style="padding: 10px 14px; font-weight: 600; color: #1e293b; font-size: 13px; width: 38%; background-color: #f8fafc;">${item.label}</td>` : ''}
        <td style="padding: 10px 14px; color: #334155; font-size: 13px;">${item.value}</td>
      </tr>
    `).join('');

    calloutHtml = `
      <div style="margin: 24px 0; background-color: #ffffff; border: 1px solid #cbd5e1; border-left: 4px solid #0f172a; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        ${calloutTitle ? `<div style="padding: 12px 16px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #0f172a; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">${calloutTitle}</div>` : ''}
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          ${itemsHtml}
        </table>
      </div>
    `;
  }

  let highlightHtml = '';
  if (highlightBox) {
    highlightHtml = `
      <div style="margin: 28px 0; text-align: center; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px; border-radius: 12px; border: 1px solid #d97706; box-shadow: 0 4px 12px rgba(15,23,42,0.15);">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #fbbf24; margin-bottom: 8px;">
          ${highlightBox.label}
        </div>
        <div style="font-family: 'Courier New', Courier, monospace; font-size: 26px; font-weight: 800; letter-spacing: 4px; color: #ffffff; background-color: rgba(255,255,255,0.08); padding: 12px 20px; border-radius: 8px; display: inline-block; border: 1px dashed #d97706; margin: 4px 0;">
          ${highlightBox.code}
        </div>
        ${highlightBox.subtext ? `<div style="font-size: 12px; color: #cbd5e1; margin-top: 10px;">${highlightBox.subtext}</div>` : ''}
      </div>
    `;
  }

  let ctaHtml = '';
  if (ctaButton) {
    ctaHtml = `
      <div style="margin: 32px 0 24px 0; text-align: center;">
        <a href="${ctaButton.url}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 8px; border: 1px solid #d97706; letter-spacing: 0.5px; text-transform: uppercase; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          ${ctaButton.text} &rarr;
        </a>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 40px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01);">
          
          <!-- Header Banner -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 24px; border-bottom: 3px solid #d97706;">
              <div style="font-size: 22px; font-weight: 900; letter-spacing: 2px; color: #ffffff; text-transform: uppercase; margin: 0;">
                IDLA ACADEMY
              </div>
              <div style="font-size: 11px; font-weight: 600; letter-spacing: 1.5px; color: #fbbf24; text-transform: uppercase; margin-top: 6px;">
                International Distance Learning Academy
              </div>
            </td>
          </tr>

          <!-- Title Bar -->
          <tr>
            <td style="background-color: #f8fafc; padding: 16px 32px; border-bottom: 1px solid #e2e8f0;">
              <div style="font-size: 13px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                ${title}
              </div>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; background-color: #ffffff;">
              <p style="margin: 0 0 20px 0; font-size: 16px; font-weight: 700; color: #0f172a;">
                ${greeting}
              </p>
              
              ${paragraphsHtml}
              ${calloutHtml}
              ${highlightHtml}
              ${ctaHtml}

              <div style="margin-top: 36px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #475569; line-height: 1.5;">
                <p style="margin: 0 0 4px 0; font-weight: 600; color: #0f172a;">${signatureTitle}</p>
                <p style="margin: 0; color: #64748b; font-size: 13px;">International Distance Learning Academy</p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.6;">
              <p style="margin: 0 0 6px 0; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.5px;">
                International Distance Learning Academy (IDLA)
              </p>
              <p style="margin: 0 0 6px 0;">
                Secrétariat & Admissions : <a href="mailto:admissions@idlaacademy.online" style="color: #2563eb; text-decoration: none; font-weight: 600;">admissions@idlaacademy.online</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                Portail officiel : <a href="https://idlaacademy.online" style="color: #2563eb; text-decoration: none;">https://idlaacademy.online</a> &bull; Tous droits réservés &copy; 2026
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const EMAIL_TEMPLATES: Record<EmailTemplateKey, EmailTemplateSpec> = {
  no_application_reminder: {
    key: 'no_application_reminder',
    label: 'Relance Compte Sans Candidature',
    subject: () => `Complétez votre dossier d'admission — International Distance Learning Academy`,
    body: (d) => `Bonjour ${d.studentName || 'Chers candidat(e)'},

Nous faisons suite à la création de votre compte sur la plateforme de l'International Distance Learning Academy (IDLA).

Nous constatons que votre dossier de candidature n'a pas encore été finalisé. Afin de permettre au comité d'admission d'examiner votre profil pour la prochaine session académique, nous vous invitons à choisir votre programme de formation.

Procédure à suivre :
1. Accédez à votre espace candidat : ${BASE_URL}/etudiant
2. Sélectionnez la formation souhaitée au sein du catalogue (Bachelor, Master, Doctorat ou Certification).
3. Transmettez vos pièces justificatives numérisées.

Documents requis selon le niveau convoité :
- Pièce d'identité officielle (CNI ou Passeport en cours de validité)
- Dernier diplôme obtenu ou attestation provisoire de réussite
- Relevés de notes universitaires (pour les demandes d'admission parallèle)

Notre secrétariat académique reste à votre disposition pour toute assistance complémentaire.

Veuillez agréer l'expression de nos salutations distinguées.

Le Comité d'Admissions IDLA
International Distance Learning Academy
Plateforme : ${BASE_URL}
Contact : admissions@idlaacademy.online`,
    html: (d) => wrapInInstitutionalEmailTemplate({
      title: 'COMPLÉMENT DE DOSSIER D\'ADMISSION',
      greeting: `Bonjour ${d.studentName || 'Cher(e) candidat(e)'},`,
      paragraphs: [
        `Nous faisons suite à la création récente de votre compte personnel sur le portail de l'International Distance Learning Academy (IDLA).`,
        `Afin de permettre au comité académique d'étudier l'éligibilité de votre profil pour la prochaine session d'enseignement, nous vous invitons à finaliser le choix de votre programme de formation.`
      ],
      calloutTitle: 'PROCÉDURE D\'ADMISSION EN 3 ÉTAPES',
      calloutItems: [
        { label: 'Étape 1', value: `Connexion sécurisée à votre espace sur <a href="${BASE_URL}/etudiant" style="color: #2563eb; font-weight: 600;">${BASE_URL}/etudiant</a>` },
        { label: 'Étape 2', value: 'Choix de votre cursus dans le catalogue des programmes (Bachelor, Master, Doctorat, Certification).' },
        { label: 'Étape 3', value: 'Téléversement de vos pièces justificatives (CNI/Passeport et dernier diplôme obtenu).' }
      ],
      ctaButton: {
        text: 'ACCÉDER À MON ESPACE CANDIDAT',
        url: `${BASE_URL}/etudiant`
      },
      signatureTitle: 'Le Comité d\'Admissions IDLA'
    })
  },

  missing_docs_reminder: {
    key: 'missing_docs_reminder',
    label: 'Rappel Pièces Justificatives Manquantes',
    subject: () => `Action requise : Pièces justificatives manquantes pour votre dossier d'admission`,
    body: (d) => `Bonjour ${d.studentName || 'Chers candidat(e)'},

Votre candidature pour la formation ${d.programTitle || 'choisie'} a bien été enregistrée par notre secrétariat.

Après vérification de votre dossier, notre équipe a constaté l'absence des pièces indispensables à l'instruction de votre demande :
${(d.missingDocs && d.missingDocs.length > 0) ? d.missingDocs.map(doc => `- ${doc}`).join('\n') : '- Copie de la pièce d\'identité / Passeport\n- Attestation ou Copie du diplôme'}

Afin de ne pas retarder le traitement de votre candidature, nous vous prions de bien vouloir téléverser ces documents au format PDF ou JPEG directement depuis votre espace personnel : ${BASE_URL}/etudiant (rubrique "Mes Documents").

Dès réception de ces éléments, votre dossier sera transmis au conseil académique pour décision.

Cordialement,

Le Service des Inscriptions IDLA
International Distance Learning Academy
Plateforme : ${BASE_URL}`,
    html: (d) => wrapInInstitutionalEmailTemplate({
      title: 'PIÈCES JUSTIFICATIVES MANQUANTES',
      greeting: `Bonjour ${d.studentName || 'Cher(e) candidat(e)'},`,
      paragraphs: [
        `Votre candidature pour le programme <strong>${d.programTitle || 'académique'}</strong> a bien été transmise à notre secrétariat.`,
        `Après vérification administrative, nous avons constaté qu'il manque des éléments requis pour la validation définitive de votre demande :`
      ],
      calloutTitle: 'DOCUMENTS À FOURNIR EN URGENCE',
      calloutItems: (d.missingDocs && d.missingDocs.length > 0) 
        ? d.missingDocs.map(doc => ({ label: 'Requis', value: doc }))
        : [
            { label: 'Requis', value: 'Copie recto-verso de la Pièce d\'Identité (CNI ou Passeport)' },
            { label: 'Requis', value: 'Copie du Dernier Diplôme Obtenu ou Attestation de Réussite' }
          ],
      ctaButton: {
        text: 'TÉLÉVERSER MES DOCUMENTS',
        url: `${BASE_URL}/etudiant`
      },
      signatureTitle: 'Le Service des Inscriptions IDLA'
    })
  },

  admission_confirmation: {
    key: 'admission_confirmation',
    label: 'Confirmation d\'Admission & Matricule',
    subject: (d) => `Confirmation d'admission — Numéro de Matricule : ${d.matricule || 'IDLA-2026-N/A'}`,
    body: (d) => `Bonjour ${d.studentName || 'Chers étudiant(e)'},

Nous avons le plaisir de vous informer que le conseil académique de l'IDLA a émis un avis favorable concernant votre admission au sein du programme ${d.programTitle || 'académique'} (${d.entryLevel || 'L1'}).

Votre numéro de matricule étudiant permanent est le suivant : ${d.matricule || 'IDLA-2026-N/A'}

Accès à vos services académiques :
Vous pouvez dès à présent vous connecter à votre portail étudiant (${BASE_URL}/etudiant) afin de :
- Télécharger votre Attestation Officielle d'Admission au format PDF.
- Consulter votre emploi du temps et votre calendrier d'enseignement.
- Rejoindre le canal de discussion de votre promotion et échanger avec vos enseignants.

Nous vous félicitons pour cette admission et vous souhaitons un excellent parcours de formation.

En vous souhaitant pleine réussite,

La Direction des Études IDLA
International Distance Learning Academy
Plateforme : ${BASE_URL}`,
    html: (d) => wrapInInstitutionalEmailTemplate({
      title: 'CONFIRMATION D\'ADMISSION OFFICIELLE',
      greeting: `Félicitations ${d.studentName || 'Cher(e) étudiant(e)'},`,
      paragraphs: [
        `Nous avons l'honneur de vous informer que le Conseil Académique de l'IDLA a validé votre admission formelle au sein de la formation <strong>${d.programTitle || 'académique'}</strong> (Niveau d'entrée : ${d.entryLevel || 'L1'}).`,
        `Un numéro de matricule individuel permanent vous a été attribué. Il servira d'identifiant pour tous vos diplômes et examens.`
      ],
      highlightBox: {
        label: 'VOTRE MATRICULE ÉTUDIANT PERMANENT',
        code: d.matricule || 'IDLA-2026-N/A',
        subtext: 'Conservez ce numéro précieusement pour vos démarches administratives.'
      },
      ctaButton: {
        text: 'TÉLÉCHARGER MON ATTESTATION D\'ADMISSION',
        url: `${BASE_URL}/etudiant`
      },
      signatureTitle: 'La Direction des Études IDLA'
    })
  },

  catalog_discovery: {
    key: 'catalog_discovery',
    label: 'Découverte des Nouveaux Cours du Catalogue',
    subject: () => `Découverte des nouveaux programmes académiques et certifiants IDLA`,
    body: (d) => `Bonjour ${d.studentName || 'Chers étudiant(e)'},

L'International Distance Learning Academy enrichit son offre de formation en ouvrant de nouvelles spécialités adaptées aux exigences actuelles du marché du travail.

Nous vous invitons à découvrir les nouveaux programmes intégrés au catalogue :

1. Master en Intelligence Artificielle & Data Science
   - Type : Master | Durée : 24 mois
   - Inscription & Détails : ${BASE_URL}/programmes

2. Certifications Internationales Professionnelles (Cisco CCNA / Cloud Security)
   - Type : Certification | Durée : 6 mois
   - Inscription & Détails : ${BASE_URL}/programmes

Vous pouvez consulter l'ensemble des syllabi, conditions d'accès et modalités d'inscription directement en ligne : ${BASE_URL}/programmes

Nos conseillers pédagogiques se tiennent à votre disposition pour analyser votre projet professionnel et vous guider vers la formation la plus adaptée.

Restant à votre écoute,

Le Pôle Pédagogique IDLA
International Distance Learning Academy
Plateforme : ${BASE_URL}`,
    html: (d) => wrapInInstitutionalEmailTemplate({
      title: 'NOUVEAUTÉS CATALOGUE ACADÉMIQUE',
      greeting: `Bonjour ${d.studentName || 'Cher(e) étudiant(e)'},`,
      paragraphs: [
        `L'International Distance Learning Academy à le plaisir de vous annoncer l'ouverture de nouveaux programmes certifiants et diplômants conçus en partenariat avec les acteurs majeurs de l'industrie.`
      ],
      calloutTitle: 'NOUVEAUX PROGRAMMES DISPONIBLES',
      calloutItems: [
        { label: 'Master Specialisé', value: 'Master en Intelligence Artificielle & Data Science (Durée: 24 mois - Diplôme d\'État)' },
        { label: 'Certification Tech', value: 'Certification Internationale Cisco CCNA & Cloud Security (Durée: 6 mois)' },
        { label: 'Management', value: 'Executive MBA en Management Stratégique & Transformation Digitale' }
      ],
      ctaButton: {
        text: 'EXPLORER TOUS LES COURS',
        url: `${BASE_URL}/programmes`
      },
      signatureTitle: 'Le Pôle Pédagogique IDLA'
    })
  },

  live_class_reminder: {
    key: 'live_class_reminder',
    label: 'Rappel de Séance de Cours en Direct',
    subject: (d) => `Rappel : Séance de cours en direct — ${d.assignmentTitle || d.programTitle || 'Session Pédagogique'}`,
    body: (d) => `Bonjour ${d.studentName || 'Chers étudiant(e)'},

Nous vous rappelons que votre prochaine séance de cours magistral en direct pour le module ${d.assignmentTitle || 'académique'} se tiendra :

- Date : ${d.meetingDate || 'Aujourd\'hui'}
- Horaire : ${d.meetingTime || 'Prochainement'} (Heure locale)
- Plateforme : ${d.meetingPlatform || 'Google Meet / Zoom'}

Lien d'accès direct à la réunion : ${d.meetingUrl || BASE_URL + '/etudiant'}

Nous vous prions de bien vouloir vous connecter 5 minutes avant le début de la séance et de vous assurer du bon fonctionnement de vos équipements audio.

Cordialement,

Le Secrétariat Pédagogique IDLA
International Distance Learning Academy
Plateforme : ${BASE_URL}`,
    html: (d) => wrapInInstitutionalEmailTemplate({
      title: 'RAPPEL DE COURS EN DIRECT',
      greeting: `Bonjour ${d.studentName || 'Cher(e) étudiant(e)'},`,
      paragraphs: [
        `Nous vous rappelons la tenue imminente de votre séance de cours magistral interactif pour le module <strong>${d.assignmentTitle || 'académique'}</strong>.`
      ],
      calloutTitle: 'DÉTAILS DE LA SÉANCE',
      calloutItems: [
        { label: 'Module', value: d.assignmentTitle || 'Session Académique' },
        { label: 'Date', value: d.meetingDate || 'Aujourd\'hui' },
        { label: 'Horaire', value: `${d.meetingTime || 'Horaire prévu'} (Heure locale)` },
        { label: 'Plateforme', value: d.meetingPlatform || 'Visioconférence IDLA (Google Meet / Zoom)' }
      ],
      ctaButton: {
        text: 'ACCÉDER AU COURS EN DIRECT',
        url: d.meetingUrl || `${BASE_URL}/etudiant`
      },
      signatureTitle: 'Le Secrétariat Pédagogique IDLA'
    })
  },

  new_course_attachment: {
    key: 'new_course_attachment',
    label: 'Notification de Support de Cours Téléversé',
    subject: (d) => `Nouveau support de cours disponible — ${d.assignmentTitle || 'Document Enseignant'}`,
    body: (d) => `Bonjour ${d.studentName || 'Chers étudiant(e)'},

Un nouveau support d'étude a été mis à disposition pour le cours ${d.assignmentTitle || 'académique'}.

Détails de la ressource :
- Titre du document : ${d.fileName || 'Support de cours PDF'}
- Type : ${d.fileType || 'Document Pédagogique'}

Vous pouvez télécharger ce document dès à présent sur votre portail étudiant dans la rubrique dédiée à ce cours ou directement via le canal de classe : ${BASE_URL}/etudiant

Bon travail à vous.

L'Équipe Pédagogique IDLA
International Distance Learning Academy
Plateforme : ${BASE_URL}`,
    html: (d) => wrapInInstitutionalEmailTemplate({
      title: 'NOUVEAU SUPPORT DE COURS DISPONIBLE',
      greeting: `Bonjour ${d.studentName || 'Cher(e) étudiant(e)'},`,
      paragraphs: [
        `Votre enseignant vient de téléverser un nouveau support pédagogique de référence pour la matière <strong>${d.assignmentTitle || 'académique'}</strong>.`
      ],
      calloutTitle: 'FICHES RECOMMANDÉES',
      calloutItems: [
        { label: 'Nom du fichier', value: d.fileName || 'Support_de_Cours.pdf' },
        { label: 'Format', value: d.fileType || 'Document Pédagogique (PDF)' }
      ],
      ctaButton: {
        text: 'TÉLÉCHARGER LA RESSOURCE',
        url: `${BASE_URL}/etudiant`
      },
      signatureTitle: 'L\'Équipe Pédagogique IDLA'
    })
  },

  assignment_deadline: {
    key: 'assignment_deadline',
    label: 'Rappel d\'Échéance de Projet Académique',
    subject: (d) => `Rappel d'échéance : Restitution du projet de ${d.assignmentTitle || 'Cours'}`,
    body: (d) => `Bonjour ${d.studentName || 'Chers étudiant(e)'},

Nous vous rappelons que la date limite de remise du travail académique pour le module ${d.assignmentTitle || 'académique'} approche.

Rappel des consignes :
- Intitulé du devoir : ${d.assignmentTitle || 'Projet Académique'}
- Date et heure limites de dépôt : ${d.assignmentDeadline || 'Date limite spécifiée sur le portail'}
- Format requis : PDF

Les travaux doivent être déposés exclusivement sur votre espace étudiant (${BASE_URL}/etudiant). Tout retard non justifié entraînera l'application des règles de pénalité prévues par le règlement des études.

Nous vous remercions pour votre rigueur et votre ponctualité.

La Coordination Académique IDLA
International Distance Learning Academy
Plateforme : ${BASE_URL}`,
    html: (d) => wrapInInstitutionalEmailTemplate({
      title: 'ÉCHÉANCE DE PROJET ACADÉMIQUE',
      greeting: `Bonjour ${d.studentName || 'Cher(e) étudiant(e)'},`,
      paragraphs: [
        `Nous vous rappelons que la date ultime de restitution de votre devoir académique pour le cours <strong>${d.assignmentTitle || 'académique'}</strong> arrive à échéance.`
      ],
      calloutTitle: 'CONSIGNES DE REMISE',
      calloutItems: [
        { label: 'Devoir', value: d.assignmentTitle || 'Projet d\'Évaluation' },
        { label: 'Date limite', value: d.assignmentDeadline || 'Consulter le portail étudiant' },
        { label: 'Format', value: 'Document PDF numérisé strict' }
      ],
      ctaButton: {
        text: 'SOUMETTRE MON TRAVAIL',
        url: `${BASE_URL}/etudiant`
      },
      signatureTitle: 'La Coordination Académique IDLA'
    })
  },

  level_validation: {
    key: 'level_validation',
    label: 'Validation d\'Équivalence de Niveau',
    subject: () => `Décision de la commission d'équivalence académique IDLA`,
    body: (d) => `Bonjour ${d.studentName || 'Chers candidat(e)'},

La commission d'équivalence académique de l'IDLA a examiné votre dossier d'admission parallèle au vu de votre parcours universitaire antérieur.

Nous avons le plaisir de vous informer que votre admission a été validée pour le niveau suivant :
- Formation retenue : ${d.programTitle || 'Sélectionnée'}
- Niveau d'entrée accordé : ${d.entryLevel || 'Niveau Validé'}

Vous pouvez consulter le détail de la décision et le plan de règlement d'études personnalisé sur votre profil : ${BASE_URL}/etudiant

Restant à votre disposition pour toute précision.

La Commission d'Équivalence IDLA
International Distance Learning Academy
Plateforme : ${BASE_URL}`,
    html: (d) => wrapInInstitutionalEmailTemplate({
      title: 'DÉCISION DE COMMISSION D\'ÉQUIVALENCE',
      greeting: `Bonjour ${d.studentName || 'Cher(e) candidat(e)'},`,
      paragraphs: [
        `La Commission d'Équivalence Académique de l'IDLA a statué sur votre demande d'admission parallèle après étude approfondie de votre dossier et de vos relevés de notes postérieurs.`
      ],
      calloutTitle: 'DÉCISION D\'ÉQUIVALENCE ACCORDÉE',
      calloutItems: [
        { label: 'Formation', value: d.programTitle || 'Programme Sélectionné' },
        { label: 'Niveau d\'entrée', value: d.entryLevel || 'Niveau Valide' },
        { label: 'Statut', value: 'Admission Directe Accordée par le Jury' }
      ],
      ctaButton: {
        text: 'CONSULTER MES DÉTAILS D\'ADMISSION',
        url: `${BASE_URL}/etudiant`
      },
      signatureTitle: 'La Commission d\'Équivalence IDLA'
    })
  },

  attendance_warning: {
    key: 'attendance_warning',
    label: 'Alerte d\'Assiduité & Inactivité',
    subject: (d) => `Suivi académique : Constat d'absence aux séances du cours ${d.programTitle || 'académique'}`,
    body: (d) => `Bonjour ${d.studentName || 'Chers étudiant(e)'},

Le service du suivi pédagogique constate votre absence lors des dernières séances en direct, ainsi qu'une inactivité prolongée sur votre espace d'apprentissage.

L'assiduité et la régularité du travail personnel sont des conditions indispensables à la validation de votre semestre.

Si vous rencontrez des difficultés d'ordre technique, professionnel ou personnel, nous vous invitons à contacter sans délai votre responsable pédagogique ou à vous connecter sur le portail : ${BASE_URL}/etudiant

Dans l'attente de votre retour,

Le Service du Suivi Pédagogique IDLA
International Distance Learning Academy
Plateforme : ${BASE_URL}`,
    html: (d) => wrapInInstitutionalEmailTemplate({
      title: 'AVERTISSEMENT D\'ASSIDUITÉ ACADÉMIQUE',
      greeting: `Bonjour ${d.studentName || 'Cher(e) étudiant(e)'},`,
      paragraphs: [
        `Le service de contrôle de scolarité de l'IDLA constate plusieurs absences non justifiées aux séances magistrales du cours <strong>${d.programTitle || 'académique'}</strong>, ainsi qu'une inactivité sur votre espace personnel.`,
        `Nous vous rappelons que le respect du taux de présence minimale conditionne l'autorisation de présenter les examens semestriels.`
      ],
      ctaButton: {
        text: 'JUSTIFIER MON ABSENCE SUR LE PORTAIL',
        url: `${BASE_URL}/etudiant`
      },
      signatureTitle: 'Le Service du Suivi Pédagogique IDLA'
    })
  },

  password_reset: {
    key: 'password_reset',
    label: 'Réinitialisation de Mot de Passe',
    subject: () => `Réinitialisation de votre mot de passe d'accès IDLA`,
    body: (d) => `Bonjour ${d.studentName || 'Chers utilisateur'},

Une demande de réinitialisation de mot de passe a été émise pour votre compte utilisateur rattaché à l'adresse ${d.studentEmail || 'enregistrée'}.

Pour définir un nouveau mot de passe sécurisé, veuillez cliquer sur le lien ci-dessous :

Lien de réinitialisation : ${d.customLink || BASE_URL + '/reinitialisation'}

Remarque : Ce lien est personnel et expire automatiquement dans un délai de 60 minutes. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer ce message ; votre mot de passe actuel restera inchangé.

Cordialement,

Le Service Informatique & Sécurité IDLA
International Distance Learning Academy
Plateforme : ${BASE_URL}`,
    html: (d) => wrapInInstitutionalEmailTemplate({
      title: 'RÉINITIALISATION DU MOT DE PASSE',
      greeting: `Bonjour ${d.studentName || 'Cher(e) utilisateur'},`,
      paragraphs: [
        `Une demande de réinitialisation des identifiants d'accès a été formulée pour l'adresse e-mail <strong>${d.studentEmail || 'enregistrée'}</strong>.`,
        `Si vous êtes bien à l'origine de cette requête, veuillez cliquer sur le bouton d'action ci-dessous afin de définir votre nouveau mot de passe sécurisé.`
      ],
      ctaButton: {
        text: 'DEFINIR MON NOUVEAU MOT DE PASSE',
        url: d.customLink || `${BASE_URL}/reinitialisation`
      },
      calloutTitle: 'INFORMATIONS DE SÉCURITÉ',
      calloutItems: [
        { label: 'Délai d\'expiration', value: 'Ce lien de sécurité est valide pendant 60 minutes uniquement.' },
        { label: 'Note', value: 'Si vous n\'avez pas demandé cette réinitialisation, veuillez ignorer ce message.' }
      ],
      signatureTitle: 'Le Service Informatique & Sécurité IDLA'
    })
  },

  academic_session_start: {
    key: 'academic_session_start',
    label: 'Rappel de Rentrée Académique',
    subject: () => `Calendrier de rentrée académique — Session IDLA`,
    body: (d) => `Bonjour ${d.studentName || 'Chers étudiant(e)'},

À l'approche de la rentrée universitaire, nous vous transmettons les informations essentielles relatives à l'ouverture de vos enseignements.

Informations clés :
- Date officielle de rentrée : ${d.meetingDate || 'Session d\'Octobre 2026'}
- Ouverture des accès de classe : ${BASE_URL}/etudiant

Nous vous invitons à vérifier dès à présent vos identifiants d'accès sur votre portail : ${BASE_URL}/etudiant

L'ensemble du corps professoral vous souhaite une excellente préparation de rentrée.

Cordialement,

La Direction de l'Enseignement IDLA
International Distance Learning Academy
Plateforme : ${BASE_URL}`,
    html: (d) => wrapInInstitutionalEmailTemplate({
      title: 'CALENDRIER DE RENTRÉE ACADÉMIQUE',
      greeting: `Bonjour ${d.studentName || 'Cher(e) étudiant(e)'},`,
      paragraphs: [
        `À l'approche du lancement de la nouvelle session académique, la Direction des Études de l'IDLA a le plaisir de vous transmettre le calendrier d'ouverture des cours.`
      ],
      calloutTitle: 'INFORMATIONS DE RENTRÉE',
      calloutItems: [
        { label: 'Date de rentrée', value: d.meetingDate || 'Session d\'Octobre 2026' },
        { label: 'Accès portail', value: `<a href="${BASE_URL}/etudiant" style="color:#2563eb; font-weight:600;">${BASE_URL}/etudiant</a>` }
      ],
      ctaButton: {
        text: 'ACCÉDER À MON PORTAIL ÉTUDIANT',
        url: `${BASE_URL}/etudiant`
      },
      signatureTitle: 'La Direction de l\'Enseignement IDLA'
    })
  },

  ambassador_invite: {
    key: 'ambassador_invite',
    label: 'Invitation Programme Parrainage Ambassadeur',
    subject: () => `Programme Ambassadeur IDLA — Dispositif de recommandation académique`,
    body: (d) => `Bonjour ${d.studentName || 'Chers étudiant(e)'},

En tant qu'étudiant de l'International Distance Learning Academy, vous avez la possibilité de faire bénéficier des membres de votre réseau professionnel d'une recommandation académique.

Votre code parrainage individuel est : ${d.referralCode || 'IDLA-AMBASSADEUR'}

Modalités du dispositif :
1. Communiquez votre code ou votre lien personnalisé : ${BASE_URL}/candidature?ref=${d.referralCode || 'IDLA-AMBASSADEUR'}
2. Les candidats recommandés bénéficient d'une exonération partielle des frais de dossier.
3. Chaque recommandation validée par le comité d'admission vous donne droit à une gratification d'excellence.

Vous pouvez suivre l'état de vos recommandations depuis la rubrique "Parrainage" de votre espace personnel : ${BASE_URL}/etudiant

Avec nos remerciements pour votre contribution au rayonnement de notre académie.

Le Pôle Relations Extérieures IDLA
International Distance Learning Academy
Plateforme : ${BASE_URL}`,
    html: (d) => wrapInInstitutionalEmailTemplate({
      title: 'PROGRAMME AMBASSADEUR & PARRAINAGE',
      greeting: `Bonjour ${d.studentName || 'Cher(e) étudiant(e)'},`,
      paragraphs: [
        `En tant que membre de l'académie IDLA, vous êtes invité à participer au Programme Ambassadeur et à parrainer des professionnels de votre entourage.`
      ],
      highlightBox: {
        label: 'VOTRE CODE PARRAIN INDIVIDUEL',
        code: d.referralCode || 'IDLA-AMBASSADEUR',
        subtext: 'Partagez ce code avec vos filleuls lors de leur candidature.'
      },
      ctaButton: {
        text: 'SUIVRE MES PARRAINAGES',
        url: `${BASE_URL}/etudiant`
      },
      signatureTitle: 'Le Pôle Relations Extérieures IDLA'
    })
  },

  course_evaluation: {
    key: 'course_evaluation',
    label: 'Évaluation de Fin de Semestre & Témoignage',
    subject: () => `Évaluation de fin de semestre et retour d'expérience académique`,
    body: (d) => `Bonjour ${d.studentName || 'Chers étudiant(e)'},

Parvenus au terme de ce semestre d'enseignement, nous sollicitons votre avis afin de mesurer la qualité des contenus pédagogiques et de l'accompagnement dispensé.

Nous vous invitons à remplir le questionnaire d'évaluation anonyme depuis votre portail étudiant : ${BASE_URL}/etudiant

Si vous souhaitez partager votre témoignage sur votre expérience d'apprentissage à distance au sein de l'IDLA, vous pouvez également soumettre votre retour directement depuis votre profil.

Vos retours sont essentiels pour nous permettre d'améliorer continuellement nos prestations d'enseignement.

En vous remerciant par avance pour votre participation,

Le Service Qualité & Pédagogie IDLA
International Distance Learning Academy
Plateforme : ${BASE_URL}`,
    html: (d) => wrapInInstitutionalEmailTemplate({
      title: 'ÉVALUATION DE FIN DE SEMESTRE',
      greeting: `Bonjour ${d.studentName || 'Cher(e) étudiant(e)'},`,
      paragraphs: [
        `Au terme de ce semestre académique, nous sollicitons votre appréciation sur la qualité des enseignements dispensés et l'accompagnement pédagogique.`,
        `Vos remarques sont précieuses pour nous aider à maintenir des standards d'excellence.`
      ],
      ctaButton: {
        text: 'RÉPONDRE À L\'ÉVALUATION DE COURS',
        url: `${BASE_URL}/etudiant`
      },
      signatureTitle: 'Le Service Qualité & Pédagogie IDLA'
    })
  },
};
