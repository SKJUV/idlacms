import dns from 'dns';
const originalLookup = dns.lookup;
(dns as any).lookup = (hostname: string, options: any, callback: any) => {
  if (hostname === 'fra.cloud.appwrite.io') {
    const cb = typeof options === 'function' ? options : callback;
    return cb(null, [{ address: '151.101.67.52', family: 4 }], 4);
  }
  return originalLookup(hostname, options, callback);
};

import { Client, Databases, Users, Permission, Role, Query } from 'node-appwrite';
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

async function fixPermissionsAndSyncTeachers() {
  console.log("🛠️ === MISE À JOUR DES PERMISSIONS DE CMS_USERS & SYNCHRONISATION DES ENSEIGNANTS ===");

  // 1. Update collection permissions
  try {
    const updatedCol = await databases.updateCollection(
      DATABASE_ID,
      'cms_users',
      'cms_users',
      [
        Permission.read(Role.any()),
        Permission.create(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any())
      ],
      false
    );
    console.log("✅ Permissions 'cms_users' mises à jour avec succès :", updatedCol.$permissions);
  } catch (e: any) {
    console.error("Erreur mise à jour permissions cms_users:", e.message);
  }

  // 2. Fetch all Auth users
  const authUsersList = await users.list();
  console.log(`\n📋 Traitement de ${authUsersList.total} comptes d'authentification...`);

  const defaultPrograms = [
    'Bachelor of Science in Computer Science (BSc CS)',
    'Bachelor of Business Administration (BBA)',
    'Master in Software Engineering (MSE)'
  ];

  for (const u of authUsersList.users) {
    const email = u.email.toLowerCase().trim();
    const isAdmin = email.includes('admin') || email.includes('idlaadmin');
    const role = isAdmin ? 'Super Admin' : 'teacher';

    try {
      const existing = await databases.listDocuments(DATABASE_ID, 'cms_users', [Query.equal('email', email)]);
      if (existing.documents.length > 0) {
        const doc = existing.documents[0];
        let assigned = doc.assignedPrograms;
        if (!Array.isArray(assigned) || assigned.length === 0) {
          assigned = defaultPrograms;
        }

        await databases.updateDocument(DATABASE_ID, 'cms_users', doc.$id, {
          authUserId: u.$id,
          name: u.name || email.split('@')[0],
          role: role,
          status: 'Actif',
          assignedPrograms: assigned,
          scheduleData: doc.scheduleData || '[]'
        });
        console.log(`✅ Mis à jour dans cms_users: ${u.name} (${email}) | Rôle: ${role}`);
      } else {
        await databases.createDocument(DATABASE_ID, 'cms_users', u.$id, {
          authUserId: u.$id,
          name: u.name || email.split('@')[0],
          email: email,
          role: role,
          status: 'Actif',
          initials: (u.name || 'U S').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2),
          assignedPrograms: defaultPrograms,
          scheduleData: '[]'
        });
        console.log(`✅ Créé dans cms_users: ${u.name} (${email}) | Rôle: ${role}`);
      }
    } catch (e: any) {
      console.error(`Erreur sync pour ${email}:`, e.message);
    }
  }

  console.log("\n📋 Liste finale mise à jour de la collection 'cms_users' :");
  const finalDocs = await databases.listDocuments(DATABASE_ID, 'cms_users');
  finalDocs.documents.forEach((d: any, idx: number) => {
    console.log(`  ${idx + 1}. [ID: ${d.$id}] ${d.name} (${d.email}) | Role: ${d.role} | Programs: ${JSON.stringify(d.assignedPrograms)}`);
  });
}

fixPermissionsAndSyncTeachers();
