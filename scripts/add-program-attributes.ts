import 'dotenv/config';
import { Client, Databases } from 'node-appwrite';

const ENDPOINT = process.env.APPWRITE_ENDPOINT || process.env.VITE_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;

const client = new Client().setEndpoint(ENDPOINT as string).setProject(PROJECT_ID as string).setKey(API_KEY as string);
const databases = new Databases(client);

const DATABASE_ID = 'idla_cms';
const COLLECTION_ID = 'programs';

async function main() {
  const missingStringAttrs = [
    { key: 'price', size: 100 },
    { key: 'procedures', size: 1000 },
  ];

  for (const attr of missingStringAttrs) {
    try {
      await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, attr.key, attr.size, false);
      console.log(`Added attribute ${attr.key}`);
    } catch (e: any) {
      if (e.code === 409) {
        console.log(`Attribute ${attr.key} already exists.`);
      } else {
        console.error(`Error adding attribute ${attr.key}:`, e.message);
      }
    }
  }
}
main();
