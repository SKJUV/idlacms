import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../lib/appwrite', () => ({
  isAppwriteDbConfigured: () => false,
  isAppwriteStorageConfigured: () => false,
  databases: {},
  storage: {},
  account: {},
  APPWRITE_CONFIG: {
    databaseId: 'test_db',
    collections: {},
    buckets: {}
  },
  ID: {
    unique: () => 'mock_' + Math.random().toString(36).substring(2, 9)
  },
  Query: {
    limit: vi.fn(),
    orderAsc: vi.fn(),
    orderDesc: vi.fn(),
    equal: vi.fn()
  },
  Permission: {
    read: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  Role: {
    any: vi.fn(),
    users: vi.fn(),
    team: vi.fn()
  }
}));

import { dbAdapter } from '../lib/dbAdapter';
import { Program, Semester, TeachingUnit, StudentUERecord, CourseResource, PreRegistration } from '../types';

describe('LMD Full Interconnection & Data Flow Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('1. Correctly resolves programId from program title or ID', async () => {
    const mockProg: Program = {
      id: 'prog-cyber-99',
      title: 'Master en Cybersécurité & Cloud',
      description: 'Formation avancée',
      type: 'Master',
      category: 'Tech',
      duration: '2 ans',
      image: 'https://example.com/cyber.jpg',
    };
    localStorage.setItem('idla_local_programs', JSON.stringify([mockProg]));

    const resolvedById = await dbAdapter.programs.resolveProgramId('prog-cyber-99');
    expect(resolvedById).toBe('prog-cyber-99');

    const resolvedByExactTitle = await dbAdapter.programs.resolveProgramId('Master en Cybersécurité & Cloud');
    expect(resolvedByExactTitle).toBe('prog-cyber-99');

    const resolvedByPartialTitle = await dbAdapter.programs.resolveProgramId('Cybersécurité');
    expect(resolvedByPartialTitle).toBe('prog-cyber-99');
  });

  it('2. Automatically resolves programId and enrolls student to S1 UEs upon approval', async () => {
    // Setup program, semester 1, and 2 UEs
    const progId = 'prog-ia-101';
    const prog: Program = {
      id: progId,
      title: 'Master Intelligence Artificielle',
      description: 'Programme IA',
      type: 'Master',
      category: 'Tech',
      duration: '2 ans',
      image: 'https://example.com/ia.jpg',
    };
    localStorage.setItem('idla_local_programs', JSON.stringify([prog]));

    const sem1: Semester = {
      id: 'sem-ia-s1',
      programId: progId,
      name: 'Semestre 1 (S1)',
      number: 1,
      status: 'actif',
    };
    localStorage.setItem('idla_local_semesters', JSON.stringify([sem1]));

    const ue1: TeachingUnit = {
      id: 'ue-ia-101',
      programId: progId,
      semesterId: sem1.id,
      code: 'IA101',
      title: 'Fondements du Deep Learning',
      volumeCM: 24,
      volumeTD: 12,
      volumeTP: 12,
    };
    const ue2: TeachingUnit = {
      id: 'ue-ia-102',
      programId: progId,
      semesterId: sem1.id,
      code: 'MATH101',
      title: 'Algèbre Linéaire pour le ML',
      volumeCM: 20,
      volumeTD: 10,
      volumeTP: 10,
    };
    localStorage.setItem('idla_local_teaching_units', JSON.stringify([ue1, ue2]));

    // Student creates application
    const app = await dbAdapter.applications.create({
      name: 'Jean Dupont',
      email: 'jean.dupont@test.com',
      program: 'Master Intelligence Artificielle',
      dateApplied: new Date().toISOString(),
      status: 'New',
      initials: 'JD',
    });

    expect(app.programId).toBe(progId);

    // Approval flow simulation
    const sems = await dbAdapter.semesters.list(app.programId);
    const s1 = sems.find((s) => s.number === 1) || sems[0];
    expect(s1).toBeDefined();

    const ues = await dbAdapter.teachingUnits.list(app.programId, s1.id);
    expect(ues.length).toBe(2);

    const enrolled = await dbAdapter.studentUeRecords.bulkEnroll(
      ues.map((u) => ({
        studentEmail: app.email,
        studentName: app.name,
        ueId: u.id,
        semesterId: s1.id,
        programId: app.programId!,
        sessionType: 'normale',
        status: 'inscrit',
        validatedBy: 'Admin (Test)',
        validatedAt: new Date().toISOString(),
      }))
    );

    expect(enrolled.length).toBe(2);

    // Verify student records
    const studentRecords = await dbAdapter.studentUeRecords.list({ studentEmail: 'jean.dupont@test.com' });
    expect(studentRecords.length).toBe(2);
    expect(studentRecords.map((r) => r.ueId)).toContain('ue-ia-101');
    expect(studentRecords.map((r) => r.ueId)).toContain('ue-ia-102');
  });

  it('3. Duplicate prevention: bulkEnroll does not create duplicate entries for same UE and student', async () => {
    const rec1: Omit<StudentUERecord, 'id'> = {
      studentEmail: 'alice@test.com',
      studentName: 'Alice',
      ueId: 'ue-math-50',
      semesterId: 'sem-1',
      programId: 'prog-1',
      sessionType: 'normale',
      status: 'inscrit',
    };

    const first = await dbAdapter.studentUeRecords.create(rec1);
    const second = await dbAdapter.studentUeRecords.create(rec1);

    expect(first.id).toBe(second.id);

    const all = await dbAdapter.studentUeRecords.list({ studentEmail: 'alice@test.com' });
    expect(all.length).toBe(1);
  });

  it('4. Teacher Course Resources Management (Vidéos & PDF) CRUD Lifecycle', async () => {
    const ueId = 'ue-prog-201';

    // Add video resource
    const res1 = await dbAdapter.courseResources.create({
      ueId,
      title: 'Introduction au Langage Rust - Partie 1',
      type: 'video',
      contentUrl: 'https://youtube.com/watch?v=rust-intro',
      orderIndex: 1,
    });

    // Add PDF resource
    const res2 = await dbAdapter.courseResources.create({
      ueId,
      title: 'Syllabus & Support de Cours Rust (PDF)',
      type: 'pdf',
      contentUrl: 'https://cdn.idla.online/docs/rust-syllabus.pdf',
      orderIndex: 2,
    });

    const resources = await dbAdapter.courseResources.list(ueId);
    expect(resources.length).toBe(2);
    expect(resources[0].title).toBe('Introduction au Langage Rust - Partie 1');
    expect(resources[0].type).toBe('video');
    expect(resources[1].type).toBe('pdf');

    // Delete resource
    await dbAdapter.courseResources.delete(res1.id);

    const remaining = await dbAdapter.courseResources.list(ueId);
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe(res2.id);
  });
});
