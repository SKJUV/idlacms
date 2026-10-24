import fs from 'fs';
import path from 'path';
import { Client, Users, Databases, ID, Query } from 'node-appwrite';

function getEnvVar(key: string, defaultValue: string = ''): string {
  if (process.env[key]) {
    return process.env[key]!;
  }
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const regex = new RegExp(`^${key}=["']?([^"'\\r\\n]+)["']?`, 'm');
      const match = content.match(regex);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  } catch (e) {}
  return defaultValue;
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  const allowedOrigins = [
    'https://idlaacademy.online',
    'https://www.idlaacademy.online',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || (origin && origin.endsWith('.vercel.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, password, role = 'Admin', status = 'Actif' } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Nom complet, adresse email et mot de passe sont obligatoires.'
    });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanName = String(name).trim();
  const cleanPassword = String(password).trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({
      success: false,
      error: 'Format d\'adresse email invalide.'
    });
  }

  if (cleanPassword.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'Le mot de passe doit comporter au moins 8 caractères.'
    });
  }

  const apiKey = getEnvVar('APPWRITE_API_KEY');
  const endpoint = getEnvVar('VITE_APPWRITE_ENDPOINT', 'https://fra.cloud.appwrite.io/v1');
  const projectId = getEnvVar('VITE_APPWRITE_PROJECT_ID', '6a44f36c002ed43aca9a');
  const databaseId = getEnvVar('VITE_APPWRITE_DATABASE_ID', 'idla_cms');
  const collectionCmsUsers = getEnvVar('VITE_APPWRITE_COLLECTION_CMS_USERS', 'cms_users');

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: 'La clé API Appwrite (APPWRITE_API_KEY) n\'est pas configurée côté serveur.'
    });
  }

  try {
    const client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);

    const users = new Users(client);
    const databases = new Databases(client);

    let authUserId = '';

    // 1. Provision or update Appwrite Auth account
    try {
      const createdUser = await users.create(
        ID.unique(),
        cleanEmail,
        undefined,
        cleanPassword,
        cleanName
      );
      authUserId = createdUser.$id;
    } catch (authErr: any) {
      // User may already exist in Appwrite Auth
      if (authErr.code === 409 || (authErr.message && authErr.message.includes('already exists'))) {
        const existingUsers = await users.list([Query.equal('email', cleanEmail)]);
        if (existingUsers.users.length > 0) {
          authUserId = existingUsers.users[0].$id;
          // Update password and name for the existing user
          await users.updatePassword(authUserId, cleanPassword);
          await users.updateName(authUserId, cleanName);
        } else {
          throw authErr;
        }
      } else {
        throw authErr;
      }
    }

    // Calculate initials
    const names = cleanName.split(' ');
    const initials = names.map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'UN';

    // 2. Synchronize with cms_users database collection
    const userDocData = {
      name: cleanName,
      email: cleanEmail,
      role: role,
      status: status,
      initials: initials,
      lastLogin: new Date().toISOString(),
    };

    try {
      // Check if doc exists by email
      const existingDocs = await databases.listDocuments(
        databaseId,
        collectionCmsUsers,
        [Query.equal('email', cleanEmail)]
      );

      if (existingDocs.documents.length > 0) {
        await databases.updateDocument(
          databaseId,
          collectionCmsUsers,
          existingDocs.documents[0].$id,
          userDocData
        );
      } else {
        await databases.createDocument(
          databaseId,
          collectionCmsUsers,
          authUserId,
          userDocData
        );
      }
    } catch (dbErr: any) {
      console.error('Erreur synchronisation document cms_users:', dbErr);
      // We do not fail the request if Auth was created, but log it
    }

    return res.status(200).json({
      success: true,
      message: 'Utilisateur CMS et compte d\'accès créés avec succès.',
      userId: authUserId,
      user: {
        id: authUserId,
        name: cleanName,
        email: cleanEmail,
        role,
        status,
        initials,
      }
    });
  } catch (err: any) {
    console.error('Erreur lors de la création de l\'utilisateur CMS:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Erreur serveur lors de la création du compte utilisateur.'
    });
  }
}
