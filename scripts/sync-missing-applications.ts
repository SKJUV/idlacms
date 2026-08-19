import 'dotenv/config';
import { Client, Databases, Users, Query, ID, Permission, Role } from 'node-appwrite';

const ENDPOINT = process.env.APPWRITE_ENDPOINT || process.env.VITE_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error('Missing Appwrite environment variables');
  process.exit(1);
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);
const users = new Users(client);

const DATABASE_ID = 'idla_cms';
const COLLECTION_APPLICATIONS = 'applications';

async function main() {
  try {
    // 1. Get recent users from Auth
    const usersList = await users.list([Query.limit(10), Query.orderDesc('$createdAt')]);
    
    // 2. For each user, check if they exist in applications
    for (const user of usersList.users) {
      if (user.email === 'admin@idla.edu' || user.email === 'jean.dupont@email.com') {
        continue;
      }
      
      const res = await databases.listDocuments(
        DATABASE_ID, 
        COLLECTION_APPLICATIONS, 
        [Query.equal('email', user.email)]
      );
      
      if (res.documents.length === 0) {
        console.log(`User ${user.email} (${user.name}) is missing from applications! Adding them...`);
        
        let firstName = user.name;
        let lastName = '';
        if (user.name) {
          const parts = user.name.split(' ');
          firstName = parts[0];
          lastName = parts.slice(1).join(' ');
        }
        
        const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase().substring(0, 2);
        
        await databases.createDocument(
          DATABASE_ID,
          COLLECTION_APPLICATIONS,
          ID.unique(),
          {
            firstName: firstName || 'Inconnu',
            lastName: lastName || '-',
            name: user.name || 'Candidat Inconnu',
            email: user.email,
            program: 'Inscription seule',
            status: 'New',
            dateApplied: user.$createdAt,
            declarationChecked: true,
            initials: initials || 'ID',
            motivation: 'Candidature récupérée automatiquement (erreur système précédente).',
            files: '[]',
          },
          [
            Permission.read(Role.any()),
            Permission.update(Role.team('admins')),
            Permission.delete(Role.team('admins'))
          ]
        );
        console.log(`Successfully added application for ${user.email}`);
      } else {
        console.log(`User ${user.email} is already in applications.`);
      }
    }
    
    console.log('Synchronization complete.');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
