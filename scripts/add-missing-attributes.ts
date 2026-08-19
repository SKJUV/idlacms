import 'dotenv/config';
import { Client, Databases } from 'node-appwrite';

const ENDPOINT = process.env.APPWRITE_ENDPOINT || process.env.VITE_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error('Missing variables');
  process.exit(1);
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

const DATABASE_ID = 'idla_cms';
const COLLECTION_ID = 'applications';

async function main() {
  const missingStringAttrs = [
    { key: 'academicSession', size: 100 },
    { key: 'entryLevel', size: 100 },
    { key: 'sponsorCode', size: 100 },
    { key: 'sponsorEmail', size: 150 },
    { key: 'motivation', size: 2000 },
  ];

  for (const attr of missingStringAttrs) {
    try {
      await databases.createStringAttribute(
        DATABASE_ID,
        COLLECTION_ID,
        attr.key,
        attr.size,
        false
      );
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
