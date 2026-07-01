import React, { useState, useRef } from 'react';
import { 
  Lock, 
  Mail, 
  Send, 
  User, 
  GraduationCap, 
  CheckCircle2, 
  Clock, 
  Upload, 
  AlertCircle, 
  FileText, 
  ChevronRight, 
  ArrowLeft,
  ChevronUp,
  MessageSquare
} from 'lucide-react';

interface CandidatePortalProps {
  onBackToHome: () => void;
  onLoginSuccess: () => void;
  isLoggedIn: boolean;
}

export default function CandidatePortal({ onBackToHome, onLoginSuccess, isLoggedIn }: CandidatePortalProps) {
  // Login Form States
  const [email, setEmail] = useState('jean.dupont@email.com');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Dashboard / Interactive states
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { sender: 'advisor', text: 'Bonjour Jean, j\'ai bien reçu votre lettre de motivation. Vos pièces justificatives semblent complètes ! Pourriez-vous nous téléverser également vos relevés de notes du dernier semestre ?', time: 'Aujourd\'hui, 10:15' }
  ]);
  const [candidateDocs, setCandidateDocs] = useState([
    { name: 'CV_Jean_Dupont.pdf', size: '1.2 MB', date: 'Aujourd\'hui, 11:22' },
    { name: 'Lettre_Motivation_IDLA.pdf', size: '890 KB', date: 'Aujourd\'hui, 11:24' }
  ]);
  const [isUploading, setIsUploading] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    setTimeout(() => {
      if (email === 'jean.dupont@email.com' && password === 'password123') {
        onLoginSuccess();
      } else {
        setLoginError('Identifiants incorrects. Utilisez jean.dupont@email.com / password123');
      }
      setIsLoading(false);
    }, 800);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = { sender: 'user', text: chatMessage, time: 'À l\'instant' };
    setChatHistory((curr) => [...curr, userMsg]);
    setChatMessage('');

    // Trigger funny, highly realistic advisor automatic reply
    setTimeout(() => {
      const advisorMsg = {
        sender: 'advisor',
        text: 'Merci beaucoup pour votre message Jean ! Je transmets immédiatement votre dossier au jury d\'admission pour étude approfondie. Je vous recontacte dès que possible.',
        time: 'À l\'instant'
      };
      setChatHistory((curr) => [...curr, advisorMsg]);
    }, 1500);
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      setIsUploading(true);
      setTimeout(() => {
        setCandidateDocs((curr) => [
          ...curr,
          { name: selectedFiles[0].name, size: '1.5 MB', date: 'À l\'instant' }
        ]);
        setIsUploading(false);
      }, 1000);
    }
  };

  // LOGIN PAGE VIEW
  if (!isLoggedIn) {
    return (
      <div className="bg-[#00020e] min-h-screen flex items-center justify-center py-12 px-6 relative overflow-hidden text-white">
        {/* Glow Background */}
        <div className="absolute inset-0 opacity-25 pointer-events-none z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#006c49] blur-[150px] rounded-full"></div>
        </div>

        <div className="max-w-md w-full bg-[#161922] rounded-2xl border border-white/10 p-8 shadow-2xl relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <button 
              onClick={onBackToHome}
              className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors mb-4 border border-white/10 px-3 py-1 rounded"
            >
              <ArrowLeft className="w-3 h-3" />
              Retour au site public
            </button>
            <div className="w-12 h-12 bg-[#6ffbbe] text-[#00020e] rounded-xl flex items-center justify-center font-bold text-2xl mx-auto shadow-lg">
              🎓
            </div>
            <h1 className="font-sans font-bold text-2xl">Espace Candidat</h1>
            <p className="text-white/60 text-xs">Accédez au suivi d'étude de votre candidature IDLA</p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-200 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-white/60 tracking-wider">Adresse email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#6ffbbe] outline-none text-white font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase font-bold text-white/60 tracking-wider">Mot de passe</label>
                <a href="#" className="text-[10px] text-[#6ffbbe] hover:underline font-bold">Oublié ?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#6ffbbe] outline-none text-white"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#006c49] hover:bg-[#6ffbbe] hover:text-[#00020e] text-white py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              {isLoading ? 'Identification en cours...' : 'Se connecter'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs text-white/40">
              Pas encore candidat ?{' '}
              <button onClick={onBackToHome} className="text-[#6ffbbe] hover:underline font-bold">
                Déposez un dossier
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // LOGGED IN DASHBOARD VIEW (Jean Dupont tracking screen)
  return (
    <div className="bg-[#f8f9ff] min-h-screen text-[#0b1c30] py-8 px-6 md:px-12 ml-0 transition-all duration-200">
      <div className="max-w-[1440px] mx-auto space-y-8">
        
        {/* Welcome Top Banner */}
        <div className="bg-white border border-[#c6c6cf] rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#00020e] overflow-hidden border border-[#c6c6cf] shrink-0">
              <img 
                className="w-full h-full object-cover" 
                alt="Jean Dupont" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1LfFMF59IxhCwXU86Z9pk3WrYDugQvF0DDQbPehsSHoM43Xatn_WNeCx3m1Y2uV-YMNrk-PazsuEv026pjveC8nHINIJdcvTAjCdA2Ul-pzy1-1X3f8qWlR-6thU-yiwdIOV8Wgv5LTuU6aZG5FtoJfZJKzsoedrXakIIKQWjXhMzcp3H_cws91qBL9fONgHLkpxnXs2cjLbIN3vj-yDum-JiwnSgDgBNtLCC4a3UdRQ8ejIbRQKco1PUNyz9RHSMcnYjUOO7bhI"
              />
            </div>
            <div>
              <h1 className="font-sans font-bold text-2xl text-[#00020e]">Bonjour, Jean Dupont !</h1>
              <p className="text-sm text-[#45464e] font-semibold mt-0.5">Dossier #IDLA-2024-8931</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 bg-amber-500/10 text-amber-700 px-4 py-2 rounded-xl text-xs font-bold border border-amber-500/20">
            <Clock className="w-4 h-4 shrink-0" />
            <span>Statut : Dossier en cours d'évaluation par l'administration académique</span>
          </div>
        </div>

        {/* Stepper Progress tracking timeline */}
        <div className="bg-white border border-[#c6c6cf] rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          <h3 className="font-sans font-bold text-base text-[#00020e] uppercase tracking-wider">État d'évaluation du dossier</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            
            {/* Step 1 : Complete */}
            <div className="space-y-2 border-l-4 md:border-l-0 md:border-t-4 border-[#006c49] pl-4 md:pl-0 pt-0 md:pt-4">
              <div className="flex items-center gap-1.5 text-[#006c49] font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Étape 1 : Soumis</span>
              </div>
              <p className="font-bold text-sm text-[#00020e]">Candidature Enregistrée</p>
              <p className="text-xs text-slate-400">Le dossier a été déposé en ligne avec succès.</p>
            </div>

            {/* Step 2 : Active */}
            <div className="space-y-2 border-l-4 md:border-l-0 md:border-t-4 border-amber-500 pl-4 md:pl-0 pt-0 md:pt-4">
              <div className="flex items-center gap-1.5 text-amber-600 font-bold text-xs">
                <Clock className="w-4 h-4 animate-spin-slow" />
                <span>Étape 2 : Analyse académique</span>
              </div>
              <p className="font-bold text-sm text-[#00020e]">Étude des pièces justificatives</p>
              <p className="text-xs text-slate-400">Notre équipe examine l'adéquation de vos relevés.</p>
            </div>

            {/* Step 3 : Pending */}
            <div className="space-y-2 border-l-4 md:border-l-0 md:border-t-4 border-[#c6c6cf]/60 pl-4 md:pl-0 pt-0 md:pt-4 opacity-50">
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-xs">
                <span>Étape 3 : Évaluation orale</span>
              </div>
              <p className="font-bold text-sm text-[#00020e]">Entretien de motivation</p>
              <p className="text-xs text-slate-400">Présentation de votre projet devant le jury académique.</p>
            </div>

            {/* Step 4 : Pending */}
            <div className="space-y-2 border-l-4 md:border-l-0 md:border-t-4 border-[#c6c6cf]/60 pl-4 md:pl-0 pt-0 md:pt-4 opacity-50">
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-xs">
                <span>Étape 4 : Délibération</span>
              </div>
              <p className="font-bold text-sm text-[#00020e]">Décision d'Admission</p>
              <p className="text-xs text-slate-400">Notification finale d'acceptation par courrier officiel.</p>
            </div>

          </div>
        </div>

        {/* Dynamic Split Screen : Advisor chat + Documents panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Documents Panel */}
          <div className="lg:col-span-6 bg-white border border-[#c6c6cf] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#c6c6cf]/30">
              <h3 className="font-sans font-bold text-base text-[#00020e] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#006c49]" />
                Mon Dossier de Pièces
              </h3>
              <button 
                onClick={() => docInputRef.current?.click()}
                disabled={isUploading}
                className="bg-[#006c49]/10 hover:bg-[#006c49]/20 text-[#006c49] text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                {isUploading ? 'Chargement...' : 'Ajouter'}
              </button>
              <input 
                type="file" 
                ref={docInputRef} 
                onChange={handleDocUpload} 
                className="hidden" 
                accept=".pdf,.doc,.docx"
              />
            </div>

            <div className="space-y-3">
              {candidateDocs.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 border border-[#c6c6cf]/30 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#006c49]/10 text-[#006c49] flex items-center justify-center font-bold">
                      PDF
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#00020e] line-clamp-1">{doc.name}</p>
                      <p className="text-[10px] text-slate-400">{doc.size} • Chargé {doc.date}</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-[#006c49]" />
                </div>
              ))}
            </div>
          </div>

          {/* Advisor Chat Panel */}
          <div className="lg:col-span-6 bg-white border border-[#c6c6cf] rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[400px]">
            {/* Advisor profile header */}
            <div className="bg-[#00020e] text-white p-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <img 
                  className="w-10 h-10 rounded-full object-cover border border-[#6ffbbe]" 
                  alt="Sophie Vallet" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0_XvxQWPGzTXS1DHWUORKzkiVDy52_-X-mXR4f8PQZCHTc169TmBogptdmCOfsIXOZ7Wy7Z8gThWHdw11cHpX1aai9hTkmMoVSspSlVTs4RX1RcrVDszuxKyUfewqjq-zxRHJxExi9bjqJyCnKDlfNveOTgHgcHlN7oEJXpB6h9Jl6q9jtAnp6k7INE4V6xOk0BQqFgwzow2_mzhvfx5i76FabdJE1sSB5ETKY8J4kcv-dBlh7qni7409aB83ijdCXWDh7A68muw"
                />
                <div>
                  <h4 className="font-bold text-xs text-white">Sophie Vallet</h4>
                  <p className="text-[10px] text-[#6ffbbe] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6ffbbe]"></span>
                    Conseillère des Admissions
                  </p>
                </div>
              </div>
              <MessageSquare className="w-4 h-4 text-white/50" />
            </div>

            {/* Chat conversation area */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4 max-h-[250px]">
              {chatHistory.map((m, idx) => (
                <div 
                  key={idx} 
                  className={`flex flex-col max-w-[80%] ${
                    m.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                  }`}
                >
                  <div 
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      m.sender === 'user' 
                        ? 'bg-[#006c49] text-white rounded-tr-none' 
                        : 'bg-slate-100 text-[#0b1c30] rounded-tl-none border border-[#c6c6cf]/40'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 px-1">{m.time}</span>
                </div>
              ))}
            </div>

            {/* Chat entry form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-[#c6c6cf]/30 bg-slate-50 flex gap-2">
              <input 
                type="text" 
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Rédiger votre réponse..."
                className="flex-grow bg-white border border-[#c6c6cf] rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#006c49]"
              />
              <button 
                type="submit"
                className="bg-[#006c49] text-white p-2 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

          </div>

        </div>

      </div>
    </div>
  );
}
