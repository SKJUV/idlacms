import { create } from 'zustand';
import { Program, PreRegistration, User } from '../types';
import { dbAdapter } from '../lib/dbAdapter';

export type Role = 'guest' | 'student' | 'admin' | 'teacher';

interface AppState {
  // Auth & Session State
  role: Role;
  userEmail: string;
  userName: string;
  isSessionChecking: boolean;
  theme: 'light' | 'dark';

  // Navigation State
  activeTab: string;

  // Global Data Cache
  programs: Program[];
  applications: PreRegistration[];
  usersList: User[];
  isDataLoading: boolean;

  // Actions
  setRole: (role: Role) => void;
  setUserSession: (email: string, name: string, role: Role) => void;
  setActiveTab: (tab: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setIsSessionChecking: (checking: boolean) => void;

  // Async Data Actions
  fetchPrograms: () => Promise<void>;
  fetchApplications: () => Promise<void>;
  addProgram: (programData: Omit<Program, 'id'>) => Promise<void>;
  addApplication: (appData: Omit<PreRegistration, 'id'>) => Promise<void>;
  logout: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  role: 'guest',
  userEmail: '',
  userName: '',
  isSessionChecking: true,
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'dark',

  activeTab: 'home',

  programs: [],
  applications: [],
  usersList: [],
  isDataLoading: false,

  setRole: (role) => set({ role }),
  setUserSession: (email, name, role) => set({ userEmail: email, userName: name, role }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    set({ theme });
  },
  setIsSessionChecking: (isSessionChecking) => set({ isSessionChecking }),

  fetchPrograms: async () => {
    set({ isDataLoading: true });
    try {
      const progs = await dbAdapter.programs.list();
      set({ programs: progs });
    } catch (e) {
      console.warn('Error fetching programs:', e);
    } finally {
      set({ isDataLoading: false });
    }
  },

  fetchApplications: async () => {
    set({ isDataLoading: true });
    try {
      const apps = await dbAdapter.applications.list();
      set({ applications: apps });
    } catch (e) {
      console.warn('Error fetching applications:', e);
    } finally {
      set({ isDataLoading: false });
    }
  },

  addProgram: async (programData) => {
    const created = await dbAdapter.programs.create(programData);
    set((state) => ({ programs: [created, ...state.programs] }));
  },

  addApplication: async (appData) => {
    const created = await dbAdapter.applications.create(appData);
    set((state) => ({ applications: [created, ...state.applications] }));
  },

  logout: () => {
    sessionStorage.removeItem('idla_portal_session_email');
    set({ role: 'guest', userEmail: '', userName: '', activeTab: 'home' });
  },
}));
