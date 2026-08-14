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

async function inspectCmsUsers() {
  console.log("🔍 === INSPECTION DE LA COLLECTION 'cms_users' ET DES ENSEIGNANTS ===");
  try {
    const col = await databases.getCollection(DATABASE_ID, 'cms_users');
    console.log("\n📌 Collection 'cms_users' Attributes & Indexes:");
    console.log("Permissions:", col.$permissions);
    console.log("Document Security:", col.documentSecurity);
    console.log("Attributes:", col.attributes.map((a: any) => `${a.key} (${a.type}, req:${a.required})`));
    console.log("Indexes:", col.indexes.map((i: any) => `${i.key} (${i.type}, attributes: ${i.attributes.join(', ')})`));

    const docs = await databases.listDocuments(DATABASE_ID, 'cms_users');
    console.log(`\n📋 ${docs.total} documents dans 'cms_users' :`);
    docs.documents.forEach((d: any) => {
      console.log(`  - [ID: ${d.$id}] ${d.name} (${d.email}) | Role: ${d.role} | Programs: ${JSON.stringify(d.assignedPrograms)}`);
    });
  } catch (e: any) {
    console.error("Erreur inspection cms_users:", e.message);
  }
}

inspectCmsUsers();
