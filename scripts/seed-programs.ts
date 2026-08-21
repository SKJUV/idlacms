/**
 * ═══════════════════════════════════════════════════════════════════════
 * IDLA Academy – Seed 27 Academic Programs into Appwrite Database
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Usage:
 *   npx tsx scripts/seed-programs.ts              # Real insertion
 *   npx tsx scripts/seed-programs.ts --dry-run     # Preview only
 *
 * This script is IDEMPOTENT: it skips programs that already exist.
 */

import * as https from 'https';
import * as http from 'http';
import * as dotenv from 'dotenv';
dotenv.config();

// ── Appwrite Config ──────────────────────────────────────────────────
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || '6a44f36c002ed43aca9a';
const ENDPOINT   = process.env.VITE_APPWRITE_ENDPOINT   || 'https://fra.cloud.appwrite.io/v1';
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'idla_cms';
const COLLECTION_ID = process.env.VITE_APPWRITE_COLLECTION_PROGRAMS || 'programs';
const API_KEY = process.env.APPWRITE_API_KEY || '';

const DRY_RUN = process.argv.includes('--dry-run');

// ── Program Data Type ────────────────────────────────────────────────
interface SeedProgram {
  id: string;
  title: string;
  description: string;
  type: 'Master' | 'Doctorat' | 'Certification' | 'Bachelor';
  category: 'Sciences' | 'Management' | 'Tech' | 'Droit' | 'Santé' | 'Communication';
  duration: string;
  price: string;
  image: string;
  isNew: boolean;
  procedures: string;
}

// ── 27 Programs ──────────────────────────────────────────────────────
const PROGRAMS: SeedProgram[] = [
  // ═══════════════════════════════════════════════════════════════════
  // BACHELOR / LICENCE (3 Ans / 6 Semestres)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'prog_bba_bachelor',
    title: 'BBA – Business Administration',
    description: 'Formation axée sur la gestion d\'entreprise, le management stratégique, l\'administration générale et le pilotage organisationnel.',
    type: 'Bachelor',
    category: 'Management',
    duration: '3 ans (6 Semestres)',
    price: '416 665 FCFA / semestre | 833 330 FCFA / an | Total : 2 500 000 FCFA',
    image: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Baccalauréat / GCE A-Level requis. Dossier de candidature + Concours d\'entrée.'
  },
  {
    id: 'prog_bca_bachelor',
    title: 'BCA – Computer Applications',
    description: 'Formation fondamentale en informatique appliquée, développement logiciel, conception d\'applications et systèmes d\'information.',
    type: 'Bachelor',
    category: 'Tech',
    duration: '3 ans (6 Semestres)',
    price: '416 665 FCFA / semestre | 833 330 FCFA / an | Total : 2 500 000 FCFA',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Baccalauréat / GCE A-Level requis. Dossier de candidature + Concours d\'entrée.'
  },
  {
    id: 'prog_bcom_bachelor',
    title: 'B.Com – Commerce & Comptabilité',
    description: 'Spécialisation dédiée aux sciences commerciales, comptabilité générale et analytique, gestion financière et transactions commerciales.',
    type: 'Bachelor',
    category: 'Management',
    duration: '3 ans (6 Semestres)',
    price: '372 500 FCFA / semestre | 745 000 FCFA / an | Total : 2 235 000 FCFA',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Baccalauréat / GCE A-Level requis. Dossier de candidature + Concours d\'entrée.'
  },
  {
    id: 'prog_ba_arts_bachelor',
    title: 'BA – Arts',
    description: 'Études en sciences humaines, lettres, communication culturelle et disciplines artistiques générales.',
    type: 'Bachelor',
    category: 'Communication',
    duration: '3 ans (6 Semestres)',
    price: '342 500 FCFA / semestre | 685 000 FCFA / an | Total : 2 055 000 FCFA',
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Baccalauréat / GCE A-Level requis. Dossier de candidature + Concours d\'entrée.'
  },
  {
    id: 'prog_ba_journalism_bachelor',
    title: 'BA – Journalism',
    description: 'Cursus axé sur les métiers de la presse, le journalisme d\'investigation, la production de contenus multimédias et l\'information publique.',
    type: 'Bachelor',
    category: 'Communication',
    duration: '3 ans (6 Semestres)',
    price: '342 500 FCFA / semestre | 685 000 FCFA / an | Total : 2 055 000 FCFA',
    image: 'https://images.unsplash.com/photo-1504711434969-e33886168d6c?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Baccalauréat / GCE A-Level requis. Dossier de candidature + Concours d\'entrée.'
  },
  {
    id: 'prog_ba_economics_bachelor',
    title: 'BA – Economics',
    description: 'Étude approfondie des théories économiques, microéconomie, macroéconomie, analyse des marchés et politiques économiques.',
    type: 'Bachelor',
    category: 'Sciences',
    duration: '3 ans (6 Semestres)',
    price: '342 500 FCFA / semestre | 685 000 FCFA / an | Total : 2 055 000 FCFA',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Baccalauréat / GCE A-Level requis. Dossier de candidature + Concours d\'entrée.'
  },

  // ═══════════════════════════════════════════════════════════════════
  // MASTER (2 Ans / 4 Semestres) – MBA Spécialités
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'prog_mba_supply_chain',
    title: 'MBA – Supply Chain',
    description: 'Management de la chaîne logistique, optimisation des flux, gestion des approvisionnements, du stockage et des opérations internationales.',
    type: 'Master',
    category: 'Management',
    duration: '2 ans (4 Semestres)',
    price: '575 000 FCFA / semestre | 1 150 000 FCFA / an | Total : 2 300 000 FCFA',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Licence / Bachelor requis. Dossier de candidature + relevés de notes.'
  },
  {
    id: 'prog_mba_finance',
    title: 'MBA – Finance',
    description: 'Finance d\'entreprise, analyse financière avancée, gestion des risques de marché, investissements et ingénierie financière.',
    type: 'Master',
    category: 'Management',
    duration: '2 ans (4 Semestres)',
    price: '575 000 FCFA / semestre | 1 150 000 FCFA / an | Total : 2 300 000 FCFA',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Licence / Bachelor requis. Dossier de candidature + relevés de notes.'
  },
  {
    id: 'prog_mba_data',
    title: 'MBA – Data',
    description: 'Prise de décision orientée données, Business Intelligence, analytique d\'affaires et gouvernance de la donnée en entreprise.',
    type: 'Master',
    category: 'Tech',
    duration: '2 ans (4 Semestres)',
    price: '575 000 FCFA / semestre | 1 150 000 FCFA / an | Total : 2 300 000 FCFA',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Licence / Bachelor requis. Dossier de candidature + relevés de notes.'
  },
  {
    id: 'prog_mba_rh',
    title: 'MBA – Ressources Humaines',
    description: 'Gestion prévisionnelle des emplois et des compétences (GPEC), relations sociales, recrutement stratégique et droit du travail appliqué.',
    type: 'Master',
    category: 'Management',
    duration: '2 ans (4 Semestres)',
    price: '575 000 FCFA / semestre | 1 150 000 FCFA / an | Total : 2 300 000 FCFA',
    image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Licence / Bachelor requis. Dossier de candidature + relevés de notes.'
  },
  {
    id: 'prog_mba_marketing',
    title: 'MBA – Marketing',
    description: 'Stratégies de marque, marketing digital, étude des comportements consommateurs et développement commercial.',
    type: 'Master',
    category: 'Management',
    duration: '2 ans (4 Semestres)',
    price: '575 000 FCFA / semestre | 1 150 000 FCFA / an | Total : 2 300 000 FCFA',
    image: 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Licence / Bachelor requis. Dossier de candidature + relevés de notes.'
  },

  // ═══════════════════════════════════════════════════════════════════
  // MASTER (2 Ans / 4 Semestres) – Autres Masters
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'prog_mca_master',
    title: 'MCA – Master of Computer Applications',
    description: 'Programme de niveau avancé en architecture logicielle, conception de systèmes complexes, ingénierie de données et solutions technologiques.',
    type: 'Master',
    category: 'Tech',
    duration: '2 ans (4 Semestres)',
    price: '542 500 FCFA / semestre | 1 085 000 FCFA / an | Total : 2 170 000 FCFA',
    image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Licence / Bachelor requis. Dossier de candidature + relevés de notes.'
  },
  {
    id: 'prog_mcom_master',
    title: 'M.Com – Master of Commerce',
    description: 'Études avancées en commerce international, fiscalité d\'entreprise, audit financier et gouvernance commerciale.',
    type: 'Master',
    category: 'Management',
    duration: '2 ans (4 Semestres)',
    price: '450 000 FCFA / semestre | 900 000 FCFA / an | Total : 1 800 000 FCFA',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Licence / Bachelor requis. Dossier de candidature + relevés de notes.'
  },
  {
    id: 'prog_ma_journalism_master',
    title: 'MA – Journalism & Mass Communication',
    description: 'Stratégie de communication de masse, journalisme numérique, direction éditoriale et relations publiques.',
    type: 'Master',
    category: 'Communication',
    duration: '2 ans (4 Semestres)',
    price: '400 000 FCFA / semestre | 800 000 FCFA / an | Total : 1 600 000 FCFA',
    image: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Licence / Bachelor requis. Dossier de candidature + relevés de notes.'
  },
  {
    id: 'prog_ma_economics_master',
    title: 'MA – Economics',
    description: 'Analyse quantitative et économétrique, économie du développement, finance publique et évaluation de projets.',
    type: 'Master',
    category: 'Sciences',
    duration: '2 ans (4 Semestres)',
    price: '400 000 FCFA / semestre | 800 000 FCFA / an | Total : 1 600 000 FCFA',
    image: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Licence / Bachelor requis. Dossier de candidature + relevés de notes.'
  },

  // ═══════════════════════════════════════════════════════════════════
  // UK EDUCATION – Bachelor (3 Ans / Level 4 → 5 → 6)
  // ═══════════════════════════════════════════════════════════════════
  // Year 1 – Level 4
  {
    id: 'prog_uk_l4_business',
    title: 'Level 4 Diploma in Business (UK)',
    description: 'Fondements du management, principes d\'organisation et environnement commercial britannique. Cursus Ofqual accrédité.',
    type: 'Bachelor',
    category: 'Management',
    duration: '1 an (2 Semestres) – Année 1/3 du parcours UK',
    price: '750 000 FCFA / semestre | 1 500 000 FCFA / an',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c476?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Baccalauréat requis. Admission sur dossier. Cycle complet Bachelor UK : 5 700 000 FCFA.'
  },
  {
    id: 'prog_uk_l4_computing',
    title: 'Level 4 Diploma in Computing (UK)',
    description: 'Fondamentaux du développement logiciel, réseaux et systèmes informatiques. Cursus Ofqual accrédité.',
    type: 'Bachelor',
    category: 'Tech',
    duration: '1 an (2 Semestres) – Année 1/3 du parcours UK',
    price: '750 000 FCFA / semestre | 1 500 000 FCFA / an',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Baccalauréat requis. Admission sur dossier. Cycle complet Bachelor UK : 5 700 000 FCFA.'
  },
  {
    id: 'prog_uk_l4_cybersecurity',
    title: 'Level 4 Diploma in Cyber Security (UK)',
    description: 'Introduction aux concepts de sécurisation réseau, protocoles de protection et hygiène informatique. Cursus Ofqual accrédité.',
    type: 'Bachelor',
    category: 'Tech',
    duration: '1 an (2 Semestres) – Année 1/3 du parcours UK',
    price: '750 000 FCFA / semestre | 1 500 000 FCFA / an',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Baccalauréat requis. Admission sur dossier. Cycle complet Bachelor UK : 5 700 000 FCFA.'
  },
  // Year 2 – Level 5
  {
    id: 'prog_uk_l5_business',
    title: 'Level 5 Diploma in Business (UK)',
    description: 'Gestion des opérations, finance managériale et conduite de projets en entreprise. Cursus Ofqual accrédité.',
    type: 'Bachelor',
    category: 'Management',
    duration: '1 an (2 Semestres) – Année 2/3 du parcours UK',
    price: '850 000 FCFA / semestre | 1 700 000 FCFA / an',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Level 4 Diploma validé. Cycle complet Bachelor UK : 5 700 000 FCFA.'
  },
  {
    id: 'prog_uk_l5_computing',
    title: 'Level 5 Diploma in Computing (UK)',
    description: 'Conception avancée de logiciels, bases de données relationnelles et architectures réseaux. Cursus Ofqual accrédité.',
    type: 'Bachelor',
    category: 'Tech',
    duration: '1 an (2 Semestres) – Année 2/3 du parcours UK',
    price: '850 000 FCFA / semestre | 1 700 000 FCFA / an',
    image: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Level 4 Diploma validé. Cycle complet Bachelor UK : 5 700 000 FCFA.'
  },
  {
    id: 'prog_uk_l5_cybersecurity',
    title: 'Level 5 Diploma in Cyber Security (UK)',
    description: 'Détection des vulnérabilités, sécurité des infrastructures et gestion des incidents. Cursus Ofqual accrédité.',
    type: 'Bachelor',
    category: 'Tech',
    duration: '1 an (2 Semestres) – Année 2/3 du parcours UK',
    price: '850 000 FCFA / semestre | 1 700 000 FCFA / an',
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f2?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Level 4 Diploma validé. Cycle complet Bachelor UK : 5 700 000 FCFA.'
  },
  // Year 3 – Level 6 Top-Up Degree
  {
    id: 'prog_uk_l6_bsc_business',
    title: 'BSc (Hons) Business (UK Top-Up)',
    description: 'Diplôme final d\'honneur en stratégie d\'entreprise, gouvernance et leadership organisationnel. Titre universitaire britannique.',
    type: 'Bachelor',
    category: 'Management',
    duration: '1 an (2 Semestres) – Année 3/3 du parcours UK',
    price: '1 250 000 FCFA / semestre | 2 500 000 FCFA / an',
    image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Level 5 Diploma validé. Titre délivré par université partenaire britannique.'
  },
  {
    id: 'prog_uk_l6_bsc_it',
    title: 'BSc (Hons) Information Technology (UK Top-Up)',
    description: 'Diplôme final d\'honneur en ingénierie des systèmes d\'information, gestion de projets IT et intégration technologique. Titre britannique.',
    type: 'Bachelor',
    category: 'Tech',
    duration: '1 an (2 Semestres) – Année 3/3 du parcours UK',
    price: '1 250 000 FCFA / semestre | 2 500 000 FCFA / an',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Level 5 Diploma validé. Titre délivré par université partenaire britannique.'
  },
  {
    id: 'prog_uk_l6_bsc_cybersecurity',
    title: 'BSc (Hons) Cyber Security (UK Top-Up)',
    description: 'Diplôme final d\'honneur en cyberdéfense, cryptographie appliquée, gouvernance et conformité de sécurité. Titre britannique.',
    type: 'Bachelor',
    category: 'Tech',
    duration: '1 an (2 Semestres) – Année 3/3 du parcours UK',
    price: '1 250 000 FCFA / semestre | 2 500 000 FCFA / an',
    image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Level 5 Diploma validé. Titre délivré par université partenaire britannique.'
  },

  // ═══════════════════════════════════════════════════════════════════
  // UK EDUCATION – Master / Executive (Level 7 + MBA Top-Up)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'prog_uk_l7_business_mgmt',
    title: 'Level 7 Postgraduate Diploma in Business Management (UK)',
    description: 'Management stratégique de haut niveau, prise de décision exécutive et pilotage global de la performance organisationnelle. Cursus Ofqual.',
    type: 'Master',
    category: 'Management',
    duration: '1 an (2 Semestres)',
    price: '1 125 000 FCFA / semestre | 2 250 000 FCFA / an',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Licence / Bachelor requis. Cycle complet Master UK Degree : 3 750 000 FCFA.'
  },
  {
    id: 'prog_uk_l7_exec_leadership',
    title: 'Level 7 Postgraduate Diploma in Executive Leadership (UK)',
    description: 'Leadership de transformation, gouvernance d\'entreprise, négociation de haut niveau et conduite du changement. Cursus Ofqual.',
    type: 'Master',
    category: 'Management',
    duration: '1 an (2 Semestres)',
    price: '1 125 000 FCFA / semestre | 2 250 000 FCFA / an',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Licence / Bachelor requis. Cycle complet Master UK Degree : 3 750 000 FCFA.'
  },
  {
    id: 'prog_uk_mba_topup',
    title: 'MBA Top-Up Degree – Master of Business Administration (UK)',
    description: 'Phase de finalisation et rédaction de mémoire / projet stratégique pour l\'obtention du Master of Business Administration auprès d\'une université partenaire britannique.',
    type: 'Master',
    category: 'Management',
    duration: '6 mois (1 Semestre)',
    price: '1 500 000 FCFA',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c476?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Level 7 Postgraduate Diploma validé. Titre MBA délivré par université partenaire UK.'
  },
];

// ── HTTP Helper (IPv4 forced) ────────────────────────────────────────
function appwriteRequest(method: string, path: string, body?: any): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${ENDPOINT}${path}`);
    const isHttps = url.protocol === 'https:';
    const options: https.RequestOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      family: 4,
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': PROJECT_ID,
        'X-Appwrite-Key': API_KEY,
      },
    };

    const req = (isHttps ? https : http).request(options, (res) => {
      let raw = '';
      res.on('data', (chunk: Buffer) => (raw += chunk.toString()));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 0, data: JSON.parse(raw || '{}') });
        } catch {
          resolve({ status: res.statusCode || 0, data: raw });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Request timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  IDLA Academy – Seed 27 Programs ${DRY_RUN ? '(DRY RUN)' : '(LIVE INSERT)'}`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Endpoint  : ${ENDPOINT}`);
  console.log(`  Database  : ${DATABASE_ID}`);
  console.log(`  Collection: ${COLLECTION_ID}`);
  console.log(`  API Key   : ${API_KEY ? '✅ Set (' + API_KEY.substring(0, 12) + '...)' : '❌ MISSING'}`);
  console.log(`  Programs  : ${PROGRAMS.length}`);
  console.log('───────────────────────────────────────────────────────────────\n');

  if (!API_KEY) {
    console.error('❌ APPWRITE_API_KEY is not set in .env. Aborting.');
    process.exit(1);
  }

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const prog of PROGRAMS) {
    const label = `[${prog.type.padEnd(10)}] ${prog.title}`;

    // Check if exists
    try {
      const existing = await appwriteRequest('GET', `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/${prog.id}`);
      if (existing.status === 200) {
        console.log(`⏭️  SKIP  ${label} (already exists)`);
        skipped++;
        continue;
      }
    } catch {}

    if (DRY_RUN) {
      console.log(`📋 DRY   ${label}`);
      console.log(`         Price: ${prog.price}`);
      console.log(`         Cat: ${prog.category} | Duration: ${prog.duration}`);
      skipped++;
      continue;
    }

    // Insert
    try {
      const result = await appwriteRequest('POST', `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents`, {
        documentId: prog.id,
        data: {
          title: prog.title,
          description: prog.description,
          type: prog.type,
          category: prog.category,
          duration: prog.duration,
          price: prog.price,
          image: prog.image,
          isNew: prog.isNew,
          procedures: prog.procedures,
        },
        permissions: ['read("any")', 'update("team:admins")', 'delete("team:admins")'],
      });

      if (result.status === 201) {
        console.log(`✅ OK    ${label}`);
        inserted++;
      } else {
        console.log(`⚠️  WARN  ${label} – HTTP ${result.status}: ${JSON.stringify(result.data?.message || result.data)}`);
        errors++;
      }
    } catch (err: any) {
      console.log(`❌ ERROR ${label} – ${err.message}`);
      errors++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`  Résultat : ${inserted} insérés | ${skipped} ignorés | ${errors} erreurs`);
  console.log('═══════════════════════════════════════════════════════════════');
}

main().catch(console.error);
