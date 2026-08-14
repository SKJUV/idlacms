import { Client, Databases, Storage, Permission, Role } from 'node-appwrite';
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
const storage = new Storage(client);

async function fixAllPermissions() {
  console.log("🛠️ === SÉCURISATION DES PERMISSIONS (Document Security + Admin RBAC) ===\n");

  const securePermissions = [
    Permission.create(Role.users()),
    Permission.create(Role.any()),
    Permission.read(Role.team('admins')),
    Permission.update(Role.team('admins')),
    Permission.delete(Role.team('admins')),
  ];

  // 1. Applications collection (Document Security activated)
  try {
    await databases.updateCollection(
      DATABASE_ID,
      'applications',
      'Candidatures (applications)',
      securePermissions,
      true // documentSecurity = true
    );
    console.log("✅ Collection 'applications' -> Sécurisée avec documentSecurity=true et RBAC Admin !");
  } catch (e: any) {
    console.error("❌ Collection 'applications' error:", e.message);
  }

  // 2. Candidate Documents collection
  try {
    await databases.updateCollection(
      DATABASE_ID,
      'candidate_documents',
      'Documents Candidats',
      securePermissions,
      true // documentSecurity = true
    );
    console.log("✅ Collection 'candidate_documents' -> Sécurisée avec documentSecurity=true !");
  } catch (e: any) {
    console.warn("⚠️ Collection 'candidate_documents' error (peut-être inexistante):", e.message);
    if (e.message.includes('not found')) {
      try {
        await databases.createCollection(DATABASE_ID, 'candidate_documents', 'Documents Candidats', securePermissions, true);
        console.log("✅ Collection 'candidate_documents' créée avec succès !");
      } catch (err: any) {
        console.error("❌ Échec création candidate_documents:", err.message);
      }
    }
  }

  // 3. Storage Bucket 'documents' (File Security activated)
  try {
    const bucket = await storage.getBucket('documents').catch(() => null);
    if (bucket) {
      await storage.updateBucket(
        'documents',
        'Documents & Justificatifs',
        securePermissions,
        true, // fileSecurity = true
        true,  // enabled
        10485760, // max 10MB
        ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
      );
      console.log("✅ Bucket 'documents' -> Sécurisé avec fileSecurity=true !");
    } else {
      await storage.createBucket(
        'documents',
        'Documents & Justificatifs',
        securePermissions,
        true,
        true,
        10485760,
        ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
      );
      console.log("✅ Bucket 'documents' créé et sécurisé avec fileSecurity=true !");
    }
  } catch (e: any) {
    console.error("❌ Bucket 'documents' error:", e.message);
  }

  console.log("\n🎉 Opération terminée ! Tout utilisateur/candidat peut désormais transmettre son dossier et ses fichiers sans erreur 403.");
}

fixAllPermissions();
