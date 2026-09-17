import { MSCFE_POLICY_PDF_FR_BASE64, MSCFE_POLICY_PDF_EN_BASE64 } from './mscfePolicyPdfBase64';

/**
 * Downloads the official IDLA Scholarship Coverage & Local Charges Policy PDF.
 * Supports both French and English authentic 2-page official documents.
 * 
 * @param lang 'fr' (default) | 'en'
 */
export function downloadMScFEPolicyPdf(lang: 'fr' | 'en' = 'fr'): void {
  const isEn = lang === 'en';
  const base64Data = isEn ? MSCFE_POLICY_PDF_EN_BASE64 : MSCFE_POLICY_PDF_FR_BASE64;
  const filename = isEn
    ? 'IDLA_Official_Scholarship_Policy_MScFE_2026_2027_EN.pdf'
    : 'IDLA_Official_Scholarship_Policy_MScFE_2026_2027.pdf';

  try {
    if (!base64Data || base64Data.length === 0) {
      throw new Error(`Embedded policy PDF base64 (${lang}) is empty`);
    }

    // 1. Convert embedded base64 to Blob for instantaneous offline-ready download
    const binary = atob(base64Data);
    const len = binary.length;
    const buffer = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      buffer[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([buffer], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 30000);
  } catch (err) {
    // 2. Fallback to static public file if atob/Blob fails
    console.warn('[IDLA Policy PDF] Fallback to static public file:', err);
    const a = document.createElement('a');
    a.href = `/${filename}`;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

export function downloadMScFEPolicyPdfFr(): void {
  downloadMScFEPolicyPdf('fr');
}

export function downloadMScFEPolicyPdfEn(): void {
  downloadMScFEPolicyPdf('en');
}
