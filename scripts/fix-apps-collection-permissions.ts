import dns from 'dns';
const originalLookup = dns.lookup;
(dns as any).lookup = (hostname: string, options: any, callback: any) => {
  if (hostname === 'fra.cloud.appwrite.io') {
    const cb = typeof options === 'function' ? options : callback;
    return cb(null, [{ address: '151.101.67.52', family: 4 }], 4);
  }
  return originalLookup(hostname, options, callback);
};

import { Client, Databases, Permission, Role } from 'node-appwrite';
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

async function fixAppsCollectionPermissions() {
  console.log("🛠️ === MISE À JOUR DES PERMISSIONS DE LA COLLECTION 'applications' ===\n");

  try {
    const updated = await databases.updateCollection(
      DATABASE_ID,
      'applications',
      'Candidatures (applications)',
      [
        Permission.read(Role.any()),
        Permission.create(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any()),
      ],
      false // documentSecurity disabled so all admins can view all candidatures
    );
    console.log("✅ Permissions de la collection 'applications' mises à jour avec succès !");
    console.log("   Nouvelles permissions :", JSON.stringify(updated.$permissions));
    console.log("   Document Security     :", updated.documentSecurity);
  } catch (e: any) {
    console.error("❌ Erreur mise à jour collection applications:", e.message);
  }
}

fixAppsCollectionPermissions();
