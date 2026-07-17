import { useState, useMemo, useEffect, useRef, type FormEvent } from 'react';
import {
  SearchIcon as Search,
  ClockIcon as Clock,
  ArrowRightIcon as ArrowRight,
  AlertTriangleIcon as AlertTriangle,
  ShieldAlertIcon as ShieldAlert,
  FlameIcon as Flame,
  CompassIcon as Compass,
  QuoteIcon as Quote,
  BookOpenIcon as BookOpen,
  XIcon as X,
  SendIcon as Send,
  HeartHandshakeIcon as HeartHandshake,
  CheckCircle2Icon as CheckCircle2,
} from './Icons';
import { Program, NewsArticle, Testimonial } from '../types';

interface PublicPortalProps {
  activeTab: 'home' | 'programmes' | 'actualites' | 'temoignages';
  setActiveTab: (tab: any) => void;
  onApplyNow: (programTitle?: string) => void;
  programs: Program[];
  news: NewsArticle[];
  testimonials: Testimonial[];
  onSubmitTestimonial: (t: Omit<Testimonial, 'id' | 'image'>) => void;
  onSubmitDonation: (d: { donor: string; email: string; amount: number; message?: string }) => void;
}

export default function PublicPortal({ activeTab, setActiveTab, onApplyNow, programs, news, testimonials, onSubmitTestimonial, onSubmitDonation }: PublicPortalProps) {

  // Newsletter Subscription States
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribedNewsletter, setSubscribedNewsletter] = useState(false);

  // Modal article
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Fermer la modal avec Echap
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedArticle(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Bloquer le scroll du body quand la modal est ouverte
  useEffect(() => {
    document.body.style.overflow = selectedArticle ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedArticle]);

  const handleNewsletterSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    
    const currentSubscribers = JSON.parse(localStorage.getItem('newsletter_subscribers') || '[]');
    if (!currentSubscribers.includes(newsletterEmail)) {
      currentSubscribers.push(newsletterEmail);
      localStorage.setItem('newsletter_subscribers', JSON.stringify(currentSubscribers));
    }
    
    setSubscribedNewsletter(true);
    setNewsletterEmail('');
  };

  // Programs View States
  const [programSearch, setProgramSearch] = useState('');
  const [selectedProgramType, setSelectedProgramType] = useState<string>('Tous');

  // Formulaire public de témoignage
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [testimonialSent, setTestimonialSent] = useState(false);
  const [tName, setTName] = useState('');
  const [tRole, setTRole] = useState('');
  const [tPromo, setTPromo] = useState('');
  const [tText, setTText] = useState('');

  // Formulaire public de don
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [donationSent, setDonationSent] = useState(false);
  const [dDonor, setDDonor] = useState('');
  const [dEmail, setDEmail] = useState('');
  const [dAmount, setDAmount] = useState('');
  const [dMessage, setDMessage] = useState('');

  const submitTestimonial = (e: FormEvent) => {
    e.preventDefault();
    if (!tName || !tText) return;
    onSubmitTestimonial({ name: tName, role: tRole || 'Alumni IDLA', text: tText, promo: tPromo, category: 'Alumni' });
    setTestimonialSent(true);
    setTName(''); setTRole(''); setTText(''); setTPromo('');
  };

  const submitDonation = (e: FormEvent) => {
    e.preventDefault();
    const amount = Number(dAmount);
    if (!dDonor || !dEmail || !amount || amount <= 0) return;
    onSubmitDonation({ donor: dDonor, email: dEmail, amount, message: dMessage || undefined });
    setDonationSent(true);
    setDDonor(''); setDEmail(''); setDAmount(''); setDMessage('');
  };

  const closeTestimonialModal = () => { setShowTestimonialModal(false); setTestimonialSent(false); };
  const closeDonationModal = () => { setShowDonationModal(false); setDonationSent(false); };

  // News View States
  const [selectedNewsCategory, setSelectedNewsCategory] = useState<string>('Tous');

  // Testimonials View States
  const [selectedTestimonialType, setSelectedTestimonialType] = useState<string>('Tous');

  // FILTER PROGRAMS
  const filteredPrograms = useMemo(() => {
    return programs.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(programSearch.toLowerCase()) || 
                            p.description.toLowerCase().includes(programSearch.toLowerCase());
      const matchesType = selectedProgramType === 'Tous' || p.type === selectedProgramType;
      return matchesSearch && matchesType;
    });
  }, [programs, programSearch, selectedProgramType]);

  // FILTER NEWS
  const filteredNews = useMemo(() => {
    return news.filter(n => {
      if (selectedNewsCategory === 'Tous') return true;
      return n.category === selectedNewsCategory;
    });
  }, [news, selectedNewsCategory]);

  // FILTER TESTIMONIALS
  const filteredTestimonials = useMemo(() => {
    return testimonials.filter(t => {
      if (selectedTestimonialType === 'Tous') return true;
      if (selectedTestimonialType === 'Programmes Masters' && t.category === 'Master') return true;
      if (selectedTestimonialType === 'Executive Education' && t.category === 'Executive') return true;
      if (selectedTestimonialType === 'Alumni Stories' && t.category === 'Alumni') return true;
      return false;
    });
  }, [testimonials, selectedTestimonialType]);

  if (activeTab === 'home') {
    return (
      <div className="bg-bg-primary text-text-primary">
        {/* Hero Section */}
        <section className="relative min-h-[700px] flex items-center overflow-hidden border-b border-border-primary px-6 md:px-16 py-16">
          {/* Background Image (replacing green glows/carousel) */}
          <div className="absolute inset-0 z-0">
            <img 
              src="/hero-bg.jpg" 
              alt="Campus IDLA" 
              className="w-full h-full object-cover object-center"
            />
            {/* Subtle Gradient Overlay: light in light mode, dark in dark mode */}
            <div className="absolute inset-0 bg-gradient-to-r from-bg-secondary/70 via-bg-secondary/40 to-transparent dark:from-bg-secondary/80 dark:via-bg-secondary/50 dark:to-transparent pointer-events-none"></div>
          </div>

          <div className="relative z-10 max-w-[1440px] mx-auto w-full">
            <div className="max-w-2xl space-y-6">
              <div className="inline-flex items-center gap-2 bg-[#6cf8bb]/10 border border-[#006c49]/20 px-4 py-1.5 rounded-full">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6ffbbe] animate-pulse"></span>
                <span className="text-[#6ffbbe] font-semibold text-xs uppercase tracking-wider">Session {new Date().getFullYear()} Ouverte</span>
              </div>
              
              <h1 className="font-sans font-bold text-4xl md:text-5xl lg:text-6xl text-text-primary leading-tight">
                L'Éducation d'Élite <span className="text-brand-primary">Accessible</span> en Afrique Centrale
              </h1>
              
              <p className="font-sans text-lg text-text-secondary max-w-lg leading-relaxed">
                IDLA forme les leaders de demain à travers des programmes d'excellence, une infrastructure de pointe et un réseau alumni d'influence.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  onClick={() => setActiveTab('programmes')}
                  className="group relative overflow-hidden bg-gradient-to-r from-[#006c49] via-[#0d9488] to-[#006c49] text-white px-8 py-4 rounded-xl font-bold hover:shadow-[0_0_35px_rgba(0,108,73,0.6)] transition-all duration-300 flex items-center justify-center gap-3 transform hover:-translate-y-1 active:translate-y-0 cursor-pointer border border-[#6ffbbe]/30"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Explorer les programmes 
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
                  </span>
                  <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out"></div>
                </button>
                <button 
                  onClick={() => onApplyNow()}
                  className="group relative px-8 py-4 rounded-xl font-bold transition-all duration-300 text-center cursor-pointer bg-white/10 hover:bg-white text-[#006c49] border-2 border-[#006c49] hover:border-transparent shadow-md hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                  <span>Je pose ma candidature</span>
                  <span className="w-2 h-2 rounded-full bg-[#006c49] group-hover:animate-ping"></span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Counter Bar */}
        <section className="py-12 bg-white border-y border-[#c6c6cf]">
          <div className="max-w-[1440px] mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-xs text-[#45464e] uppercase font-bold tracking-widest mb-1">Alumni Actifs</div>
              <div className="text-3xl font-bold text-[#00020e]">5,000+</div>
            </div>
            <div>
              <div className="text-xs text-[#45464e] uppercase font-bold tracking-widest mb-1">Programmes</div>
              <div className="text-3xl font-bold text-[#00020e]">24</div>
            </div>
            <div>
              <div className="text-xs text-[#45464e] uppercase font-bold tracking-widest mb-1">Pays Représentés</div>
              <div className="text-3xl font-bold text-[#00020e]">8</div>
            </div>
            <div>
              <div className="text-xs text-[#45464e] uppercase tracking-wider mb-1">Partenaires</div>
              <div className="text-3xl font-bold text-[#00020e]">120+</div>
            </div>
          </div>
        </section>

        {/* Section interactive : Pourquoi choisir l'IDLA ? (3 Piliers d'Excellence) */}
        <section className="py-20 px-6 md:px-12 bg-gradient-to-b from-white via-[#eff4ff]/30 to-white">
          <div className="max-w-[1440px] mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-[#006c49] bg-[#006c49]/10 px-3 py-1.5 rounded-full inline-block mb-3">
                L'Expérience Académique IDLA
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#00020e] leading-tight">
                Pourquoi l'IDLA est le Choix n°1 en Afrique Centrale ?
              </h2>
              <p className="text-[#45464e] mt-3 text-base">
                Une pédagogie flexible et innovante qui propulse votre carrière vers les sphères décisionnelles internationales.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Carte 1 */}
              <div className="group relative bg-white border border-[#c6c6cf]/50 hover:border-[#006c49] rounded-3xl p-8 shadow-sm hover:shadow-2xl hover:shadow-[#006c49]/10 transition-all duration-500 transform hover:-translate-y-2 flex flex-col justify-between">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#006c49] to-[#0d9488] text-white flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-[#00020e] mb-3 group-hover:text-[#006c49] transition-colors">
                    Pédagogie d'Élite & Flexible
                  </h3>
                  <p className="text-sm text-[#45464e] leading-relaxed mb-6">
                    Accédez à des cours interactifs en direct ou à la demande, conçus par des professeurs et professionnels internationaux prestigieux.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab('programmes')}
                  className="inline-flex items-center gap-2 text-[#006c49] font-bold text-sm group/btn hover:translate-x-1 transition-all pt-4 border-t border-gray-100 cursor-pointer"
                >
                  <span>En savoir plus</span>
                  <span className="w-6 h-6 rounded-full bg-[#006c49]/10 group-hover/btn:bg-[#006c49] group-hover/btn:text-white flex items-center justify-center transition-all duration-300">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              </div>

              {/* Carte 2 */}
              <div className="group relative bg-white border border-[#c6c6cf]/50 hover:border-[#006c49] rounded-3xl p-8 shadow-sm hover:shadow-2xl hover:shadow-[#006c49]/10 transition-all duration-500 transform hover:-translate-y-2 flex flex-col justify-between">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0d9488] to-[#006c49] text-white flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <HeartHandshake className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-[#00020e] mb-3 group-hover:text-[#006c49] transition-colors">
                    Réseau Alumni & Mentorat
                  </h3>
                  <p className="text-sm text-[#45464e] leading-relaxed mb-6">
                    Bénéficiez d'un accompagnement personnalisé par des mentors de haut niveau et intégrez un réseau influent de plus de 5 000 anciens élèves.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab('temoignages')}
                  className="inline-flex items-center gap-2 text-[#006c49] font-bold text-sm group/btn hover:translate-x-1 transition-all pt-4 border-t border-gray-100 cursor-pointer"
                >
                  <span>Voir le réseau</span>
                  <span className="w-6 h-6 rounded-full bg-[#006c49]/10 group-hover/btn:bg-[#006c49] group-hover/btn:text-white flex items-center justify-center transition-all duration-300">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              </div>

              {/* Carte 3 */}
              <div className="group relative bg-white border border-[#c6c6cf]/50 hover:border-[#006c49] rounded-3xl p-8 shadow-sm hover:shadow-2xl hover:shadow-[#006c49]/10 transition-all duration-500 transform hover:-translate-y-2 flex flex-col justify-between">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#006c49] to-[#044c35] text-white flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-[#00020e] mb-3 group-hover:text-[#006c49] transition-colors">
                    Reconnaissance Internationale
                  </h3>
                  <p className="text-sm text-[#45464e] leading-relaxed mb-6">
                    Nos cursus sont accrédités et conçus pour répondre aux standards internationaux, vous ouvrant les portes des grandes organisations.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab('programmes')}
                  className="inline-flex items-center gap-2 text-[#006c49] font-bold text-sm group/btn hover:translate-x-1 transition-all pt-4 border-t border-gray-100 cursor-pointer"
                >
                  <span>Découvrir l'accréditation</span>
                  <span className="w-6 h-6 rounded-full bg-[#006c49]/10 group-hover/btn:bg-[#006c49] group-hover/btn:text-white flex items-center justify-center transition-all duration-300">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic soil structure alert card representation / Bento information */}
        <section className="py-16 px-6 md:px-12 max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white border border-[#c6c6cf] rounded-2xl p-8 shadow-sm">
            <div className="lg:col-span-4 flex flex-col justify-center">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-[#00020e] leading-snug">Infrastructure et géologie locale</h3>
              <p className="text-sm text-[#45464e] mt-2 leading-relaxed">
                IDLA étudie attentivement la structure des sols argilo-sableux d'Afrique Centrale pour adapter ses fondations architecturales éco-responsables de demain.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[#006c49]">
                <ShieldAlert className="w-4 h-4" />
                <span>Normes anti-sismiques européennes appliquées</span>
              </div>
            </div>
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 bg-[#eff4ff] rounded-xl border border-[#e5eeff]">
                <Flame className="text-[#006c49] w-6 h-6 mb-2" />
                <h4 className="font-bold text-sm text-[#00020e]">Résilience structures</h4>
                <p className="text-xs text-[#45464e] mt-1 leading-relaxed">
                  Technique de fondation pieu-béton avec drainage intégré pour contrer l'humidité saisonnière équatoriale.
                </p>
              </div>
              <div className="p-6 bg-[#eff4ff] rounded-xl border border-[#e5eeff]">
                <Compass className="text-[#006c49] w-6 h-6 mb-2" />
                <h4 className="font-bold text-sm text-[#00020e]">Éco-Design</h4>
                <p className="text-xs text-[#45464e] mt-1 leading-relaxed">
                  Lumière naturelle optimisée à 80% pour réduire drastiquement l'empreinte carbone et l'alimentation secteur.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured programs snippet preview */}
        <section className="py-16 px-6 md:px-12 bg-white border-t border-[#c6c6cf]">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl font-bold text-[#00020e]">Nos Filières d'Excellence</h2>
                <p className="text-sm text-[#45464e] mt-1">Des formations adaptées aux défis technologiques et économiques du continent.</p>
              </div>
              <button 
                onClick={() => setActiveTab('programmes')}
                className="group relative inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-[#006c49]/10 to-[#0d9488]/10 hover:from-[#006c49] hover:to-[#0d9488] text-[#006c49] hover:text-white font-bold text-sm tracking-wide transition-all duration-300 border border-[#006c49]/30 hover:border-transparent shadow-sm hover:shadow-lg hover:shadow-[#006c49]/25 hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Voir plus — Toutes nos formations</span>
                <span className="w-7 h-7 rounded-full bg-[#006c49]/20 group-hover:bg-white/20 flex items-center justify-center transition-all duration-300 group-hover:translate-x-1">
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {programs.slice(0, 3).map((p, idx) => (
                <div 
                  key={p.id} 
                  className={`rounded-2xl overflow-hidden relative group min-h-[380px] shadow-md hover:shadow-2xl hover:shadow-[#006c49]/20 border border-[#c6c6cf]/30 cursor-pointer transition-all duration-500 transform hover:-translate-y-1.5 flex flex-col justify-end ${
                    idx === 0 ? 'md:col-span-8' : 'md:col-span-4'
                  }`}
                  onClick={() => setActiveTab('programmes')}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-[#00020e]/95 via-[#00020e]/50 to-transparent z-10 transition-opacity duration-300 group-hover:opacity-95"></div>
                  <img 
                    className="absolute inset-0 object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out" 
                    alt={p.title} 
                    src={p.image}
                  />
                  <div className="relative z-20 p-6 w-full flex flex-col justify-end">
                    <span className="bg-[#6cf8bb] text-[#00020e] text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider mb-2.5 inline-block w-fit shadow-sm">
                      {p.category}
                    </span>
                    <h3 className="text-white font-bold text-xl md:text-2xl mb-2 group-hover:text-[#6cf8bb] transition-colors">{p.title}</h3>
                    <p className="text-white/80 text-xs line-clamp-2 max-w-md mb-5">{p.description}</p>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-white/15 opacity-90 group-hover:opacity-100 transition-all duration-300">
                      <span className="text-white/90 text-xs font-semibold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#6cf8bb]" /> Rentrée {new Date().getFullYear()}
                      </span>
                      <span className="inline-flex items-center gap-2 bg-white/15 hover:bg-[#6cf8bb] text-white group-hover:text-[#00020e] px-4 py-2 rounded-full text-xs font-extrabold transition-all duration-300 transform group-hover:translate-x-1.5 shadow-md">
                        <span>Découvrir & Voir plus</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Philanthropy CTA */}
        <section className="py-16 px-6 md:px-12 bg-bg-primary">
          <div className="max-w-[1200px] mx-auto bg-bg-secondary rounded-3xl overflow-hidden relative border border-border-primary">
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-35 pointer-events-none">
              <img 
                className="object-cover w-full h-full" 
                alt="philanthropy background" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGaWxsTckoQjKkeK4pErkSRrl_IWALAKmwKvEc-q_CVQ1rX9WUBaUPD1_tT7Yz97MNijFUG1rSdyVqlVAuQTrdF-2QjXrzDfSd6xoN8jzSYAOMwJxFOW-3WgzhjqIokkez0atuBNkRBDlFpZAr25klmEL-Y66Q5EkceEUyW6n3vijC8d1uc4-EvuFkrBbL5QGo4MxDmpBsfyYC77XMxU4i2UJ-yly3wxSx-hri9YD9K1vFnLlaB8y5S-Z_eCoEsj8t4fWoh-tHWIU"
              />
            </div>
            <div className="relative z-10 p-8 md:p-12 lg:p-16 max-w-2xl space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary leading-tight">
                Investissez dans le Capital Humain de l'Afrique
              </h2>
              <p className="text-text-secondary text-base leading-relaxed">
                Votre soutien permet d'offrir des bourses d'excellence aux étudiants les plus méritants et de développer nos infrastructures de recherche et d'enseignement d'élite.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  onClick={() => { setDonationSent(false); setShowDonationModal(true); }}
                  className="group relative overflow-hidden bg-gradient-to-r from-[#006c49] to-[#0d9488] text-white px-7 py-3.5 rounded-xl text-sm font-bold hover:shadow-[0_0_25px_rgba(0,108,73,0.5)] transition-all duration-300 flex items-center gap-2.5 transform hover:-translate-y-1 active:translate-y-0 cursor-pointer"
                >
                  <HeartHandshake className="w-4 h-4 group-hover:scale-125 transition-transform duration-300" />
                  <span>Faire un don de soutien</span>
                  <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out"></div>
                </button>
                <button 
                  onClick={() => setActiveTab('temoignages')}
                  className="group px-7 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 bg-white/10 hover:bg-white text-text-primary hover:text-[#00020e] border border-border-primary hover:border-transparent shadow-sm hover:shadow-lg hover:-translate-y-1 flex items-center gap-2 cursor-pointer"
                >
                  <span>Devenir Partenaire académique</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter Subscription */}
        <section className="py-12 px-6 md:px-12 bg-bg-secondary border-t border-border-primary">
          <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-lg">
              <h3 className="text-xl font-bold text-text-primary">Restez connecté avec l'IDLA</h3>
              <p className="text-sm text-text-secondary">
                Inscrivez-vous à notre newsletter d'élite pour recevoir en exclusivité les nouveaux programmes et actualités académiques.
              </p>
            </div>
            <form onSubmit={handleNewsletterSubmit} className="flex w-full md:w-auto max-w-md gap-2 shrink-0">
              {subscribedNewsletter ? (
                <div className="bg-brand-light text-brand-primary text-xs font-bold px-6 py-3.5 rounded-lg flex items-center gap-1.5 border border-brand-primary/20">
                  Inscription réussie ! Vous recevrez nos e-mails d'actualité.
                </div>
              ) : (
                <>
                  <input
                    type="email"
                    required
                    placeholder="Votre adresse email d'excellence"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="flex-grow md:w-64 p-3.5 rounded-xl border border-border-primary bg-bg-primary text-text-primary outline-none focus:ring-2 focus:ring-[#006c49] text-sm font-medium transition-all shadow-inner"
                  />
                  <button
                    type="submit"
                    className="group relative overflow-hidden bg-gradient-to-r from-[#006c49] to-[#0d9488] text-white px-7 py-3.5 rounded-xl text-sm font-bold hover:shadow-[0_0_20px_rgba(0,108,73,0.4)] transition-all duration-300 cursor-pointer shrink-0 flex items-center gap-1.5 transform hover:-translate-y-0.5"
                  >
                    <span>S'abonner</span>
                    <Send className="w-3.5 h-3.5 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform duration-300" />
                  </button>
                </>
              )}
            </form>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-bg-secondary text-text-primary border-t border-border-primary py-12 px-6 md:px-12">
          <div className="max-w-[1440px] mx-auto grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-4">
              <div className="text-xl font-bold text-brand-primary">IDLA</div>
              <p className="text-xs text-text-secondary leading-relaxed">
                L'International Distance Learning Academy est dédiée à l'enseignement d'excellence et à distance pour les futurs leaders.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-sm text-text-primary uppercase tracking-wider mb-4">Filières</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li><a href="#" className="hover:text-brand-primary transition-colors">Ingénierie & Tech</a></li>
                <li><a href="#" className="hover:text-brand-primary transition-colors">Business & Management</a></li>
                <li><a href="#" className="hover:text-brand-primary transition-colors">Santé & Administration</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm text-text-primary uppercase tracking-wider mb-4">Admissions</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li><a href="#" className="hover:text-brand-primary transition-colors">Dossier de candidature</a></li>
                <li><a href="#" className="hover:text-brand-primary transition-colors">Dates clés</a></li>
                <li><a href="#" className="hover:text-brand-primary transition-colors">Financement & Bourses</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm text-text-primary uppercase tracking-wider mb-4">Contact</h4>
              <p className="text-sm text-text-secondary">Douala, Cameroun</p>
              <p className="text-sm text-text-secondary mt-1">contact@idla.edu</p>
            </div>
          </div>
          <div className="max-w-[1440px] mx-auto border-t border-border-primary/60 mt-8 pt-4 flex flex-col sm:flex-row justify-between text-xs text-text-secondary/60 gap-2">
            <p>© {new Date().getFullYear()} IDLA — International Distance Learning Academy. Tous droits réservés.</p>
            <p>Conçu avec Excellence en Afrique Centrale</p>
          </div>
        </footer>

        {/* MODALE — Formulaire public de don */}
        {showDonationModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeDonationModal}>
            <div className="bg-bg-secondary text-text-primary w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-border-primary" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary/40 bg-bg-primary text-text-primary">
                <h3 className="font-bold text-base flex items-center gap-2"><HeartHandshake className="w-5 h-5 text-brand-primary" /> Faire un don</h3>
                <button onClick={closeDonationModal} className="text-text-secondary hover:text-text-primary cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              {donationSent ? (
                <div className="p-8 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-[#006c49] mx-auto" />
                  <h4 className="font-bold text-lg">Merci pour votre générosité !</h4>
                  <p className="text-sm text-[#45464e]">Votre don a bien été transmis à notre équipe. Nous vous recontacterons pour finaliser la contribution.</p>
                  <button onClick={closeDonationModal} className="mt-2 bg-[#006c49] text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all">Fermer</button>
                </div>
              ) : (
                <form onSubmit={submitDonation} className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Votre nom / organisation *</label>
                    <input type="text" value={dDonor} onChange={(e) => setDDonor(e.target.value)} placeholder="ex: Fondation Total"
                      className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-sm" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Email *</label>
                    <input type="email" value={dEmail} onChange={(e) => setDEmail(e.target.value)} placeholder="ex: contact@exemple.com"
                      className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-sm" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Montant du don (FCFA) *</label>
                    <input type="number" min="1" value={dAmount} onChange={(e) => setDAmount(e.target.value)} placeholder="ex: 100000"
                      className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-sm" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Message (facultatif)</label>
                    <textarea value={dMessage} onChange={(e) => setDMessage(e.target.value)} rows={2} placeholder="Affectation souhaitée, mot d'encouragement…"
                      className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-sm" />
                  </div>
                  <button type="submit" className="w-full bg-[#006c49] text-white py-3 rounded-lg font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" /> Envoyer mon don
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'programmes') {
    return (
      <div className="bg-bg-primary text-text-primary min-h-screen py-12 px-6 md:px-12">
        <div className="max-w-[1440px] mx-auto space-y-12">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="font-sans font-bold text-4xl text-text-primary">Nos Programmes d'Excellence</h1>
            <p className="text-[#45464e] text-lg max-w-2xl">
              Découvrez des parcours académiques d'élite conçus pour propulser votre carrière. Des formations rigoureuses encadrées par des experts internationaux.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-xl border border-[#c6c6cf] shadow-sm">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                className="w-full bg-slate-50 border border-[#c6c6cf] rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-[#006c49] outline-none" 
                placeholder="Rechercher un programme par mot-clé..." 
                type="text"
                value={programSearch}
                onChange={(e) => setProgramSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {['Tous', 'Master', 'Doctorat', 'Bachelor', 'Certification'].map((type) => (
                <button 
                  key={type}
                  onClick={() => setSelectedProgramType(type)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedProgramType === type 
                      ? 'bg-brand-primary text-white shadow-sm' 
                      : 'bg-bg-primary hover:bg-border-primary/50 text-text-secondary border border-border-primary/60'
                  }`}
                >
                  {type === 'Tous' ? 'Tous les types' : type}
                </button>
              ))}
            </div>
          </div>

          {/* Programs Grid */}
          {filteredPrograms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrograms.map((p) => (
                <div key={p.id} className="bg-white rounded-xl border border-[#c6c6cf] overflow-hidden flex flex-col hover:-translate-y-1 transition-all duration-300 group shadow-sm">
                  <div className="h-48 w-full relative">
                    <img 
                      className="w-full h-full object-cover" 
                      alt={p.title} 
                      src={p.image}
                    />
                    {p.isNew && (
                      <span className="absolute top-4 right-4 bg-[#006c49] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                        Nouveau
                      </span>
                    )}
                  </div>
                  
                  <div className="p-6 flex flex-col flex-grow space-y-4">
                    <div className="flex items-center gap-1.5 text-[#006c49] font-bold text-xs">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{p.category}</span>
                    </div>

                    <h3 className="font-bold text-lg text-[#00020e]">{p.title}</h3>
                    
                    <p className="text-xs text-[#45464e] leading-relaxed flex-grow">
                      {p.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-[#c6c6cf]/30">
                      <div className="flex items-center gap-1 text-slate-400 text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{p.duration}</span>
                      </div>
                      <button 
                        onClick={() => onApplyNow(p.title)}
                        className="flex items-center gap-1 text-sm font-semibold text-[#006c49] group-hover:underline"
                      >
                        S'inscrire
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-xl border border-[#c6c6cf]">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 font-semibold text-sm">Aucun programme ne correspond à votre recherche.</p>
              <button 
                onClick={() => { setProgramSearch(''); setSelectedProgramType('Tous'); }}
                className="mt-4 text-[#006c49] text-sm font-bold hover:underline"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'actualites') {
    const featuredNewsArticle = news.find(n => n.isFeatured);
    const regularNewsArticles = filteredNews.filter(n => !n.isFeatured || selectedNewsCategory !== 'Tous');

    return (
      <div className="bg-bg-primary text-text-primary min-h-screen py-12 px-6 md:px-12">
        <div className="max-w-[1440px] mx-auto space-y-12">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="font-sans font-bold text-4xl text-text-primary">Actualités</h1>
            <p className="text-[#45464e] text-lg max-w-2xl">
              Restez informé des derniers événements, des réussites académiques et des nouveaux partenariats d'élite de l'IDLA.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar filter */}
            <aside className="w-full lg:w-[260px] space-y-6 shrink-0">
              <div>
                <h3 className="text-xs uppercase font-bold text-[#00020e] tracking-widest mb-3">Catégories</h3>
                <div className="flex flex-wrap lg:flex-col gap-2">
                  {['Tous', 'Événements', 'Académique', 'Partenariats', 'Annonces', 'Alumni'].map((cat) => (
                    <button 
                      key={cat}
                      onClick={() => setSelectedNewsCategory(cat)}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-between ${
                        selectedNewsCategory === cat 
                          ? 'bg-[#e5eeff] text-[#00714d]' 
                          : 'hover:bg-slate-100 text-[#45464e]'
                      }`}
                    >
                      <span>{cat === 'Tous' ? 'Toutes les news' : cat}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-white/60 rounded">
                        {cat === 'Tous' 
                          ? news.length 
                          : news.filter(n => n.category === cat).length
                        }
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* News Feed */}
            <div className="flex-grow space-y-8">
              {/* Featured article shown on 'Tous' or when matches category */}
              {featuredNewsArticle && selectedNewsCategory === 'Tous' && (
                <article
                  onClick={() => setSelectedArticle(featuredNewsArticle)}
                  className="bg-white border border-[#c6c6cf] rounded-xl overflow-hidden flex flex-col md:flex-row group cursor-pointer hover:shadow-md transition-all"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedArticle(featuredNewsArticle)}
                  aria-label={`Lire l'article : ${featuredNewsArticle.title}`}
                >
                  <div className="md:w-3/5 overflow-hidden h-64 md:h-auto">
                    <img 
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" 
                      alt={featuredNewsArticle.title} 
                      src={featuredNewsArticle.image}
                    />
                  </div>
                  <div className="md:w-2/5 p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-[#6cf8bb] text-[#00714d] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        {featuredNewsArticle.category}
                      </span>
                      <span className="text-xs text-slate-400">{featuredNewsArticle.date}</span>
                    </div>
                    <h2 className="font-bold text-2xl text-[#00020e] group-hover:text-[#006c49] transition-colors leading-tight">
                      {featuredNewsArticle.title}
                    </h2>
                    <p className="text-sm text-[#45464e] mt-3 leading-relaxed">
                      {featuredNewsArticle.description}
                    </p>
                    <div className="pt-6">
                      <span className="text-sm font-bold text-[#006c49] flex items-center gap-1 group-hover:gap-2 transition-all">
                        Lire l'article <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </article>
              )}
              {regularNewsArticles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {regularNewsArticles.map((n) => (
                    <article
                      key={n.id}
                      onClick={() => setSelectedArticle(n)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedArticle(n)}
                      aria-label={`Lire l'article : ${n.title}`}
                      className="bg-white border border-[#c6c6cf] rounded-xl overflow-hidden group cursor-pointer hover:shadow-sm transition-all flex flex-col"
                    >
                      <div className="aspect-video overflow-hidden">
                        <img 
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" 
                          alt={n.title} 
                          src={n.image}
                        />
                      </div>
                      <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="bg-[#eff4ff] text-[#0b1c30] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                              {n.category}
                            </span>
                            <span className="text-xs text-slate-400">{n.date}</span>
                          </div>
                          <h3 className="font-bold text-base text-[#00020e] group-hover:text-[#006c49] transition-colors leading-snug">
                            {n.title}
                          </h3>
                          <p className="text-xs text-[#45464e] leading-relaxed line-clamp-2">
                            {n.description}
                          </p>
                        </div>
                        <div className="pt-2">
                          <span className="text-xs font-bold text-[#006c49] flex items-center gap-1">
                            Lire l'article <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                selectedNewsCategory !== 'Tous' && (
                  <div className="bg-white p-12 text-center rounded-xl border border-[#c6c6cf]">
                    <p className="text-slate-500 font-semibold text-sm">Aucun article disponible dans cette catégorie.</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* ── Modal article plein écran avec fond flouté ── */}
        {selectedArticle && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            onClick={() => setSelectedArticle(null)}
            role="dialog"
            aria-modal="true"
            aria-label={selectedArticle.title}
          >
            <div
              ref={modalRef}
              className="relative bg-white dark:bg-[#0f1117] w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-[#c6c6cf]/60 dark:border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image header */}
              <div className="relative h-56 shrink-0 overflow-hidden">
                <img src={selectedArticle.image} alt={selectedArticle.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                {/* Bouton fermeture */}
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="absolute top-4 right-4 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer backdrop-blur-sm"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
                {/* Catégorie + date en bas de l'image */}
                <div className="absolute bottom-4 left-5 flex items-center gap-2">
                  <span className="bg-[#6cf8bb] text-[#00714d] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {selectedArticle.category}
                  </span>
                  <span className="text-white/80 text-xs font-medium">{selectedArticle.date}</span>
                </div>
              </div>

              {/* Contenu scrollable */}
              <div className="overflow-y-auto flex-1 p-6 md:p-8 space-y-5">
                <h2 className="font-sans font-bold text-2xl text-[#00020e] dark:text-white leading-tight">
                  {selectedArticle.title}
                </h2>
                <p className="text-[#45464e] dark:text-gray-300 text-sm leading-relaxed">
                  {selectedArticle.description}
                </p>
                {/* Contenu étendu simulé */}
                <div className="space-y-4 text-sm text-[#45464e] dark:text-gray-400 leading-relaxed border-t border-[#c6c6cf]/40 pt-5">
                  <p>
                    L'International Distance Learning Academy (IDLA) poursuit son engagement envers l'excellence académique et le développement des talents africains. Cette actualité reflète notre vision d'une éducation accessible, rigoureuse et internationalement reconnue.
                  </p>
                  <p>
                    Nos programmes sont conçus pour répondre aux besoins actuels du marché professionnel, avec un corps professoral de renommée internationale et des partenariats stratégiques qui ouvrent des portes à nos diplômés dans le monde entier.
                  </p>
                  <p>
                    Pour toute information complémentaire, n'hésitez pas à contacter notre service des admissions à l'adresse{' '}
                    <a href="mailto:admission@idlaacademy.online" className="text-[#006c49] font-semibold hover:underline">
                      admission@idlaacademy.online
                    </a>{' '}
                    ou via WhatsApp au <span className="font-semibold">+237 680 548 221</span>.
                  </p>
                </div>
              </div>

              {/* Footer de la modal */}
              <div className="shrink-0 border-t border-[#c6c6cf]/40 dark:border-white/10 px-6 py-4 bg-white dark:bg-[#0f1117] flex items-center justify-between gap-4">
                <p className="text-xs text-slate-400">IDLA — {selectedArticle.date}</p>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'temoignages') {
    return (
      <div className="bg-bg-primary text-text-primary min-h-screen py-12 px-6 md:px-12">
        <div className="max-w-[1440px] mx-auto space-y-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 bg-brand-light text-brand-primary text-xs font-bold rounded-full uppercase tracking-wider">
                Nos Réussites
              </span>
              <h1 className="font-sans font-bold text-4xl text-text-primary">Des parcours d'alumni inspirants.</h1>
              <p className="text-[#45464e] text-lg max-w-2xl">
                Découvrez comment nos diplômés transforment leurs ambitions en projets d'envergure. Leurs histoires sont le reflet de notre exigence.
              </p>
            </div>
            <button
              onClick={() => { setTestimonialSent(false); setShowTestimonialModal(true); }}
              className="shrink-0 bg-[#006c49] text-white px-5 py-3 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              <Quote className="w-4 h-4" /> Partager mon témoignage
            </button>
          </div>

          {/* Quick Category filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border-primary/30">
            {['Tous', 'Programmes Masters', 'Executive Education', 'Alumni Stories'].map((pill) => (
              <button 
                key={pill}
                onClick={() => setSelectedTestimonialType(pill)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedTestimonialType === pill 
                    ? 'bg-brand-primary text-white shadow-sm' 
                    : 'bg-bg-secondary hover:bg-bg-primary text-text-secondary border border-border-primary/60'
                }`}
              >
                {pill}
              </button>
            ))}
          </div>

          {/* Testimonials Grid representation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTestimonials.map((t) => (
              <div 
                key={t.id} 
                className="bg-white p-6 rounded-xl border border-[#c6c6cf] flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300 shadow-sm"
              >
                <div className="space-y-4">
                  <span className="material-symbols-outlined text-[#006c49] text-4xl block opacity-60">
                    <Quote className="w-8 h-8 text-[#006c49]" />
                  </span>
                  <p className="text-sm text-[#0b1c30] italic leading-relaxed">
                    "{t.text}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-6 mt-6 border-t border-[#c6c6cf]/30">
                  <img 
                    className="w-12 h-12 rounded-full object-cover border border-[#c6c6cf]" 
                    alt={t.name} 
                    src={t.image}
                  />
                  <div>
                    <h4 className="font-bold text-sm text-[#00020e]">{t.name}</h4>
                    <p className="text-xs text-slate-400">{t.role} • {t.promo}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MODALE — Formulaire public de témoignage */}
        {showTestimonialModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeTestimonialModal}>
            <div className="bg-bg-secondary text-text-primary w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-border-primary" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary/40 bg-bg-primary text-text-primary">
                <h3 className="font-bold text-base flex items-center gap-2"><Quote className="w-5 h-5 text-brand-primary" /> Partager mon témoignage</h3>
                <button onClick={closeTestimonialModal} className="text-text-secondary hover:text-text-primary cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              {testimonialSent ? (
                <div className="p-8 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-[#006c49] mx-auto" />
                  <h4 className="font-bold text-lg">Merci pour votre témoignage !</h4>
                  <p className="text-sm text-[#45464e]">Il sera publié après validation par notre équipe. Merci de contribuer au rayonnement de l'IDLA.</p>
                  <button onClick={closeTestimonialModal} className="mt-2 bg-[#006c49] text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all">Fermer</button>
                </div>
              ) : (
                <form onSubmit={submitTestimonial} className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Nom complet *</label>
                    <input type="text" value={tName} onChange={(e) => setTName(e.target.value)} placeholder="ex: Aïcha Diallo"
                      className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-sm" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Fonction</label>
                      <input type="text" value={tRole} onChange={(e) => setTRole(e.target.value)} placeholder="ex: Data Analyst"
                        className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Promotion</label>
                      <input type="text" value={tPromo} onChange={(e) => setTPromo(e.target.value)} placeholder="ex: Promo 2022"
                        className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Votre témoignage *</label>
                    <textarea value={tText} onChange={(e) => setTText(e.target.value)} rows={4} placeholder="Racontez votre expérience à l'IDLA…"
                      className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-sm" required />
                  </div>
                  <button type="submit" className="w-full bg-[#006c49] text-white py-3 rounded-lg font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" /> Soumettre mon témoignage
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
