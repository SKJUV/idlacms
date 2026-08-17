import { useState, useMemo, useEffect, useRef, type FormEvent } from 'react';
import {
  SearchIcon as Search,
  ClockIcon as Clock,
  ArrowRightIcon as ArrowRight,
  ChevronRightIcon as ChevronRight,
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
  GraduationCapIcon,
  GlobeIcon,
  UploadCloudIcon,
  LockIcon,
  FileTextIcon,
  ShareIcon,
  CopyIcon,
} from './Icons';
import { Program, NewsArticle, Testimonial, CustomForm, CustomFormResponse } from '../types';
import { databases, APPWRITE_CONFIG, isAppwriteDbConfigured, ID } from '../lib/appwrite';
import ProgramFilterBar, { FilterState, INITIAL_FILTER_STATE, applyProgramFilters } from './ProgramFilterBar';

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

const EVENT_REGISTRATION_FORM: CustomForm = {
  id: 'system_event_registration',
  title: "Inscription à l'événement",
  description: "Veuillez remplir ce formulaire pour valider votre participation à cet événement.",
  createdAt: new Date().toISOString(),
  fields: [
    { id: 'nom', label: 'Nom', type: 'text', required: true },
    { id: 'prenom', label: 'Prénom', type: 'text', required: true },
    { id: 'email', label: 'Adresse e-mail', type: 'text', required: true },
    { id: 'telephone', label: 'Numéro de téléphone', type: 'text', required: true },
    { id: 'sexe', label: 'Sexe', type: 'radio', required: true, options: ['Homme', 'Femme', 'Préfère ne pas répondre'] },
    { id: 'date_naissance', label: 'Date de naissance', type: 'date', required: false },
    { id: 'statut', label: 'Statut', type: 'select', required: true, options: ['Étudiant', 'Jeune diplômé', 'Salarié', 'Entrepreneur', 'Demandeur d\'emploi', 'Autre'] },
    { id: 'etablissement', label: 'Établissement / Entreprise', type: 'text', required: false },
    { id: 'filiere', label: 'Filière ou domaine d\'activité', type: 'text', required: false },
    { id: 'niveau', label: 'Niveau d\'étude', type: 'select', required: true, options: ['Bac', 'Bac+1', 'Bac+2', 'Bac+3', 'Bac+4', 'Bac+5', 'Doctorat', 'Autre'] },
    { id: 'pourquoi', label: 'Pourquoi souhaitez-vous participer à cet événement ?', type: 'textarea', required: true },
    { id: 'comment', label: 'Comment avez-vous entendu parler de cet événement ?', type: 'checkbox', required: true, options: ['Facebook', 'LinkedIn', 'Instagram', 'WhatsApp', 'Site web', 'Ami / collègue', 'École / Université', 'Autre'] },
    { id: 'deja_participe', label: 'Avez-vous déjà participé à nos événements ?', type: 'radio', required: true, options: ['Oui', 'Non'] },
  ]
};

export default function PublicPortal({ activeTab, setActiveTab, onApplyNow, programs, news, testimonials, onSubmitTestimonial, onSubmitDonation }: PublicPortalProps) {

  // Newsletter Subscription States
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribedNewsletter, setSubscribedNewsletter] = useState(false);

  // Modal article
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Sync article selection from URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const articleId = searchParams.get('article');
    if (articleId && news.length > 0) {
      const found = news.find((n) => n.id === articleId);
      if (found) {
        if (activeTab !== 'actualites') {
          setActiveTab('actualites');
        }
        if (!selectedArticle || selectedArticle.id !== articleId) {
          setSelectedArticle(found);
        }
      }
    }
  }, [news, activeTab]);

  // Sync URL when article is selected
  useEffect(() => {
    if (activeTab === 'actualites') {
      const url = new URL(window.location.href);
      if (selectedArticle) {
        url.searchParams.set('article', selectedArticle.id);
      } else {
        url.searchParams.delete('article');
      }
      window.history.replaceState({}, '', url.toString());
    }
  }, [selectedArticle, activeTab]);

  const handleShareArticle = (article: NewsArticle) => {
    const url = new URL(window.location.href);
    url.searchParams.set('article', article.id);
    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  // Public Form Modal state
  const [activeFormModal, setActiveFormModal] = useState<CustomForm | null>(null);
  const [activeFormValues, setActiveFormValues] = useState<Record<string, any>>({});
  const [formSubmittedSuccess, setFormSubmittedSuccess] = useState(false);

  const handleOpenFormModal = async (formId: string) => {
    if (formId === 'system_event_registration') {
      setActiveFormModal(EVENT_REGISTRATION_FORM);
      setActiveFormValues({});
      setFormSubmittedSuccess(false);
      return;
    }
    
    if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.customForms) {
      try {
        const doc = await databases.getDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.customForms, formId);
        setActiveFormModal({
          id: doc.$id,
          title: doc.title,
          description: doc.description || '',
          createdAt: doc.createdAt,
          fields: JSON.parse(doc.fields || '[]')
        });
        setActiveFormValues({});
        setFormSubmittedSuccess(false);
        return;
      } catch (err) {
        console.error("Échec du chargement du formulaire depuis Appwrite:", err);
      }
    }

    try {
      const savedForms: CustomForm[] = JSON.parse(localStorage.getItem('idla_custom_forms') || '[]');
      const targetForm = savedForms.find((f) => f.id === formId);
      if (targetForm) {
        setActiveFormModal(targetForm);
        setActiveFormValues({});
        setFormSubmittedSuccess(false);
      }
    } catch (e) {}
  };

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#form-')) {
      const formId = hash.replace('#form-', '');
      handleOpenFormModal(formId);
    }
  }, []);

  const handlePublicFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeFormModal) return;

    const respondentName = activeFormValues['Nom complet'] || activeFormValues['Nom & Prénom'] || activeFormValues['Nom'] || 'Visiteur';
    const respondentEmail = activeFormValues['Adresse e-mail'] || activeFormValues['Email'] || activeFormValues['E-mail'] || '';

    const newResponseId = isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.formResponses ? ID.unique() : `resp-${Date.now()}`;
    const newResponse: CustomFormResponse = {
      id: newResponseId,
      formId: activeFormModal.id,
      formTitle: activeFormModal.title,
      newsId: selectedArticle?.id,
      newsTitle: selectedArticle?.title,
      submittedAt: new Date().toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }),
      respondentName,
      respondentEmail,
      data: activeFormValues
    };

    if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.formResponses) {
      try {
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.formResponses,
          newResponseId,
          {
            formId: newResponse.formId,
            formTitle: newResponse.formTitle,
            newsId: newResponse.newsId,
            newsTitle: newResponse.newsTitle,
            respondentName: newResponse.respondentName,
            respondentEmail: newResponse.respondentEmail,
            submittedAt: newResponse.submittedAt,
            data: JSON.stringify(newResponse.data)
          }
        );
      } catch (err) {
        console.error("Échec de l'enregistrement de la réponse sur Appwrite:", err);
      }
    } else {
      try {
        const existing: CustomFormResponse[] = JSON.parse(localStorage.getItem('idla_form_responses') || '[]');
        localStorage.setItem('idla_form_responses', JSON.stringify([newResponse, ...existing]));
      } catch (err) {}
    }

    setFormSubmittedSuccess(true);
  };

  // Fermer la modal avec Echap
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { 
      if (e.key === 'Escape') {
        setSelectedArticle(null);
        setActiveFormModal(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Bloquer le scroll du body quand la modal est ouverte
  useEffect(() => {
    document.body.style.overflow = (selectedArticle || activeFormModal) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedArticle, activeFormModal]);

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

  // Programs View States & Universal Filters
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTER_STATE);

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

  // Accounting & Bookkeeping Pricing Modal State
  const [showAccountingPricingModal, setShowAccountingPricingModal] = useState(false);

  // Active merged programs (combines props.programs with instant idla_local_programs cache)
  const activePrograms = useMemo(() => {
    let localProgs: Program[] = [];
    try {
      localProgs = JSON.parse(localStorage.getItem('idla_local_programs') || '[]');
    } catch (e) {}
    const combined = [...localProgs, ...(programs || [])];
    const uniqueMap = new Map<string, any>();
    combined.forEach((p) => {
      if (p && p.title) {
        const titleKey = p.title.toLowerCase().trim();
        if (!uniqueMap.has(titleKey)) {
          uniqueMap.set(titleKey, p);
        }
      }
    });
    return Array.from(uniqueMap.values()).sort((a, b) => a.title.localeCompare(b.title));
  }, [programs]);

  // FILTER PROGRAMS WITH UNIVERSAL FILTER BAR
  const filteredPrograms = useMemo(() => {
    return applyProgramFilters(activePrograms, filters);
  }, [activePrograms, filters]);

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
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <img 
              src="/hero-bg.png" 
              alt="Campus IDLA" 
              className="w-full h-full object-cover object-center"
            />
            {/* Minimal, highly visible overlay tint so the cover image is clearly visible */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-slate-950/25 to-slate-950/20 pointer-events-none"></div>
          </div>

          <div className="relative z-10 max-w-[1440px] mx-auto w-full">
            <div className="max-w-2xl space-y-6 bg-slate-950/35 backdrop-blur-[2px] p-8 md:p-10 rounded-3xl border border-sky-400/20 shadow-2xl">
              <div className="inline-flex items-center gap-2 bg-sky-500/15 border border-sky-400/30 px-4 py-1.5 rounded-full">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse"></span>
                <span className="text-sky-300 font-semibold text-xs uppercase tracking-wider">Session {new Date().getFullYear()} Ouverte</span>
              </div>
              
              <h1 className="font-sans font-bold text-4xl md:text-5xl lg:text-6xl text-white leading-tight drop-shadow-sm">
                L'Éducation d'Élite <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">Accessible</span> en Afrique
              </h1>
              
              <p className="font-sans text-lg text-slate-200 max-w-lg leading-relaxed font-medium">
                IDLA forme les leaders de demain à travers des programmes d'excellence, une infrastructure de pointe et un réseau alumni d'influence.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  onClick={() => setActiveTab('programmes')}
                  className="group relative overflow-hidden bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-[0_0_35px_rgba(2,132,199,0.5)] transition-all duration-300 flex items-center justify-center gap-3 transform hover:-translate-y-1 active:translate-y-0 cursor-pointer border border-sky-400/30"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Explorer les programmes 
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
                  </span>
                  <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out"></div>
                </button>
                <button 
                  onClick={() => onApplyNow()}
                  className="group relative px-8 py-4 rounded-xl font-bold transition-all duration-300 text-center cursor-pointer bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border-2 border-white/30 hover:border-white shadow-md hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                  <span>Je pose ma candidature</span>
                  <span className="w-2 h-2 rounded-full bg-sky-400 group-hover:animate-ping"></span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Counter Bar */}
        <section className="py-12 bg-bg-secondary border-y border-border-primary">
          <div className="max-w-[1440px] mx-auto px-6 md:px-12 space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-xs text-text-secondary uppercase font-bold tracking-widest mb-1">Alumni Actifs</div>
                <div className="text-3xl font-bold text-text-primary">5,000+</div>
              </div>
              <div>
                <div className="text-xs text-text-secondary uppercase font-bold tracking-widest mb-1">Programmes & Certifications</div>
                <div className="text-3xl font-bold text-text-primary">{programs.length || 64}</div>
              </div>
              <div>
                <div className="text-xs text-text-secondary uppercase font-bold tracking-widest mb-1">Pays Représentés</div>
                <div className="text-3xl font-bold text-text-primary">8</div>
              </div>
              <div>
                <div className="text-xs text-text-secondary uppercase tracking-wider mb-1">Partenaires</div>
                <div className="text-3xl font-bold text-text-primary">120+</div>
              </div>
            </div>
          </div>
        </section>

        {/* Section interactive : Pourquoi choisir l'IDLA ? (3 Piliers d'Excellence) */}
        <section className="py-20 px-6 md:px-12 bg-gradient-to-b from-bg-primary via-brand-primary/5 to-bg-primary">
          <div className="max-w-[1440px] mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-primary bg-brand-primary/10 px-3 py-1.5 rounded-full inline-block mb-3">
                L'Expérience Académique IDLA
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-text-primary leading-tight">
                Pourquoi l'IDLA est le Choix n°1 en Afrique ?
              </h2>
              <p className="text-text-secondary mt-3 text-base">
                Une pédagogie flexible et innovante qui propulse votre carrière vers les sphères décisionnelles internationales.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Carte 1 */}
              <div className="group relative bg-bg-secondary border border-border-primary hover:border-brand-primary rounded-3xl p-8 shadow-sm hover:shadow-2xl hover:shadow-brand-primary/10 transition-all duration-500 transform hover:-translate-y-2 flex flex-col justify-between">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-600 to-blue-700 text-white flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-3 group-hover:text-brand-primary transition-colors">
                    Pédagogie d'Élite & Flexible
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed mb-6">
                    Accédez à des cours interactifs en direct ou à la demande, conçus par des professeurs et professionnels internationaux prestigieux.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab('programmes')}
                  className="inline-flex items-center gap-2 text-brand-primary font-bold text-sm group/btn hover:translate-x-1 transition-all pt-4 border-t border-border-primary/50 cursor-pointer"
                >
                  <span>En savoir plus</span>
                  <span className="w-6 h-6 rounded-full bg-brand-primary/10 group-hover/btn:bg-brand-primary group-hover/btn:text-white flex items-center justify-center transition-all duration-300">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              </div>

              {/* Carte 2 */}
              <div className="group relative bg-bg-secondary border border-border-primary hover:border-brand-primary rounded-3xl p-8 shadow-sm hover:shadow-2xl hover:shadow-brand-primary/10 transition-all duration-500 transform hover:-translate-y-2 flex flex-col justify-between">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <HeartHandshake className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-3 group-hover:text-brand-primary transition-colors">
                    Réseau Alumni & Mentorat
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed mb-6">
                    Bénéficiez d'un accompagnement personnalisé par des mentors de haut niveau et intégrez un réseau influent de plus de 5 000 anciens élèves.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab('temoignages')}
                  className="inline-flex items-center gap-2 text-brand-primary font-bold text-sm group/btn hover:translate-x-1 transition-all pt-4 border-t border-border-primary/50 cursor-pointer"
                >
                  <span>Voir le réseau</span>
                  <span className="w-6 h-6 rounded-full bg-brand-primary/10 group-hover/btn:bg-brand-primary group-hover/btn:text-white flex items-center justify-center transition-all duration-300">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              </div>

              {/* Carte 3 */}
              <div className="group relative bg-bg-secondary border border-border-primary hover:border-brand-primary rounded-3xl p-8 shadow-sm hover:shadow-2xl hover:shadow-brand-primary/10 transition-all duration-500 transform hover:-translate-y-2 flex flex-col justify-between">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-600 to-sky-700 text-white flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-3 group-hover:text-brand-primary transition-colors">
                    Reconnaissance Internationale
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed mb-6">
                    Nos cursus sont accrédités et conçus pour répondre aux standards internationaux, vous ouvrant les portes des grandes organisations.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab('programmes')}
                  className="inline-flex items-center gap-2 text-brand-primary font-bold text-sm group/btn hover:translate-x-1 transition-all pt-4 border-t border-border-primary/50 cursor-pointer"
                >
                  <span>Découvrir l'accréditation</span>
                  <span className="w-6 h-6 rounded-full bg-brand-primary/10 group-hover/btn:bg-brand-primary group-hover/btn:text-white flex items-center justify-center transition-all duration-300">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic soil structure alert card representation / Bento information */}
        <section className="py-16 px-6 md:px-12 max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-bg-secondary border border-border-primary rounded-2xl p-8 shadow-sm">
            <div className="lg:col-span-4 flex flex-col justify-center">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-text-primary leading-snug">Infrastructure et géologie locale</h3>
              <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                IDLA étudie attentivement la structure des sols argilo-sableux d'Afrique pour adapter ses fondations architecturales éco-responsables de demain.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-brand-primary">
                <ShieldAlert className="w-4 h-4" />
                <span>Normes anti-sismiques européennes appliquées</span>
              </div>
            </div>
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 bg-brand-primary/5 rounded-xl border border-brand-primary/10">
                <Flame className="text-brand-primary w-6 h-6 mb-2" />
                <h4 className="font-bold text-sm text-text-primary">Résilience structures</h4>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                  Technique de fondation pieu-béton avec drainage intégré pour contrer l'humidité saisonnière équatoriale.
                </p>
              </div>
              <div className="p-6 bg-brand-primary/5 rounded-xl border border-brand-primary/10">
                <Compass className="text-brand-primary w-6 h-6 mb-2" />
                <h4 className="font-bold text-sm text-text-primary">Éco-Design</h4>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                  Lumière naturelle optimisée à 80% pour réduire drastiquement l'empreinte carbone et l'alimentation secteur.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured programs snippet preview */}
        <section className="py-16 px-6 md:px-12 bg-bg-secondary border-t border-border-primary">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl font-bold text-text-primary">Nos Filières d'Excellence</h2>
                <p className="text-sm text-text-secondary mt-1">Nos certifications internationales.</p>
              </div>
              <button 
                onClick={() => setActiveTab('programmes')}
                className="group relative inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-sky-600/10 to-blue-600/10 hover:from-sky-600 hover:to-blue-600 text-brand-primary hover:text-white font-bold text-sm tracking-wide transition-all duration-300 border border-brand-primary/30 hover:border-transparent shadow-sm hover:shadow-lg hover:shadow-sky-500/25 hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Voir plus — Toutes nos formations</span>
                <span className="w-7 h-7 rounded-full bg-brand-primary/20 group-hover:bg-white/20 flex items-center justify-center transition-all duration-300 group-hover:translate-x-1">
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {activePrograms.slice(0, 3).map((p, idx) => (
                <div 
                  key={p.id} 
                  className={`bg-bg-secondary rounded-2xl border border-border-primary overflow-hidden flex flex-col hover:-translate-y-1.5 transition-all duration-300 group shadow-sm hover:shadow-xl hover:border-brand-primary/30 cursor-pointer ${
                    idx === 0 ? 'md:col-span-8' : 'md:col-span-4'
                  }`}
                  onClick={() => setActiveTab('programmes')}
                >
                  <div className={`relative w-full overflow-hidden ${idx === 0 ? 'h-64 md:h-80' : 'h-64'}`}>
                    <img 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                      alt={p.title} 
                      src={p.image}
                    />
                    <div className="absolute top-5 left-5 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider border border-white/20 flex items-center gap-1.5 shadow-sm">
                      <BookOpen className="w-3.5 h-3.5" />
                      {p.category}
                    </div>
                  </div>
                  
                  <div className="p-6 md:p-8 flex flex-col flex-grow text-left">
                    <h3 className="font-bold text-2xl text-text-primary mb-3 group-hover:text-brand-primary transition-colors leading-tight">{p.title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed line-clamp-3 mb-6 flex-grow">{p.description}</p>
                    
                    <div className="flex items-center justify-between pt-5 border-t border-border-primary/50 mt-auto">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-text-secondary text-sm font-semibold flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-brand-primary" /> Rentrée {new Date().getFullYear()}
                        </span>
                        {p.price && (
                          <div className="mt-1 text-white text-sm font-black bg-gradient-to-r from-brand-primary to-emerald-500 px-3 py-1 rounded-md shadow-md inline-block w-fit">
                            {p.price}
                          </div>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-2 text-brand-primary text-sm font-bold group-hover:translate-x-1.5 transition-transform duration-300">
                        <span>Voir plus</span>
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Nos Certifications Internationales Section */}
            <div className="mt-16 pt-12 border-t border-border-primary space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-4xl font-extrabold text-text-primary flex items-center gap-3">
                    <GraduationCapIcon className="w-9 h-9 text-brand-primary" /> Nos Certifications Internationales
                  </h3>
                  <p className="text-base text-text-secondary mt-2">
                    Validez vos compétences avec des certifications reconnues mondialement par les leaders technologiques.
                  </p>
                </div>
                <button
                  onClick={() => { setFilters((p) => ({ ...p, type: 'Certification' })); setActiveTab('programmes'); }}
                  className="px-6 py-3 bg-brand-primary text-white font-bold text-sm rounded-xl hover:bg-brand-hover transition-all cursor-pointer shadow-sm whitespace-nowrap"
                >
                  Voir toutes les certifications
                </button>
              </div>

              {/* Grid of Certification shortcuts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: "Cisco CCNA-CCNP", desc: "Administration des réseaux et télécommunications d'entreprise.", Icon: GlobeIcon },
                  { title: "AWS Solutions Architect", desc: "Conception et déploiement d'architectures cloud résilientes.", Icon: UploadCloudIcon },
                  { title: "CompTIA Security+", desc: "Fondamentaux de la cybersécurité et protection des données.", Icon: LockIcon },
                  { title: "Project Management (PMP)", desc: "Gestion de projets complexes avec les standards du PMI.", Icon: FileTextIcon }
                ].map(({ title, desc, Icon }) => (
                  <div 
                    key={title}
                    onClick={() => { setFilters((p) => ({ ...p, type: 'Certification' })); setActiveTab('programmes'); }}
                    className="p-7 bg-bg-secondary border border-border-primary hover:border-brand-primary rounded-2xl transition-all cursor-pointer group shadow-sm hover:shadow-md"
                  >
                    <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-base text-text-primary group-hover:text-brand-primary transition-colors">{title}</h4>
                    <p className="text-sm text-text-secondary mt-2 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
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
                src="https://media.istockphoto.com/id/1460172015/photo/businessmen-making-handshake-with-partner-greeting-dealing-merger-and-acquisition-business.jpg?s=2048x2048&w=is&k=20&c=C-eErNHMrUsJz7D7Y3gZZklVHbDFu7l_Oh1z9vs4BVs="
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
                  className="group relative overflow-hidden bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 text-white px-7 py-3.5 rounded-xl text-sm font-bold hover:shadow-[0_0_25px_rgba(2,132,199,0.5)] transition-all duration-300 flex items-center gap-2.5 transform hover:-translate-y-1 active:translate-y-0 cursor-pointer"
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
                    className="flex-grow md:w-64 p-3.5 rounded-xl border border-border-primary bg-bg-primary text-text-primary outline-none focus:ring-2 focus:ring-brand-primary text-sm font-medium transition-all shadow-inner"
                  />
                  <button
                    type="submit"
                    className="group relative overflow-hidden bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 text-white px-7 py-3.5 rounded-xl text-sm font-bold hover:shadow-[0_0_20px_rgba(2,132,199,0.4)] transition-all duration-300 cursor-pointer shrink-0 flex items-center gap-1.5 transform hover:-translate-y-0.5"
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
              <p className="text-sm text-text-secondary">Yaoundé, Cameroun</p>
              <p className="text-sm text-text-secondary mt-1">contact@idla.edu</p>
            </div>
          </div>
          <div className="max-w-[1440px] mx-auto border-t border-border-primary/60 mt-8 pt-4 flex flex-col sm:flex-row justify-between text-xs text-text-secondary/60 gap-2">
            <p>© {new Date().getFullYear()} IDLA — International Distance Learning Academy. Tous droits réservés.</p>
            <p>Conçu avec Excellence en Afrique  </p>
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
                  <CheckCircle2 className="w-12 h-12 text-brand-primary mx-auto" />
                  <h4 className="font-bold text-lg">Merci pour votre générosité !</h4>
                  <p className="text-sm text-[#45464e]">Votre don a bien été transmis à notre équipe. Nous vous recontacterons pour finaliser la contribution.</p>
                  <button onClick={closeDonationModal} className="mt-2 bg-brand-primary text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-brand-hover transition-all">Fermer</button>
                </div>
              ) : (
                <form onSubmit={submitDonation} className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Votre nom / organisation *</label>
                    <input type="text" value={dDonor} onChange={(e) => setDDonor(e.target.value)} placeholder="ex: Fondation Total"
                      className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-brand-primary outline-none text-sm" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Email *</label>
                    <input type="email" value={dEmail} onChange={(e) => setDEmail(e.target.value)} placeholder="ex: contact@exemple.com"
                      className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-brand-primary outline-none text-sm" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Montant du don (FCFA) *</label>
                    <input type="number" min="1" value={dAmount} onChange={(e) => setDAmount(e.target.value)} placeholder="ex: 100000"
                      className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-brand-primary outline-none text-sm" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Message (facultatif)</label>
                    <textarea value={dMessage} onChange={(e) => setDMessage(e.target.value)} rows={2} placeholder="Affectation souhaitée, mot d'encouragement…"
                      className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-brand-primary outline-none text-sm" />
                  </div>
                  <button type="submit" className="w-full bg-brand-primary text-white py-3 rounded-lg font-bold text-sm hover:bg-brand-hover transition-all flex items-center justify-center gap-2">
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


          {/* Search & Filter Bar */}
          <ProgramFilterBar
            filters={filters}
            onFilterChange={setFilters}
            onReset={() => setFilters(INITIAL_FILTER_STATE)}
            totalResults={filteredPrograms.length}
          />

          {/* Programs Grid */}
          {filteredPrograms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrograms.map((p) => (
                <div key={p.id} className="bg-bg-secondary rounded-xl border border-border-primary overflow-hidden flex flex-col hover:-translate-y-1 transition-all duration-300 group shadow-sm">
                  <div className="h-48 w-full relative">
                    <img 
                      className="w-full h-full object-cover" 
                      alt={p.title} 
                      src={p.image}
                    />
                    {p.isNew && (
                      <span className="absolute top-4 right-4 bg-brand-primary text-white text-[10px] font-bold px-2 py-0.5 rounded">
                        Nouveau
                      </span>
                    )}
                  </div>
                  
                  <div className="p-6 flex flex-col flex-grow space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-brand-primary font-bold text-xs">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{p.category}</span>
                      </div>
                      <span className="bg-brand-primary/10 text-brand-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-brand-primary/20">
                        {p.type}
                      </span>
                    </div>

                    <h3 className="font-bold text-lg text-text-primary">{p.title}</h3>
                    
                    <p className="text-xs text-text-secondary leading-relaxed flex-grow">
                      {p.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-border-primary/50">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1 text-text-secondary text-xs font-semibold">
                          <Clock className="w-3.5 h-3.5 text-brand-primary" />
                          <span>{p.duration}</span>
                        </div>
                        {p.price && (
                          <div className="mt-1 text-white text-sm font-black bg-gradient-to-r from-brand-primary to-emerald-500 px-3 py-1 rounded-md shadow-md inline-block w-fit">
                            {p.price}
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => onApplyNow(p.title)}
                        className="flex items-center gap-1 text-sm font-bold text-brand-primary group-hover:underline cursor-pointer"
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
            <div className="bg-bg-secondary p-12 text-center rounded-xl border border-border-primary">
              <Search className="w-12 h-12 text-text-secondary/40 mx-auto mb-2" />
              <p className="text-text-secondary font-semibold text-sm">Aucun programme ne correspond à votre recherche.</p>
              <button 
                onClick={() => setFilters(INITIAL_FILTER_STATE)}
                className="mt-4 text-brand-primary text-sm font-bold hover:underline cursor-pointer"
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
                  className="bg-bg-secondary border border-border-primary rounded-xl overflow-hidden flex flex-col md:flex-row group cursor-pointer hover:shadow-md transition-all"
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
                      <span className="bg-brand-light text-brand-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        {featuredNewsArticle.category}
                      </span>
                      <span className="text-xs text-text-secondary">{featuredNewsArticle.date}</span>
                    </div>
                    {featuredNewsArticle.category === 'Événements' && (featuredNewsArticle.startDate || featuredNewsArticle.endDate) && (
                      <p className="text-xs font-bold text-brand-primary/80 mb-2">
                        📅 Du {featuredNewsArticle.startDate || '?'} au {featuredNewsArticle.endDate || '?'}
                      </p>
                    )}
                    <h2 className="font-bold text-2xl text-text-primary group-hover:text-brand-primary transition-colors leading-tight">
                      {featuredNewsArticle.title}
                    </h2>
                    <p className="text-sm text-text-secondary mt-3 leading-relaxed">
                      {featuredNewsArticle.description}
                    </p>
                    <div className="pt-6">
                      <span className="text-sm font-bold text-brand-primary flex items-center gap-1 group-hover:gap-2 transition-all">
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
                      className="bg-bg-secondary border border-border-primary rounded-xl overflow-hidden group cursor-pointer hover:shadow-sm transition-all flex flex-col"
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
                            <span className="bg-brand-primary/10 text-brand-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                              {n.category}
                            </span>
                            <span className="text-xs text-text-secondary">{n.date}</span>
                          </div>
                          {n.category === 'Événements' && (n.startDate || n.endDate) && (
                            <p className="text-xs font-bold text-brand-primary/80">
                              📅 Du {n.startDate || '?'} au {n.endDate || '?'}
                            </p>
                          )}
                          <h3 className="font-bold text-base text-text-primary group-hover:text-brand-primary transition-colors leading-snug">
                            {n.title}
                          </h3>
                          <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                            {n.description}
                          </p>
                        </div>
                        <div className="pt-2">
                          <span className="text-xs font-bold text-brand-primary flex items-center gap-1">
                            Lire l'article <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                selectedNewsCategory !== 'Tous' && (
                  <div className="bg-bg-secondary p-12 text-center rounded-xl border border-border-primary">
                    <p className="text-text-secondary font-semibold text-sm">Aucun article disponible dans cette catégorie.</p>
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
                
                {/* Actions Top Right */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleShareArticle(selectedArticle); }}
                    className="h-9 px-4 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer backdrop-blur-sm gap-2 text-xs font-bold border border-white/30"
                    aria-label="Partager"
                  >
                    {copySuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ShareIcon className="w-3.5 h-3.5" />}
                    {copySuccess ? 'Lien copié !' : 'Partager'}
                  </button>
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer backdrop-blur-sm"
                    aria-label="Fermer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {/* Catégorie + date en bas de l'image */}
                <div className="absolute bottom-4 left-5 flex items-center gap-2">
                  <span className="bg-brand-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
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
                {selectedArticle.category === 'Événements' && (selectedArticle.startDate || selectedArticle.endDate) && (
                  <div className="flex items-center gap-2 text-sm font-bold text-brand-primary bg-brand-primary/10 w-fit px-4 py-2 rounded-lg">
                    📅 Du {selectedArticle.startDate || '?'} au {selectedArticle.endDate || '?'}
                  </div>
                )}
                <p className="text-[#45464e] dark:text-gray-300 text-sm leading-relaxed">
                  {selectedArticle.description}
                </p>
                {/* Dynamic attached form banner inside article */}
                {(selectedArticle.formId || selectedArticle.category === 'Événements') && (
                  <div className="bg-brand-primary/10 border border-brand-primary/30 rounded-2xl p-5 space-y-3 mt-4">
                    {(() => {
                      const isEvent = selectedArticle.category === 'Événements';
                      const isExpired = isEvent && selectedArticle.endDate && new Date(selectedArticle.endDate + 'T23:59:59').getTime() < Date.now();
                      
                      return (
                        <>
                          <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                            <FileTextIcon className="w-5 h-5" />
                            <span>
                              {isEvent 
                                ? isExpired ? "Inscription terminée" : "Inscription à l'événement" 
                                : "Formulaire officiel rattaché à cette actualité"}
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary">
                            {isEvent 
                              ? isExpired 
                                ? "La date limite pour s'inscrire à cet événement est dépassée."
                                : "Veuillez remplir ce formulaire pour valider votre participation à cet événement."
                              : "Veuillez compléter ce formulaire officiel pour soumettre votre demande ou faire enregistrer vos informations."}
                          </p>
                          {!isExpired && (
                            <button
                              onClick={() => handleOpenFormModal(isEvent ? 'system_event_registration' : selectedArticle.formId!)}
                              className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow cursor-pointer flex items-center gap-2"
                            >
                              <FileTextIcon className="w-4 h-4" />
                              {isEvent ? "S'inscrire à l'événement" : "Remplir le formulaire en ligne"}
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {selectedArticle.formUrl && (
                  <div className="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-5 space-y-3 mt-4">
                    <div className="flex items-center gap-2 text-sky-600 font-bold text-sm">
                      <FileTextIcon className="w-5 h-5" />
                      <span>Lien externe de formulaire</span>
                    </div>
                    <a
                      href={selectedArticle.formUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow"
                    >
                      Accéder au formulaire externe ↗
                    </a>
                  </div>
                )}
              </div>

              {/* Footer de la modal */}
              <div className="shrink-0 border-t border-[#c6c6cf]/40 dark:border-white/10 px-6 py-4 bg-white dark:bg-[#0f1117] flex items-center justify-between gap-4">
                <p className="text-xs text-slate-400">IDLA — {selectedArticle.date}</p>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="bg-brand-primary hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODALE PUBLIQUE : Formulaire sur mesure interactif ── */}
        {activeFormModal && (
          <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md" onClick={() => setActiveFormModal(null)}>
            <div className="bg-bg-secondary text-text-primary w-full max-w-xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-border-primary" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary bg-bg-primary">
                <div>
                  <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                    <FileTextIcon className="w-5 h-5 text-brand-primary" /> {activeFormModal.title}
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5">{activeFormModal.description}</p>
                </div>
                <button onClick={() => setActiveFormModal(null)} className="text-text-secondary hover:text-text-primary cursor-pointer p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formSubmittedSuccess ? (
                <div className="p-8 text-center space-y-4 my-auto">
                  <CheckCircle2 className="w-14 h-14 text-brand-primary mx-auto" />
                  <h4 className="font-bold text-xl text-text-primary">Formulaire transmis avec succès !</h4>
                  <p className="text-sm text-text-secondary max-w-md mx-auto">
                    Merci pour votre réponse. Vos informations ont bien été enregistrées et transmises à l'administration académique IDLA.
                  </p>
                  <button
                    onClick={() => setActiveFormModal(null)}
                    className="bg-brand-primary hover:bg-brand-hover text-white font-bold text-xs px-6 py-3 rounded-xl transition-all cursor-pointer shadow"
                  >
                    Fermer la fenêtre
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePublicFormSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
                  {activeFormModal.fields.map((f) => {
                    const val = activeFormValues[f.label] || '';
                    return (
                      <div key={f.id} className="space-y-1.5">
                        <label className="text-xs font-bold text-text-primary flex items-center justify-between">
                          <span>{f.label} {f.required && <span className="text-rose-500">*</span>}</span>
                          {f.required && <span className="text-[10px] text-text-secondary uppercase font-semibold">Obligatoire</span>}
                        </label>

                        {/* Input text */}
                        {f.type === 'text' && (
                          <input
                            type="text"
                            required={f.required}
                            value={val}
                            placeholder={f.placeholder || ''}
                            onChange={(e) => setActiveFormValues({ ...activeFormValues, [f.label]: e.target.value })}
                            className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary text-xs outline-none focus:ring-2 focus:ring-brand-primary"
                          />
                        )}

                        {/* Textarea */}
                        {f.type === 'textarea' && (
                          <textarea
                            rows={3}
                            required={f.required}
                            value={val}
                            placeholder={f.placeholder || ''}
                            onChange={(e) => setActiveFormValues({ ...activeFormValues, [f.label]: e.target.value })}
                            className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary text-xs outline-none focus:ring-2 focus:ring-brand-primary"
                          />
                        )}

                        {/* Number */}
                        {f.type === 'number' && (
                          <input
                            type="number"
                            required={f.required}
                            value={val}
                            placeholder={f.placeholder || ''}
                            onChange={(e) => setActiveFormValues({ ...activeFormValues, [f.label]: e.target.value })}
                            className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary text-xs outline-none focus:ring-2 focus:ring-brand-primary"
                          />
                        )}

                        {/* Date */}
                        {f.type === 'date' && (
                          <input
                            type="date"
                            required={f.required}
                            value={val}
                            onChange={(e) => setActiveFormValues({ ...activeFormValues, [f.label]: e.target.value })}
                            className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary text-xs outline-none focus:ring-2 focus:ring-brand-primary"
                          />
                        )}

                        {/* Select */}
                        {f.type === 'select' && (
                          <select
                            required={f.required}
                            value={val}
                            onChange={(e) => setActiveFormValues({ ...activeFormValues, [f.label]: e.target.value })}
                            className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary"
                          >
                            <option value="">-- Sélectionnez une option --</option>
                            {(f.options || []).map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}

                        {/* Radio */}
                        {f.type === 'radio' && (
                          <div className="space-y-1.5 pt-1">
                            {(f.options || []).map((opt) => (
                              <label key={opt} className="flex items-center gap-2 text-xs font-semibold text-text-primary cursor-pointer">
                                <input
                                  type="radio"
                                  name={f.id}
                                  required={f.required && !val}
                                  checked={val === opt}
                                  onChange={() => setActiveFormValues({ ...activeFormValues, [f.label]: opt })}
                                  className="w-4 h-4 text-brand-primary accent-brand-primary"
                                />
                                {opt}
                              </label>
                            ))}
                          </div>
                        )}

                        {/* Checkbox */}
                        {f.type === 'checkbox' && (
                          <div className="space-y-1.5 pt-1">
                            {(f.options || ['Oui']).map((opt) => {
                              const currArr: string[] = Array.isArray(val) ? val : [];
                              const checked = currArr.includes(opt);
                              return (
                                <label key={opt} className="flex items-center gap-2 text-xs font-semibold text-text-primary cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      const next = e.target.checked
                                        ? [...currArr, opt]
                                        : currArr.filter((item) => item !== opt);
                                      setActiveFormValues({ ...activeFormValues, [f.label]: next });
                                    }}
                                    className="w-4 h-4 text-brand-primary rounded accent-brand-primary"
                                  />
                                  {opt}
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {/* File Upload */}
                        {f.type === 'file' && (
                          <input
                            type="file"
                            required={f.required}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setActiveFormValues({ ...activeFormValues, [f.label]: `${file.name} (Fichier téléversé)` });
                              }
                            }}
                            className="w-full text-xs text-text-secondary border border-border-primary rounded-lg p-2 bg-bg-primary cursor-pointer"
                          />
                        )}
                      </div>
                    );
                  })}

                  <div className="pt-4 border-t border-border-primary flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveFormModal(null)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-text-secondary hover:bg-bg-primary border border-border-primary cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow cursor-pointer flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" /> Soumettre le formulaire
                    </button>
                  </div>
                </form>
              )}
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
              className="shrink-0 bg-brand-primary text-white px-5 py-3 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
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
                className="bg-bg-secondary p-6 rounded-xl border border-border-primary flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300 shadow-sm"
              >
                <div className="space-y-4">
                  <span className="material-symbols-outlined text-brand-primary text-4xl block opacity-60">
                    <Quote className="w-8 h-8 text-brand-primary" />
                  </span>
                  <p className="text-sm text-text-primary italic leading-relaxed">
                    "{t.text}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-6 mt-6 border-t border-border-primary/50">
                  <img 
                    className="w-12 h-12 rounded-full object-cover border border-border-primary" 
                    alt={t.name} 
                    src={t.image}
                  />
                  <div>
                    <h4 className="font-bold text-sm text-text-primary">{t.name}</h4>
                    <p className="text-xs text-text-secondary">{t.role} • {t.promo}</p>
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
                  <CheckCircle2 className="w-12 h-12 text-brand-primary mx-auto" />
                  <h4 className="font-bold text-lg">Merci pour votre témoignage !</h4>
                  <p className="text-sm text-[#45464e]">Il sera publié après validation par notre équipe. Merci de contribuer au rayonnement de l'IDLA.</p>
                  <button onClick={closeTestimonialModal} className="mt-2 bg-brand-primary text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all">Fermer</button>
                </div>
              ) : (
                <form onSubmit={submitTestimonial} className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Nom complet *</label>
                    <input type="text" value={tName} onChange={(e) => setTName(e.target.value)} placeholder="ex: Aïcha Diallo"
                      className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-brand-primary outline-none text-sm" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Fonction</label>
                      <input type="text" value={tRole} onChange={(e) => setTRole(e.target.value)} placeholder="ex: Data Analyst"
                        className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-brand-primary outline-none text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Promotion</label>
                      <input type="text" value={tPromo} onChange={(e) => setTPromo(e.target.value)} placeholder="ex: Promo 2022"
                        className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-brand-primary outline-none text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Votre témoignage *</label>
                    <textarea value={tText} onChange={(e) => setTText(e.target.value)} rows={4} placeholder="Racontez votre expérience à l'IDLA…"
                      className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-brand-primary outline-none text-sm" required />
                  </div>
                  <button type="submit" className="w-full bg-brand-primary text-white py-3 rounded-lg font-bold text-sm hover:bg-brand-hover transition-all flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" /> Soumettre mon témoignage
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* MODALE — Grille Tarifaire Accounting & Bookkeeping */}
        {showAccountingPricingModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn" onClick={() => setShowAccountingPricingModal(false)}>
            <div className="bg-bg-secondary text-text-primary w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-border-primary p-6 md:p-8 space-y-6" onClick={(e) => e.stopPropagation()}>
              
              <div className="flex items-start justify-between border-b border-border-primary/60 pb-4">
                <div>
                  <div className="text-xs font-extrabold text-brand-primary uppercase tracking-wider">
                    International Distance Learning Academy — Centre de Formation Continue
                  </div>
                  <h3 className="text-2xl font-black text-text-primary mt-1">
                    Professional Accounting & Bookkeeping Programs
                  </h3>
                  <p className="text-xs text-text-secondary mt-1">
                    Qualifications professionnelles nord-américaines (USA / Canada) & britanniques directement accessibles en ligne.
                  </p>
                </div>
                <button onClick={() => setShowAccountingPricingModal(false)} className="p-2 text-text-secondary hover:text-text-primary cursor-pointer rounded-lg hover:bg-bg-primary">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto border border-border-primary rounded-2xl shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-bg-primary text-text-secondary uppercase font-bold border-b border-border-primary">
                    <tr>
                      <th className="p-4">Program / Certification</th>
                      <th className="p-4">Curriculum & Certifying Body</th>
                      <th className="p-4 text-center">Examination Price</th>
                      <th className="p-4 text-right">Academy Student Direct Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-primary/60 text-text-primary font-medium">
                    <tr className="hover:bg-bg-primary/50">
                      <td className="p-4 font-bold text-brand-primary">Intuit Bookkeeping Professional Certificate</td>
                      <td className="p-4">Intuit</td>
                      <td className="p-4 text-center font-bold text-amber-600">$95</td>
                      <td className="p-4 text-right font-mono font-bold">$95 + $308.70 <span className="text-slate-400">($403.70)</span></td>
                    </tr>
                    <tr className="hover:bg-bg-primary/50">
                      <td className="p-4 font-bold text-brand-primary">Introduction to Financial Accounting</td>
                      <td className="p-4">Wharton School (University of Pennsylvania)</td>
                      <td className="p-4 text-center font-bold text-amber-600">$95</td>
                      <td className="p-4 text-right font-mono font-bold">$95 + $308.70 <span className="text-slate-400">($403.70)</span></td>
                    </tr>
                    <tr className="hover:bg-bg-primary/50">
                      <td className="p-4 font-bold text-brand-primary">Financial Accounting Fundamentals</td>
                      <td className="p-4">Darden School of Business (University of Virginia)</td>
                      <td className="p-4 text-center font-bold text-amber-600">$95</td>
                      <td className="p-4 text-right font-mono font-bold">$95 + $308.70 <span className="text-slate-400">($403.70)</span></td>
                    </tr>
                    <tr className="hover:bg-bg-primary/50">
                      <td className="p-4 font-bold text-brand-primary">Principles of Financial Accounting</td>
                      <td className="p-4">IESE Business School</td>
                      <td className="p-4 text-center font-bold text-amber-600">$95</td>
                      <td className="p-4 text-right font-mono font-bold">$95 + $308.70 <span className="text-slate-400">($403.70)</span></td>
                    </tr>
                    <tr className="hover:bg-bg-primary/50">
                      <td className="p-4 font-bold text-brand-primary">Accounting & Bookkeeping Masterclass</td>
                      <td className="p-4">Irfan Sharif (CA & ACCA Lead)</td>
                      <td className="p-4 text-center font-bold text-amber-600">$95</td>
                      <td className="p-4 text-right font-mono font-bold">$95 + $250.00 <span className="text-slate-400">($345.00)</span></td>
                    </tr>
                    <tr className="hover:bg-bg-primary/50">
                      <td className="p-4 font-bold text-brand-primary">Easily Conquer Double-Entry Bookkeeping</td>
                      <td className="p-4">Sonya Ashbarry (Accounting Specialist)</td>
                      <td className="p-4 text-center font-bold text-amber-600">$95</td>
                      <td className="p-4 text-right font-mono font-bold">$95 + $250.00 <span className="text-slate-400">($345.00)</span></td>
                    </tr>
                    <tr className="hover:bg-bg-primary/50">
                      <td className="p-4 font-bold text-brand-primary">Accounting 101: Financial Accounting</td>
                      <td className="p-4">Stefan Ignatovski (CPA, PhD)</td>
                      <td className="p-4 text-center font-bold text-amber-600">$95</td>
                      <td className="p-4 text-right font-mono font-bold">$95 + $250.00 <span className="text-slate-400">($345.00)</span></td>
                    </tr>
                    <tr className="hover:bg-bg-primary/50">
                      <td className="p-4 font-bold text-brand-primary">Introduction to Bookkeeping & Accounting</td>
                      <td className="p-4">The Open University (UK)</td>
                      <td className="p-4 text-center font-bold text-amber-600">$95</td>
                      <td className="p-4 text-right font-mono font-bold">$95 + $308.70 <span className="text-slate-400">($403.70)</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Policy Section (Bilingual) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-bg-primary rounded-2xl border border-border-primary space-y-2">
                  <h4 className="font-extrabold text-xs text-brand-primary uppercase tracking-wider">
                    Key Examination & Enrollment Policy
                  </h4>
                  <ul className="text-xs text-text-secondary space-y-1.5 leading-relaxed">
                    <li>• <strong>Standardized Assessment Fee</strong>: All listed certification exams are offered at a flat rate of $95 per attempt.</li>
                    <li>• <strong>Institutional Credentials</strong>: Official verified certificates and digital transcripts are issued directly by the respective certifying bodies upon passing the examination.</li>
                  </ul>
                </div>

                <div className="p-5 bg-bg-primary rounded-2xl border border-border-primary space-y-2">
                  <h4 className="font-extrabold text-xs text-brand-primary uppercase tracking-wider">
                    Politique d'examen et d'inscription
                  </h4>
                  <ul className="text-xs text-text-secondary space-y-1.5 leading-relaxed">
                    <li>• <strong>Frais d'évaluation standardisés</strong> : Tous les examens de certification répertoriés sont proposés au tarif unique de 95 $ (tentatives incluses).</li>
                    <li>• <strong>Titres académiques officiels</strong> : Les certificats vérifiés et les relevés de notes numériques sont délivrés directement par les organismes de certification respectifs après la réussite à l'examen.</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowAccountingPricingModal(false)}
                  className="bg-brand-primary hover:bg-brand-hover text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Fermer la Grille Tarifaire
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
