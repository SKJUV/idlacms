import React from 'react';
import { CourseEnrollment, AssignmentDeadline, Certificate } from '../../types';
import { AwardIcon, BookOpenIcon, ClockIcon, GraduationCapIcon } from '../Icons';

interface StudentDashboardProps {
  enrollments: CourseEnrollment[];
  deadlines: AssignmentDeadline[];
  certificates: Certificate[];
  onNavigateTab: (tab: string) => void;
  studentName: string;
}

export default function StudentDashboard({
  enrollments,
  deadlines,
  certificates,
  onNavigateTab,
  studentName,
}: StudentDashboardProps) {
  const activeEnrollments = enrollments.filter((e) => e.status === 'en cours');
  const completedEnrollments = enrollments.filter((e) => e.status === 'terminé');

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-primary to-brand-hover text-white rounded-2xl p-6 md:p-8 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold">
            <GraduationCapIcon className="w-4 h-4 text-emerald-300" />
            Espace Académique Étudiant IDLA
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Ravi de vous revoir, {studentName || 'Étudiant'} 👋
          </h1>
          <p className="text-xs md:text-sm text-white/80 max-w-xl">
            Suivez votre progression académique, accédez à vos cours en ligne et échangez avec vos professeurs.
          </p>
        </div>
        <button
          onClick={() => onNavigateTab('student-catalog')}
          className="bg-white text-brand-primary hover:bg-emerald-50 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all shrink-0 cursor-pointer"
        >
          Explorer le Catalogue →
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-bg-secondary border border-border-primary rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-brand-primary">
            <BookOpenIcon className="w-6 h-6" />
            <span className="text-2xl font-black">{enrollments.length}</span>
          </div>
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Cours Inscrits</p>
          <p className="text-[11px] text-text-secondary">{activeEnrollments.length} en cours de suivi</p>
        </div>

        <div className="bg-bg-secondary border border-border-primary rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
            <AwardIcon className="w-6 h-6" />
            <span className="text-2xl font-black">{certificates.length}</span>
          </div>
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Certificats Obtenus</p>
          <p className="text-[11px] text-text-secondary">{completedEnrollments.length} formations complétées</p>
        </div>

        <div className="bg-bg-secondary border border-border-primary rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-amber-500">
            <ClockIcon className="w-6 h-6" />
            <span className="text-2xl font-black">{deadlines.filter((d) => !d.isSubmitted).length}</span>
          </div>
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Devoirs à Rendre</p>
          <p className="text-[11px] text-text-secondary">Prochaine échéance imminente</p>
        </div>

        <div className="bg-bg-secondary border border-border-primary rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-indigo-500">
            <GraduationCapIcon className="w-6 h-6" />
            <span className="text-2xl font-black">Bac+5</span>
          </div>
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Niveau Académique</p>
          <p className="text-[11px] text-text-secondary">Programme Master IDLA</p>
        </div>
      </div>

      {/* Course Progress Section */}
      <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-border-primary/50 pb-4">
          <h2 className="text-base font-bold text-text-primary">Vos Cours en Cours</h2>
          <button
            onClick={() => onNavigateTab('student-programs')}
            className="text-xs text-brand-primary font-bold hover:underline"
          >
            Voir tout ({enrollments.length})
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enrollments.slice(0, 4).map((course) => (
            <div
              key={course.id}
              className="p-4 rounded-xl bg-bg-primary border border-border-primary/60 hover:border-brand-primary/40 transition-all flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-1">
                  <span className="text-[10px] uppercase font-bold text-brand-primary bg-brand-light px-2 py-0.5 rounded">
                    {course.category}
                  </span>
                  <span className="text-[11px] text-text-secondary">{course.duration}</span>
                </div>
                <h3 className="font-bold text-sm text-text-primary line-clamp-1">{course.title}</h3>
                <p className="text-xs text-text-secondary mt-0.5">Prof: {course.instructor}</p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-text-secondary">Progression</span>
                  <span className="text-brand-primary">{course.progressPercent}%</span>
                </div>
                <div className="w-full bg-border-primary/40 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-brand-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${course.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
