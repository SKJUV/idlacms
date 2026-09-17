import { MSCFE_POLICY_PDF_BASE64 } from './mscfePolicyPdfBase64';

/**
 * Downloads the official IDLA Scholarship Coverage & Local Charges Policy PDF.
 * Uses the authentic 2-page official French document provided by the institution.
 */
export function downloadMScFEPolicyPdf(): void {
  const filename = 'IDLA_Official_Scholarship_Policy_MScFE_2026_2027.pdf';

  try {
    if (!MSCFE_POLICY_PDF_BASE64 || MSCFE_POLICY_PDF_BASE64.length === 0) {
      throw new Error('Embedded policy PDF base64 is empty');
    }

    // 1. Convert embedded base64 to Blob for instantaneous offline-ready download
    const binary = atob(MSCFE_POLICY_PDF_BASE64);
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
