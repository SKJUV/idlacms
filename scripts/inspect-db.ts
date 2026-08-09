import { Client, Databases, Users } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || '6a44f36c002ed43aca9a';
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'idla_cms';

if (!API_KEY) {
  console.error('❌ APPWRITE_API_KEY absente du fichier .env / .env.local');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);
const users = new Users(client);

async function inspectDb() {
  console.log('🔍 Inspection en direct de la base de données Appwrite...');
  console.log(`Endpoint : ${ENDPOINT}`);
  console.log(`Projet   : ${PROJECT_ID}`);
  console.log(`Database : ${DATABASE_ID}\n`);

  try {
    const dbs = await databases.get(DATABASE_ID);
    console.log(`✅ Base de données active : ${dbs.name} (ID: ${dbs.$id})\n`);
  } catch (err: any) {
    console.error(`❌ Impossible de contacter la base de données : ${err.message}`);
    process.exit(1);
  }

  const collections = [
    { id: 'programs', name: 'Programmes & Certifications' },
    { id: 'news', name: 'Actualités & Annonces' },
    { id: 'testimonials', name: 'Témoignages Alumni' },
    { id: 'cms_users', name: 'Utilisateurs CMS (Admins & Enseignants)' },
    { id: 'applications', name: 'Candidatures & Pré-inscriptions' },
    { id: 'activity_logs', name: 'Journaux d\'Activité' },
    { id: 'courses', name: 'Cours Pédagogiques' },
    { id: 'schedules', name: 'Emploi du Temps / Séances' },
    { id: 'messages', name: 'Messagerie de Cours' },
    { id: 'donations', name: 'Dons & Campagnes' },
  ];

  console.log('📊 COMPTAGE DES DOCUMENTS PAR COLLECTION :');
  console.log('--------------------------------------------------');

  for (const col of collections) {
    try {
      const res = await databases.listDocuments(DATABASE_ID, col.id);
      console.log(`- ${col.name} (${col.id}): ${res.total} document(s)`);
    } catch (e: any) {
      console.log(`- ${col.name} (${col.id}): (Collection non créée ou vide)`);
    }
  }

  console.log('\n👥 COMPTES AUTHENTIFICATION (APPWRITE USERS) :');
  console.log('--------------------------------------------------');
  try {
    const userList = await users.list();
    console.log(`Nombre total de comptes Auth : ${userList.total}`);
    userList.users.forEach((u: any) => {
      console.log(`  • [${u.$id}] ${u.name || 'Sans Nom'} (${u.email}) — Rôles/Labels: [${u.labels.join(', ') || 'aucun'}]`);
    });
  } catch (e: any) {
    console.error("Erreur lors de la lecture des comptes utilisateurs Auth:", e.message);
  }
}

inspectDb();
