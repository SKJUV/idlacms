# Voici comment le travail est organisé sur le projet IDLA CMS

Bienvenue sur le dépôt **IDLA CMS**. Ce document récapitule l'organisation du projet, la répartition des périmètres de développement, le pipeline de validation automatisé (CI/CD) et les bonnes pratiques pour travailler sans aucun conflit Git.

---

## 🎯 1. Répartition des Périmètres de Développement

Afin de garantir un développement fluide et d'éviter tout chevauchement de code :

- **Zone 1 : Page d'Accueil & Vitrine (`PublicPortal.tsx`, `Header.tsx`, `EntranceModal.tsx`)**
  - Gestion des bannières, filtres de filières, compteurs de statistiques, 3 piliers et boutons de navigation.
- **Zone 2 : Formulaires, Candidatures & Administration (`FormPage.tsx`, `ApplicationForm.tsx`, `AdminPortal.tsx`)**
  - Gestion du formulaire officiel du Concours (`6a86f5cc003484813061`), parcours candidat, console administrateur et génération de reçus PDF.

> 💡 **Règle absolue** : Les modifications doivent toujours être strictement périmétrées pour éviter d'éditer le même fichier en parallèle.

---

## 🔄 2. Workflow Git Obligatoire

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Branche Principale main                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌──────────────────────────────┐                ┌──────────────────────────────┐
│ Branche Feature A            │                │ Branche Feature B            │
│ (ex: feature/page-accueil)   │                │ (ex: feature/formulaire)     │
└──────────┬───────────────────┘                └──────────┬───────────────────┘
           │                                               │
           ▼                                               ▼
 [Push & PR vers main]                           [Push & PR vers main]
           │                                               │
           ▼                                               ▼
 [GitHub Actions: CI Pass ✅]                     [GitHub Actions: CI Pass ✅]
           │                                               │
           ▼                                               ▼
 [Auto-Merge sur main 🚀]                        [Auto-Merge sur main 🚀]
```

### Étape 1 : Récupérer la version à jour avant de commencer
Avant toute nouvelle tâche ou création de branche, mettez à jour votre environnement local :
```bash
git checkout main
git pull origin main
```

### Étape 2 : Développer sur une branche dédiée
Ne développez **jamais** directement sur la branche `main`. Créez toujours une branche explicite :
- **Nouvelle fonctionnalité** : `feature/nom-explicite` (ex: `feature/actualites-sidebar`)
- **Correction de bug** : `fix/nom-du-bug` (ex: `fix/lien-concours`)

```bash
git checkout -b feature/ma-fonctionnalite
```

### Étape 3 : Valider localement
Avant de pousser votre travail, exécutez ces deux commandes pour vérifier qu'aucune erreur ne subsiste :
```bash
# 1. Vérification TypeScript (0 erreur)
npx tsc --noEmit

# 2. Exécution de la suite de tests automatisés (12 tests Vitest)
npm run test:ci

# 3. Build de production Vite
npm run build
```

### Étape 4 : Pousser et ouvrir une Pull Request (PR)
```bash
git add -A
git commit -m "feat(module): description claire de la modification"
git push -u origin feature/ma-fonctionnalite
```
Ouvrez ensuite la Pull Request vers la branche `main`.

---

## 🤖 3. Automatisation CI/CD & Fusion Automatique (Auto-Merge)

Le projet dispose désormais d'un **système de validation 100% automatisé** via GitHub Actions :

1. **`ci.yml` (Contrôle Qualité)** :
   - À l'ouverture de la PR, GitHub Actions vérifie le typechecking, exécute la suite de tests unitaires d'intégrité (Vitest + `happy-dom`) et valide la compilation Vite.
2. **`auto-merge.yml` (Fusion Automatique)** :
   - Dès que tous les voyants de la CI passent au vert (✓ SUCCESS), **GitHub Actions fusionne la PR automatiquement sur `main`** sans intervention humaine nécessaire.

---

## 📝 4. Résumé des Bonnes Pratiques

1. **Une tâche = Une branche = Une PR courte**.
2. **Synchronisez régulièrement votre branche** avec `main` (`git merge main`).
3. **Respectez les noms de clés de traduction `i18n`** (`t('...')`) pour conserver le bilinguisme Français/Anglais fonctionnel sur 100% des composants.
