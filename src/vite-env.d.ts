/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APPWRITE_PROJECT_ID: string
  readonly VITE_APPWRITE_PROJECT_NAME: string
  readonly VITE_APPWRITE_ENDPOINT: string
  readonly VITE_APPWRITE_DATABASE_ID?: string
  readonly VITE_APPWRITE_COLLECTION_PROGRAMS?: string
  readonly VITE_APPWRITE_COLLECTION_APPLICATIONS?: string
  readonly VITE_APPWRITE_COLLECTION_LOGS?: string
  readonly VITE_APPWRITE_BUCKET_DOCUMENTS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
