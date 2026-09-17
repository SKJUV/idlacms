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
import { Program, Semester } from '../types';

describe('LMD Academic Levels, Academic Years & Legacy Course Sync', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('1. Correctly preserves academicYear and academicLevel on Semesters', async () => {
    const sem = await dbAdapter.semesters.create({
      programId: 'prog-bachelor-cs',
      name: 'Semestre 3 (S3)',
      number: 3,
      academicYear: '2026-2027',
      academicLevel: 'L2',
      status: 'actif',
    });

    expect(sem.id).toBeDefined();
    expect(sem.academicYear).toBe('2026-2027');
    expect(sem.academicLevel).toBe('L2');

    const list = await dbAdapter.semesters.list('prog-bachelor-cs');
    expect(list.length).toBe(1);
    expect(list[0].academicLevel).toBe('L2');
    expect(list[0].academicYear).toBe('2026-2027');
  });

  it('2. Synchronizes teacher scheduleData with level L2 and ventilates to Semestre 3 (S3)', async () => {
    // Setup program
    const mockProg: Program = {
      id: 'prog_bachelor_dev',
      title: 'Bachelor Génie Logiciel',
      description: 'Formation bac+3',
      type: 'Bachelor',
      category: 'Tech',
      duration: '3 ans',
      image: 'https://example.com/bachelor.jpg',
    };
    localStorage.setItem('idla_local_programs', JSON.stringify([mockProg]));

    // Setup teacher with scheduleData containing an L2 course
    const mockTeacher = {
      id: 't_prof_martin',
      name: 'Pr. Martin Dubois',
      email: 'martin.dubois@idla.edu',
      assignedPrograms: ['Bachelor Génie Logiciel - L2'],
      assignedCourses: ['Architecture des Systèmes d\'Information'],
      scheduleData: JSON.stringify([
        {
          course: 'Architecture des Systèmes d\'Information',
          program: 'Bachelor Génie Logiciel',
          level: 'L2',
          type: 'CM',
          day: 'Mardi',
          startTime: '08:00',
          endTime: '11:00',
        },
      ]),
    };
    localStorage.setItem('idla_local_teachers', JSON.stringify([mockTeacher]));

    // Run synchronization
    const result = await dbAdapter.academicStructure.syncAllExistingCourses(mockProg.id);

    expect(result.totalFound).toBeGreaterThanOrEqual(1);
    expect(result.imported).toBeGreaterThanOrEqual(1);

    // Verify semesters auto-generation with proper academic levels
    const sems = await dbAdapter.semesters.list(mockProg.id);
    expect(sems.length).toBe(6);
    expect(sems.find(s => s.number === 1)?.academicLevel).toBe('L1');
    expect(sems.find(s => s.number === 2)?.academicLevel).toBe('L1');
    expect(sems.find(s => s.number === 3)?.academicLevel).toBe('L2');
    expect(sems.find(s => s.number === 4)?.academicLevel).toBe('L2');
    expect(sems.find(s => s.number === 5)?.academicLevel).toBe('L3');
    expect(sems.find(s => s.number === 6)?.academicLevel).toBe('L3');

    // Verify TeachingUnit created in Semestre 3 (S3 for L2)
    const s3 = sems.find(s => s.number === 3)!;
    const ues = await dbAdapter.teachingUnits.list(mockProg.id, s3.id);
    expect(ues.length).toBe(1);
    expect(ues[0].title).toBe('Architecture des Systèmes d\'Information');
    expect(ues[0].teacherId).toBe('t_prof_martin');
    expect(ues[0].teacherName).toBe('Pr. Martin Dubois');
    expect(ues[0].coefficient).toBe(3);
    expect(ues[0].m3cWeightCC).toBe(40);
    expect(ues[0].m3cWeightExam).toBe(50);
    expect(ues[0].m3cWeightTP).toBe(10);
  });

  it('3. Synchronizes Master courses with level M2 into Semestre 3 of Master', async () => {
    const mockMaster: Program = {
      id: 'prog_master_ia',
      title: 'Master Intelligence Artificielle & Big Data',
      description: 'Master 2 ans',
      type: 'Master',
      category: 'Tech',
      duration: '2 ans',
      image: 'https://example.com/master_ia.jpg',
    };
    localStorage.setItem('idla_local_programs', JSON.stringify([mockMaster]));

    const mockTeacher = {
      id: 't_dr_sophie',
      name: 'Dr. Sophie Laurent',
      email: 'sophie.laurent@idla.edu',
      assignedPrograms: ['Master Intelligence Artificielle & Big Data - M2'],
      assignedCourses: ['Deep Learning & Vision par Ordinateur'],
      scheduleData: JSON.stringify([
        {
          course: 'Deep Learning & Vision par Ordinateur',
          program: 'Master Intelligence Artificielle & Big Data',
          level: 'M2',
          type: 'TP',
          day: 'Jeudi',
          startTime: '14:00',
          endTime: '17:00',
        },
      ]),
    };
    localStorage.setItem('idla_local_teachers', JSON.stringify([mockTeacher]));

    const result = await dbAdapter.academicStructure.syncAllExistingCourses(mockMaster.id);
    expect(result.imported).toBe(1);

    const sems = await dbAdapter.semesters.list(mockMaster.id);
    expect(sems.length).toBe(4);
    expect(sems.find(s => s.number === 1)?.academicLevel).toBe('M1');
    expect(sems.find(s => s.number === 3)?.academicLevel).toBe('M2');

    const s3 = sems.find(s => s.number === 3)!;
    const ues = await dbAdapter.teachingUnits.list(mockMaster.id, s3.id);
    expect(ues.length).toBe(1);
    expect(ues[0].title).toBe('Deep Learning & Vision par Ordinateur');
    expect(ues[0].teacherName).toBe('Dr. Sophie Laurent');
  });

  it('4. Running synchronization twice is idempotent and does not create duplicate UEs', async () => {
    const mockProg: Program = {
      id: 'prog_bachelor_data',
      title: 'Bachelor Science des Données',
      description: 'Bac+3',
      type: 'Bachelor',
      category: 'Tech',
      duration: '3 ans',
      image: 'https://example.com/bachelor_data.jpg',
    };
    localStorage.setItem('idla_local_programs', JSON.stringify([mockProg]));

    const mockTeacher = {
      id: 't_prof_jean',
      name: 'Pr. Jean Dupont',
      email: 'jean.dupont@idla.edu',
      assignedPrograms: ['Bachelor Science des Données - L1'],
      assignedCourses: ['Statistiques Inférentielles'],
      scheduleData: JSON.stringify([
        {
          course: 'Statistiques Inférentielles',
          program: 'Bachelor Science des Données',
          level: 'L1',
          type: 'TD',
          day: 'Vendredi',
          startTime: '10:00',
          endTime: '12:00',
        },
      ]),
    };
    localStorage.setItem('idla_local_teachers', JSON.stringify([mockTeacher]));

    const firstRun = await dbAdapter.academicStructure.syncAllExistingCourses(mockProg.id);
    expect(firstRun.imported).toBe(1);

    const secondRun = await dbAdapter.academicStructure.syncAllExistingCourses(mockProg.id);
    expect(secondRun.imported).toBe(0);
    expect(secondRun.alreadySynced).toBe(1);

    const allUes = await dbAdapter.teachingUnits.list(mockProg.id);
    expect(allUes.length).toBe(1);
  });
});
