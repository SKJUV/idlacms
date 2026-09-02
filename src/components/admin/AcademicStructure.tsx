import React, { useState, useEffect, useMemo } from 'react';
import { 
  GraduationCap, BookOpen, Plus, Calendar, CheckCircle2, XCircle, AlertTriangle, 
  Trash2, Edit3, UserCheck, RefreshCw, Layers, Search, Save, Clock, ChevronRight,
  ChevronDown, ShieldCheck, AlertCircle, ArrowRight
} from 'lucide-react';
import { Program, Semester, TeachingUnit, StudentUERecord, SemesterStatus, UERecordStatus } from '../../types';
import { dbAdapter } from '../../lib/dbAdapter';

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

  // ── UE Form modal ──
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

  // ── Evaluation filter states ──
  const [evalSemesterFilter, setEvalSemesterFilter] = useState<string>('all');
  const [evalUeFilter, setEvalUeFilter] = useState<string>('all');
  const [evalSearch, setEvalSearch] = useState('');

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
      const [sems, ues, recs] = await Promise.all([
        dbAdapter.semesters.list(progId),
        dbAdapter.teachingUnits.list(progId),
        dbAdapter.studentUeRecords.list({ programId: progId })
      ]);
      setSemesters(sems);
      setTeachingUnits(ues);
      setStudentRecords(recs);

      if (sems.length > 0 && !expandedSemesterId) {
        setExpandedSemesterId(sems[0].id);
      }
    } catch (e: any) {
      showToast('Erreur lors du chargement des données LMD: ' + e.message, true);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Sync / Import existing courses from teacher schedules / local data ──
  const handleSyncExistingCourses = async () => {
    if (!selectedProgram || semesters.length === 0) {
      showToast("Veuillez d'abord générer des semestres pour ce programme.", true);
      return;
    }
    const s1 = semesters.find((s) => s.number === 1) || semesters[0];
    let imported = 0;
    setIsLoading(true);
    try {
      let localCourses: any[] = [];
      try {
        localCourses = JSON.parse(localStorage.getItem('idla_local_courses') || '[]');
      } catch (e) {}

      const progTitle = selectedProgram.title.toLowerCase();
      const matchCourses = localCourses.filter((c: any) => {
        const cp = (c.program || '').toLowerCase();
        return cp && (cp === progTitle || progTitle.includes(cp) || cp.includes(progTitle));
      });

      for (const c of matchCourses) {
        const alreadyExists = teachingUnits.some(
          (u) => u.code.toLowerCase() === (c.code || '').toLowerCase() || u.title.toLowerCase() === c.title.toLowerCase()
        );
        if (!alreadyExists) {
          await dbAdapter.teachingUnits.create({
            programId: selectedProgram.id,
            semesterId: s1.id,
            code: c.code || `UE${Math.floor(100 + Math.random() * 900)}`,
            title: c.title,
            teacherId: c.teacherId || '',
            teacherName: c.teacherName || '',
            volumeCM: c.volumeCM || 20,
            volumeTD: c.volumeTD || 10,
            volumeTP: c.volumeTP || 10,
            description: c.description || ''
          });
          imported++;
        }
      }

      if (imported > 0) {
        const ues = await dbAdapter.teachingUnits.list(selectedProgram.id);
        setTeachingUnits(ues);
        showToast(`${imported} matière(s) synchronisée(s) et importée(s) dans le Semestre 1 !`);
      } else {
        showToast("Toutes les matières de ce programme sont déjà synchronisées.");
      }
    } catch (e: any) {
      showToast("Erreur synchronisation : " + e.message, true);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Auto-generate Semesters based on program type ──
  const handleAutoGenerateSemesters = async () => {
    if (!selectedProgram) return;
    const progType = selectedProgram.type;
    let count = 6;
    if (progType === 'Master') count = 4;
    else if (progType === 'Doctorat') count = 6;
    else if (progType === 'Certification') count = 1;

    const currentYear = new Date().getFullYear();
    const created: Semester[] = [];

    setIsLoading(true);
    try {
      for (let i = 1; i <= count; i++) {
        const isOdd = i % 2 !== 0;
        const yearOffset = Math.floor((i - 1) / 2);
        const yr = currentYear + yearOffset;

        const startMonth = isOdd ? `01 Octobre ${yr}` : `01 Mars ${yr + 1}`;
        const endMonth = isOdd ? `28 Février ${yr + 1}` : `31 Juillet ${yr + 1}`;
        const rattrapageStart = isOdd ? `01 Mars ${yr + 1}` : `01 Août ${yr + 1}`;
        const rattrapageEnd = isOdd ? `15 Mars ${yr + 1}` : `15 Août ${yr + 1}`;

        const sem = await dbAdapter.semesters.create({
          programId: selectedProgram.id,
          name: `Semestre ${i} (S${i})`,
          number: i,
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
      showToast(`${count} semestres générés avec succès pour ${selectedProgram.title} !`);
      if (logActivity) logActivity('article', 'Admin', `Génération de ${count} semestres LMD pour ${selectedProgram.title}`);
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
    setShowUeModal(true);
  };

  // ── Save UE ──
  const handleSaveUe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ueCode.trim() || !ueTitle.trim() || !targetSemesterIdForUe || !selectedProgram) {
      showToast('Veuillez renseigner le code et le titre de l\'UE', true);
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
          prerequisiteUeId: uePrerequisite || ''
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
          prerequisiteUeId: uePrerequisite || ''
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

  // ── Deliberation calculation per student ──
  const studentDeliberations = useMemo(() => {
    if (!selectedProgram) return [];

    const progStudents = acceptedStudents.filter((a) => {
      const p = (a.program || '').trim().toLowerCase();
      const selP = (selectedProgram.title || '').trim().toLowerCase();
      return p === selP || p.includes(selP) || selP.includes(p);
    });

    return progStudents.map((student) => {
      const studentEmail = (student.email || '').toLowerCase().trim();
      const records = studentRecords.filter((r) => r.studentEmail.toLowerCase().trim() === studentEmail);

      const totalUes = records.length;
      const validatedUes = records.filter((r) => r.status === 'valide').length;
      const rattrapageUes = records.filter((r) => r.status === 'rattrapage').length;
      const debtUes = records.filter((r) => r.status === 'en_dette' || r.status === 'non_valide').length;

      let decision: 'admis' | 'dette' | 'redoublement' | 'en_cours' = 'en_cours';
      if (totalUes > 0) {
        if (validatedUes === totalUes) {
          decision = 'admis';
        } else if (debtUes + rattrapageUes <= 2 && debtUes > 0) {
          decision = 'dette';
        } else if (debtUes > 2) {
          decision = 'redoublement';
        }
      }

      return {
        student,
        studentEmail,
        studentName: student.name || studentEmail,
        matricule: student.matricule || 'N/A',
        entryLevel: student.entryLevel || 'L1',
        totalUes,
        validatedUes,
        rattrapageUes,
        debtUes,
        decision
      };
    });
  }, [selectedProgram, acceptedStudents, studentRecords]);

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
            {/* Filter Toggle */}
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
                    className="text-xs bg-bg-secondary hover:bg-brand-primary hover:text-white border border-border-primary text-text-primary px-3 py-1.5 rounded-lg font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                    title="Importer et synchroniser les cours existants vers ce programme"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Synchroniser les matières existantes
                  </button>
                  <button
                    onClick={handleAutoGenerateSemesters}
                    className="text-xs text-brand-primary font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Régénérer
                  </button>
                </div>
              </div>

              {/* Semesters List */}
              <div className="space-y-4">
                {semesters.map((sem) => {
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
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-text-primary">{sem.name}</h3>
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
                      <th className="p-3.5">Session</th>
                      <th className="p-3.5">Statut Actuel</th>
                      <th className="p-3.5">Validation</th>
                      <th className="p-3.5 text-right">Actions Manuelles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-primary">
                    {filteredRecords.map((rec) => {
                      const ue = teachingUnits.find((u) => u.id === rec.ueId);
                      const sem = semesters.find((s) => s.id === rec.semesterId);

                      return (
                        <tr key={rec.id} className="hover:bg-bg-primary/40 transition-colors">
                          <td className="p-3.5">
                            <div className="font-bold text-text-primary">{rec.studentName || 'Étudiant'}</div>
                            <div className="text-[11px] text-text-secondary">{rec.studentEmail}</div>
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-text-primary">{ue ? ue.title : 'UE inconnue'}</div>
                            <div className="text-[11px] font-mono text-brand-primary">{ue?.code} • {sem?.name}</div>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                                rec.sessionType === 'rattrapage'
                                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                  : 'bg-sky-500/10 text-sky-600 border-sky-500/20'
                              }`}
                            >
                              {rec.sessionType}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border inline-flex items-center gap-1 ${
                                rec.status === 'valide'
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                  : rec.status === 'rattrapage'
                                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                  : rec.status === 'en_dette' || rec.status === 'non_valide'
                                  ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                  : 'bg-bg-primary text-text-secondary border-border-primary'
                              }`}
                            >
                              {rec.status === 'valide' && <CheckCircle2 className="w-3 h-3" />}
                              {rec.status === 'rattrapage' && <AlertTriangle className="w-3 h-3" />}
                              {rec.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3.5 text-text-secondary text-[11px]">
                            {rec.validatedAt ? (
                              <span>Le {rec.validatedAt} par {rec.validatedBy || 'Admin'}</span>
                            ) : (
                              <span className="italic text-text-secondary/50">En attente d'évaluation</span>
                            )}
                          </td>
                          <td className="p-3.5 text-right space-x-2">
                            <button
                              onClick={() => handleUpdateEvaluation(rec.id, 'valide', rec.sessionType)}
                              className="bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                              title="Valider l'UE"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Validé
                            </button>

                            <button
                              onClick={() => handleUpdateEvaluation(rec.id, 'rattrapage', 'rattrapage')}
                              className="bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-600 border border-amber-500/30 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                              title="Envoyer en rattrapage"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" /> Rattrapage
                            </button>

                            <button
                              onClick={() => handleUpdateEvaluation(rec.id, 'en_dette', rec.sessionType)}
                              className="bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-600 border border-rose-500/30 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                              title="Marquer comme non validé / En dette"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Dette
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3 : Délibérations de Passage & Rattrapages ── */}
      {activeTab === 'deliberations' && (
        <div className="space-y-6">
          {/* Rules Reminder Card */}
          <div className="bg-gradient-to-r from-brand-primary/10 via-brand-primary/5 to-transparent border border-brand-primary/20 rounded-2xl p-5 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-brand-primary">
              <ShieldCheck className="w-4 h-4" />
              <span>Règles Officielles de Délibération LMD IDLA</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="bg-bg-secondary p-3 rounded-xl border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                <strong className="block text-sm mb-0.5">✅ Passage Direct (Admis)</strong>
                100% des Unités d'Enseignement (UE) du semestre validées.
              </div>
              <div className="bg-bg-secondary p-3 rounded-xl border border-amber-500/20 text-amber-700 dark:text-amber-300">
                <strong className="block text-sm mb-0.5">⚠️ Passage avec Dette</strong>
                1 à 2 UE non validées (les UE sont reportées au semestre suivant).
              </div>
              <div className="bg-bg-secondary p-3 rounded-xl border border-rose-500/20 text-rose-700 dark:text-rose-300">
                <strong className="block text-sm mb-0.5">❌ Redoublement du Semestre</strong>
                3 UE ou plus non validées après la session de rattrapage.
              </div>
            </div>
          </div>

          {/* Student Deliberations Summary List */}
          {studentDeliberations.length === 0 ? (
            <div className="bg-bg-secondary border border-border-primary rounded-2xl p-8 text-center text-xs text-text-secondary italic">
              Aucun étudiant admis dans ce programme pour le moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studentDeliberations.map((d) => (
                <div
                  key={d.studentEmail}
                  className="bg-bg-secondary border border-border-primary rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-bold text-sm text-text-primary">{d.studentName}</h3>
                        <p className="text-xs text-text-secondary">{d.studentEmail}</p>
                      </div>
                      <span className="font-mono text-xs px-2.5 py-1 rounded bg-bg-primary border border-border-primary font-bold">
                        {d.matricule}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-2 text-center text-xs font-bold">
                      <div className="bg-bg-primary p-2 rounded-xl border border-border-primary">
                        <span className="text-[10px] text-text-secondary block">Total UE</span>
                        <span className="text-sm text-text-primary">{d.totalUes}</span>
                      </div>
                      <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 text-emerald-600">
                        <span className="text-[10px] block">Validées</span>
                        <span className="text-sm">{d.validatedUes}</span>
                      </div>
                      <div className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 text-amber-600">
                        <span className="text-[10px] block">Rattrapage</span>
                        <span className="text-sm">{d.rattrapageUes}</span>
                      </div>
                      <div className="bg-rose-500/10 p-2 rounded-xl border border-rose-500/20 text-rose-600">
                        <span className="text-[10px] block">En dette</span>
                        <span className="text-sm">{d.debtUes}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border-primary flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-text-secondary uppercase font-bold block">Décision Académique</span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-block mt-0.5 border ${
                          d.decision === 'admis'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : d.decision === 'dette'
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            : d.decision === 'redoublement'
                            ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                            : 'bg-bg-primary text-text-secondary border-border-primary'
                        }`}
                      >
                        {d.decision === 'admis' && '✅ Admis au Semestre Suivant'}
                        {d.decision === 'dette' && '⚠️ Passage Conditionnel (Dette ≤ 2)'}
                        {d.decision === 'redoublement' && '❌ Ajourné (Redoublement)'}
                        {d.decision === 'en_cours' && 'En cours d\'évaluation'}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setActiveTab('evaluations');
                        setEvalSearch(d.studentEmail);
                      }}
                      className="text-xs text-brand-primary font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      Détails UE <ArrowRight className="w-3 h-3" />
                    </button>
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
