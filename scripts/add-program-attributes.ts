import 'dotenv/config';
import { Client, Databases } from 'node-appwrite';

const ENDPOINT = process.env.APPWRITE_ENDPOINT || process.env.VITE_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;

const client = new Client().setEndpoint(ENDPOINT as string).setProject(PROJECT_ID as string).setKey(API_KEY as string);
const databases = new Databases(client);

const DATABASE_ID = 'idla_cms';

async function main() {
  const schemaUpdates = [
    { coll: 'programs', key: 'price', size: 100 },
    { coll: 'programs', key: 'procedures', size: 1000 },
    { coll: 'applications', key: 'matricule', size: 100 },
    { coll: 'applications', key: 'referralCode', size: 100 },
  ];

  for (const attr of schemaUpdates) {
    try {
      await databases.createStringAttribute(DATABASE_ID, attr.coll, attr.key, attr.size, false);
      console.log(`Added attribute ${attr.key} to ${attr.coll}`);
    } catch (e: any) {
      if (e.code === 409) {
        console.log(`Attribute ${attr.key} already exists on ${attr.coll}.`);
      } else {
        console.error(`Error adding attribute ${attr.key} on ${attr.coll}:`, e.message);
      }
    }
  }

  // assignedCourses string array attribute on cms_users
  try {
    await databases.createStringAttribute(DATABASE_ID, 'cms_users', 'assignedCourses', 255, false, undefined, true);
    console.log(`Added array attribute assignedCourses to cms_users`);
  } catch (e: any) {
    if (e.code === 409) {
      console.log(`Attribute assignedCourses already exists on cms_users.`);
    } else {
      console.error(`Error adding array attribute assignedCourses on cms_users:`, e.message);
    }
  }
}
main();

