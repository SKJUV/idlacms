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
const CMS_USERS_COLLECTION = process.env.VITE_APPWRITE_COLLECTION_CMS_USERS || 'cms_users';
const TEACHERS_COLLECTION = process.env.VITE_APPWRITE_COLLECTION_TEACHERS || 'teachers';

const teacherIdsToMigrate = [
  '6a5df7bb0001d99f7604',
  '6a67aec90002c68e8dcd',
  '6a67aefe0029505c946a'
];

async function main() {
  console.log(`Migration de ${teacherIdsToMigrate.length} enseignants...`);

  for (const id of teacherIdsToMigrate) {
    try {
      console.log(`\nTraitement de l'enseignant ID: ${id}`);
      
      // 1. Récupérer l'ancien document
      const oldDoc = await databases.getDocument(DATABASE_ID, CMS_USERS_COLLECTION, id);
      console.log(`- Trouvé : ${oldDoc.name} (${oldDoc.email})`);

      // 2. Préparer les données pour la nouvelle table
      const fullName = oldDoc.name || '';
      const parts = fullName.split(' ');
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';
      
      const newTeacherData = {
        authUserId: oldDoc.authUserId || id,
        firstName: firstName,
        lastName: lastName,
        email: oldDoc.email,
        title: 'Intervenant', // Par défaut
        speciality: '',
        assignedPrograms: oldDoc.assignedPrograms || [],
        scheduleData: oldDoc.scheduleData || '[]',
        status: oldDoc.status || 'Actif'
      };

      // 3. Créer dans la nouvelle table
      try {
        await databases.createDocument(DATABASE_ID, TEACHERS_COLLECTION, id, newTeacherData);
        console.log(`- Créé avec succès dans 'teachers'`);
        
        // 4. Supprimer de l'ancienne table
        await databases.deleteDocument(DATABASE_ID, CMS_USERS_COLLECTION, id);
        console.log(`- Supprimé avec succès de 'cms_users'`);
      } catch (err: any) {
        if (err.code === 409) {
          console.log(`- L'enseignant existe déjà dans 'teachers'. Suppression de 'cms_users'...`);
          await databases.deleteDocument(DATABASE_ID, CMS_USERS_COLLECTION, id);
          console.log(`- Supprimé avec succès de 'cms_users'`);
        } else {
          throw err;
        }
      }
    } catch (err: any) {
      if (err.code === 404) {
        console.log(`- Non trouvé dans 'cms_users'. Déjà migré ?`);
      } else {
        console.error(`- Erreur pour ${id}:`, err.message);
      }
    }
  }
  console.log('\nMigration terminée !');
}

main().catch(console.error);
