import 'dotenv/config';
import { Client, Databases } from 'node-appwrite';

const ENDPOINT = process.env.APPWRITE_ENDPOINT || process.env.VITE_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error('Variables manquantes dans .env');
  process.exit(1);
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'idla_cms';
const APPLICATIONS_COLLECTION = process.env.VITE_APPWRITE_COLLECTION_APPLICATIONS || 'applications';

const mockIds = ['pre-1', 'pre-2', 'pre-3'];

async function main() {
  console.log(`Suppression de ${mockIds.length} candidats fictifs (ajoutés par IA)...`);

  for (const id of mockIds) {
    try {
      await databases.deleteDocument(DATABASE_ID, APPLICATIONS_COLLECTION, id);
      console.log(`- Candidat '${id}' supprimé avec succès.`);
    } catch (err: any) {
      if (err.code === 404) {
        console.log(`- Candidat '${id}' introuvable (déjà supprimé).`);
      } else {
        console.error(`- Erreur pour '${id}':`, err.message);
      }
    }
  }
  
  console.log('\nNettoyage terminé !');
}

main().catch(console.error);
