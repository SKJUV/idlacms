import { jsPDF } from 'jspdf';
import * as fs from 'fs';
import * as path from 'path';

const doc = new jsPDF({
  orientation: 'p',
  unit: 'mm',
  format: 'a4',
});

const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();
const margin = 15;
const contentWidth = pageWidth - margin * 2;

// ── Palette Couleurs Officielles IDLA ─────────────────────────────────
const navyDark = [6, 11, 24];      // #060b18 (Fond Header Principal)
const bluePrimary = [2, 132, 199]; // #0284c7 (Bleu IDLA)
const skyLight = [56, 189, 248];   // #38bdf8 (Cyan / Accents)
const slateDark = [15, 23, 42];    // #0f172a (Titres & Textes)

// ── Header Officiel IDLA ─────────────────────────────────────────────
doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
doc.rect(0, 0, pageWidth, 26, 'F');

doc.setFillColor(bluePrimary[0], bluePrimary[1], bluePrimary[2]);
doc.rect(0, 26, pageWidth, 2, 'F');

doc.setFillColor(skyLight[0], skyLight[1], skyLight[2]);
doc.rect(0, 28, pageWidth, 0.6, 'F');

// Logo
try {
  const logoPath = path.join(__dirname, '../public/logo.png');
  if (fs.existsSync(logoPath)) {
    const logoB64 = fs.readFileSync(logoPath).toString('base64');
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, 3.5, 19, 19, 2, 2, 'F');
    doc.addImage('data:image/png;base64,' + logoB64, 'PNG', margin + 1, 4.5, 17, 17);
  }
} catch (e) {}

const textLeft = margin + 23;
doc.setTextColor(255, 255, 255);
doc.setFont('helvetica', 'bold');
doc.setFontSize(13);
doc.text('IDLA ACADEMY — CMS & PORTAL', textLeft, 11);

doc.setFontSize(8);
doc.setFont('helvetica', 'bold');
doc.setTextColor(skyLight[0], skyLight[1], skyLight[2]);
doc.text('RAPPORT TECHNIQUE & FONCTIONNEL', textLeft, 16);

doc.setFontSize(7.5);
doc.setFont('helvetica', 'normal');
doc.setTextColor(203, 213, 225);
doc.text('Document officiel d\'audit et de synthèse d\'architecture', textLeft, 20.5);

doc.setFontSize(8.5);
doc.setFont('helvetica', 'bold');
doc.setTextColor(255, 255, 255);
doc.text('21 Août 2026', pageWidth - margin, 15, { align: 'right' });

let y = 36;

// ── Document Title ───────────────────────────────────────────────────
doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
doc.setFont('helvetica', 'bold');
doc.setFontSize(15);
doc.text('Rapport Technique & Synthèse des Déploiements', margin, y);
y += 6;

doc.setFontSize(9);
doc.setFont('helvetica', 'normal');
doc.setTextColor(100, 116, 139);
doc.text('Bilan complet des fonctionnalités, de l\'architecture logicielle et des certifications IDLA', margin, y);
y += 7;

// Ligne de séparation
doc.setDrawColor(226, 232, 240);
doc.setLineWidth(0.4);
doc.line(margin, y, pageWidth - margin, y);
y += 8;

// ── Helper Function for Sections ─────────────────────────────────────
function addSection(title: string, items: string[]) {
  if (y + items.length * 6.5 + 15 > pageHeight - 20) {
    doc.addPage();
    y = 20;
  }

  // Titre de section en Bleu IDLA
  doc.setTextColor(bluePrimary[0], bluePrimary[1], bluePrimary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(title, margin, y + 4);
  y += 6;

  // Trait fin sous le titre
  doc.setDrawColor(bluePrimary[0], bluePrimary[1], bluePrimary[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + 80, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(51, 65, 85);

  for (const item of items) {
    const lines = doc.splitTextToSize(`• ${item}`, contentWidth - 4);
    if (y + lines.length * 4.8 > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines, margin + 2, y);
    y += lines.length * 4.8 + 1.5;
  }

  y += 4;
}

// ── Section 1: Catalogue Formations ─────────────────────────────────
addSection('1. Catalogue Complet des Formations & Certifications 9 Mois', [
  "Intégration et activation globale des 27 filières d'élite de l'académie (Bachelors, Licences, Masters, MBA) et des 14 certifications professionnelles certifiantes en 9 mois.",
  "Transparence tarifaire intégrale : affichage clair et structuré des frais de scolarité par semestre et par an pour l'ensemble des programmes."
]);

// ── Section 2: Inscription Directe & Verrouillage ───────────────────
addSection('2. Inscription Directe et Fiche d\'Inscription PDF 1-Page', [
  "Candidature ciblée en 1 clic : l'accès au formulaire depuis la fiche d'une formation pré-sélectionne et verrouille automatiquement la filière ciblée.",
  "Génération automatique d'une fiche d'inscription officielle PDF sur 1 seule page avec logo, code dossier et cadre de signature.",
  "Bouton d'accès direct « Modalités des programmes » et téléchargement local de la fiche d'inscription à joindre au dossier."
]);

// ── Section 3: Concours & PDF Appwrite ──────────────────────────────
addSection('3. Traitement du Concours Officiel & Modalités de Dépôt', [
  "Accès direct au document des modalités des programmes hébergé sur Appwrite Storage (dossier_concours_idla_2026).",
  "Règlement des frais d'étude de dossier (10 000 FCFA) auprès des banques partenaires UBA et Afriland First Bank.",
  "Modalités officielles de dépôt du dossier : En ligne à admissions@idlaacademy.online ou physique à la Nouvelle Route Bastos, Yaoundé."
]);

// ── Section 4: Contrôle d'Âge ───────────────────────────────────────
addSection('4. Contrôle d\'Âge Automatique sur les Formulaires', [
  "Contrainte minimale d'âge de 10 ans appliquée par défaut sur le champ de date de naissance avec validation dynamique en temps réel.",
  "Module de configuration d'âge minimum et maximum (minAge / maxAge) intégré au Form Builder."
]);

// ── Section 5: Avancement Traduction ────────────────────────────────
if (y + 30 > pageHeight - 20) {
  doc.addPage();
  y = 20;
}

doc.setFillColor(240, 249, 255);
doc.setDrawColor(186, 230, 253);
doc.setLineWidth(0.4);
doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');

doc.setTextColor(bluePrimary[0], bluePrimary[1], bluePrimary[2]);
doc.setFont('helvetica', 'bold');
doc.setFontSize(10.5);
doc.text('5. Système Bilingue Intégral (Français / Anglais)', margin + 4, y + 6.5);

doc.setFont('helvetica', 'normal');
doc.setFontSize(8.5);
doc.setTextColor(51, 65, 85);
doc.text('• L\'architecture bilingue native (FR / EN) avec bouton basculeur unique FR | EN est opérationnelle.', margin + 4, y + 12);
doc.text('• L\'ensemble des formulaires, libellés et documents PDF sont entièrement traduits et harmonisés.', margin + 4, y + 17);

y += 27;

// ── Section 6: Interaction et Expérience Utilisateur ────────────────
addSection('6. Interaction et Cartes de Navigation', [
  "Animations fluides au survol des cartes filières et certifications avec zoom d'image et badge dépoli.",
  "Filtrage dynamique instantané par niveau d'études, mot-clé et catégorie professionnelle."
]);

// ── Pied de page ─────────────────────────────────────────────────────
const totalPages = (doc as any).internal.getNumberOfPages();
for (let i = 1; i <= totalPages; i++) {
  doc.setPage(i);
  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
  
  doc.setFontSize(7.5);
  doc.setTextColor(skyLight[0], skyLight[1], skyLight[2]);
  doc.setFont('helvetica', 'normal');
  doc.text(`IDLA Academy — Rapport Technique • Page ${i} sur ${totalPages}`, pageWidth / 2, pageHeight - 4, { align: 'center' });
}

// ── Enregistrement des fichiers ─────────────────────────────────────
const outDir = '/home/skjuve/.gemini/antigravity-ide/brain/09189738-8fb5-4b50-b4af-50db472205e4';
const pdfFileName = 'Rapport_21_Aout_2026.pdf';
const fullPath = path.join(outDir, pdfFileName);

const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
fs.writeFileSync(fullPath, pdfBuffer);
fs.writeFileSync(path.join('/home/skjuve/Documents/idla-cms', pdfFileName), pdfBuffer);

console.log(`✅ PDF IDLA généré avec succès : ${fullPath}`);
