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

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY!);
const databases = new Databases(client);

async function createTezeuYannApp() {
  console.log("📝 === CRÉATION DU DOSSIER DE CANDIDATURE POUR TEZEU YANN ===\n");

  const email = 'tezeuyann@gmail.com';
  const name = 'tezeu Yann';

  const existing = await databases.listDocuments(DATABASE_ID, 'applications', [Query.equal('email', email)]);
  if (existing.documents.length > 0) {
    console.log("✅ Le dossier de candidature existe déjà :", existing.documents[0].$id);
    return;
  }

  const newDoc = await databases.createDocument(
    DATABASE_ID,
    'applications',
    ID.unique(),
    {
      firstName: 'Yann',
      lastName: 'Tezeu',
      name: name,
      email: email,
      phone: '+237 6 00 00 00 00',
      program: 'BSc in Computer Science',
      nationality: 'Camerounaise',
      highestDegree: 'BAC / GCE A-Level',
      graduationYear: 2024,
      status: 'New',
      dateApplied: new Date().toISOString(),
      declarationChecked: true,
      initials: 'YT',
    }
  );

  console.log("✅ Candidature créée avec succès dans Appwrite Cloud DB !");
  console.log("   Document ID :", newDoc.$id);
  console.log("   Nom         :", newDoc.name);
  console.log("   Email       :", newDoc.email);
  console.log("   Programme   :", newDoc.program);
}

createTezeuYannApp();
