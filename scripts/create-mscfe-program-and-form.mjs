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
    label: '1. Full Legal Name / Nom complet légal',
    type: 'text',
    required: true,
    placeholder: 'Ex: John Doe / Jean Dupont',
    helpText: "Nom officiel complet tel qu'indiqué sur la pièce d'identité ou le passeport."
  },
  {
    id: 'date_of_birth',
    label: '2. Date of Birth / Date de naissance',
    type: 'date',
    required: true,
    minAge: 18,
    helpText: 'Date de naissance (JJ/MM/AAAA) — Âge minimum : 18 ans.'
  },
  {
    id: 'gender',
    label: '3. Gender / Sexe',
    type: 'radio',
    required: true,
    options: [
      'Male / Homme',
      'Female / Femme',
      'Prefer not to say / Préfère ne pas préciser'
    ]
  },
  {
    id: 'email_address',
    label: '4. Email Address / Adresse e-mail officielle',
    type: 'text',
    required: true,
    placeholder: 'candidat@domaine.com',
    helpText: "Adresse e-mail valide pour la réception du récépissé PDF et des convocations."
  },
  {
    id: 'phone_whatsapp',
    label: '5. Phone Number (WhatsApp) / Numéro WhatsApp',
    type: 'text',
    required: true,
    placeholder: '+237 6XX XX XX XX',
    helpText: 'Numéro joignable avec indicatif pays pour les échanges académiques.'
  },
  {
    id: 'country_city',
    label: '6. Country of Residence & City / Pays et Ville de résidence',
    type: 'text',
    required: true,
    placeholder: 'Ex: Cameroun, Yaoundé'
  },

  // SECTION 2: ACADEMIC BACKGROUND & ELIGIBILITY
  {
    id: 'highest_degree',
    label: '7. Highest Degree Completed / Plus haut diplôme obtenu',
    type: 'select',
    required: true,
    options: [
      'Bachelor of Science (B.Sc.) / Licence',
      'Master’s Degree (M.Sc. / Master II)',
      "Engineering Degree (Diplôme d'Ingénieur)",
      'Doctorate (Ph.D.)',
      'Other / Autre'
    ]
  },
  {
    id: 'academic_specialization',
    label: '8. Field of Academic Specialization / Domaine de spécialisation',
    type: 'select',
    required: true,
    options: [
      'Mathematics / Applied Mathematics',
      'Computer Science / Software Engineering / IT',
      'Telecommunications & Networks',
      'Physics / Engineering Sciences',
      'Economics / Finance / Quantitative Analysis',
      'Other / Autre'
    ]
  },
  {
    id: 'university_attended',
    label: '9. Name of University / Institution Attended / Université ou École fréquentée',
    type: 'text',
    required: true,
    placeholder: 'Ex: Université de Yaoundé I, École Nationale Supérieure Polytechnique...'
  },
  {
    id: 'gpa_distinction',
    label: '10. Final Graduation GPA or Distinction / Moyenne finale ou Mention',
    type: 'text',
    required: true,
    placeholder: 'Ex: 3.7/4.0, Mention Très Bien, 15.5/20...'
  },
  {
    id: 'transcript_status',
    label: '11. Academic Transcript Status / Statut des relevés de notes',
    type: 'radio',
    required: true,
    options: [
      'I have my official transcripts ready for submission.',
      'I can obtain my official transcripts from my university prior to completing Course 560 (Financial Markets).',
      'I cannot provide official transcripts.'
    ]
  },

  // SECTION 3: MATHEMATICAL & PROGRAMMING PROFICIENCY
  {
    id: 'math_proficiency',
    label: '12. Proficiency in Higher Mathematics (Calculus, Linear Algebra, Probability, Statistics)',
    type: 'radio',
    required: true,
    options: ['Beginner', 'Intermediate', 'Advanced / Expert'],
    helpText: 'Calcul différentiel/intégral, algèbre linéaire, probabilités et modélisation stochastique.'
  },
  {
    id: 'programming_languages',
    label: '13. Programming Languages Proficiency / Langages maîtrisés',
    type: 'checkbox',
    required: true,
    options: [
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
    label: '14. English Language Proficiency Level / Niveau de maîtrise de l\'anglais',
    type: 'radio',
    required: true,
    options: [
      'Native / Fluent',
      'Advanced Technical Proficiency',
      'Intermediate (Willing to complete the compulsory Cisco "English for IT" module)',
      'Basic / Beginner'
    ]
  },

  // SECTION 4: INFRASTRUCTURE & CAMPUS COMMITMENT
  {
    id: 'access_strategy',
    label: '15. Platform & Laboratory Access Strategy / Modalité d\'accès aux infrastructures',
    type: 'radio',
    required: true,
    options: [
      "I will utilize IDLA's Yaoundé Campus And Hub (24/7 powered Cisco hardware labs, Fiber internet, live lectures, support services).",
      'I will work remotely using my personal setup and attend virtual classes and labs for proctored exams.'
    ]
  },
  {
    id: 'time_commitment',
    label: '16. Time Commitment / Disponibilité hebdomadaire dédiée',
    type: 'radio',
    required: true,
    options: [
      '10–15 hours / week',
      '15–20 hours / week',
      '20+ hours / week (Recommended)'
    ]
  },

  // SECTION 5: PROGRAM HOSTING, QUANT FOUNDATION & FINANCIAL COMMITMENT
  {
    id: 'hosting_acknowledgment',
    label: '17. Program Hosting & Institutional Acknowledgment / Reconnaissance du cadre IDLA',
    type: 'radio',
    required: true,
    options: [
      'I understand that IDLA offers, hosts, and manages the MScFE program locally in Cameroon, while the Quant Foundation covers academic tuition.',
      'No'
    ],
    helpText: 'Frais académiques ($38 612 USD/an) pris en charge à 100% par Quant Foundation. Infrastructures et coaching assurés par IDLA.'
  },
  {
    id: 'financial_commitment',
    label: '18. Financial Commitment (Support, Administrative & International Charges)',
    type: 'radio',
    required: true,
    options: [
      'Yes, I am fully prepared to pay 400,000 FCFA ($707.79 USD TTC) in full upon registration.',
      "Yes, I request to pay via IDLA's approved installment plan (350,000 FCFA initial deposit + 80,000 FCFA due 31st December 2026).",
      'No, I am unable to cover the annual support, administrative, and international charges.'
    ],
    helpText: 'Dépôt obligatoire pour l\'énergie solaire 24/7, la fibre optique, les labs Cisco, English for IT et le coaching Yaoundé.'
  },

  // SECTION 6: MOTIVATION & APPLICANT DECLARATION
  {
    id: 'motivation_statement',
    label: '19. Motivation Statement / Déclaration de motivation (Max 250 mots)',
    type: 'textarea',
    required: true,
    placeholder: 'Briefly explain why you are applying for the MScFE program at IDLA and how this degree aligns with your career goals (Max 250 words)...',
    helpText: 'Décrivez votre intérêt pour la finance quantitative et votre projet professionnel.'
  },
  {
    id: 'applicant_declaration',
    label: '20. Applicant Declaration & Certification / Déclaration sur l\'honneur',
    type: 'radio',
    required: true,
    options: [
      'I certify that all information provided in this application is accurate and complete. I understand that IDLA hosts and manages the MScFE program locally and that failure to settle the annual support, administrative, and international charges of 400,000 FCFA ($707.79 USD TTC) will result in forfeiture of my scholarship seat.',
      'I do not agree'
    ]
  },
  {
    id: 'applicant_signature',
    label: '21. Applicant Signature & Date / Signature électronique & Date',
    type: 'text',
    required: true,
    placeholder: 'Ex: John Doe — 16/09/2026',
    helpText: 'Indiquez votre nom complet officiel et la date de soumission.'
  }
];

const formDescription = 
  "INTERNATIONAL DISTANCE LEARNING ACADEMY (IDLA) — Master of Science in Financial Engineering (MScFE)\n" +
  "Bourse d'Excellence d'une valeur de 38 612 USD/an (100% couverte par Quant Foundation / IDLA-WQ).\n" +
  "Dépôt annuel de soutien local & administratif obligatoire : 400 000 FCFA ($707.79 USD TTC) pour l'accès 24/7 au campus de Yaoundé (énergie solaire, fibre optique, Cisco labs, English for IT, coaching).";

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
  price: '38 612 USD (Bourse 100% Quant Foundation) — Dépôt local 400 000 FCFA/an (707,79 USD TTC)',
  procedures: 
    "Admission sur dossier d'excellence et questionnaire de qualification MScFE en ligne (Lien : /formulaire?id=form-mscfe-scholarship-2026). " +
    "Frais académiques pris en charge à 100%. Dépôt annuel obligatoire de 400 000 FCFA (ou échelonnement : 350 000 FCFA à l'inscription + 80 000 FCFA au 31 décembre 2026) " +
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

    const formPayload = {
      title: 'MSc in Financial Engineering (MScFE) — Application & Qualification Questionnaire',
      description: formDescription.slice(0, 1990),
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
