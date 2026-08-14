import { Client, Account, Databases, Storage, ID, Query, Permission, Role } from 'appwrite';

const projectID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;

if (!projectID || !endpoint) {
  console.warn("Appwrite environment variables are missing. Please check your .env configuration.");
}

export const client = new Client();
if (projectID && endpoint) {
  client
    .setEndpoint(endpoint)
    .setProject(projectID);
}

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export { ID, Query, Permission, Role };

export const APPWRITE_CONFIG = {
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || 'idla_cms',
  collections: {
    programs: import.meta.env.VITE_APPWRITE_COLLECTION_PROGRAMS || 'programs',
    applications: import.meta.env.VITE_APPWRITE_COLLECTION_APPLICATIONS || 'applications',
    logs: import.meta.env.VITE_APPWRITE_COLLECTION_LOGS || 'activity_logs',
    news: import.meta.env.VITE_APPWRITE_COLLECTION_NEWS || 'news',
    testimonials: import.meta.env.VITE_APPWRITE_COLLECTION_TESTIMONIALS || 'testimonials',
    cmsUsers: import.meta.env.VITE_APPWRITE_COLLECTION_CMS_USERS || 'cms_users',
    candidateDocuments: import.meta.env.VITE_APPWRITE_COLLECTION_CANDIDATE_DOCUMENTS || 'candidate_documents',
    messages: import.meta.env.VITE_APPWRITE_COLLECTION_MESSAGES || 'messages',
    customForms: import.meta.env.VITE_APPWRITE_COLLECTION_CUSTOM_FORMS || 'custom_forms',
    formResponses: import.meta.env.VITE_APPWRITE_COLLECTION_FORM_RESPONSES || 'form_responses',
    teachers: import.meta.env.VITE_APPWRITE_COLLECTION_TEACHERS || 'teachers',
  },
  buckets: {
    documents: import.meta.env.VITE_APPWRITE_BUCKET_DOCUMENTS || 'documents',
  }
};

// Check if Appwrite is fully configured for DB and Storage
export const isAppwriteDbConfigured = () => {
  return !!(
    projectID && 
    endpoint && 
    APPWRITE_CONFIG.databaseId && 
    APPWRITE_CONFIG.collections.programs &&
    APPWRITE_CONFIG.collections.applications
  );
};

export const isAppwriteStorageConfigured = () => {
  return !!(projectID && endpoint && APPWRITE_CONFIG.buckets.documents);
};
