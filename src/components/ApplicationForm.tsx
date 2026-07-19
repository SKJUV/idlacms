import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  UploadCloudIcon,
  CheckCircle2Icon,
  FileTextIcon,
  AlertCircleIcon,
} from './Icons';
import { Mail, ShieldCheck, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { databases, storage, APPWRITE_CONFIG, isAppwriteDbConfigured, isAppwriteStorageConfigured, ID, account } from '../lib/appwrite';

interface ApplicationFormProps {
  onSuccess: (candidateName: string, email: string, tempPass?: string) => void;
  onBackToHome: () => void;
  programs: any[];
  initialProgram?: string;
}

export default function ApplicationForm({ onSuccess, onBackToHome, programs, initialProgram }: ApplicationFormProps) {
  const [step, setStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Flag: l'utilisateur est déjà connecté (session active)
  const [isExistingUser, setIsExistingUser] = useState(false);

  // Form State — Etape 1
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nationality, setNationality] = useState('');

  // Form State — Etape 2
  const [selectedProgram, setSelectedProgram] = useState(initialProgram || '');
  const [highestDegree, setHighestDegree] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Form State — Etape 3
  const [files, setFiles] = useState<{ name: string; size: string; type: string; fileId: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [activeUploadType, setActiveUploadType] = useState<'cni' | 'diplome' | null>(null);

  // Form State — Etape 4
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

          // Sauter directement à l'étape 2 (choix du programme)
          setStep(2);
        }
      } catch (err) {
        // No active session — formulaire normal
      }
    };
    loadLoggedInUser();
  }, []);

  // Handle Drag & Drop Events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const simulateUpload = async (file: File, docType: 'cni' | 'diplome') => {
    setIsUploading(true);
    setUploadProgress(0);

    const prefixedName = docType === 'cni' ? `[CNI] ${file.name}` : `[Diplôme] ${file.name}`;

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
        console.error("Échec du téléversement sur Appwrite.", err);
      }
    }

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
          setFiles((current) => {
            const filtered = current.filter(f => {
              if (docType === 'cni') return !f.name.startsWith('[CNI]');
              return !f.name.startsWith('[Diplôme]');
            });
            return [
              ...filtered,
              { 
                name: prefixedName, 
                size: `${sizeInMb} MB`, 
                type: file.type,
                fileId: appwriteFileId || ID.unique(),
              }
            ];
          });
          return 100;
        }
        return prev + 25;
      });
    }, 100);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0 && activeUploadType) {
      simulateUpload(selectedFiles[0], activeUploadType);
    }
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

      if (response.ok) {
        console.log("Email OTP envoyé avec succès.");
      } else {
        const errData = await response.json();
        console.warn("Erreur envoi OTP:", errData);
      }
    } catch (err) {
      console.warn("Erreur fetch envoi OTP:", err);
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
      if (!isExistingUser) {
        if (!password || !confirmPassword) {
          setErrorMessage('Veuillez définir et confirmer votre mot de passe.');
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
    }
    if (step === 3) {
      // Les fichiers justificatifs sont optionnels lors de l'inscription
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

            // 2. Log in temporarily to set pref, then log out
            await account.createEmailPasswordSession({ email: cleanEmail, password: password });
            await account.updatePrefs({ mustChangePassword: false });
            await account.deleteSession({ sessionId: 'current' });

            // 3. Send welcome credentials email
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
            console.warn("Le compte utilisateur existe peut-être déjà ou échec de la création:", authErr);
          }
        }

        const application = await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.applications,
          ID.unique(),
          {
            firstName,
            lastName,
            name: candidateName,
            email: cleanEmail,
            phone,
            program: selectedProgram,
            nationality,
            highestDegree: isCertification ? undefined : highestDegree,
            graduationYear: isCertification ? undefined : (Number(graduationYear) || undefined),
            status: 'New',
            dateApplied: new Date().toISOString(),
            declarationChecked,
            initials,
          }
        );
        console.log("Dossier de candidature inséré dans Appwrite:", application);

        // ── Enregistrement des documents joints dans Appwrite candidateDocuments ──
        if (APPWRITE_CONFIG.collections.candidateDocuments) {
          for (const fileObj of files) {
            try {
              await databases.createDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.candidateDocuments,
                ID.unique(),
                {
                  applicationId: application.$id || application.id,
                  fileId: fileObj.fileId,
                  name: fileObj.name,
                  sizeBytes: 0, 
                  mimeType: fileObj.type,
                  uploadedBy: 'candidate',
                  uploadedAt: new Date().toISOString(),
                }
              );
            } catch (docErr) {
              console.error("Échec liaison document Appwrite:", docErr);
            }
          }
        }

        // Sauvegarder localement pour visibilité instantanée
        try {
          const localRecord = {
            id: application.$id || application.id,
            $id: application.$id || application.id,
            firstName,
            lastName,
            name: candidateName,
            email: cleanEmail,
            phone,
            program: selectedProgram,
            nationality,
            highestDegree: isCertification ? undefined : highestDegree,
            graduationYear: isCertification ? undefined : Number(graduationYear),
            status: 'New',
            dateApplied: new Date().toISOString(),
            declarationChecked,
            initials,
          };
          const existingLocal = JSON.parse(localStorage.getItem('idla_local_applications') || '[]');
          const filtered = existingLocal.filter((a: any) => a.email !== cleanEmail || a.program);
          localStorage.setItem('idla_local_applications', JSON.stringify([localRecord, ...filtered]));
        } catch (e) {
          console.warn("Erreur sauvegarde locale:", e);
        }

      } catch (err) {
        console.error("Erreur générale lors de la soumission de la candidature:", err);
      }
    }

    setIsSubmitting(false);
    onSuccess(candidateName, cleanEmail, isExistingUser ? undefined : password);
  };

  const stepsList = isExistingUser
    ? ['Choix du Programme', 'Dépôt des Pièces', 'Déclaration & OTP']
    : ['Informations Personnelles', 'Choix du Programme', 'Dépôt des Pièces', 'Déclaration & OTP'];

  const totalSteps = isExistingUser ? 3 : 4;
  const visualStep = isExistingUser ? step - 1 : step;

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center p-4 transition-all duration-200">
      <div className="w-full max-w-2xl bg-bg-secondary rounded-2xl border border-border-primary shadow-xl overflow-hidden">
        
        {/* Header Form */}
        <div className="bg-brand-primary p-6 md:p-8 text-white relative">
          <button 
            onClick={onBackToHome}
            className="absolute left-6 top-1/2 -translate-y-1/2 text-white hover:text-white/80 flex items-center gap-1 text-xs font-semibold"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Retour
          </button>
          <div className="text-center">
            <h2 className="font-sans font-extrabold text-xl tracking-wide uppercase"> Admissions IDLA </h2>
            <p className="text-xs text-white/80 mt-1">International Distance Learning Academy</p>
          </div>
        </div>

        {/* Stepper Status Bar */}
        <div className="px-6 pt-6 border-b border-border-primary/30 pb-4">
          <div className="flex justify-between items-center text-[10px] text-text-secondary font-bold uppercase mb-2">
            <span>Étape {visualStep} sur {totalSteps}</span>
            <span>{Math.round((visualStep / totalSteps) * 100)}% Complété</span>
          </div>
          <div className="w-full bg-border-primary h-1.5 rounded-full overflow-hidden mb-4">
            <div 
              className="bg-brand-primary h-full transition-all duration-300"
              style={{ width: `${(visualStep / totalSteps) * 100}%` }}
            ></div>
          </div>

          {/* Steps names labels */}
          <div className="flex justify-between gap-1 text-[9px] font-sans font-bold">
            {stepsList.map((st, i) => (
              <div 
                key={st}
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  visualStep > i + 1 
                    ? 'text-brand-primary' 
                    : visualStep === i + 1 
                    ? 'text-text-primary' 
                    : 'text-text-secondary/50'
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

              {/* Password definition section */}
              {!isExistingUser && (
                <div className="pt-4 border-t border-border-primary/40 space-y-4">
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
                        placeholder="Min. 8 caractères"
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
                        placeholder="Saisissez à nouveau"
                        className="w-full p-2.5 rounded-lg bg-bg-primary border border-border-primary focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium text-text-primary" 
                        required 
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="font-sans font-bold text-lg text-text-primary pb-2 border-b border-border-primary/40">
                Téléchargement du dossier de pièces (Optionnel)
              </h3>
              
              <p className="text-xs text-text-secondary">
                Vous pouvez charger vos pièces justificatives dès maintenant ou finaliser votre dossier plus tard depuis votre espace étudiant.
              </p>

              {(() => {
                const cniFile = files.find(f => f.name.startsWith('[CNI]'));
                const diplomeFile = files.find(f => f.name.startsWith('[Diplôme]'));

                return (
                  <div className="space-y-4">
                    {/* 1. CNI upload block */}
                    <div className="bg-bg-secondary p-4 rounded-xl border border-border-primary/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-text-primary">1. Carte Nationale d'Identité (CNI)</h4>
                          <p className="text-[10px] text-text-secondary mt-0.5">Format requis : PDF, Word, Image (Max: 5 Mo)</p>
                        </div>
                        {cniFile ? (
                          <span className="bg-emerald-500/10 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2Icon className="w-3.5 h-3.5" /> Chargé
                          </span>
                        ) : (
                          <span className="bg-amber-500/10 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Manquant
                          </span>
                        )}
                      </div>
                      
                      {cniFile ? (
                        <div className="flex items-center justify-between p-2.5 bg-bg-primary rounded-lg border border-border-primary/40 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <FileTextIcon className="w-4 h-4 text-brand-primary" />
                            <span className="font-semibold text-text-primary truncate">{cniFile.name.replace('[CNI] ', '')}</span>
                            <span className="text-[10px] text-text-secondary">({cniFile.size})</span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setFiles(prev => prev.filter(f => !f.name.startsWith('[CNI]')))}
                            className="text-red-500 hover:text-red-700 font-bold text-[10px] cursor-pointer"
                          >
                            Supprimer
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveUploadType('cni');
                            fileInputRef.current?.click();
                          }}
                          className="w-full py-2 border-2 border-dashed border-border-primary rounded-lg hover:border-brand-primary hover:bg-bg-primary text-xs font-semibold text-text-secondary hover:text-brand-primary transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <UploadCloudIcon className="w-4 h-4" /> Charger ma CNI
                        </button>
                      )}
                    </div>

                    {/* 2. Diploma upload block */}
                    {!isCertification && (
                      <div className="bg-bg-secondary p-4 rounded-xl border border-border-primary/60 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-text-primary">2. Diplôme le plus récent</h4>
                            <p className="text-[10px] text-text-secondary mt-0.5">Format requis : PDF, Word, Image (Max: 5 Mo)</p>
                          </div>
                          {diplomeFile ? (
                            <span className="bg-emerald-500/10 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2Icon className="w-3.5 h-3.5" /> Chargé
                            </span>
                          ) : (
                            <span className="bg-amber-500/10 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Manquant
                            </span>
                          )}
                        </div>
                        
                        {diplomeFile ? (
                          <div className="flex items-center justify-between p-2.5 bg-bg-primary rounded-lg border border-border-primary/40 text-xs">
                            <div className="flex items-center gap-2 truncate">
                              <FileTextIcon className="w-4 h-4 text-brand-primary" />
                              <span className="font-semibold text-text-primary truncate">{diplomeFile.name.replace('[Diplôme] ', '')}</span>
                              <span className="text-[10px] text-text-secondary">({diplomeFile.size})</span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => setFiles(prev => prev.filter(f => !f.name.startsWith('[Diplôme]')))}
                              className="text-red-500 hover:text-red-700 font-bold text-[10px] cursor-pointer"
                            >
                              Supprimer
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveUploadType('diplome');
                              fileInputRef.current?.click();
                            }}
                            className="w-full py-2 border-2 border-dashed border-border-primary rounded-lg hover:border-brand-primary hover:bg-bg-primary text-xs font-semibold text-text-secondary hover:text-brand-primary transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <UploadCloudIcon className="w-4 h-4" /> Charger mon Diplôme
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Hidden file input */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />

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
                  className="w-4 h-4 text-brand-primary border-border-primary rounded focus:ring-brand-primary mt-0.5 cursor-pointer animate-pulse" 
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
                        <div className="flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
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
                            className="flex-1 text-center text-lg font-bold tracking-[0.5em] p-2.5 rounded-lg bg-bg-primary border border-border-primary focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none text-text-primary font-mono"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyOtp}
                            className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            Vérifier
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={isSendingOtp}
                          className={`text-[10px] text-brand-primary hover:underline flex items-center gap-1 cursor-pointer ${
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
                  <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-400 rounded-lg px-4 py-3">
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
            {visualStep > 1 ? (
              <button 
                type="button"
                onClick={handlePrevStep}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-border-primary hover:bg-bg-primary text-xs font-bold transition-all text-text-primary cursor-pointer"
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
                className="bg-brand-primary hover:bg-brand-hover text-white flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-xs font-bold transition-all ml-auto cursor-pointer"
              >
                Suivant
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            ) : (
              <button 
                type="submit"
                disabled={isSubmitting}
                className="bg-brand-primary hover:bg-brand-hover text-white flex items-center gap-1.5 px-8 py-3 rounded-lg text-xs font-bold transition-all ml-auto shadow-md disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer"
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
