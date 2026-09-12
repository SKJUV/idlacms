import { jsPDF } from 'jspdf';
import { IDLA_LOGO_BASE64 } from './logoBase64';

/**
 * Generates and downloads the official IDLA Scholarship Coverage & Local Charges Policy PDF (A4).
 */
export function downloadMScFEPolicyPdf(): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Palette
  const navyDark = [6, 11, 24];
  const bluePrimary = [2, 132, 199];
  const skyLight = [56, 189, 248];
  const slateDark = [15, 23, 42];
  const slateBody = [51, 65, 85];
  const borderCol = [203, 213, 225];
  const cardBg = [248, 250, 252];

  // 1. Header Banner
  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.rect(0, 0, pageWidth, 26, 'F');
  doc.setFillColor(bluePrimary[0], bluePrimary[1], bluePrimary[2]);
  doc.rect(0, 26, pageWidth, 2, 'F');
  doc.setFillColor(skyLight[0], skyLight[1], skyLight[2]);
  doc.rect(0, 28, pageWidth, 0.6, 'F');

  // Logo
  try {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, 3, 20, 20, 2, 2, 'F');
    doc.addImage(IDLA_LOGO_BASE64, 'PNG', margin + 1, 4, 18, 18);
  } catch {
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('IDLA', margin + 2, 16);
  }

  // Header Titles
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('INTERNATIONAL DISTANCE LEARNING ACADEMY', margin + 25, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(skyLight[0], skyLight[1], skyLight[2]);
  doc.text('Higher Education & Quantitative Excellence • Official Academic Policy', margin + 25, 17);

  let y = 35;

  // Document Title Box
  doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'FD');

  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('OFFICIAL SCHOLARSHIP COVERAGE & LOCAL CHARGES POLICY', margin + 4, y + 6);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(bluePrimary[0], bluePrimary[1], bluePrimary[2]);
  doc.text('MSc in Financial Engineering (MScFE) • Academic Year 2026 / 2027', margin + 4, y + 12);

  y += 22;

  // ARTICLE 1
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('ARTICLE 1: SCHOLARSHIP SCOPE & COVERAGE MATRIX (TUITION-ONLY AWARD)', margin, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(slateBody[0], slateBody[1], slateBody[2]);
  doc.text('The MScFE scholarship is structured as a Tuition-Only Excellence Award funded by IDLA & WQ Scholarship Fund:', margin, y);
  y += 4;

  // Coverage Table
  const tableData = [
    ['Academic Tuition Fees', '100% COVERED (Value $38,612 USD/year)', 'IDLA - WQ / Scholarship Fund'],
    ['Official Registration Fee', 'NOT COVERED', 'Student / Candidate'],
    ['Housing & Accommodation', 'NOT COVERED', 'Student / Candidate'],
    ['Academic Support & Learning Materials', 'NOT COVERED', 'Student / Candidate'],
    ['Food & Daily Living Expenses', 'NOT COVERED', 'Student / Candidate'],
    ['Transport, Travel & Visa Fees', 'NOT COVERED', 'Student / Candidate'],
    ['Monthly Living Allowance / Stipend', 'NOT COVERED', 'Student / Candidate'],
  ];

  // Table header
  doc.setFillColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.rect(margin, y, contentWidth, 5.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Category / Component', margin + 3, y + 3.8);
  doc.text('Coverage Status', margin + 65, y + 3.8);
  doc.text('Responsible Party', margin + 130, y + 3.8);
  y += 5.5;

  tableData.forEach((row, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(margin, y, contentWidth, 4.8, 'F');
    doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
    doc.line(margin, y + 4.8, margin + contentWidth, y + 4.8);

    doc.setFont('helvetica', idx === 0 ? 'bold' : 'normal');
    doc.setTextColor(idx === 0 ? bluePrimary[0] : slateDark[0], idx === 0 ? bluePrimary[1] : slateDark[1], idx === 0 ? bluePrimary[2] : slateDark[2]);
    doc.text(row[0], margin + 3, y + 3.3);
    doc.text(row[1], margin + 65, y + 3.3);
    doc.text(row[2], margin + 130, y + 3.3);
    y += 4.8;
  });

  y += 3;

  // ARTICLE 2
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('ARTICLE 2: MANDATORY ANNUAL LOCAL SUPPORT & ADMINISTRATIVE DEPOSIT', margin, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(slateBody[0], slateBody[1], slateBody[2]);
  const art2Intro = 'To guarantee physical campus access, proctored laboratory environments, high-speed connectivity, and ongoing academic support in Cameroon, all accepted candidates must deposit an Annual Local Support Charge of $707.79 USD TTC (400,000 FCFA) per academic year:';
  doc.text(doc.splitTextToSize(art2Intro, contentWidth), margin, y);
  y += 7;

  // Breakdown Box
  doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
  doc.roundedRect(margin, y, contentWidth, 23, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(bluePrimary[0], bluePrimary[1], bluePrimary[2]);
  doc.text('1. Administrative Fees: $265.42 USD TTC (150,000 FCFA)', margin + 3, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(slateBody[0], slateBody[1], slateBody[2]);
  doc.text('Covers local administrative onboarding, dossier auditing, degree verification support, WQ platform proctoring & status maintenance.', margin + 3, y + 8.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(bluePrimary[0], bluePrimary[1], bluePrimary[2]);
  doc.text('2. Support, Materials & Learning Resources: $442.37 USD TTC (250,000 FCFA)', margin + 3, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(slateBody[0], slateBody[1], slateBody[2]);
  doc.text('Funds Yaoundé campus infrastructure: 24/7 Solar Grid, dedicated Fiber-Optic Internet, Cisco Hardware & Labs, Cisco English Path & coaching.', margin + 3, y + 18);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('TOTAL ANNUAL DEPOSIT DUE: $707.79 USD TTC (400,000 FCFA)', margin + 3, y + 22);

  y += 27;

  // ARTICLE 3
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('ARTICLE 3: PAYMENT DEADLINES, TERMS & NON-REFUNDABILITY', margin, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.3);
  doc.setTextColor(slateBody[0], slateBody[1], slateBody[2]);
  const art3Text = [
    '• Mandatory Pre-Entry Deposit: Must be deposited into the designated IDLA account immediately upon receipt of Acceptance Letter to secure seat.',
    '• Non-Refundability: Strictly non-refundable once academic orientation and platform onboarding process begins.',
    '• Campus Access Clearance: Student badges, Wi-Fi credentials, and proctored lab privileges are strictly subject to full receipt of this deposit.'
  ];
  art3Text.forEach(t => {
    doc.text(doc.splitTextToSize(t, contentWidth), margin, y);
    y += 4.2;
  });

  y += 2;

  // ARTICLE 4
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('ARTICLE 4: STUDENT ACKNOWLEDGMENT & DECLARATION', margin, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.3);
  doc.setTextColor(slateBody[0], slateBody[1], slateBody[2]);
  const art4Text = 'I, the undersigned applicant, hereby acknowledge that I have read, understood, and accepted the official Scholarship Coverage Policy. I recognize that while my academic tuition is fully covered ($38,612 USD/year), all personal living costs, travel, housing, registration, and the annual local support deposit of $707.79 USD TTC (400,000 FCFA) remain my sole financial responsibility.';
  doc.text(doc.splitTextToSize(art4Text, contentWidth), margin, y);
  y += 10;

  // Signatures
  doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('Student Signature: ___________________________', margin + 4, y + 7);
  doc.text('Full Name: __________________________________', margin + 4, y + 14);
  doc.text('Date: ____ / ____ / 2026', margin + 4, y + 19);

  doc.text('Official Seal & Registrar Signature:', margin + 105, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(slateBody[0], slateBody[1], slateBody[2]);
  doc.text('IDLA Academic & Scholarship Board', margin + 105, y + 12);
  doc.text('Office of Admissions • Yaoundé Campus', margin + 105, y + 16);

  // Footer
  doc.setFontSize(6.8);
  doc.setTextColor(150, 150, 150);
  doc.text('International Distance Learning Academy (IDLA) • info@idlaacademy.online • https://idlaacademy.online', margin, 290);
  doc.text('Page 1 / 1', pageWidth - margin - 15, 290);

  // Save
  doc.save('IDLA_Official_Scholarship_Policy_MScFE_2026_2027.pdf');
}
