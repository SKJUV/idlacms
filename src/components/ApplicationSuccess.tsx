import { useEffect, useState } from 'react';
import { CheckCircle2Icon, ArrowRightIcon, ArrowLeftIcon, MailIcon, FileTextIcon } from './Icons';

interface ApplicationSuccessProps {
  candidateName: string;
  selectedProgram: string;
  onGoToCandidatePortal: () => void;
  onBackToHome: () => void;
}

export default function ApplicationSuccess({
  candidateName,
  selectedProgram,
  onGoToCandidatePortal,
  onBackToHome,
}: ApplicationSuccessProps) {
  const [confetti, setConfetti] = useState<{ id: number; left: number; delay: number; color: string; size: number }[]>([]);

  useEffect(() => {
    // Generate dynamic confetti shards
    const colors = ['#14b8a6', '#0d9488', '#2dd4bf', '#3b82f6', '#ec4899', '#eab308'];
    const shards = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100, // percentage width
      delay: Math.random() * 3, // animation delay seconds
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 6, // pixel size
    }));
    setConfetti(shards);
  }, []);

  return (
    <div className="bg-bg-primary min-h-screen py-16 px-6 md:px-12 flex items-center justify-center relative overflow-hidden text-text-primary">
      {/* Confetti Shards CSS Falling Simulation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {confetti.map((c) => (
          <div
            key={c.id}
            className="absolute top-0 animate-bounce rounded-full opacity-70"
            style={{
              left: `${c.left}%`,
              backgroundColor: c.color,
              width: `${c.size}px`,
              height: `${c.size}px`,
              animation: `fall 3s linear infinite`,
              animationDelay: `${c.delay}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(-50px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>

      <div className="max-w-xl w-full bg-bg-secondary rounded-2xl border border-border-primary shadow-xl p-8 md:p-12 text-center relative z-10 space-y-8">
        {/* Animated Check badge */}
        <div className="w-20 h-20 rounded-full bg-brand-light text-brand-primary flex items-center justify-center mx-auto ring-8 ring-brand-primary/10 animate-pulse">
          <CheckCircle2Icon className="w-10 h-10 stroke-[3]" size={40} />
        </div>

        <div className="space-y-2">
          <h1 className="font-sans font-bold text-3xl text-text-primary">Candidature Reçue !</h1>
          <p className="text-brand-primary font-bold text-sm tracking-wide uppercase">
            Votre dossier a bien été enregistré — Session {new Date().getFullYear()}
          </p>
        </div>

        <p className="text-sm text-text-secondary leading-relaxed max-w-sm mx-auto">
          Félicitations
          {candidateName ? (
            <>
              {' '}
              <span className="font-bold text-text-primary">{candidateName}</span>
            </>
          ) : (
            ''
          )}
          , votre dossier d'admission
          {selectedProgram ? (
            <>
              {' '}
              pour le programme <span className="font-bold text-text-primary">{selectedProgram}</span>
            </>
          ) : (
            ''
          )}{' '}
          a été transmis avec succès à notre comité d'étude.
        </p>

        {/* Informational Tracking Card */}
        <div className="bg-bg-primary p-6 rounded-xl border border-border-primary/40 text-left space-y-4">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <FileTextIcon className="w-4 h-4 text-brand-primary" />
            Prochaines Étapes :
          </h4>
          <ul className="space-y-3">
            <li className="flex items-start gap-2 text-xs text-text-secondary">
              <span className="w-5 h-5 rounded-full bg-brand-light text-brand-primary flex items-center justify-center font-bold shrink-0 mt-0.5 text-[10px]">
                1
              </span>
              <span>
                <strong>Analyse de recevabilité :</strong> Le bureau des admissions IDLA étudiera vos pièces
                sous un délai de 24 heures ouvrées.
              </span>
            </li>
            <li className="flex items-start gap-2 text-xs text-text-secondary">
              <span className="w-5 h-5 rounded-full bg-brand-light text-brand-primary flex items-center justify-center font-bold shrink-0 mt-0.5 text-[10px]">
                2
              </span>
              <span>
                <strong>Espace Candidat :</strong> Connectez-vous avec vos identifiants temporaires reçus par
                mail pour suivre l'évaluation de votre dossier.
              </span>
            </li>
          </ul>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            onClick={onGoToCandidatePortal}
            className="flex-1 bg-brand-primary hover:bg-brand-hover text-white py-3.5 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-brand-primary/10 cursor-pointer"
          >
            Suivre mon dossier
            <ArrowRightIcon className="w-4 h-4" />
          </button>

          <button
            onClick={onBackToHome}
            className="flex-1 border border-border-primary hover:bg-bg-primary text-text-primary py-3.5 px-6 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeftIcon className="w-4 h-4 text-text-secondary" />
            Retourner à l'accueil
          </button>
        </div>

        <div className="flex items-center justify-center gap-1 text-xs text-text-secondary font-semibold pt-4 border-t border-border-primary/30">
          <MailIcon className="w-3.5 h-3.5" />
          <span>Un mail récapitulatif a été envoyé à votre adresse.</span>
        </div>
      </div>
    </div>
  );
}
