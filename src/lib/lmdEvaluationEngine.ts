import { 
  TeachingUnit, 
  StudentUERecord, 
  StudentSemesterResult, 
  SemesterDecision, 
  UERecordStatus, 
  LmdThresholdConfig, 
  DEFAULT_LMD_THRESHOLDS 
} from '../types';

/**
 * IDLA Academy — Moteur d'Évaluation et de Délibération LMD
 * Conforme au cadre réglementaire Bologne / EEES.
 * Fonctions pures, déterministes, auditables et sans effets de bord.
 */

export interface ComputedUeNote {
  note: number | null;
  isOverridden: boolean;
  formula: string;
}

export interface UeDeliberationDetail {
  ueId: string;
  ueCode: string;
  ueTitle: string;
  coefficient: number;
  isCompensable: boolean;
  noteSession1: number | null;
  noteRattrapage: number | null;
  effectiveNote: number | null;
  status: UERecordStatus;
  isCompensated: boolean;
  isEliminatory: boolean;
  isDefaillant: boolean;
  recordId?: string;
}

export interface SemesterDeliberationOutcome {
  studentEmail: string;
  semesterId: string;
  programId: string;
  moyenneSemestre: number | null;
  totalCoefficients: number;
  uesValidees: number;
  uesCompensees: number;
  uesNonValidees: number;
  uesDefaillantes: number;
  decision: SemesterDecision;
  isCompensationApplied: boolean;
  hasIncompleteNotes: boolean;
  details: UeDeliberationDetail[];
}

export const lmdEvaluationEngine = {
  /**
   * Arrondi réglementaire officiel à 2 décimales.
   */
  roundNote(val: number): number {
    return Math.round((val + Number.EPSILON) * 100) / 100;
  },

  /**
   * Calcul de la note finale de Session 1 pour une UE.
   * Gère le double mode : sous-notes pondérées M3C ou saisie directe de secours (isOverridden).
   */
  computeUeFinalNote(
    record: Partial<StudentUERecord>, 
    ue?: Partial<TeachingUnit>
  ): ComputedUeNote {
    // 1. Défaillance
    if (record.isDefaillant) {
      return { note: 0, isOverridden: false, formula: 'DEF (Défaillant)' };
    }

    // 2. Saisie directe forcée / de secours (isOverridden)
    if (record.isOverridden && record.noteFinal !== undefined && record.noteFinal !== null) {
      const rounded = this.roundNote(Math.max(0, Math.min(20, Number(record.noteFinal))));
      return { note: rounded, isOverridden: true, formula: 'Saisie directe' };
    }

    // 3. Sous-notes M3C
    const hasCC = record.noteCC !== undefined && record.noteCC !== null;
    const hasExam = record.noteExam !== undefined && record.noteExam !== null;
    const hasTP = record.noteTP !== undefined && record.noteTP !== null;

    if (!hasCC && !hasExam && !hasTP) {
      if (record.noteFinal !== undefined && record.noteFinal !== null) {
        return { 
          note: this.roundNote(Math.max(0, Math.min(20, Number(record.noteFinal)))), 
          isOverridden: false, 
          formula: 'Note finale enregistrée' 
        };
      }
      return { note: null, isOverridden: false, formula: 'Non noté' };
    }

    // Poids M3C configurés sur l'UE (ou valeurs par défaut 40/50/10)
    const wCC = Number(ue?.m3cWeightCC ?? 40);
    const wExam = Number(ue?.m3cWeightExam ?? 50);
    const wTP = Number(ue?.m3cWeightTP ?? 10);

    let totalWeight = 0;
    let weightedSum = 0;
    const parts: string[] = [];

    if (hasCC) {
      const nCC = Math.max(0, Math.min(20, Number(record.noteCC)));
      weightedSum += nCC * wCC;
      totalWeight += wCC;
      parts.push(`CC: ${nCC} (${wCC}%)`);
    }

    if (hasExam) {
      const nExam = Math.max(0, Math.min(20, Number(record.noteExam)));
      weightedSum += nExam * wExam;
      totalWeight += wExam;
      parts.push(`Exam: ${nExam} (${wExam}%)`);
    }

    if (hasTP) {
      const nTP = Math.max(0, Math.min(20, Number(record.noteTP)));
      weightedSum += nTP * wTP;
      totalWeight += wTP;
      parts.push(`TP: ${nTP} (${wTP}%)`);
    }

    if (totalWeight <= 0) {
      return { note: null, isOverridden: false, formula: 'Poids M3C invalides' };
    }

    const calculated = this.roundNote(weightedSum / totalWeight);
    return {
      note: calculated,
      isOverridden: false,
      formula: parts.join(' + ')
    };
  },

  /**
   * Règle stricte de conservation de la meilleure note au rattrapage :
   * Note_retenue = Max(Note_Session1, Note_Rattrapage)
   */
  computeBestOfNote(
    record: Partial<StudentUERecord>, 
    ue?: Partial<TeachingUnit>
  ): number | null {
    if (record.isDefaillant) return 0;

    const session1Computed = this.computeUeFinalNote(record, ue).note;
    const hasRattrapage = record.noteRattrapage !== undefined && record.noteRattrapage !== null;

    if (hasRattrapage) {
      const nRat = this.roundNote(Math.max(0, Math.min(20, Number(record.noteRattrapage))));
      if (session1Computed !== null) {
        return Math.max(session1Computed, nRat);
      }
      return nRat;
    }

    return session1Computed;
  },

  /**
   * Évaluation unitaire du statut d'une UE.
   */
  evaluateUeStatus(
    effectiveNote: number | null,
    isDefaillant: boolean = false,
    hasRattrapage: boolean = false,
    thresholds: LmdThresholdConfig = DEFAULT_LMD_THRESHOLDS
  ): UERecordStatus {
    if (isDefaillant) return 'defaillant';
    if (effectiveNote === null) return 'inscrit';
    if (effectiveNote >= thresholds.passingThreshold) return 'valide';
    if (hasRattrapage) return 'en_dette';
    return 'rattrapage';
  },

  /**
   * Délibération complète d'un semestre pour un étudiant :
   * - Moyenne générale pondérée par coefficients
   * - Traitement des notes éliminatoires (< 7.00)
   * - Traitement des UE verrou non compensables (isCompensable: false)
   * - Compensation intra-semestre intégrale si Moyenne >= 10.00
   * - Détermination de la décision officielle (ADM, ADM_COMP, AJAC, AJ, DEF, EN_COURS)
   */
  deliberateSemester(
    records: StudentUERecord[],
    ues: TeachingUnit[],
    studentEmail: string,
    semesterId: string,
    programId: string,
    thresholds: LmdThresholdConfig = DEFAULT_LMD_THRESHOLDS
  ): SemesterDeliberationOutcome {
    let totalWeightedPoints = 0;
    let totalCoefficients = 0;
    let hasIncompleteNotes = false;
    let hasDefaillant = false;

    const details: UeDeliberationDetail[] = [];

    for (const ue of ues) {
      const coeff = Number(ue.coefficient ?? 3);
      const isCompensable = ue.isCompensable !== false; // Défaut : compensable

      const rec = records.find(
        (r) => r.ueId === ue.id || (r as any).$id === ue.id
      );

      const isDef = !!rec?.isDefaillant;
      if (isDef) hasDefaillant = true;

      const session1Note = rec ? this.computeUeFinalNote(rec, ue).note : null;
      const rattrapageNote = rec?.noteRattrapage !== undefined && rec?.noteRattrapage !== null
        ? this.roundNote(Number(rec.noteRattrapage))
        : null;

      const effectiveNote = rec ? this.computeBestOfNote(rec, ue) : null;

      if (effectiveNote === null && !isDef) {
        hasIncompleteNotes = true;
      }

      const isEliminatory = effectiveNote !== null && effectiveNote < thresholds.eliminatoryThreshold;

      totalCoefficients += coeff;
      if (effectiveNote !== null) {
        totalWeightedPoints += effectiveNote * coeff;
      }

      details.push({
        ueId: ue.id,
        ueCode: ue.code,
        ueTitle: ue.title,
        coefficient: coeff,
        isCompensable,
        noteSession1: session1Note,
        noteRattrapage: rattrapageNote,
        effectiveNote,
        status: isDef ? 'defaillant' : (effectiveNote !== null && effectiveNote >= thresholds.passingThreshold ? 'valide' : 'non_valide'),
        isCompensated: false,
        isEliminatory,
        isDefaillant: isDef,
        recordId: rec?.id
      });
    }

    if (totalCoefficients === 0) {
      totalCoefficients = 1;
    }

    const moyenneSemestre = hasIncompleteNotes && details.every(d => d.effectiveNote === null)
      ? null
      : this.roundNote(totalWeightedPoints / totalCoefficients);

    // Si des notes manquent et la session n'est pas clôturée
    if (hasIncompleteNotes) {
      return {
        studentEmail,
        semesterId,
        programId,
        moyenneSemestre,
        totalCoefficients,
        uesValidees: details.filter((d) => d.status === 'valide').length,
        uesCompensees: 0,
        uesNonValidees: details.filter((d) => d.status === 'non_valide' || d.status === 'rattrapage').length,
        uesDefaillantes: details.filter((d) => d.isDefaillant).length,
        decision: 'EN_COURS',
        isCompensationApplied: false,
        hasIncompleteNotes: true,
        details
      };
    }

    // Défaillance bloquante
    if (hasDefaillant) {
      return {
        studentEmail,
        semesterId,
        programId,
        moyenneSemestre,
        totalCoefficients,
        uesValidees: details.filter((d) => d.status === 'valide').length,
        uesCompensees: 0,
        uesNonValidees: details.filter((d) => d.status !== 'valide').length,
        uesDefaillantes: details.filter((d) => d.isDefaillant).length,
        decision: 'DEF',
        isCompensationApplied: false,
        hasIncompleteNotes: false,
        details
      };
    }

    let isCompensationApplied = false;
    const isMoyenneAdmissible = moyenneSemestre !== null && moyenneSemestre >= thresholds.passingThreshold;

    // Analyse de compensation intra-semestre
    if (isMoyenneAdmissible) {
      // Toutes les UE non validées mais compensables et au-dessus de la note plancher sont compensées
      for (const item of details) {
        if (item.status !== 'valide') {
          // Condition de compensation :
          // 1. isCompensable === true (pas une UE verrou)
          // 2. effectiveNote >= note plancher (7.00)
          if (item.isCompensable && !item.isEliminatory) {
            item.status = 'compense';
            item.isCompensated = true;
            isCompensationApplied = true;
          } else {
            item.status = 'en_dette';
          }
        }
      }
    } else {
      // Moyenne < 10.00 : aucune compensation, les UE < 10 sont en dette / rattrapage
      for (const item of details) {
        if (item.status !== 'valide') {
          item.status = 'en_dette';
        }
      }
    }

    const uesValidees = details.filter((d) => d.status === 'valide').length;
    const uesCompensees = details.filter((d) => d.status === 'compense').length;
    const uesNonValidees = details.filter((d) => d.status === 'en_dette' || d.status === 'non_valide').length;
    const uesDefaillantes = details.filter((d) => d.status === 'defaillant').length;

    // Décision finale du jury
    let decision: SemesterDecision = 'EN_COURS';

    if (uesNonValidees === 0 && uesDefaillantes === 0) {
      decision = 'ADM'; // 100% des UE sont validées ou compensées
    } else if (uesNonValidees <= thresholds.maxDebtsForAjac) {
      decision = 'AJAC'; // Ajourné mais Autorisé à Continuer (dettes ≤ 2)
    } else {
      decision = 'AJ'; // Ajourné / Redoublement (dettes > 2)
    }

    return {
      studentEmail,
      semesterId,
      programId,
      moyenneSemestre,
      totalCoefficients,
      uesValidees,
      uesCompensees,
      uesNonValidees,
      uesDefaillantes,
      decision,
      isCompensationApplied,
      hasIncompleteNotes: false,
      details
    };
  },

  /**
   * Compensation annuelle entre deux semestres consécutifs (ex: S1 et S2).
   */
  deliberateAnnualCompensation(
    sem1Result: StudentSemesterResult,
    sem2Result: StudentSemesterResult,
    thresholds: LmdThresholdConfig = DEFAULT_LMD_THRESHOLDS
  ): {
    moyenneAnnuelle: number | null;
    totalCoefficients: number;
    decision: SemesterDecision;
    isCompensationApplied: boolean;
  } {
    if (
      sem1Result.decision === 'DEF' || 
      sem2Result.decision === 'DEF'
    ) {
      return {
        moyenneAnnuelle: null,
        totalCoefficients: sem1Result.totalCoefficients + sem2Result.totalCoefficients,
        decision: 'DEF',
        isCompensationApplied: false
      };
    }

    if (
      sem1Result.moyenneSemestre === undefined || 
      sem1Result.moyenneSemestre === null ||
      sem2Result.moyenneSemestre === undefined || 
      sem2Result.moyenneSemestre === null
    ) {
      return {
        moyenneAnnuelle: null,
        totalCoefficients: sem1Result.totalCoefficients + sem2Result.totalCoefficients,
        decision: 'EN_COURS',
        isCompensationApplied: false
      };
    }

    const totalCoeff = sem1Result.totalCoefficients + sem2Result.totalCoefficients;
    const weightedSum = 
      (sem1Result.moyenneSemestre * sem1Result.totalCoefficients) +
      (sem2Result.moyenneSemestre * sem2Result.totalCoefficients);

    const moyenneAnnuelle = this.roundNote(weightedSum / (totalCoeff > 0 ? totalCoeff : 1));

    if (moyenneAnnuelle >= thresholds.passingThreshold) {
      return {
        moyenneAnnuelle,
        totalCoefficients: totalCoeff,
        decision: 'ADM_COMP',
        isCompensationApplied: true
      };
    }

    const totalDebts = sem1Result.uesNonValidees + sem2Result.uesNonValidees;
    return {
      moyenneAnnuelle,
      totalCoefficients: totalCoeff,
      decision: totalDebts <= thresholds.maxDebtsForAjac ? 'AJAC' : 'AJ',
      isCompensationApplied: false
    };
  }
};
