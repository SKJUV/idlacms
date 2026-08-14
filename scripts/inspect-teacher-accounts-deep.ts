import dns from 'dns';
const originalLookup = dns.lookup;
(dns as any).lookup = (hostname: string, options: any, callback: any) => {
  if (hostname === 'fra.cloud.appwrite.io') {
    const cb = typeof options === 'function' ? options : callback;
    return cb(null, [{ address: '151.101.67.52', family: 4 }], 4);
  }
  return originalLookup(hostname, options, callback);
};

import { Client, Databases, Users } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || '6a44f36c002ed43aca9a';
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'idla_cms';

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY!);

const databases = new Databases(client);
const users = new Users(client);

async function inspectTeacherAccountsDeep() {
  console.log("🔍 === INSPECTION PRÉALABLE DES COMPTES ENSEIGNANTS (LECTURE SEULE) ===\n");

  const targetEmails = ['test@gmail.com', 'emmanuelbrink@gmail.com', 'emmanuelekambi8@gmail.com'];

  for (const email of targetEmails) {
    try {
      const authSearch = await users.list([Query.equal('email', email)]);
      if (authSearch.users.length > 0) {
        const u = authSearch.users[0];
        console.log(`👤 COMPTE AUTH APPWRITE :`);
        console.log(`   ID Utilisateur : ${u.$id}`);
        console.log(`   Nom            : ${u.name}`);
        console.log(`   Email          : ${u.email}`);
        console.log(`   Labels actuels : [${u.labels.join(', ') || 'aucun'}]`);
        console.log(`   Inscrit le     : ${u.$createdAt}`);
        console.log(`   Dernière modif : ${u.$updatedAt}`);
        console.log(`   Préférences    : ${JSON.stringify(u.prefs)}`);
      } else {
        console.log(`❓ Compte Auth introuvable pour ${email}`);
      }
    } catch (e: any) {
      console.error(`Erreur lecture Auth pour ${email}:`, e.message);
    }
    console.log("--------------------------------------------------\n");
  }

  console.log("💬 RECHERCHE DES MESSAGES ET COURS ASSOCIÉS DANS LA BD :");
  try {
    const msgs = await databases.listDocuments(DATABASE_ID, 'messages');
    console.log(`Total messages dans la BD: ${msgs.total}`);
    msgs.documents.forEach((m: any) => {
      let dataName = '';
      try {
        const parsed = JSON.parse(m.text);
        dataName = parsed.n || '';
      } catch {}
      if (dataName.toLowerCase().includes('emmanuel') || dataName.toLowerCase().includes('test') || m.sender.includes('emmanuel')) {
        console.log(`   - Message de "${dataName}" (Channel: ${m.applicationId}) : "${m.text.slice(0, 60)}..."`);
      }
    });
  } catch (e: any) {
    console.error("Erreur lecture messages:", e.message);
  }
}

import { Query } from 'node-appwrite';

inspectTeacherAccountsDeep();
