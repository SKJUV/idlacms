import dns from 'dns';
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

import 'dotenv/config';
import { Client, Databases, Query, ID } from 'node-appwrite';

const ENDPOINT = process.env.APPWRITE_ENDPOINT || process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID || '6a44f36c002ed43aca9a';
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'idla_cms';

if (!API_KEY) {
  console.error('APPWRITE_API_KEY manquante dans .env');
  process.exit(1);
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function withRetry<T>(fn: () => Promise<T>, retries = 5, delayMs = 500): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      await delay(delayMs * (i + 1));
    }
  }
  throw lastErr;
}

const EXACT_LOCAL_APPLICATIONS = [
  // 1. ARISTIDE EMCTHEU
  {
    firstName: 'ARISTIDE',
    lastName: 'EMCTHEU',
    name: 'ARISTIDE EMCTHEU',
    email: 'juvenalskengni@gmail.com',
    program: 'Inscription seule',
    status: 'New',
  },
  // 2. billy billy
  {
    firstName: 'billy',
    lastName: 'billy',
    name: 'billy billy',
    email: 'mbonguebilly@gmail.com',
    program: 'Inscription seule',
    status: 'New',
  },
  // 3. Ngoe Wilson Ngoe
  {
    firstName: 'Wilson Ngoe',
    lastName: 'Ngoe',
    name: 'Ngoe Wilson Ngoe',
    email: 'wilsonngoe@gmail.com',
    phone: '+237670032152',
    program: 'HRM|Human Ressource management',
    status: 'Accepted',
  },
  // 4. BESONGAKU DRIES NDIPEBA
  {
    firstName: 'DRIES NDIPEBA',
    lastName: 'BESONGAKU',
    name: 'BESONGAKU DRIES NDIPEBA',
    email: 'driesbesong@gmail.com',
    phone: '+237679458822',
    program: 'CISCO CCNA-CCNP',
    status: 'Accepted',
  },
  // 5. Manuel Noumbi (1/3)
  {
    firstName: 'Manuel',
    lastName: 'Noumbi',
    name: 'Manuel Noumbi',
    email: 'noumbimanuel45@gmail.com',
    phone: '+2370653343234',
    program: 'Bachelor of Business Administration (BBA)',
    status: 'New',
  },
  // 6. Manuel Noumbi (2/3)
  {
    firstName: 'Manuel',
    lastName: 'Noumbi',
    name: 'Manuel Noumbi',
    email: 'noumbimanuel45@gmail.com',
    phone: '+2370653343234',
    program: 'Graduate Diplomas in Computing (BCA / BSc Computing)',
    status: 'In Review',
  },
  // 7. Manuel Noumbi (3/3)
  {
    firstName: 'Manuel',
    lastName: 'Noumbi',
    name: 'Manuel Noumbi',
    email: 'noumbimanuel45@gmail.com',
    phone: '+2370653343234',
    program: 'Graduate Diplomas in Business (Nivellement)',
    status: 'Rejected',
  },
  // 8. JUVENAL SINENG KENGNI (1/4)
  {
    firstName: 'SINENG KENGNI',
    lastName: 'JUVENAL',
    name: 'JUVENAL SINENG KENGNI',
    email: 'sinengjuvenal@gmail.com',
    phone: '+237698224774',
    program: 'Graduate Diplomas in Business (Nivellement)',
    status: 'In Review',
  },
  // 9. JUVENAL SINENG KENGNI (2/4)
  {
    firstName: 'SINENG KENGNI',
    lastName: 'JUVENAL',
    name: 'JUVENAL SINENG KENGNI',
    email: 'sinengjuvenal@gmail.com',
    phone: '+237698224774',
    program: 'MSc in Computer Science',
    status: 'Accepted',
  },
  // 10. JUVENAL SINENG KENGNI (3/4)
  {
    firstName: 'SINENG KENGNI',
    lastName: 'JUVENAL',
    name: 'JUVENAL SINENG KENGNI',
    email: 'sinengjuvenal@gmail.com',
    phone: '+237698224774',
    program: 'Bachelor of Business Administration (BBA)',
    status: 'Accepted',
  },
  // 11. JUVENAL SINENG KENGNI (4/4)
  {
    firstName: 'SINENG KENGNI',
    lastName: 'JUVENAL',
    name: 'JUVENAL SINENG KENGNI',
    email: 'sinengjuvenal@gmail.com',
    phone: '+237698224774',
    program: 'Cisco CCNA-CCNP',
    status: 'Accepted',
  },
];

const EXACT_LOCAL_TEACHERS = [
  {
    name: 'teste1',
    email: 'test@gmail.com',
    role: 'teacher',
    status: 'Actif',
    assignedPrograms: ['Master of Laws (LLM) - M1'],
  },
  {
    name: 'Ewouki Ewouki Emmanuel',
    email: 'emmanuelekambi8@gmail.com',
    role: 'teacher',
    status: 'Actif',
    assignedPrograms: [
      'Bachelor of Science in Computer Applications (BCA)',
      'Bachelor of Business Administration',
      'Master in Software Engineering',
    ],
  },
  {
    name: 'YANN MANUEL',
    email: 'noumbimanuel45@gmail.com',
    role: 'teacher',
    status: 'Actif',
    assignedPrograms: [
      'Bachelor of Science in Computer Applications (BCA)',
      'Bachelor of Business Administration',
    ],
  },
  {
    name: 'tezeu Yann',
    email: 'tezeuyann@gmail.com',
    role: 'teacher',
    status: 'Actif',
    assignedPrograms: [
      'Bachelor of Science in Computer Applications (BCA)',
      'Bachelor of Business Administration',
    ],
  },
];

async function forcePurgeAndSeed() {
  console.log('💥 PURGE TOTALE ET REFRESH DE LA BASE APPWRITE CLOUD...');

  // 1. SUPPRESSION DE TOUTES LES CANDIDATURES DANS APPWRITE CLOUD
  let totalDeletedApps = 0;
  while (true) {
    const res = await withRetry(() => databases.listDocuments(DATABASE_ID, 'applications', [Query.limit(100)]));
    if (res.documents.length === 0) break;
    console.log(`Purger un lot de ${res.documents.length} candidatures obsolètes...`);
    for (const doc of res.documents) {
      try {
        await withRetry(() => databases.deleteDocument(DATABASE_ID, 'applications', doc.$id));
        totalDeletedApps++;
        await delay(100);
      } catch (e: any) {
        console.warn(`Erreur lors de la suppression du doc ${doc.$id}:`, e.message);
      }
    }
  }
  console.log(`✅ Nettoyage terminé: ${totalDeletedApps} anciennes candidatures supprimées d'Appwrite Cloud.`);

  // 2. CREATION DES 11 CANDIDATURES CANONIQUES EXACTES
  for (const app of EXACT_LOCAL_APPLICATIONS) {
    try {
      await withRetry(() => databases.createDocument(DATABASE_ID, 'applications', ID.unique(), {
        firstName: app.firstName,
        lastName: app.lastName,
        name: app.name,
        email: app.email,
        phone: app.phone || '',
        program: app.program,
        status: app.status,
        dateApplied: new Date().toISOString(),
        initials: app.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2),
      }));
      console.log(`✨ [OK] Candidature créée: ${app.name} -> ${app.program} (${app.status})`);
      await delay(200);
    } catch (e: any) {
      console.error(`❌ Erreur création ${app.name}:`, e.message);
    }
  }

  // 3. PURGE DES ENSEIGNANTS DANS CMS_USERS
  const usersRes = await withRetry(() => databases.listDocuments(DATABASE_ID, 'cms_users', [Query.limit(5000)]));
  for (const doc of usersRes.documents) {
    if (doc.role === 'teacher') {
      try {
        await withRetry(() => databases.deleteDocument(DATABASE_ID, 'cms_users', doc.$id));
        await delay(100);
      } catch (e) {}
    }
  }

  // 4. CREATION DES 4 ENSEIGNANTS CANONIQUES EXACTS
  for (const teacher of EXACT_LOCAL_TEACHERS) {
    try {
      await withRetry(() => databases.createDocument(DATABASE_ID, 'cms_users', ID.unique(), {
        name: teacher.name,
        email: teacher.email,
        role: teacher.role,
        status: teacher.status,
        assignedPrograms: teacher.assignedPrograms,
        initials: teacher.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2),
      }));
      console.log(`✨ [OK] Enseignant créé: ${teacher.name} (${teacher.email})`);
      await delay(200);
    } catch (e: any) {
      console.error(`❌ Erreur création enseignant ${teacher.name}:`, e.message);
    }
  }

  console.log('🎉 REFRESH TOTAL REUSSI ! La base Appwrite Cloud contient à présent STRICTEMENT vos données locales.');
}

forcePurgeAndSeed();
