import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport Technique & Bilan d'Implémentation — IDLA-CMS</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
    
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #0f172a;
      line-height: 1.6;
      margin: 0;
      padding: 40px;
      background: #ffffff;
    }
    .header {
      border-bottom: 3px solid #006c49;
      padding-bottom: 20px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .title {
      font-size: 26px;
      font-weight: 800;
      color: #006c49;
      margin: 0;
    }
    .subtitle {
      font-size: 13px;
      color: #475569;
      margin-top: 5px;
    }
    .badge {
      background: #e6f4ef;
      color: #006c49;
      font-weight: 700;
      font-size: 11px;
      padding: 6px 12px;
      border-radius: 20px;
      border: 1px solid #b2dfd0;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 800;
      color: #1e293b;
      border-left: 4px solid #006c49;
      padding-left: 10px;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
    }
    .card-title {
      font-weight: 700;
      font-size: 13px;
      color: #0f172a;
      margin-bottom: 6px;
    }
    .card-desc {
      font-size: 11px;
      color: #475569;
      margin: 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 11px;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 10px 12px;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      font-weight: 700;
      color: #334155;
    }
    .status-ok {
      color: #15803d;
      font-weight: 700;
    }
    .footer {
      margin-top: 40px;
      border-top: 1px solid #e2e8f0;
      padding-top: 15px;
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
    }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <h1 class="title">IDLA-CMS • Rapport Technique</h1>
      <div class="subtitle">Bilan d'implémentation de la réorganisation LMD, Admissions & Messagerie de Cours</div>
    </div>
    <div class="badge">Système Validé & Synchronisé</div>
  </div>

  <div class="section">
    <div class="section-title">1. Réorganisation des Durées de Programmes (Système LMD)</div>
    <div class="card">
      <div class="card-title">Règles Cadres Automatisées :</div>
      <p class="card-desc">
        • <strong>Bachelor (Licence)</strong> : 3 ans d'études (Niveaux L1, L2, L3).<br>
        • <strong>Master</strong> : 5 ans Bac+5 (Niveaux M1, M2).<br>
        • <strong>Doctorat</strong> : 3 ans de recherche (Niveaux D1, D2, D3).<br>
        • <strong>Certifications Professionnelles</strong> : Durée standard de 6 mois.<br>
        Ces règles sont automatiquement appliquées lors de la création de programmes et dans l'interface de pré-inscription.
      </p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">2. Procédures d'Admission, Équivalence & Matricules Officiels</div>
    <div class="grid">
      <div class="card">
        <div class="card-title">Matricule & Banner d'Admission :</div>
        <p class="card-desc">
          Génération automatique d'un matricule universitaire unique (ex: <code>26IDLA84A</code>) dès l'acceptation de la candidature.
          Message d'accueil personnalisé dans l'Espace Étudiant et notification de confirmation transmise par e-mail.
        </p>
      </div>
      <div class="card">
        <div class="card-title">Checklist d'Équivalence (Entrée > Niveau 1) :</div>
        <p class="card-desc">
          Intégration d'un module de vérification académique dans le panneau d'administration pour valider l'authenticité des relevés de notes et diplômes antérieurs.
        </p>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">3. Optimiseur d'Emploi du Temps Automatique (Sans Conflits)</div>
    <div class="card">
      <div class="card-title">Moteur de Planification Intelligente :</div>
      <p class="card-desc">
        L'algorithme <code>findOptimalSlot</code> scrute en continu les plages universitaires standards (08h-10h, 10h15-12h15, 13h30-15h30, 15h45-17h45) du Lundi au Samedi.
        Il pré-calcule et planifie automatiquement les séances CM/TD/TP 100% sans collision entre programmes et enseignants, sans solliciter de pop-ups de confirmation.
      </p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">4. Messagerie de Cours & Persistance Hybride</div>
    <table>
      <thead>
        <tr>
          <th>Fonctionnalité</th>
          <th>Spécification Technique</th>
          <th>Statut</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Segmentation par Cours & Niveau</td>
          <td>Génération déterministe de la clé de canal <code>getClassChatId(courseName, levelName)</code></td>
          <td class="status-ok">Conforme ✓</td>
        </tr>
        <tr>
          <td>Navigation Dédiée</td>
          <td>Onglet <strong>Messagerie de cours</strong> dans le menu latéral étudiant</td>
          <td class="status-ok">Intégré ✓</td>
        </tr>
        <tr>
          <td>Persistance Hybride (F5)</td>
          <td>Stockage miroir <code>localStorage</code> + synchronisation cloud Appwrite Database</td>
          <td class="status-ok">Persistant ✓</td>
        </tr>
        <tr>
          <td>Synchronisation Enseignant-Étudiant</td>
          <td>Harmonisation totale des partages de fichiers, devoirs et liens visio en direct</td>
          <td class="status-ok">Synchronisé ✓</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="footer">
    IDLA-CMS • Institut Digital & Enseignement à Distance — Généré le ${new Date().toLocaleDateString('fr-FR')}
  </div>

</body>
</html>
`;

async function generatePdf() {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle' });
  const pdfPath = path.resolve('Rapport_Technique_IDLA_CMS.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
  });
  await browser.close();
  console.log("PDF généré avec succès à:", pdfPath);
}

generatePdf().catch(err => {
  console.error("Erreur génération PDF:", err);
  process.exit(1);
});
