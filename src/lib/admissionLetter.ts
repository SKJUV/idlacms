import { jsPDF } from 'jspdf';
import { IDLA_LOGO_BASE64 } from './logoBase64';

/**
 * Utility for generating official student matricules and generating official PDF admission letters.
 */

export function generateMatricule(candidateId: string, index: number = 1): string {
  const currentYear = new Date().getFullYear().toString().slice(-2); // '26'
  let cleanId = (candidateId || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (cleanId.length < 3) cleanId = `${cleanId}XYZ`.slice(0, 3);
  const hashNum = Math.abs(cleanId.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)) % 1000;
  const seqStr = String(hashNum + index).padStart(3, '0');
  return `${currentYear}IDLA${seqStr}`;
}

export interface AdmissionCandidateInfo {
  name: string;
  email: string;
  program: string;
  entryLevel?: string;
  matricule?: string;
  dateApplied?: string;
}

/**
 * Generates an official, beautifully styled single-page A4 PDF admission letter (jsPDF instance).
 */
export function generateAdmissionLetterPdfDoc(candidate: AdmissionCandidateInfo): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  const matricule = candidate.matricule || generateMatricule(candidate.email || candidate.name);
  const issueDate = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const levelStr = candidate.entryLevel || 'Niveau 1 (Rentrée Initiale)';
  const programStr = candidate.program || 'Programme Académique IDLA';

  // ── Palette Couleurs Officielles IDLA ─────────────────────────────────
  const navyDark = [6, 11, 24];       // #060b18 (Fond Header Principal)
  const bluePrimary = [2, 132, 199];  // #0284c7 (Bleu IDLA)
  const skyLight = [56, 189, 248];    // #38bdf8 (Cyan / Accents)
  const slateDark = [15, 23, 42];     // #0f172a (Titres & Textes)
  const slateBody = [51, 65, 85];     // #334155 (Corps de texte)
  const slateMuted = [100, 116, 139]; // #64748b (Sous-titres & Notes)
  const borderCol = [203, 213, 225];  // #cbd5e1 (Bordures propres)
  const cardBg = [248, 250, 252];     // #f8fafc (Cartouche info)

  // ═══════════════════════════════════════════════════════════════════════
  // 1. EN-TÊTE OFFICIEL IDLA (y: 0 à 32mm)
  // ═══════════════════════════════════════════════════════════════════════
  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setFillColor(bluePrimary[0], bluePrimary[1], bluePrimary[2]);
  doc.rect(0, 30, pageWidth, 2.5, 'F');
  doc.setFillColor(skyLight[0], skyLight[1], skyLight[2]);
  doc.rect(0, 32.5, pageWidth, 0.8, 'F');

  // Insertion du Logo Officiel IDLA (Coin supérieur gauche)
  try {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, 4, 22, 22, 2, 2, 'F');
    doc.addImage(IDLA_LOGO_BASE64, 'PNG', margin + 1.5, 5.5, 19, 19);
  } catch {
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('IDLA', margin + 2, 18);
  }

  // Textes Header
  const textLeft = margin + 26;
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('IDLA ACADEMY', textLeft, 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(skyLight[0], skyLight[1], skyLight[2]);
  doc.text('INTERNATIONAL DISTANCE LEARNING ACADEMY', textLeft, 17);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text("ATTESTATION OFFICIELLE D'ADMISSION & D'INSCRIPTION", textLeft, 24);

  // Cartouche Référence (Coin supérieur droit)
  const refBoxWidth = 56;
  const refBoxX = pageWidth - margin - refBoxWidth;
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(refBoxX, 4.5, refBoxWidth, 21, 2, 2, 'F');
  doc.setDrawColor(bluePrimary[0], bluePrimary[1], bluePrimary[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(refBoxX, 4.5, refBoxWidth, 21, 2, 2, 'S');

  doc.setTextColor(skyLight[0], skyLight[1], skyLight[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('RÉFÉRENCE DÉCISION', refBoxX + refBoxWidth / 2, 10, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  const refCode = `ADM-${matricule}`;
  doc.text(refCode, refBoxX + refBoxWidth / 2, 16.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Émise le ${issueDate}`, refBoxX + refBoxWidth / 2, 21.5, { align: 'center' });

  // ═══════════════════════════════════════════════════════════════════════
  // 2. BANNIÈRE DE TITRE (y: 38 à 50mm)
  // ═══════════════════════════════════════════════════════════════════════
  let currentY = 38;
  doc.setFillColor(240, 249, 255);
  doc.roundedRect(margin, currentY, contentWidth, 12, 2, 2, 'F');
  doc.setDrawColor(186, 230, 253);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, 12, 2, 2, 'S');

  doc.setTextColor(3, 105, 161);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text("DÉCISION ACADÉMIQUE D'ADMISSION", pageWidth / 2, currentY + 7.5, { align: 'center' });

  // ═══════════════════════════════════════════════════════════════════════
  // 3. PRÉAMBULE OFFICIEL
  // ═══════════════════════════════════════════════════════════════════════
  currentY += 18;
  doc.setTextColor(slateBody[0], slateBody[1], slateBody[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const preamble =
    "La Commission Académique d'Admission de l'International Distance Learning Academy (IDLA) certifie par la présente que le dossier de candidature du postulant mentionné ci-dessous a été examiné et formellement validé conformément aux normes académiques et réglementaires en vigueur.";
  const preambleLines = doc.splitTextToSize(preamble, contentWidth);
  doc.text(preambleLines, margin, currentY);

  currentY += preambleLines.length * 4.8 + 4;

  // ═══════════════════════════════════════════════════════════════════════
  // 4. CARTOUCHE DÉTAILS DU CANDIDAT ADMIS (Tableau structuré)
  // ═══════════════════════════════════════════════════════════════════════
  const cardY = currentY;
  const cardHeight = 60;
  doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
  doc.roundedRect(margin, cardY, contentWidth, cardHeight, 2, 2, 'F');
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, cardY, contentWidth, cardHeight, 2, 2, 'S');

  // Ligne de titre du cartouche
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, cardY, contentWidth, 8, 2, 2, 'F');
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text("INFORMATIONS OFFICIELLES DE L'ÉTUDIANT ADMIS", margin + 5, cardY + 5.5);

  const col1X = margin + 6;
  const col2X = margin + (contentWidth / 2) + 4;
  let rowY = cardY + 15;

  // Row 1: Nom & Email
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('NOM & PRÉNOM(S) DU CANDIDAT', col1X, rowY);
  doc.text('ADRESSE ÉLECTRONIQUE (E-MAIL)', col2X, rowY);

  rowY += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(candidate.name || 'Étudiant Admis', col1X, rowY);
  doc.text(candidate.email || 'etudiant@idlaacademy.online', col2X, rowY);

  // Row 2: Matricule & Niveau
  rowY += 9;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('MATRICULE ÉTUDIANT OFFICIEL', col1X, rowY);
  doc.text("NIVEAU D'ADMISSION HOMOLOGUÉ", col2X, rowY);

  rowY += 4.5;
  // Badge Matricule
  doc.setFillColor(bluePrimary[0], bluePrimary[1], bluePrimary[2]);
  doc.roundedRect(col1X, rowY - 3.8, 44, 5.8, 1.2, 1.2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('courier', 'bold');
  doc.setFontSize(10.5);
  doc.text(matricule, col1X + 22, rowY, { align: 'center' });

  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(levelStr, col2X, rowY);

  // Row 3: Programme Assigné
  rowY += 9;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text("PROGRAMME & PARCOURS D'ÉTUDES", col1X, rowY);
  doc.text('SESSION ACADÉMIQUE / DATE', col2X, rowY);

  rowY += 4.5;
  doc.setTextColor(bluePrimary[0], bluePrimary[1], bluePrimary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  const progLines = doc.splitTextToSize(programStr, (contentWidth / 2) - 8);
  doc.text(progLines, col1X, rowY);

  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(candidate.dateApplied || issueDate, col2X, rowY);

  // ═══════════════════════════════════════════════════════════════════════
  // 5. DISPOSITIONS ACADÉMIQUES & DROITS DE L'ÉTUDIANT
  // ═══════════════════════════════════════════════════════════════════════
  currentY = cardY + cardHeight + 8;

  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text("DISPOSITIONS RÉGLEMENTAIRES ET ACADÉMIQUES", margin, currentY);

  currentY += 5;
  doc.setTextColor(slateBody[0], slateBody[1], slateBody[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const termsText =
    "1. La présente attestation confère à son titulaire la qualité d'étudiant régulièrement inscrit à l'International Distance Learning Academy (IDLA).\n" +
    "2. L'étudiant bénéficie de l'accès intégral à l'Espace Numérique de Travail (ENT), aux cours en ligne, travaux dirigés, évaluations continues et sessions semestrielles selon le référentiel LMD.\n" +
    "3. Ce document officiel est strictement personnel. Il tient lieu d'attestation d'admission pour toute démarche administrative, boursière ou consulaire en attendant la délivrance de la carte d'étudiant définitive.";
  const termsLines = doc.splitTextToSize(termsText, contentWidth);
  doc.text(termsLines, margin, currentY);

  currentY += termsLines.length * 4.2 + 8;

  // ═══════════════════════════════════════════════════════════════════════
  // 6. ZONE DE SÉCURITÉ, SCEAU & SIGNATURES OFFICIELLES (y ~ 205 à 265mm)
  // ═══════════════════════════════════════════════════════════════════════
  const sigBoxY = Math.max(currentY, 195);
  const boxWidth = (contentWidth - 10) / 2;

  // Cartouche de Vérification & Authenticité (Gauche)
  const verifX = margin;
  doc.setFillColor(240, 249, 255);
  doc.roundedRect(verifX, sigBoxY, boxWidth, 42, 2, 2, 'F');
  doc.setDrawColor(2, 132, 199);
  doc.setLineWidth(0.4);
  doc.roundedRect(verifX, sigBoxY, boxWidth, 42, 2, 2, 'S');

  doc.setTextColor(2, 132, 199);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('AUTHENTIFICATION ET VÉRIFICATION', verifX + 5, sigBoxY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(slateBody[0], slateBody[1], slateBody[2]);
  doc.text(`Identifiant : ${matricule}`, verifX + 5, sigBoxY + 12);
  doc.text(`Délivré le : ${issueDate}`, verifX + 5, sigBoxY + 17);
  doc.text('Portail : https://portal.idlaacademy.online', verifX + 5, sigBoxY + 22);

  // Micro-empreinte numérique
  const hash = Math.abs(matricule.split('').reduce((acc, c) => (acc << 5) - acc + c.charCodeAt(0), 0)).toString(16).toUpperCase();
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(verifX + 5, sigBoxY + 27, boxWidth - 10, 10, 1, 1, 'F');
  doc.setTextColor(56, 189, 248);
  doc.setFont('courier', 'bold');
  doc.setFontSize(7);
  doc.text(`IDLA-VERIFY #${hash.padStart(8, '0')}`, verifX + boxWidth / 2, sigBoxY + 33, { align: 'center' });

  // Sceau Académique & Signature (Droite)
  const stampBoxX = margin + boxWidth + 10;
  doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
  doc.roundedRect(stampBoxX, sigBoxY, boxWidth, 42, 2, 2, 'F');
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(stampBoxX, sigBoxY, boxWidth, 42, 2, 2, 'S');

  // Double cercle de tampon officiel
  const circleCenterX = stampBoxX + boxWidth / 2;
  const circleCenterY = sigBoxY + 18;
  doc.setDrawColor(2, 132, 199);
  doc.setLineWidth(0.8);
  doc.circle(circleCenterX, circleCenterY, 13, 'S');
  doc.setLineWidth(0.3);
  doc.circle(circleCenterX, circleCenterY, 11.5, 'S');

  doc.setTextColor(2, 132, 199);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.text('★ IDLA ACADEMY ★', circleCenterX, circleCenterY - 4.5, { align: 'center' });
  doc.setFontSize(5);
  doc.text('DIRECTION DES ADMISSIONS', circleCenterX, circleCenterY, { align: 'center' });
  doc.text('YAOUNDÉ - CAMPUS', circleCenterX, circleCenterY + 4.5, { align: 'center' });

  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Le Directeur des Admissions & de la Scolarité', circleCenterX, sigBoxY + 35, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Certifié conforme aux délibérations académiques', circleCenterX, sigBoxY + 39, { align: 'center' });

  // ═══════════════════════════════════════════════════════════════════════
  // 7. PIED DE PAGE OFFICIEL (y: 278 à 292mm)
  // ═══════════════════════════════════════════════════════════════════════
  const footerY = pageHeight - 16;
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(
    'International Distance Learning Academy (IDLA) • Campus Universitaire & Enseignement Supérieur à Distance',
    pageWidth / 2,
    footerY + 4.5,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text(
    'Document officiel certifié. Toute altération, reproduction non autorisée ou falsification est passible de poursuites légales.',
    pageWidth / 2,
    footerY + 8.5,
    { align: 'center' }
  );

  return doc;
}

/**
 * Generates and downloads the official PDF admission letter directly to the user's computer.
 */
export function downloadAdmissionLetterPdf(candidate: AdmissionCandidateInfo): void {
  try {
    const doc = generateAdmissionLetterPdfDoc(candidate);
    const matricule = candidate.matricule || generateMatricule(candidate.email || candidate.name);
    const cleanMatricule = matricule.replace(/[^a-zA-Z0-9_-]/g, '');
    if (typeof window !== 'undefined' && (window as any).__IDLA_TEST_ENV__) {
      (window as any).__LAST_SAVED_PDF__ = `Attestation_Admission_IDLA_${cleanMatricule}.pdf`;
      return;
    }
    doc.save(`Attestation_Admission_IDLA_${cleanMatricule}.pdf`);
  } catch (err) {
    console.error("Échec de la génération PDF, recours à la fenêtre d'impression :", err);
    printAdmissionLetter(candidate);
  }
}

/**
 * Fallback or optional popup printing view.
 */
export function printAdmissionLetter(candidate: AdmissionCandidateInfo): void {
  const issueDate = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const levelStr = candidate.entryLevel || 'Niveau 1 (Rentrée Initiale)';
  const matricule = candidate.matricule || generateMatricule(candidate.email || candidate.name);

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>Lettre d'Admission Officielle - IDLA - ${candidate.name}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body {
          font-family: 'Plus Jakarta Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #1e293b;
          line-height: 1.6;
          margin: 0;
          padding: 25px;
          background: #fff;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 3px solid #0284c7;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }
        .brand-container {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .logo-img {
          width: 55px;
          height: 55px;
          object-fit: contain;
        }
        .brand {
          font-size: 24px;
          font-weight: 900;
          color: #0284c7;
          letter-spacing: 0.5px;
          line-height: 1.1;
        }
        .subbrand {
          font-size: 10px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          font-weight: 700;
          margin-top: 3px;
        }
        .doc-type {
          text-align: right;
          font-size: 11px;
          color: #475569;
        }
        .doc-type strong {
          display: block;
          font-size: 13px;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .content {
          margin-bottom: 30px;
        }
        .title-box {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 1px solid #bae6fd;
          padding: 12px 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          text-align: center;
        }
        .title-box h1 {
          margin: 0;
          font-size: 18px;
          color: #0369a1;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 800;
        }
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .detail-item label {
          display: block;
          font-size: 9.5px;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 2px;
        }
        .detail-item span {
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
        }
        .matricule-badge {
          background: #0284c7;
          color: #ffffff;
          padding: 3px 8px;
          border-radius: 4px;
          font-family: monospace;
          font-weight: bold;
          font-size: 13px;
        }
        .body-text {
          font-size: 13px;
          color: #334155;
          text-align: justify;
          line-height: 1.6;
        }
        .signatures {
          margin-top: 35px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .qr-box {
          border: 1px dashed #0284c7;
          background: #f0f9ff;
          padding: 10px 15px;
          border-radius: 6px;
          text-align: center;
          font-size: 10px;
          color: #0369a1;
        }
        .stamp {
          text-align: center;
        }
        .stamp-circle {
          width: 95px;
          height: 95px;
          border: 3px double #0284c7;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0284c7;
          font-size: 9px;
          font-weight: bold;
          text-transform: uppercase;
          margin: 0 auto 5px;
          transform: rotate(-10deg);
          line-height: 1.3;
        }
        .footer {
          margin-top: 40px;
          border-top: 1px solid #e2e8f0;
          padding-top: 12px;
          text-align: center;
          font-size: 9.5px;
          color: #94a3b8;
        }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="brand-container">
          <img src="/logo.png" alt="Logo IDLA" class="logo-img" onerror="this.style.display='none'" />
          <div>
            <div class="brand">IDLA ACADEMY</div>
            <div class="subbrand">International Distance Learning Academy</div>
          </div>
        </div>
        <div class="doc-type">
          <strong>ATTESTATION D'ADMISSION</strong>
          Réf: ADM-${candidate.email ? candidate.email.slice(0, 4).toUpperCase() : 'IDLA'}-${Date.now().toString().slice(-4)}
        </div>
      </div>

      <div class="content">
        <div class="title-box">
          <h1>Décision d'Admission Officielle</h1>
        </div>

        <p class="body-text">
          Nous avons le plaisir de vous informer que la commission académique d'admission de l'International Distance Learning Academy (IDLA) a validé votre candidature après examen rigoureux de votre dossier.
        </p>

        <div class="details-grid">
          <div class="detail-item">
            <label>Nom du Candidat Admis</label>
            <span>${candidate.name}</span>
          </div>
          <div class="detail-item">
            <label>Adresse E-mail</label>
            <span>${candidate.email}</span>
          </div>
          <div class="detail-item">
            <label>Matricule Étudiant Officiel</label>
            <span><span class="matricule-badge">${matricule}</span></span>
          </div>
          <div class="detail-item">
            <label>Niveau d'Entrée Validé</label>
            <span>${levelStr}</span>
          </div>
          <div class="detail-item" style="grid-column: span 2;">
            <label>Programme d'Études Assigné</label>
            <span>${candidate.program}</span>
          </div>
        </div>

        <p class="body-text">
          Cette attestation confirme votre inscription en qualité d'étudiant régulier au sein de notre établissement. Vous êtes invité(e) à vous connecter à votre Espace Étudiant pour consulter vos cours, accéder aux salles virtuelles et prendre connaissance de votre emploi du temps semestriel.
        </p>
      </div>

      <div class="signatures">
        <div class="qr-box">
          <div style="font-size: 16px; font-weight: bold; color: #0284c7; margin-bottom: 4px;">IDLA-VERIFY</div>
          Code: ${matricule}<br />
          Délivré le : ${issueDate}
        </div>

        <div class="stamp">
          <div class="stamp-circle">
            IDLA ACADEMIC<br />SEAL OF APPROVAL<br />★ YAOUNDÉ ★
          </div>
          <strong style="font-size: 11px; color: #0f172a;">Le Directeur des Admissions</strong>
        </div>
      </div>

      <div class="footer">
        International Distance Learning Academy (IDLA) • Campus & Enseignement à Distance<br />
        Document officiel généré électroniquement. Certifié conforme aux décisions académiques en vigueur.
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
}
