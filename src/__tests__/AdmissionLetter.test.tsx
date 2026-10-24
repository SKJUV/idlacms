import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateMatricule, generateAdmissionLetterPdfDoc, downloadAdmissionLetterPdf } from '../lib/admissionLetter';

describe('AdmissionLetter - PDF and Matricule Generation', () => {
  beforeEach(() => {
    (window as any).__IDLA_TEST_ENV__ = true;
    (window as any).__LAST_SAVED_PDF__ = null;
  });

  afterEach(() => {
    delete (window as any).__IDLA_TEST_ENV__;
    delete (window as any).__LAST_SAVED_PDF__;
  });

  it('generates consistent and valid matricules based on candidate ID', () => {
    const mat1 = generateMatricule('john.doe@example.com');
    const mat2 = generateMatricule('john.doe@example.com');
    const mat3 = generateMatricule('alice.smith@example.com');

    expect(mat1).toBe(mat2);
    expect(mat1).toMatch(/^\d{2}IDLA\d{3}$/);
    expect(mat3).toMatch(/^\d{2}IDLA\d{3}$/);
  });

  it('generates sequential matricules when index is provided', () => {
    const matA = generateMatricule('candidate-1', 1);
    const matB = generateMatricule('candidate-1', 2);

    expect(matA).not.toBe(matB);
    expect(matA).toMatch(/^\d{2}IDLA\d{3}$/);
    expect(matB).toMatch(/^\d{2}IDLA\d{3}$/);
  });

  it('generates an official jsPDF document with valid metadata and content', () => {
    const doc = generateAdmissionLetterPdfDoc({
      name: 'Juvenal Sineng',
      email: 'juvenal@example.com',
      program: 'Master en Cybersécurité & Réseaux',
      entryLevel: 'Master 1 (M1)',
      matricule: '26IDLA042',
      dateApplied: '15/09/2026'
    });

    expect(doc).toBeDefined();
    expect(doc.internal.pageSize.getWidth()).toBeCloseTo(210, 0);
    expect(doc.internal.pageSize.getHeight()).toBeCloseTo(297, 0);

    const output = doc.output('datauristring');
    expect(output).toContain('data:application/pdf');
  });

  it('handles downloadAdmissionLetterPdf gracefully and records file download', () => {
    const candidate = {
      name: 'Test Student',
      email: 'student@test.com',
      program: 'Licence Informatique',
      entryLevel: 'L1',
      matricule: '26IDLA999'
    };

    expect(() => downloadAdmissionLetterPdf(candidate)).not.toThrow();
    expect((window as any).__LAST_SAVED_PDF__).toBe('Attestation_Admission_IDLA_26IDLA999.pdf');
  });
});
