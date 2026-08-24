import React from 'react';
import { CalendarIcon, AlertCircleIcon, BookOpenIcon, UsersIcon } from '../Icons';

export interface ScheduleSlot {
  day: string;
  startTime: string;
  endTime: string;
  course: string;
  program: string;
  teacherName: string;
}

interface StudentScheduleViewProps {
  applications: any[];
  teachersSchedules: ScheduleSlot[];
  MustChangePwdBanner?: React.ReactNode;
}

export default function StudentScheduleView({
  applications,
  teachersSchedules,
  MustChangePwdBanner,
}: StudentScheduleViewProps) {
  const acceptedPrograms = applications
    .filter((a) => (a.status || '').toLowerCase() === 'accepted' && a.program)
    .map((a) => (a.program || '').trim().toLowerCase());

  const mySchedules = teachersSchedules.filter((slot) => {
    if (!slot.program) return false;
    const slotProgNorm = slot.program.trim().toLowerCase();
    return acceptedPrograms.some((ap) => ap === slotProgNorm || ap.includes(slotProgNorm) || slotProgNorm.includes(ap));
  });
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  // Détection stricte de tous les chevauchements d'horaires sur la même journée
  const conflicts: { day: string; time: string; courseA: string; programA: string; courseB: string; programB: string }[] = [];
  mySchedules.forEach((slot1, i) => {
    mySchedules.forEach((slot2, j) => {
      if (i < j && slot1.day === slot2.day) {
        if (slot1.startTime < slot2.endTime && slot2.startTime < slot1.endTime) {
          conflicts.push({
            day: slot1.day,
            time: `${slot1.startTime}-${slot1.endTime}`,
            courseA: slot1.course,
            programA: slot1.program,
            courseB: slot2.course,
            programB: slot2.program
          });
        }
      }
    });
  });

  return (
    <div className="flex-1 p-6 md:p-8 lg:p-12 pt-24 lg:pt-12 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
        {MustChangePwdBanner}

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-primary font-sans">Mon Emploi du Temps</h2>
            <p className="text-text-secondary text-sm">Consultez les horaires de cours de vos programmes validés.</p>
          </div>
        </div>

        {conflicts.length > 0 && (
          <div className="p-4 bg-rose-500/10 border-l-4 border-rose-500 rounded-xl text-rose-900 dark:text-rose-200 space-y-2 text-xs">
            <div className="font-bold flex items-center gap-2 text-sm text-rose-600 uppercase">
              <AlertCircleIcon className="w-5 h-5 shrink-0" />
              <span>Attention : Chevauchement d'Emplois du Temps Détecté ({conflicts.length})</span>
            </div>
            <p className="leading-relaxed">
              Des créneaux horaires sont planifiés simultanément le même jour. Veuillez contacter le secrétariat académique pour réorganiser votre emploi du temps.
            </p>
            <ul className="list-disc pl-5 space-y-1 font-semibold">
              {conflicts.map((c, idx) => (
                <li key={idx}>
                  <strong>{c.day} ({c.time})</strong> : "{c.courseA}" ({c.programA}) ⚡ EN CONFLIT AVEC ⚡ "{c.courseB}" ({c.programB})
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-bg-secondary border border-border-primary rounded-xl overflow-hidden shadow-sm">
          {acceptedPrograms.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-bg-primary rounded-full flex items-center justify-center mx-auto mb-4 border border-border-primary">
                <BookOpenIcon className="w-8 h-8 text-text-secondary/50" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">Aucun programme actif</h3>
              <p className="text-text-secondary text-sm max-w-md mx-auto">Vous n'avez pas encore été admis dans un programme. Votre emploi du temps s'affichera ici une fois votre candidature acceptée.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-6 border-b border-border-primary bg-bg-primary/50 text-xs font-bold text-text-secondary uppercase tracking-wider">
                {days.map((day) => (
                  <div key={day} className="p-4 text-center border-r border-border-primary last:border-0 hidden md:block">{day}</div>
                ))}
                {days.map((day) => (
                  <div key={day + '-mobile'} className="p-3 text-center border-r border-border-primary last:border-0 md:hidden">{day.slice(0, 3)}</div>
                ))}
              </div>
              <div className="grid grid-cols-6 min-h-[400px]">
                {days.map((day) => {
                  const daySlots = mySchedules.filter((s: any) => s.day === day).sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
                  return (
                    <div key={day} className="border-r border-border-primary last:border-0 p-2 space-y-2">
                      {daySlots.map((slot: any, idx: number) => {
                        const isConflicting = daySlots.some(
                          (other: any) => other !== slot && (slot.startTime < other.endTime && other.startTime < slot.endTime)
                        );
                        return (
                          <div key={idx} className={`p-3 rounded-xl text-sm transition-all border ${
                            isConflicting 
                              ? 'bg-rose-500/10 border-rose-500 text-rose-900 dark:text-rose-200 shadow-sm animate-pulse' 
                              : 'bg-brand-light border-brand-primary/20 hover:shadow-md'
                          }`}>
                            <div className="flex items-center justify-between font-bold text-xs mb-1">
                              <span className={isConflicting ? 'text-rose-600' : 'text-brand-primary'}>{slot.startTime} - {slot.endTime}</span>
                              {isConflicting && <span className="bg-rose-600 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded uppercase">CONFLIT</span>}
                            </div>
                            <div className="font-semibold text-text-primary text-sm leading-tight mb-2">{slot.course}</div>
                            <div className="text-xs text-text-secondary flex items-center gap-1.5 mb-1.5">
                              <UsersIcon className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{slot.teacherName}</span>
                            </div>
                            <div className="text-[10px] text-text-secondary/80 truncate px-2 py-0.5 bg-bg-primary rounded inline-block border border-border-primary">{slot.program}</div>
                          </div>
                        );
                      })}
                      {daySlots.length === 0 && (
                        <div className="text-center py-6 text-xs text-text-secondary/40">--</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
