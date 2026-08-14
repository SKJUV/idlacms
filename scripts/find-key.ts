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

const target = 1635622615;

async function run() {
  const progs = await databases.listDocuments(DATABASE_ID, 'programs', [Query.limit(5000)]);
  const pTitles = progs.documents.map((p: any) => p.title);
  const sampleCourses = [
    'général', 'general', 'informatique de gestion', 'algorithmique',
    'bachelor of business administration (bba)', 'master of business administration (mba)',
    'bachelor of commerce (bcom)', 'bachelor of computer applications (bca)'
  ];
  const levels = ['l1', 'l2', 'l3', 'm1', 'm2'];

  pTitles.forEach(p => {
    sampleCourses.forEach(c => {
      levels.forEach(l => {
        const k = `${p.toLowerCase()}___${c.toLowerCase()}___${l.toLowerCase()}`;
        if (hashString(k) === target) {
          console.log(`🎯 MATCH ! Program: "${p}" | Course: "${c}" | Level: "${l}"`);
        }
      });
    });
  });
}

run();
