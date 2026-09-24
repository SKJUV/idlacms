#!/usr/bin/env node
import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import { Client, Databases, Permission, Role } from 'node-appwrite';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env');
const backupPath = resolve(__dirname, '..', 'backups', 'concours-backup-2026.json');

if (!existsSync(envPath)) {
  console.error("❌ Fichier .env introuvable à la racine.");
  process.exit(1);
}

if (!existsSync(backupPath)) {
  console.error("❌ Fichier de sauvegarde backups/concours-backup-2026.json introuvable.");
  process.exit(1);
}

const envContent = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx === -1) continue;
  let val = trimmed.slice(idx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  env[trimmed.slice(0, idx).trim()] = val;
}

const client = new Client()
  .setEndpoint(env.VITE_APPWRITE_ENDPOINT)
  .setProject(env.VITE_APPWRITE_PROJECT_ID)
  .setKey(env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = env.VITE_APPWRITE_DATABASE_ID || 'idla_cms';

const backupData = JSON.parse(readFileSync(backupPath, 'utf-8'));

async function main() {
  console.log("🚀 [IDLA CMS] Restauration de l'annonce et des paramètres du Concours IDLA...\n");

  const permissions = [
    Permission.read(Role.any()),
    Permission.update(Role.any()),
    Permission.delete(Role.any())
  ];

  // 1. Restauration de l'annonce d'actualité
  const news = backupData.newsArticle;
  if (news) {
    console.log(`📰 1. Vérification de l'annonce d'actualité [${news.$id}]...`);
    try {
      let existingNews = null;
      try {
        existingNews = await databases.getDocument(DB_ID, 'news', news.$id);
      } catch (e) {}

      const payload = {
        title: news.title,
        description: news.description,
        date: news.date || new Date().toISOString(),
        category: news.category || 'Annonces',
        image: news.image || '',
        isFeatured: Boolean(news.isFeatured),
        formId: news.formId || '6a86f5cc003484813061',
        formUrl: news.formUrl || '',
        startDate: news.startDate || '',
        endDate: news.endDate || ''
      };

      if (existingNews) {
        await databases.updateDocument(DB_ID, 'news', news.$id, payload);
        console.log(`   ✅ Annonce mise à jour : "${news.title}"`);
      } else {
        await databases.createDocument(DB_ID, 'news', news.$id, payload, permissions);
        console.log(`   ✅ Annonce recréée avec succès : "${news.title}"`);
      }
    } catch (err) {
      console.error(`   ❌ Erreur restauration annonce:`, err.message);
    }
  }

  // 2. Vérification du Formulaire
  const form = backupData.customForm;
  if (form) {
    console.log(`\n📋 2. Vérification du Formulaire de Concours [${form.$id}]...`);
    try {
      let existingForm = null;
      try {
        existingForm = await databases.getDocument(DB_ID, 'custom_forms', form.$id);
      } catch (e) {}

      if (existingForm) {
        console.log(`   ✅ Le formulaire existe déjà dans Appwrite Cloud (${existingForm.title}).`);
      } else {
        const formPayload = {
          title: form.title,
          description: form.description,
          createdAt: form.createdAt || '20/08/2026',
          fields: typeof form.fields === 'string' ? form.fields : JSON.stringify(form.fields)
        };
        await databases.createDocument(DB_ID, 'custom_forms', form.$id, formPayload, permissions);
        console.log(`   ✅ Formulaire recréé avec succès dans Appwrite Cloud.`);
      }
    } catch (err) {
      console.error(`   ❌ Erreur vérification formulaire:`, err.message);
    }
  }

  console.log("\n🎉 [Terminé] Données du Concours restaurées avec succès dans la base de données !");
  console.log("ℹ️  Pour réactiver le bouton flottant (EntranceModal) sur le site public :");
  console.log("    Décommentez le composant <EntranceModal ... /> dans src/App.tsx.\n");
}

main().catch(console.error);
