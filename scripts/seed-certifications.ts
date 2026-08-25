/**
 * ═══════════════════════════════════════════════════════════════════════
 * IDLA Academy – Seed 14 Professional Certifications (9 Mois) into Appwrite DB
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Programmes / Certifications professionnelles :
 * - Intitulé global : Un parcours professionnel en 9 mois
 * - Rentrée : 1er octobre 2026
 * - Délai de candidature : 30 septembre 2026 à minuit
 *
 * Usage:
 *   npx tsx scripts/seed-certifications.ts              # Insertion réelle / Mise à jour
 *   npx tsx scripts/seed-certifications.ts --dry-run    # Prévisualisation sans écriture
 */

import * as https from 'https';
import * as http from 'http';
import * as dotenv from 'dotenv';
dotenv.config();

// ── Configuration Appwrite ───────────────────────────────────────────
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || '6a44f36c002ed43aca9a';
const ENDPOINT   = process.env.VITE_APPWRITE_ENDPOINT   || 'https://fra.cloud.appwrite.io/v1';
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'idla_cms';
const COLLECTION_ID = process.env.VITE_APPWRITE_COLLECTION_PROGRAMS || 'programs';
const API_KEY = process.env.APPWRITE_API_KEY || '';

const DRY_RUN = process.argv.includes('--dry-run');

// ── Structure Certification / Programme ──────────────────────────────
export interface CertificationProgram {
  id: string;
  title: string;
  description: string;
  type: 'Certification';
  category: 'Tech' | 'Management' | 'Santé' | 'Communication' | 'Sciences' | 'Droit';
  duration: string;
  price: string;
  image: string;
  isNew: boolean;
  procedures: string;
}

// ── Liste des 14 Certifications Professionnelles ──────────────────────
export const CERTIFICATIONS: CertificationProgram[] = [
  {
    id: 'cert_graphics_design',
    title: 'Graphics Design',
    description: 'Parcours professionnel complet en design graphique : identité visuelle, typographie, maîtrise de la suite Adobe (Photoshop, Illustrator, InDesign), création de supports publicitaires et UI design.',
    type: 'Certification',
    category: 'Communication',
    duration: '9 mois',
    price: '350 000 FCFA (Facilités de paiement disponibles)',
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Rentrée : 1er octobre 2026. Délai de candidature : 30 septembre 2026 à minuit. Dossier de candidature en ligne + test de niveau initial.'
  },
  {
    id: 'cert_animation_plateau',
    title: 'Animation et Présentation Plateau',
    description: 'Formation intensive aux techniques d\'animation télévisée et web-TV : diction, prise de parole en public, gestion du prompteur, conduite d\'interviews et posture journalistique face caméra.',
    type: 'Certification',
    category: 'Communication',
    duration: '9 mois',
    price: '350 000 FCFA (Facilités de paiement disponibles)',
    image: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Rentrée : 1er octobre 2026. Délai de candidature : 30 septembre 2026 à minuit. Dossier de candidature en ligne + audition vidéo.'
  },
  {
    id: 'cert_auxiliaire_vie',
    title: 'Auxiliaire de vie',
    description: 'Formation certifiante d\'accompagnement des personnes âgées, en situation de handicap ou de dépendance : gestes d\'urgence, soins d\'hygiène, soutien psychologique, nutrition et éthique du soin à domicile.',
    type: 'Certification',
    category: 'Santé',
    duration: '9 mois',
    price: '300 000 FCFA (Facilités de paiement disponibles)',
    image: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Rentrée : 1er octobre 2026. Délai de candidature : 30 septembre 2026 à minuit. Dossier en ligne + entretien de motivation.'
  },
  {
    id: 'cert_marketing_digital',
    title: 'Marketing Digital',
    description: 'Spécialisation opérationnelle en acquisition digitale : SEO/SEA, Community Management, Social Ads (Meta, Google, TikTok), stratégie de contenu, e-mailing et pilotage analytique ROI.',
    type: 'Certification',
    category: 'Management',
    duration: '9 mois',
    price: '350 000 FCFA (Facilités de paiement disponibles)',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Rentrée : 1er octobre 2026. Délai de candidature : 30 septembre 2026 à minuit. Dossier de candidature en ligne.'
  },
  {
    id: 'cert_gestion_regie_streaming',
    title: 'Gestion Régie et Streaming Direct',
    description: 'Maîtrise technique des régies de diffusion et de streaming en direct : mélangeurs vidéo (OBS, vMix, Tricaster), encodage multi-flux, monitoring live, gestion des liaisons duplex et diffusion événementielle.',
    type: 'Certification',
    category: 'Communication',
    duration: '9 mois',
    price: '380 000 FCFA (Facilités de paiement disponibles)',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Rentrée : 1er octobre 2026. Délai de candidature : 30 septembre 2026 à minuit. Dossier de candidature en ligne.'
  },
  {
    id: 'cert_technicien_medical',
    title: 'Technicien médical',
    description: 'Formation appliquée aux métiers de laboratoire et de plateau technique médical : manipulation des équipements d\'analyse biologique, préparation des prélèvements, normes d\'hygiène et traçabilité hospitalière.',
    type: 'Certification',
    category: 'Santé',
    duration: '9 mois',
    price: '400 000 FCFA (Facilités de paiement disponibles)',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Rentrée : 1er octobre 2026. Délai de candidature : 30 septembre 2026 à minuit. Prérequis scientifique (Bac C, D, F8 ou équivalent).'
  },
  {
    id: 'cert_fullstack_dev',
    title: 'Full Stack Developer',
    description: 'Parcours immersif de développement logiciel : Frontend (React, TypeScript, TailwindCSS), Backend (Node.js, Express, Python), bases de données (PostgreSQL, MongoDB), APIs REST/GraphQL et déploiement Cloud CI/CD.',
    type: 'Certification',
    category: 'Tech',
    duration: '9 mois',
    price: '450 000 FCFA (Facilités de paiement disponibles)',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Rentrée : 1er octobre 2026. Délai de candidature : 30 septembre 2026 à minuit. Test de logique et d\'algorithmique en ligne.'
  },
  {
    id: 'cert_eclairage_studio',
    title: 'Éclairage Studio et Lumière',
    description: 'Expertise de l\'éclairage professionnel pour le cinéma, la télévision et les studios photo : photométrie, température de couleur, réglage des projecteurs LED/Tungstène, conception de plans de feu et ambiance lumière.',
    type: 'Certification',
    category: 'Communication',
    duration: '9 mois',
    price: '350 000 FCFA (Facilités de paiement disponibles)',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Rentrée : 1er octobre 2026. Délai de candidature : 30 septembre 2026 à minuit. Dossier de candidature en ligne.'
  },
  {
    id: 'cert_assistant_medical',
    title: 'Assistant médical',
    description: 'Formation polyvalente dédiée aux cabinets médicaux et cliniques : accueil des patients, prise des constantes vitales, gestion des dossiers médicaux informatisés, préparation des salles d\'examen et assistance aux soins.',
    type: 'Certification',
    category: 'Santé',
    duration: '9 mois',
    price: '350 000 FCFA (Facilités de paiement disponibles)',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Rentrée : 1er octobre 2026. Délai de candidature : 30 septembre 2026 à minuit. Dossier de candidature en ligne.'
  },
  {
    id: 'cert_ccna_ccnp',
    title: 'CCNA / CCNP',
    description: 'Préparation certifiante d\'ingénierie réseaux Cisco : routage et commutation (OSPF, BGP, VLAN), adressage IPv4/IPv6, protocoles WAN, sécurité des routeurs/switchs et automatisation réseau avec Python.',
    type: 'Certification',
    category: 'Tech',
    duration: '9 mois',
    price: '450 000 FCFA (Facilités de paiement disponibles)',
    image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Rentrée : 1er octobre 2026. Délai de candidature : 30 septembre 2026 à minuit. Connaissances de base en informatique et réseaux.'
  },
  {
    id: 'cert_ingenierie_son',
    title: 'Ingénierie Son',
    description: 'Formation aux techniques audio professionnelles : prise de son en studio et en extérieur, mixage sur consoles numériques (Pro Tools, Logic Pro), traitement acoustique, mastering et sonorisation de concerts.',
    type: 'Certification',
    category: 'Communication',
    duration: '9 mois',
    price: '380 000 FCFA (Facilités de paiement disponibles)',
    image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Rentrée : 1er octobre 2026. Délai de candidature : 30 septembre 2026 à minuit. Dossier de candidature en ligne.'
  },
  {
    id: 'cert_assistant_admin_medicale',
    title: 'Assistant administrative médicale',
    description: 'Gestion administrative et secrétariat médical d\'excellence : terminologie médicale, facturation et télétransmission des actes de santé, archivage numérique sécurisé, gestion des plannings de consultation et secret médical.',
    type: 'Certification',
    category: 'Santé',
    duration: '9 mois',
    price: '320 000 FCFA (Facilités de paiement disponibles)',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Rentrée : 1er octobre 2026. Délai de candidature : 30 septembre 2026 à minuit. Dossier de candidature en ligne.'
  },
  {
    id: 'cert_cybersecurite',
    title: 'Cybersécurité',
    description: 'Formation certifiante aux fondamentaux de la sécurité informatique : tests d\'intrusion (pentesting), analyse des vulnérabilités, sécurisation des serveurs et firewalls, réponse aux incidents (SOC) et conformité RGPD/ISO 27001.',
    type: 'Certification',
    category: 'Tech',
    duration: '9 mois',
    price: '480 000 FCFA (Facilités de paiement disponibles)',
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Rentrée : 1er octobre 2026. Délai de candidature : 30 septembre 2026 à minuit. Connaissances de base en systèmes d\'exploitation (Linux/Windows).'
  },
  {
    id: 'cert_anglais_technique',
    title: 'Anglais Technique',
    description: 'Perfectionnement linguistique professionnel orienté business et technologies : rédaction de documentations techniques, animation de réunions internationales, négociation commerciale en anglais et préparation aux certifications TOEIC / TOEFL.',
    type: 'Certification',
    category: 'Communication',
    duration: '9 mois',
    price: '280 000 FCFA (Facilités de paiement disponibles)',
    image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=1200&q=80',
    isNew: true,
    procedures: 'Rentrée : 1er octobre 2026. Délai de candidature : 30 septembre 2026 à minuit. Test de positionnement linguistique initial.'
  }
];

// ── Client HTTP Appwrite ─────────────────────────────────────────────
function appwriteRequest(method: string, path: string, body?: any): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(ENDPOINT + path);
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
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Requête expirée (timeout)')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ── Fonction Principale d'Insertion ───────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log(`  IDLA Academy – Insertion de 14 Certifications Professionnelles`);
  console.log(`  Mode : ${DRY_RUN ? '🔍 DRY RUN (Simulation)' : '🚀 LIVE INSERTION / UPDATE'}`);
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log(`  Endpoint   : ${ENDPOINT}`);
  console.log(`  Database   : ${DATABASE_ID}`);
  console.log(`  Collection : ${COLLECTION_ID}`);
  console.log(`  API Key    : ${API_KEY ? '✅ Présente (' + API_KEY.substring(0, 12) + '...)' : '❌ ABSENTE'}`);
  console.log(`  Certifs    : ${CERTIFICATIONS.length} programmes certifiants en 9 mois`);
  console.log('───────────────────────────────────────────────────────────────────────\n');

  if (!API_KEY) {
    console.error('❌ APPWRITE_API_KEY est manquante dans le fichier .env.');
    process.exit(1);
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const cert of CERTIFICATIONS) {
    const label = `[${cert.category.padEnd(13)}] ${cert.title}`;

    if (DRY_RUN) {
      console.log(`📋 SIMULATION : ${label}`);
      console.log(`   Durée   : ${cert.duration} | Prix : ${cert.price}`);
      console.log(`   Image   : ${cert.image}`);
      console.log(`   Rentrée : 1er octobre 2026 | Date limite : 30 septembre 2026 à minuit\n`);
      skipped++;
      continue;
    }

    try {
      // 1. Vérifier si le document existe déjà
      const checkRes = await appwriteRequest('GET', `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/${cert.id}`);
      
      const payload = {
        title: cert.title,
        description: cert.description,
        type: cert.type,
        category: cert.category,
        duration: cert.duration,
        price: cert.price,
        image: cert.image,
        isNew: cert.isNew,
        procedures: cert.procedures,
      };

      if (checkRes.status === 200) {
        // Document existant -> Mise à jour pour garantir l'exactitude des métadonnées et images
        const updateRes = await appwriteRequest('PATCH', `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/${cert.id}`, {
          data: payload,
          permissions: ['read("any")', 'update("team:admins")', 'delete("team:admins")'],
        });

        if (updateRes.status === 200) {
          console.log(`🔄 MIS À JOUR : ${label}`);
          updated++;
        } else {
          console.log(`⚠️  ÉCHEC MAJ  : ${label} (HTTP ${updateRes.status})`);
          errors++;
        }
      } else {
        // Document inexistant -> Création
        const createRes = await appwriteRequest('POST', `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents`, {
          documentId: cert.id,
          data: payload,
          permissions: ['read("any")', 'update("team:admins")', 'delete("team:admins")'],
        });

        if (createRes.status === 201) {
          console.log(`✅ CRÉÉ AVEC SUCCÈS : ${label}`);
          inserted++;
        } else {
          console.log(`⚠️  ERREUR CRÉATION : ${label} (HTTP ${createRes.status}) : ${JSON.stringify(createRes.data?.message || createRes.data)}`);
          errors++;
        }
      }
    } catch (err: any) {
      console.error(`❌ EXCEPTION : ${label} – ${err.message}`);
      errors++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════════════');
  console.log(`  Bilan : ${inserted} créés | ${updated} mis à jour | ${skipped} simulés | ${errors} erreurs`);
  console.log('═══════════════════════════════════════════════════════════════════════');
}

main().catch(console.error);
