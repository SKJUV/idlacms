import React, { useState, useEffect, useMemo } from 'react';
import { 
  GraduationCap, BookOpen, Plus, Calendar, CheckCircle2, XCircle, AlertTriangle, 
  Trash2, Edit3, UserCheck, RefreshCw, Layers, Search, Save, Clock, ChevronRight,
  ChevronDown, ShieldCheck, AlertCircle, ArrowRight, FileSpreadsheet, Sliders, CheckSquare, 
  FileDown, Lock, Unlock, Sparkles, Award
} from 'lucide-react';
import { 
  Program, Semester, TeachingUnit, StudentUERecord, SemesterStatus, UERecordStatus,
  StudentSemesterResult, SemesterDecision, DEFAULT_LMD_THRESHOLDS, LmdThresholdConfig
} from '../../types';
import { dbAdapter } from '../../lib/dbAdapter';
import { lmdEvaluationEngine } from '../../lib/lmdEvaluationEngine';

interface EvaluationGridRowProps {
  rec: StudentUERecord;
  ue?: TeachingUnit;
  sem?: Semester;
  onSave: (recordId: string, updates: any) => Promise<void>;
  onFastStatus: (recordId: string, status: UERecordStatus, sessionType: any) => Promise<void>;
}

function EvaluationGridRow({ rec, ue, sem, onSave, onFastStatus }: EvaluationGridRowProps) {
  const [noteCC, setNoteCC] = useState<string>(rec.noteCC !== undefined && rec.noteCC !== null ? String(rec.noteCC) : '');
  const [noteExam, setNoteExam] = useState<string>(rec.noteExam !== undefined && rec.noteExam !== null ? String(rec.noteExam) : '');
  const [noteTP, setNoteTP] = useState<string>(rec.noteTP !== undefined && rec.noteTP !== null ? String(rec.noteTP) : '');
  const [noteFinal, setNoteFinal] = useState<string>(rec.noteFinal !== undefined && rec.noteFinal !== null ? String(rec.noteFinal) : '');
  const [isOverridden, setIsOverridden] = useState<boolean>(!!rec.isOverridden);
  const [noteRattrapage, setNoteRattrapage] = useState<string>(rec.noteRattrapage !== undefined && rec.noteRattrapage !== null ? String(rec.noteRattrapage) : '');
  const [isDefaillant, setIsDefaillant] = useState<boolean>(!!rec.isDefaillant);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    setNoteCC(rec.noteCC !== undefined && rec.noteCC !== null ? String(rec.noteCC) : '');
    setNoteExam(rec.noteExam !== undefined && rec.noteExam !== null ? String(rec.noteExam) : '');
    setNoteTP(rec.noteTP !== undefined && rec.noteTP !== null ? String(rec.noteTP) : '');
    setNoteFinal(rec.noteFinal !== undefined && rec.noteFinal !== null ? String(rec.noteFinal) : '');
    setIsOverridden(!!rec.isOverridden);
    setNoteRattrapage(rec.noteRattrapage !== undefined && rec.noteRattrapage !== null ? String(rec.noteRattrapage) : '');
    setIsDefaillant(!!rec.isDefaillant);
  }, [rec]);

  const liveOutcome = useMemo(() => {
    const nCC = noteCC !== '' ? Number(noteCC) : undefined;
    const nExam = noteExam !== '' ? Number(noteExam) : undefined;
    const nTP = noteTP !== '' ? Number(noteTP) : undefined;
    const nFinal = noteFinal !== '' ? Number(noteFinal) : undefined;
    const nRat = noteRattrapage !== '' ? Number(noteRattrapage) : undefined;

    const session1 = lmdEvaluationEngine.computeUeFinalNote({
      noteCC: nCC,
      noteExam: nExam,
      noteTP: nTP,
      noteFinal: nFinal,
      isOverridden,
      isDefaillant
    }, ue);

    const bestOf = lmdEvaluationEngine.computeBestOfNote({
      noteCC: nCC,
      noteExam: nExam,
      noteTP: nTP,
      noteFinal: session1.note ?? undefined,
      isOverridden,
      noteRattrapage: nRat,
      isDefaillant
    }, ue);

    return {
      session1Note: session1.note,
      formula: session1.formula,
      bestOfNote: bestOf,
    };
  }, [noteCC, noteExam, noteTP, noteFinal, isOverridden, noteRattrapage, isDefaillant, ue]);

  const handleCommit = async () => {
    setIsSaving(true);
    try {
      await onSave(rec.id, {
        noteCC: noteCC !== '' ? Number(noteCC) : null,
        noteExam: noteExam !== '' ? Number(noteExam) : null,
        noteTP: noteTP !== '' ? Number(noteTP) : null,
        noteFinal: isOverridden && noteFinal !== '' ? Number(noteFinal) : liveOutcome.session1Note,
        isOverridden,
        noteRattrapage: noteRattrapage !== '' ? Number(noteRattrapage) : null,
        isDefaillant
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isEliminatory = liveOutcome.bestOfNote !== null && liveOutcome.bestOfNote < DEFAULT_LMD_THRESHOLDS.eliminatoryThreshold;

  return (
    <tr className="hover:bg-bg-primary/40 transition-colors text-xs">
      <td className="p-3.5">
        <div className="font-bold text-text-primary">{rec.studentName || 'Étudiant'}</div>
        <div className="text-[11px] text-text-secondary">{rec.studentEmail}</div>
      </td>
      <td className="p-3.5">
        <div className="font-bold text-text-primary flex items-center gap-1.5">
          <span>{ue ? ue.title : 'UE inconnue'}</span>
          {ue?.isCompensable === false && (
            <span className="text-[9px] bg-rose-500/10 text-rose-600 border border-rose-500/30 px-1.5 py-0.5 rounded font-bold inline-flex items-center gap-0.5" title="UE Verrou non compensable">
              <Lock className="w-2.5 h-2.5" /> Verrou
            </span>
          )}
        </div>
        <div className="text-[11px] font-mono text-brand-primary">
          {ue?.code} • Coeff. {ue?.coefficient ?? 3} • {sem?.name}
        </div>
      </td>
      <td className="p-3.5">
        <div className="flex items-center gap-1.5">
          <div className="space-y-0.5 text-center">
            <span className="text-[9px] text-text-secondary block font-bold">CC ({ue?.m3cWeightCC ?? 40}%)</span>
            <input
              type="number"
              min={0}
              max={20}
              step={0.25}
              disabled={isDefaillant}
              value={noteCC}
              onChange={(e) => setNoteCC(e.target.value)}
              placeholder="—"
              className="w-14 bg-bg-primary border border-border-primary rounded-lg px-1.5 py-1 text-xs text-center font-mono font-bold text-text-primary disabled:opacity-40"
            />
          </div>
          <div className="space-y-0.5 text-center">
            <span className="text-[9px] text-text-secondary block font-bold">Exam ({ue?.m3cWeightExam ?? 50}%)</span>
            <input
              type="number"
              min={0}
              max={20}
              step={0.25}
              disabled={isDefaillant}
              value={noteExam}
              onChange={(e) => setNoteExam(e.target.value)}
              placeholder="—"
              className="w-14 bg-bg-primary border border-border-primary rounded-lg px-1.5 py-1 text-xs text-center font-mono font-bold text-text-primary disabled:opacity-40"
            />
          </div>
          <div className="space-y-0.5 text-center">
            <span className="text-[9px] text-text-secondary block font-bold">TP ({ue?.m3cWeightTP ?? 10}%)</span>
            <input
              type="number"
              min={0}
              max={20}
              step={0.25}
              disabled={isDefaillant}
              value={noteTP}
              onChange={(e) => setNoteTP(e.target.value)}
              placeholder="—"
              className="w-14 bg-bg-primary border border-border-primary rounded-lg px-1.5 py-1 text-xs text-center font-mono font-bold text-text-primary disabled:opacity-40"
            />
          </div>
        </div>
      </td>
      <td className="p-3.5">
        <div className="space-y-1">
          {isOverridden ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={20}
                step={0.25}
                disabled={isDefaillant}
                value={noteFinal}
                onChange={(e) => setNoteFinal(e.target.value)}
                className="w-16 bg-amber-500/10 border border-amber-500/30 rounded-lg px-1.5 py-1 text-xs text-center font-mono font-bold text-amber-600"
                placeholder="0-20"
              />
              <button
                type="button"
                onClick={() => setIsOverridden(false)}
                className="text-[10px] text-text-secondary hover:text-text-primary font-bold underline cursor-pointer"
                title="Revenir au calcul automatique M3C"
              >
                Auto
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className={`font-mono text-sm font-bold ${liveOutcome.session1Note !== null ? (liveOutcome.session1Note >= 10 ? 'text-emerald-600' : 'text-rose-600') : 'text-text-secondary'}`}>
                {liveOutcome.session1Note !== null ? `${liveOutcome.session1Note.toFixed(2)}` : '—'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOverridden(true);
                  if (liveOutcome.session1Note !== null) setNoteFinal(String(liveOutcome.session1Note));
                }}
                className="text-[10px] text-text-secondary hover:text-brand-primary p-1 border border-border-primary rounded cursor-pointer"
                title="Forcer la saisie manuelle (Override)"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="text-[9px] text-text-secondary truncate max-w-[120px]" title={liveOutcome.formula}>
            {isOverridden ? 'Saisie directe' : liveOutcome.formula}
          </div>
        </div>
      </td>
      <td className="p-3.5">
        <div className="space-y-0.5 text-center">
          <input
            type="number"
            min={0}
            max={20}
            step={0.25}
            disabled={isDefaillant}
            value={noteRattrapage}
            onChange={(e) => setNoteRattrapage(e.target.value)}
            placeholder="—"
            className="w-16 bg-bg-primary border border-border-primary rounded-lg px-1.5 py-1 text-xs text-center font-mono font-bold text-text-primary disabled:opacity-40"
          />
          {noteRattrapage !== '' && (
            <span className="text-[9px] text-amber-500 font-bold block">Session 2</span>
          )}
        </div>
      </td>
      <td className="p-3.5">
        <div>
          <div className="flex items-center gap-1 font-mono font-bold text-sm">
            {liveOutcome.bestOfNote !== null ? (
              <span className={liveOutcome.bestOfNote >= 10 ? 'text-emerald-600' : (isEliminatory ? 'text-rose-600 font-extrabold' : 'text-amber-600')}>
                {liveOutcome.bestOfNote.toFixed(2)}
              </span>
            ) : (
              <span className="text-text-secondary">—</span>
            )}
            <span className="text-[10px] text-text-secondary font-normal">/20</span>
          </div>
          {isEliminatory && (
            <span className="text-[9px] text-rose-600 font-bold block">Éliminatoire (&lt;7)</span>
          )}
        </div>
      </td>
      <td className="p-3.5">
        <div className="space-y-1">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
              isDefaillant
                ? 'bg-rose-500/20 text-rose-700 border-rose-500/40'
                : rec.status === 'valide'
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                : rec.status === 'compense'
                ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                : rec.status === 'rattrapage'
                ? 'bg-sky-500/10 text-sky-600 border-sky-500/20'
                : rec.status === 'en_dette'
                ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                : 'bg-bg-primary text-text-secondary border-border-primary'
            }`}
          >
            {isDefaillant ? 'DÉFAILLANT' : rec.status.toUpperCase()}
          </span>

          <label className="flex items-center gap-1 text-[10px] text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={isDefaillant}
              onChange={(e) => setIsDefaillant(e.target.checked)}
              className="rounded text-rose-600 focus:ring-rose-500 h-3 w-3"
            />
            <span>Absence / DEF</span>
          </label>
        </div>
      </td>
      <td className="p-3.5 text-right">
        <button
          type="button"
          onClick={handleCommit}
          disabled={isSaving}
          className="bg-brand-primary hover:bg-brand-hover text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
        >
          {isSaving ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span>Enregistrer</span>
        </button>
      </td>
    </tr>
  );
}

interface AcademicStructureProps {
  programs: Program[];
  logActivity?: (type: any, user: string, text: string) => Promise<void>;
}

export default function AcademicStructure({ programs, logActivity }: AcademicStructureProps) {
  // ── Selected Program State ──
  const [selectedProgramId, setSelectedProgramId] = useState<string>(() => {
    return programs.length > 0 ? programs[0].id : '';
  });
  const [programSearch, setProgramSearch] = useState('');
  const [filterActiveOnly, setFilterActiveOnly] = useState<boolean>(true);

  // ── Tabs ──
  const [activeTab, setActiveTab] = useState<'semesters_ue' | 'evaluations' | 'deliberations'>('semesters_ue');

  // ── Data states ──
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [teachingUnits, setTeachingUnits] = useState<TeachingUnit[]>([]);
  const [studentRecords, setStudentRecords] = useState<StudentUERecord[]>([]);
  const [teachersList, setTeachersList] = useState<{ id: string; name: string; email: string; assignedPrograms?: string[] }[]>([]);
  const [acceptedStudents, setAcceptedStudents] = useState<any[]>([]);
  const [allUesList, setAllUesList] = useState<TeachingUnit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Semester UI & Form ──
  const [expandedSemesterId, setExpandedSemesterId] = useState<string | null>(null);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);

  // ── UE Form modal (LMD M3C & Coefficients) ──
  const [showUeModal, setShowUeModal] = useState(false);
  const [editingUe, setEditingUe] = useState<TeachingUnit | null>(null);
  const [targetSemesterIdForUe, setTargetSemesterIdForUe] = useState<string>('');
  const [ueCode, setUeCode] = useState('');
  const [ueTitle, setUeTitle] = useState('');
  const [ueTeacherId, setUeTeacherId] = useState('');
  const [ueVolumeCM, setUeVolumeCM] = useState(20);
  const [ueVolumeTD, setUeVolumeTD] = useState(10);
  const [ueVolumeTP, setUeVolumeTP] = useState(10);
  const [ueDescription, setUeDescription] = useState('');
  const [uePrerequisite, setUePrerequisite] = useState('');
  const [ueCoefficient, setUeCoefficient] = useState(3);
  const [ueIsCompensable, setUeIsCompensable] = useState(true);
  const [ueM3cWeightCC, setUeM3cWeightCC] = useState(40);
  const [ueM3cWeightExam, setUeM3cWeightExam] = useState(50);
  const [ueM3cWeightTP, setUeM3cWeightTP] = useState(10);

  // ── Evaluation & Deliberation States ──
  const [evalSemesterFilter, setEvalSemesterFilter] = useState<string>('all');
  const [evalUeFilter, setEvalUeFilter] = useState<string>('all');
  const [evalSearch, setEvalSearch] = useState('');
  const [delibSemesterId, setDelibSemesterId] = useState<string>('all');
  const [semesterResults, setSemesterResults] = useState<StudentSemesterResult[]>([]);
  const [isDeliberating, setIsDeliberating] = useState(false);
  const [expandedDelibStudentEmail, setExpandedDelibStudentEmail] = useState<string | null>(null);
  const [annualSem1Id, setAnnualSem1Id] = useState<string>('');
  const [annualSem2Id, setAnnualSem2Id] = useState<string>('');
  const [annualResults, setAnnualResults] = useState<any[]>([]);

  // ── Année Académique & Niveaux d'Étude ──
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(() => {
    return localStorage.getItem('idla_academic_year') || '2026-2027';
  });
  const academicYearsList = ['2025-2026', '2026-2027', '2027-2028', '2028-2029'];

  // Calcul des statistiques d'attribution et d'activité par programme
  const programStats = useMemo(() => {
    const stats: Record<string, { teachersCount: number; studentsCount: number; uesCount: number; isActive: boolean }> = {};
    
    programs.forEach((prog) => {
      const pTitleLower = (prog.title || '').toLowerCase().trim();
      const pId = prog.id;

      // Enseignants affectés
      const teachers = teachersList.filter((t) => {
        const hasAssigned = (t.assignedPrograms || []).some((ap: string) => {
          const apLower = ap.toLowerCase().trim();
          return apLower === pTitleLower || apLower.startsWith(pTitleLower) || pTitleLower.startsWith(apLower);
        });
        const hasUe = allUesList.some((u) => u.programId === pId && (u.teacherId === t.id || (u.teacherName && u.teacherName.toLowerCase().trim() === t.name.toLowerCase().trim())));
        return hasAssigned || hasUe;
      });

      // Étudiants admis
      const students = acceptedStudents.filter((s) => {
        if (s.programId && s.programId === pId) return true;
        const sProg = (s.program || '').toLowerCase().trim();
        return sProg === pTitleLower || sProg.includes(pTitleLower) || pTitleLower.includes(sProg);
      });

      // UEs configurées
      const ues = allUesList.filter((u) => u.programId === pId);

      const isActive = teachers.length > 0 || students.length > 0 || ues.length > 0;
      stats[pId] = {
        teachersCount: teachers.length,
        studentsCount: students.length,
        uesCount: ues.length,
        isActive
      };
    });

    return stats;
  }, [programs, teachersList, acceptedStudents, allUesList]);

  const activeProgramsCount = useMemo(() => {
    return programs.filter((p) => programStats[p.id]?.isActive).length;
  }, [programs, programStats]);

  const displayedPrograms = useMemo(() => {
    let list = programs;
    if (filterActiveOnly) {
      const activeList = list.filter((p) => programStats[p.id]?.isActive);
      if (activeList.length > 0) {
        list = activeList;
      }
    }
    if (!programSearch.trim()) return list;
    const q = programSearch.toLowerCase();
    return list.filter((p) => p.title.toLowerCase().includes(q) || p.type.toLowerCase().includes(q));
  }, [programs, programStats, filterActiveOnly, programSearch]);

  const filteredPrograms = displayedPrograms;

  const selectedProgram = useMemo(() => {
    return displayedPrograms.find((p) => p.id === selectedProgramId) || programs.find((p) => p.id === selectedProgramId) || displayedPrograms[0] || programs[0] || null;
  }, [displayedPrograms, programs, selectedProgramId]);

  const semestersByLevel = useMemo(() => {
    const groups: Array<{
      levelKey: string;
      levelTitle: string;
      levelSubtitle: string;
      semesters: Semester[];
    }> = [];

    const isMaster = selectedProgram?.type === 'Master';
    const isDoctorat = selectedProgram?.type === 'Doctorat';
    const isCertif = selectedProgram?.type === 'Certification';

    if (isCertif) {
      groups.push({
        levelKey: 'Certifiant',
        levelTitle: 'Formation Continue & Certifiante',
        levelSubtitle: 'Modules spécialisés et certifications professionnelles',
        semesters: semesters,
      });
    } else if (isMaster) {
      const m1Sems = semesters.filter(s => (s.academicLevel === 'M1') || (s.number <= 2));
      if (m1Sems.length > 0) {
        groups.push({
          levelKey: 'M1',
          levelTitle: 'Niveau Master 1 (M1) — 1ère Année de Master',
          levelSubtitle: 'Approfondissement des fondamentaux et spécialisation initiale (Semestres 1 & 2)',
          semesters: m1Sems,
        });
      }
      const m2Sems = semesters.filter(s => (s.academicLevel === 'M2') || (s.number >= 3));
      if (m2Sems.length > 0) {
        groups.push({
          levelKey: 'M2',
          levelTitle: 'Niveau Master 2 (M2) — 2ème Année de Master',
          levelSubtitle: 'Expertise avancée, stage de fin d\'études et mémoire professionnel (Semestres 3 & 4)',
          semesters: m2Sems,
        });
      }
    } else if (isDoctorat) {
      const d1Sems = semesters.filter(s => (s.academicLevel === 'D1') || (s.number <= 2));
      const d2Sems = semesters.filter(s => (s.academicLevel === 'D2') || (s.number === 3 || s.number === 4));
      const d3Sems = semesters.filter(s => (s.academicLevel === 'D3') || (s.number >= 5));
      if (d1Sems.length > 0) groups.push({ levelKey: 'D1', levelTitle: 'Doctorat 1ère Année (D1)', levelSubtitle: 'Recherche doctorale et séminaires méthodologiques (Semestres 1 & 2)', semesters: d1Sems });
      if (d2Sems.length > 0) groups.push({ levelKey: 'D2', levelTitle: 'Doctorat 2ème Année (D2)', levelSubtitle: 'Travaux de recherche et publications scientifiques (Semestres 3 & 4)', semesters: d2Sems });
      if (d3Sems.length > 0) groups.push({ levelKey: 'D3', levelTitle: 'Doctorat 3ème Année (D3)', levelSubtitle: 'Finalisation de la thèse et soutenance devant jury (Semestres 5 & 6)', semesters: d3Sems });
    } else {
      // Licence / Bachelor: L1, L2, L3
      const l1Sems = semesters.filter(s => (s.academicLevel === 'L1') || (s.number <= 2));
      const l2Sems = semesters.filter(s => (s.academicLevel === 'L2') || (s.number === 3 || s.number === 4));
      const l3Sems = semesters.filter(s => (s.academicLevel === 'L3') || (s.number >= 5));
      if (l1Sems.length > 0) {
        groups.push({
          levelKey: 'L1',
          levelTitle: 'Niveau Licence 1 (L1) — 1ère Année de Bachelor',
          levelSubtitle: 'Acquisition des socles fondamentaux et méthodologies universitaires (Semestres 1 & 2)',
          semesters: l1Sems,
        });
      }
      if (l2Sems.length > 0) {
        groups.push({
          levelKey: 'L2',
          levelTitle: 'Niveau Licence 2 (L2) — 2ème Année de Bachelor',
          levelSubtitle: 'Consolidation des compétences techniques et enseignements appliqués (Semestres 3 & 4)',
          semesters: l2Sems,
        });
      }
      if (l3Sems.length > 0) {
        groups.push({
          levelKey: 'L3',
          levelTitle: 'Niveau Licence 3 (L3) — 3ème Année de Bachelor',
          levelSubtitle: 'Approfondissement métier, projet tuteuré et diplomation (Semestres 5 & 6)',
          semesters: l3Sems,
        });
      }
    }

    return groups;
  }, [semesters, selectedProgram]);

  // Synchroniser la sélection par défaut dès que la liste active est résolue
  useEffect(() => {
    if (displayedPrograms.length > 0 && !displayedPrograms.some((p) => p.id === selectedProgramId)) {
      setSelectedProgramId(displayedPrograms[0].id);
    }
  }, [displayedPrograms, selectedProgramId]);

  // Load all LMD data when selected program changes
  useEffect(() => {
    if (!selectedProgramId) return;
    loadProgramLmdData(selectedProgramId);
  }, [selectedProgramId]);

  // Load teachers & applications on mount
  useEffect(() => {
    loadTeachersAndStudents();
  }, []);

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const loadTeachersAndStudents = async () => {
    try {
      // 1. Teachers directly from unified dbAdapter (Appwrite cms_users + teachers collection + localStorage)
      const [teachers, apps, ues] = await Promise.all([
        dbAdapter.teachers.list(),
        dbAdapter.applications.list(),
        dbAdapter.teachingUnits.list()
      ]);

      setTeachersList(teachers.map((t: any) => ({
        id: t.id || (t as any).$id,
        name: t.name || `${(t as any).firstName || ''} ${(t as any).lastName || ''}`.trim() || t.email,
        email: t.email,
        assignedPrograms: t.assignedPrograms || [],
        speciality: t.speciality || ''
      })));

      setAcceptedStudents(apps.filter((a) => (a.status || '').toLowerCase() === 'accepted'));
      setAllUesList(ues);
    } catch (e) {
      console.warn('Error loading teachers/students:', e);
    }
  };

  const loadProgramLmdData = async (progId: string) => {
    setIsLoading(true);
    try {
      const [sems, ues, recs, delibs] = await Promise.all([
        dbAdapter.semesters.list(progId),
        dbAdapter.teachingUnits.list(progId),
        dbAdapter.studentUeRecords.list({ programId: progId }),
        dbAdapter.studentSemesterResults.list({ programId: progId })
      ]);
      setSemesters(sems);
      setTeachingUnits(ues);
      setStudentRecords(recs);
      setSemesterResults(delibs);

      if (sems.length > 0 && !expandedSemesterId) {
        setExpandedSemesterId(sems[0].id);
      }
      if (sems.length > 0 && delibSemesterId === 'all') {
        setDelibSemesterId(sems[0].id);
      }
    } catch (e: any) {
      showToast('Erreur lors du chargement des données LMD: ' + e.message, true);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Sync / Import existing courses from teacher schedules / levels / local data ──
  const handleSyncExistingCourses = async () => {
    if (!selectedProgram) return;
    setIsLoading(true);
    try {
      const res = await dbAdapter.academicStructure.syncAllExistingCourses(selectedProgram.id);
      
      const [sems, ues] = await Promise.all([
        dbAdapter.semesters.list(selectedProgram.id),
        dbAdapter.teachingUnits.list(selectedProgram.id)
      ]);
      setSemesters(sems);
      setTeachingUnits(ues);

      if (res.imported > 0) {
        showToast(`${res.imported} cours historique(s) importé(s) et ventilé(s) par niveau d'étude ! (${res.alreadySynced} déjà synchronisé(s))`);
        if (logActivity) logActivity('article', 'Admin', `Synchronisation de ${res.imported} cours LMD pour ${selectedProgram.title}`);
      } else if (res.alreadySynced > 0) {
        showToast(`Tous les cours (${res.alreadySynced}) sont déjà synchronisés et ventilés pour ce programme.`);
      } else {
        showToast("Aucun cours ou emploi du temps existant à importer pour ce programme.");
      }
    } catch (e: any) {
      showToast("Erreur synchronisation : " + e.message, true);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Auto-generate Semesters based on program type, academic year & level ──
  const handleAutoGenerateSemesters = async () => {
    if (!selectedProgram) return;
    const progType = selectedProgram.type;
    let count = 6;
    if (progType === 'Master') count = 4;
    else if (progType === 'Doctorat') count = 6;
    else if (progType === 'Certification') count = 1;

    const [startYrStr] = selectedAcademicYear.split('-');
    const baseYear = parseInt(startYrStr, 10) || new Date().getFullYear();
    const created: Semester[] = [];

    setIsLoading(true);
    try {
      for (let i = 1; i <= count; i++) {
        const isOdd = i % 2 !== 0;
        const yearOffset = Math.floor((i - 1) / 2);
        const yr = baseYear + yearOffset;

        const startMonth = isOdd ? `01 Octobre ${yr}` : `01 Mars ${yr + 1}`;
        const endMonth = isOdd ? `28 Février ${yr + 1}` : `31 Juillet ${yr + 1}`;
        const rattrapageStart = isOdd ? `01 Mars ${yr + 1}` : `01 Août ${yr + 1}`;
        const rattrapageEnd = isOdd ? `15 Mars ${yr + 1}` : `15 Août ${yr + 1}`;

        const isMaster = progType === 'Master';
        let academicLevel = 'L1';
        if (isMaster) {
          academicLevel = i <= 2 ? 'M1' : 'M2';
        } else if (progType === 'Doctorat') {
          academicLevel = i <= 2 ? 'D1' : (i <= 4 ? 'D2' : 'D3');
        } else if (progType === 'Certification') {
          academicLevel = 'Certifiant';
        } else {
          academicLevel = i <= 2 ? 'L1' : (i <= 4 ? 'L2' : 'L3');
        }

        const sem = await dbAdapter.semesters.create({
          programId: selectedProgram.id,
          name: `Semestre ${i} (S${i})`,
          number: i,
          academicYear: selectedAcademicYear,
          academicLevel,
          startDate: startMonth,
          endDate: endMonth,
          rattrapageStartDate: rattrapageStart,
          rattrapageEndDate: rattrapageEnd,
          status: i === 1 ? 'actif' : 'cloture'
        });
        created.push(sem);
      }

      setSemesters(created);
      if (created.length > 0) setExpandedSemesterId(created[0].id);
      showToast(`${count} semestres générés pour ${selectedProgram.title} (${selectedAcademicYear}) !`);
      if (logActivity) logActivity('article', 'Admin', `Génération de ${count} semestres LMD pour ${selectedProgram.title} (${selectedAcademicYear})`);
    } catch (e: any) {
      showToast('Erreur génération semestres: ' + e.message, true);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Open Add UE Modal ──
  const handleOpenAddUeModal = (semesterId: string) => {
    setEditingUe(null);
    setTargetSemesterIdForUe(semesterId);
    setUeCode(`UE${Math.floor(100 + Math.random() * 900)}`);
    setUeTitle('');
    setUeTeacherId('');
    setUeVolumeCM(20);
    setUeVolumeTD(10);
    setUeVolumeTP(10);
    setUeDescription('');
    setUePrerequisite('');
    setUeCoefficient(3);
    setUeIsCompensable(true);
    setUeM3cWeightCC(40);
    setUeM3cWeightExam(50);
    setUeM3cWeightTP(10);
    setShowUeModal(true);
  };

  const handleOpenEditUeModal = (ue: TeachingUnit) => {
    setEditingUe(ue);
    setTargetSemesterIdForUe(ue.semesterId);
    setUeCode(ue.code);
    setUeTitle(ue.title);
    setUeTeacherId(ue.teacherId || '');
    setUeVolumeCM(ue.volumeCM || 20);
    setUeVolumeTD(ue.volumeTD || 10);
    setUeVolumeTP(ue.volumeTP || 10);
    setUeDescription(ue.description || '');
    setUePrerequisite(ue.prerequisiteUeId || '');
    setUeCoefficient(ue.coefficient !== undefined ? ue.coefficient : 3);
    setUeIsCompensable(ue.isCompensable !== false);
    setUeM3cWeightCC(ue.m3cWeightCC !== undefined ? ue.m3cWeightCC : 40);
    setUeM3cWeightExam(ue.m3cWeightExam !== undefined ? ue.m3cWeightExam : 50);
    setUeM3cWeightTP(ue.m3cWeightTP !== undefined ? ue.m3cWeightTP : 10);
    setShowUeModal(true);
  };

  // ── Save UE ──
  const handleSaveUe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ueCode.trim() || !ueTitle.trim() || !targetSemesterIdForUe || !selectedProgram) {
      showToast('Veuillez renseigner le code et le titre de l\'UE', true);
      return;
    }

    const totalWeights = ueM3cWeightCC + ueM3cWeightExam + ueM3cWeightTP;
    if (totalWeights !== 100 && totalWeights !== 0) {
      showToast(`Attention : La somme des pondérations M3C doit être égale à 100% (actuellement ${totalWeights}%)`, true);
      return;
    }

    const teacher = teachersList.find((t) => t.id === ueTeacherId);
    const teacherName = teacher ? teacher.name : '';

    try {
      if (editingUe) {
        await dbAdapter.teachingUnits.update(editingUe.id, {
          code: ueCode.trim().toUpperCase(),
          title: ueTitle.trim(),
          teacherId: ueTeacherId || '',
          teacherName,
          volumeCM: ueVolumeCM,
          volumeTD: ueVolumeTD,
          volumeTP: ueVolumeTP,
          description: ueDescription,
          prerequisiteUeId: uePrerequisite || '',
          coefficient: ueCoefficient,
          isCompensable: ueIsCompensable,
          m3cWeightCC: ueM3cWeightCC,
          m3cWeightExam: ueM3cWeightExam,
          m3cWeightTP: ueM3cWeightTP,
        });
        showToast(`UE "${ueTitle}" mise à jour.`);
      } else {
        await dbAdapter.teachingUnits.create({
          programId: selectedProgram.id,
          semesterId: targetSemesterIdForUe,
          code: ueCode.trim().toUpperCase(),
          title: ueTitle.trim(),
          teacherId: ueTeacherId || '',
          teacherName,
          volumeCM: ueVolumeCM,
          volumeTD: ueVolumeTD,
          volumeTP: ueVolumeTP,
          description: ueDescription,
          prerequisiteUeId: uePrerequisite || '',
          coefficient: ueCoefficient,
          isCompensable: ueIsCompensable,
          m3cWeightCC: ueM3cWeightCC,
          m3cWeightExam: ueM3cWeightExam,
          m3cWeightTP: ueM3cWeightTP,
        });
        showToast(`UE "${ueTitle}" créée avec succès.`);
      }

      setShowUeModal(false);
      const updatedUes = await dbAdapter.teachingUnits.list(selectedProgram.id);
      setTeachingUnits(updatedUes);
    } catch (err: any) {
      showToast('Erreur enregistrement UE: ' + err.message, true);
    }
  };

  // ── Delete UE ──
  const handleDeleteUe = async (ueId: string, ueTitle: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'UE "${ueTitle}" ?`)) return;
    try {
      await dbAdapter.teachingUnits.delete(ueId);
      setTeachingUnits((prev) => prev.filter((u) => u.id !== ueId));
      showToast(`UE "${ueTitle}" supprimée.`);
    } catch (e: any) {
      showToast('Erreur suppression: ' + e.message, true);
    }
  };

  // ── Update Semester Dates / Status ──
  const handleSaveSemesterConfig = async (sem: Semester) => {
    try {
      await dbAdapter.semesters.update(sem.id, {
        startDate: sem.startDate,
        endDate: sem.endDate,
        rattrapageStartDate: sem.rattrapageStartDate,
        rattrapageEndDate: sem.rattrapageEndDate,
        status: sem.status
      });
      showToast(`Semestre ${sem.name} mis à jour.`);
      setEditingSemester(null);
      const updated = await dbAdapter.semesters.list(selectedProgramId);
      setSemesters(updated);
    } catch (e: any) {
      showToast('Erreur mise à jour semestre: ' + e.message, true);
    }
  };

  // ── Auto-enroll accepted students in Semester UEs ──
  const handleBulkEnrollStudents = async (semesterId: string) => {
    if (!selectedProgram) return;
    const semesterUes = teachingUnits.filter((u) => u.semesterId === semesterId);
    if (semesterUes.length === 0) {
      showToast('Aucune UE dans ce semestre. Créez d\'abord des UE.', true);
      return;
    }

    const progStudents = acceptedStudents.filter((a) => {
      const p = (a.program || '').trim().toLowerCase();
      const selP = (selectedProgram.title || '').trim().toLowerCase();
      return p === selP || p.includes(selP) || selP.includes(p);
    });

    if (progStudents.length === 0) {
      showToast(`Aucun étudiant admis trouvé pour le programme "${selectedProgram.title}".`, true);
      return;
    }

    setIsLoading(true);
    try {
      let enrollCount = 0;
      for (const student of progStudents) {
        for (const ue of semesterUes) {
          const already = studentRecords.some(
            (r) => r.studentEmail.toLowerCase() === (student.email || '').toLowerCase() && r.ueId === ue.id
          );
          if (!already) {
            await dbAdapter.studentUeRecords.create({
              studentEmail: student.email,
              studentName: student.name || 'Étudiant',
              ueId: ue.id,
              semesterId,
              programId: selectedProgram.id,
              sessionType: 'normale',
              status: 'inscrit',
              remarks: 'Inscription automatique en début de semestre'
            });
            enrollCount++;
          }
        }
      }

      const updatedRecs = await dbAdapter.studentUeRecords.list({ programId: selectedProgram.id });
      setStudentRecords(updatedRecs);
      showToast(`${enrollCount} inscription(s) aux UE créée(s) pour ${progStudents.length} étudiant(s).`);
    } catch (e: any) {
      showToast('Erreur lors des inscriptions: ' + e.message, true);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Note Saving & Real-time M3C Evaluation Handler ──
  const handleSaveRecordGrades = async (
    recordId: string,
    updates: {
      noteCC?: number | null;
      noteExam?: number | null;
      noteTP?: number | null;
      noteFinal?: number | null;
      isOverridden?: boolean;
      noteRattrapage?: number | null;
      isDefaillant?: boolean;
    }
  ) => {
    const rec = studentRecords.find((r) => r.id === recordId);
    if (!rec) return;

    const ue = teachingUnits.find((u) => u.id === rec.ueId);
    const merged = { ...rec, ...updates };

    // Calcul de la note Session 1 et de la meilleure note
    const computedFinal = lmdEvaluationEngine.computeUeFinalNote(merged, ue).note;
    const effectiveNote = lmdEvaluationEngine.computeBestOfNote({ ...merged, noteFinal: computedFinal ?? undefined }, ue);

    let status: UERecordStatus = 'inscrit';
    if (merged.isDefaillant) {
      status = 'defaillant';
    } else if (effectiveNote !== null) {
      if (effectiveNote >= DEFAULT_LMD_THRESHOLDS.passingThreshold) {
        status = 'valide';
      } else if (merged.noteRattrapage !== undefined && merged.noteRattrapage !== null) {
        status = 'en_dette';
      } else {
        status = 'rattrapage';
      }
    }

    const payload: Partial<StudentUERecord> = {
      noteCC: updates.noteCC !== undefined ? (updates.noteCC ?? undefined) : rec.noteCC,
      noteExam: updates.noteExam !== undefined ? (updates.noteExam ?? undefined) : rec.noteExam,
      noteTP: updates.noteTP !== undefined ? (updates.noteTP ?? undefined) : rec.noteTP,
      noteFinal: computedFinal ?? undefined,
      isOverridden: updates.isOverridden !== undefined ? updates.isOverridden : rec.isOverridden,
      noteRattrapage: updates.noteRattrapage !== undefined ? (updates.noteRattrapage ?? undefined) : rec.noteRattrapage,
      noteBestOf: effectiveNote ?? undefined,
      isDefaillant: updates.isDefaillant !== undefined ? updates.isDefaillant : rec.isDefaillant,
      status,
      sessionType: (updates.noteRattrapage !== undefined && updates.noteRattrapage !== null) ? 'rattrapage' : rec.sessionType,
      validatedBy: 'Administrateur',
      validatedAt: new Date().toLocaleDateString('fr-FR'),
    };

    try {
      await dbAdapter.studentUeRecords.update(recordId, payload);
      setStudentRecords((prev) => prev.map((r) => (r.id === recordId ? { ...r, ...payload } : r)));
      showToast('Notes enregistrées et statut actualisé.');
    } catch (err: any) {
      showToast('Erreur sauvegarde notes: ' + err.message, true);
    }
  };

  // ── Manual Evaluation (Validé / Non Validé / Rattrapage) ──
  const handleUpdateEvaluation = async (recordId: string, newStatus: UERecordStatus, sessionType: 'normale' | 'rattrapage' = 'normale') => {
    try {
      const nowStr = new Date().toLocaleDateString('fr-FR');
      await dbAdapter.studentUeRecords.update(recordId, {
        status: newStatus,
        sessionType,
        validatedBy: 'Administrateur',
        validatedAt: nowStr
      });

      setStudentRecords((prev) =>
        prev.map((r) =>
          r.id === recordId
            ? { ...r, status: newStatus, sessionType, validatedBy: 'Administrateur', validatedAt: nowStr }
            : r
        )
      );
      showToast(`Évaluation enregistrée : ${newStatus.toUpperCase()}`);
    } catch (e: any) {
      showToast('Erreur validation: ' + e.message, true);
    }
  };

  // ── Official LMD Deliberation Calculation (Bologne EEES) ──
  const studentDeliberations = useMemo(() => {
    if (!selectedProgram) return [];

    const progStudents = acceptedStudents.filter((a) => {
      const p = (a.program || '').trim().toLowerCase();
      const selP = (selectedProgram.title || '').trim().toLowerCase();
      return p === selP || p.includes(selP) || selP.includes(p);
    });

    const targetSemesters = delibSemesterId === 'all' 
      ? semesters 
      : semesters.filter((s) => s.id === delibSemesterId);

    return progStudents.map((student) => {
      const studentEmail = (student.email || '').toLowerCase().trim();
      const records = studentRecords.filter((r) => r.studentEmail.toLowerCase().trim() === studentEmail);

      const semesterOutcomes = targetSemesters.map((sem) => {
        const semUes = teachingUnits.filter((u) => u.semesterId === sem.id);
        const semRecords = records.filter((r) => r.semesterId === sem.id);
        const outcome = lmdEvaluationEngine.deliberateSemester(
          semRecords,
          semUes,
          studentEmail,
          sem.id,
          selectedProgram.id,
          DEFAULT_LMD_THRESHOLDS
        );
        const savedResult = semesterResults.find(
          (sr) => sr.studentEmail.toLowerCase().trim() === studentEmail && sr.semesterId === sem.id
        );

        return {
          semester: sem,
          outcome,
          savedResult
        };
      });

      return {
        student,
        studentEmail,
        studentName: student.name || studentEmail,
        matricule: student.matricule || 'N/A',
        entryLevel: student.entryLevel || 'L1',
        semesterOutcomes
      };
    });
  }, [selectedProgram, acceptedStudents, studentRecords, teachingUnits, semesters, delibSemesterId, semesterResults]);

  // ── Commit & Close Semester Deliberation ──
  const handleCommitDeliberation = async (
    studentEmail: string,
    studentName: string,
    semesterId: string,
    outcome: ReturnType<typeof lmdEvaluationEngine.deliberateSemester>
  ) => {
    if (!selectedProgram) return;
    setIsLoading(true);
    try {
      const saved = await dbAdapter.studentSemesterResults.save({
        studentEmail,
        studentName,
        programId: selectedProgram.id,
        semesterId,
        academicYear: selectedAcademicYear,
        moyenneSemestre: outcome.moyenneSemestre ?? undefined,
        totalCoefficients: outcome.totalCoefficients,
        uesValidees: outcome.uesValidees,
        uesNonValidees: outcome.uesNonValidees,
        uesCompensees: outcome.uesCompensees,
        uesDefaillantes: outcome.uesDefaillantes,
        decision: outcome.decision,
        isCompensationApplied: outcome.isCompensationApplied,
        deliberatedBy: 'Jury Académique IDLA',
        deliberatedAt: new Date().toLocaleDateString('fr-FR'),
      });

      // Mettre à jour les enregistrements d'UE de l'étudiant avec les décisions de compensation
      for (const d of outcome.details) {
        if (d.recordId) {
          await dbAdapter.studentUeRecords.update(d.recordId, {
            status: d.status,
            isCompensated: d.isCompensated,
            noteBestOf: d.effectiveNote ?? undefined,
            validatedBy: 'Jury Académique IDLA',
            validatedAt: new Date().toLocaleDateString('fr-FR'),
          });
        }
      }

      setSemesterResults((prev) => {
        const next = prev.filter((r) => !(r.studentEmail.toLowerCase().trim() === studentEmail.toLowerCase().trim() && r.semesterId === semesterId));
        return [...next, saved];
      });

      const refreshed = await dbAdapter.studentUeRecords.list({ programId: selectedProgram.id });
      setStudentRecords(refreshed);

      showToast(`Délibération enregistrée pour ${studentName} : ${outcome.decision}`);
      if (logActivity) logActivity('article', 'Admin', `Délibération validée (${outcome.decision}) pour ${studentEmail}`);
    } catch (e: any) {
      showToast('Erreur délibération: ' + e.message, true);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Run Annual Compensation ──
  const handleRunAnnualCompensation = () => {
    if (!annualSem1Id || !annualSem2Id) {
      showToast('Veuillez sélectionner un semestre impair et un semestre pair.', true);
      return;
    }
    const results: any[] = [];
    studentDeliberations.forEach((st) => {
      const s1 = st.semesterOutcomes.find((so) => so.semester.id === annualSem1Id)?.savedResult;
      const s2 = st.semesterOutcomes.find((so) => so.semester.id === annualSem2Id)?.savedResult;
      if (s1 && s2) {
        const annual = lmdEvaluationEngine.deliberateAnnualCompensation(s1, s2);
        results.push({
          studentEmail: st.studentEmail,
          studentName: st.studentName,
          matricule: st.matricule,
          annual
        });
      }
    });
    setAnnualResults(results);
    showToast(`Calcul de compensation annuelle exécuté pour ${results.length} étudiant(s).`);
  };

  // ── Export Deliberation PV to CSV ──
  const handleExportDeliberationCsv = () => {
    if (studentDeliberations.length === 0) return;
    const headers = ['Matricule', 'Nom', 'Email', 'Semestre', 'Moyenne /20', 'Total Coeff', 'UE Validees', 'UE Compensees', 'UE en Dette', 'Defaillances', 'Decision Jury'];
    const rows: string[][] = [];
    studentDeliberations.forEach((st) => {
      st.semesterOutcomes.forEach((so) => {
        rows.push([
          st.matricule,
          st.studentName,
          st.studentEmail,
          so.semester.name,
          so.outcome.moyenneSemestre !== null ? so.outcome.moyenneSemestre.toFixed(2) : 'N/A',
          String(so.outcome.totalCoefficients),
          String(so.outcome.uesValidees),
          String(so.outcome.uesCompensees),
          String(so.outcome.uesNonValidees),
          String(so.outcome.uesDefaillantes),
          so.outcome.decision
        ]);
      });
    });
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PV_Deliberation_${selectedProgram?.title || 'LMD'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('PV de Délibération exporté au format CSV.');
  };

  // Filtered evaluation records
  const filteredRecords = useMemo(() => {
    return studentRecords.filter((rec) => {
      if (evalSemesterFilter !== 'all' && rec.semesterId !== evalSemesterFilter) return false;
      if (evalUeFilter !== 'all' && rec.ueId !== evalUeFilter) return false;
      if (evalSearch.trim()) {
        const q = evalSearch.toLowerCase();
        const sName = (rec.studentName || '').toLowerCase();
        const sEmail = rec.studentEmail.toLowerCase();
        if (!sName.includes(q) && !sEmail.includes(q)) return false;
      }
      return true;
    });
  }, [studentRecords, evalSemesterFilter, evalUeFilter, evalSearch]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Feedback */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">Structure Académique &amp; Gestion LMD</h1>
              <p className="text-xs text-text-secondary">
                Gouvernance des Semestres, Unités d'Enseignement (UE), Calendrier des Rattrapages et Délibérations de Passage.
              </p>
            </div>
          </div>

          {/* Program Selector & Filter Toggle */}
          <div className="w-full lg:w-auto space-y-2">
            {/* Année Académique & Filter Toggle */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-bg-primary px-3 py-1.5 rounded-xl border border-border-primary">
                <Calendar className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                <span className="text-[11px] font-bold text-text-secondary">Année :</span>
                <select
                  value={selectedAcademicYear}
                  onChange={(e) => {
                    const yr = e.target.value;
                    setSelectedAcademicYear(yr);
                    localStorage.setItem('idla_academic_year', yr);
                  }}
                  className="bg-transparent text-xs font-bold text-text-primary outline-none cursor-pointer"
                >
                  {academicYearsList.map((yr) => (
                    <option key={yr} value={yr} className="bg-bg-secondary text-text-primary">
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 bg-bg-primary p-1 rounded-xl border border-border-primary text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setFilterActiveOnly(true)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    filterActiveOnly
                      ? 'bg-brand-primary text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <span>Formations Actives</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterActiveOnly ? 'bg-white/20 text-white' : 'bg-brand-primary/10 text-brand-primary'}`}>
                    {activeProgramsCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterActiveOnly(false)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    !filterActiveOnly
                      ? 'bg-brand-primary text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <span>Tous les programmes</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${!filterActiveOnly ? 'bg-white/20 text-white' : 'bg-bg-secondary text-text-secondary'}`}>
                    {programs.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Select dropdown */}
            <div className="relative">
              <select
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                className="w-full lg:w-[420px] bg-bg-primary border border-border-primary rounded-xl px-3.5 py-2.5 text-xs font-bold text-text-primary outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer truncate"
              >
                {displayedPrograms.map((prog) => {
                  const stats = programStats[prog.id];
                  const details = stats?.isActive
                    ? `(${stats.studentsCount} étud. • ${stats.teachersCount} ens. • ${stats.uesCount} UE)`
                    : '(Non configuré)';
                  return (
                    <option key={prog.id} value={prog.id}>
                      [{prog.type}] {prog.title} {details}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Selected Program Summary Pills */}
        {selectedProgram && (
          <div className="pt-4 border-t border-border-primary/50 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold px-2.5 py-1 rounded-lg bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                {selectedProgram.type || 'Formation'}
              </span>
              <span className="font-bold text-text-primary text-sm">
                {selectedProgram.title}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-bg-primary px-3 py-1 rounded-lg border border-border-primary">
                <span className="text-[11px] text-text-secondary font-medium">Étudiants admis :</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {programStats[selectedProgram.id]?.studentsCount || 0}
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-bg-primary px-3 py-1 rounded-lg border border-border-primary">
                <span className="text-[11px] text-text-secondary font-medium">Enseignants affectés :</span>
                <span className="font-bold text-brand-primary">
                  {programStats[selectedProgram.id]?.teachersCount || 0}
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-bg-primary px-3 py-1 rounded-lg border border-border-primary">
                <span className="text-[11px] text-text-secondary font-medium">UE configurées :</span>
                <span className="font-bold text-text-primary">
                  {teachingUnits.length}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action banner if no semesters configured */}
        {selectedProgram && semesters.length === 0 && !isLoading && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>Cette formation n'a pas encore de Semestres ou d'UEs initialisés dans la structure LMD.</span>
            </div>
            <button
              type="button"
              onClick={async () => {
                setIsLoading(true);
                try {
                  await dbAdapter.academicStructure.ensureProgramInitialized(selectedProgram.id);
                  showToast('Semestre 1 (S1) initialisé avec succès.');
                  await loadProgramLmdData(selectedProgram.id);
                  const ues = await dbAdapter.teachingUnits.list();
                  setAllUesList(ues);
                } catch (e: any) {
                  showToast('Erreur initialisation: ' + e.message, true);
                } finally {
                  setIsLoading(false);
                }
              }}
              className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-sm shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Initialiser Semestre 1 (S1)
            </button>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border-primary gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('semesters_ue')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'semesters_ue'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Layers className="w-4 h-4" />
          Semestres &amp; Unités d'Enseignement ({semesters.length})
        </button>

        <button
          onClick={() => setActiveTab('evaluations')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'evaluations'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Inscriptions &amp; Suivi des Évaluations ({studentRecords.length})
        </button>

        <button
          onClick={() => setActiveTab('deliberations')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'deliberations'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Délibérations &amp; Rattrapages ({studentDeliberations.length})
        </button>
      </div>

      {/* ── TAB 1 : Semestres & UE ── */}
      {activeTab === 'semesters_ue' && (
        <div className="space-y-6">
          {semesters.length === 0 ? (
            <div className="bg-bg-secondary border border-border-primary rounded-2xl p-10 text-center space-y-4">
              <div className="w-14 h-14 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mx-auto">
                <BookOpen className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-text-primary">Aucun semestre configuré</h3>
                <p className="text-xs text-text-secondary">
                  Pour activer le système LMD sur ce cursus, générez automatiquement les semestres standards ({selectedProgram?.type === 'Master' ? 'S1 à S4' : 'S1 à S6'}).
                </p>
              </div>
              <button
                onClick={handleAutoGenerateSemesters}
                disabled={isLoading}
                className="bg-brand-primary hover:bg-brand-hover text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Générer les semestres automatiquement
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <p className="text-xs text-text-secondary">
                  {semesters.length} semestre(s) actif(s) pour <strong className="text-text-primary">{selectedProgram?.title}</strong> • {teachingUnits.length} Unité(s) d'Enseignement
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSyncExistingCourses}
                    className="text-xs bg-bg-secondary hover:bg-brand-primary hover:text-white border border-border-primary text-text-primary px-3 py-1.5 rounded-lg font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                    title="Synchroniser automatiquement tous les cours existants et les ventiler par niveau d'étude"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Synchroniser les cours historiques
                  </button>
                  <button
                    onClick={handleAutoGenerateSemesters}
                    className="text-xs text-brand-primary font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Régénérer ({selectedAcademicYear})
                  </button>
                </div>
              </div>

              {/* Semesters Grouped by Academic Level */}
              <div className="space-y-6">
                {semestersByLevel.map((group) => (
                  <div key={group.levelKey} className="space-y-3">
                    {/* Level Header Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-brand-primary/5 border border-brand-primary/15 rounded-xl px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-brand-primary text-white shadow-sm">
                          {group.levelKey}
                        </span>
                        <div>
                          <h3 className="font-bold text-xs text-text-primary">{group.levelTitle}</h3>
                          <p className="text-[10px] text-text-secondary">{group.levelSubtitle}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-bg-primary text-text-secondary border border-border-primary w-fit">
                        {group.semesters.length} semestre(s) • Année {selectedAcademicYear}
                      </span>
                    </div>

                    {/* Semesters in this level */}
                    <div className="space-y-4">
                      {group.semesters.map((sem) => {
                        const isExpanded = expandedSemesterId === sem.id;
                        const semUes = teachingUnits.filter((u) => u.semesterId === sem.id);

                        return (
                          <div
                            key={sem.id}
                            className="bg-bg-secondary border border-border-primary rounded-2xl overflow-hidden shadow-sm transition-all"
                          >
                            {/* Semester Header Accordion */}
                            <div className="p-4 md:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-bg-primary/40 border-b border-border-primary/50">
                              <div
                                className="flex items-center gap-3 cursor-pointer select-none"
                                onClick={() => setExpandedSemesterId(isExpanded ? null : sem.id)}
                              >
                                <div className="w-8 h-8 rounded-lg bg-brand-primary text-white flex items-center justify-center font-bold text-xs">
                                  S{sem.number}
                                </div>
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-sm font-bold text-text-primary">{sem.name}</h3>
                                    {sem.academicLevel && (
                                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                                        {sem.academicLevel}
                                      </span>
                                    )}
                                    {sem.academicYear && (
                                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-bg-primary text-text-secondary border border-border-primary">
                                        {sem.academicYear}
                                      </span>
                                    )}
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  sem.status === 'actif'
                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                    : sem.status === 'rattrapage_en_cours'
                                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                    : 'bg-bg-primary text-text-secondary border-border-primary'
                                }`}
                              >
                                {sem.status === 'actif'
                                  ? 'Session Normale Active'
                                  : sem.status === 'rattrapage_en_cours'
                                  ? 'Rattrapages en cours'
                                  : 'Clôturé'}
                              </span>
                            </div>
                            <p className="text-[11px] text-text-secondary">
                              Session Normale : <strong>{sem.startDate || 'Non définie'}</strong> au <strong>{sem.endDate || 'Non définie'}</strong> • Rattrapages : <strong>{sem.rattrapageStartDate || 'Non définie'}</strong> au <strong>{sem.rattrapageEndDate || 'Non définie'}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-auto">
                          <button
                            onClick={() => handleBulkEnrollStudents(sem.id)}
                            className="bg-bg-primary hover:bg-brand-primary hover:text-white border border-border-primary text-text-primary px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                            title="Inscrire tous les étudiants admis à ce semestre"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Inscrire les Admis ({acceptedStudents.filter(a => a.program === selectedProgram?.title).length})
                          </button>

                          <button
                            onClick={() => handleOpenAddUeModal(sem.id)}
                            className="bg-brand-primary hover:bg-brand-hover text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Ajouter une UE
                          </button>

                          <button
                            onClick={() => setExpandedSemesterId(isExpanded ? null : sem.id)}
                            className="p-1.5 text-text-secondary hover:text-text-primary rounded-lg transition-colors cursor-pointer"
                          >
                            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      {/* Semester Content (UE list) */}
                      {isExpanded && (
                        <div className="p-4 md:p-5 space-y-4">
                          {/* Semester Date Quick Config Bar */}
                          <div className="p-3.5 bg-bg-primary rounded-xl border border-border-primary/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div className="flex flex-wrap items-center gap-4">
                              <div>
                                <span className="text-[10px] text-text-secondary uppercase font-bold block">Session Normale</span>
                                <span className="font-semibold text-text-primary">{sem.startDate || '—'} → {sem.endDate || '—'}</span>
                              </div>
                              <div className="h-6 w-px bg-border-primary hidden sm:block"></div>
                              <div>
                                <span className="text-[10px] text-amber-500 uppercase font-bold block">Session de Rattrapage</span>
                                <span className="font-semibold text-text-primary">{sem.rattrapageStartDate || '—'} → {sem.rattrapageEndDate || '—'}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <select
                                value={sem.status || 'actif'}
                                onChange={(e) => handleSaveSemesterConfig({ ...sem, status: e.target.value as SemesterStatus })}
                                className="bg-bg-secondary border border-border-primary rounded-lg px-2.5 py-1 text-xs font-bold text-text-primary"
                              >
                                <option value="actif">🟢 Session Normale Active</option>
                                <option value="rattrapage_en_cours">🟠 Rattrapage en cours</option>
                                <option value="termine">⚪ Session Terminée</option>
                                <option value="cloture">🔒 Clôturé</option>
                              </select>
                            </div>
                          </div>

                          {/* Teaching Units Table */}
                          {semUes.length === 0 ? (
                            <div className="p-6 text-center text-xs text-text-secondary italic bg-bg-primary/30 rounded-xl border border-dashed border-border-primary">
                              Aucune Unité d'Enseignement dans ce semestre. Cliquez sur "+ Ajouter une UE" pour en créer une.
                            </div>
                          ) : (
                            <div className="overflow-x-auto rounded-xl border border-border-primary">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-bg-primary text-text-secondary uppercase tracking-wider text-[10px] font-bold border-b border-border-primary">
                                  <tr>
                                    <th className="p-3">Code</th>
                                    <th className="p-3">Intitulé de l'UE</th>
                                    <th className="p-3 text-center">Coeff & Règles</th>
                                    <th className="p-3 text-center">Pondérations M3C</th>
                                    <th className="p-3">Enseignant Assigné</th>
                                    <th className="p-3">Volume Horaire</th>
                                    <th className="p-3 text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border-primary">
                                  {semUes.map((ue) => (
                                    <tr key={ue.id} className="hover:bg-bg-primary/40 transition-colors">
                                      <td className="p-3 font-bold text-brand-primary">{ue.code}</td>
                                      <td className="p-3">
                                        <div className="font-bold text-text-primary">{ue.title}</div>
                                        {ue.description && <p className="text-[11px] text-text-secondary line-clamp-1">{ue.description}</p>}
                                      </td>
                                      <td className="p-3 text-center">
                                        <div className="inline-flex items-center gap-1.5">
                                          <span className="font-mono font-bold bg-bg-primary border border-border-primary px-2 py-0.5 rounded">
                                            Coeff. {ue.coefficient ?? 3}
                                          </span>
                                          {ue.isCompensable === false && (
                                            <span className="text-[9px] bg-rose-500/10 text-rose-600 border border-rose-500/30 px-1.5 py-0.5 rounded font-bold inline-flex items-center gap-0.5" title="UE Verrou requiert >= 10/20 pour être validée">
                                              <Lock className="w-2.5 h-2.5" /> Verrou
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="p-3 text-center">
                                        <span className="text-[10px] font-mono text-text-secondary">
                                          CC {ue.m3cWeightCC ?? 40}% / Ex {ue.m3cWeightExam ?? 50}% / TP {ue.m3cWeightTP ?? 10}%
                                        </span>
                                      </td>
                                      <td className="p-3 text-text-secondary">
                                        {ue.teacherName ? (
                                          <span className="font-semibold text-text-primary">{ue.teacherName}</span>
                                        ) : (
                                          <span className="text-text-secondary/60 italic">Non assigné</span>
                                        )}
                                      </td>
                                      <td className="p-3 text-text-secondary font-mono">
                                        {ue.volumeCM || 0}h CM • {ue.volumeTD || 0}h TD • {ue.volumeTP || 0}h TP
                                      </td>
                                      <td className="p-3 text-right space-x-2">
                                        <button
                                          onClick={() => handleOpenEditUeModal(ue)}
                                          className="p-1.5 text-text-secondary hover:text-brand-primary rounded-lg transition-colors cursor-pointer"
                                          title="Modifier l'UE"
                                        >
                                          <Edit3 className="w-4 h-4 inline" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteUe(ue.id, ue.title)}
                                          className="p-1.5 text-text-secondary hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                                          title="Supprimer l'UE"
                                        >
                                          <Trash2 className="w-4 h-4 inline" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )}

      {/* ── TAB 2 : Inscriptions & Suivi des Évaluations ── */}
      {activeTab === 'evaluations' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="bg-bg-secondary border border-border-primary rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Rechercher étudiant..."
                  value={evalSearch}
                  onChange={(e) => setEvalSearch(e.target.value)}
                  className="bg-bg-primary border border-border-primary rounded-xl pl-9 pr-3 py-2 text-xs text-text-primary outline-none focus:ring-2 focus:ring-brand-primary w-48 sm:w-60"
                />
              </div>

              {/* Semester Filter */}
              <select
                value={evalSemesterFilter}
                onChange={(e) => setEvalSemesterFilter(e.target.value)}
                className="bg-bg-primary border border-border-primary rounded-xl px-3 py-2 text-xs font-semibold text-text-primary"
              >
                <option value="all">Tous les semestres</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              {/* UE Filter */}
              <select
                value={evalUeFilter}
                onChange={(e) => setEvalUeFilter(e.target.value)}
                className="bg-bg-primary border border-border-primary rounded-xl px-3 py-2 text-xs font-semibold text-text-primary"
              >
                <option value="all">Toutes les UE</option>
                {teachingUnits.map((u) => (
                  <option key={u.id} value={u.id}>[{u.code}] {u.title}</option>
                ))}
              </select>
            </div>

            <span className="text-xs text-text-secondary font-bold">
              {filteredRecords.length} évaluation(s) affichée(s)
            </span>
          </div>

          {/* Records Table */}
          {filteredRecords.length === 0 ? (
            <div className="bg-bg-secondary border border-border-primary rounded-2xl p-8 text-center text-xs text-text-secondary italic">
              Aucune évaluation trouvée pour ces filtres. Utilisez le bouton "Inscrire les Admis" dans l'onglet Semestres pour inscrire vos étudiants.
            </div>
          ) : (
            <div className="bg-bg-secondary border border-border-primary rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-bg-primary text-text-secondary uppercase tracking-wider text-[10px] font-bold border-b border-border-primary">
                    <tr>
                      <th className="p-3.5">Étudiant</th>
                      <th className="p-3.5">UE / Matière</th>
                      <th className="p-3.5 text-center">Sous-Notes M3C (/20)</th>
                      <th className="p-3.5">Session 1 (/20)</th>
                      <th className="p-3.5 text-center">Rattrapage (/20)</th>
                      <th className="p-3.5">Note Retenue</th>
                      <th className="p-3.5">Statut</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-primary">
                    {filteredRecords.map((rec) => {
                      const ue = teachingUnits.find((u) => u.id === rec.ueId);
                      const sem = semesters.find((s) => s.id === rec.semesterId);

                      return (
                        <EvaluationGridRow
                          key={rec.id}
                          rec={rec}
                          ue={ue}
                          sem={sem}
                          onSave={handleSaveRecordGrades}
                          onFastStatus={handleUpdateEvaluation}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3 : Délibérations de Passage & Rattrapages (Bologne EEES) ── */}
      {activeTab === 'deliberations' && (
        <div className="space-y-6">
          {/* Deliberation Controls Bar */}
          <div className="bg-bg-secondary border border-border-primary rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-text-secondary">Semestre ciblé :</span>
                <select
                  value={delibSemesterId}
                  onChange={(e) => setDelibSemesterId(e.target.value)}
                  className="bg-bg-primary border border-border-primary rounded-xl px-3 py-2 text-xs font-bold text-text-primary outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  <option value="all">Tous les semestres</option>
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleExportDeliberationCsv}
                className="bg-bg-primary hover:bg-border-primary/40 border border-border-primary text-text-primary px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                title="Exporter le Procès-Verbal officiel au format CSV"
              >
                <FileDown className="w-3.5 h-3.5 text-brand-primary" />
                Exporter PV (CSV)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary font-bold">
                {studentDeliberations.length} étudiant(s) au jury
              </span>
            </div>
          </div>

          {/* Rules Reminder Card (LMD Réglementaire IDLA) */}
          <div className="bg-gradient-to-r from-brand-primary/10 via-brand-primary/5 to-transparent border border-brand-primary/20 rounded-2xl p-5 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-brand-primary">
                <ShieldCheck className="w-4 h-4" />
                <span>Règles Officielles de Délibération LMD IDLA (Bologne & EEES)</span>
              </div>
              <span className="text-[10px] text-text-secondary font-mono">Seuil éliminatoire : 07.00/20 • Plafond dettes AJAC : 2 UE</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
              <div className="bg-bg-secondary p-3 rounded-xl border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                <strong className="block text-sm mb-0.5">✅ Passage Direct (Admis) — ADM</strong>
                Moyenne semestrielle ≥ 10.00/20, aucune note &lt; 07.00, 0 dette résiduelle.
              </div>
              <div className="bg-bg-secondary p-3 rounded-xl border border-amber-500/20 text-amber-700 dark:text-amber-300">
                <strong className="block text-sm mb-0.5">⚠️ Passage avec Dette — AJAC</strong>
                1 à 2 UE non validées reportées en dettes. Poursuite d'études autorisée.
              </div>
              <div className="bg-bg-secondary p-3 rounded-xl border border-rose-500/20 text-rose-700 dark:text-rose-300">
                <strong className="block text-sm mb-0.5">❌ Redoublement du Semestre — AJ</strong>
                Plus de 2 UE en dette (&gt; 2) ou moyenne insuffisante : Redoublement requis.
              </div>
              <div className="bg-bg-secondary p-3 rounded-xl border border-border-primary text-text-secondary">
                <strong className="block text-sm mb-0.5 text-text-primary">⛔ Défaillant — DEF</strong>
                Absence injustifiée à une composante M3C ou examen obligatoire.
              </div>
            </div>
          </div>

          {/* Outil de Compensation Annuelle (S1 + S2) */}
          <div className="bg-bg-secondary border border-border-primary rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-brand-primary" />
                <h3 className="font-bold text-sm text-text-primary">Compensation Annuelle Inter-Semestres (S1 + S2)</h3>
              </div>
              <span className="text-[11px] text-text-secondary">
                Règle : Moyenne annuelle pondérée ≥ 10.00/20 compense les UE déficitaires de l'année
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-2">
                <label className="font-bold text-text-secondary">Semestre Impair :</label>
                <select
                  value={annualSem1Id}
                  onChange={(e) => setAnnualSem1Id(e.target.value)}
                  className="bg-bg-primary border border-border-primary rounded-xl px-3 py-1.5 font-bold text-text-primary"
                >
                  <option value="">Sélectionner (ex: S1)...</option>
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="font-bold text-text-secondary">Semestre Pair :</label>
                <select
                  value={annualSem2Id}
                  onChange={(e) => setAnnualSem2Id(e.target.value)}
                  className="bg-bg-primary border border-border-primary rounded-xl px-3 py-1.5 font-bold text-text-primary"
                >
                  <option value="">Sélectionner (ex: S2)...</option>
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleRunAnnualCompensation}
                className="bg-brand-primary hover:bg-brand-hover text-white px-4 py-1.5 rounded-xl font-bold transition-all shadow-sm cursor-pointer inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Calculer la Compensation Annuelle
              </button>
            </div>

            {annualResults.length > 0 && (
              <div className="mt-3 overflow-x-auto rounded-xl border border-border-primary">
                <table className="w-full text-left text-xs">
                  <thead className="bg-bg-primary text-text-secondary uppercase tracking-wider text-[10px] font-bold border-b border-border-primary">
                    <tr>
                      <th className="p-3">Étudiant</th>
                      <th className="p-3">Moyenne S1</th>
                      <th className="p-3">Moyenne S2</th>
                      <th className="p-3">Moyenne Annuelle</th>
                      <th className="p-3">Décision Annuelle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-primary">
                    {annualResults.map((ar, idx) => (
                      <tr key={idx} className="hover:bg-bg-primary/40">
                        <td className="p-3">
                          <span className="font-bold text-text-primary block">{ar.studentName}</span>
                          <span className="text-[10px] font-mono text-text-secondary">{ar.matricule} • {ar.studentEmail}</span>
                        </td>
                        <td className="p-3 font-mono font-bold">
                          {ar.annual.s1Average !== null ? `${ar.annual.s1Average.toFixed(2)}/20` : '—'}
                        </td>
                        <td className="p-3 font-mono font-bold">
                          {ar.annual.s2Average !== null ? `${ar.annual.s2Average.toFixed(2)}/20` : '—'}
                        </td>
                        <td className="p-3 font-mono font-extrabold text-sm">
                          {ar.annual.annualAverage !== null ? (
                            <span className={ar.annual.annualAverage >= 10 ? 'text-emerald-600' : 'text-rose-600'}>
                              {ar.annual.annualAverage.toFixed(2)}/20
                            </span>
                          ) : '—'}
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-block ${
                            ar.annual.annualDecision === 'ADM_COMP' || ar.annual.annualDecision === 'ADM'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : ar.annual.annualDecision === 'AJAC'
                              ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                          }`}>
                            {ar.annual.annualDecision}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Student Deliberations List */}
          {studentDeliberations.length === 0 ? (
            <div className="bg-bg-secondary border border-border-primary rounded-2xl p-8 text-center text-xs text-text-secondary italic">
              Aucun étudiant admis dans ce programme pour le moment.
            </div>
          ) : (
            <div className="space-y-4">
              {studentDeliberations.map((d) => (
                <div
                  key={d.studentEmail}
                  className="bg-bg-secondary border border-border-primary rounded-2xl p-5 shadow-sm space-y-4"
                >
                  <div className="flex flex-wrap justify-between items-start gap-2 border-b border-border-primary pb-3">
                    <div>
                      <h3 className="font-bold text-sm text-text-primary">{d.studentName}</h3>
                      <p className="text-xs text-text-secondary">{d.studentEmail} • Niveau : {d.entryLevel}</p>
                    </div>
                    <span className="font-mono text-xs px-2.5 py-1 rounded bg-bg-primary border border-border-primary font-bold text-text-primary">
                      {d.matricule}
                    </span>
                  </div>

                  {/* Outcome per Semester */}
                  <div className="space-y-4">
                    {d.semesterOutcomes.map((so) => {
                      const out = so.outcome;
                      const isExpanded = expandedDelibStudentEmail === `${d.studentEmail}_${so.semester.id}`;

                      return (
                        <div
                          key={so.semester.id}
                          className="bg-bg-primary/50 border border-border-primary rounded-xl p-4 space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div>
                                <span className="text-[10px] text-text-secondary uppercase font-bold block">Semestre</span>
                                <span className="text-sm font-bold text-text-primary">{so.semester.name}</span>
                              </div>

                              <div className="h-6 w-px bg-border-primary"></div>

                              <div>
                                <span className="text-[10px] text-text-secondary uppercase font-bold block">Moyenne Pondérée</span>
                                <span className="text-sm font-mono font-extrabold text-brand-primary">
                                  {out.moyenneSemestre !== null ? `${out.moyenneSemestre.toFixed(2)}/20` : 'En attente'}
                                </span>
                                <span className="text-[10px] text-text-secondary block font-normal">
                                  (Coeff. total : {out.totalCoefficients})
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Decision Badge */}
                              <div className="text-right">
                                <span className="text-[10px] text-text-secondary uppercase font-bold block">Décision Jury</span>
                                <span
                                  className={`text-xs font-bold px-3 py-1 rounded-full inline-block border ${
                                    out.decision === 'ADM'
                                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                      : out.decision === 'ADM_COMP'
                                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                      : out.decision === 'AJAC'
                                      ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                      : out.decision === 'AJ'
                                      ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                      : out.decision === 'DEF'
                                      ? 'bg-rose-500/20 text-rose-700 border-rose-500/40'
                                      : 'bg-bg-primary text-text-secondary border-border-primary'
                                  }`}
                                >
                                  {out.decision === 'ADM' && '✅ ADMIS (ADM)'}
                                  {out.decision === 'ADM_COMP' && '⚖️ ADMIS PAR COMPENSATION'}
                                  {out.decision === 'AJAC' && '⚠️ AJAC (Passage Dette ≤ 2)'}
                                  {out.decision === 'AJ' && '❌ AJOURNÉ (AJ)'}
                                  {out.decision === 'DEF' && '⛔ DÉFAILLANT (DEF)'}
                                  {out.decision === 'EN_COURS' && '⏳ Évaluations en cours'}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => setExpandedDelibStudentEmail(isExpanded ? null : `${d.studentEmail}_${so.semester.id}`)}
                                className="p-1.5 text-text-secondary hover:text-text-primary rounded-lg transition-colors cursor-pointer"
                                title="Voir les détails des UE"
                              >
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Quick Metrics */}
                          <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold pt-1">
                            <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 text-emerald-600">
                              <span className="text-[10px] block">Validées</span>
                              <span className="text-sm">{out.uesValidees}</span>
                            </div>
                            <div className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 text-amber-600">
                              <span className="text-[10px] block">Compensées</span>
                              <span className="text-sm">{out.uesCompensees}</span>
                            </div>
                            <div className="bg-rose-500/10 p-2 rounded-xl border border-rose-500/20 text-rose-600">
                              <span className="text-[10px] block">En dette</span>
                              <span className="text-sm">{out.uesNonValidees}</span>
                            </div>
                            <div className="bg-bg-secondary p-2 rounded-xl border border-border-primary text-text-secondary">
                              <span className="text-[10px] block">Défaillantes</span>
                              <span className="text-sm text-text-primary">{out.uesDefaillantes}</span>
                            </div>
                          </div>

                          {/* Detailed UE Outcome Breakdown */}
                          {isExpanded && (
                            <div className="pt-3 border-t border-border-primary/60 space-y-3">
                              <div className="overflow-x-auto rounded-xl border border-border-primary">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-bg-secondary text-text-secondary uppercase tracking-wider text-[10px] font-bold border-b border-border-primary">
                                    <tr>
                                      <th className="p-2.5">Code UE</th>
                                      <th className="p-2.5">Intitulé</th>
                                      <th className="p-2.5 text-center">Coeff</th>
                                      <th className="p-2.5 text-center">Note Retenue</th>
                                      <th className="p-2.5 text-center">Éliminatoire (&lt;7)</th>
                                      <th className="p-2.5 text-center">Verrou</th>
                                      <th className="p-2.5 text-right">Statut Résultant</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border-primary bg-bg-secondary/40">
                                    {out.details.map((det) => (
                                      <tr key={det.ueId} className="hover:bg-bg-primary/50">
                                        <td className="p-2.5 font-bold font-mono text-brand-primary">{det.ueCode}</td>
                                        <td className="p-2.5 font-medium text-text-primary">{det.ueTitle}</td>
                                        <td className="p-2.5 text-center font-bold">{det.coefficient}</td>
                                        <td className="p-2.5 text-center font-mono font-bold">
                                          {det.effectiveNote !== null ? (
                                            <span className={det.effectiveNote >= 10 ? 'text-emerald-600' : 'text-rose-600'}>
                                              {det.effectiveNote.toFixed(2)}/20
                                            </span>
                                          ) : '—'}
                                        </td>
                                        <td className="p-2.5 text-center">
                                          {det.isEliminatory ? (
                                            <span className="text-[10px] bg-rose-500/10 text-rose-600 px-1.5 py-0.5 rounded font-bold">
                                              Oui (&lt;7)
                                            </span>
                                          ) : (
                                            <span className="text-[10px] text-text-secondary">Non</span>
                                          )}
                                        </td>
                                        <td className="p-2.5 text-center">
                                          {det.isCompensable === false ? (
                                            <span className="text-[10px] bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded font-bold">
                                              Verrou
                                            </span>
                                          ) : (
                                            <span className="text-[10px] text-text-secondary">Non</span>
                                          )}
                                        </td>
                                        <td className="p-2.5 text-right">
                                          <span
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block ${
                                              det.status === 'valide'
                                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                : det.status === 'compense'
                                                ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                : det.status === 'defaillant'
                                                ? 'bg-rose-500/20 text-rose-700 border-rose-500/40'
                                                : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                            }`}
                                          >
                                            {det.status === 'valide' && 'Validée'}
                                            {det.status === 'compense' && 'Compensée'}
                                            {det.status === 'en_dette' && 'En Dette'}
                                            {det.status === 'defaillant' && 'Défaillant'}
                                            {det.status === 'inscrit' && 'Inscrit'}
                                            {det.status === 'rattrapage' && 'Rattrapage'}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Deliberation Cloture Footer */}
                          <div className="pt-2 border-t border-border-primary/40 flex flex-wrap items-center justify-between gap-2">
                            <div>
                              {so.savedResult ? (
                                <span className="text-[11px] text-emerald-600 font-semibold inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Délibération officielle enregistrée le {so.savedResult.deliberatedAt} par {so.savedResult.deliberatedBy}
                                </span>
                              ) : (
                                <span className="text-[11px] text-text-secondary italic">
                                  Délibération prévisionnelle non encore enregistrée.
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleCommitDeliberation(d.studentEmail, d.studentName, so.semester.id, out)}
                              className="bg-brand-primary hover:bg-brand-hover text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Award className="w-3.5 h-3.5" />
                              {so.savedResult ? 'Re-délibérer & Mettre à jour' : 'Valider & Clôturer Délibération'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Add / Edit UE Modal ── */}
      {showUeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-secondary border border-border-primary rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-5 border-b border-border-primary flex justify-between items-center bg-bg-primary/50">
              <h3 className="font-bold text-sm text-text-primary">
                {editingUe ? `Modifier l'UE : ${editingUe.code}` : "Ajouter une Unité d'Enseignement (UE)"}
              </h3>
              <button
                onClick={() => setShowUeModal(false)}
                className="text-text-secondary hover:text-text-primary text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUe} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary">Code UE *</label>
                  <input
                    type="text"
                    required
                    value={ueCode}
                    onChange={(e) => setUeCode(e.target.value)}
                    placeholder="ex: INF101"
                    className="w-full bg-bg-primary border border-border-primary rounded-xl px-3 py-2 text-xs font-mono font-bold text-text-primary uppercase"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="font-bold text-text-secondary">Intitulé de l'UE *</label>
                  <input
                    type="text"
                    required
                    value={ueTitle}
                    onChange={(e) => setUeTitle(e.target.value)}
                    placeholder="ex: Algorithmique & Programmation"
                    className="w-full bg-bg-primary border border-border-primary rounded-xl px-3 py-2 text-xs font-bold text-text-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-secondary">Enseignant Référent</label>
                <select
                  value={ueTeacherId}
                  onChange={(e) => setUeTeacherId(e.target.value)}
                  className="w-full bg-bg-primary border border-border-primary rounded-xl px-3 py-2 text-xs text-text-primary font-semibold"
                >
                  <option value="">Sélectionner un enseignant (optionnel)...</option>
                  {teachersList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Volume Horaire CM/TD/TP */}
              <div className="grid grid-cols-3 gap-3 bg-bg-primary p-3 rounded-xl border border-border-primary">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-secondary">Cours Magistral (CM)</label>
                  <input
                    type="number"
                    min={0}
                    value={ueVolumeCM}
                    onChange={(e) => setUeVolumeCM(Number(e.target.value))}
                    className="w-full bg-bg-secondary border border-border-primary rounded-lg px-2.5 py-1.5 text-xs text-center font-bold text-text-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-secondary">Travaux Dirigés (TD)</label>
                  <input
                    type="number"
                    min={0}
                    value={ueVolumeTD}
                    onChange={(e) => setUeVolumeTD(Number(e.target.value))}
                    className="w-full bg-bg-secondary border border-border-primary rounded-lg px-2.5 py-1.5 text-xs text-center font-bold text-text-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-secondary">Travaux Pratiques (TP)</label>
                  <input
                    type="number"
                    min={0}
                    value={ueVolumeTP}
                    onChange={(e) => setUeVolumeTP(Number(e.target.value))}
                    className="w-full bg-bg-secondary border border-border-primary rounded-lg px-2.5 py-1.5 text-xs text-center font-bold text-text-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary flex items-center justify-between">
                    <span>Coefficient *</span>
                    <span className="text-[10px] text-brand-primary">Poids dans le semestre</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={30}
                    value={ueCoefficient}
                    onChange={(e) => setUeCoefficient(Number(e.target.value))}
                    className="w-full bg-bg-primary border border-border-primary rounded-xl px-3 py-2 text-xs font-bold text-text-primary text-center"
                  />
                </div>
                <div className="space-y-1 flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-bg-primary border border-border-primary cursor-pointer hover:border-brand-primary/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={ueIsCompensable}
                      onChange={(e) => setUeIsCompensable(e.target.checked)}
                      className="rounded border-border-primary text-brand-primary focus:ring-brand-primary h-4 w-4"
                    />
                    <div>
                      <span className="text-xs font-bold text-text-primary block">Éligible compensation</span>
                      <span className="text-[10px] text-text-secondary block">{ueIsCompensable ? 'Compensable si sem ≥ 10' : 'UE verrou (Note ≥ 10 requise)'}</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Modalités de Contrôle des Connaissances (M3C) */}
              <div className="bg-bg-primary p-3 rounded-xl border border-border-primary space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-text-primary flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-brand-primary" />
                    Pondérations M3C (%)
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ueM3cWeightCC + ueM3cWeightExam + ueM3cWeightTP === 100 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                    Total : {ueM3cWeightCC + ueM3cWeightExam + ueM3cWeightTP}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-secondary">CC (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={ueM3cWeightCC}
                      onChange={(e) => setUeM3cWeightCC(Number(e.target.value))}
                      className="w-full bg-bg-secondary border border-border-primary rounded-lg px-2.5 py-1.5 text-xs text-center font-bold text-text-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-secondary">Examen (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={ueM3cWeightExam}
                      onChange={(e) => setUeM3cWeightExam(Number(e.target.value))}
                      className="w-full bg-bg-secondary border border-border-primary rounded-lg px-2.5 py-1.5 text-xs text-center font-bold text-text-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-secondary">TP (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={ueM3cWeightTP}
                      onChange={(e) => setUeM3cWeightTP(Number(e.target.value))}
                      className="w-full bg-bg-secondary border border-border-primary rounded-lg px-2.5 py-1.5 text-xs text-center font-bold text-text-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-secondary">Description / Syllabus</label>
                <textarea
                  rows={3}
                  value={ueDescription}
                  onChange={(e) => setUeDescription(e.target.value)}
                  placeholder="Objectifs pédagogiques et programme du cours..."
                  className="w-full bg-bg-primary border border-border-primary rounded-xl p-3 text-xs text-text-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border-primary">
                <button
                  type="button"
                  onClick={() => setShowUeModal(false)}
                  className="bg-bg-primary hover:bg-border-primary/40 text-text-secondary px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-brand-primary hover:bg-brand-hover text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Enregistrer l'UE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
