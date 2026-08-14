import dns from 'dns';
const originalLookup = dns.lookup;
(dns as any).lookup = (hostname: string, options: any, callback: any) => {
  if (hostname === 'fra.cloud.appwrite.io') {
    const cb = typeof options === 'function' ? options : callback;
    return cb(null, [{ address: '151.101.67.52', family: 4 }], 4);
  }
  return originalLookup(hostname, options, callback);
};

import { Client, Databases, ID, Query } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || '6a44f36c002ed43aca9a';
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'idla_cms';
const NEWS_COLLECTION = process.env.VITE_APPWRITE_COLLECTION_NEWS || 'news';
const CUSTOM_FORMS_COLLECTION = process.env.VITE_APPWRITE_COLLECTION_CUSTOM_FORMS || 'custom_forms';

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID);
if (API_KEY) {
  client.setKey(API_KEY);
}
const databases = new Databases(client);

// -----------------------------------------------------------------------------
// DEFINITION DES 8 CHAMPS DU FORMULAIRE BOOTCAMP
// -----------------------------------------------------------------------------
const bootcampFormFields = [
  {
    id: 'f_1',
    label: 'Nom & Prénom',
    type: 'text',
    required: true,
    placeholder: 'ex: Jean Dupont'
  },
  {
    id: 'f_2',
    label: 'Adresse E-mail',
    type: 'text',
    required: true,
    placeholder: 'ex: jean.dupont@email.com'
  },
  {
    id: 'f_3',
    label: 'Téléphone / WhatsApp',
    type: 'text',
    required: true,
    placeholder: 'ex: +237 600 000 000'
  },
  {
    id: 'f_4',
    label: "Tranche d'âge",
    type: 'select',
    required: true,
    options: ['18 - 24 ans', '25 - 34 ans', '35 - 44 ans', '45 ans et plus']
  },
  {
    id: 'f_5',
    label: "Domaine d'intérêt / Spécialité",
    type: 'select',
    required: true,
    options: [
      'Ingénierie & Tech (IA, Développement, Cyber)',
      'Management, Stratégie & Business',
      'Droit, Finance & Fiscalité',
      'Santé & Sciences Sociales',
      'Autre secteur'
    ]
  },
  {
    id: 'f_6',
    label: 'Statut professionnel actuel',
    type: 'select',
    required: true,
    options: [
      'Étudiant(e)',
      'Jeune diplômé(e)',
      'En recherche d\'emploi / Stage',
      'Professionnel(le) en activité',
      'Entrepreneur / Indépendant'
    ]
  },
  {
    id: 'f_7',
    label: 'Objectif principal au BootCamp',
    type: 'radio',
    required: true,
    options: [
      'Rencontrer des recruteurs et passer un entretien direct',
      'Déposer mon CV auprès des entreprises partenaires',
      'Suivre les masterclass et ateliers pratiques',
      'Découvrir les programmes de formation IDLA'
    ]
  },
  {
    id: 'f_8',
    label: 'Téléverser votre CV (PDF/Doc - Optionnel)',
    type: 'file',
    required: false
  }
];

const FORM_ID = 'form-bootcamp-2026';
const EVENT_ID = 'news-bootcamp-2026';

async function seedBootcampEventOnly() {
  console.log("🚀 === INJECTION EXCLUSIVE DE L'ÉVÉNEMENT BOOTCAMP & FORMULAIRE ===");
  console.log(`Endpoint: ${ENDPOINT}`);
  console.log(`Database ID: ${DATABASE_ID}`);

  // 1. Définition du Formulaire sur mesure
  const formPayload = {
    title: 'Inscription au BootCamp & Salon de Recrutement IDLA 2026',
    description: 'Formulaire officiel d\'enregistrement gratuit pour le BootCamp IDLA. Complétez vos informations pour réserver votre accès prioritaire aux ateliers et entretiens de recrutement.',
    fields: JSON.stringify(bootcampFormFields),
    createdAt: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  };

  // 2. Définition de l'Actualité / Événement
  const eventPayload = {
    title: 'BootCamp & Salon de Recrutement IDLA 2026 — Inscriptions Ouvertes',
    description: 'L\'International Distance Learning Academy (IDLA) organise son grand BootCamp & Salon de Recrutement annuel. Rencontrez en direct plus de 30 entreprises partenaires, assistez à nos masterclass exclusives et passez des entretiens d\'embauche sur place ou à distance. Inscription 100% gratuite via le formulaire rattaché ci-dessous.',
    date: new Date().toISOString(),
    category: 'Événements',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80',
    isFeatured: true
  };

  // 3. Enregistrement / Mise à jour du Formulaire dans Appwrite (Table custom_forms)
  try {
    console.log(`\n1️⃣ Enregistrement du formulaire '${FORM_ID}' dans la table '${CUSTOM_FORMS_COLLECTION}'...`);
    try {
      await databases.getDocument(DATABASE_ID, CUSTOM_FORMS_COLLECTION, FORM_ID);
      await databases.updateDocument(DATABASE_ID, CUSTOM_FORMS_COLLECTION, FORM_ID, formPayload);
      console.log(`  [OK] Formulaire '${FORM_ID}' mis à jour avec succès dans Appwrite.`);
    } catch (e: any) {
      await databases.createDocument(DATABASE_ID, CUSTOM_FORMS_COLLECTION, FORM_ID, formPayload);
      console.log(`  [OK] Formulaire '${FORM_ID}' créé avec succès dans Appwrite.`);
    }
  } catch (err: any) {
    console.warn(`  [ATTENTION] Impossible d'écrire le formulaire dans Appwrite (${err.message})...`);
  }

  // 4. Enregistrement / Mise à jour de l'Événement dans Appwrite (Table news)
  try {
    console.log(`\n2️⃣ Enregistrement de l'événement '${EVENT_ID}' dans la table '${NEWS_COLLECTION}'...`);
    const newsDocPayload = {
      title: eventPayload.title,
      description: `${eventPayload.description}\n\n👉 Lien d'inscription direct au formulaire : http://localhost:3000/#form-${FORM_ID}`,
      date: eventPayload.date,
      category: eventPayload.category,
      image: eventPayload.image,
      isFeatured: eventPayload.isFeatured
    };

    try {
      await databases.getDocument(DATABASE_ID, NEWS_COLLECTION, EVENT_ID);
      await databases.updateDocument(DATABASE_ID, NEWS_COLLECTION, EVENT_ID, newsDocPayload);
      console.log(`  [OK] Événement '${EVENT_ID}' mis à jour avec succès dans Appwrite.`);
    } catch (e: any) {
      await databases.createDocument(DATABASE_ID, NEWS_COLLECTION, EVENT_ID, newsDocPayload);
      console.log(`  [OK] Événement '${EVENT_ID}' créé avec succès dans Appwrite.`);
    }
  } catch (err: any) {
    console.warn(`  [ATTENTION] Impossible d'écrire l'événement dans Appwrite (${err.message})...`);
  }

  // 5. Génération et affichage du Lien de partage
  const shareLink = `http://localhost:3000/#form-${FORM_ID}`;
  console.log("\n==================================================================");
  console.log("🎉 SUCCÈS ! L'événement BootCamp et son formulaire ont été injectés.");
  console.log("==================================================================");
  console.log(`📌 ID du Formulaire : ${FORM_ID}`);
  console.log(`📌 Nombre de champs : 8 champs simples pour le grand public`);
  console.log(`🔗 Lien de partage direct du formulaire :`);
  console.log(`   👉 ${shareLink}`);
  console.log("==================================================================\n");
}

seedBootcampEventOnly().catch((err) => {
  console.error("❌ Erreur lors de l'exécution du script:", err);
  process.exit(1);
});
