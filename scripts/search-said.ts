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

async function searchSaid() {
  console.log("🔍 === RECHERCHE MULTI-CRITÈRES POUR 'SAID' / 'SAÏD' ===\n");

  const queryTerm = 'said';

  console.log("1. 👥 Recherche dans Appwrite Auth Users...");
  try {
    const authList = await users.list([Query.limit(500)]);
    const matchesAuth = authList.users.filter((u: any) => 
      u.name.toLowerCase().includes(queryTerm) || 
      u.email.toLowerCase().includes(queryTerm)
    );
    if (matchesAuth.length > 0) {
      console.log(`   ✅ TROUVÉ DANS APPWRITE AUTH (${matchesAuth.length}) :`);
      matchesAuth.forEach((u: any) => {
        console.log(`      • [ID: ${u.$id}] Nom: "${u.name}" | Email: "${u.email}" | Date: ${u.$createdAt}`);
      });
    } else {
      console.log(`   ❌ Aucun compte Auth trouvé avec le nom ou email "${queryTerm}"`);
    }
  } catch (e: any) {
    console.error("   Erreur Auth Users:", e.message);
  }

  console.log("\n2. 📄 Recherche dans la collection 'applications' (Candidatures BD)...");
  try {
    const appsRes = await databases.listDocuments(DATABASE_ID, 'applications', [Query.limit(5000)]);
    const matchesApps = appsRes.documents.filter((a: any) => 
      (a.name || '').toLowerCase().includes(queryTerm) || 
      (a.email || '').toLowerCase().includes(queryTerm) ||
      (a.firstName || '').toLowerCase().includes(queryTerm) ||
      (a.lastName || '').toLowerCase().includes(queryTerm)
    );
    if (matchesApps.length > 0) {
      console.log(`   ✅ TROUVÉ DANS LES CANDIDATURES BD (${matchesApps.length}) :`);
      matchesApps.forEach((a: any) => {
        console.log(`      • [ID: ${a.$id}] Nom: "${a.name}" | Email: "${a.email}" | Programme: "${a.program}" | Statut: "${a.status}"`);
      });
    } else {
      console.log(`   ❌ Aucune candidature trouvée avec "${queryTerm}"`);
    }
  } catch (e: any) {
    console.error("   Erreur applications:", e.message);
  }

  console.log("\n3. 💬 Recherche dans les Messages du Chat BD...");
  try {
    const msgs = await databases.listDocuments(DATABASE_ID, 'messages', [Query.limit(5000)]);
    const matchesMsgs = msgs.documents.filter((m: any) => 
      (m.text || '').toLowerCase().includes(queryTerm) || 
      (m.sender || '').toLowerCase().includes(queryTerm)
    );
    if (matchesMsgs.length > 0) {
      console.log(`   ✅ TROUVÉ DANS LES MESSAGES BD (${matchesMsgs.length}) :`);
      matchesMsgs.forEach((m: any) => {
        console.log(`      • [ID: ${m.$id}] Channel: ${m.applicationId} | Text: "${m.text.slice(0, 80)}"`);
      });
    } else {
      console.log(`   ❌ Aucun message de chat contenant "${queryTerm}"`);
    }
  } catch (e: any) {
    console.error("   Erreur messages:", e.message);
  }
}

searchSaid();
