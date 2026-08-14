import { Client, Databases, Storage, Users } from 'node-appwrite';
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

async function fullAudit() {
  console.log("=================================================");
  console.log("🔍 AUDIT GLOBAL APPWRITE DB & CONFIGURATION IDLA");
  console.log("=================================================");

  try {
    const collections = await databases.listCollections(DATABASE_ID);
    console.log(`\n📚 Total Collections dans la base '${DATABASE_ID}' : ${collections.total}`);
    for (const c of collections.collections) {
      console.log(`\n-------------------------------------------------`);
      console.log(`🔹 Collection: ${c.name} (ID: ${c.$id})`);
      console.log(`   Permissions:`, c.$permissions);
      console.log(`   Document Security:`, c.documentSecurity);
      console.log(`   Attributs (${c.attributes.length}):`);
      c.attributes.forEach((a: any) => {
        console.log(`     - ${a.key} | type: ${a.type} | required: ${a.required} ${a.elements ? '| enum: ' + JSON.stringify(a.elements) : ''}`);
      });
      console.log(`   Index (${c.indexes.length}):`);
      c.indexes.forEach((i: any) => {
        console.log(`     - ${i.key} | type: ${i.type} | attributes: ${i.attributes.join(', ')}`);
      });

      const docs = await databases.listDocuments(DATABASE_ID, c.$id);
      console.log(`   Nombre de documents: ${docs.total}`);
    }
  } catch (e: any) {
    console.error("Erreur lors de l'audit complet DB:", e.message);
  }
}

fullAudit();
