/**
 * Utility for generating official student matricules and downloading official PDF admission letters.
 */

export function generateMatricule(candidateId: string, index: number = 1): string {
  const currentYear = new Date().getFullYear().toString().slice(-2); // '26'
  let cleanId = (candidateId || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (cleanId.length < 3) cleanId = `${cleanId}XYZ`.slice(0, 3);
  const hashNum = Math.abs(cleanId.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)) % 1000;
  const seqStr = String(hashNum + index).padStart(3, '0');
  return `${currentYear}IDLA${seqStr}`;
}

export function downloadAdmissionLetterPdf(candidate: {
  name: string;
  email: string;
  program: string;
  entryLevel?: string;
  matricule: string;
  dateApplied?: string;
}) {
  const issueDate = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const levelStr = candidate.entryLevel || 'Niveau 1 (Rentrée Initiale)';
  const matricule = candidate.matricule || generateMatricule(candidate.email);

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>Lettre d'Admission Officielle - IDLA - ${candidate.name}</title>
      <style>
        @page { size: A4; margin: 20mm; }
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #1e293b;
          line-height: 1.6;
          margin: 0;
          padding: 30px;
          background: #fff;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-b: 3px solid #006c49;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .brand {
          font-size: 28px;
          font-weight: 900;
          color: #006c49;
          letter-spacing: 1px;
        }
        .subbrand {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }
        .doc-type {
          text-align: right;
          font-size: 12px;
          color: #475569;
        }
        .doc-type strong {
          display: block;
          font-size: 14px;
          color: #0f172a;
        }
        .content {
          margin-bottom: 40px;
        }
        .title-box {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          padding: 15px 20px;
          border-radius: 8px;
          margin-bottom: 25px;
          text-align: center;
        }
        .title-box h1 {
          margin: 0;
          font-size: 20px;
          color: #166534;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 25px;
        }
        .detail-item label {
          display: block;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
        }
        .detail-item span {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
        }
        .matricule-badge {
          background: #006c49;
          color: #ffffff;
          padding: 4px 10px;
          border-radius: 4px;
          font-family: monospace;
          font-weight: bold;
        }
        .body-text {
          font-size: 14px;
          color: #334155;
          text-align: justify;
        }
        .signatures {
          margin-top: 50px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .qr-box {
          border: 1px dashed #cbd5e1;
          padding: 10px;
          border-radius: 6px;
          text-align: center;
          font-size: 10px;
          color: #64748b;
        }
        .stamp {
          text-align: center;
        }
        .stamp-circle {
          width: 100px;
          height: 100px;
          border: 3px double #006c49;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #006c49;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
          margin: 0 auto 5px;
          transform: rotate(-10deg);
        }
        .footer {
          margin-top: 60px;
          border-t: 1px solid #e2e8f0;
          padding-top: 15px;
          text-align: center;
          font-size: 10px;
          color: #94a3b8;
        }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">IDLA</div>
          <div class="subbrand">International Distance Learning Academy</div>
        </div>
        <div class="doc-type">
          <strong>ATTESTATION D'ADMISSION</strong>
          Réf: ADM-${candidate.email.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-4)}
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
          <div style="font-size: 20px; font-weight: bold; color: #006c49; margin-bottom: 4px;">IDLA-VERIFY</div>
          Code: ${matricule}<br />
          Délivré le : ${issueDate}
        </div>

        <div class="stamp">
          <div class="stamp-circle">
            IDLA ACADEMIC<br />SEAL OF APPROVAL<br />★ YAOUNDÉ ★
          </div>
          <strong style="font-size: 12px; color: #0f172a;">Le Directeur des Admissions</strong>
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
