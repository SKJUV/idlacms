import dns from 'dns';
const originalLookup = dns.lookup;
(dns as any).lookup = (hostname: string, options: any, callback: any) => {
  if (hostname === 'fra.cloud.appwrite.io') {
    const cb = typeof options === 'function' ? options : callback;
    return cb(null, [{ address: '151.101.67.52', family: 4 }], 4);
  }
  return originalLookup(hostname, options, callback);
};

import { Client, Databases, Query } from 'node-appwrite';
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

async function checkHiddenApp() {
  console.log("🔍 === RECHERCHE DU DOSSIER DE TEZEU YANN DANS LA BD (AVEC CLÉ API SERVER) ===\n");

  const apps = await databases.listDocuments(DATABASE_ID, 'applications', [Query.limit(5000)]);
  console.log(`Total documents retournés par API Key Server Admin: ${apps.total}`);

  apps.documents.forEach((d: any, idx: number) => {
    console.log(`\n📄 Document #${idx + 1} [ID: ${d.$id}] :`);
    console.log(`   Nom            : ${d.name} (${d.firstName} ${d.lastName})`);
    console.log(`   Email          : ${d.email}`);
    console.log(`   Programme      : ${d.program}`);
    console.log(`   Permissions    : ${JSON.stringify(d.$permissions)}`);
    console.log(`   Créé le        : ${d.$createdAt}`);
  });
}

checkHiddenApp();
