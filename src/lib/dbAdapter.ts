import { databases, storage, APPWRITE_CONFIG, isAppwriteDbConfigured, isAppwriteStorageConfigured, ID, Query, Permission, Role } from './appwrite';
import { 
  Program, NewsArticle, Testimonial, User, PreRegistration, ActivityLog, 
  Course, ScheduleSlot, AcademicSession, Semester, TeachingUnit, StudentUERecord, 
  CourseResource, StudentSemesterResult 
} from '../types';
import { lmdEvaluationEngine } from './lmdEvaluationEngine';

/**
 * IDLA CMS — Unified Clean Database Adapter & Service Layer
 * Fully normalized abstraction layer handling DB, Auth, Storage, and caching.
 */

export const dbAdapter = {
  // ── Programs ─────────────────────────────────────────────────────────────
  programs: {
    async list(): Promise<Program[]> {
      let localPrograms: Program[] = [];
      try {
        localPrograms = JSON.parse(localStorage.getItem('idla_local_programs') || '[]');
      } catch (e) {}

      if (!isAppwriteDbConfigured() || !APPWRITE_CONFIG.collections.programs) {
        return localPrograms;
      }

      try {
        const res = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.programs,
          [Query.limit(5000), Query.orderAsc('title')]
        );
        const remoteProgs: Program[] = res.documents.map((doc: any) => ({
          id: doc.$id,
          title: doc.title,
          description: doc.description || doc.title,
          type: doc.type || 'Master',
          category: doc.category || 'Tech',
          duration: doc.duration || '1 an',
          image: doc.image,
          isNew: !!doc.isNew,
          price: doc.price,
          procedures: doc.procedures,
        }));

        if (remoteProgs.length > 0) {
          try {
            localStorage.setItem('idla_local_programs', JSON.stringify(remoteProgs));
          } catch (e) {}
          return remoteProgs;
        }
        return localPrograms;
      } catch (err) {
        console.warn('dbAdapter.programs.list error, fallback local:', err);
        return localPrograms;
      }
    },

    async resolveProgramId(programTitleOrId: string): Promise<string | null> {
      if (!programTitleOrId) return null;
      const all = await this.list();
      // Match by exact ID
      const byId = all.find((p) => p.id === programTitleOrId);
      if (byId) return byId.id;

      // Match by exact or normalized Title
      const target = programTitleOrId.toLowerCase().trim();
      const byTitle = all.find((p) => {
        const title = (p.title || '').toLowerCase().trim();
        return title === target || target.includes(title) || title.includes(target);
      });
      return byTitle ? byTitle.id : null;
    },

    async create(progData: Omit<Program, 'id'>): Promise<Program> {
      const newId = `prog-${Math.floor(100000 + Math.random() * 900000)}`;
      const program: Program = { id: newId, ...progData };

      // Local storage sync
      try {
        const curr = JSON.parse(localStorage.getItem('idla_local_programs') || '[]');
        localStorage.setItem('idla_local_programs', JSON.stringify([program, ...curr]));
      } catch (e) {}

      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.programs) {
        try {
          await databases.createDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.programs,
            newId,
            {
              title: program.title,
              description: program.description,
              type: program.type,
              category: program.category,
              duration: program.duration,
              image: program.image,
              isNew: !!program.isNew,
              price: program.price || '',
              procedures: program.procedures || '',
            },
            [
              Permission.read(Role.any()),
              Permission.update(Role.team('admins')),
              Permission.delete(Role.team('admins')),
            ]
          );
        } catch (err) {
          console.error('dbAdapter.programs.create cloud error:', err);
        }
      }
      return program;
    },

    async update(id: string, updates: Partial<Program>): Promise<void> {
      try {
        const curr: Program[] = JSON.parse(localStorage.getItem('idla_local_programs') || '[]');
        const next = curr.map((p) => (p.id === id ? { ...p, ...updates } : p));
        localStorage.setItem('idla_local_programs', JSON.stringify(next));
      } catch (e) {}

      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.programs) {
        try {
          await databases.updateDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.programs,
            id,
            updates as any,
            [
              Permission.read(Role.any()),
              Permission.update(Role.team('admins')),
              Permission.delete(Role.team('admins')),
            ]
          );
        } catch (err) {
          console.error('dbAdapter.programs.update cloud error:', err);
        }
      }
    },
  },

  // ── Applications & Candidate Admissions ──────────────────────────────────
  applications: {
    async list(): Promise<PreRegistration[]> {
      let localApps: PreRegistration[] = [];
      try {
        localApps = JSON.parse(localStorage.getItem('idla_local_applications') || '[]');
      } catch (e) {}

      if (!isAppwriteDbConfigured() || !APPWRITE_CONFIG.collections.applications) {
        return localApps;
      }

      try {
        const res = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.applications,
          [Query.limit(5000), Query.orderDesc('$createdAt')]
        );
        const remoteApps: PreRegistration[] = res.documents.map((doc: any) => ({
          id: doc.$id,
          name: doc.name,
          email: doc.email,
          program: doc.program,
          programId: doc.programId || doc.program_id || '',
          dateApplied: doc.dateApplied || doc.$createdAt,
          status: doc.status || 'New',
          initials: doc.initials || (doc.name || 'CN').substring(0, 2).toUpperCase(),
          phone: doc.phone,
          nationality: doc.nationality,
          highestDegree: doc.highestDegree,
          graduationYear: doc.graduationYear,
          motivation: doc.motivation,
          documents: doc.files ? JSON.parse(doc.files).map((f: any) => f.name) : [],
          matricule: doc.matricule || '',
          entryLevel: doc.entryLevel || '',
        }));

        if (remoteApps.length > 0) {
          return remoteApps;
        }
        return localApps;
      } catch (err) {
        console.warn('dbAdapter.applications.list error:', err);
        return localApps;
      }
    },

    async getByEmail(email: string): Promise<PreRegistration[]> {
      const all = await this.list();
      return all.filter((a) => a.email?.toLowerCase().trim() === email.toLowerCase().trim());
    },

    async create(appData: Omit<PreRegistration, 'id'>): Promise<PreRegistration> {
      const newId = `app-${Date.now()}`;
      let resolvedProgId = appData.programId || '';
      if (!resolvedProgId && appData.program && appData.program !== 'Inscription seule') {
        resolvedProgId = (await dbAdapter.programs.resolveProgramId(appData.program)) || '';
      }

      const app: PreRegistration = { id: newId, ...appData, programId: resolvedProgId };

      try {
        const curr = JSON.parse(localStorage.getItem('idla_local_applications') || '[]');
        localStorage.setItem('idla_local_applications', JSON.stringify([app, ...curr]));
      } catch (e) {}

      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.applications) {
        try {
          const docData: any = {
            name: app.name,
            email: app.email,
            phone: app.phone || '',
            nationality: app.nationality || '',
            program: app.program || 'General',
            highestDegree: app.highestDegree || '',
            graduationYear: app.graduationYear ? Number(app.graduationYear) : null,
            status: app.status || 'New',
            dateApplied: app.dateApplied || new Date().toISOString(),
            initials: app.initials || 'CN',
            motivation: app.motivation || '',
            files: JSON.stringify(app.documents || []),
          };
          if (resolvedProgId) docData.programId = resolvedProgId;

          await databases.createDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.applications,
            newId,
            docData,
            [
              Permission.create(Role.any()),
              Permission.read(Role.team('admins')),
              Permission.update(Role.team('admins')),
              Permission.delete(Role.team('admins')),
            ]
          );
        } catch (err) {
          console.error('dbAdapter.applications.create cloud error:', err);
        }
      }
      return app;
    },

    async updateStatus(id: string, status: PreRegistration['status'], matricule?: string, programId?: string): Promise<void> {
      try {
        const curr: PreRegistration[] = JSON.parse(localStorage.getItem('idla_local_applications') || '[]');
        const next = curr.map((a) => (a.id === id ? { 
          ...a, 
          status, 
          ...(matricule ? { matricule } : {}),
          ...(programId ? { programId } : {})
        } : a));
        localStorage.setItem('idla_local_applications', JSON.stringify(next));
      } catch (e) {}

      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.applications) {
        try {
          const updates: any = { status };
          if (matricule) updates.matricule = matricule;
          if (programId) updates.programId = programId;

          await databases.updateDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.applications,
            id,
            updates
          );
        } catch (err) {
          console.error('dbAdapter.applications.updateStatus cloud error:', err);
        }
      }
    },
  },

  // ── Courses & LMS Modules ────────────────────────────────────────────────
  courses: {
    async list(): Promise<Course[]> {
      try {
        return JSON.parse(localStorage.getItem('idla_local_courses') || '[]');
      } catch (e) {
        return [];
      }
    },

    async create(courseData: Omit<Course, 'id'>): Promise<Course> {
      const newCourse: Course = {
        id: `crs_${Date.now()}`,
        ...courseData,
      };
      try {
        const curr = await this.list();
        const next = [newCourse, ...curr];
        localStorage.setItem('idla_local_courses', JSON.stringify(next));
      } catch (e) {}
      return newCourse;
    },
  },

  // ── Activity Logs ────────────────────────────────────────────────────────
  logs: {
    async list(): Promise<ActivityLog[]> {
      if (!isAppwriteDbConfigured() || !APPWRITE_CONFIG.collections.logs) {
        return [];
      }
      try {
        const res = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.logs,
          [Query.limit(100), Query.orderDesc('$createdAt')]
        );
        return res.documents.map((d: any) => ({
          id: d.$id,
          type: d.type,
          user: d.user,
          text: d.text,
          time: d.time || "À l'instant",
        }));
      } catch (e) {
        return [];
      }
    },

    async log(type: ActivityLog['type'], user: string, text: string): Promise<void> {
      if (!isAppwriteDbConfigured() || !APPWRITE_CONFIG.collections.logs) return;
      try {
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.logs,
          ID.unique(),
          {
            type,
            user,
            text,
            time: "À l'instant",
          },
          [
            Permission.read(Role.team('admins')),
            Permission.create(Role.users()),
          ]
        );
      } catch (e) {
        console.warn('dbAdapter.logs.log error:', e);
      }
    },
  },

  // ── Teachers Synchronization Layer ───────────────────────────────────────
  teachers: {
    async list(): Promise<{ id: string; name: string; email: string; assignedPrograms?: string[]; assignedCourses?: string[]; scheduleData?: any; speciality?: string }[]> {
      let local: any[] = [];
      try {
        local = JSON.parse(
          localStorage.getItem('idla_local_teachers') || 
          localStorage.getItem('idla_teachers') || 
          localStorage.getItem('teachers') || 
          '[]'
        );
      } catch (e) {}

      if (!isAppwriteDbConfigured()) {
        return local;
      }

      try {
        const teachersMap = new Map<string, any>();

        // Pre-populate with local teachers
        local.forEach((t: any) => {
          const emailKey = (t.email || '').toLowerCase().trim();
          if (emailKey) {
            teachersMap.set(emailKey, t);
          }
        });

        // 1. Query cms_users where role === 'teacher'
        const cmsUsersColl = APPWRITE_CONFIG.collections.cmsUsers || 'cms_users';
        if (cmsUsersColl) {
          try {
            const res = await databases.listDocuments(
              APPWRITE_CONFIG.databaseId,
              cmsUsersColl,
              [Query.equal('role', 'teacher'), Query.limit(100)]
            );
            res.documents.forEach((d: any) => {
              let assigned = d.assignedPrograms;
              if (typeof assigned === 'string') {
                try { assigned = JSON.parse(assigned); } catch { assigned = []; }
              }
              if (!Array.isArray(assigned)) assigned = [];
              const emailKey = (d.email || '').toLowerCase().trim();
              teachersMap.set(emailKey, {
                id: d.$id,
                name: d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim() || d.email,
                email: d.email,
                assignedPrograms: assigned,
                speciality: d.speciality || '',
              });
            });
          } catch (err) {
            console.warn('dbAdapter.teachers cms_users query:', err);
          }
        }

        // 2. Query teachers collection
        const teachersColl = APPWRITE_CONFIG.collections.teachers || 'teachers';
        if (teachersColl) {
          try {
            const res = await databases.listDocuments(
              APPWRITE_CONFIG.databaseId,
              teachersColl,
              [Query.limit(100)]
            );
            res.documents.forEach((d: any) => {
              let assigned = d.assignedPrograms;
              if (typeof assigned === 'string') {
                try { assigned = JSON.parse(assigned); } catch { assigned = []; }
              }
              if (!Array.isArray(assigned)) assigned = [];
              const emailKey = (d.email || '').toLowerCase().trim();
              if (!teachersMap.has(emailKey) || !teachersMap.get(emailKey).name) {
                teachersMap.set(emailKey, {
                  id: d.$id,
                  name: `${d.firstName || ''} ${d.lastName || ''}`.trim() || d.name || d.email,
                  email: d.email,
                  assignedPrograms: assigned,
                  speciality: d.speciality || '',
                });
              }
            });
          } catch (err) {
            console.warn('dbAdapter.teachers collection query:', err);
          }
        }

        if (teachersMap.size > 0) {
          const list = Array.from(teachersMap.values());
          try {
            localStorage.setItem('idla_local_teachers', JSON.stringify(list));
          } catch (e) {}
          return list;
        }
        return local;
      } catch (err) {
        console.warn('dbAdapter.teachers fallback:', err);
        return local;
      }
    },
  },

  // ── LMD : Semesters ──────────────────────────────────────────────────────
  semesters: {
    async list(programId?: string): Promise<Semester[]> {
      let local: Semester[] = [];
      try {
        local = JSON.parse(localStorage.getItem('idla_local_semesters') || '[]');
      } catch (e) {}

      if (programId) {
        local = local.filter((s) => s.programId === programId);
      }

      if (!isAppwriteDbConfigured() || !APPWRITE_CONFIG.collections.semesters) {
        return local.sort((a, b) => a.number - b.number);
      }

      try {
        const queries = [Query.limit(500), Query.orderAsc('number')];
        if (programId) queries.push(Query.equal('programId', programId));

        const res = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.semesters,
          queries
        );
        const remote: Semester[] = res.documents.map((d: any) => ({
          id: d.$id,
          programId: d.programId,
          name: d.name,
          number: d.number,
          academicYear: d.academicYear || '',
          academicLevel: d.academicLevel || '',
          startDate: d.startDate,
          endDate: d.endDate,
          rattrapageStartDate: d.rattrapageStartDate,
          rattrapageEndDate: d.rattrapageEndDate,
          status: d.status || 'actif',
        }));

        const mergedMap = new Map<string, Semester>();
        remote.forEach((r) => mergedMap.set(r.id, r));
        local.forEach((l) => {
          mergedMap.set(l.id, { ...(mergedMap.get(l.id) || {}), ...l });
        });
        const merged = Array.from(mergedMap.values());
        if (merged.length > 0) {
          return merged.sort((a, b) => a.number - b.number);
        }
        return local.sort((a, b) => a.number - b.number);
      } catch (err) {
        console.warn('dbAdapter.semesters.list fallback:', err);
        return local.sort((a, b) => a.number - b.number);
      }
    },

    async create(data: Omit<Semester, 'id'>): Promise<Semester> {
      const newId = ID.unique();
      const sem: Semester = { id: newId, ...data };

      try {
        const curr: Semester[] = JSON.parse(localStorage.getItem('idla_local_semesters') || '[]');
        localStorage.setItem('idla_local_semesters', JSON.stringify([...curr, sem]));
      } catch (e) {}

      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.semesters) {
        try {
          const docData: any = {
            programId: sem.programId,
            name: sem.name,
            number: sem.number,
            startDate: sem.startDate || '',
            endDate: sem.endDate || '',
            rattrapageStartDate: sem.rattrapageStartDate || '',
            rattrapageEndDate: sem.rattrapageEndDate || '',
            status: sem.status || 'actif',
          };
          if (sem.academicYear) docData.academicYear = sem.academicYear;
          if (sem.academicLevel) docData.academicLevel = sem.academicLevel;

          await databases.createDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.semesters,
            newId,
            docData,
            [
              Permission.read(Role.any()),
              Permission.update(Role.any()),
              Permission.delete(Role.any()),
            ]
          );
        } catch (err) {
          console.warn('dbAdapter.semesters.create cloud error:', err);
        }
      }
      return sem;
    },

    async update(id: string, updates: Partial<Semester>): Promise<void> {
      try {
        const curr: Semester[] = JSON.parse(localStorage.getItem('idla_local_semesters') || '[]');
        const next = curr.map((s) => (s.id === id ? { ...s, ...updates } : s));
        localStorage.setItem('idla_local_semesters', JSON.stringify(next));
      } catch (e) {}

      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.semesters) {
        try {
          await databases.updateDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.semesters,
            id,
            updates as any
          );
        } catch (err) {
          console.warn('dbAdapter.semesters.update cloud error:', err);
        }
      }
    },

    async delete(id: string): Promise<void> {
      try {
        const curr: Semester[] = JSON.parse(localStorage.getItem('idla_local_semesters') || '[]');
        const next = curr.filter((s) => s.id !== id);
        localStorage.setItem('idla_local_semesters', JSON.stringify(next));
      } catch (e) {}

      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.semesters) {
        try {
          await databases.deleteDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.semesters,
            id
          );
        } catch (err) {
          console.warn('dbAdapter.semesters.delete cloud error:', err);
        }
      }
    },
  },

  // ── LMD : Teaching Units (UE) ─────────────────────────────────────────────
  teachingUnits: {
    async list(programId?: string, semesterId?: string): Promise<TeachingUnit[]> {
      let local: TeachingUnit[] = [];
      try {
        local = JSON.parse(localStorage.getItem('idla_local_teaching_units') || '[]');
      } catch (e) {}

      if (programId) local = local.filter((u) => u.programId === programId);
      if (semesterId) local = local.filter((u) => u.semesterId === semesterId);

      if (!isAppwriteDbConfigured() || !APPWRITE_CONFIG.collections.teachingUnits) {
        return local;
      }

      try {
        const queries = [Query.limit(1000), Query.orderAsc('code')];
        if (programId) queries.push(Query.equal('programId', programId));
        if (semesterId) queries.push(Query.equal('semesterId', semesterId));

        const res = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.teachingUnits,
          queries
        );
        const remote: TeachingUnit[] = res.documents.map((d: any) => ({
          id: d.$id,
          programId: d.programId,
          semesterId: d.semesterId,
          code: d.code,
          title: d.title,
          teacherId: d.teacherId,
          teacherName: d.teacherName,
          volumeCM: d.volumeCM || 0,
          volumeTD: d.volumeTD || 0,
          volumeTP: d.volumeTP || 0,
          description: d.description || '',
          prerequisiteUeId: d.prerequisiteUeId || '',
          coefficient: d.coefficient !== undefined ? Number(d.coefficient) : 3,
          isCompensable: d.isCompensable !== false,
          bccId: d.bccId || '',
          m3cWeightCC: d.m3cWeightCC !== undefined ? Number(d.m3cWeightCC) : 40,
          m3cWeightExam: d.m3cWeightExam !== undefined ? Number(d.m3cWeightExam) : 50,
          m3cWeightTP: d.m3cWeightTP !== undefined ? Number(d.m3cWeightTP) : 10,
        }));

        const mergedMap = new Map<string, TeachingUnit>();
        remote.forEach((r) => mergedMap.set(r.id, r));
        local.forEach((l) => {
          mergedMap.set(l.id, { ...(mergedMap.get(l.id) || {}), ...l });
        });
        const merged = Array.from(mergedMap.values());
        if (merged.length > 0) {
          return merged;
        }
        return local;
      } catch (err) {
        console.warn('dbAdapter.teachingUnits.list fallback:', err);
        return local;
      }
    },

    async create(data: Omit<TeachingUnit, 'id'>): Promise<TeachingUnit> {
      const newId = ID.unique();
      const ue: TeachingUnit = { 
        id: newId, 
        coefficient: 3, 
        isCompensable: true, 
        m3cWeightCC: 40, 
        m3cWeightExam: 50, 
        m3cWeightTP: 10, 
        ...data 
      };

      try {
        const curr: TeachingUnit[] = JSON.parse(localStorage.getItem('idla_local_teaching_units') || '[]');
        localStorage.setItem('idla_local_teaching_units', JSON.stringify([...curr, ue]));
      } catch (e) {}

      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.teachingUnits) {
        try {
          const docData: any = {
            programId: ue.programId,
            semesterId: ue.semesterId,
            code: ue.code,
            title: ue.title,
            teacherId: ue.teacherId || '',
            teacherName: ue.teacherName || '',
            volumeCM: ue.volumeCM || 0,
            volumeTD: ue.volumeTD || 0,
            volumeTP: ue.volumeTP || 0,
            description: ue.description || '',
            prerequisiteUeId: ue.prerequisiteUeId || '',
          };
          if (ue.coefficient !== undefined) docData.coefficient = Number(ue.coefficient);
          if (ue.isCompensable !== undefined) docData.isCompensable = !!ue.isCompensable;
          if (ue.bccId) docData.bccId = ue.bccId;
          if (ue.m3cWeightCC !== undefined) docData.m3cWeightCC = Number(ue.m3cWeightCC);
          if (ue.m3cWeightExam !== undefined) docData.m3cWeightExam = Number(ue.m3cWeightExam);
          if (ue.m3cWeightTP !== undefined) docData.m3cWeightTP = Number(ue.m3cWeightTP);

          await databases.createDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.teachingUnits,
            newId,
            docData,
            [
              Permission.read(Role.any()),
              Permission.update(Role.any()),
              Permission.delete(Role.any()),
            ]
          );
        } catch (err) {
          console.warn('dbAdapter.teachingUnits.create cloud error:', err);
        }
      }
      return ue;
    },

    async update(id: string, updates: Partial<TeachingUnit>): Promise<void> {
      try {
        const curr: TeachingUnit[] = JSON.parse(localStorage.getItem('idla_local_teaching_units') || '[]');
        const next = curr.map((u) => (u.id === id ? { ...u, ...updates } : u));
        localStorage.setItem('idla_local_teaching_units', JSON.stringify(next));
      } catch (e) {}

      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.teachingUnits) {
        try {
          await databases.updateDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.teachingUnits,
            id,
            updates as any
          );
        } catch (err) {
          console.warn('dbAdapter.teachingUnits.update cloud error:', err);
        }
      }
    },

    async delete(id: string): Promise<void> {
      try {
        const curr: TeachingUnit[] = JSON.parse(localStorage.getItem('idla_local_teaching_units') || '[]');
        const next = curr.filter((u) => u.id !== id);
        localStorage.setItem('idla_local_teaching_units', JSON.stringify(next));
      } catch (e) {}

      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.teachingUnits) {
        try {
          await databases.deleteDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.teachingUnits,
            id
          );
        } catch (err) {
          console.warn('dbAdapter.teachingUnits.delete cloud error:', err);
        }
      }
    },
  },

  // ── LMD : Student UE Records & Evaluations ────────────────────────────────
  studentUeRecords: {
    async list(filters?: { studentEmail?: string; programId?: string; semesterId?: string; ueId?: string }): Promise<StudentUERecord[]> {
      let local: StudentUERecord[] = [];
      try {
        local = JSON.parse(localStorage.getItem('idla_local_student_ue_records') || '[]');
      } catch (e) {}

      if (filters?.studentEmail) {
        local = local.filter((r) => r.studentEmail.toLowerCase().trim() === filters.studentEmail!.toLowerCase().trim());
      }
      if (filters?.programId) {
        local = local.filter((r) => r.programId === filters.programId);
      }
      if (filters?.semesterId) {
        local = local.filter((r) => r.semesterId === filters.semesterId);
      }
      if (filters?.ueId) {
        local = local.filter((r) => r.ueId === filters.ueId);
      }

      if (!isAppwriteDbConfigured() || !APPWRITE_CONFIG.collections.studentUeRecords) {
        return local;
      }

      try {
        const queries = [Query.limit(5000), Query.orderDesc('$createdAt')];
        if (filters?.studentEmail) queries.push(Query.equal('studentEmail', filters.studentEmail.toLowerCase().trim()));
        if (filters?.programId) queries.push(Query.equal('programId', filters.programId));
        if (filters?.semesterId) queries.push(Query.equal('semesterId', filters.semesterId));
        if (filters?.ueId) queries.push(Query.equal('ueId', filters.ueId));

        const res = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.studentUeRecords,
          queries
        );
        const remote: StudentUERecord[] = res.documents.map((d: any) => ({
          id: d.$id,
          studentEmail: d.studentEmail,
          studentName: d.studentName || '',
          studentId: d.studentId || d.student_id || '',
          ueId: d.ueId,
          semesterId: d.semesterId,
          programId: d.programId,
          sessionType: d.sessionType || 'normale',
          status: d.status || 'inscrit',
          validatedBy: d.validatedBy || '',
          validatedAt: d.validatedAt || '',
          remarks: d.remarks || '',
          noteCC: d.noteCC !== undefined && d.noteCC !== null ? Number(d.noteCC) : undefined,
          noteExam: d.noteExam !== undefined && d.noteExam !== null ? Number(d.noteExam) : undefined,
          noteTP: d.noteTP !== undefined && d.noteTP !== null ? Number(d.noteTP) : undefined,
          noteFinal: d.noteFinal !== undefined && d.noteFinal !== null ? Number(d.noteFinal) : undefined,
          isOverridden: !!d.isOverridden,
          noteRattrapage: d.noteRattrapage !== undefined && d.noteRattrapage !== null ? Number(d.noteRattrapage) : undefined,
          noteBestOf: d.noteBestOf !== undefined && d.noteBestOf !== null ? Number(d.noteBestOf) : undefined,
          isDefaillant: !!d.isDefaillant,
          isCompensated: !!d.isCompensated,
        }));

        const mergedMap = new Map<string, StudentUERecord>();
        remote.forEach((r) => mergedMap.set(r.id, r));
        local.forEach((l) => {
          mergedMap.set(l.id, { ...(mergedMap.get(l.id) || {}), ...l });
        });
        const merged = Array.from(mergedMap.values());
        if (merged.length > 0) {
          return merged;
        }
        return local;
      } catch (err) {
        console.warn('dbAdapter.studentUeRecords.list fallback:', err);
        return local;
      }
    },

    async create(data: Omit<StudentUERecord, 'id'>): Promise<StudentUERecord> {
      const email = data.studentEmail.toLowerCase().trim();
      
      // Check existing to prevent duplicate enrolments
      try {
        const existing = await this.list({ 
          studentEmail: email, 
          ueId: data.ueId 
        });
        const match = existing.find((r) => r.sessionType === (data.sessionType || 'normale'));
        if (match) {
          return match;
        }
      } catch (e) {}

      const newId = ID.unique();
      const rec: StudentUERecord = { id: newId, ...data, studentEmail: email };

      try {
        const curr: StudentUERecord[] = JSON.parse(localStorage.getItem('idla_local_student_ue_records') || '[]');
        localStorage.setItem('idla_local_student_ue_records', JSON.stringify([...curr, rec]));
      } catch (e) {}

      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.studentUeRecords) {
        try {
          const docData: any = {
            studentEmail: email,
            studentName: rec.studentName || '',
            ueId: rec.ueId,
            semesterId: rec.semesterId,
            programId: rec.programId,
            sessionType: rec.sessionType || 'normale',
            status: rec.status || 'inscrit',
            validatedBy: rec.validatedBy || '',
            validatedAt: rec.validatedAt || '',
            remarks: rec.remarks || '',
          };
          if (rec.studentId) docData.studentId = rec.studentId;
          if (rec.noteCC !== undefined) docData.noteCC = Number(rec.noteCC);
          if (rec.noteExam !== undefined) docData.noteExam = Number(rec.noteExam);
          if (rec.noteTP !== undefined) docData.noteTP = Number(rec.noteTP);
          if (rec.noteFinal !== undefined) docData.noteFinal = Number(rec.noteFinal);
          if (rec.isOverridden !== undefined) docData.isOverridden = !!rec.isOverridden;
          if (rec.noteRattrapage !== undefined) docData.noteRattrapage = Number(rec.noteRattrapage);
          if (rec.noteBestOf !== undefined) docData.noteBestOf = Number(rec.noteBestOf);
          if (rec.isDefaillant !== undefined) docData.isDefaillant = !!rec.isDefaillant;
          if (rec.isCompensated !== undefined) docData.isCompensated = !!rec.isCompensated;

          await databases.createDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.studentUeRecords,
            newId,
            docData,
            [
              Permission.read(Role.any()),
              Permission.update(Role.any()),
              Permission.delete(Role.any()),
            ]
          );
        } catch (err) {
          console.warn('dbAdapter.studentUeRecords.create cloud error:', err);
        }
      }
      return rec;
    },

    async update(id: string, updates: Partial<StudentUERecord>): Promise<void> {
      try {
        const curr: StudentUERecord[] = JSON.parse(localStorage.getItem('idla_local_student_ue_records') || '[]');
        const next = curr.map((r) => (r.id === id ? { ...r, ...updates } : r));
        localStorage.setItem('idla_local_student_ue_records', JSON.stringify(next));
      } catch (e) {}

      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.studentUeRecords) {
        try {
          await databases.updateDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.studentUeRecords,
            id,
            updates as any
          );
        } catch (err) {
          console.warn('dbAdapter.studentUeRecords.update cloud error:', err);
        }
      }
    },

    async bulkEnroll(records: Omit<StudentUERecord, 'id'>[]): Promise<StudentUERecord[]> {
      const results: StudentUERecord[] = [];
      for (const rec of records) {
        const created = await this.create(rec);
        results.push(created);
      }
      return results;
    },
  },

  // ── LMD : Course Resources (Vidéos & PDF) ──────────────────────────────────
  courseResources: {
    async list(ueId?: string): Promise<CourseResource[]> {
      let local: CourseResource[] = [];
      try {
        local = JSON.parse(localStorage.getItem('idla_local_course_resources') || '[]');
      } catch (e) {}

      if (ueId) {
        local = local.filter((r) => r.ueId === ueId);
      }

      if (!isAppwriteDbConfigured() || !APPWRITE_CONFIG.collections.courseResources) {
        return local.sort((a, b) => a.orderIndex - b.orderIndex);
      }

      try {
        const queries = [Query.limit(1000), Query.orderAsc('orderIndex')];
        if (ueId) queries.push(Query.equal('ueId', ueId));

        const res = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.courseResources,
          queries
        );
        const remote: CourseResource[] = res.documents.map((d: any) => ({
          id: d.$id,
          ueId: d.ueId,
          title: d.title,
          type: d.type || 'pdf',
          contentUrl: d.contentUrl,
          fileId: d.fileId,
          fileName: d.fileName,
          orderIndex: d.orderIndex || 1,
        }));

        if (remote.length > 0) {
          return remote;
        }
        return local.sort((a, b) => a.orderIndex - b.orderIndex);
      } catch (err) {
        console.warn('dbAdapter.courseResources.list fallback:', err);
        return local.sort((a, b) => a.orderIndex - b.orderIndex);
      }
    },

    async create(data: Omit<CourseResource, 'id'>): Promise<CourseResource> {
      const newId = ID.unique();
      const resItem: CourseResource = { id: newId, ...data };

      try {
        const curr: CourseResource[] = JSON.parse(localStorage.getItem('idla_local_course_resources') || '[]');
        localStorage.setItem('idla_local_course_resources', JSON.stringify([...curr, resItem]));
      } catch (e) {}

      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.courseResources) {
        try {
          await databases.createDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.courseResources,
            newId,
            {
              ueId: resItem.ueId,
              title: resItem.title,
              type: resItem.type,
              contentUrl: resItem.contentUrl || '',
              fileId: resItem.fileId || '',
              fileName: resItem.fileName || '',
              orderIndex: resItem.orderIndex || 1,
            },
            [
              Permission.read(Role.any()),
              Permission.update(Role.any()),
              Permission.delete(Role.any()),
            ]
          );
        } catch (err) {
          console.warn('dbAdapter.courseResources.create cloud error:', err);
        }
      }
      return resItem;
    },

    async delete(id: string): Promise<void> {
      try {
        const curr: CourseResource[] = JSON.parse(localStorage.getItem('idla_local_course_resources') || '[]');
        const next = curr.filter((r) => r.id !== id);
        localStorage.setItem('idla_local_course_resources', JSON.stringify(next));
      } catch (e) {}

      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.courseResources) {
        try {
          await databases.deleteDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.courseResources,
            id
          );
        } catch (err) {
          console.warn('dbAdapter.courseResources.delete cloud error:', err);
        }
      }
    },
  },

  // ── LMD : Interconnection & Auto-Initialization Engine ───────────────────
  academicStructure: {
    async ensureProgramInitialized(
      programTitleOrId: string, 
      options?: {
        courseTitles?: string[];
        teacherId?: string;
        teacherName?: string;
        semesterNumber?: number;
        entryLevel?: string;
      }
    ): Promise<{ programId: string; semesterId: string; ues: TeachingUnit[] }> {
      const progId = (await dbAdapter.programs.resolveProgramId(programTitleOrId)) || programTitleOrId;
      
      let targetSemesterNum = options?.semesterNumber || 1;
      if (options?.entryLevel) {
        const lvl = options.entryLevel.toUpperCase().trim();
        if (lvl.includes('L3') || lvl.includes('LICENCE 3')) targetSemesterNum = 5;
        else if (lvl.includes('L2') || lvl.includes('LICENCE 2')) targetSemesterNum = 3;
        else if (lvl.includes('M2') || lvl.includes('MASTER 2')) targetSemesterNum = 3;
        else if (lvl.includes('M1') || lvl.includes('MASTER 1')) targetSemesterNum = 1;
        else if (lvl.includes('L1') || lvl.includes('LICENCE 1')) targetSemesterNum = 1;
      }

      // 1. Ensure Target Semestre exists
      let sems = await dbAdapter.semesters.list(progId);
      let targetSem = sems.find((s) => s.number === targetSemesterNum) || (targetSemesterNum === 1 ? sems[0] : undefined);
      if (!targetSem) {
        targetSem = await dbAdapter.semesters.create({
          programId: progId,
          name: `Semestre ${targetSemesterNum} (S${targetSemesterNum})`,
          number: targetSemesterNum,
          status: 'actif',
        });
      }

      // 2. Ensure UEs exist for specified courses or defaults
      const existingUes = await dbAdapter.teachingUnits.list(progId, targetSem.id);
      const createdOrUpdatedUes: TeachingUnit[] = [...existingUes];

      if (options?.courseTitles && options.courseTitles.length > 0) {
        for (const cTitle of options.courseTitles) {
          const matchUe = existingUes.find((u) => u.title.toLowerCase().trim() === cTitle.toLowerCase().trim());
          if (matchUe) {
            if (options.teacherId && (!matchUe.teacherId || matchUe.teacherId !== options.teacherId)) {
              await dbAdapter.teachingUnits.update(matchUe.id, {
                teacherId: options.teacherId,
                teacherName: options.teacherName || matchUe.teacherName,
              });
              matchUe.teacherId = options.teacherId;
              matchUe.teacherName = options.teacherName || matchUe.teacherName;
            }
          } else {
            const newUe = await dbAdapter.teachingUnits.create({
              programId: progId,
              semesterId: targetSem.id,
              code: `UE${Math.floor(100 + Math.random() * 900)}`,
              title: cTitle,
              teacherId: options.teacherId || '',
              teacherName: options.teacherName || '',
              volumeCM: 20,
              volumeTD: 10,
              volumeTP: 10,
            });
            createdOrUpdatedUes.push(newUe);
          }
        }
      }

      return { programId: progId, semesterId: targetSem.id, ues: createdOrUpdatedUes };
    },

    /**
     * Synchronise exhaustivement tous les cours et UE existants dans la plateforme :
     * - Scanne les créneaux scheduleData et les assignedCourses des professeurs.
     * - Scanne les cours locaux déclarés.
     * - Détecte le niveau d'étude (L1, L2, L3, M1, M2...).
     * - Ventile chaque cours dans le semestre adéquat (L1 -> S1/S2, L2 -> S3/S4, L3 -> S5/S6, M1 -> S1/S2, M2 -> S3/S4).
     * - Assigne le professeur, le coefficient réglementaire (3) et la pondération M3C.
     */
    async syncAllExistingCourses(targetProgramId?: string): Promise<{
      totalFound: number;
      imported: number;
      alreadySynced: number;
      details: Array<{ programTitle: string; level: string; semesterName: string; courseTitle: string; teacherName?: string }>;
    }> {
      const details: Array<{ programTitle: string; level: string; semesterName: string; courseTitle: string; teacherName?: string }> = [];
      let imported = 0;
      let alreadySynced = 0;

      // 1. Programmes
      const allPrograms = await dbAdapter.programs.list();
      
      // 2. Enseignants
      const teachers = await dbAdapter.teachers.list();
      
      // 3. Cours locaux
      const localCourses = await dbAdapter.courses.list();

      interface DetectedCourse {
        programId: string;
        programTitle: string;
        level: string; // 'L1', 'L2', 'L3', 'M1', 'M2'
        title: string;
        teacherId?: string;
        teacherName?: string;
        volumeCM?: number;
        volumeTD?: number;
        volumeTP?: number;
      }

      const detectedMap = new Map<string, DetectedCourse>();

      // A. Parser les créneaux scheduleData des enseignants
      teachers.forEach((t: any) => {
        let schedule: any[] = [];
        try {
          schedule = typeof t.scheduleData === 'string' ? JSON.parse(t.scheduleData) : (t.scheduleData || []);
        } catch (e) {}

        if (Array.isArray(schedule)) {
          schedule.forEach((slot) => {
            if (!slot.course || !slot.course.trim()) return;
            const cTitle = slot.course.trim();
            const slotProg = slot.program || '';
            const slotLevel = (slot.level || 'L1').trim().toUpperCase();

            const matchedProg = allPrograms.find((p) => 
              (slotProg && p.title.toLowerCase().includes(slotProg.toLowerCase().split(' - ')[0])) ||
              (slotProg && slotProg.toLowerCase().includes(p.title.toLowerCase()))
            );

            if (matchedProg) {
              const key = `${matchedProg.id}___${slotLevel}___${cTitle.toLowerCase()}`;
              if (!detectedMap.has(key)) {
                detectedMap.set(key, {
                  programId: matchedProg.id,
                  programTitle: matchedProg.title,
                  level: slotLevel,
                  title: cTitle,
                  teacherId: t.id,
                  teacherName: t.name,
                  volumeCM: slot.type === 'CM' ? 24 : 16,
                  volumeTD: slot.type === 'TD' ? 16 : 8,
                  volumeTP: slot.type === 'TP' ? 16 : 8,
                });
              }
            }
          });
        }

        // B. Parser assignedCourses des enseignants
        const assignedCourses = t.assignedCourses || [];
        const assignedProgs = t.assignedPrograms || [];
        if (Array.isArray(assignedCourses) && assignedCourses.length > 0) {
          assignedCourses.forEach((cName: string) => {
            if (!cName || !cName.trim()) return;
            const clean = cName.trim();
            assignedProgs.forEach((ap: string) => {
              const baseP = ap.split(' - ')[0];
              const levelPart = ap.includes(' - ') ? ap.split(' - ')[1].trim().toUpperCase() : 'L1';
              const matchedProg = allPrograms.find((p) => p.title.toLowerCase().includes(baseP.toLowerCase()));
              if (matchedProg) {
                const key = `${matchedProg.id}___${levelPart}___${clean.toLowerCase()}`;
                if (!detectedMap.has(key)) {
                  detectedMap.set(key, {
                    programId: matchedProg.id,
                    programTitle: matchedProg.title,
                    level: levelPart,
                    title: clean,
                    teacherId: t.id,
                    teacherName: t.name,
                    volumeCM: 20,
                    volumeTD: 10,
                    volumeTP: 10,
                  });
                }
              }
            });
          });
        }
      });

      // C. Parser les cours locaux
      localCourses.forEach((c) => {
        if (!c.title || !c.title.trim()) return;
        const cTitle = c.title.trim();
        const cp = (c.program || '').toLowerCase();
        const matchedProg = allPrograms.find((p) => p.title.toLowerCase() === cp || p.title.toLowerCase().includes(cp));
        if (matchedProg) {
          const key = `${matchedProg.id}___L1___${cTitle.toLowerCase()}`;
          if (!detectedMap.has(key)) {
            detectedMap.set(key, {
              programId: matchedProg.id,
              programTitle: matchedProg.title,
              level: 'L1',
              title: cTitle,
              teacherId: c.teacherId || '',
              teacherName: c.teacherName || '',
              volumeCM: c.volumeCM || 20,
              volumeTD: c.volumeTD || 10,
              volumeTP: c.volumeTP || 10,
            });
          }
        }
      });

      let coursesToSync = Array.from(detectedMap.values());
      if (targetProgramId) {
        coursesToSync = coursesToSync.filter((c) => c.programId === targetProgramId);
      }

      const byProgram = new Map<string, DetectedCourse[]>();
      coursesToSync.forEach((c) => {
        const arr = byProgram.get(c.programId) || [];
        arr.push(c);
        byProgram.set(c.programId, arr);
      });

      for (const [progId, progCourses] of byProgram.entries()) {
        const prog = allPrograms.find((p) => p.id === progId);
        if (!prog) continue;

        let sems = await dbAdapter.semesters.list(progId);
        if (sems.length === 0) {
          const isMaster = prog.type === 'Master';
          const totalSem = isMaster ? 4 : (prog.type === 'Certification' ? 1 : 6);
          const currentYr = new Date().getFullYear();
          const academicYear = `${currentYr}-${currentYr + 1}`;

          for (let i = 1; i <= totalSem; i++) {
            let academicLevel = 'L1';
            if (isMaster) {
              academicLevel = i <= 2 ? 'M1' : 'M2';
            } else if (prog.type === 'Doctorat') {
              academicLevel = i <= 2 ? 'D1' : (i <= 4 ? 'D2' : 'D3');
            } else {
              academicLevel = i <= 2 ? 'L1' : (i <= 4 ? 'L2' : 'L3');
            }

            const newSem = await dbAdapter.semesters.create({
              programId: progId,
              name: `Semestre ${i} (S${i})`,
              number: i,
              academicYear,
              academicLevel,
              status: i === 1 ? 'actif' : 'cloture',
            });
            sems.push(newSem);
          }
        }

        const existingUes = await dbAdapter.teachingUnits.list(progId);

        for (const c of progCourses) {
          let targetSemesterNumber = 1;
          const lvl = c.level.toUpperCase();

          if (lvl.includes('L2') || lvl.includes('NIVEAU 2')) {
            targetSemesterNumber = 3;
          } else if (lvl.includes('L3') || lvl.includes('NIVEAU 3')) {
            targetSemesterNumber = 5;
          } else if (lvl.includes('M1')) {
            targetSemesterNumber = 1;
          } else if (lvl.includes('M2')) {
            targetSemesterNumber = 3;
          } else {
            targetSemesterNumber = 1;
          }

          let targetSem = sems.find((s) => s.number === targetSemesterNumber);
          if (!targetSem) {
            targetSem = sems[0];
          }

          const already = existingUes.find((u) => 
            u.title.toLowerCase().trim() === c.title.toLowerCase().trim() ||
            (u.semesterId === targetSem!.id && u.title.toLowerCase().includes(c.title.toLowerCase()))
          );

          if (already) {
            alreadySynced++;
            if (c.teacherId && !already.teacherId) {
              await dbAdapter.teachingUnits.update(already.id, {
                teacherId: c.teacherId,
                teacherName: c.teacherName,
              });
            }
          } else {
            const newUe = await dbAdapter.teachingUnits.create({
              programId: progId,
              semesterId: targetSem.id,
              code: `UE${Math.floor(100 + Math.random() * 900)}`,
              title: c.title,
              teacherId: c.teacherId || '',
              teacherName: c.teacherName || '',
              volumeCM: c.volumeCM || 20,
              volumeTD: c.volumeTD || 10,
              volumeTP: c.volumeTP || 10,
              coefficient: 3,
              isCompensable: true,
              m3cWeightCC: 40,
              m3cWeightExam: 50,
              m3cWeightTP: 10,
            });
            existingUes.push(newUe);
            imported++;
            details.push({
              programTitle: prog.title,
              level: targetSem.academicLevel || c.level,
              semesterName: targetSem.name,
              courseTitle: c.title,
              teacherName: c.teacherName,
            });
          }
        }
      }

      return {
        totalFound: coursesToSync.length,
        imported,
        alreadySynced,
        details,
      };
    }
  },

  // ── LMD : Student Semester Results & Délibérations ────────────────────────
  studentSemesterResults: {
    async list(filters?: { studentEmail?: string; programId?: string; semesterId?: string }): Promise<StudentSemesterResult[]> {
      let local: StudentSemesterResult[] = [];
      try {
        local = JSON.parse(localStorage.getItem('idla_local_student_semester_results') || '[]');
      } catch (e) {}

      if (filters?.studentEmail) {
        local = local.filter((r) => r.studentEmail.toLowerCase().trim() === filters.studentEmail!.toLowerCase().trim());
      }
      if (filters?.programId) {
        local = local.filter((r) => r.programId === filters.programId);
      }
      if (filters?.semesterId) {
        local = local.filter((r) => r.semesterId === filters.semesterId);
      }

      if (!isAppwriteDbConfigured() || !APPWRITE_CONFIG.collections.studentSemesterResults) {
        return local;
      }

      try {
        const queries = [Query.limit(5000), Query.orderDesc('$createdAt')];
        if (filters?.studentEmail) queries.push(Query.equal('studentEmail', filters.studentEmail.toLowerCase().trim()));
        if (filters?.programId) queries.push(Query.equal('programId', filters.programId));
        if (filters?.semesterId) queries.push(Query.equal('semesterId', filters.semesterId));

        const res = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.studentSemesterResults,
          queries
        );
        const remote: StudentSemesterResult[] = res.documents.map((d: any) => ({
          id: d.$id,
          studentEmail: d.studentEmail,
          studentName: d.studentName || '',
          studentId: d.studentId || '',
          programId: d.programId,
          semesterId: d.semesterId,
          moyenneSemestre: d.moyenneSemestre !== undefined ? Number(d.moyenneSemestre) : undefined,
          totalCoefficients: Number(d.totalCoefficients || 0),
          uesValidees: Number(d.uesValidees || 0),
          uesNonValidees: Number(d.uesNonValidees || 0),
          uesCompensees: Number(d.uesCompensees || 0),
          uesDefaillantes: Number(d.uesDefaillantes || 0),
          decision: d.decision || 'EN_COURS',
          isCompensationApplied: !!d.isCompensationApplied,
          deliberatedBy: d.deliberatedBy || '',
          deliberatedAt: d.deliberatedAt || '',
          remarks: d.remarks || '',
        }));

        if (remote.length > 0) {
          return remote;
        }
        return local;
      } catch (err) {
        return local;
      }
    },

    async save(data: Omit<StudentSemesterResult, 'id'> & { id?: string }): Promise<StudentSemesterResult> {
      const email = data.studentEmail.toLowerCase().trim();
      const existing = await this.list({ studentEmail: email, semesterId: data.semesterId });
      const current = existing[0];
      const targetId = data.id || current?.id || ID.unique();
      const record: StudentSemesterResult = { ...data, id: targetId, studentEmail: email };

      try {
        const curr: StudentSemesterResult[] = JSON.parse(localStorage.getItem('idla_local_student_semester_results') || '[]');
        const next = curr.filter((r) => r.id !== targetId && !(r.studentEmail === email && r.semesterId === data.semesterId));
        localStorage.setItem('idla_local_student_semester_results', JSON.stringify([...next, record]));
      } catch (e) {}

      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.studentSemesterResults) {
        try {
          const docData: any = {
            studentEmail: email,
            studentName: record.studentName || '',
            programId: record.programId,
            semesterId: record.semesterId,
            totalCoefficients: record.totalCoefficients,
            uesValidees: record.uesValidees,
            uesNonValidees: record.uesNonValidees,
            uesCompensees: record.uesCompensees,
            uesDefaillantes: record.uesDefaillantes,
            decision: record.decision,
            isCompensationApplied: record.isCompensationApplied,
            deliberatedBy: record.deliberatedBy || '',
            deliberatedAt: record.deliberatedAt || '',
            remarks: record.remarks || '',
          };
          if (record.moyenneSemestre !== undefined) docData.moyenneSemestre = record.moyenneSemestre;
          if (record.studentId) docData.studentId = record.studentId;

          if (current?.id) {
            await databases.updateDocument(
              APPWRITE_CONFIG.databaseId,
              APPWRITE_CONFIG.collections.studentSemesterResults,
              current.id,
              docData
            );
          } else {
            await databases.createDocument(
              APPWRITE_CONFIG.databaseId,
              APPWRITE_CONFIG.collections.studentSemesterResults,
              targetId,
              docData,
              [
                Permission.read(Role.any()),
                Permission.update(Role.any()),
                Permission.delete(Role.any()),
              ]
            );
          }
        } catch (err) {
          console.warn('dbAdapter.studentSemesterResults.save cloud error:', err);
        }
      }
      return record;
    },

    async delete(id: string): Promise<void> {
      try {
        const curr: StudentSemesterResult[] = JSON.parse(localStorage.getItem('idla_local_student_semester_results') || '[]');
        const next = curr.filter((r) => r.id !== id);
        localStorage.setItem('idla_local_student_semester_results', JSON.stringify(next));
      } catch (e) {}

      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.studentSemesterResults) {
        try {
          await databases.deleteDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.studentSemesterResults,
            id
          );
        } catch (err) {
          console.warn('dbAdapter.studentSemesterResults.delete cloud error:', err);
        }
      }
    }
  },

  // ── LMD : Evaluation Engine ───────────────────────────────────────────────
  evaluation: lmdEvaluationEngine,
};
