import { useEffect, useState } from 'react';

type IconProps = { className?: string };
const Check = ({ className }: IconProps) => <span aria-hidden="true" className={className} />;
const ClipboardList = ({ className }: IconProps) => <span aria-hidden="true" className={className} />;
const Mail = ({ className }: IconProps) => <span aria-hidden="true" className={className} />;
const ArrowRight = ({ className }: IconProps) => <span aria-hidden="true" className={className} />;
const Home = ({ className }: IconProps) => <span aria-hidden="true" className={className} />;

interface ApplicationSuccessProps {
  candidateName: string;
  selectedProgram: string;
  onGoToCandidatePortal: () => void;
  onBackToHome: () => void;
}

export default function ApplicationSuccess({ candidateName, selectedProgram, onGoToCandidatePortal, onBackToHome }: ApplicationSuccessProps) {
  const [confetti, setConfetti] = useState<{ id: number; left: number; delay: number; color: string; size: number }[]>([]);

  useEffect(() => {
    // Generate dynamic confetti shards
    const colors = ['#6ffbbe', '#006c49', '#00020e', '#3b82f6', '#ec4899', '#eab308'];
    const shards = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100, // percentage width
      delay: Math.random() * 3, // animation delay seconds
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 6 // pixel size
    }));
    setConfetti(shards);
  }, []);

  return (
    <div className="bg-[#f8f9ff] min-h-screen py-16 px-6 md:px-12 flex items-center justify-center relative overflow-hidden">
      
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

      <div className="max-w-xl w-full bg-white rounded-2xl border border-[#c6c6cf] shadow-xl p-8 md:p-12 text-center relative z-10 space-y-8">
        
        {/* Animated Check badge */}
        <div className="w-20 h-20 rounded-full bg-[#6ffbbe]/20 text-[#006c49] flex items-center justify-center mx-auto ring-8 ring-[#6ffbbe]/10 animate-pulse">
          <Check className="w-10 h-10 stroke-[3]" />
        </div>

        <div className="space-y-2">
          <h1 className="font-sans font-bold text-3xl text-[#00020e]">Candidature Reçue !</h1>
          <p className="text-[#006c49] font-bold text-sm tracking-wide uppercase">Dossier enregistré sous le #IDLA-2024-8931</p>
        </div>

        <p className="text-sm text-[#45464e] leading-relaxed max-w-sm mx-auto">
          Félicitations <span className="font-bold text-[#00020e]">{candidateName || 'Jean Dupont'}</span>, votre dossier d'admissions pour le <span className="font-bold text-[#00020e]">{selectedProgram || 'Executive MBA'}</span> a été envoyé avec succès auprès de notre comité d'étude.
        </p>

        {/* Informational Tracking Card */}
        <div className="bg-slate-50 p-6 rounded-xl border border-[#c6c6cf]/40 text-left space-y-4">
          <h4 className="text-xs font-bold text-[#00020e] uppercase tracking-wider flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-[#006c49]" />
            Prochaines Étapes :
          </h4>
          <ul className="space-y-3">
            <li className="flex items-start gap-2 text-xs text-[#45464e]">
              <span className="w-5 h-5 rounded-full bg-[#e5eeff] text-[#006c49] flex items-center justify-center font-bold shrink-0 mt-0.5 text-[10px]">1</span>
              <span><strong>Analyse de recevabilité :</strong> Le bureau des admissions IDLA étudiera vos pièces sous un délai de 24 heures ouvrées.</span>
            </li>
            <li className="flex items-start gap-2 text-xs text-[#45464e]">
              <span className="w-5 h-5 rounded-full bg-[#e5eeff] text-[#006c49] flex items-center justify-center font-bold shrink-0 mt-0.5 text-[10px]">2</span>
              <span><strong>Espace Candidat :</strong> Connectez-vous avec vos identifiants temporaires reçus par mail pour suivre l'évaluation de votre dossier.</span>
            </li>
          </ul>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button 
            onClick={onGoToCandidatePortal}
            className="flex-1 bg-[#006c49] hover:bg-[#6cf8bb] hover:text-[#00020e] text-white py-3.5 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-[#006c49]/10"
          >
            Suivre mon dossier 
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button 
            onClick={onBackToHome}
            className="flex-1 border border-[#c6c6cf] hover:bg-slate-50 text-[#00020e] py-3.5 px-6 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4 text-slate-400" />
            Retourner à l'accueil
          </button>
        </div>

        <div className="flex items-center justify-center gap-1 text-xs text-slate-400 font-semibold pt-4 border-t border-[#c6c6cf]/30">
          <Mail className="w-3.5 h-3.5" />
          <span>Un mail récapitulatif a été envoyé à {candidateName ? 'votre adresse' : 'jean.dupont@email.com'}</span>
        </div>

      </div>
    </div>
  );
}
