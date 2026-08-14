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

async function inspectTeachersDeep() {
  console.log("🔍 === INSPECTION APPROFONDIE (LECTURE SEULE) ===\n");

  console.log("1. 👥 COMPTES APPWRITE AUTH (utilisateurs inscrits) :");
  try {
    const authList = await users.list();
    authList.users.forEach((u: any, idx: number) => {
      console.log(`   ${idx + 1}. [${u.$id}] ${u.name || 'Sans Nom'} <${u.email}> — Labels/Rôles: [${u.labels.join(', ') || 'aucun'}] | Statut: ${u.status ? 'Actif' : 'Inactif'}`);
    });
  } catch (e: any) {
    console.error("   Erreur lecture Auth Users:", e.message);
  }

  console.log("\n2. 📄 DOCUMENTS DE LA COLLECTION 'cms_users' :");
  try {
    const cmsUsersRes = await databases.listDocuments(DATABASE_ID, 'cms_users');
    console.log(`   Total documents dans cms_users: ${cmsUsersRes.total}`);
    cmsUsersRes.documents.forEach((doc: any, idx: number) => {
      console.log(`   ${idx + 1}. [ID: ${doc.$id}] ${doc.name} <${doc.email}> — Role: "${doc.role}" | AssignedProg: ${JSON.stringify(doc.assignedPrograms || doc.programs || [])}`);
    });
  } catch (e: any) {
    console.error("   Erreur lecture cms_users:", e.message);
  }

  console.log("\n3. 💬 MESSAGES DE COURS ('messages') — Émetteurs uniques :");
  try {
    const msgRes = await databases.listDocuments(DATABASE_ID, 'messages');
    console.log(`   Total messages: ${msgRes.total}`);
    const senders = new Set<string>();
    msgRes.documents.forEach((m: any) => {
      if (m.sender) senders.add(m.sender);
    });
    console.log(`   Émetteurs de messages trouvés dans la BD:`, Array.from(senders));
  } catch (e: any) {
    console.error("   Erreur lecture messages:", e.message);
  }
}

inspectTeachersDeep();
