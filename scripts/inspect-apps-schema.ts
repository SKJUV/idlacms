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

async function inspectAppsSchema() {
  console.log("🔍 === INSPECTION DE LA COLLECTION 'applications' (COLLECTION & ATTRIBUTS) ===\n");

  try {
    const coll = await databases.getCollection(DATABASE_ID, 'applications');
    console.log(`📌 Nom de la collection : ${coll.name} (${coll.$id})`);
    console.log(`   Permissions          : ${JSON.stringify(coll.$permissions)}`);
    console.log(`   Document Security    : ${coll.documentSecurity}`);
    console.log(`   Nombre d'attributs   : ${coll.attributes.length}\n`);

    console.log("📋 Attributs de la collection 'applications' :");
    coll.attributes.forEach((attr: any) => {
      console.log(`   • Key: "${attr.key}" | Type: ${attr.type} | Required: ${attr.required} | Default: ${attr.default}`);
    });
  } catch (e: any) {
    console.error("Erreur inspection collection applications:", e.message);
  }
}

inspectAppsSchema();
