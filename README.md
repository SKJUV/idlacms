# IDLA CMS

Un portail React/Vite pour la gestion des candidatures, des programmes et des espaces administrateur / candidat pour IDLA.

## Description

Ce projet inclut :

- une interface publique responsive pour découvrir les programmes, actualités et témoignages
- un formulaire de candidature multi-étapes
- un espace candidat de suivi
- un espace administrateur simple pour gérer le contenu

## Exécution locale

**Prérequis**

- Node.js 18+ installé

### Installer les dépendances

```bash
npm install
```

### Démarrer le serveur de développement

```bash
npm run dev
```

Le site sera accessible sur `http://localhost:3000`.

## Branche

La branche de travail actuelle s'appelle `manuel`.

## Structure principale

- `src/App.tsx` : routeur interne et état principal
- `src/components/` : composants de l'application
- `src/data/mockData.ts` : données factices pour les programmes, actualités et témoignages

## Build de production

```bash
npm run build
```

## Notes

Le projet utilise Vite, React et Tailwind CSS.
