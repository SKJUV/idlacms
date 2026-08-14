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

async function assignRealRoles() {
  console.log("👥 === ATTRIBUTION DES RÔLES RÉELS DANS CMS_USERS (ÉTUDIANTS, ENSEIGNANTS, ADMINS) ===");

  const teacherEmails = [
    'emmanuelbrink@gmail.com',
    'emmanuelekambi8@gmail.com',
    'noumbimanuel45@gmail.com',
    'yann.tezeu@facsciences-uy1.cm',
  ];

  const adminEmails = [
    'idlaadmin@gmail.com',
    'admin@idla.edu'
  ];

  const docs = await databases.listDocuments(DATABASE_ID, 'cms_users');
  for (const doc of docs.documents) {
    const email = (doc.email || '').toLowerCase().trim();
    let role = 'student';
    if (adminEmails.includes(email)) {
      role = 'Super Admin';
    } else if (teacherEmails.includes(email)) {
      role = 'teacher';
    }

    try {
      await databases.updateDocument(DATABASE_ID, 'cms_users', doc.$id, {
        role: role
      });
      console.log(`✅ ${doc.name} (${email}) -> Rôle attribué : ${role}`);
    } catch (e: any) {
      console.error(`Erreur mise à jour rôle pour ${email}:`, e.message);
    }
  }

  console.log("\n📋 Résultat final des utilisateurs dans 'cms_users' :");
  const finalDocs = await databases.listDocuments(DATABASE_ID, 'cms_users');
  finalDocs.documents.forEach((d: any, idx: number) => {
    console.log(`  ${idx + 1}. [ID: ${d.$id}] ${d.name} (${d.email}) | Rôle: "${d.role}"`);
  });
}

assignRealRoles();
