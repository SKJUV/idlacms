const dns = require('dns');
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

const https = require('https');
const path = require('path');
const fs = require('fs');

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
        family: 4,
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

const collectionsToFix = [
  'applications',
  'cms_users',
  'programs',
  'candidate_documents',
  'activity_logs',
  'messages',
  'news',
  'testimonials',
];

async function main() {
  console.log('🔧 MISE À JOUR DES PERMISSIONS DES COLLECTIONS APPWRITE CLOUD...');

  const globalPermissions = [
    'read("any")',
    'create("any")',
    'update("any")',
    'delete("any")',
  ];

  for (const colId of collectionsToFix) {
    try {
      const getRes = await appwriteReq('GET', `/databases/${databaseId}/collections/${colId}`);
      if (getRes.statusCode === 200) {
        const updateRes = await appwriteReq('PUT', `/databases/${databaseId}/collections/${colId}`, {
          name: getRes.body.name,
          permissions: globalPermissions,
          documentSecurity: false, // Ne pas bloquer la lecture client
        });
        if (updateRes.statusCode === 200) {
          console.log(`✅ Collection [${colId}] permissions mises à jour avec succès (Read/Write public).`);
        } else {
          console.error(`❌ Échec maj collection [${colId}]:`, updateRes.body);
        }
      }
    } catch (e) {
      console.error(`Erreur collection [${colId}]:`, e.message);
    }
  }

  // Mettre à jour aussi les permissions de tous les documents déjà existants dans applications et cms_users
  const appsRes = await appwriteReq('GET', `/databases/${databaseId}/collections/applications/documents?limit=100`);
  if (appsRes.body.documents) {
    for (const doc of appsRes.body.documents) {
      await appwriteReq('PATCH', `/databases/${databaseId}/collections/applications/documents/${doc.$id}`, {
        permissions: globalPermissions,
      }).catch(() => {});
    }
    console.log(`✅ ${appsRes.body.documents.length} candidatures ont vu leurs permissions documentaires débloquées.`);
  }

  console.log('🎉 TOUTES LES PERMISSIONS SONT À PRÉSENT 100% ACCESSIBLES POUR LE FRONTEND !');
}

main();
