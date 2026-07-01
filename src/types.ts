export type RoleType = 'visitor' | 'candidate' | 'admin';

export type ActiveTab = 
  | 'home' 
  | 'programs' 
  | 'news' 
  | 'testimonials' 
  | 'apply' 
  | 'apply-success'
  | 'candidate-login'
  | 'candidate-dashboard'
  | 'admin-login'
  | 'admin-dashboard'
  | 'admin-users'
  | 'admin-add-user';

export interface Program {
  id: string;
  title: string;
  description: string;
  type: 'Master' | 'Doctorat' | 'Certification' | 'Bachelor';
  category: 'Sciences' | 'Management' | 'Tech' | 'Droit' | 'Santé' | 'Communication';
  duration: string;
  image: string;
  isNew?: boolean;
}

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  date: string;
  category: 'Événements' | 'Académique' | 'Partenariats' | 'Annonces' | 'Alumni';
  image: string;
  isFeatured?: boolean;
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
  role: 'Super Admin' | 'Admin' | 'Writer' | 'Marketer' | 'OC';
  status: 'Actif' | 'Inactif' | 'Bloqué';
  lastLogin: string;
  initials: string;
  avatar?: string;
}

export interface PreRegistration {
  id: string;
  name: string;
  email: string;
  program: string;
  dateApplied: string;
  status: 'In Review' | 'New' | 'Accepted' | 'Rejected';
  initials: string;
}

export interface ActivityLog {
  id: string;
  type: 'registration' | 'article' | 'error' | 'alumni';
  user: string;
  text: string;
  time: string;
}
