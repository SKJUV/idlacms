#!/usr/bin/env node
import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import { Client, Databases, Permission, Role } from 'node-appwrite';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env');

if (!existsSync(envPath)) {
  console.error("❌ Fichier .env introuvable à la racine du projet.");
  process.exit(1);
}

const envContent = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx === -1) continue;
  let val = trimmed.slice(idx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  env[trimmed.slice(0, idx).trim()] = val;
}

const client = new Client()
  .setEndpoint(env.VITE_APPWRITE_ENDPOINT)
  .setProject(env.VITE_APPWRITE_PROJECT_ID)
  .setKey(env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = env.VITE_APPWRITE_DATABASE_ID || 'idla_cms';

async function withRetry(fn, retries = 4, delayMs = 1500) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, delayMs * (i + 1)));
      }
    }
  }
  throw lastErr;
}

const FORM_ID = 'form-mscfe-scholarship-2026';
const PROGRAM_ID = 'prog-msc-fe';
const NEWS_ID = 'news-mscfe-scholarship-policy';

// ── 1. DÉFINITION DU FORMULAIRE OFFICIEL MSCFE ──────────────────────────────
const mscfeFormFields = [
  // SECTION 1: PERSONAL & APPLICANT INFORMATION
  {
    id: 'full_legal_name',
    label: '1. Nom complet légal',
    label_en: '1. Full Legal Name',
    type: 'text',
    required: true,
    placeholder: 'Ex: Jean Dupont',
    placeholder_en: 'Ex: John Doe',
    helpText: "Nom officiel complet tel qu'indiqué sur la pièce d'identité ou le passeport.",
    helpText_en: "Full official name as displayed on your government-issued ID or passport."
  },
  {
    id: 'date_of_birth',
    label: '2. Date de naissance',
    label_en: '2. Date of Birth',
    type: 'date',
    required: true,
    minAge: 18,
    helpText: 'Date de naissance (JJ/MM/AAAA) — Âge minimum : 18 ans.',
    helpText_en: 'Date of birth (DD/MM/YYYY) — Minimum age: 18 years old.'
  },
  {
    id: 'gender',
    label: '3. Sexe',
    label_en: '3. Gender',
    type: 'radio',
    required: true,
    options: [
      'Homme',
      'Femme',
      'Préfère ne pas préciser'
    ],
    options_en: [
      'Male',
      'Female',
      'Prefer not to say'
    ]
  },
  {
    id: 'email_address',
    label: '4. Adresse e-mail officielle',
    label_en: '4. Official Email Address',
    type: 'text',
    required: true,
    placeholder: 'candidat@domaine.com',
    placeholder_en: 'applicant@domain.com',
    helpText: "Adresse e-mail valide pour la réception du récépissé PDF et des convocations.",
    helpText_en: "Valid email address to receive your PDF receipt and official communications."
  },
  {
    id: 'phone_whatsapp',
    label: '5. Numéro WhatsApp',
    label_en: '5. Phone Number (WhatsApp)',
    type: 'text',
    required: true,
    placeholder: '+237 6XX XX XX XX',
    placeholder_en: '+237 6XX XX XX XX',
    helpText: 'Numéro joignable avec indicatif pays pour les échanges académiques.',
    helpText_en: 'Reachable phone number with country code for academic communications.'
  },
  {
    id: 'country_city',
    label: '6. Pays et Ville de résidence',
    label_en: '6. Country of Residence & City',
    type: 'text',
    required: true,
    placeholder: 'Ex: Cameroun, Yaoundé',
    placeholder_en: 'Ex: Cameroon, Yaounde'
  },

  // SECTION 2: ACADEMIC BACKGROUND & ELIGIBILITY
  {
    id: 'highest_degree',
    label: '7. Plus haut diplôme obtenu',
    label_en: '7. Highest Degree Completed',
    type: 'select',
    required: true,
    options: [
      'Licence / Bachelor of Science (B.Sc.)',
      'Master / Master II (M.Sc.)',
      "Diplôme d'Ingénieur",
      'Doctorat (Ph.D.)',
      'Autre'
    ],
    options_en: [
      'Bachelor of Science (B.Sc.) / Licence',
      'Master’s Degree (M.Sc. / Master II)',
      "Engineering Degree",
      'Doctorate (Ph.D.)',
      'Other'
    ]
  },
  {
    id: 'academic_specialization',
    label: '8. Domaine de spécialisation académique',
    label_en: '8. Field of Academic Specialization',
    type: 'select',
    required: true,
    options: [
      'Mathématiques / Mathématiques Appliquées',
      'Informatique / Génie Logiciel / IT',
      'Télécommunications & Réseaux',
      'Physique / Sciences de l’Ingénieur',
      'Économie / Finance / Analyse Quantitative',
      'Autre'
    ],
    options_en: [
      'Mathematics / Applied Mathematics',
      'Computer Science / Software Engineering / IT',
      'Telecommunications & Networks',
      'Physics / Engineering Sciences',
      'Economics / Finance / Quantitative Analysis',
      'Other'
    ]
  },
  {
    id: 'university_attended',
    label: '9. Université ou École fréquentée',
    label_en: '9. University or Institution Attended',
    type: 'text',
    required: true,
    placeholder: 'Ex: Université de Yaoundé I, École Nationale Supérieure Polytechnique...',
    placeholder_en: 'Ex: University of Yaounde I, National Advanced School of Engineering...'
  },
  {
    id: 'gpa_distinction',
    label: '10. Moyenne finale ou Mention obtenue',
    label_en: '10. Final Graduation GPA or Distinction',
    type: 'text',
    required: true,
    placeholder: 'Ex: 3.7/4.0, Mention Très Bien, 15.5/20...',
    placeholder_en: 'Ex: 3.7/4.0, First Class Honours, Magna Cum Laude, 15.5/20...'
  },
  {
    id: 'transcript_status',
    label: '11. Statut des relevés de notes officiels',
    label_en: '11. Academic Transcript Status',
    type: 'radio',
    required: true,
    options: [
      'Je dispose de mes relevés officiels prêts à être transmis.',
      'Je peux obtenir mes relevés officiels de mon université avant la fin du Cours 560 (Marchés Financiers).',
      'Je ne peux pas fournir de relevés de notes officiels.'
    ],
    options_en: [
      'I have my official transcripts ready for submission.',
      'I can obtain my official transcripts from my university prior to completing Course 560 (Financial Markets).',
      'I cannot provide official transcripts.'
    ]
  },

  // SECTION 3: MATHEMATICAL & PROGRAMMING PROFICIENCY
  {
    id: 'math_proficiency',
    label: '12. Niveau en Mathématiques Supérieures (Calcul, Algèbre Linéaire, Probabilités, Statistiques)',
    label_en: '12. Proficiency in Higher Mathematics (Calculus, Linear Algebra, Probability, Statistics)',
    type: 'radio',
    required: true,
    options: ['Débutant', 'Intermédiaire', 'Avancé / Expert'],
    options_en: ['Beginner', 'Intermediate', 'Advanced / Expert'],
    helpText: 'Calcul différentiel/intégral, algèbre linéaire, probabilités et modélisation stochastique.',
    helpText_en: 'Calculus, linear algebra, probability theory, and stochastic modeling.'
  },
  {
    id: 'programming_languages',
    label: '13. Langages de programmation maîtrisés',
    label_en: '13. Programming Languages Proficiency',
    type: 'checkbox',
    required: true,
    options: [
      'Python',
      'C++ / C#',
      'R',
      'MATLAB',
      'SQL / Gestion de bases de données',
      'Aucun (Prêt à apprendre)'
    ],
    options_en: [
      'Python',
      'C++ / C#',
      'R',
      'MATLAB',
      'SQL / Database Management',
      'None (Willing to learn)'
    ]
  },
  {
    id: 'english_proficiency',
    label: "14. Niveau de maîtrise de l'anglais",
    label_en: '14. English Language Proficiency Level',
    type: 'radio',
    required: true,
    options: [
      'Langue maternelle / Courant',
      'Compétence technique avancée',
      'Intermédiaire (Prêt à suivre le module obligatoire Cisco "English for IT")',
      'Basique / Débutant'
    ],
    options_en: [
      'Native / Fluent',
      'Advanced Technical Proficiency',
      'Intermediate (Willing to complete the compulsory Cisco "English for IT" module)',
      'Basic / Beginner'
    ]
  },

  // SECTION 4: INFRASTRUCTURE & CAMPUS COMMITMENT
  {
    id: 'access_strategy',
    label: "15. Modalité d'accès aux infrastructures et au campus",
    label_en: '15. Platform & Laboratory Access Strategy',
    type: 'radio',
    required: true,
    options: [
      "J'utiliserai le campus et hub IDLA de Yaoundé (énergie solaire 24/7, labs Cisco, fibre optique, cours en direct, services de support).",
      "Je travaillerai à distance avec mon équipement personnel et participerai aux cours virtuels et aux examens surveillés."
    ],
    options_en: [
      "I will utilize IDLA's Yaoundé Campus And Hub (24/7 powered Cisco hardware labs, Fiber internet, live lectures, support services).",
      "I will work remotely using my personal setup and attend virtual classes and labs for proctored exams."
    ]
  },
  {
    id: 'time_commitment',
    label: '16. Disponibilité hebdomadaire dédiée aux études',
    label_en: '16. Weekly Time Commitment',
    type: 'radio',
    required: true,
    options: [
      '10–15 heures / semaine',
      '15–20 heures / semaine',
      '20+ heures / semaine (Recommandé)'
    ],
    options_en: [
      '10–15 hours / week',
      '15–20 hours / week',
      '20+ hours / week (Recommended)'
    ]
  },

  // SECTION 5: PROGRAM HOSTING, QUANT FOUNDATION & FINANCIAL COMMITMENT
  {
    id: 'hosting_acknowledgment',
    label: "17. Reconnaissance du cadre académique IDLA & Quant Foundation",
    label_en: '17. Program Hosting & Institutional Acknowledgment',
    type: 'radio',
    required: true,
    options: [
      "Je comprends que l'IDLA dispense, héberge et gère localement le programme MScFE au Cameroun, tandis que Quant Foundation prend en charge la bourse académique.",
      'Non'
    ],
    options_en: [
      "I understand that IDLA offers, hosts, and manages the MScFE program locally in Cameroon, while the Quant Foundation covers academic tuition.",
      'No'
    ],
    helpText: 'Frais académiques ($38 612 USD/an) pris en charge à 100% par Quant Foundation. Infrastructures et coaching assurés par IDLA.',
    helpText_en: 'Academic tuition ($38,612 USD/year) covered 100% by Quant Foundation. Physical infrastructure and on-site coaching provided by IDLA.'
  },
  {
    id: 'financial_commitment',
    label: '18. Engagement financier (frais administratifs et de documentation)',
    label_en: '18. Financial Commitment (administrative and documentation charges/fees)',
    type: 'radio',
    required: true,
    options: [
      "Oui, je suis prêt(e) à régler les 796,26 USD TTC (450 000 FCFA) de frais administratifs et de documentation."
    ],
    options_en: [
      "Yes, I am fully prepared to pay $796.26 USD incl. tax (450,000 FCFA) in administrative and documentation fees."
    ],
    helpText: "Frais administratifs et de documentation obligatoires : 450 000 FCFA ($796.26 USD TTC) pour les infrastructures du campus de Yaoundé (énergie solaire 24/7, fibre optique, Cisco labs, English for IT et coaching).",
    helpText_en: "Mandatory administrative and documentation fees: 450,000 FCFA ($796.26 USD incl. tax) covering 24/7 solar power, dedicated fiber optic internet, Cisco labs, English for IT, and local coaching in Yaoundé."
  },

  // SECTION 6: MOTIVATION & APPLICANT DECLARATION
  {
    id: 'motivation_statement',
    label: '19. Déclaration de motivation (Max 250 mots)',
    label_en: '19. Motivation Statement (Max 250 words)',
    type: 'textarea',
    required: true,
    placeholder: "Expliquez brièvement pourquoi vous postulez au programme MScFE à l'IDLA et comment ce diplôme s'aligne avec vos objectifs professionnels...",
    placeholder_en: "Briefly explain why you are applying for the MScFE program at IDLA and how this degree aligns with your career goals (Max 250 words)...",
    helpText: 'Décrivez votre intérêt pour la finance quantitative et votre projet professionnel.',
    helpText_en: 'Describe your interest in quantitative finance and your long-term career goals.'
  },
  {
    id: 'applicant_declaration',
    label: "20. Déclaration et certification sur l'honneur",
    label_en: '20. Applicant Declaration & Certification',
    type: 'radio',
    required: true,
    options: [
      "Je certifie que toutes les informations fournies dans cette candidature sont exactes et complètes. Je comprends que l'IDLA héberge et gère localement le programme MScFE et que le défaut de règlement des frais administratifs et de documentation de 450 000 FCFA (796,26 USD TTC) entraînera la révocation de ma bourse.",
      "Je ne suis pas d'accord"
    ],
    options_en: [
      "I certify that all information provided in this application is accurate and complete. I understand that IDLA hosts and manages the MScFE program locally and that failure to settle the administrative and documentation charges/fees of 450,000 FCFA ($796.26 USD incl. tax) will result in forfeiture of my scholarship seat.",
      "I do not agree"
    ]
  },
  {
    id: 'applicant_signature',
    label: '21. Signature électronique du candidat & Date',
    label_en: '21. Applicant Electronic Signature & Date',
    type: 'text',
    required: true,
    placeholder: 'Ex: Jean Dupont — 27/09/2026',
    placeholder_en: 'Ex: John Doe — 27/09/2026',
    helpText: 'Rempli automatiquement avec votre nom officiel et la date de soumission.',
    helpText_en: 'Filled automatically with your official full name and the submission date.'
  }
];

const formDescription = 
  "INTERNATIONAL DISTANCE LEARNING ACADEMY (IDLA) — Master of Science in Financial Engineering (MScFE)\n" +
  "Bourse d'Excellence d'une valeur de 38 612 USD/an (100% couverte par Quant Foundation / IDLA-WQ).\n" +
  "Frais administratifs et de documentation obligatoires : 450 000 FCFA ($796.26 USD TTC) pour l'accès 24/7 au campus de Yaoundé (énergie solaire, fibre optique, Cisco labs, English for IT, coaching).";

// ── 2. DÉFINITION DU PROGRAMME ACADÉMIQUE ─────────────────────────────────────
const programData = {
  title: 'MSc in Financial Engineering (MScFE)',
  description: 
    "Master d'Élite en Ingénierie Financière Quantitative & Finance de Marché offert et géré opérationnellement par l'IDLA (Campus de Yaoundé). " +
    "Bourse d'Excellence couvrant 100% de la scolarité académique (38 612 USD/an) financée par Quant Foundation / IDLA-WQ. " +
    "Accès garanti 24/7 aux laboratoires informatiques Cisco, énergie solaire autonome, connexion fibre optique dédiée, certification Cisco English for IT et coaching académique sur place.",
  type: 'Master',
  category: 'Management',
  duration: '2 ans',
  image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
  isNew: true,
  price: '38 612 USD (Bourse 100% Quant Foundation) — Frais administratifs et documentation 450 000 FCFA/an (796,26 USD TTC)',
  procedures: 
    "Admission sur dossier d'excellence et questionnaire de qualification MScFE en ligne (Lien : /formulaire?id=form-mscfe-scholarship-2026). " +
    "Frais académiques pris en charge à 100%. Frais administratifs et de documentation obligatoires de 450 000 FCFA ($796.26 USD TTC) " +
    "couvrant les infrastructures de haute technologie du campus IDLA de Yaoundé."
};

// ── 3. EXÉCUTION DE LA CRÉATION & LIAISON ─────────────────────────────────────
async function main() {
  console.log("🚀 [IDLA CMS] Initialisation de la création du Formulaire et du Programme MScFE...\n");

  const permissions = [
    Permission.read(Role.any()),
    Permission.update(Role.any()),
    Permission.delete(Role.any())
  ];

  // A. Création / Mise à jour du Formulaire
  console.log(`📋 1. Enregistrement du Formulaire de Candidature [${FORM_ID}]...`);
  try {
    let existingForm = null;
    try {
      existingForm = await withRetry(() => databases.getDocument(DB_ID, 'custom_forms', FORM_ID));
    } catch (e) {}

    const formDescription_en = 
      "INTERNATIONAL DISTANCE LEARNING ACADEMY (IDLA) — Master of Science in Financial Engineering (MScFE)\n" +
      "Excellence Scholarship valued at $38,612 USD/year (100% covered by Quant Foundation / IDLA-WQ).\n" +
      "Mandatory administrative and documentation charges/fees: $796.26 USD incl. tax (450,000 FCFA) for 24/7 Yaoundé campus access (solar power, fiber internet, Cisco labs, English for IT, coaching).";

    const formPayload = {
      title: 'Questionnaire Officiel de Qualification Bourse MScFE',
      title_en: 'Official MScFE Scholarship Qualification Questionnaire',
      description: formDescription.slice(0, 1990),
      description_en: formDescription_en.slice(0, 1990),
      createdAt: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
      fields: JSON.stringify(mscfeFormFields)
    };

    if (existingForm) {
      await withRetry(() => databases.updateDocument(DB_ID, 'custom_forms', FORM_ID, formPayload));
      console.log(`   ✅ Formulaire [${FORM_ID}] mis à jour avec succès (21 champs configurés).`);
    } else {
      await withRetry(() => databases.createDocument(DB_ID, 'custom_forms', FORM_ID, formPayload, permissions));
      console.log(`   ✅ Formulaire [${FORM_ID}] créé avec succès dans Appwrite Cloud (21 champs configurés).`);
    }
  } catch (err) {
    console.error(`   ❌ Erreur lors de la création du formulaire :`, err.message);
  }

  // B. Création / Mise à jour du Programme
  console.log(`\n🎓 2. Enregistrement du Programme Académique [${PROGRAM_ID}]...`);
  try {
    let existingProg = null;
    try {
      existingProg = await withRetry(() => databases.getDocument(DB_ID, 'programs', PROGRAM_ID));
    } catch (e) {}

    const progPayload = {
      title: programData.title,
      description: programData.description.slice(0, 1990),
      type: programData.type,
      category: programData.category,
      duration: programData.duration,
      image: programData.image,
      isNew: programData.isNew,
      price: programData.price,
      procedures: programData.procedures
    };

    if (existingProg) {
      await withRetry(() => databases.updateDocument(DB_ID, 'programs', PROGRAM_ID, progPayload));
      console.log(`   ✅ Programme [${PROGRAM_ID}] mis à jour avec succès et lié au formulaire.`);
    } else {
      await withRetry(() => databases.createDocument(DB_ID, 'programs', PROGRAM_ID, progPayload, permissions));
      console.log(`   ✅ Programme [${PROGRAM_ID}] créé avec succès dans Appwrite Cloud.`);
    }
  } catch (err) {
    console.error(`   ❌ Erreur lors de l'enregistrement du programme :`, err.message);
  }

  // C. Liaison avec la Campagne d'Actualité Académique
  console.log(`\n📰 3. Liaison avec l'Actualité Académique [${NEWS_ID}]...`);
  try {
    let existingNews = null;
    try {
      existingNews = await withRetry(() => databases.getDocument(DB_ID, 'news', NEWS_ID));
    } catch (e) {}

    if (existingNews) {
      await withRetry(() => databases.updateDocument(DB_ID, 'news', NEWS_ID, {
        formId: FORM_ID,
        formUrl: `/formulaire?id=${FORM_ID}`
      }));
      console.log(`   ✅ Actualité [${NEWS_ID}] liée avec succès au formulaire [${FORM_ID}].`);
    } else {
      console.log(`   ℹ️ L'actualité [${NEWS_ID}] n'a pas été trouvée pour la mise à jour.`);
    }
  } catch (err) {
    console.warn(`   ⚠️ Liaison actualité :`, err.message);
  }

  console.log("\n✨ Opération terminée avec succès ! Le formulaire et le programme sont créés et interconnectés.");
  console.log(`👉 URL directe du formulaire : /formulaire?id=${FORM_ID}`);
}

main().catch((err) => {
  console.error("Erreur fatale :", err);
  process.exit(1);
});
