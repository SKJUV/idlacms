import dns from 'dns';
const originalLookup = dns.lookup;
(dns as any).lookup = (hostname: string, options: any, callback: any) => {
  if (hostname === 'fra.cloud.appwrite.io') {
    const cb = typeof options === 'function' ? options : callback;
    return cb(null, [{ address: '151.101.67.52', family: 4 }], 4);
  }
  return originalLookup(hostname, options, callback);
};

import { Client, Databases } from 'node-appwrite';
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

async function removeDemoTeachersFromDb() {
  console.log("🧹 === SUPPRESSION DES 3 ENSEIGNANTS DE DÉMO DE LA BASE APPWRITE CLOUD ===\n");

  const demoIds = ['tch-8901', 'tch-8902', 'tch-8903'];

  for (const docId of demoIds) {
    try {
      await databases.deleteDocument(DATABASE_ID, 'cms_users', docId);
      console.log(`✅ Document supprimé avec succès de cms_users : ${docId}`);
    } catch (e: any) {
      console.warn(`Remarque suppression ${docId}:`, e.message);
    }
  }

  console.log("\n📋 Liste restante dans la collection 'cms_users' :");
  try {
    const res = await databases.listDocuments(DATABASE_ID, 'cms_users');
    res.documents.forEach((d: any, i: number) => {
      console.log(`   ${i + 1}. [DocID: ${d.$id}] Nom: "${d.name}" | Email: "${d.email}" | Role: "${d.role}"`);
    });
  } catch (e: any) {
    console.error("Erreur lecture cms_users:", e.message);
  }
}

removeDemoTeachersFromDb();
