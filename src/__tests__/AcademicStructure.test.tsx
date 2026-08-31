import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AcademicStructure from '../components/admin/AcademicStructure';
import { Program } from '../types';
import { dbAdapter } from '../lib/dbAdapter';

const mockPrograms: Program[] = [
  {
    id: 'prog-bachelor-cs',
    title: 'BSc Computer Science & Engineering',
    type: 'Bachelor',
    category: 'Tech',
    duration: '3 ans (6 Semestres)',
    image: 'https://example.com/cs.jpg',
    description: 'Programme de Licence en Informatique'
  },
  {
    id: 'prog-master-mba',
    title: 'Master of Business Administration (MBA)',
    type: 'Master',
    category: 'Management',
    duration: '2 ans (4 Semestres)',
    image: 'https://example.com/mba.jpg',
    description: 'Programme de Master en Management'
  }
];

describe('AcademicStructure — LMD System & Admin Safeguard Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders LMD governance header and program selector', () => {
    render(<AcademicStructure programs={mockPrograms} />);
    expect(screen.getByText(/Structure Académique & Gestion LMD/i)).toBeInTheDocument();
    expect(screen.getByText(/Gouvernance des Semestres/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/\[Bachelor\] BSc Computer Science & Engineering/i)).toBeInTheDocument();
  });

  it('renders all 3 LMD tabs: Semestres & UE, Inscriptions & Évaluations, Délibérations & Rattrapages', () => {
    render(<AcademicStructure programs={mockPrograms} />);
    expect(screen.getByText(/Semestres & Unités d'Enseignement/i)).toBeInTheDocument();
    expect(screen.getByText(/Inscriptions & Suivi des Évaluations/i)).toBeInTheDocument();
    expect(screen.getByText(/Délibérations & Rattrapages/i)).toBeInTheDocument();
  });

  it('switches to Délibérations tab and displays official IDLA LMD deliberation rules', () => {
    render(<AcademicStructure programs={mockPrograms} />);
    const delibTab = screen.getByText(/Délibérations & Rattrapages/i);
    fireEvent.click(delibTab);

    expect(screen.getByText(/Règles Officielles de Délibération LMD IDLA/i)).toBeInTheDocument();
    expect(screen.getByText(/✅ Passage Direct \(Admis\)/i)).toBeInTheDocument();
    expect(screen.getByText(/⚠️ Passage avec Dette/i)).toBeInTheDocument();
    expect(screen.getByText(/❌ Redoublement du Semestre/i)).toBeInTheDocument();
  });

  it('switches to Inscriptions & Évaluations tab and displays search & filter controls', () => {
    render(<AcademicStructure programs={mockPrograms} />);
    const evalTab = screen.getByText(/Inscriptions & Suivi des Évaluations/i);
    fireEvent.click(evalTab);

    expect(screen.getByPlaceholderText(/Rechercher étudiant.../i)).toBeInTheDocument();
    expect(screen.getByText(/Tous les semestres/i)).toBeInTheDocument();
    expect(screen.getByText(/Toutes les UE/i)).toBeInTheDocument();
  });

  it('shows auto-generate semesters button when no semesters exist for a program', () => {
    render(<AcademicStructure programs={mockPrograms} />);
    expect(screen.getByText(/Aucun semestre configuré/i)).toBeInTheDocument();
    expect(screen.getByText(/Générer les semestres automatiquement/i)).toBeInTheDocument();
  });

  it('dbAdapter correctly handles LMD Semesters CRUD operations with fallback', async () => {
    const created = await dbAdapter.semesters.create({
      programId: 'prog-bachelor-cs',
      name: 'Semestre 1 (S1)',
      number: 1,
      startDate: '01 Octobre 2026',
      endDate: '28 Février 2027',
      rattrapageStartDate: '01 Mars 2027',
      rattrapageEndDate: '15 Mars 2027',
      status: 'actif'
    });

    expect(created.name).toBe('Semestre 1 (S1)');
    expect(created.number).toBe(1);

    const list = await dbAdapter.semesters.list('prog-bachelor-cs');
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].name).toBe('Semestre 1 (S1)');
  });

  it('dbAdapter correctly handles Teaching Units (UE) CRUD operations', async () => {
    const ue = await dbAdapter.teachingUnits.create({
      programId: 'prog-bachelor-cs',
      semesterId: 'sem-1',
      code: 'INF101',
      title: 'Algorithmique & Structures de Données',
      volumeCM: 24,
      volumeTD: 12,
      volumeTP: 12,
      teacherName: 'Dr. Nkeng'
    });

    expect(ue.code).toBe('INF101');
    expect(ue.title).toBe('Algorithmique & Structures de Données');
    expect(ue.volumeCM).toBe(24);

    const list = await dbAdapter.teachingUnits.list('prog-bachelor-cs');
    expect(list.some(u => u.code === 'INF101')).toBe(true);
  });

  it('dbAdapter correctly handles Student UE Records and Evaluation status transitions', async () => {
    const record = await dbAdapter.studentUeRecords.create({
      studentEmail: 'etudiant@idla.online',
      studentName: 'Fatou Camara',
      ueId: 'ue-inf101',
      semesterId: 'sem-1',
      programId: 'prog-bachelor-cs',
      sessionType: 'normale',
      status: 'inscrit'
    });

    expect(record.status).toBe('inscrit');

    // Update to 'rattrapage'
    await dbAdapter.studentUeRecords.update(record.id, {
      status: 'rattrapage',
      sessionType: 'rattrapage',
      validatedBy: 'Admin'
    });

    const updatedList = await dbAdapter.studentUeRecords.list({ studentEmail: 'etudiant@idla.online' });
    const updated = updatedList.find(r => r.id === record.id);
    expect(updated?.status).toBe('rattrapage');
    expect(updated?.sessionType).toBe('rattrapage');
  });
});
