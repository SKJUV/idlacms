import { Client, Databases, Users, Query } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || '6a44f36c002ed43aca9a';
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'idla_cms';

if (!API_KEY) {
  console.error('❌ APPWRITE_API_KEY absente du fichier .env / .env.local');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);
const users = new Users(client);

const command = process.argv[2] || 'status';
const param1 = process.argv[3];

async function runCli() {
  switch (command) {
    case 'status':
    case 'stats': {
      console.log('\n📊 === ÉTAT DE LA BASE DE DONNÉES IDLA-CMS ===');
      console.log(`Endpoint : ${ENDPOINT}`);
      console.log(`Projet   : ${PROJECT_ID}`);
      console.log(`Database : ${DATABASE_ID}\n`);

      const collections = ['programs', 'news', 'testimonials', 'cms_users', 'applications', 'activity_logs', 'courses', 'schedules', 'messages', 'donations'];
      for (const cId of collections) {
        try {
          const res = await databases.listDocuments(DATABASE_ID, cId);
          console.log(`• Collection "${cId}": ${res.total} document(s)`);
        } catch (e: any) {
          console.log(`• Collection "${cId}": (vide ou non créée — ${e.message})`);
        }
      }

      try {
        const uList = await users.list([Query.limit(500)]);
        console.log(`\n• Comptes Authentification Auth: ${uList.total} utilisateur(s)`);
      } catch (e: any) {
        console.log(` Erreur lecture Auth Users: ${e.message}`);
      }
      break;
    }

    case 'list-users': {
      console.log('\n👥 === LISTE DES COMPTES D\'ACCÈS AUTH (APPWRITE) ===');
      const uList = await users.list([Query.limit(500)]);
      uList.users.forEach((u: any, idx: number) => {
        console.log(`${idx + 1}. [${u.$id}] ${u.name || 'Sans Nom'} <${u.email}> — Status: ${u.status ? 'Actif' : 'Inactif'} | Labels: [${u.labels.join(', ') || 'aucun'}]`);
      });
      break;
    }

    case 'list-programs': {
      console.log('\n📚 === LISTE DES PROGRAMMES & CERTIFICATIONS ===');
      try {
        const res = await databases.listDocuments(DATABASE_ID, 'programs', [Query.limit(500)]);
        console.log(`Total: ${res.total} programme(s)\n`);
        res.documents.forEach((p: any, idx: number) => {
          console.log(`${idx + 1}. [${p.type}] ${p.title} (${p.duration || 'N/C'}) — Categorie: ${p.category}`);
        });
      } catch (e: any) {
        console.error("Erreur lecture des programmes:", e.message);
      }
      break;
    }

    case 'set-admin': {
      if (!param1) {
        console.error('❌ Veuillez spécifier l\'adresse e-mail: npx tsx scripts/db-cli.ts set-admin exemple@idla.edu');
        process.exit(1);
      }
      console.log(`⚡ Attribution du rôle Admin à <${param1}>...`);
      const search = await users.list([Query.equal('email', param1.trim().toLowerCase())]);
      if (search.users.length === 0) {
        console.error(`❌ Aucun compte utilisateur trouvé pour ${param1}`);
        process.exit(1);
      }
      const targetUser = search.users[0];
      const existingLabels = targetUser.labels || [];
      if (!existingLabels.includes('admin')) {
        existingLabels.push('admin');
      }
      await users.updateLabels(targetUser.$id, existingLabels);
      console.log(`✅ Succès ! Le compte ${targetUser.email} est désormais Administrateur.`);
      break;
    }

    case 'backup': {
      console.log('📦 Génération d\'une sauvegarde complète en JSON...');
      const backupData: Record<string, any> = { timestamp: new Date().toISOString() };
      const collections = ['programs', 'news', 'testimonials', 'cms_users', 'applications', 'activity_logs', 'courses', 'schedules', 'messages', 'donations'];

      for (const cId of collections) {
        try {
          const res = await databases.listDocuments(DATABASE_ID, cId, [Query.limit(5000)]);
          backupData[cId] = res.documents;
        } catch {
          backupData[cId] = [];
        }
      }

      const backupPath = path.resolve(`backup_idla_cms_${Date.now()}.json`);
      fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf-8');
      console.log(`🎉 Sauvegarde générée avec succès : ${backupPath}`);
      break;
    }

    default: {
      console.log(`
🛠️  COMMANDES CLI DISPONIBLES :
  • npx tsx scripts/db-cli.ts status          : Afficher l'état en direct de la BD
  • npx tsx scripts/db-cli.ts list-users      : Lister les comptes utilisateurs & rôles
  • npx tsx scripts/db-cli.ts list-programs   : Lister les 56 programmes & certifications
  • npx tsx scripts/db-cli.ts set-admin <mail>: Donner les droits Admin à un utilisateur
  • npx tsx scripts/db-cli.ts backup          : Exporter une sauvegarde complète en JSON
      `);
    }
  }
}

runCli().catch(err => {
  console.error("Erreur exécution CLI DB:", err);
});
