import React, { useState, useRef, useEffect } from 'react';
import { Program } from '../types';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  UploadCloudIcon,
  CheckCircle2Icon,
  FileTextIcon,
  AlertCircleIcon,
} from './Icons';
import { Mail, ShieldCheck, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { databases, storage, APPWRITE_CONFIG, isAppwriteDbConfigured, isAppwriteStorageConfigured, ID } from '../lib/appwrite';

interface ApplicationFormProps {
  onSuccess: (candidateName: string, selectedProgram: string, email: string) => void;
  onBackToHome: () => void;
  programs: Program[];
}

export default function ApplicationForm({ onSuccess, onBackToHome, programs }: ApplicationFormProps) {
  const [step, setStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nationality, setNationality] = useState('');

  const [selectedProgram, setSelectedProgram] = useState('');
  const [highestDegree, setHighestDegree] = useState('');
  const [graduationYear, setGraduationYear] = useState('');

  const [files, setFiles] = useState<{ name: string; size: string; type: string; fileId: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const selectedProgObj = programs.find((p) => p.title === selectedProgram);
  const isCertification = selectedProgObj?.type === 'Certification';

  // Initialize selected program when programs are loaded
  useEffect(() => {
    if (programs.length > 0 && !selectedProgram) {
      setSelectedProgram(programs[0].title);
    }
  }, [programs, selectedProgram]);

  // Handle Drag & Drop Events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const simulateUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    let appwriteFileId = '';
    if (isAppwriteStorageConfigured()) {
      try {
        const response = await storage.createFile(
          APPWRITE_CONFIG.buckets.documents,
          ID.unique(),
          file
        );
        appwriteFileId = response.$id;
        console.log("Fichier téléversé dans le bucket Appwrite:", response);
      } catch (err) {
        console.error("Échec du téléversement sur Appwrite. Poursuite avec l'upload simulé.", err);
      }
    }

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
          setFiles((current) => [...current, { 
            name: file.name, 
            size: `${sizeInMb} MB`, 
            type: file.type,
            fileId: appwriteFileId
          }]);
          return 100;
        }
        return prev + 20;
      });
    }, 150);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      simulateUpload(droppedFiles[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      simulateUpload(selectedFiles[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

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
          selectedProgram,
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
      if (!firstName || !lastName || !email || !phone) {
        setErrorMessage('Veuillez remplir tous les champs requis.');
        return;
      }
    }
    if (step === 2) {
      if (!selectedProgram || (!isCertification && !highestDegree)) {
        setErrorMessage(
          !selectedProgram
            ? 'Veuillez sélectionner votre programme cible.'
            : 'Veuillez renseigner votre dernier diplôme obtenu.'
        );
        return;
      }
    }
    if (step === 3) {
      if (files.length === 0 && !isCertification) {
        setErrorMessage('Veuillez charger au moins un document justificatif (CV ou Diplôme).');
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
      setErrorMessage('Vous devez vérifier votre identité par code OTP avant de soumettre votre candidature.');
      return;
    }
    
    setIsSubmitting(true);
    const candidateName = `${firstName} ${lastName}`;
    const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();

    if (isAppwriteDbConfigured()) {
      try {
        const application = await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.applications,
          ID.unique(),
          {
            firstName,
            lastName,
            name: candidateName,
            email,
            phone,
            program: selectedProgram,
            nationality,
            highestDegree: isCertification ? undefined : highestDegree,
            graduationYear: isCertification ? undefined : (Number(graduationYear) || undefined),
            status: 'New',
            dateApplied: new Date().toISOString(),
            declarationChecked,
            files: JSON.stringify(files),
            initials,
          }
        );
        console.log("Candidature enregistrée sur Appwrite Database avec succès !");

        if (APPWRITE_CONFIG.collections.candidateDocuments && files.length > 0) {
          for (const file of files) {
            try {
              await databases.createDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.candidateDocuments,
                ID.unique(),
                {
                  applicationId: application.$id,
                  fileId: file.fileId,
                  name: file.name,
                  mimeType: file.type,
                  uploadedBy: 'candidate',
                  uploadedAt: new Date().toISOString(),
                }
              );
            } catch (err) {
              console.error("Échec de l'enregistrement d'un document de candidature:", err);
            }
          }
        }
      } catch (err: any) {
        console.error("Échec de l'enregistrement de la candidature sur Appwrite Database:", err);
      }
    }

    setIsSubmitting(false);
    onSuccess(candidateName, selectedProgram, email);
  };

  const stepsList = [
    'Données Personnelles',
    'Parcours Académique',
    'Dossier de Pièces',
    'Signature & Envoi'
  ];

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
              <h1 className="font-sans font-bold text-xl leading-none text-text-primary">Admissions IDLA</h1>
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
              Étape {step} sur 4 : {stepsList[step - 1]}
            </span>
            <span className="text-xs text-text-secondary font-semibold">
              {Math.round(((step - 1) / 3) * 100)}% Complété
            </span>
          </div>
          
          {/* Progress bar line */}
          <div className="w-full h-1.5 bg-border-primary rounded-full overflow-hidden">
            <div 
              className="bg-brand-primary h-full transition-all duration-300"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            ></div>
          </div>

          {/* Staggered Step badges */}
          <div className="hidden sm:grid grid-cols-4 gap-2 mt-4 text-center">
            {stepsList.map((st, i) => (
              <div 
                key={st}
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  step > i + 1 
                    ? 'text-brand-primary' 
                    : step === i + 1 
                    ? 'text-text-primary' 
                    : 'text-text-secondary opacity-50'
                }`}
              >
                {st}
              </div>
            ))}
          </div>
        </div>

        {/* Error message wrapper */}
        {errorMessage && (
          <div className="mx-6 mt-6 p-4 bg-red-500/10 border-l-4 border-red-500 rounded text-red-700 dark:text-red-400 text-xs font-medium flex items-center gap-2">
            <AlertCircleIcon className="w-4 h-4 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Stepper active component content */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          
          {/* STEP 1 */}
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
                  <label className="text-xs font-bold text-text-secondary uppercase">Nationalité *</label>
                  <input 
                    type="text" 
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    placeholder="Votre nationalité"
                    className="w-full p-2.5 rounded-lg bg-bg-primary border border-border-primary focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium text-text-primary" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-sans font-bold text-lg text-text-primary pb-2 border-b border-border-primary/40">
                Choix du Programme d'Études
              </h3>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary uppercase">Programme académique ciblé *</label>
                <select 
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-bg-primary border border-border-primary focus:ring-2 focus:ring-brand-primary outline-none text-sm font-semibold text-text-primary"
                >
                  {programs.length > 0 ? (
                    programs.map((p) => (
                      <option key={p.id} value={p.title}>{p.title} ({p.type})</option>
                    ))
                  ) : (
                    <option value="">Chargement des programmes...</option>
                  )}
                </select>
                <p className="text-[11px] text-text-secondary">Sélectionnez la filière d'élite correspondant à vos aspirations professionnelles.</p>
              </div>

              {isCertification ? (
                <div className="bg-brand-primary/10 border-l-4 border-brand-primary p-4 rounded text-xs text-text-primary leading-relaxed">
                  Pour ce programme de certification, vous n'avez pas besoin de fournir votre dernier diplôme obtenu, l'année d'obtention, ni de pièces justificatives.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary uppercase">Dernier diplôme obtenu *</label>
                    <input 
                      type="text" 
                      value={highestDegree}
                      onChange={(e) => setHighestDegree(e.target.value)}
                      placeholder="ex: Licence en Management"
                      className="w-full p-2.5 rounded-lg bg-bg-primary border border-border-primary focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium text-text-primary" 
                      required 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary uppercase">Année d'obtention *</label>
                    <input 
                      type="number" 
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      placeholder="2024"
                      className="w-full p-2.5 rounded-lg bg-bg-primary border border-border-primary focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium text-text-primary" 
                      required 
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-sans font-bold text-lg text-text-primary pb-2 border-b border-border-primary/40">
                Téléchargement du dossier de pièces
              </h3>
              
              {isCertification && (
                <div className="bg-brand-primary/10 border-l-4 border-brand-primary p-4 rounded text-xs text-text-primary leading-relaxed">
                  Le dépôt de pièces justificatives est facultatif pour ce programme de certification. Vous pouvez passer à l'étape suivante si vous le souhaitez.
                </div>
              )}
              
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-brand-primary bg-brand-light' 
                    : 'border-border-primary hover:border-brand-primary hover:bg-bg-primary'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  className="hidden" 
                  accept=".pdf,.doc,.docx"
                />
                
                <UploadCloudIcon className="w-12 h-12 text-brand-primary mx-auto mb-3 opacity-80" size={48} />
                
                <p className="text-sm font-semibold text-text-primary">
                  Glissez-déposez vos fichiers ici, ou cliquez pour parcourir
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  Format requis : PDF, Word (Taille max : 5 MB) • CV & Lettre de motivation recommandés.
                </p>
              </div>

              {/* Uploading progress feedback */}
              {isUploading && (
                <div className="bg-bg-primary p-4 rounded-lg border border-border-primary space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-brand-primary">Chargement du document en cours...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1 bg-border-primary rounded-full overflow-hidden">
                    <div 
                      className="bg-brand-primary h-full transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Attached files lists */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Fichiers joints ({files.length})</h4>
                  <div className="space-y-2">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-bg-primary rounded-lg border border-border-primary/40">
                        <div className="flex items-center gap-2">
                          <FileTextIcon className="w-4 h-4 text-brand-primary" />
                          <div>
                            <p className="text-xs font-semibold text-text-primary line-clamp-1">{f.name}</p>
                            <p className="text-[10px] text-text-secondary">{f.size}</p>
                          </div>
                        </div>
                        <CheckCircle2Icon className="w-4 h-4 text-brand-primary" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-5">
              <h3 className="font-sans font-bold text-lg text-text-primary pb-2 border-b border-border-primary/40">
                Déclaration d'exactitude & Signature
              </h3>

              <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                Je certifie sur l'honneur que l'ensemble des informations fournies dans le cadre de ce dossier de candidature IDLA sont exactes et sincères. Toute fausse déclaration entraînera l'annulation immédiate de ma candidature.
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
                  J'accepte d'enregistrer mes coordonnées et d'envoyer électroniquement mon dossier d'admissions pour examen auprès du comité académique de l'IDLA.
                </label>
              </div>

              {/* OTP Verification Block */}
              <div className="p-4 border border-border-primary rounded-xl space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-primary" />
                  <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Vérification d'identité par Code OTP *</label>
                </div>
                <p className="text-[11px] text-text-secondary">
                  Un code à 6 chiffres sera envoyé à <span className="font-bold text-text-primary">{email || 'votre adresse email'}</span>. Saisissez-le ci-dessous pour valider votre candidature.
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
                      <p className="text-[10px] text-emerald-600">Votre code OTP a été validé. Vous pouvez maintenant soumettre votre candidature.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stepper Controllers */}
          <div className="flex justify-between items-center pt-6 border-t border-border-primary/30">
            {step > 1 ? (
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

            {step < 4 ? (
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
                {isSubmitting ? 'Envoi en cours...' : 'Soumettre ma Candidature'}
                <CheckCircle2Icon className="w-4 h-4" />
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}
