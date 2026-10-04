import { describe, expect, it } from 'vitest';
import {
  applyAutomaticSignature,
  buildElectronicSignature,
  formatSubmissionDate,
  getApplicantLegalName,
  isElectronicSignatureField,
} from '../lib/formSignature';

describe('electronic signature', () => {
  it('formats the submission date as DD/MM/YYYY', () => {
    expect(formatSubmissionDate(new Date(2026, 8, 27))).toBe('27/09/2026');
  });

  it('builds Nom — date from the legal name', () => {
    expect(buildElectronicSignature('Jean Dupont', new Date(2026, 8, 27))).toBe(
      'Jean Dupont — 27/09/2026',
    );
  });

  it('detects the scholarship signature field', () => {
    expect(
      isElectronicSignatureField({
        id: 'applicant_signature',
        label: '21. Signature électronique du candidat & Date',
      }),
    ).toBe(true);
    expect(isElectronicSignatureField({ id: 'full_legal_name', label: '1. Nom complet légal' })).toBe(false);
  });

  it('reads the official name and fills the signature field', () => {
    const values = applyAutomaticSignature(
      [
        { id: 'full_legal_name', label: '1. Nom complet légal' },
        { id: 'applicant_signature', label: '21. Signature électronique du candidat & Date' },
      ],
      { full_legal_name: 'Jean Dupont' },
      new Date(2026, 8, 27),
    );

    expect(getApplicantLegalName(values)).toBe('Jean Dupont');
    expect(values.applicant_signature).toBe('Jean Dupont — 27/09/2026');
  });
});
