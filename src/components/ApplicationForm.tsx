import React, { useState, useEffect } from 'react';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
} from './Icons';
import { Mail, ShieldCheck, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { databases, APPWRITE_CONFIG, isAppwriteDbConfigured, ID, account } from '../lib/appwrite';

interface ApplicationFormProps {
  onSuccess: (candidateName: string, email: string, tempPass?: string) => void;
  onBackToHome: () => void;
}

export default function ApplicationForm({ onSuccess, onBackToHome }: ApplicationFormProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Flag: l'utilisateur est déjà connecté (session active)
  const [isExistingUser, setIsExistingUser] = useState(false);

  // Form State — Informations personnelles
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nationality, setNationality] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [countryOfResidence, setCountryOfResidence] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Pre-fill student info if logged in and skip OTP + step 1
  useEffect(() => {
    const loadLoggedInUser = async () => {
      try {
        const user = await account.get();
        if (user) {
          setEmail(user.email);
          setOtpVerified(true); // User is already authenticated
          setIsExistingUser(true);

          if (user.name) {
            const parts = user.name.trim().split(/\s+/);
            if (parts.length > 1) {
              setFirstName(parts[0]);
              setLastName(parts.slice(1).join(' '));
            } else {
              setFirstName(user.name);
            }
          }

          // Sauter directement à l'étape 2 (Déclaration & OTP)
          setStep(2);
        }
      } catch (err) {
        // No active session — formulaire normal
      }
    };
    loadLoggedInUser();
  }, []);

  // Generate & send a 6-digit OTP via Resend Serverless API
  const handleSendOtp = async () => {
    setOtpError('');
    if (!declarationChecked) {
      setErrorMessage('Vous devez accepter la déclaration sur l\'honneur avant de recevoir le code.');
      return;
    }
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpCode(generated);
    setOtpSent(true);
    setOtpVerified(false);
    setOtpInput('');

    const fullName = `${firstName} ${lastName}`.trim() || 'Candidat(e)';

    setIsSendingOtp(true);
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          fullName,
          otpCode: generated,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setOtpError(errorData.error || "Impossible d'envoyer le code de vérification.");
      }
    } catch (err) {
      console.error("Échec de l'envoi de l'OTP :", err);
      setOtpError("Erreur réseau. Impossible de contacter le serveur d'envoi d'e-mail.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = () => {
    setOtpError('');
    if (otpInput.trim() === otpCode) {
      setOtpVerified(true);
    } else {
      setOtpError('Code incorrect. Veuillez vérifier le code reçu et réessayer.');
    }
  };

  const handleNextStep = () => {
    setErrorMessage('');
    if (step === 1) {
      if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
        setErrorMessage('Veuillez remplir tous les champs requis.');
        return;
      }
      if (password.length < 8) {
        setErrorMessage('Le mot de passe doit contenir au moins 8 caractères.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Les mots de passe saisis ne correspondent pas.');
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const handlePrevStep = () => {
    setErrorMessage('');
    setStep((s) => s - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declarationChecked) {
      setErrorMessage('Vous devez accepter les conditions de déclaration sur l\'honneur pour soumettre.');
      return;
    }
    if (!otpVerified) {
      setErrorMessage('Vous devez vérifier votre identité par code OTP avant de finaliser votre inscription.');
      return;
    }
    
    setIsSubmitting(true);
    const candidateName = `${firstName} ${lastName}`;
    const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();

    // Use candidate's chosen password
    const cleanEmail = email.trim().toLowerCase();

    if (isAppwriteDbConfigured()) {
      try {
        if (!isExistingUser) {
          // 1. Create Appwrite Auth Account with user-defined password
          try {
            await account.create(
              ID.unique(),
              cleanEmail,
              password,
              candidateName
            );
            console.log("Compte utilisateur créé avec succès dans l'authentification Appwrite !");

            // 2. Send welcome credentials email
            try {
              await fetch('/api/send-credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: cleanEmail,
                  fullName: candidateName,
                  tempPassword: password,
                  userDefinedPassword: true,
                }),
              });
            } catch (mailErr) {
              console.warn("Échec de l'envoi de l'email avec les identifiants:", mailErr);
            }
          } catch (authErr: any) {
            // If user already exists (e.g. they submit another application), ignore the account creation error
            console.warn("Le compte utilisateur existe peut-être déjà ou échec de la création:", authErr);
          }
        }

        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.applications,
          ID.unique(),
          {
            firstName,
            lastName,
            name: candidateName,
            email: cleanEmail,
            phone,
            nationality,
            dateOfBirth: dateOfBirth || undefined,
            gender: gender || undefined,
            countryOfResidence: countryOfResidence || undefined,
            educationLevel: educationLevel || undefined,
            status: 'New',
            dateApplied: new Date().toISOString(),
            declarationChecked,
            initials,
          }
        );
        console.log("Inscription enregistrée sur Appwrite Database avec succès !");
      } catch (err: any) {
        console.error("Échec de l'enregistrement de l'inscription sur Appwrite Database:", err);
      }
    }

    setIsSubmitting(false);
    onSuccess(candidateName, cleanEmail, isExistingUser ? undefined : password);
  };

  // Pour les utilisateurs déjà connectés : 1 étape (2), sinon 2 étapes
  const stepsList = isExistingUser
    ? ['Déclaration & Vérification']
    : ['Informations Personnelles', 'Déclaration & Vérification'];

  // Index visuel de l'étape (0-based) pour la progression
  const visualStep = isExistingUser ? 1 : step;
  const totalSteps = isExistingUser ? 1 : 2;

  return (
    <div className="bg-bg-primary min-h-screen py-12 px-6 md:px-12 text-text-primary">
      <div className="max-w-3xl mx-auto bg-bg-secondary rounded-2xl border border-border-primary shadow-sm overflow-hidden">
        {/* Banner with logo & back option */}
        <div className="bg-bg-primary text-text-primary p-6 md:p-8 flex items-center justify-between border-b border-border-primary">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center shadow">
              <img src="/logo.png" alt="IDLA Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-sans font-bold text-xl leading-none text-text-primary">Inscription IDLA</h1>
              <p className="text-text-secondary text-xs mt-1">International Distance Learning Academy</p>
            </div>
          </div>
          <button 
            onClick={onBackToHome}
            className="text-xs text-text-secondary hover:text-brand-primary flex items-center gap-1.5 transition-colors border border-border-primary px-3 py-1.5 rounded"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            Retour au site
          </button>
        </div>

        {/* Dynamic Stepper Indicator */}
        <div className="bg-bg-primary border-b border-border-primary/40 p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">
              Étape {visualStep} sur {totalSteps} : {stepsList[visualStep - 1]}
            </span>
            <span className="text-xs text-text-secondary font-semibold">
              {totalSteps === 1 ? '100' : Math.round(((visualStep - 1) / (totalSteps - 1)) * 100)}% Complété
            </span>
          </div>
          
          {/* Progress bar line */}
          <div className="w-full h-1.5 bg-border-primary rounded-full overflow-hidden">
            <div 
              className="bg-brand-primary h-full transition-all duration-300"
              style={{ width: totalSteps === 1 ? '100%' : `${((visualStep - 1) / (totalSteps - 1)) * 100}%` }}
            ></div>
          </div>

          {/* Staggered Step badges */}
          {totalSteps > 1 && (
            <div className="hidden sm:grid grid-cols-2 gap-2 mt-4 text-center">
              {stepsList.map((st, i) => (
                <div 
                  key={st}
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    visualStep > i + 1 
                      ? 'text-brand-primary' 
                      : visualStep === i + 1 
                      ? 'text-text-primary' 
                      : 'text-text-secondary opacity-50'
                  }`}
                >
                  {st}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bandeau identité pré-remplie pour utilisateur existant */}
        {isExistingUser && (
          <div className="mx-6 mt-6 p-4 bg-brand-primary/10 border-l-4 border-brand-primary rounded flex items-center gap-3">
            <CheckCircle2Icon className="w-4 h-4 text-brand-primary shrink-0" />
            <div>
              <p className="text-xs font-bold text-text-primary">Identité vérifiée — {firstName} {lastName}</p>
              <p className="text-[11px] text-text-secondary mt-0.5">Vos informations personnelles sont déjà enregistrées. Finalisez votre inscription ci-dessous.</p>
            </div>
          </div>
        )}

        {/* Error message wrapper */}
        {errorMessage && (
          <div className="mx-6 mt-6 p-4 bg-red-500/10 border-l-4 border-red-500 rounded text-red-700 dark:text-red-400 text-xs font-medium flex items-center gap-2">
            <AlertCircleIcon className="w-4 h-4 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Stepper active component content */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          
          {/* STEP 1 — Informations personnelles */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-sans font-bold text-lg text-text-primary pb-2 border-b border-border-primary/40">
                Informations d'identité du candidat
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">Prénom *</label>
                  <input 
                    type="text" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Votre prénom"
                    className="w-full p-2.5 rounded-lg bg-bg-primary border border-border-primary focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium text-text-primary" 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">Nom *</label>
                  <input 
                    type="text" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Votre nom de famille"
                    className="w-full p-2.5 rounded-lg bg-bg-primary border border-border-primary focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium text-text-primary" 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary uppercase">Adresse Email *</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="prenom.nom@exemple.com"
                  className="w-full p-2.5 rounded-lg bg-bg-primary border border-border-primary focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium text-text-primary" 
                  required 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">Téléphone Portable *</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+237 6 00 00 00 00"
                    className="w-full p-2.5 rounded-lg bg-bg-primary border border-border-primary focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium text-text-primary" 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">Date de naissance</label>
                  <input 
                    type="date" 
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-bg-primary border border-border-primary focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium text-text-primary" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">Genre</label>
                  <select 
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-bg-primary border border-border-primary focus:ring-2 focus:ring-brand-primary outline-none text-sm font-semibold text-text-primary"
                  >
                    <option value="">— Sélectionner —</option>
                    <option value="Homme">Homme</option>
                    <option value="Femme">Femme</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">Nationalité</label>
                  <input 
                    type="text" 
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    placeholder="Votre nationalité"
                    className="w-full p-2.5 rounded-lg bg-bg-primary border border-border-primary focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium text-text-primary" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">Pays de résidence</label>
                  <input 
                    type="text" 
                    value={countryOfResidence}
                    onChange={(e) => setCountryOfResidence(e.target.value)}
                    placeholder="ex: Cameroun"
                    className="w-full p-2.5 rounded-lg bg-bg-primary border border-border-primary focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium text-text-primary" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">Niveau d'études actuel</label>
                  <select 
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-bg-primary border border-border-primary focus:ring-2 focus:ring-brand-primary outline-none text-sm font-semibold text-text-primary"
                  >
                    <option value="">— Sélectionner —</option>
                    <option value="Baccalauréat">Baccalauréat</option>
                    <option value="BTS / DUT">BTS / DUT</option>
                    <option value="Licence">Licence (Bac+3)</option>
                    <option value="Master">Master (Bac+5)</option>
                    <option value="Doctorat">Doctorat</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-border-primary/40 space-y-4">
                <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider">
                  🔐 Définissez votre mot de passe de connexion
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary uppercase">Mot de passe *</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 caractères"
                      className="w-full p-2.5 rounded-lg bg-bg-primary border border-border-primary focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium text-text-primary" 
                      required 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary uppercase">Confirmer le mot de passe *</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Répétez le mot de passe"
                      className="w-full p-2.5 rounded-lg bg-bg-primary border border-border-primary focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium text-text-primary" 
                      required 
                    />
                  </div>
                </div>
              </div>

              {/* Info box */}
              <div className="bg-brand-primary/10 border-l-4 border-brand-primary p-4 rounded text-xs text-text-primary leading-relaxed">
                📋 Après votre inscription, vous pourrez explorer nos programmes et postuler directement depuis votre espace candidat.
              </div>
            </div>
          )}

          {/* STEP 2 — Déclaration & OTP */}
          {step === 2 && (
            <div className="space-y-5">
              <h3 className="font-sans font-bold text-lg text-text-primary pb-2 border-b border-border-primary/40">
                Déclaration d'exactitude & Vérification
              </h3>

              <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                Je certifie sur l'honneur que l'ensemble des informations fournies dans le cadre de cette inscription IDLA sont exactes et sincères. Toute fausse déclaration entraînera l'annulation immédiate de mon inscription.
              </div>

              <div className="flex items-start gap-3 bg-bg-primary p-4 rounded-xl border border-border-primary/40">
                <input 
                  type="checkbox" 
                  id="declaration-checkbox"
                  checked={declarationChecked}
                  onChange={(e) => setDeclarationChecked(e.target.checked)}
                  className="w-4 h-4 text-brand-primary border-border-primary rounded focus:ring-brand-primary mt-0.5" 
                />
                <label htmlFor="declaration-checkbox" className="text-xs text-text-secondary leading-relaxed cursor-pointer font-medium select-none">
                  J'accepte d'enregistrer mes coordonnées et de créer mon compte étudiant IDLA pour accéder aux programmes et services de l'académie.
                </label>
              </div>

              {/* OTP Verification Block */}
              <div className="p-4 border border-border-primary rounded-xl space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-primary" />
                  <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Vérification d'identité par Code OTP *</label>
                </div>
                <p className="text-[11px] text-text-secondary">
                  Un code à 6 chiffres sera envoyé à <span className="font-bold text-text-primary">{email || 'votre adresse email'}</span>. Saisissez-le ci-dessous pour valider votre inscription.
                </p>

                {!otpVerified ? (
                  <div className="space-y-3">
                    {!otpSent ? (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp}
                        className={`w-full flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-all ${
                          isSendingOtp ? 'opacity-60 cursor-not-allowed' : ''
                        }`}
                      >
                        <Mail className="w-4 h-4" />
                        {isSendingOtp ? 'Envoi en cours...' : 'Envoyer le code OTP par email'}
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          <span>Code envoyé à <strong>{email}</strong>. Vérifiez votre boîte mail.</span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={otpInput}
                            onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="_ _ _ _ _ _"
                            maxLength={6}
                            className="flex-1 text-center text-lg font-bold tracking-[0.5em] p-2.5 rounded-lg border border-border-primary focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyOtp}
                            className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all flex items-center gap-1.5"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            Vérifier
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={isSendingOtp}
                          className={`text-[10px] text-brand-primary hover:underline flex items-center gap-1 ${
                            isSendingOtp ? 'opacity-60 cursor-not-allowed' : ''
                          }`}
                        >
                          <RefreshCw className={`w-3 h-3 ${isSendingOtp ? 'animate-spin' : ''}`} />
                          {isSendingOtp ? 'Envoi du nouveau code...' : 'Renvoyer un nouveau code'}
                        </button>
                        {otpError && (
                          <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {otpError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg px-4 py-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold">Identité vérifiée avec succès !</p>
                      <p className="text-[10px] text-emerald-600">Votre code OTP a été validé. Vous pouvez maintenant finaliser votre inscription.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stepper Controllers */}
          <div className="flex justify-between items-center pt-6 border-t border-border-primary/30">
            {step > 1 && !isExistingUser ? (
              <button 
                type="button"
                onClick={handlePrevStep}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-border-primary hover:bg-bg-primary text-xs font-bold transition-all text-text-primary"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Précédent
              </button>
            ) : (
              <div></div>
            )}

            {step < 2 ? (
              <button 
                type="button"
                onClick={handleNextStep}
                className="bg-brand-primary hover:bg-brand-hover text-white flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-xs font-bold transition-all ml-auto"
              >
                Suivant
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            ) : (
              <button 
                type="submit"
                disabled={isSubmitting}
                className="bg-brand-primary hover:bg-brand-hover text-white flex items-center gap-1.5 px-8 py-3 rounded-lg text-xs font-bold transition-all ml-auto shadow-md disabled:opacity-55 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Inscription en cours...' : 'Finaliser mon inscription'}
                <CheckCircle2Icon className="w-4 h-4" />
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}
