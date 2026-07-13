# IDLA CMS

IDLA CMS est une application React/Vite de gestion de contenu et de parcours candidat pour l'IDLA. Elle combine un portail public, un formulaire de candidature, un espace candidat et une console administrateur avec persistance optionnelle via Appwrite.

## Aperçu

Le projet couvre quatre blocs fonctionnels principaux:

- un portail public pour présenter les programmes, les actualités et les témoignages
- un formulaire de candidature multi-étapes avec écran de confirmation
- un espace candidat avec connexion, suivi de dossier, dépôt de documents et messagerie
- un back-office administrateur pour gérer les contenus, les candidatures, les utilisateurs, les dons et le marketing

L'application est conçue pour fonctionner en mode démonstration avec des données locales, puis se brancher sur Appwrite si l'environnement est configuré.

## Fonctionnalités

- navigation interne avec routes profondes et prise en charge du bouton précédent / suivant du navigateur
- page d'accueil éditoriale avec hero, statistiques, contenus mis en avant et appels à l'action
- catalogue de programmes filtrable par texte et par type
- fil d'actualités filtrable par catégorie
- galerie de témoignages avec soumission publique et file de modération
- formulaire de don public avec remontée côté administration
- candidature multi-étapes avec écran de succès
- espace candidat avec authentification, consultation du dossier, documents téléversés et messagerie simulée ou persistée
- espace administrateur avec login, tableau de bord, gestion des utilisateurs, programmes, témoignages, actualités, pré-inscriptions, dons, marketing et paramètres
- intégration Appwrite pour les données CMS, les candidatures, les documents et les messages

## Stack Technique

- React 19
- Vite 6
- TypeScript
- Tailwind CSS 4
- Appwrite
- Lucide Icons
- Motion

## Lancer le projet

### Prérequis

- Node.js 18 ou plus
- npm

### Installation

```bash
npm install
```

### Démarrage en local

```bash
npm run dev
```

Le site est accessible sur `http://localhost:3000`.

### Vérification TypeScript

```bash
npm run lint
```

### Build de production

```bash
npm run build
```

## Configuration Appwrite

Le projet fonctionne sans Appwrite grâce aux données mockées. Si vous voulez activer la persistance, créez un fichier `.env` à la racine avec les variables suivantes:

```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_APPWRITE_DATABASE_ID=idla_cms
VITE_APPWRITE_COLLECTION_PROGRAMS=programs
VITE_APPWRITE_COLLECTION_APPLICATIONS=applications
VITE_APPWRITE_COLLECTION_LOGS=activity_logs
VITE_APPWRITE_COLLECTION_NEWS=news
VITE_APPWRITE_COLLECTION_TESTIMONIALS=testimonials
VITE_APPWRITE_COLLECTION_CMS_USERS=cms_users
VITE_APPWRITE_COLLECTION_CANDIDATE_DOCUMENTS=candidate_documents
VITE_APPWRITE_COLLECTION_MESSAGES=messages
VITE_APPWRITE_BUCKET_DOCUMENTS=documents
```

Pour provisionner le backend Appwrite, lancez:

```bash
npm run appwrite:setup
```

Ce script demande aussi `APPWRITE_API_KEY` dans l'environnement et crée les collections, attributs, index, bucket et données initiales nécessaires.

## Comptes d'accès

Le script de provisionnement crée un compte administrateur et un compte candidat dans Appwrite. Leurs identifiants se définissent via les variables d'environnement `ADMIN_EMAIL` / `ADMIN_PASSWORD` et `CANDIDATE_EMAIL` / `CANDIDATE_PASSWORD` au moment de l'exécution de `npm run appwrite:setup`.

**En production, définissez impérativement des mots de passe forts via ces variables** — ne conservez pas les valeurs par défaut du mode démonstration.

## Navigation Principale

- `/` accueil
- `/programmes` programmes
- `/actualites` actualités
- `/temoignages` témoignages
- `/candidature` candidature
- `/candidature/confirmation` confirmation de candidature
- `/candidat` connexion candidat
- `/candidat/dossier` dossier candidat
- `/admin` connexion administrateur
- `/admin/tableau-de-bord` tableau de bord admin
- `/admin/utilisateurs` utilisateurs
- `/admin/utilisateurs/nouveau` ajout utilisateur
- `/admin/programmes` programmes admin
- `/admin/temoignages` témoignages admin
- `/admin/actualites` actualités admin
- `/admin/pre-inscriptions` pré-inscriptions
- `/admin/dons` dons
- `/admin/marketing` marketing
- `/admin/parametres` paramètres

## Structure du projet

- `src/App.tsx` orchestre la navigation, les rôles et les données chargées
- `src/components/PublicPortal.tsx` regroupe la vitrine publique
- `src/components/ApplicationForm.tsx` gère la candidature
- `src/components/CandidatePortal.tsx` gère l'espace candidat
- `src/components/AdminPortal.tsx` gère l'espace administrateur
- `src/components/Header.tsx` fournit l'en-tête public
- `src/components/AdminSidebar.tsx` fournit la navigation latérale authentifiée
- `src/data/mockData.ts` contient les données locales de démonstration
- `src/lib/appwrite.ts` centralise la configuration Appwrite
- `scripts/setup-appwrite.ts` provisionne le backend Appwrite

## Scripts npm

- `npm run dev` démarre le serveur Vite en local
- `npm run build` construit l'application pour la production
- `npm run preview` prévisualise le build de production
- `npm run lint` lance le contrôle TypeScript
- `npm run clean` supprime les artefacts de build
- `npm run appwrite:setup` initialise Appwrite

## Remarques

- Le projet utilise une logique de fallback: si Appwrite n'est pas configuré, l'application reste utilisable avec les données mockées.
- Les contenus publics, les candidatures et certaines actions admin sont pensés pour un CMS académique moderne, avec une séparation claire entre visiteur, candidat et administrateur.
