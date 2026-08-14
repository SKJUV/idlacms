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

async function inspectAllUserDetails() {
  console.log("🔍 === INSPECTION DÉTAILLÉE DE TOUS LES UTILISATEURS DE LA BD ===\n");

  const authUsers = await users.list();
  console.log(`📋 Total utilisateurs enregistrés dans Appwrite Auth: ${authUsers.total}\n`);

  for (const u of authUsers.users) {
    console.log(`👤 Nom       : ${u.name}`);
    console.log(`   Email     : ${u.email}`);
    console.log(`   ID        : ${u.$id}`);
    console.log(`   Labels    : [${u.labels.join(', ') || 'aucun'}]`);
    console.log(`   Créé le   : ${u.$createdAt}`);
    console.log(`   Prefs     : ${JSON.stringify(u.prefs)}`);
    console.log(`--------------------------------------------------`);
  }
}

inspectAllUserDetails();
