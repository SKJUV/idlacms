const LEGAL_NAME_KEYS = [
  'full_legal_name',
  '1. Nom complet légal',
  '1. Full Legal Name / Nom complet légal',
  '1. Full Legal Name',
  'Nom complet légal',
  'Nom complet',
  'Nom & Prénom',
  'Nom',
  'Nom de famille',
];

export function formatSubmissionDate(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

export function isElectronicSignatureField(field: { id?: string; label?: string; label_en?: string }): boolean {
  const id = (field.id || '').toLowerCase();
  const label = `${field.label || ''} ${field.label_en || ''}`.toLowerCase();
  return id === 'applicant_signature' || id.includes('signature') || label.includes('signature');
}

export function getApplicantLegalName(values: Record<string, any>): string {
  for (const key of LEGAL_NAME_KEYS) {
    const value = values[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  const match = Object.entries(values).find(([key, value]) => {
    if (typeof value !== 'string' || !value.trim()) return false;
    if (isElectronicSignatureField({ id: key, label: key })) return false;
    if (!/name|nom/i.test(key)) return false;
    return !/university|institution|signature/i.test(key);
  });

  return match ? String(match[1]).trim() : '';
}

export function buildElectronicSignature(name: string, date: Date = new Date()): string {
  const legalName = name.trim();
  if (!legalName) return '';
  return `${legalName} — ${formatSubmissionDate(date)}`;
}

export function applyAutomaticSignature(
  fields: Array<{ id: string; label: string; label_en?: string }>,
  values: Record<string, any>,
  date: Date = new Date(),
): Record<string, any> {
  const signature = buildElectronicSignature(getApplicantLegalName(values), date);
  if (!signature) return values;

  const next = { ...values };
  for (const field of fields) {
    if (!isElectronicSignatureField(field)) continue;
    next[field.id] = signature;
    next[field.label] = signature;
  }
  return next;
}
