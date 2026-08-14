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

async function setYannAsTeacher() {
  console.log("👨‍🏫 === CONFIGURATION DE YANN COMME SEUL ENSEIGNANT DANS BD CMS_USERS ===\n");

  const yannAccounts = [
    { id: 'tch-yann-1', name: 'YANN MANUEL', email: 'noumbimanuel45@gmail.com' },
    { id: 'tch-yann-2', name: 'Yann Tezeu', email: 'yann.tezeu@facsciences-uy1.cm' },
    { id: 'tch-yann-3', name: 'tezeu Yann', email: 'tezeuyann@gmail.com' }
  ];

  for (const acc of yannAccounts) {
    try {
      const existing = await databases.listDocuments(DATABASE_ID, 'cms_users', [Query.equal('email', acc.email)]);
      if (existing.documents.length > 0) {
        await databases.updateDocument(DATABASE_ID, 'cms_users', existing.documents[0].$id, {
          role: 'teacher',
          assignedPrograms: ['Bachelor of Science in Computer Science (BSc CS)', 'Bachelor of Business Administration (BBA)']
        });
        console.log(`✅ Mis à jour en enseignant : ${acc.name} (${acc.email})`);
      } else {
        await databases.createDocument(DATABASE_ID, 'cms_users', acc.id, {
          name: acc.name,
          email: acc.email,
          role: 'teacher',
          status: 'Actif',
          initials: 'YN',
          lastLogin: new Date().toISOString(),
          assignedPrograms: ['Bachelor of Science in Computer Science (BSc CS)', 'Bachelor of Business Administration (BBA)']
        });
        console.log(`✅ Créé fiche enseignant : ${acc.name} (${acc.email})`);
      }
    } catch (e: any) {
      console.error(`Erreur pour ${acc.email}:`, e.message);
    }
  }

  console.log("\n📋 Liste finale de tous les utilisateurs de la collection 'cms_users' :");
  const list = await databases.listDocuments(DATABASE_ID, 'cms_users');
  list.documents.forEach((d: any, idx: number) => {
    console.log(`   ${idx + 1}. [DocID: ${d.$id}] Nom: "${d.name}" | Email: "${d.email}" | Role: "${d.role}" | Program: ${JSON.stringify(d.assignedPrograms || [])}`);
  });
}

setYannAsTeacher();
