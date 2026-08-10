import 'dotenv/config';
import { Client, Databases, Users } from 'node-appwrite';

const ENDPOINT = process.env.APPWRITE_ENDPOINT || process.env.VITE_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error('Variables manquantes dans .env');
  process.exit(1);
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);
const users = new Users(client);

const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'idla_cms';
const TEACHERS_COLLECTION = process.env.VITE_APPWRITE_COLLECTION_TEACHERS || 'teachers';

const teacherIds = [
  '6a5df7bb0001d99f7604',
  '6a67aec90002c68e8dcd',
  '6a67aefe0029505c946a'
];

async function main() {
  console.log(`Insertion de ${teacherIds.length} enseignants dans la table teachers...`);

  for (const id of teacherIds) {
    try {
      console.log(`\nTraitement de l'enseignant ID: ${id}`);
      
      // Récupérer les infos Auth
      const authUser = await users.get(id);
      console.log(`- Utilisateur Auth trouvé: ${authUser.name} (${authUser.email})`);

      const fullName = authUser.name || '';
      const parts = fullName.split(' ');
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';
      
      const newTeacherData = {
        authUserId: id,
        firstName: firstName,
        lastName: lastName,
        email: authUser.email,
        title: 'Intervenant',
        speciality: '',
        assignedPrograms: [],
        scheduleData: '[]',
        status: 'Actif'
      };

      try {
        await databases.createDocument(DATABASE_ID, TEACHERS_COLLECTION, id, newTeacherData);
        console.log(`- Créé avec succès dans 'teachers' !`);
      } catch (err: any) {
        if (err.code === 409) {
          console.log(`- L'enseignant existe DÉJÀ dans 'teachers'.`);
        } else {
          throw err;
        }
      }
    } catch (err: any) {
      console.error(`- Erreur pour ${id}:`, err.message);
    }
  }
  console.log('\nInsertion terminée !');
}

main().catch(console.error);
