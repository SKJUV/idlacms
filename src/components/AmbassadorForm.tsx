import React, { useState } from 'react';
import {
  ArrowLeftIcon, CheckCircle2Icon as CheckCircle2,
  SendIcon as Send, GraduationCapIcon, SunIcon, MoonIcon
} from './Icons';
import { Gift, Copy, Check, Share2, Users, Star, Shield, MessageCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import { persistReferralCode, buildReferralLink } from '../lib/referral';
import { Program } from '../types';

interface AmbassadorFormProps {
  onBack: () => void;
  programs?: Program[];
  theme?: 'light' | 'dark';
  setTheme?: (theme: 'light' | 'dark') => void;
}

/**
 * Génère un code de parrainage unique basé sur le nom de l'ambassadeur.
 * Format : IDLA-PRENOM3-RANDOM5 (ex: IDLA-JEA-X8K2P)
 */
function generateAmbassadorCode(fullName: string): string {
  const nameParts = fullName.trim().toUpperCase().replace(/[^A-Z\s]/g, '').split(/\s+/);
  const prefix = nameParts[0]?.slice(0, 3) || 'AMB';
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 5; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `IDLA-${prefix}-${suffix}`;
}

export default function AmbassadorForm({ onBack, programs = [], theme = 'light', setTheme }: AmbassadorFormProps) {
  const { t, language } = useLanguage();

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [profession, setProfession] = useState('');
  const [targetProgram, setTargetProgram] = useState('');
  const [networkSize, setNetworkSize] = useState('');
  const [socialLinks, setSocialLinks] = useState('');
  const [motivation, setMotivation] = useState('');
  const [declarationChecked, setDeclarationChecked] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const networkOptions = [
    { fr: t('amb_field_network_opt1'), value: 'less_50' },
    { fr: t('amb_field_network_opt2'), value: '50_200' },
    { fr: t('amb_field_network_opt3'), value: '200_500' },
    { fr: t('amb_field_network_opt4'), value: 'more_500' },
  ];

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = t('amb_name_required');
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = t('amb_email_required');
    if (!phone.trim()) errs.phone = t('amb_phone_required');
    if (!declarationChecked) errs.declaration = t('amb_declaration_required');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // 1. Generate unique referral code
      const code = generateAmbassadorCode(fullName);

      // 2. Persist to Appwrite DB + localStorage
      await persistReferralCode({
        code,
        sponsorEmail: email.trim().toLowerCase(),
        sponsorName: fullName.trim(),
        targetProgram: targetProgram || t('amb_field_target_program_all'),
        discountReward: language === 'en' ? 'Application fee waived' : 'Frais de dossier offerts',
        maxUses: undefined,
        currentUses: 0,
        status: 'Active',
      });

      // 3. Build the personalized referral link
      const link = buildReferralLink(code);

      setGeneratedCode(code);
      setGeneratedLink(link);
      setIsSuccess(true);
    } catch (err) {
      console.error('Erreur lors de la création du profil ambassadeur:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleShareWhatsApp = () => {
    const message = language === 'en'
      ? `🎓 Apply to IDLA Academy using my referral link and get your application fee waived!\n\n${generatedLink}\n\nReferral code: ${generatedCode}`
      : `🎓 Inscrivez-vous à IDLA Academy via mon lien de parrainage et bénéficiez des frais de dossier offerts !\n\n${generatedLink}\n\nCode parrain : ${generatedCode}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Field wrapper component
  const FieldWrapper = ({ label, helpText, required, error, children, index }: {
    label: string; helpText?: string; required?: boolean; error?: string;
    children: React.ReactNode; index: number;
  }) => (
    <div className={`space-y-2 bg-bg-primary/50 p-5 rounded-2xl border transition-all ${error ? 'border-rose-500/60 bg-rose-500/5' : 'border-border-primary/60 hover:border-brand-primary/30'}`}>
      <label className="text-xs font-bold text-text-primary flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="text-[10px] font-black text-brand-primary bg-brand-primary/10 w-5 h-5 rounded-full flex items-center justify-center">
            {index}
          </span>
          <span>{label} {required && <span className="text-rose-500">*</span>}</span>
        </span>
        {required && <span className="text-[10px] text-text-secondary uppercase font-semibold">{t('common_required')}</span>}
      </label>
      {helpText && <p className="text-[11px] text-text-secondary italic pl-6">{helpText}</p>}
      <div className="pl-6 pt-1">
        {children}
      </div>
      {error && (
        <p className="text-[11px] font-bold text-rose-600 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1.5 rounded-lg ml-6">
          ⚠️ {error}
        </p>
      )}
    </div>
  );

  const inputClassName = "w-full p-3 rounded-xl border border-border-primary bg-white dark:bg-bg-secondary text-text-primary text-xs font-medium outline-none focus:ring-2 focus:ring-brand-primary transition-all shadow-sm";

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-bg-primary text-text-primary flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-bg-secondary/90 backdrop-blur-md border-b border-border-primary shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-bg-primary hover:bg-brand-primary/10 text-text-secondary hover:text-brand-primary border border-border-primary transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>{t('common_back')}</span>
            </button>
            <div className="h-5 w-[1px] bg-border-primary hidden sm:block" />
            <div className="flex items-center gap-2">
              <GraduationCapIcon className="w-6 h-6 text-brand-primary" />
              <span className="font-extrabold text-base tracking-tight text-text-primary">
                IDLA <span className="text-brand-primary">ACADEMY</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <LanguageSwitcher />
            {setTheme && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-xl bg-bg-primary hover:bg-border-primary/50 text-text-secondary hover:text-text-primary border border-border-primary transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                title={theme === 'dark' ? t('form_theme_light') : t('form_theme_dark')}
              >
                {theme === 'dark' ? (
                  <><SunIcon className="w-4 h-4 text-amber-400" /><span className="hidden sm:inline">{t('form_theme_light_btn')}</span></>
                ) : (
                  <><MoonIcon className="w-4 h-4 text-slate-700" /><span className="hidden sm:inline">{t('form_theme_dark_btn')}</span></>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
          <button onClick={onBack} className="hover:text-brand-primary cursor-pointer">{t('nav_home')}</button>
          <span>/</span>
          <span className="text-brand-primary">{t('amb_page_badge')}</span>
        </div>

        {/* Hero */}
        <div className="bg-gradient-to-br from-emerald-500/15 via-brand-primary/10 to-amber-500/10 border border-brand-primary/30 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-primary bg-brand-primary/15 px-3 py-1 rounded-full border border-brand-primary/30 flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5" /> {t('amb_page_badge')}
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> {language === 'en' ? 'Verified & Official' : 'Vérifié & Officiel'}
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              {t('amb_page_title')}
            </h1>
            <p className="text-sm text-text-secondary mt-2 leading-relaxed max-w-3xl">
              {t('amb_page_desc')}
            </p>
          </div>

          {/* Key benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-white/80 dark:bg-bg-secondary/80 backdrop-blur-sm rounded-2xl border border-border-primary/60 p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center flex-shrink-0">
                <Share2 className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-text-primary">{language === 'en' ? 'Personalized Link' : 'Lien Personnalisé'}</p>
                <p className="text-[10px] text-text-secondary">{language === 'en' ? 'Your unique referral code' : 'Votre code parrain unique'}</p>
              </div>
            </div>
            <div className="bg-white/80 dark:bg-bg-secondary/80 backdrop-blur-sm rounded-2xl border border-border-primary/60 p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Users className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-text-primary">{language === 'en' ? 'Track Referrals' : 'Suivi des Filleuls'}</p>
                <p className="text-[10px] text-text-secondary">{language === 'en' ? 'Real-time enrollment tracking' : 'Suivi temps réel des inscriptions'}</p>
              </div>
            </div>
            <div className="bg-white/80 dark:bg-bg-secondary/80 backdrop-blur-sm rounded-2xl border border-border-primary/60 p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Star className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-text-primary">{language === 'en' ? 'Exclusive Rewards' : 'Avantages Exclusifs'}</p>
                <p className="text-[10px] text-text-secondary">{language === 'en' ? 'Benefits for your referrals' : 'Bénéfices pour vos filleuls'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Success Screen */}
        {isSuccess ? (
          <div className="bg-white dark:bg-bg-secondary border border-border-primary rounded-3xl p-8 sm:p-12 shadow-2xl animate-fade-in space-y-8">
            {/* Success badge */}
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> {t('amb_success_badge')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary">{t('amb_success_title')}</h2>
              <p className="text-sm text-text-secondary max-w-lg mx-auto leading-relaxed">{t('amb_success_desc')}</p>
            </div>

            {/* Code & Link Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
              <div className="bg-gradient-to-br from-brand-primary/10 via-brand-light to-brand-primary/5 border border-brand-primary/30 rounded-2xl p-6 text-center space-y-3">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-primary">{t('amb_your_code')}</p>
                <p className="text-2xl font-mono font-black text-brand-primary tracking-wider select-all">{generatedCode}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30 rounded-2xl p-6 space-y-3">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">{t('amb_advantage_title')}</p>
                <p className="text-xs font-bold text-text-primary">{t('amb_advantage_desc')}</p>
              </div>
            </div>

            {/* Referral Link */}
            <div className="max-w-3xl mx-auto bg-bg-primary border border-border-primary rounded-2xl p-5 space-y-4">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-secondary">{t('amb_your_link')}</p>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-1 w-full bg-white dark:bg-bg-secondary border border-border-primary rounded-xl px-3.5 py-2.5 text-xs font-mono text-brand-primary truncate select-all">
                  {generatedLink}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="w-full sm:w-auto bg-brand-primary hover:bg-brand-hover text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0 shadow-sm"
                >
                  {copiedLink
                    ? <><Check className="w-4 h-4 text-emerald-400" /> {t('amb_link_copied')}</>
                    : <><Copy className="w-4 h-4" /> {t('amb_copy_link')}</>
                  }
                </button>
              </div>
              <p className="text-[11px] text-text-secondary italic">{t('amb_share_instructions')}</p>
            </div>

            {/* Share Actions */}
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <button
                onClick={handleShareWhatsApp}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3.5 rounded-2xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" /> {t('amb_share_whatsapp')}
              </button>
              <button
                onClick={onBack}
                className="bg-bg-primary hover:bg-border-primary/50 text-text-primary border border-border-primary font-extrabold text-xs px-6 py-3.5 rounded-2xl transition-all cursor-pointer"
              >
                {t('form_back_home')}
              </button>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <form onSubmit={handleSubmit} className="bg-white dark:bg-bg-secondary border border-border-primary rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">

            {/* 1. Full Name */}
            <FieldWrapper label={t('amb_field_fullname')} helpText={t('amb_field_fullname_help')} required error={errors.fullName} index={1}>
              <input
                type="text"
                value={fullName}
                placeholder={t('amb_field_fullname_placeholder')}
                onChange={(e) => { setFullName(e.target.value); setErrors(prev => ({ ...prev, fullName: '' })); }}
                className={inputClassName}
              />
            </FieldWrapper>

            {/* 2. Email */}
            <FieldWrapper label={t('amb_field_email')} helpText={t('amb_field_email_help')} required error={errors.email} index={2}>
              <input
                type="email"
                value={email}
                placeholder={t('amb_field_email_placeholder')}
                onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: '' })); }}
                className={inputClassName}
              />
            </FieldWrapper>

            {/* 3. Phone */}
            <FieldWrapper label={t('amb_field_phone')} helpText={t('amb_field_phone_help')} required error={errors.phone} index={3}>
              <input
                type="text"
                value={phone}
                placeholder={t('amb_field_phone_placeholder')}
                onChange={(e) => { setPhone(e.target.value); setErrors(prev => ({ ...prev, phone: '' })); }}
                className={inputClassName}
              />
            </FieldWrapper>

            {/* 4. City & Country */}
            <FieldWrapper label={t('amb_field_city')} index={4}>
              <input
                type="text"
                value={city}
                placeholder={t('amb_field_city_placeholder')}
                onChange={(e) => setCity(e.target.value)}
                className={inputClassName}
              />
            </FieldWrapper>

            {/* 5. Profession */}
            <FieldWrapper label={t('amb_field_profession')} index={5}>
              <input
                type="text"
                value={profession}
                placeholder={t('amb_field_profession_placeholder')}
                onChange={(e) => setProfession(e.target.value)}
                className={inputClassName}
              />
            </FieldWrapper>

            {/* 6. Target Program */}
            <FieldWrapper label={t('amb_field_target_program')} index={6}>
              <select
                value={targetProgram}
                onChange={(e) => setTargetProgram(e.target.value)}
                className="w-full p-3 rounded-xl border border-border-primary bg-white dark:bg-bg-secondary text-text-primary text-xs font-extrabold outline-none focus:ring-2 focus:ring-brand-primary transition-all shadow-sm"
              >
                <option value="">{t('amb_field_target_program_all')}</option>
                {programs.filter(p => p.type !== 'Certification').map(p => (
                  <option key={p.id} value={p.title}>{p.title}</option>
                ))}
              </select>
            </FieldWrapper>

            {/* 7. Network Size */}
            <FieldWrapper label={t('amb_field_network')} index={7}>
              <div className="flex flex-wrap gap-2.5 pt-1">
                {networkOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setNetworkSize(opt.value)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-2 ${
                      networkSize === opt.value
                        ? 'bg-brand-primary text-white border-brand-primary shadow-md'
                        : 'bg-white dark:bg-bg-secondary text-text-primary border-border-primary hover:border-brand-primary/50'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${networkSize === opt.value ? 'border-white bg-white' : 'border-text-secondary'}`}>
                      {networkSize === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />}
                    </div>
                    <span>{opt.fr}</span>
                  </button>
                ))}
              </div>
            </FieldWrapper>

            {/* 8. Social Media */}
            <FieldWrapper label={t('amb_field_social')} index={8}>
              <input
                type="text"
                value={socialLinks}
                placeholder={t('amb_field_social_placeholder')}
                onChange={(e) => setSocialLinks(e.target.value)}
                className={inputClassName}
              />
            </FieldWrapper>

            {/* 9. Motivation */}
            <FieldWrapper label={t('amb_field_motivation')} index={9}>
              <textarea
                rows={3}
                value={motivation}
                placeholder={t('amb_field_motivation_placeholder')}
                onChange={(e) => setMotivation(e.target.value)}
                className={inputClassName}
              />
            </FieldWrapper>

            {/* 10. Declaration */}
            <FieldWrapper label={t('amb_field_declaration')} required error={errors.declaration} index={10}>
              <button
                type="button"
                onClick={() => { setDeclarationChecked(!declarationChecked); setErrors(prev => ({ ...prev, declaration: '' })); }}
                className={`w-full px-4 py-3.5 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-start gap-3 text-left ${
                  declarationChecked
                    ? 'bg-brand-primary text-white border-brand-primary shadow-md'
                    : 'bg-white dark:bg-bg-secondary text-text-primary border-border-primary hover:border-brand-primary/50'
                }`}
              >
                <div className={`w-4.5 h-4.5 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0 ${declarationChecked ? 'border-white bg-white' : 'border-text-secondary'}`}>
                  {declarationChecked && <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary" />}
                </div>
                <span className="leading-relaxed">{t('amb_field_declaration_text')}</span>
              </button>
            </FieldWrapper>

            {/* Submit */}
            <div className="pt-6 border-t border-border-primary flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-3 rounded-2xl text-xs font-bold text-text-secondary hover:bg-bg-primary border border-border-primary cursor-pointer"
              >
                {t('common_cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-brand-primary disabled:opacity-50 hover:bg-brand-hover text-white text-xs font-extrabold px-8 py-4 rounded-2xl transition-all flex items-center gap-2.5 cursor-pointer shadow-xl"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('amb_submitting')}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {t('amb_submit_btn')}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border-primary py-6 bg-white dark:bg-bg-secondary mt-12 text-center text-xs text-text-secondary">
        <p>{t('footer_rights')}</p>
      </footer>
    </div>
  );
}
