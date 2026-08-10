export const DEFAULT_PROGRAM_DURATIONS: Record<'Master' | 'Doctorat' | 'Certification' | 'Bachelor', string> = {
  Bachelor: '3 ans (6 Semestres - L1 à L3)',
  Master: '5 ans (Cursus Bac+5 / M1 & M2)',
  Doctorat: '3 ans (Recherche / Thèse - D1 à D3)',
  Certification: '6 mois (Formation continue & Certifiante)'
};

export interface Program {
  id: string;
  title: string;
  description: string;
  type: 'Master' | 'Doctorat' | 'Certification' | 'Bachelor';
  category: string;
  duration: string;
  image: string;
  isNew?: boolean;
  procedures?: string;
  availableLevels?: string[];
}

export interface AcademicSession {
  id: string;
  name: string;
  type: 'principale' | 'hiver' | 'printemps' | 'continu' | 'autre';
  status: 'ouverte' | 'fermee' | 'bientot';
  deadline?: string;
  description?: string;
}

export const DEFAULT_ACADEMIC_SESSIONS: AcademicSession[] = [
  {
    id: 'sess_1',
    name: "Session d'Octobre 2026",
    type: 'principale',
    status: 'ouverte',
    deadline: '15 Septembre 2026',
    description: 'Rentrée universitaire principale pour l\'ensemble des cursus Master et Bachelor.'
  },
  {
    id: 'sess_2',
    name: "Session de Janvier 2027",
    type: 'hiver',
    status: 'ouverte',
    deadline: '15 Décembre 2026',
    description: 'Rentrée décalée d\'hiver pour les programmes accélérés et certifications.'
  },
  {
    id: 'sess_3',
    name: "Session d'Avril 2027",
    type: 'printemps',
    status: 'ouverte',
    deadline: '15 Mars 2027',
    description: 'Rentrée de printemps pour les inscriptions tardives et auditeurs libres.'
  },
  {
    id: 'sess_4',
    name: "Rentrées permanentes (E-learning)",
    type: 'continu',
    status: 'ouverte',
    deadline: 'Toute l\'année',
    description: 'Rentrée immédiate et apprentissage à votre rythme pour les certifications 100% en ligne.'
  }
];

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  date: string;
  category: 'Événements' | 'Académique' | 'Partenariats' | 'Annonces' | 'Alumni';
  image: string;
  isFeatured?: boolean;
  formId?: string;
  formUrl?: string;
  startDate?: string;
  endDate?: string;
}

export interface CustomFormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'radio' | 'checkbox' | 'date' | 'file';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface CustomForm {
  id: string;
  title: string;
  description: string;
  fields: CustomFormField[];
  createdAt: string;
}

export interface CustomFormResponse {
  id: string;
  formId: string;
  formTitle: string;
  newsId?: string;
  newsTitle?: string;
  submittedAt: string;
  respondentName?: string;
  respondentEmail?: string;
  data: Record<string, any>;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  text: string;
  image: string;
  promo: string;
  category: 'Master' | 'Executive' | 'Alumni';
  isFeatured?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Admin' | 'Writer' | 'Marketer' | 'OC' | 'teacher' | 'Enseignant';
  status: 'Actif' | 'Inactif' | 'Bloqué';
  lastLogin: string;
  initials: string;
  avatar?: string;
  assignedPrograms?: string[];
}

export interface TeacherProfile {
  id: string;
  authUserId?: string;
  firstName: string;
  lastName: string;
  email: string;
  title?: 'Professeur' | 'Docteur' | 'Ingénieur' | 'Expert' | 'Intervenant';
  speciality?: string;
  assignedPrograms?: string[];
  scheduleData?: string;
  status: 'Actif' | 'Inactif' | 'Suspendu';
}

export interface Course {
  id: string;
  code: string;         // ex: INF301
  title: string;        // ex: Algorithmique & Structures de Données
  program: string;      // Nom du programme
  level: string;        // ex: L1, L2, L3, M1, M2, D1, D2, D3, Certifiant
  teacherId?: string;
  teacherName?: string;
  volumeCM?: number;    // Heures CM prévues
  volumeTD?: number;    // Heures TD prévues
  volumeTP?: number;    // Heures TP prévues
  completedCM?: number; // Heures CM effectuées
  completedTD?: number; // Heures TD effectuées
  completedTP?: number; // Heures TP effectuées
  description?: string;
}

export interface ScheduleSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  course: string;
  program: string;
  teacherName?: string;
  teacherId?: string;
  type?: 'CM' | 'TD' | 'TP';
  durationHours?: number;
  isCompleted?: boolean;
}

export interface EquivalenceChecklist {
  previousTranscriptsVerified: boolean;
  previousDiplomaVerified: boolean;
  identityVerified: boolean;
  notes?: string;
}

export interface PreRegistration {
  id: string;
  name: string;
  email: string;
  program?: string;
  dateApplied: string;
  status: 'In Review' | 'New' | 'Accepted' | 'Rejected';
  initials: string;
  // Détails du dossier (facultatifs — présents pour l'examen approfondi).
  phone?: string;
  nationality?: string;
  dateOfBirth?: string;
  gender?: 'Homme' | 'Femme' | 'Autre';
  countryOfResidence?: string;
  educationLevel?: string;
  highestDegree?: string;
  graduationYear?: string | number;
  motivation?: string;
  documents?: string[];
  // Niveaux, équivalences et matricule
  entryLevel?: string;
  equivalenceDocs?: string[];
  levelValidationStatus?: 'Approved' | 'Pending' | 'Adjusted';
  matricule?: string;
  equivalenceChecklist?: EquivalenceChecklist;
}

export interface ActivityLog {
  id: string;
  type: 'registration' | 'article' | 'error' | 'alumni';
  user: string;
  text: string;
  time: string;
}

// Don soumis par un visiteur via le formulaire public de soutien.
export interface Donation {
  id: string;
  donor: string;
  email: string;
  amount: number;
  message?: string;
  date: string;
  status: 'Nouveau' | 'Confirmé';
}

// Campagne marketing (gérée en CRUD complet côté admin).
export interface Campaign {
  id: string;
  name: string;
  channel: string;
  status: 'Active' | 'En pause';
  reach: number;
}

// ─── Student Portal ────────────────────────────────────────────────────────────

export type CourseStatus = 'en cours' | 'terminé' | 'non commencé';
export type CourseLevel = 'Débutant' | 'Intermédiaire' | 'Avancé';

export interface CourseEnrollment {
  id: string;
  courseId: string;
  title: string;
  instructor: string;
  category: string;
  level: CourseLevel;
  duration: string;          // e.g. "12h 30min"
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;   // 0–100
  status: CourseStatus;
  enrolledAt: string;        // ISO date string
  lastAccessedAt?: string;   // ISO date string
  nextDeadline?: string;     // ISO date string
  image: string;
  nextLessonTitle?: string;
}

export interface AssignmentDeadline {
  id: string;
  courseId: string;
  courseTitle: string;
  assignmentTitle: string;
  dueDate: string;           // ISO date string
  isSubmitted: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface Certificate {
  id: string;
  courseTitle: string;
  issueDate: string;         // ISO date string
  credentialId: string;
  category: string;
  instructor: string;
  image?: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  bio: string;
  avatarUrl?: string;
  language: 'fr' | 'en';
  joinedAt: string;          // ISO date string
  phone?: string;
  nationality?: string;
}

export interface CourseCatalogItem {
  id: string;
  title: string;
  instructor: string;
  category: string;
  level: CourseLevel;
  duration: string;
  rating: number;            // 0–5
  totalStudents: number;
  image: string;
  isNew?: boolean;
  isFeatured?: boolean;
  tags: string[];
}
