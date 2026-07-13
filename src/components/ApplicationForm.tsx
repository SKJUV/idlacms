import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  UploadCloud, 
  CheckCircle2, 
  FileText, 
  AlertCircle, 
  GraduationCap 
} from 'lucide-react';
import { programsData } from '../data/mockData';
import { databases, storage, APPWRITE_CONFIG, isAppwriteDbConfigured, isAppwriteStorageConfigured, ID } from '../lib/appwrite';

interface ApplicationFormProps {
  onSuccess: (candidateName: string, selectedProgram: string, email: string) => void;
  onBackToHome: () => void;
}

export default function ApplicationForm({ onSuccess, onBackToHome }: ApplicationFormProps) {
  const [step, setStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nationality, setNationality] = useState('');

  const [selectedProgram, setSelectedProgram] = useState(programsData[0]?.title ?? '');
  const [highestDegree, setHighestDegree] = useState('');
  const [graduationYear, setGraduationYear] = useState('');

  const [files, setFiles] = useState<{ name: string; size: string; type: string; fileId: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

  const handleNextStep = () => {
    setErrorMessage('');
    if (step === 1) {
      if (!firstName || !lastName || !email || !phone) {
        setErrorMessage('Veuillez remplir tous les champs requis.');
        return;
      }
    }
    if (step === 2) {
      if (!selectedProgram || !highestDegree) {
        setErrorMessage('Veuillez sélectionner votre programme cible.');
        return;
      }
    }
    if (step === 3) {
      if (files.length === 0) {
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
            highestDegree,
            graduationYear: Number(graduationYear) || undefined,
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
    <div className="bg-[#f8f9ff] min-h-screen py-12 px-6 md:px-12 text-[#0b1c30]">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-[#c6c6cf] shadow-sm overflow-hidden">
        {/* Banner with logo & back option */}
        <div className="bg-[#00020e] text-white p-6 md:p-8 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#6ffbbe] text-[#00020e] flex items-center justify-center font-bold text-xl">
              🎓
            </div>
            <div>
              <h1 className="font-sans font-bold text-xl leading-none">Admissions IDLA</h1>
              <p className="text-white/60 text-xs mt-1">Institut de Leadership et d'Administration</p>
            </div>
          </div>
          <button 
            onClick={onBackToHome}
            className="text-xs text-white/70 hover:text-white flex items-center gap-1.5 transition-colors border border-white/20 px-3 py-1.5 rounded"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour au site
          </button>
        </div>

        {/* Dynamic Stepper Indicator */}
        <div className="bg-slate-50 border-b border-[#c6c6cf]/40 p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-[#006c49] uppercase tracking-wider">
              Étape {step} sur 4 : {stepsList[step - 1]}
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              {Math.round(((step - 1) / 3) * 100)}% Complété
            </span>
          </div>
          
          {/* Progress bar line */}
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="bg-[#006c49] h-full transition-all duration-300"
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
                    ? 'text-[#006c49]' 
                    : step === i + 1 
                    ? 'text-[#00020e]' 
                    : 'text-slate-400'
                }`}
              >
                {st}
              </div>
            ))}
          </div>
        </div>

        {/* Error message wrapper */}
        {errorMessage && (
          <div className="mx-6 mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded text-red-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Stepper active component content */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-sans font-bold text-lg text-[#00020e] pb-2 border-b border-slate-100">
                Informations d'identité du candidat
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Prénom *</label>
                  <input 
                    type="text" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Votre prénom"
                    className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] focus:border-[#006c49] outline-none text-sm font-medium" 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nom *</label>
                  <input 
                    type="text" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Votre nom de famille"
                    className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] focus:border-[#006c49] outline-none text-sm font-medium" 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Adresse Email *</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="prenom.nom@exemple.com"
                  className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] focus:border-[#006c49] outline-none text-sm font-medium" 
                  required 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Téléphone Portable *</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+237 6 00 00 00 00"
                    className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] focus:border-[#006c49] outline-none text-sm font-medium" 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nationalité *</label>
                  <input 
                    type="text" 
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    placeholder="Votre nationalité"
                    className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] focus:border-[#006c49] outline-none text-sm font-medium" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-sans font-bold text-lg text-[#00020e] pb-2 border-b border-slate-100">
                Choix du Programme d'Études
              </h3>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Programme académique ciblé *</label>
                <select 
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] focus:border-[#006c49] outline-none text-sm font-semibold text-[#00020e]"
                >
                  {programsData.map((p) => (
                    <option key={p.id} value={p.title}>{p.title} ({p.type})</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">Sélectionnez la filière d'élite correspondant à vos aspirations professionnelles.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Dernier diplôme obtenu *</label>
                  <input 
                    type="text" 
                    value={highestDegree}
                    onChange={(e) => setHighestDegree(e.target.value)}
                    placeholder="ex: Licence en Management"
                    className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] focus:border-[#006c49] outline-none text-sm font-medium" 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Année d'obtention *</label>
                  <input 
                    type="number" 
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    placeholder="2024"
                    className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] focus:border-[#006c49] outline-none text-sm font-medium" 
                    required 
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-sans font-bold text-lg text-[#00020e] pb-2 border-b border-slate-100">
                Téléchargement du dossier de pièces
              </h3>
              
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-[#006c49] bg-[#eff4ff]' 
                    : 'border-[#c6c6cf] hover:border-[#006c49] hover:bg-slate-50'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  className="hidden" 
                  accept=".pdf,.doc,.docx"
                />
                
                <UploadCloud className="w-12 h-12 text-[#006c49] mx-auto mb-3 opacity-80" />
                
                <p className="text-sm font-semibold text-[#00020e]">
                  Glissez-déposez vos fichiers ici, ou cliquez pour parcourir
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Format requis : PDF, Word (Taille max : 5 MB) • CV & Lettre de motivation recommandés.
                </p>
              </div>

              {/* Uploading progress feedback */}
              {isUploading && (
                <div className="bg-slate-50 p-4 rounded-lg border border-[#c6c6cf]/50 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-[#006c49]">Chargement du document en cours...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#006c49] h-full transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Attached files lists */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fichiers joints ({files.length})</h4>
                  <div className="space-y-2">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-[#c6c6cf]/40">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#006c49]" />
                          <div>
                            <p className="text-xs font-semibold text-[#00020e] line-clamp-1">{f.name}</p>
                            <p className="text-[10px] text-slate-400">{f.size}</p>
                          </div>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-[#006c49]" />
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
              <h3 className="font-sans font-bold text-lg text-[#00020e] pb-2 border-b border-slate-100">
                Déclaration d'exactitude & Signature
              </h3>

              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded text-xs text-amber-900 leading-relaxed">
                Je certifie sur l'honneur que l'ensemble des informations fournies dans le cadre de ce dossier de candidature IDLA sont exactes et sincères. Toute fausse déclaration entraînera l'annulation immédiate de ma candidature.
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-[#c6c6cf]/40">
                <input 
                  type="checkbox" 
                  id="declaration-checkbox"
                  checked={declarationChecked}
                  onChange={(e) => setDeclarationChecked(e.target.checked)}
                  className="w-4 h-4 text-[#006c49] border-[#c6c6cf] rounded focus:ring-[#006c49] mt-0.5" 
                />
                <label htmlFor="declaration-checkbox" className="text-xs text-slate-600 leading-relaxed cursor-pointer font-medium select-none">
                  J'accepte d'enregistrer mes coordonnées et d'envoyer électroniquement mon dossier d'admissions pour examen auprès du comité académique de l'IDLA.
                </label>
              </div>

              <div className="p-4 border border-[#c6c6cf] rounded-xl space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Signature électronique *</label>
                <div className="bg-slate-50 h-20 rounded-lg border border-dashed border-[#c6c6cf] flex items-center justify-center text-slate-400 italic text-sm">
                  {firstName && lastName ? `${firstName} ${lastName}` : 'Signature manuscrite simulée'}
                </div>
                <p className="text-[10px] text-slate-400">Généré automatiquement à partir de votre identité.</p>
              </div>
            </div>
          )}

          {/* Stepper Controllers */}
          <div className="flex justify-between items-center pt-6 border-t border-[#c6c6cf]/30">
            {step > 1 ? (
              <button 
                type="button"
                onClick={handlePrevStep}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-[#c6c6cf] hover:bg-slate-50 text-xs font-bold transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Précédent
              </button>
            ) : (
              <div></div>
            )}

            {step < 4 ? (
              <button 
                type="button"
                onClick={handleNextStep}
                className="bg-[#00020e] hover:bg-slate-800 text-white flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-xs font-bold transition-all ml-auto"
              >
                Suivant
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                type="submit"
                disabled={isSubmitting}
                className="bg-[#006c49] hover:bg-[#6cf8bb] hover:text-[#00020e] text-white flex items-center gap-1.5 px-8 py-3 rounded-lg text-xs font-bold transition-all ml-auto shadow-md disabled:opacity-55 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Envoi en cours...' : 'Soumettre ma Candidature'}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}
