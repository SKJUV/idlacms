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

async function listAllDbNames() {
  console.log("🔍 === RECENSEMENT DE TOUS LES NOMS PRÉSENTS DANS TOUTE LA BASE ===\n");

  console.log("1. 👥 COMPTES D'ACCÈS APPWRITE AUTH :");
  const auth = await users.list([Query.limit(500)]);
  auth.users.forEach((u: any, i: number) => console.log(`   ${i + 1}. ${u.name} <${u.email}> (${u.$id})`));

  console.log("\n2. 📄 CANDIDATURES ('applications') :");
  const apps = await databases.listDocuments(DATABASE_ID, 'applications', [Query.limit(500)]);
  apps.documents.forEach((a: any, i: number) => console.log(`   ${i + 1}. ${a.name} <${a.email}> — Prog: ${a.program}`));

  console.log("\n3. 📝 LOGS D'ACTIVITÉ ('activity_logs') :");
  const logs = await databases.listDocuments(DATABASE_ID, 'activity_logs', [Query.limit(500)]);
  logs.documents.forEach((l: any, i: number) => console.log(`   ${i + 1}. User: "${l.user}" — Action: "${l.text}"`));

  console.log("\n4. 💬 NOMS EXTRAITS DE LA MESSAGERIE ('messages') :");
  const msgs = await databases.listDocuments(DATABASE_ID, 'messages', [Query.limit(500)]);
  const namesSet = new Set<string>();
  msgs.documents.forEach((m: any) => {
    try {
      const p = JSON.parse(m.text);
      if (p.n) namesSet.add(p.n);
    } catch {}
  });
  Array.from(namesSet).forEach((n, i) => console.log(`   ${i + 1}. ${n}`));
}

listAllDbNames();
