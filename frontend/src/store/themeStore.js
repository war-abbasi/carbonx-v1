import { create } from 'zustand';

function getInitialTheme() {
  try {
    const saved = localStorage.getItem('carbonx_theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {}
  return 'dark';
}

export const useThemeStore = create((set) => ({
  theme: 'dark',

  initTheme: () => {
    const theme = getInitialTheme();
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
    set({ theme });
  },

  toggleTheme: () => {
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', next === 'dark');
      document.documentElement.classList.toggle('light', next === 'light');
      try { localStorage.setItem('carbonx_theme', next); } catch {}
      return { theme: next };
    });
  },
}));
