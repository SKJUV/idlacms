import 'dotenv/config';
import dns from 'dns';

// Override DNS lookup for fra.cloud.appwrite.io to directly use its resolved IP address
// This avoids DNS lookup latencies and timeouts on slow networks
const originalLookup = dns.lookup;
(dns as any).lookup = (hostname: string, options: any, callback: any) => {
  if (hostname === 'fra.cloud.appwrite.io') {
    const cb = typeof options === 'function' ? options : callback;
    return cb(null, [{ address: '151.101.67.52', family: 4 }], 4);
  }
  return originalLookup(hostname, options, callback);
};

import { Client, Databases, Users, ID, Query } from 'node-appwrite';
import {
  programsData,
  newsData,
  testimonialsData,
  initialUsers,
  preRegistrationsData,
  activityLogsData,
} from '../src/data/mockData';

const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'idla_cms';

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error("Erreur : Les variables d'environnement APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID et APPWRITE_API_KEY doivent être définies.");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);
const users = new Users(client);

// Helper function to retry failed requests with a delay
async function retryCall<T>(fn: () => Promise<T>, retries = 5, delayMs = 3000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      if (i === retries - 1) throw err;
      console.warn(`[Retry ${i + 1}/${retries}] Échec temporaire: ${err.message || err}. Nouvelle tentative dans ${delayMs}ms...`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw new Error("Nombre de tentatives maximal atteint.");
}

// Helper to convert French date string to ISO
const FR_MONTHS: Record<string, number> = {
  jan: 0, fév: 1, fev: 1, mar: 2, avr: 3, mai: 4, jun: 5, juin: 5,
  jul: 6, juil: 6, aoû: 7, aou: 7, sep: 8, oct: 9, nov: 10, déc: 11, dec: 11,
};

function parseFrenchDate(input: string): string {
  try {
    const [day, monthAbbr, year] = input.split(' ');
    const monthKey = monthAbbr.toLowerCase().slice(0, 3);
    const month = FR_MONTHS[monthKey] ?? 0;
    return new Date(Number(year), month, Number(day)).toISOString();
  } catch (e) {
    return new Date().toISOString();
  }
}

async function forceSeedCollection(collectionId: string, docs: Array<{ id?: string; data: Record<string, any> }>) {
  console.log(`\n--- Nettoyage de la collection "${collectionId}" ---`);
  try {
    // 1. Fetch all documents in the collection with retry
    const existing = await retryCall(() => databases.listDocuments(DATABASE_ID, collectionId, [Query.limit(100)]));
    console.log(`Nombre de documents actuels trouvés : ${existing.total}`);
    
    // 2. Delete each existing document with retry & spacing delay
    for (const doc of existing.documents) {
      try {
        await new Promise(r => setTimeout(r, 600));
        await retryCall(() => databases.deleteDocument(DATABASE_ID, collectionId, doc.$id));
        console.log(`Supprimé : ${doc.$id}`);
      } catch (err) {
        console.error(`Erreur de suppression du document ${doc.$id} :`, err);
      }
    }

    // 3. Insert new seed documents with retry & spacing delay
    console.log(`\nInsertion des nouveaux documents de démo dans "${collectionId}"...`);
    for (const doc of docs) {
      const docId = doc.id || ID.unique();
      try {
        await new Promise(r => setTimeout(r, 600));
        await retryCall(() => databases.createDocument(DATABASE_ID, collectionId, docId, doc.data));
        console.log(`Créé avec succès : ${docId}`);
      } catch (err) {
        console.error(`Erreur d'insertion du document ${docId} :`, err);
      }
    }
  } catch (err: any) {
    console.error(`Échec du nettoyage/peuplage de la collection "${collectionId}" :`, err.message || err);
  }
}

async function run() {
  console.log("=== DÉBUT DU PROVISIONING FORCE-SEED AVEC RETRIES, DÉLAIS ET DNS STATIC ===");
  console.log(`Endpoint : ${ENDPOINT}`);
  console.log(`Projet   : ${PROJECT_ID}`);
  console.log(`Database : ${DATABASE_ID}\n`);

  // Seed Programs
  await forceSeedCollection('programs', programsData.map((p) => ({
    id: p.id,
    data: { title: p.title, description: p.description, type: p.type, category: p.category, duration: p.duration, image: p.image, isNew: !!p.isNew },
  })));

  // Seed News
  await forceSeedCollection('news', newsData.map((n) => ({
    id: n.id,
    data: { title: n.title, description: n.description, date: parseFrenchDate(n.date), category: n.category, image: n.image, isFeatured: !!n.isFeatured },
  })));

  // Seed Testimonials
  await forceSeedCollection('testimonials', testimonialsData.map((t) => ({
    id: t.id,
    data: { name: t.name, role: t.role, text: t.text, image: t.image, promo: t.promo, category: t.category, isFeatured: !!t.isFeatured },
  })));

  // Seed CMS Users
  await forceSeedCollection('cms_users', initialUsers.map((u) => ({
    id: u.id,
    data: { name: u.name, email: u.email, role: u.role, status: u.status, avatar: u.avatar, initials: u.initials, lastLogin: new Date().toISOString() },
  })));

  // Seed Applications
  await forceSeedCollection('applications', preRegistrationsData.map((p) => {
    const [firstName, ...rest] = p.name.split(' ');
    return {
      id: p.id,
      data: {
        firstName,
        lastName: rest.join(' ') || '—',
        name: p.name,
        email: p.email,
        phone: p.phone || '+237 6 00 00 00 00',
        nationality: p.nationality || 'Camerounaise',
        program: p.program,
        status: p.status,
        dateApplied: new Date().toISOString(),
        declarationChecked: true,
        files: '[]',
        initials: p.initials,
      },
    };
  }));

  // Seed Activity Logs
  await forceSeedCollection('activity_logs', activityLogsData.map((a) => ({
    id: a.id,
    data: { type: a.type, user: a.user, text: a.text, time: new Date().toISOString() },
  })));

  console.log("\n=== COMPTES AUTHENTIFICATION ===");
  
  // Create Demo Admin Auth Account
  try {
    const adminEmail = 'admin@idla.edu';
    const adminPassword = 'admin123';
    
    // Check if user already exists
    const usersList = await retryCall(() => users.list([Query.equal('email', adminEmail)]));
    if (usersList.total > 0) {
      console.log(`Compte Auth Administrateur (${adminEmail}) existe déjà.`);
    } else {
      await retryCall(() => users.create({
        userId: ID.unique(),
        email: adminEmail,
        password: adminPassword,
        name: 'Jean-Sebastien Dupont'
      }));
      console.log(`Créé Compte Auth Administrateur : email: "${adminEmail}" / password: "${adminPassword}"`);
    }
  } catch (err: any) {
    if (err.message?.includes('already exists')) {
      console.log("Compte Auth Administrateur existe déjà.");
    } else {
      console.warn("Remarque Compte Administrateur Auth :", err.message || err);
    }
  }

  // Create Demo Candidate Auth Account
  try {
    const candidateEmail = 'jean.dupont@email.com';
    const candidatePassword = 'password123';
    
    const usersList = await retryCall(() => users.list([Query.equal('email', candidateEmail)]));
    if (usersList.total > 0) {
      console.log(`Compte Auth Candidat (${candidateEmail}) existe déjà.`);
    } else {
      await retryCall(() => users.create({
        userId: ID.unique(),
        email: candidateEmail,
        password: candidatePassword,
        name: 'Jean Dupont'
      }));
      console.log(`Créé Compte Auth Candidat : email: "${candidateEmail}" / password: "${candidatePassword}"`);
    }
  } catch (err: any) {
    if (err.message?.includes('already exists')) {
      console.log("Compte Auth Candidat existe déjà.");
    } else {
      console.warn("Remarque Compte Candidat Auth :", err.message || err);
    }
  }

  console.log("\n=== NETTOYAGE ET PEUPLAGE TERMINÉ AVEC SUCCÈS ===");
}

run();
