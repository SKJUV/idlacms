import dns from 'dns';
const originalLookup = dns.lookup;
(dns as any).lookup = (hostname: string, options: any, callback: any) => {
  if (hostname === 'fra.cloud.appwrite.io') {
    const cb = typeof options === 'function' ? options : callback;
    return cb(null, [{ address: '151.101.67.52', family: 4 }], 4);
  }
  return originalLookup(hostname, options, callback);
};

import { Client, Databases, Users, Query } from 'node-appwrite';
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
const users = new Users(client);

async function checkLatest() {
  console.log("🔍 === CHECK EN DÉTAIL DES DERNIERS COMPTES AUTH ET CANDIDATURES ===\n");

  console.log("1. 👥 TOUS LES COMPTES APPWRITE AUTH (Triés par date de création) :");
  try {
    const authList = await users.list([Query.limit(500)]);
    const sorted = authList.users.sort((a: any, b: any) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime());
    sorted.forEach((u: any, idx: number) => {
      console.log(`   ${idx + 1}. [ID: ${u.$id}] "${u.name}" <${u.email}> — Créé le: ${u.$createdAt}`);
    });
  } catch (e: any) {
    console.error("   Erreur Auth Users:", e.message);
  }

  console.log("\n2. 📄 TOUTES LES CANDIDATURES DANS LA COLLECTION 'applications' :");
  try {
    const appsRes = await databases.listDocuments(DATABASE_ID, 'applications', [Query.limit(5000)]);
    console.log(`   Total documents candidatures dans DB: ${appsRes.total}`);
    appsRes.documents.forEach((a: any, idx: number) => {
      console.log(`   ${idx + 1}. [DocID: ${a.$id}] Name: "${a.name}" | Email: "${a.email}" | Phone: "${a.phone}" | Program: "${a.program}" | Date: ${a.dateApplied || a.$createdAt}`);
    });
  } catch (e: any) {
    console.error("   Erreur applications:", e.message);
  }
}

checkLatest();
