import dns from 'dns';
const originalLookup = dns.lookup;
(dns as any).lookup = (hostname: string, options: any, callback: any) => {
  if (hostname === 'fra.cloud.appwrite.io') {
    const cb = typeof options === 'function' ? options : callback;
    return cb(null, [{ address: '151.101.67.52', family: 4 }], 4);
  }
  return originalLookup(hostname, options, callback);
};

import { Client, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || '6a44f36c002ed43aca9a';
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'idla_cms';

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY!);
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

async function findTarget1() {
  const progs = await databases.listDocuments(DATABASE_ID, 'programs', [Query.limit(5000)]);
  const pTitles = progs.documents.map((p: any) => p.title);

  const sampleCourses = [
    'général', 'general', 'informatique de gestion', 'algorithmique',
    'algorithmique & structures de données', 'management général',
    'comptabilité générale', 'droit des affaires', 'droit international',
    'soins infirmiers', 'anglais des affaires', 'marketing digital',
    'gestion de projet', 'intelligence artificielle', 'cyber-sécurité',
    'phlébotomie', 'électrocardiogramme', 'secourisme', 'réanimation',
    'master of business administration (mba)', 'bachelor of business administration (bba)',
    'bsc in computer science', 'programme idla'
  ];

  const levels = ['l1', 'l2', 'l3', 'm1', 'm2', 'doctorat', 'certifiant'];
  const target1 = 1635622615;

  pTitles.forEach(p => {
    sampleCourses.forEach(c => {
      levels.forEach(l => {
        const k1 = `${p.toLowerCase()}___${c.toLowerCase()}___${l.toLowerCase()}`;
        const k2 = `course___${c.toLowerCase()}___${l.toLowerCase()}`;
        const k3 = `${p.toLowerCase()}___${p.toLowerCase()}___${l.toLowerCase()}`;
        
        if (hashString(k1) === target1) console.log(`🎯 MATCH Target 1 => ${k1}`);
        if (hashString(k2) === target1) console.log(`🎯 MATCH Target 1 => ${k2}`);
        if (hashString(k3) === target1) console.log(`🎯 MATCH Target 1 => ${k3}`);
      });
    });
  });
}

findTarget1();
