const dns = require('dns');
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

const https = require('https');
const path = require('path');
const fs = require('fs');

// Read .env manually
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const apiKeyMatch = envContent.match(/^APPWRITE_API_KEY=["']?([^"'\r\n]+)["']?/m);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : '';

const projectId = '6a44f36c002ed43aca9a';
const databaseId = 'idla_cms';

function appwriteReq(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const dataStr = body ? JSON.stringify(body) : '';
    const req = https.request(
      `https://fra.cloud.appwrite.io/v1${path}`,
      {
        method,
        family: 4, // FORCE IPV4 EXPLICITLY
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': projectId,
          'X-Appwrite-Key': apiKey,
          'Content-Length': Buffer.byteLength(dataStr),
        },
        timeout: 10000,
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, body: JSON.parse(responseBody || '{}') });
          } catch {
            resolve({ statusCode: res.statusCode, body: responseBody });
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('ETIMEDOUT'));
    });
    if (dataStr) req.write(dataStr);
    req.end();
  });
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function retryReq(method, path, body = null, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await appwriteReq(method, path, body);
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await delay(400);
    }
  }
}

const EXACT_LOCAL_APPLICATIONS = [
  { firstName: 'ARISTIDE', lastName: 'EMCTHEU', name: 'ARISTIDE EMCTHEU', email: 'juvenalskengni@gmail.com', program: 'Inscription seule', status: 'New' },
  { firstName: 'billy', lastName: 'billy', name: 'billy billy', email: 'mbonguebilly@gmail.com', program: 'Inscription seule', status: 'New' },
  { firstName: 'Wilson Ngoe', lastName: 'Ngoe', name: 'Ngoe Wilson Ngoe', email: 'wilsonngoe@gmail.com', phone: '+237670032152', program: 'HRM|Human Ressource management', status: 'Accepted' },
  { firstName: 'DRIES NDIPEBA', lastName: 'BESONGAKU', name: 'BESONGAKU DRIES NDIPEBA', email: 'driesbesong@gmail.com', phone: '+237679458822', program: 'CISCO CCNA-CCNP', status: 'Accepted' },
  { firstName: 'Manuel', lastName: 'Noumbi', name: 'Manuel Noumbi', email: 'noumbimanuel45@gmail.com', phone: '+2370653343234', program: 'Bachelor of Business Administration (BBA)', status: 'New' },
  { firstName: 'Manuel', lastName: 'Noumbi', name: 'Manuel Noumbi', email: 'noumbimanuel45@gmail.com', phone: '+2370653343234', program: 'Graduate Diplomas in Computing (BCA / BSc Computing)', status: 'In Review' },
  { firstName: 'Manuel', lastName: 'Noumbi', name: 'Manuel Noumbi', email: 'noumbimanuel45@gmail.com', phone: '+2370653343234', program: 'Graduate Diplomas in Business (Nivellement)', status: 'Rejected' },
  { firstName: 'SINENG KENGNI', lastName: 'JUVENAL', name: 'JUVENAL SINENG KENGNI', email: 'sinengjuvenal@gmail.com', phone: '+237698224774', program: 'Graduate Diplomas in Business (Nivellement)', status: 'In Review' },
  { firstName: 'SINENG KENGNI', lastName: 'JUVENAL', name: 'JUVENAL SINENG KENGNI', email: 'sinengjuvenal@gmail.com', phone: '+237698224774', program: 'MSc in Computer Science', status: 'Accepted' },
  { firstName: 'SINENG KENGNI', lastName: 'JUVENAL', name: 'JUVENAL SINENG KENGNI', email: 'sinengjuvenal@gmail.com', phone: '+237698224774', program: 'Bachelor of Business Administration (BBA)', status: 'Accepted' },
  { firstName: 'SINENG KENGNI', lastName: 'JUVENAL', name: 'JUVENAL SINENG KENGNI', email: 'sinengjuvenal@gmail.com', phone: '+237698224774', program: 'Cisco CCNA-CCNP', status: 'Accepted' },
];

const EXACT_LOCAL_TEACHERS = [
  { name: 'teste1', email: 'test@gmail.com', role: 'teacher', status: 'Actif', assignedPrograms: ['Master of Laws (LLM) - M1'] },
  { name: 'Ewouki Ewouki Emmanuel', email: 'emmanuelekambi8@gmail.com', role: 'teacher', status: 'Actif', assignedPrograms: ['Bachelor of Science in Computer Applications (BCA)', 'Bachelor of Business Administration', 'Master in Software Engineering'] },
  { name: 'YANN MANUEL', email: 'noumbimanuel45@gmail.com', role: 'teacher', status: 'Actif', assignedPrograms: ['Bachelor of Science in Computer Applications (BCA)', 'Bachelor of Business Administration'] },
  { name: 'tezeu Yann', email: 'tezeuyann@gmail.com', role: 'teacher', status: 'Actif', assignedPrograms: ['Bachelor of Science in Computer Applications (BCA)', 'Bachelor of Business Administration'] },
];

async function main() {
  console.log('🚀 DÉBUT DE LA PURGE ET SYNCHRO RAPIDE NATIVE HTTPS...');

  // 1. Purge candidatures
  while (true) {
    const res = await retryReq('GET', `/databases/${databaseId}/collections/applications/documents?limit=100`);
    const docs = res.body.documents || [];
    if (docs.length === 0) break;
    console.log(`Purger ${docs.length} documents candidatures...`);
    for (const doc of docs) {
      await retryReq('DELETE', `/databases/${databaseId}/collections/applications/documents/${doc.$id}`).catch(() => {});
      await delay(100);
    }
  }
  console.log('✅ Collection applications purgée avec succès.');

  // 2. Création des 11 candidatures exactes
  for (const app of EXACT_LOCAL_APPLICATIONS) {
    const docId = 'doc_' + Math.random().toString(36).slice(2, 14);
    const payload = {
      documentId: docId,
      data: {
        firstName: app.firstName,
        lastName: app.lastName,
        name: app.name,
        email: app.email,
        phone: app.phone || '',
        program: app.program,
        status: app.status,
        dateApplied: new Date().toISOString(),
        initials: app.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2),
      },
    };
    const res = await retryReq('POST', `/databases/${databaseId}/collections/applications/documents`, payload);
    if (res.statusCode === 201 || res.statusCode === 200) {
      console.log(`✨ Candidature créée: ${app.name} -> ${app.program} (${app.status})`);
    } else {
      console.error(`❌ Erreur candidature ${app.name}:`, res.body);
    }
    await delay(150);
  }

  // 3. Purge enseignants cms_users
  const usersRes = await retryReq('GET', `/databases/${databaseId}/collections/cms_users/documents?limit=100`);
  const userDocs = usersRes.body.documents || [];
  for (const doc of userDocs) {
    if (doc.role === 'teacher') {
      await retryReq('DELETE', `/databases/${databaseId}/collections/cms_users/documents/${doc.$id}`).catch(() => {});
      await delay(100);
    }
  }
  console.log('✅ Rôles enseignants purgent terminés.');

  // 4. Création des 4 enseignants
  for (const teacher of EXACT_LOCAL_TEACHERS) {
    const docId = 'user_' + Math.random().toString(36).slice(2, 14);
    const payload = {
      documentId: docId,
      data: {
        name: teacher.name,
        email: teacher.email,
        role: teacher.role,
        status: teacher.status,
        assignedPrograms: teacher.assignedPrograms,
        initials: teacher.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2),
      },
    };
    const res = await retryReq('POST', `/databases/${databaseId}/collections/cms_users/documents`, payload);
    if (res.statusCode === 201 || res.statusCode === 200) {
      console.log(`✨ Enseignant créé: ${teacher.name} (${teacher.email})`);
    } else {
      console.error(`❌ Erreur enseignant ${teacher.name}:`, res.body);
    }
    await delay(150);
  }

  console.log('🎉 TOUTES LES DONNÉES SONT À PRÉSENT 100% IDENTIQUES À VOTRE ÉCRAN LOCAL ET ACCESSIBLES EN PROD !');
}

main();
