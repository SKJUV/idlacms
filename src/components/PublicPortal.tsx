import { useState, useMemo } from 'react';
import { 
  Search, 
  Clock, 
  ArrowRight, 
  MapPin, 
  AlertTriangle, 
  ShieldAlert, 
  Flame, 
  Compass, 
  Quote, 
  Globe, 
  Users, 
  Share2,
  Calendar,
  BookOpen
} from 'lucide-react';
import { Program, NewsArticle, Testimonial } from '../types';
import { programsData, newsData, testimonialsData } from '../data/mockData';

interface PublicPortalProps {
  activeTab: 'home' | 'programmes' | 'actualites' | 'temoignages';
  setActiveTab: (tab: any) => void;
  onApplyNow: () => void;
}

export default function PublicPortal({ activeTab, setActiveTab, onApplyNow }: PublicPortalProps) {
  // Programs View States
  const [programSearch, setProgramSearch] = useState('');
  const [selectedProgramType, setSelectedProgramType] = useState<string>('Tous');

  // News View States
  const [selectedNewsCategory, setSelectedNewsCategory] = useState<string>('Tous');

  // Testimonials View States
  const [selectedTestimonialType, setSelectedTestimonialType] = useState<string>('Tous');

  // FILTER PROGRAMS
  const filteredPrograms = useMemo(() => {
    return programsData.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(programSearch.toLowerCase()) || 
                            p.description.toLowerCase().includes(programSearch.toLowerCase());
      const matchesType = selectedProgramType === 'Tous' || p.type === selectedProgramType;
      return matchesSearch && matchesType;
    });
  }, [programSearch, selectedProgramType]);

  // FILTER NEWS
  const filteredNews = useMemo(() => {
    return newsData.filter(n => {
      if (selectedNewsCategory === 'Tous') return true;
      return n.category === selectedNewsCategory;
    });
  }, [selectedNewsCategory]);

  // FILTER TESTIMONIALS
  const filteredTestimonials = useMemo(() => {
    return testimonialsData.filter(t => {
      if (selectedTestimonialType === 'Tous') return true;
      if (selectedTestimonialType === 'Programmes Masters' && t.category === 'Master') return true;
      if (selectedTestimonialType === 'Executive Education' && t.category === 'Executive') return true;
      if (selectedTestimonialType === 'Alumni Stories' && t.category === 'Alumni') return true;
      return false;
    });
  }, [selectedTestimonialType]);

  if (activeTab === 'home') {
    return (
      <div className="bg-[#f8f9ff] text-[#0b1c30]">
        {/* Hero Section */}
        <section className="relative min-h-[700px] flex items-center overflow-hidden bg-[#00020e] px-6 md:px-16 py-16">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#006c49] blur-[120px] rounded-full -mr-40 -mt-40"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#6cf8bb] blur-[100px] rounded-full -ml-20 -mb-20"></div>
          </div>

          <div className="relative z-10 max-w-[1440px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-[#6cf8bb]/10 border border-[#006c49]/20 px-4 py-1.5 rounded-full">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6ffbbe] animate-pulse"></span>
                <span className="text-[#6ffbbe] font-semibold text-xs uppercase tracking-wider">Session 2024 Ouverte</span>
              </div>
              
              <h1 className="font-sans font-bold text-4xl md:text-5xl lg:text-6xl text-white leading-tight">
                L'Éducation d'Élite <span className="text-[#6ffbbe]">Accessible</span> en Afrique Centrale
              </h1>
              
              <p className="font-sans text-lg text-white/70 max-w-lg leading-relaxed">
                IDLA forme les leaders de demain à travers des programmes d'excellence, une infrastructure de pointe et un réseau alumni d'influence.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  onClick={() => setActiveTab('programmes')}
                  className="bg-[#006c49] text-white px-8 py-4 rounded-lg font-semibold hover:bg-[#6cf8bb] hover:text-[#00020e] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#006c49]/20"
                >
                  Explorer les programmes 
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={onApplyNow}
                  className="border border-white/20 text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-all text-center"
                >
                  Je pose ma candidature
                </button>
              </div>
            </div>

            <div className="hidden lg:block relative">
              <div className="relative rounded-2xl overflow-hidden aspect-video shadow-2xl border border-white/10">
                <img 
                  className="object-cover w-full h-full" 
                  alt="Students collaboration" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlITubWSxX5Bi1Gy85eRy77geyt0EUVKXodBcmi7ce7aMf4tkOIOVgH76UESrQXS7z0RqEHM0vmG34skiJicsHxzTJ8fo92_IjCDgdc7SwXNrQkVa6UoMxrBpZQaJpgyXvQmkEnluNtqFz6Ae-LrFyZOjhHbRXgMHqNhjE1NyZ1UA2M1U5uAvvxYRnBUZez2lIgcWFDzF2G2-XZcpduxY6-R3CAoOf1sh9s6h5zPSiplERtRZW7mTMss86SQt7G7QErPXgTSnzcQA"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-xl border border-[#c6c6cf] max-w-[220px]">
                <div className="text-[#006c49] font-bold text-3xl">98%</div>
                <div className="text-[#45464e] text-xs font-medium mt-1 leading-snug">
                  Taux d'insertion professionnelle de nos diplômés.
                </div>
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
                className="text-[#006c49] font-semibold text-sm flex items-center gap-1 group hover:underline"
              >
                Voir tout <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {programsData.slice(0, 3).map((p, idx) => (
                <div 
                  key={p.id} 
                  className={`rounded-2xl overflow-hidden relative group min-h-[350px] shadow-sm border border-[#c6c6cf]/30 cursor-pointer ${
                    idx === 0 ? 'md:col-span-8' : 'md:col-span-4'
                  }`}
                  onClick={() => setActiveTab('programmes')}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-[#00020e]/95 via-[#00020e]/40 to-transparent z-10"></div>
                  <img 
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
                    alt={p.title} 
                    src={p.image}
                  />
                  <div className="absolute bottom-0 left-0 p-6 z-20">
                    <span className="bg-[#6cf8bb] text-[#00020e] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-2 inline-block">
                      {p.category}
                    </span>
                    <h3 className="text-white font-bold text-xl md:text-2xl mb-1">{p.title}</h3>
                    <p className="text-white/70 text-xs line-clamp-2 max-w-sm">{p.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Philanthropy CTA */}
        <section className="py-16 px-6 md:px-12 bg-[#eff4ff]">
          <div className="max-w-[1200px] mx-auto bg-[#00020e] rounded-3xl overflow-hidden relative border border-white/10">
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-35 pointer-events-none">
              <img 
                className="object-cover w-full h-full" 
                alt="philanthropy background" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGaWxsTckoQjKkeK4pErkSRrl_IWALAKmwKvEc-q_CVQ1rX9WUBaUPD1_tT7Yz97MNijFUG1rSdyVqlVAuQTrdF-2QjXrzDfSd6xoN8jzSYAOMwJxFOW-3WgzhjqIokkez0atuBNkRBDlFpZAr25klmEL-Y66Q5EkceEUyW6n3vijC8d1uc4-EvuFkrBbL5QGo4MxDmpBsfyYC77XMxU4i2UJ-yly3wxSx-hri9YD9K1vFnLlaB8y5S-Z_eCoEsj8t4fWoh-tHWIU"
              />
            </div>
            <div className="relative z-10 p-8 md:p-12 lg:p-16 max-w-2xl space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                Investissez dans le Capital Humain de l'Afrique
              </h2>
              <p className="text-white/70 text-base leading-relaxed">
                Votre soutien permet d'offrir des bourses d'excellence aux étudiants les plus méritants et de développer nos infrastructures de recherche et d'enseignement d'élite.
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="bg-[#006c49] text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-[#6cf8bb] hover:text-[#00020e] transition-all">
                  Faire un don de soutien
                </button>
                <button className="text-white border border-white/20 px-6 py-3 rounded-lg text-sm font-semibold hover:bg-white/10 transition-all">
                  Devenir Partenaire académique
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[#00020e] text-white border-t border-white/10 py-12 px-6 md:px-12">
          <div className="max-w-[1440px] mx-auto grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-4">
              <div className="text-xl font-bold text-[#6ffbbe]">IDLA CMS</div>
              <p className="text-xs text-white/60 leading-relaxed">
                L'Institut de Leadership et d'Administration est dédié à l'émergence d'une nouvelle génération de leaders africains d'élite.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-sm text-white uppercase tracking-wider mb-4">Filières</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">Ingénierie & Tech</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Business & Management</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Santé & Administration</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm text-white uppercase tracking-wider mb-4">Admissions</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">Dossier de candidature</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Dates clés</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Financement & Bourses</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm text-white uppercase tracking-wider mb-4">Contact</h4>
              <p className="text-sm text-white/60">Douala, Cameroun</p>
              <p className="text-sm text-white/60 mt-1">contact@idla.edu</p>
            </div>
          </div>
          <div className="max-w-[1440px] mx-auto border-t border-white/10 mt-8 pt-4 flex flex-col sm:flex-row justify-between text-xs text-white/40 gap-2">
            <p>© 2024 IDLA CMS. Tous droits réservés.</p>
            <p>Conçu avec Excellence en Afrique Centrale</p>
          </div>
        </footer>
      </div>
    );
  }

  if (activeTab === 'programmes') {
    return (
      <div className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen py-12 px-6 md:px-12">
        <div className="max-w-[1440px] mx-auto space-y-12">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="font-sans font-bold text-4xl text-[#00020e]">Nos Programmes d'Excellence</h1>
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
              {['Tous', 'Master', 'Doctorat', 'Bachelors'].map((type) => (
                <button 
                  key={type}
                  onClick={() => setSelectedProgramType(type)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    selectedProgramType === type 
                      ? 'bg-[#00020e] text-white shadow-sm' 
                      : 'bg-slate-100 hover:bg-slate-200 text-[#45464e]'
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
                        onClick={onApplyNow}
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
    const featuredNewsArticle = newsData.find(n => n.isFeatured);
    const regularNewsArticles = filteredNews.filter(n => !n.isFeatured || selectedNewsCategory !== 'Tous');

    return (
      <div className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen py-12 px-6 md:px-12">
        <div className="max-w-[1440px] mx-auto space-y-12">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="font-sans font-bold text-4xl text-[#00020e]">Actualités</h1>
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
                          ? newsData.length 
                          : newsData.filter(n => n.category === cat).length
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
                <article className="bg-white border border-[#c6c6cf] rounded-xl overflow-hidden flex flex-col md:flex-row group cursor-pointer hover:shadow-md transition-all">
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

              {/* Regular Grid */}
              {regularNewsArticles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {regularNewsArticles.map((n) => (
                    <article key={n.id} className="bg-white border border-[#c6c6cf] rounded-xl overflow-hidden group cursor-pointer hover:shadow-sm transition-all flex flex-col">
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
      </div>
    );
  }

  if (activeTab === 'temoignages') {
    return (
      <div className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen py-12 px-6 md:px-12">
        <div className="max-w-[1440px] mx-auto space-y-12">
          {/* Header */}
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 bg-[#6cf8bb]/20 text-[#00714d] text-xs font-bold rounded-full uppercase tracking-wider">
              Nos Réussites
            </span>
            <h1 className="font-sans font-bold text-4xl text-[#00020e]">Des parcours d'alumni inspirants.</h1>
            <p className="text-[#45464e] text-lg max-w-2xl">
              Découvrez comment nos diplômés transforment leurs ambitions en projets d'envergure. Leurs histoires sont le reflet de notre exigence.
            </p>
          </div>

          {/* Quick Category filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 border-b border-[#c6c6cf]/30">
            {['Tous', 'Programmes Masters', 'Executive Education', 'Alumni Stories'].map((pill) => (
              <button 
                key={pill}
                onClick={() => setSelectedTestimonialType(pill)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  selectedTestimonialType === pill 
                    ? 'bg-[#00020e] text-white' 
                    : 'bg-white hover:bg-slate-100 text-[#45464e] border border-[#c6c6cf]/60'
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
      </div>
    );
  }

  return null;
}
