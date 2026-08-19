import { Client, Databases, Query } from 'node-appwrite';
import * as dotenv from 'dotenv';

dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT as string)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID as string)
    .setKey(process.env.APPWRITE_API_KEY as string);

const databases = new Databases(client);

const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID as string;
const CMS_USERS_COLLECTION_ID = process.env.VITE_APPWRITE_COLLECTION_CMS_USERS as string;

async function cleanStudentsFromCmsUsers() {
    console.log('Fetching students from cmsUsers collection...');
    
    try {
        let hasMore = true;
        let deletedCount = 0;
        
        while (hasMore) {
            const response = await databases.listDocuments(
                DATABASE_ID,
                CMS_USERS_COLLECTION_ID,
                [
                    Query.equal('role', 'student'),
                    Query.limit(100)
                ]
            );
            
            if (response.documents.length === 0) {
                hasMore = false;
                break;
            }
            
            for (const doc of response.documents) {
                console.log(`Deleting student: ${doc.name} (${doc.email})...`);
                await databases.deleteDocument(DATABASE_ID, CMS_USERS_COLLECTION_ID, doc.$id);
                deletedCount++;
            }
        }
        
        console.log(`Cleanup complete! Successfully deleted ${deletedCount} student records from cms_users.`);
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
}

cleanStudentsFromCmsUsers();
