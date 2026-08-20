import { jsPDF } from 'jspdf';
import { CustomForm } from '../types';

export function generateFormPdfBase64(form: CustomForm, answers: Record<string, any>, referenceNumber: string): string {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [22, 101, 52]; // Deep Green IDLA (#166534)
  const secondaryColor = [30, 41, 59]; // Slate 800
  const lightBg = [248, 250, 252]; // Slate 50

  // 1. En-tête officiel IDLA
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('IDLA ACADEMY — INSTITUT DE FORMATION', 15, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Fiche Officielle de Candidature & Récépissé d\'Inscription', 15, 21);

  doc.setFont('helvetica', 'bold');
  doc.text(`Réf : ${referenceNumber}`, 195, 18, { align: 'right' });

  // 2. Titre du Formulaire
  let y = 38;
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(form.title.toUpperCase(), 15, y);

  y += 7;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139); // Slate 500
  const descLines = doc.splitTextToSize(form.description || 'Dossier d\'inscription soumis en ligne.', 180);
  doc.text(descLines, 15, y);
  y += descLines.length * 5 + 4;

  // Ligne de séparation
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(15, y, 195, y);
  y += 8;

  // 3. Tableau des Réponses
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('RÉPONSES & INFORMATIONS DU CANDIDAT', 15, y);
  y += 6;

  form.fields.forEach((field, index) => {
    let val = answers[field.label];
    if (Array.isArray(val)) val = val.join(', ');
    if (val === undefined || val === null || val === '') val = 'Non renseigné';

    // Fond alterné pour lisibilité
    if (index % 2 === 0) {
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.rect(15, y - 4, 180, 8, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    const labelText = field.label.length > 40 ? field.label.substring(0, 37) + '...' : field.label;
    doc.text(labelText, 18, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const valText = String(val);
    const valLines = doc.splitTextToSize(valText, 90);
    doc.text(valLines[0], 100, y);

    y += Math.max(8, valLines.length * 5);

    // Nouvelle page si dépassement
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  // 4. Pied de page & Note d'authenticité
  y = Math.max(y + 10, 265);
  if (y > 275) {
    doc.addPage();
    y = 265;
  }

  doc.setDrawColor(226, 232, 240);
  doc.line(15, y, 195, y);
  y += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Document généré automatiquement le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}.`, 15, y);
  doc.text('IDLA Academy — https://idlaacademy.online — Contact: admissions@idlaacademy.online', 195, y, { align: 'right' });

  // Retourne la chaîne Base64 du PDF (sans le préfixe data:application/pdf;base64,)
  const dataUri = doc.output('datauristring');
  return dataUri.split(',')[1] || '';
}
