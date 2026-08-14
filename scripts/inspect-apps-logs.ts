import { Client, Databases } from 'node-appwrite';
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

async function inspectAppsAndLogs() {
  console.log("🔍 === INSPECTION APPLICATIONS & ACTIVITY LOGS ===\n");

  try {
    const apps = await databases.listDocuments(DATABASE_ID, 'applications');
    console.log(`📄 Applications (${apps.total}) :`);
    apps.documents.forEach((d: any) => console.log(`   - [${d.$id}] ${d.name} (${d.email}) — Program: ${d.program} | Status: ${d.status}`));
  } catch (e: any) {
    console.error("Erreur applications:", e.message);
  }

  try {
    const logs = await databases.listDocuments(DATABASE_ID, 'activity_logs');
    console.log(`\n📝 Activity Logs (${logs.total}) :`);
    logs.documents.forEach((d: any) => console.log(`   - [${d.$id}] User: "${d.user}" — Action: "${d.text}"`));
  } catch (e: any) {
    console.error("Erreur activity_logs:", e.message);
  }
}

inspectAppsAndLogs();
