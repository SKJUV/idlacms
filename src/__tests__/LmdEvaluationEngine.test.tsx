import { describe, it, expect } from 'vitest';
import { lmdEvaluationEngine } from '../lib/lmdEvaluationEngine';
import { TeachingUnit, StudentUERecord, StudentSemesterResult, DEFAULT_LMD_THRESHOLDS } from '../types';

describe('LMD Regulatory Framework — Evaluation & Deliberation Engine', () => {
  const mockUeStandard: TeachingUnit = {
    id: 'ue-1',
    programId: 'prog-1',
    semesterId: 'sem-1',
    code: 'INF101',
    title: 'Algorithmique & Structures de Données',
    coefficient: 4,
    isCompensable: true,
    m3cWeightCC: 40,
    m3cWeightExam: 50,
    m3cWeightTP: 10,
  };

  const mockUeVerrou: TeachingUnit = {
    id: 'ue-memoire',
    programId: 'prog-1',
    semesterId: 'sem-1',
    code: 'MEM101',
    title: 'Mémoire de Fin d\'Études / Stage',
    coefficient: 6,
    isCompensable: false, // UE verrou
    m3cWeightCC: 0,
    m3cWeightExam: 100,
    m3cWeightTP: 0,
  };

  describe('1. Granularité des Notes & M3C (Double Mode)', () => {
    it('calcule correctement la note finale à partir des sous-notes M3C (40% CC, 50% Exam, 10% TP)', () => {
      const record: Partial<StudentUERecord> = {
        noteCC: 12,
        noteExam: 14,
        noteTP: 16,
      };
      // (12*40 + 14*50 + 16*10) / 100 = (480 + 700 + 160) / 100 = 13.40
      const result = lmdEvaluationEngine.computeUeFinalNote(record, mockUeStandard);
      expect(result.note).toBe(13.40);
      expect(result.isOverridden).toBe(false);
    });

    it('respecte la saisie directe de secours (isOverridden: true)', () => {
      const record: Partial<StudentUERecord> = {
        noteCC: 12,
        noteExam: 14,
        noteTP: 16,
        noteFinal: 15.5,
        isOverridden: true,
      };
      const result = lmdEvaluationEngine.computeUeFinalNote(record, mockUeStandard);
      expect(result.note).toBe(15.5);
      expect(result.isOverridden).toBe(true);
      expect(result.formula).toBe('Saisie directe');
    });

    it('retourne note 0 et formula DEF en cas de défaillance', () => {
      const record: Partial<StudentUERecord> = {
        noteCC: 18,
        noteExam: 15,
        isDefaillant: true,
      };
      const result = lmdEvaluationEngine.computeUeFinalNote(record, mockUeStandard);
      expect(result.note).toBe(0);
      expect(result.formula).toContain('DEF');
    });
  });

  describe('2. Règle Stricte de la Meilleure Note au Rattrapage', () => {
    it('retient la note de rattrapage si elle est supérieure à la session 1', () => {
      const record: Partial<StudentUERecord> = {
        noteFinal: 8.5,
        isOverridden: true,
        noteRattrapage: 12.0,
      };
      const best = lmdEvaluationEngine.computeBestOfNote(record, mockUeStandard);
      expect(best).toBe(12.0);
    });

    it('retient la note de session 1 si le rattrapage est inférieur (règle du max)', () => {
      const record: Partial<StudentUERecord> = {
        noteFinal: 9.0,
        isOverridden: true,
        noteRattrapage: 6.5,
      };
      const best = lmdEvaluationEngine.computeBestOfNote(record, mockUeStandard);
      expect(best).toBe(9.0);
    });
  });

  describe('3. Compensation Intra-Semestre & Décisions de Jury', () => {
    const uesSem1: TeachingUnit[] = [
      { id: 'u1', programId: 'p1', semesterId: 's1', code: 'INF1', title: 'Prog', coefficient: 3, isCompensable: true },
      { id: 'u2', programId: 'p1', semesterId: 's1', code: 'INF2', title: 'Maths', coefficient: 3, isCompensable: true },
      { id: 'u3', programId: 'p1', semesterId: 's1', code: 'INF3', title: 'Réseaux', coefficient: 3, isCompensable: true },
    ];

    it('accorde ADM par compensation si Moyenne >= 10.00 et note faible >= 7.00', () => {
      // U1: 14 (coeff 3) = 42 pts
      // U2: 8 (coeff 3) = 24 pts (compensable car >= 7.00)
      // U3: 11 (coeff 3) = 33 pts
      // Total = 99 pts / 9 = 11.00 >= 10.00
      const records: StudentUERecord[] = [
        { id: 'r1', studentEmail: 'alice@test.com', ueId: 'u1', semesterId: 's1', programId: 'p1', sessionType: 'normale', status: 'inscrit', noteFinal: 14, isOverridden: true },
        { id: 'r2', studentEmail: 'alice@test.com', ueId: 'u2', semesterId: 's1', programId: 'p1', sessionType: 'normale', status: 'inscrit', noteFinal: 8, isOverridden: true },
        { id: 'r3', studentEmail: 'alice@test.com', ueId: 'u3', semesterId: 's1', programId: 'p1', sessionType: 'normale', status: 'inscrit', noteFinal: 11, isOverridden: true },
      ];

      const outcome = lmdEvaluationEngine.deliberateSemester(records, uesSem1, 'alice@test.com', 's1', 'p1');
      expect(outcome.moyenneSemestre).toBe(11.00);
      expect(outcome.decision).toBe('ADM');
      expect(outcome.isCompensationApplied).toBe(true);
      expect(outcome.uesCompensees).toBe(1);
      expect(outcome.uesValidees).toBe(2);
      expect(outcome.uesNonValidees).toBe(0);

      const u2Detail = outcome.details.find(d => d.ueId === 'u2');
      expect(u2Detail?.status).toBe('compense');
      expect(u2Detail?.isCompensated).toBe(true);
    });

    it('bloque la compensation d\'une note éliminatoire (< 7.00) et passe en AJAC (dettes <= 2)', () => {
      // U1: 17 (coeff 3) = 51 pts
      // U2: 5 (coeff 3) = 15 pts (ELIMINATOIRE car < 7.00)
      // U3: 12 (coeff 3) = 36 pts
      // Total = 102 pts / 9 = 11.33 >= 10.00
      const records: StudentUERecord[] = [
        { id: 'r1', studentEmail: 'bob@test.com', ueId: 'u1', semesterId: 's1', programId: 'p1', sessionType: 'normale', status: 'inscrit', noteFinal: 17, isOverridden: true },
        { id: 'r2', studentEmail: 'bob@test.com', ueId: 'u2', semesterId: 's1', programId: 'p1', sessionType: 'normale', status: 'inscrit', noteFinal: 5, isOverridden: true },
        { id: 'r3', studentEmail: 'bob@test.com', ueId: 'u3', semesterId: 's1', programId: 'p1', sessionType: 'normale', status: 'inscrit', noteFinal: 12, isOverridden: true },
      ];

      const outcome = lmdEvaluationEngine.deliberateSemester(records, uesSem1, 'bob@test.com', 's1', 'p1');
      expect(outcome.moyenneSemestre).toBe(11.33);
      expect(outcome.decision).toBe('AJAC'); // Ajourné avec autorisation de continuer avec dette
      expect(outcome.uesNonValidees).toBe(1);
      
      const u2Detail = outcome.details.find(d => d.ueId === 'u2');
      expect(u2Detail?.isEliminatory).toBe(true);
      expect(u2Detail?.status).toBe('en_dette');
      expect(u2Detail?.isCompensated).toBe(false);
    });

    it('interdit la compensation sur une UE verrou (isCompensable: false)', () => {
      const uesWithVerrou: TeachingUnit[] = [
        ...uesSem1,
        mockUeVerrou, // Coeff 6, non compensable
      ];

      // U1: 15 (3) = 45
      // U2: 15 (3) = 45
      // U3: 15 (3) = 45
      // Verrou: 9 (6) = 54 (non compensable, requiert >= 10)
      // Total = 189 / 15 = 12.60 >= 10.00
      const records: StudentUERecord[] = [
        { id: 'r1', studentEmail: 'claire@test.com', ueId: 'u1', semesterId: 's1', programId: 'p1', sessionType: 'normale', status: 'inscrit', noteFinal: 15, isOverridden: true },
        { id: 'r2', studentEmail: 'claire@test.com', ueId: 'u2', semesterId: 's1', programId: 'p1', sessionType: 'normale', status: 'inscrit', noteFinal: 15, isOverridden: true },
        { id: 'r3', studentEmail: 'claire@test.com', ueId: 'u3', semesterId: 's1', programId: 'p1', sessionType: 'normale', status: 'inscrit', noteFinal: 15, isOverridden: true },
        { id: 'r4', studentEmail: 'claire@test.com', ueId: 'ue-memoire', semesterId: 's1', programId: 'p1', sessionType: 'normale', status: 'inscrit', noteFinal: 9, isOverridden: true },
      ];

      const outcome = lmdEvaluationEngine.deliberateSemester(records, uesWithVerrou, 'claire@test.com', 's1', 'p1');
      expect(outcome.moyenneSemestre).toBe(12.60);
      expect(outcome.decision).toBe('AJAC'); // Mémoire en dette, ne peut être validé
      
      const verrouDetail = outcome.details.find(d => d.ueId === 'ue-memoire');
      expect(verrouDetail?.isCompensable).toBe(false);
      expect(verrouDetail?.status).toBe('en_dette');
    });

    it('déclare AJ (Ajourné / Redoublement) si plus de 2 UE en dette', () => {
      // 3 UE non validées, moyenne < 10.00
      const records: StudentUERecord[] = [
        { id: 'r1', studentEmail: 'david@test.com', ueId: 'u1', semesterId: 's1', programId: 'p1', sessionType: 'normale', status: 'inscrit', noteFinal: 7, isOverridden: true },
        { id: 'r2', studentEmail: 'david@test.com', ueId: 'u2', semesterId: 's1', programId: 'p1', sessionType: 'normale', status: 'inscrit', noteFinal: 8, isOverridden: true },
        { id: 'r3', studentEmail: 'david@test.com', ueId: 'u3', semesterId: 's1', programId: 'p1', sessionType: 'normale', status: 'inscrit', noteFinal: 8, isOverridden: true },
      ];
      // Moyenne = 7.67 < 10.00, 3 dettes > 2
      const outcome = lmdEvaluationEngine.deliberateSemester(records, uesSem1, 'david@test.com', 's1', 'p1');
      expect(outcome.decision).toBe('AJ');
      expect(outcome.uesNonValidees).toBe(3);
    });

    it('déclare DEF (Défaillant) immédiatement si une défaillance est présente', () => {
      const records: StudentUERecord[] = [
        { id: 'r1', studentEmail: 'eva@test.com', ueId: 'u1', semesterId: 's1', programId: 'p1', sessionType: 'normale', status: 'inscrit', noteFinal: 18, isOverridden: true },
        { id: 'r2', studentEmail: 'eva@test.com', ueId: 'u2', semesterId: 's1', programId: 'p1', sessionType: 'normale', status: 'inscrit', isDefaillant: true },
        { id: 'r3', studentEmail: 'eva@test.com', ueId: 'u3', semesterId: 's1', programId: 'p1', sessionType: 'normale', status: 'inscrit', noteFinal: 16, isOverridden: true },
      ];
      const outcome = lmdEvaluationEngine.deliberateSemester(records, uesSem1, 'eva@test.com', 's1', 'p1');
      expect(outcome.decision).toBe('DEF');
      expect(outcome.uesDefaillantes).toBe(1);
    });
  });

  describe('4. Compensation Annuelle (Inter-Semestres)', () => {
    it('accorde ADM_COMP si la moyenne annuelle pondérée des deux semestres est >= 10.00', () => {
      const sem1: StudentSemesterResult = {
        id: 'res-s1',
        studentEmail: 'frank@test.com',
        programId: 'p1',
        semesterId: 's1',
        moyenneSemestre: 9.40,
        totalCoefficients: 15,
        uesValidees: 4,
        uesNonValidees: 1,
        uesCompensees: 0,
        uesDefaillantes: 0,
        decision: 'AJAC',
        isCompensationApplied: false,
      };

      const sem2: StudentSemesterResult = {
        id: 'res-s2',
        studentEmail: 'frank@test.com',
        programId: 'p1',
        semesterId: 's2',
        moyenneSemestre: 11.20,
        totalCoefficients: 15,
        uesValidees: 5,
        uesNonValidees: 0,
        uesCompensees: 0,
        uesDefaillantes: 0,
        decision: 'ADM',
        isCompensationApplied: false,
      };

      // Moyenne annuelle = (9.40*15 + 11.20*15) / 30 = 10.30 >= 10.00
      const annualOutcome = lmdEvaluationEngine.deliberateAnnualCompensation(sem1, sem2);
      expect(annualOutcome.moyenneAnnuelle).toBe(10.30);
      expect(annualOutcome.decision).toBe('ADM_COMP');
      expect(annualOutcome.isCompensationApplied).toBe(true);
    });

    it('retourne EN_COURS et bloque la compensation annuelle si l\'un des semestres est EN_COURS', () => {
      const sem1: StudentSemesterResult = {
        id: 'res-s1',
        studentEmail: 'frank@test.com',
        programId: 'p1',
        semesterId: 's1',
        moyenneSemestre: 12.00,
        totalCoefficients: 15,
        uesValidees: 5,
        uesNonValidees: 0,
        uesCompensees: 0,
        uesDefaillantes: 0,
        decision: 'ADM',
        isCompensationApplied: false,
      };

      const sem2: StudentSemesterResult = {
        id: 'res-s2',
        studentEmail: 'frank@test.com',
        programId: 'p1',
        semesterId: 's2',
        moyenneSemestre: 14.00,
        totalCoefficients: 15,
        uesValidees: 2,
        uesNonValidees: 0,
        uesCompensees: 0,
        uesDefaillantes: 0,
        decision: 'EN_COURS',
        isCompensationApplied: false,
      };

      const annualOutcome = lmdEvaluationEngine.deliberateAnnualCompensation(sem1, sem2);
      expect(annualOutcome.decision).toBe('EN_COURS');
      expect(annualOutcome.isCompensationApplied).toBe(false);
      expect(annualOutcome.moyenneAnnuelle).toBeNull();
    });

    it('retourne ADM sans compensation si les deux semestres sont déjà admis individuellement', () => {
      const sem1: StudentSemesterResult = {
        id: 'res-s1',
        studentEmail: 'frank@test.com',
        programId: 'p1',
        semesterId: 's1',
        moyenneSemestre: 12.00,
        totalCoefficients: 15,
        uesValidees: 5,
        uesNonValidees: 0,
        uesCompensees: 0,
        uesDefaillantes: 0,
        decision: 'ADM',
        isCompensationApplied: false,
      };

      const sem2: StudentSemesterResult = {
        id: 'res-s2',
        studentEmail: 'frank@test.com',
        programId: 'p1',
        semesterId: 's2',
        moyenneSemestre: 13.00,
        totalCoefficients: 15,
        uesValidees: 5,
        uesNonValidees: 0,
        uesCompensees: 0,
        uesDefaillantes: 0,
        decision: 'ADM',
        isCompensationApplied: false,
      };

      const annualOutcome = lmdEvaluationEngine.deliberateAnnualCompensation(sem1, sem2);
      expect(annualOutcome.decision).toBe('ADM');
      expect(annualOutcome.isCompensationApplied).toBe(false);
      expect(annualOutcome.moyenneAnnuelle).toBe(12.50);
    });
  });

  describe('5. Garde-fous et Cas Limites LMD', () => {
    it('renvoie EN_COURS et 0 coefficients si la liste d\'UE est vide (ne jamais accorder ADM sur 0 UE)', () => {
      const outcome = lmdEvaluationEngine.deliberateSemester([], [], 'student@test.com', 's1', 'p1');
      expect(outcome.decision).toBe('EN_COURS');
      expect(outcome.moyenneSemestre).toBeNull();
      expect(outcome.totalCoefficients).toBe(0);
      expect(outcome.uesValidees).toBe(0);
    });

    it('calcule la moyenne provisoire uniquement sur les UE évaluées sans déflater par les coefficients manquants', () => {
      const ues: TeachingUnit[] = [
        { id: 'u1', programId: 'p1', semesterId: 's1', code: 'U1', title: 'UE1', coefficient: 3, isCompensable: true },
        { id: 'u2', programId: 'p1', semesterId: 's1', code: 'U2', title: 'UE2', coefficient: 3, isCompensable: true },
      ];
      // Seule U1 est notée à 16/20. U2 n'a pas encore de note.
      const records: StudentUERecord[] = [
        { id: 'r1', studentEmail: 'test@test.com', ueId: 'u1', semesterId: 's1', programId: 'p1', sessionType: 'normale', status: 'inscrit', noteFinal: 16, isOverridden: true },
      ];

      const outcome = lmdEvaluationEngine.deliberateSemester(records, ues, 'test@test.com', 's1', 'p1');
      expect(outcome.decision).toBe('EN_COURS');
      expect(outcome.hasIncompleteNotes).toBe(true);
      // La moyenne provisoire doit être 16.00 (sur l'UE notée), et NON 16*3/(3+3) = 8.00 !
    });
  });
});
