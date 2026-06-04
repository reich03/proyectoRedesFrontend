import { create } from 'zustand';

interface AppStore {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  activeProject: string | null;
  setActiveProject: (id: string | null) => void;
}

export const useStore = create<AppStore>((set) => ({
  theme: 'dark',
  toggleTheme: () => set((s) => {
    const next = s.theme === 'dark' ? 'light' : 'dark';
    if (next === 'light') document.documentElement.classList.remove('dark');
    else document.documentElement.classList.add('dark');
    return { theme: next };
  }),
  activeProject: null,
  setActiveProject: (id) => set({ activeProject: id }),
}));
