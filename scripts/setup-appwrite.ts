/**
 * Provisionne l'intégralité du backend Appwrite d'IDLA CMS :
 * base de données, collections, attributs, index, équipe "admins",
 * bucket de stockage, et jeu de données de démonstration.
 *
 * Usage : npm run appwrite:setup
 * Requiert dans .env : APPWRITE_ENDPOINT (ou VITE_APPWRITE_ENDPOINT),
 * APPWRITE_PROJECT_ID (ou VITE_APPWRITE_PROJECT_ID), APPWRITE_API_KEY.
 * L'API key doit avoir les scopes (lecture ET écriture — le script liste
 * les ressources existantes pour rester idempotent) :
 * databases.read, databases.write, collections.read, collections.write,
 * attributes.read, attributes.write, indexes.read, indexes.write,
 * documents.read, documents.write, files.read, files.write,
 * buckets.read, buckets.write, teams.read, teams.write,
 * users.read, users.write.
 *
 * Le script est idempotent : le relancer après un premier passage
 * n'écrase rien (les ressources existantes sont simplement ignorées).
 */
import 'dotenv/config';
import { Client, Databases, Storage, Teams, Users, ID, Permission, Role, Query, DatabasesIndexType } from 'node-appwrite';
import {
  programsData,
  newsData,
  testimonialsData,
  initialUsers,
  preRegistrationsData,
  activityLogsData,
} from '../src/data/mockData';

const ENDPOINT = process.env.APPWRITE_ENDPOINT || process.env.VITE_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error(
    'Variables manquantes. Définissez APPWRITE_ENDPOINT (ou VITE_APPWRITE_ENDPOINT), ' +
    'APPWRITE_PROJECT_ID (ou VITE_APPWRITE_PROJECT_ID) et APPWRITE_API_KEY dans .env (voir .env.example).'
  );
  process.exit(1);
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);
const storage = new Storage(client);
const teams = new Teams(client);
const users = new Users(client);

export const DATABASE_ID = 'idla_cms';
const DATABASE_NAME = 'IDLA CMS Database';
const ADMIN_TEAM_ID = 'admins';
const ADMIN_TEAM_NAME = 'IDLA CMS Admins';
const DOCUMENTS_BUCKET_ID = 'documents';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function step<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    const result = await fn();
    console.log(`OK   ${label}`);
    return result;
  } catch (err: any) {
    if (err?.code === 409) {
      console.log(`SKIP ${label} (déjà existant)`);
      return null;
    }
    console.error(`FAIL ${label} — ${err?.message ?? err}`);
    return null;
  }
}

type AttrDef =
  | { kind: 'string'; key: string; size: number; required: boolean; default?: string; array?: boolean }
  | { kind: 'email'; key: string; required: boolean; default?: string }
  | { kind: 'url'; key: string; required: boolean; default?: string }
  | { kind: 'boolean'; key: string; required: boolean; default?: boolean }
  | { kind: 'integer'; key: string; required: boolean; min?: number; max?: number; default?: number }
  | { kind: 'datetime'; key: string; required: boolean; default?: string }
  | { kind: 'enum'; key: string; elements: string[]; required: boolean; default?: string };

type IndexDef = { key: string; type: 'key' | 'unique' | 'fulltext'; attributes: string[] };

interface CollectionDef {
  id: string;
  name: string;
  permissions: string[];
  documentSecurity?: boolean;
  attributes: AttrDef[];
  indexes: IndexDef[];
}

// Un attribut "required" ne peut pas avoir de valeur par défaut côté Appwrite :
// dès qu'un default est fourni, l'attribut est créé comme optionnel (le default
// s'applique automatiquement si le champ est omis à l'écriture).
const collectionDefs: CollectionDef[] = [
  {
    id: 'programs',
    name: 'Programmes',
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.any()),
      Permission.update(Role.any()),
      Permission.delete(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
      Permission.create(Role.team(ADMIN_TEAM_ID)),
      Permission.update(Role.team(ADMIN_TEAM_ID)),
      Permission.delete(Role.team(ADMIN_TEAM_ID)),
    ],
    attributes: [
      { kind: 'string', key: 'title', size: 255, required: true },
      { kind: 'string', key: 'description', size: 2000, required: true },
      { kind: 'enum', key: 'type', elements: ['Master', 'Doctorat', 'Certification', 'Bachelor'], required: true },
      { kind: 'string', key: 'category', size: 150, required: true },
      { kind: 'string', key: 'duration', size: 100, required: true },
      { kind: 'string', key: 'image', size: 1000, required: true },
      { kind: 'boolean', key: 'isNew', required: false, default: false },
    ],
    indexes: [
      { key: 'idx_category', type: 'key', attributes: ['category'] },
      { key: 'idx_type', type: 'key', attributes: ['type'] },
      { key: 'idx_title_search', type: 'fulltext', attributes: ['title'] },
    ],
  },
  {
    id: 'news',
    name: 'Actualités',
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.team(ADMIN_TEAM_ID)),
      Permission.update(Role.team(ADMIN_TEAM_ID)),
      Permission.delete(Role.team(ADMIN_TEAM_ID)),
    ],
    attributes: [
      { kind: 'string', key: 'title', size: 255, required: true },
      { kind: 'string', key: 'description', size: 3000, required: true },
      { kind: 'datetime', key: 'date', required: true },
      { kind: 'enum', key: 'category', elements: ['Événements', 'Académique', 'Partenariats', 'Annonces', 'Alumni'], required: true },
      { kind: 'url', key: 'image', required: true },
      { kind: 'boolean', key: 'isFeatured', required: false, default: false },
    ],
    indexes: [
      { key: 'idx_category', type: 'key', attributes: ['category'] },
      { key: 'idx_date', type: 'key', attributes: ['date'] },
      { key: 'idx_title_search', type: 'fulltext', attributes: ['title'] },
    ],
  },
  {
    id: 'testimonials',
    name: 'Témoignages',
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.team(ADMIN_TEAM_ID)),
      Permission.update(Role.team(ADMIN_TEAM_ID)),
      Permission.delete(Role.team(ADMIN_TEAM_ID)),
    ],
    attributes: [
      { kind: 'string', key: 'name', size: 150, required: true },
      { kind: 'string', key: 'role', size: 150, required: true },
      { kind: 'string', key: 'text', size: 2000, required: true },
      { kind: 'url', key: 'image', required: true },
      { kind: 'string', key: 'promo', size: 50, required: true },
      { kind: 'enum', key: 'category', elements: ['Master', 'Executive', 'Alumni'], required: true },
      { kind: 'boolean', key: 'isFeatured', required: false, default: false },
    ],
    indexes: [
      { key: 'idx_category', type: 'key', attributes: ['category'] },
      { key: 'idx_name_search', type: 'fulltext', attributes: ['name'] },
    ],
  },
  {
    id: 'applications',
    name: 'Candidatures',
    documentSecurity: true,
    permissions: [
      Permission.create(Role.any()),
      Permission.read(Role.team(ADMIN_TEAM_ID)),
      Permission.update(Role.team(ADMIN_TEAM_ID)),
      Permission.delete(Role.team(ADMIN_TEAM_ID)),
    ],
    attributes: [
      { kind: 'string', key: 'firstName', size: 100, required: true },
      { kind: 'string', key: 'lastName', size: 100, required: true },
      { kind: 'string', key: 'name', size: 200, required: true },
      { kind: 'email', key: 'email', required: true },
      { kind: 'string', key: 'phone', size: 30, required: false },
      { kind: 'string', key: 'nationality', size: 100, required: false },
      { kind: 'string', key: 'program', size: 255, required: true },
      { kind: 'string', key: 'highestDegree', size: 255, required: false },
      { kind: 'integer', key: 'graduationYear', required: false, min: 1950, max: 2100 },
      { kind: 'enum', key: 'status', elements: ['New', 'In Review', 'Accepted', 'Rejected'], required: false, default: 'New' },
      { kind: 'datetime', key: 'dateApplied', required: true },
      { kind: 'boolean', key: 'declarationChecked', required: false, default: false },
      { kind: 'string', key: 'files', size: 5000, required: false, default: '[]' },
      { kind: 'string', key: 'initials', size: 5, required: false },
    ],
    indexes: [
      { key: 'idx_email', type: 'key', attributes: ['email'] },
      { key: 'idx_status', type: 'key', attributes: ['status'] },
      { key: 'idx_program', type: 'key', attributes: ['program'] },
      { key: 'idx_name_search', type: 'fulltext', attributes: ['name'] },
    ],
  },
  {
    id: 'cms_users',
    name: 'Utilisateurs CMS',
    permissions: [
      Permission.read(Role.team(ADMIN_TEAM_ID)),
      Permission.create(Role.team(ADMIN_TEAM_ID)),
      Permission.update(Role.team(ADMIN_TEAM_ID)),
      Permission.delete(Role.team(ADMIN_TEAM_ID)),
    ],
    attributes: [
      { kind: 'string', key: 'authUserId', size: 36, required: false },
      { kind: 'string', key: 'name', size: 150, required: true },
      { kind: 'email', key: 'email', required: true },
      { kind: 'string', key: 'role', size: 255, required: false, default: 'Admin' },
      { kind: 'enum', key: 'status', elements: ['Actif', 'Inactif', 'Bloqué'], required: false, default: 'Actif' },
      { kind: 'url', key: 'avatar', required: false },
      { kind: 'datetime', key: 'lastLogin', required: false },
      { kind: 'string', key: 'initials', size: 5, required: false },
      { kind: 'string', key: 'assignedPrograms', size: 255, required: false, array: true },
      { kind: 'string', key: 'scheduleData', size: 65000, required: false },
    ],
    indexes: [
      { key: 'idx_email_unique', type: 'unique', attributes: ['email'] },
      { key: 'idx_role', type: 'key', attributes: ['role'] },
      { key: 'idx_status', type: 'key', attributes: ['status'] },
    ],
  },
  {
    id: 'activity_logs',
    name: "Journal d'activité",
    permissions: [
      Permission.read(Role.team(ADMIN_TEAM_ID)),
      Permission.create(Role.team(ADMIN_TEAM_ID)),
    ],
    attributes: [
      { kind: 'enum', key: 'type', elements: ['registration', 'article', 'error', 'alumni'], required: true },
      { kind: 'string', key: 'user', size: 150, required: true },
      { kind: 'string', key: 'text', size: 1000, required: true },
      { kind: 'datetime', key: 'time', required: true },
    ],
    indexes: [
      { key: 'idx_type', type: 'key', attributes: ['type'] },
      { key: 'idx_time', type: 'key', attributes: ['time'] },
    ],
  },
  {
    id: 'candidate_documents',
    name: 'Documents des candidats',
    documentSecurity: true,
    permissions: [
      Permission.create(Role.any()),
      Permission.read(Role.team(ADMIN_TEAM_ID)),
      Permission.update(Role.team(ADMIN_TEAM_ID)),
      Permission.delete(Role.team(ADMIN_TEAM_ID)),
    ],
    attributes: [
      { kind: 'string', key: 'applicationId', size: 36, required: true },
      { kind: 'string', key: 'fileId', size: 36, required: true },
      { kind: 'string', key: 'name', size: 255, required: true },
      { kind: 'integer', key: 'sizeBytes', required: false, min: 0 },
      { kind: 'string', key: 'mimeType', size: 100, required: false },
      { kind: 'enum', key: 'uploadedBy', elements: ['candidate', 'admin'], required: false, default: 'candidate' },
      { kind: 'datetime', key: 'uploadedAt', required: true },
    ],
    indexes: [{ key: 'idx_application', type: 'key', attributes: ['applicationId'] }],
  },
  {
    id: 'messages',
    name: 'Messagerie Conseiller/Candidat',
    documentSecurity: true,
    permissions: [Permission.read(Role.users()), Permission.create(Role.users())],
    attributes: [
      { kind: 'string', key: 'applicationId', size: 36, required: true },
      { kind: 'enum', key: 'sender', elements: ['candidate', 'advisor'], required: true },
      { kind: 'string', key: 'text', size: 2000, required: true },
      { kind: 'datetime', key: 'createdAt', required: true },
    ],
    indexes: [
      { key: 'idx_application', type: 'key', attributes: ['applicationId'] },
      { key: 'idx_created', type: 'key', attributes: ['createdAt'] },
    ],
  },
];

async function createAttribute(collectionId: string, attr: AttrDef) {
  await step<any>(`attribut ${collectionId}.${attr.key}`, () => {
    switch (attr.kind) {
      case 'string':
        return databases.createStringAttribute({
          databaseId: DATABASE_ID, collectionId, key: attr.key, size: attr.size,
          required: attr.required, xdefault: attr.default,
          array: attr.array,
        });
      case 'email':
        return databases.createEmailAttribute({
          databaseId: DATABASE_ID, collectionId, key: attr.key, required: attr.required, xdefault: attr.default,
        });
      case 'url':
        return databases.createUrlAttribute({
          databaseId: DATABASE_ID, collectionId, key: attr.key, required: attr.required, xdefault: attr.default,
        });
      case 'boolean':
        return databases.createBooleanAttribute({
          databaseId: DATABASE_ID, collectionId, key: attr.key, required: attr.required, xdefault: attr.default,
        });
      case 'integer':
        return databases.createIntegerAttribute({
          databaseId: DATABASE_ID, collectionId, key: attr.key, required: attr.required,
          min: attr.min, max: attr.max, xdefault: attr.default,
        });
      case 'datetime':
        return databases.createDatetimeAttribute({
          databaseId: DATABASE_ID, collectionId, key: attr.key, required: attr.required, xdefault: attr.default,
        });
      case 'enum':
        return databases.createEnumAttribute({
          databaseId: DATABASE_ID, collectionId, key: attr.key, elements: attr.elements,
          required: attr.required, xdefault: attr.default,
        });
    }
  });
}

async function waitUntilAttributesReady(collectionId: string) {
  for (let i = 0; i < 40; i++) {
    const res: any = await databases.listAttributes({ databaseId: DATABASE_ID, collectionId });
    const pending = res.attributes.filter((a: any) => a.status === 'processing');
    if (pending.length === 0) return;
    await sleep(1500);
  }
  console.warn(`WARN Timeout en attendant les attributs de ${collectionId}, tentative de création des index quand même.`);
}

const INDEX_TYPE_MAP: Record<IndexDef['type'], DatabasesIndexType> = {
  key: DatabasesIndexType.Key,
  unique: DatabasesIndexType.Unique,
  fulltext: DatabasesIndexType.Fulltext,
};

async function createIndex(collectionId: string, idx: IndexDef) {
  await step(`index ${collectionId}.${idx.key}`, () =>
    databases.createIndex({
      databaseId: DATABASE_ID, collectionId, key: idx.key, type: INDEX_TYPE_MAP[idx.type], attributes: idx.attributes,
    })
  );
}

async function setupCollection(def: CollectionDef) {
  await step(`collection ${def.id}`, () =>
    databases.createCollection({
      databaseId: DATABASE_ID, collectionId: def.id, name: def.name,
      permissions: def.permissions, documentSecurity: def.documentSecurity ?? false,
    })
  );
  for (const attr of def.attributes) {
    await createAttribute(def.id, attr);
  }
  await waitUntilAttributesReady(def.id);
  for (const idx of def.indexes) {
    await createIndex(def.id, idx);
  }
}

async function seedIfEmpty(collectionId: string, docs: Array<{ id?: string; data: Record<string, any> }>) {
  const existing: any = await databases.listDocuments({ databaseId: DATABASE_ID, collectionId, queries: [Query.limit(1)] });
  if (existing.total > 0) {
    console.log(`SKIP seed ${collectionId} (déjà peuplée)`);
    return;
  }
  for (const doc of docs) {
    await step(`seed ${collectionId} → ${doc.id ?? '(auto)'}`, () =>
      databases.createDocument({ databaseId: DATABASE_ID, collectionId, documentId: doc.id ?? ID.unique(), data: doc.data })
    );
  }
}

const FR_MONTHS: Record<string, number> = {
  jan: 0, fév: 1, fev: 1, mar: 2, avr: 3, mai: 4, jun: 5, juin: 5,
  jul: 6, juil: 6, aoû: 7, aou: 7, sep: 8, oct: 9, nov: 10, déc: 11, dec: 11,
};

function parseFrenchDate(input: string): string {
  const [day, monthAbbr, year] = input.split(' ');
  const monthKey = monthAbbr.toLowerCase().slice(0, 3);
  const month = FR_MONTHS[monthKey] ?? 0;
  return new Date(Number(year), month, Number(day)).toISOString();
}

async function main() {
  console.log(`Provisioning Appwrite — endpoint ${ENDPOINT}, projet ${PROJECT_ID}\n`);

  await step(`équipe "${ADMIN_TEAM_ID}"`, () => teams.create({ teamId: ADMIN_TEAM_ID, name: ADMIN_TEAM_NAME }));
  await step(`base de données "${DATABASE_NAME}" (${DATABASE_ID})`, () => databases.create({ databaseId: DATABASE_ID, name: DATABASE_NAME }));

  for (const def of collectionDefs) {
    await setupCollection(def);
  }

  await step(`bucket "${DOCUMENTS_BUCKET_ID}"`, () =>
    storage.createBucket({
      bucketId: DOCUMENTS_BUCKET_ID,
      name: 'Documents Candidats',
      permissions: [
        Permission.create(Role.any()),
        Permission.read(Role.team(ADMIN_TEAM_ID)),
        Permission.update(Role.team(ADMIN_TEAM_ID)),
        Permission.delete(Role.team(ADMIN_TEAM_ID)),
      ],
      fileSecurity: false,
      maximumFileSize: 5 * 1024 * 1024,
      allowedFileExtensions: ['pdf', 'doc', 'docx'],
    })
  );

  console.log('\nPopulation des données de référence...');

  await seedIfEmpty('programs', programsData.map((p) => ({
    id: p.id,
    data: { title: p.title, description: p.description, type: p.type, category: p.category, duration: p.duration, image: p.image, isNew: !!p.isNew },
  })));

  await seedIfEmpty('news', newsData.map((n) => ({
    id: n.id,
    data: { title: n.title, description: n.description, date: parseFrenchDate(n.date), category: n.category, image: n.image, isFeatured: !!n.isFeatured },
  })));

  await seedIfEmpty('testimonials', testimonialsData.map((t) => ({
    id: t.id,
    data: { name: t.name, role: t.role, text: t.text, image: t.image, promo: t.promo, category: t.category, isFeatured: !!t.isFeatured },
  })));

  await seedIfEmpty('cms_users', initialUsers.map((u) => ({
    id: u.id,
    data: { name: u.name, email: u.email, role: u.role, status: u.status, avatar: u.avatar, initials: u.initials, lastLogin: new Date().toISOString() },
  })));

  await seedIfEmpty('applications', preRegistrationsData.map((p) => {
    const [firstName, ...rest] = p.name.split(' ');
    return {
      id: p.id,
      data: {
        firstName,
        lastName: rest.join(' ') || '—',
        name: p.name,
        email: p.email,
        program: p.program,
        status: p.status,
        dateApplied: new Date().toISOString(),
        declarationChecked: true,
        files: '[]',
        initials: p.initials,
      },
    };
  }));

  await seedIfEmpty('activity_logs', activityLogsData.map((a) => ({
    id: a.id,
    data: { type: a.type, user: a.user, text: a.text, time: new Date().toISOString() },
  })));

  console.log('\nCréation des comptes de démonstration (repris des identifiants codés en dur dans le front)...');

  const demoAdminEmail = process.env.ADMIN_EMAIL || 'admin@idla.edu';
  const demoAdminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const demoAdmin = await step('compte Auth admin de démo (admin@idla.edu)', () =>
    users.create({ userId: ID.unique(), email: demoAdminEmail, password: demoAdminPassword, name: 'Jean-Sebastien Dupont' })
  );
  if (demoAdmin) {
    await step("ajout de l'admin de démo à l'équipe admins", () =>
      teams.createMembership({ teamId: ADMIN_TEAM_ID, roles: ['admin'], userId: demoAdmin.$id, url: 'https://appwrite.io' })
    );
  } else {
    console.log("      -> si le compte existait déjà, ajoutez-le manuellement à l'équipe 'admins' depuis la Console Appwrite.");
  }

  const demoCandidateEmail = process.env.CANDIDATE_EMAIL || 'jean.dupont@email.com';
  const demoCandidatePassword = process.env.CANDIDATE_PASSWORD || 'password123';
  await step('compte Auth candidat de démo (jean.dupont@email.com)', () =>
    users.create({ userId: ID.unique(), email: demoCandidateEmail, password: demoCandidatePassword, name: 'Jean Dupont' })
  );

  console.log('\nProvisioning terminé. Renseignez ces valeurs dans votre .env :\n');
  console.log(`VITE_APPWRITE_DATABASE_ID="${DATABASE_ID}"`);
  console.log(`VITE_APPWRITE_COLLECTION_PROGRAMS="programs"`);
  console.log(`VITE_APPWRITE_COLLECTION_APPLICATIONS="applications"`);
  console.log(`VITE_APPWRITE_COLLECTION_LOGS="activity_logs"`);
  console.log(`VITE_APPWRITE_COLLECTION_NEWS="news"`);
  console.log(`VITE_APPWRITE_COLLECTION_TESTIMONIALS="testimonials"`);
  console.log(`VITE_APPWRITE_COLLECTION_CMS_USERS="cms_users"`);
  console.log(`VITE_APPWRITE_COLLECTION_CANDIDATE_DOCUMENTS="candidate_documents"`);
  console.log(`VITE_APPWRITE_COLLECTION_MESSAGES="messages"`);
  console.log(`VITE_APPWRITE_BUCKET_DOCUMENTS="${DOCUMENTS_BUCKET_ID}"`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
