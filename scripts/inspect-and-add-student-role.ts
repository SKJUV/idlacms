import dns from 'dns';
const originalLookup = dns.lookup;
(dns as any).lookup = (hostname: string, options: any, callback: any) => {
  if (hostname === 'fra.cloud.appwrite.io') {
    const cb = typeof options === 'function' ? options : callback;
    return cb(null, [{ address: '151.101.67.52', family: 4 }], 4);
  }
  return originalLookup(hostname, options, callback);
};

import { Client, Databases } from 'node-appwrite';
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

async function inspectAndAddStudentRole() {
  console.log("🛠️ === MISE À JOUR DE L'ENUM ROLE POUR INCLURE 'student' DANS CMS_USERS ===");

  try {
    const roleAttr: any = await databases.getAttribute(DATABASE_ID, 'cms_users', 'role');
    console.log("Enum actuel pour 'role':", roleAttr.elements);

    if (!roleAttr.elements.includes('student')) {
      const newElements = [...roleAttr.elements, 'student'];
      await databases.updateEnumAttribute(
        DATABASE_ID,
        'cms_users',
        'role',
        newElements,
        roleAttr.required,
        roleAttr.default
      );
      console.log("✅ Enum 'role' mis à jour avec succès avec 'student':", newElements);
    } else {
      console.log("ℹ️ L'élément 'student' existe déjà dans l'enum 'role'.");
    }
  } catch (e: any) {
    console.error("Erreur lors de la mise à jour de l'enum 'role':", e.message);
  }
}

inspectAndAddStudentRole();
