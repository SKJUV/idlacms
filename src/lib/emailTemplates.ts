/**
 * IDLA CMS — Bibliothèque de Modèles d'E-mails Institutionnels
 * Domaine officiel : https://idlaacademy.online
 * Style : Sobre, académique, professionnel, 0 émoji.
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
  },
};
