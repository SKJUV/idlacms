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

async function addMotivationAttribute() {
  console.log("🛠️ === AJOUT DE L'ATTRIBUT 'motivation' À LA COLLECTION 'applications' ===\n");

  try {
    await databases.createStringAttribute(
      DATABASE_ID,
      'applications',
      'motivation',
      5000,
      false, // required
      undefined, // default
      false // array
    );
    console.log("✅ Attribut 'motivation' créé avec succès ! Attente du traitement par Appwrite...");
  } catch (e: any) {
    if (e.message.includes('already exists')) {
      console.log("ℹ️ L'attribut 'motivation' existe déjà dans la collection 'applications'.");
    } else {
      console.error("❌ Erreur lors de la création de l'attribut 'motivation':", e.message);
    }
  }
}

addMotivationAttribute();
