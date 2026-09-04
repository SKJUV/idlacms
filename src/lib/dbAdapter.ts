import { databases, storage, APPWRITE_CONFIG, isAppwriteDbConfigured, isAppwriteStorageConfigured, ID, Query, Permission, Role } from './appwrite';
import { Program, NewsArticle, Testimonial, User, PreRegistration, ActivityLog, Course, ScheduleSlot, AcademicSession } from '../types';

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
              Permission.update(Role.label('admin')),
              Permission.delete(Role.label('admin')),
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
              Permission.update(Role.label('admin')),
              Permission.delete(Role.label('admin')),
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
          dateApplied: doc.dateApplied || doc.$createdAt,
          status: doc.status || 'New',
          initials: doc.initials || (doc.name || 'CN').substring(0, 2).toUpperCase(),
          phone: doc.phone,
          nationality: doc.nationality,
          highestDegree: doc.highestDegree,
          graduationYear: doc.graduationYear,
          motivation: doc.motivation,
          documents: doc.files ? JSON.parse(doc.files).map((f: any) => f.name) : [],
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
      const app: PreRegistration = { id: newId, ...appData };

      try {
        const curr = JSON.parse(localStorage.getItem('idla_local_applications') || '[]');
        localStorage.setItem('idla_local_applications', JSON.stringify([app, ...curr]));
      } catch (e) {}

      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.applications) {
        try {
          await databases.createDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.applications,
            newId,
            {
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
            },
            [
              Permission.create(Role.any()),
              Permission.read(Role.label('admin')),
              Permission.update(Role.label('admin')),
              Permission.delete(Role.label('admin')),
            ]
          );
        } catch (err) {
          console.error('dbAdapter.applications.create cloud error:', err);
        }
      }
      return app;
    },

    async updateStatus(id: string, status: PreRegistration['status'], matricule?: string): Promise<void> {
      try {
        const curr: PreRegistration[] = JSON.parse(localStorage.getItem('idla_local_applications') || '[]');
        const next = curr.map((a) => (a.id === id ? { ...a, status, ...(matricule ? { matricule } : {}) } : a));
        localStorage.setItem('idla_local_applications', JSON.stringify(next));
      } catch (e) {}

      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.applications) {
        try {
          await databases.updateDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.applications,
            id,
            { status }
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
            Permission.read(Role.label('admin')),
            Permission.create(Role.users()),
          ]
        );
      } catch (e) {
        console.warn('dbAdapter.logs.log error:', e);
      }
    },
  },
};
