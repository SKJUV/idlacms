import dns from 'dns';
const originalLookup = dns.lookup;
(dns as any).lookup = (hostname: string, options: any, callback: any) => {
  if (hostname === 'fra.cloud.appwrite.io') {
    const cb = typeof options === 'function' ? options : callback;
    return cb(null, [{ address: '151.101.67.52', family: 4 }], 4);
  }
  return originalLookup(hostname, options, callback);
};

import { Client, Users, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || '6a44f36c002ed43aca9a';
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'idla_cms';

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY!);
const users = new Users(client);
const databases = new Databases(client);

async function inspectAllAuthUsers() {
  console.log("👥 === LISTE DE TOUS LES COMPTES AUTH ET CMS_USERS ===");
  const list = await users.list();
  console.log(`\n🔑 ${list.total} Comptes Auth trouvés :`);
  list.users.forEach((u: any, idx: number) => {
    console.log(`  ${idx + 1}. [AuthID: ${u.$id}] Nom: "${u.name}" | Email: "${u.email}" | Labels: ${JSON.stringify(u.labels)} | Prefs: ${JSON.stringify(u.prefs)}`);
  });

  const cmsUsers = await databases.listDocuments(DATABASE_ID, 'cms_users');
  console.log(`\n📋 ${cmsUsers.total} Documents dans 'cms_users' :`);
  cmsUsers.documents.forEach((d: any, idx: number) => {
    console.log(`  ${idx + 1}. [DocID: ${d.$id}] Nom: "${d.name}" | Email: "${d.email}" | Role: "${d.role}" | Programs: ${JSON.stringify(d.assignedPrograms)}`);
  });
}

inspectAllAuthUsers();
