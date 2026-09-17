import { jsPDF } from 'jspdf';
import { CustomForm } from '../types';
import { IDLA_LOGO_BASE64 } from './logoBase64';

/**
 * IDLA Academy — Professional Single-Page Registration Form & Receipt Generator
 * Strictly formatted for exactly 1 page (A4 210mm x 297mm) with official IDLA branding.
 */
export function generateFormPdfBase64(
  form: CustomForm,
  answers: Record<string, any>,
  referenceNumber: string
): string {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2; // 186mm

  // ── Palette Couleurs Officielles IDLA ─────────────────────────────────
  const navyDark = [6, 11, 24];      // #060b18 (Fond Header Principal)
  const bluePrimary = [2, 132, 199]; // #0284c7 (Bleu IDLA)
  const skyLight = [56, 189, 248];   // #38bdf8 (Cyan / Accents)
  const slateDark = [15, 23, 42];    // #0f172a (Titres & Textes)
  const slateMuted = [100, 116, 139];// #64748b (Sous-titres & Notes)
  const borderCol = [203, 213, 225]; // #cbd5e1 (Bordures propres)
  const zebraBg = [241, 245, 249];   // #f1f5f9 (Lignes alternées)
  const cardBg = [248, 250, 252];    // #f8fafc (Cartouche info)

  // ═══════════════════════════════════════════════════════════════════════
  // 1. EN-TÊTE OFFICIEL IDLA (y: 0 à 30mm)
  // ═══════════════════════════════════════════════════════════════════════
  // Bandeau bleu nuit principal
  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Liseré bleu cyan / bleu ciel décoratif
  doc.setFillColor(bluePrimary[0], bluePrimary[1], bluePrimary[2]);
  doc.rect(0, 28, pageWidth, 2.5, 'F');
  doc.setFillColor(skyLight[0], skyLight[1], skyLight[2]);
  doc.rect(0, 30.5, pageWidth, 0.8, 'F');

  // Insertion du Logo Officiel IDLA (Coin supérieur gauche)
  try {
    // Fond blanc arrondi sous le logo pour un contraste optimal
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, 3.5, 21, 21, 2, 2, 'F');
    doc.addImage(IDLA_LOGO_BASE64, 'PNG', margin + 1.5, 5, 18, 18);
  } catch (e) {
    // Fallback textuel si image indisponible
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('IDLA', margin + 2, 18);
  }

  // Titres dans le bandeau
  const textLeft = margin + 25;
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('IDLA ACADEMY', textLeft, 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(skyLight[0], skyLight[1], skyLight[2]);
  doc.text('INTERNATIONAL DISTANCE LEARNING ACADEMY', textLeft, 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('FICHE D\'INSCRIPTION OFFICIELLE & RÉCÉPISSÉ DE CANDIDATURE', textLeft, 21.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(203, 213, 225);
  doc.text('(Document officiel à conserver et à joindre impérativement au dossier physique ou numérique)', textLeft, 25.5);

  // Cartouche Référence (Coin supérieur droit)
  const refBoxX = pageWidth - margin - 50;
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(refBoxX, 4, 50, 20, 2, 2, 'F');
  doc.setDrawColor(bluePrimary[0], bluePrimary[1], bluePrimary[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(refBoxX, 4, 50, 20, 2, 2, 'S');

  doc.setTextColor(skyLight[0], skyLight[1], skyLight[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('RÉFÉRENCE DOSSIER', refBoxX + 25, 9, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(referenceNumber || 'IDLA-2026-0000', refBoxX + 25, 15, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  const now = new Date();
  const dateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} à ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  doc.text(`Émis le : ${dateFormatted}`, refBoxX + 25, 20, { align: 'center' });

  let y = 35;

  // ═══════════════════════════════════════════════════════════════════════
  // 2. RÉCAPITULATIF DU PROGRAMME / FORMATION CHOISIE (y: 35 à 56mm)
  // ═══════════════════════════════════════════════════════════════════════
  doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
  doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'F');
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'S');

  // Liseré bleu latéral
  doc.setFillColor(bluePrimary[0], bluePrimary[1], bluePrimary[2]);
  doc.roundedRect(margin, y, 3, 20, 1, 1, 'F');

  // Colonne 1 : Intitulé & Formulaire
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('INTITULÉ DU PARCOURS / PROGRAMME D\'EXCELLENCE :', margin + 6, y + 5);

  doc.setTextColor(bluePrimary[0], bluePrimary[1], bluePrimary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  const progTitle = (form.title || 'Programme Universitaire IDLA').toUpperCase();
  const truncatedProgTitle = progTitle.length > 55 ? progTitle.substring(0, 52) + '...' : progTitle;
  doc.text(truncatedProgTitle, margin + 6, y + 10.5);

  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  const descText = form.description || 'Formation professionnelle & académique certifiée IDLA.';
  const truncatedDesc = descText.length > 85 ? descText.substring(0, 82) + '...' : descText;
  doc.text(truncatedDesc, margin + 6, y + 15.5);

  // Colonne 2 : Session & Statut
  const col2X = margin + 122;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('RENTRÉE & SESSION :', col2X, y + 5);

  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('1er Octobre 2026', col2X, y + 10.5);

  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('STATUT DU DOSSIER :', col2X, y + 15);

  doc.setTextColor(22, 101, 52); // Vert émeraude validation
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('✓ Pré-inscription Validée', col2X + 29, y + 15);

  y += 24;

  // ═══════════════════════════════════════════════════════════════════════
  // 3. TABLEAU DES INFORMATIONS & RÉPONSES DU CANDIDAT (y: 59 à ~180mm)
  // ═══════════════════════════════════════════════════════════════════════
  // Titre de section
  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.roundedRect(margin, y, contentWidth, 6.5, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('INFORMATIONS FOURNIES PAR LE CANDIDAT DANS LE DOSSIER', margin + 5, y + 4.5);

  y += 7.5;

  const fields = form.fields || [];
  const totalFields = fields.length;
  
  // Calcul dynamique de la hauteur de ligne pour garantir 1 SEULE PAGE
  // Maximum disponible pour les champs : ~110mm
  const maxTableHeight = 112;
  const rowHeight = Math.min(7.5, Math.max(5.2, maxTableHeight / Math.max(totalFields, 1)));

  doc.setLineWidth(0.2);

  fields.forEach((field, index) => {
    let val = answers[field.label];
    if (Array.isArray(val)) val = val.join(', ');
    if (val === undefined || val === null || val === '') val = '—';

    const rowY = y + index * rowHeight;
    const isEven = index % 2 === 0;

    // Fond de ligne alterné
    if (isEven) {
      doc.setFillColor(zebraBg[0], zebraBg[1], zebraBg[2]);
      doc.rect(margin, rowY, contentWidth, rowHeight, 'F');
    } else {
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, rowY, contentWidth, rowHeight, 'F');
    }

    // Bordure de ligne
    doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
    doc.rect(margin, rowY, contentWidth, rowHeight, 'S');

    // Séparateur vertical entre libellé et valeur
    const splitX = margin + 68;
    doc.line(splitX, rowY, splitX, rowY + rowHeight);

    // Libellé du champ
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    const labelText = field.label.length > 36 ? field.label.substring(0, 34) + '...' : field.label;
    doc.text(labelText, margin + 3, rowY + rowHeight / 2 + 1.2);

    // Valeur renseignée
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    const valText = String(val);
    const maxValLen = 70;
    const truncatedVal = valText.length > maxValLen ? valText.substring(0, maxValLen - 3) + '...' : valText;
    doc.text(truncatedVal, splitX + 3, rowY + rowHeight / 2 + 1.2);
  });

  y += totalFields * rowHeight + 4;

  // ═══════════════════════════════════════════════════════════════════════
  // 4. PIÈCES REQUISES & MODALITÉS DU DOSSIER (y: ~185 à 220mm)
  // ═══════════════════════════════════════════════════════════════════════
  const noticeBoxH = 31;
  doc.setFillColor(240, 249, 255); // Sky 50
  doc.roundedRect(margin, y, contentWidth, noticeBoxH, 2, 2, 'F');
  doc.setDrawColor(186, 230, 253); // Sky 200
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, noticeBoxH, 2, 2, 'S');

  // Liseré bleu gauche
  doc.setFillColor(bluePrimary[0], bluePrimary[1], bluePrimary[2]);
  doc.roundedRect(margin, y, 2.5, noticeBoxH, 1, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(bluePrimary[0], bluePrimary[1], bluePrimary[2]);
  doc.text('PIÈCES JUSTIFICATIVES OBLIGATOIRES & CENTRES D\'ÉVALUATION :', margin + 5, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  
  const colW = (contentWidth - 10) / 2;
  // Colonne gauche
  doc.text('• 1. Cette fiche d\'inscription officielle imprimée et signée ci-dessous.', margin + 5, y + 9);
  doc.text('• 2. Copie certifiée conforme de l\'acte de naissance + Photo 4x4.', margin + 5, y + 13.5);
  doc.text('• 3. Relevés de notes des 3 dernières années d\'études ou diplôme.', margin + 5, y + 18);
  
  // Colonne droite
  const colRightX = margin + colW + 6;
  doc.text('• 4. Reçu de versement des frais d\'étude de dossier (10 000 FCFA).', colRightX, y + 9);
  doc.text('• 5. Attestation de réussite du Bac / GCE A-Level ou Licence.', colRightX, y + 13.5);
  doc.text('• 6. Curriculum Vitae (CV) actualisé (pour Master et Certifications).', colRightX, y + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(bluePrimary[0], bluePrimary[1], bluePrimary[2]);
  doc.text('Lieux d\'évaluation (Afrique Centrale) : Cameroun, Gabon, Congo, Tchad, Centrafrique (RCA), Guinée Équatoriale, RDC & En Ligne', margin + 5, y + 23);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text('Dépôt physique : Campus IDLA, Nouvelle Route Bastos, Yaoundé  |  Dépôt numérique : admissions@idlaacademy.online', margin + 5, y + 27.5);

  y += noticeBoxH + 3;

  // ═══════════════════════════════════════════════════════════════════════
  // 5. SIGNATURES & VALIDATION OFFICIELLE (y: ~225 à 275mm)
  // ═══════════════════════════════════════════════════════════════════════
  const sigBoxW = (contentWidth - 6) / 2;
  const sigBoxH = 34;

  // ── Bloc 1 : Candidat ──
  doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
  doc.roundedRect(margin, y, sigBoxW, sigBoxH, 2, 2, 'F');
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, sigBoxW, sigBoxH, 2, 2, 'S');

  doc.setFillColor(bluePrimary[0], bluePrimary[1], bluePrimary[2]);
  doc.roundedRect(margin, y, sigBoxW, 5.5, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('ENGAGEMENT & SIGNATURE DU CANDIDAT', margin + sigBoxW / 2, y + 4, { align: 'center' });

  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Je certifie sur l\'honneur l\'exactitude des renseignements déclarés.', margin + 4, y + 10);
  doc.text('Fait à : ...................................., le : ......./......./2026', margin + 4, y + 15);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6);
  doc.text('(Mention manuscrite "Lu et approuvé" + Signature)', margin + 4, y + 30);

  // ── Bloc 2 : Administration IDLA ──
  const adminX = margin + sigBoxW + 6;
  doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
  doc.roundedRect(adminX, y, sigBoxW, sigBoxH, 2, 2, 'F');
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(adminX, y, sigBoxW, sigBoxH, 2, 2, 'S');

  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.roundedRect(adminX, y, sigBoxW, 5.5, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('CADRE RÉSERVÉ À L\'ADMINISTRATION IDLA', adminX + sigBoxW / 2, y + 4, { align: 'center' });

  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Décision de recevabilité : [  ] Conforme   [  ] Pièces manquantes', adminX + 4, y + 10);
  doc.text('Visa des Admissions & Cachet IDLA Academy :', adminX + 4, y + 15);

  // Sceau filigrane / tampon
  doc.setDrawColor(bluePrimary[0], bluePrimary[1], bluePrimary[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(adminX + sigBoxW - 32, y + 17, 28, 14, 1, 1, 'S');
  doc.setTextColor(bluePrimary[0], bluePrimary[1], bluePrimary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.text('IDLA ACADEMY', adminX + sigBoxW - 18, y + 21.5, { align: 'center' });
  doc.text('ADMISSIONS DESK', adminX + sigBoxW - 18, y + 25, { align: 'center' });
  doc.text('VERIFIED & FILED', adminX + sigBoxW - 18, y + 28.5, { align: 'center' });

  y += sigBoxH + 3;

  // ═══════════════════════════════════════════════════════════════════════
  // 6. PIED DE PAGE SÉCURISÉ & COORDONNÉES IDLA (y: 282 à 297mm)
  // ═══════════════════════════════════════════════════════════════════════
  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.rect(0, 283, pageWidth, 14, 'F');

  doc.setFillColor(skyLight[0], skyLight[1], skyLight[2]);
  doc.rect(0, 282.2, pageWidth, 0.8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.text('IDLA ACADEMY — INSTITUTION D\'ENSEIGNEMENT SUPÉRIEUR & FORMATION CONTINUE', pageWidth / 2, 287.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(skyLight[0], skyLight[1], skyLight[2]);
  doc.text('Portail Officiel : https://idlaacademy.online  |  Email : admissions@idlaacademy.online  |  Concours & Inscriptions 2026-2027', pageWidth / 2, 292, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`SecID: ${referenceNumber} • Page 1/1 (Unique)`, pageWidth - margin, 295, { align: 'right' });

  // Retourne la chaîne Base64 du PDF (sans le préfixe data:application/pdf;base64,)
  const dataUri = doc.output('datauristring');
  return dataUri.split(',')[1] || '';
}
