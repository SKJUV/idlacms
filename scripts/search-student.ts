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

async function searchStudent() {
  console.log("🔍 === RECHERCHE DE L'ÉTUDIANT 'FAYETE' OU SIMILAIRE ===\n");

  const queryTerm = 'fayet';

  console.log("1. 👥 Recherche dans Appwrite Auth Users...");
  try {
    const authList = await users.list([Query.limit(500)]);
    console.log(`   Total comptes Auth : ${authList.total}`);
    const matchesAuth = authList.users.filter((u: any) => 
      u.name.toLowerCase().includes(queryTerm) || u.email.toLowerCase().includes(queryTerm)
    );
    if (matchesAuth.length > 0) {
      console.log(`   ✅ TROUVÉ DANS APPWRITE AUTH :`);
      matchesAuth.forEach((u: any) => {
        console.log(`      • [ID: ${u.$id}] Nom: "${u.name}" | Email: "${u.email}" | Inscrit le: ${u.$createdAt}`);
      });
    } else {
      console.log(`   ❌ Aucun compte Auth trouvé avec le terme "${queryTerm}"`);
    }
  } catch (e: any) {
    console.error("   Erreur lecture Auth Users:", e.message);
  }

  console.log("\n2. 📄 Recherche dans la collection 'applications' (Candidatures BD)...");
  try {
    const appsRes = await databases.listDocuments(DATABASE_ID, 'applications', [Query.limit(5000)]);
    console.log(`   Total dossiers d'inscription dans la BD : ${appsRes.total}`);
    const matchesApps = appsRes.documents.filter((a: any) => 
      (a.name || '').toLowerCase().includes(queryTerm) || 
      (a.email || '').toLowerCase().includes(queryTerm) ||
      (a.firstName || '').toLowerCase().includes(queryTerm) ||
      (a.lastName || '').toLowerCase().includes(queryTerm)
    );
    if (matchesApps.length > 0) {
      console.log(`   ✅ TROUVÉ DANS LES CANDIDATURES BD :`);
      matchesApps.forEach((a: any) => {
        console.log(`      • [ID: ${a.$id}] Nom: "${a.name}" | Email: "${a.email}" | Programme: "${a.program}" | Statut: "${a.status}" | Date: ${a.dateApplied || a.$createdAt}`);
      });
    } else {
      console.log(`   ❌ Aucun dossier de candidature trouvé avec le terme "${queryTerm}"`);
    }

    console.log("\n📋 Liste de TOUTES les candidatures récentes enregistrées dans la BD :");
    appsRes.documents.forEach((a: any, idx: number) => {
      console.log(`   ${idx + 1}. [ID: ${a.$id}] ${a.name} (${a.email}) — Programme: "${a.program}" | Statut: "${a.status}" | Date: ${a.dateApplied || a.$createdAt}`);
    });
  } catch (e: any) {
    console.error("   Erreur lecture applications:", e.message);
  }

  console.log("\n📋 Liste de TOUS les comptes Auth inscrits (pour comparaison) :");
  try {
    const authListAll = await users.list([Query.limit(500)]);
    authListAll.users.forEach((u: any, idx: number) => {
      console.log(`   ${idx + 1}. [ID: ${u.$id}] ${u.name} <${u.email}> — Inscrit le: ${u.$createdAt}`);
    });
  } catch (e: any) {}
}

searchStudent();
