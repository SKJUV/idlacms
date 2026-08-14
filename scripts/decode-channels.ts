import dns from 'dns';
const originalLookup = dns.lookup;
(dns as any).lookup = (hostname: string, options: any, callback: any) => {
  if (hostname === 'fra.cloud.appwrite.io') {
    const cb = typeof options === 'function' ? options : callback;
    return cb(null, [{ address: '151.101.67.52', family: 4 }], 4);
  }
  return originalLookup(hostname, options, callback);
};

import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || '6a44f36c002ed43aca9a';
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'idla_cms';

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY!);

const databases = new Databases(client);

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function getClassChatId(program: string, course: string, level: string): string {
  const p = (program || '').trim().toLowerCase();
  const c = (course || '').trim().toLowerCase();
  const l = (level || '').trim().toLowerCase();
  const key = `course___${c}___${l}`;
  return `cls_${hashString(key)}`;
}

async function decodeChannels() {
  console.log("🔍 === DÉCODAGE DES CANAUX DES MESSAGES DE TESTE1 ===");

  const msgs = await databases.listDocuments(DATABASE_ID, 'messages');
  const targetIds = ['cls_1635622615', 'cls_2114505508'];

  msgs.documents.forEach((m: any) => {
    if (targetIds.includes(m.applicationId)) {
      console.log(`\n📌 Channel ID: ${m.applicationId}`);
      console.log(`   Expéditeur : ${m.sender}`);
      console.log(`   Contenu    : ${m.text}`);
      console.log(`   Date       : ${m.createdAt}`);
    }
  });

  // Tester la correspondance des chaînes
  const programsList = [
    'Bachelor of Business Administration (BBA)',
    'Master of Business Administration (MBA)',
    'BSc in Computer Science',
    'BEng in Software Engineering',
    'Clinical Medical Assistant (CMAC)'
  ];
  const coursesList = [
    'Algorithmique & Structures de Données',
    'Informatique de Gestion',
    'Management Général',
    'Comptabilité Générale',
    'Général'
  ];
  const levelsList = ['L1', 'L2', 'L3', 'M1', 'M2'];

  console.log("\n🧪 Recherche des correspondances de cours :");
  programsList.forEach(p => {
    coursesList.forEach(c => {
      levelsList.forEach(l => {
        const id = getClassChatId(p, c, l);
        if (targetIds.includes(id)) {
          console.log(`🎯 TROUVÉ ! Channel ${id} = [Programme: "${p}"] | [Cours: "${c}"] | [Niveau: "${l}"]`);
        }
      });
    });
  });
}

decodeChannels();
