import { create } from 'zustand';

function getInitialTheme() {
  try {
    const saved = localStorage.getItem('carbonx_theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {}
  return 'light';
}

export const useThemeStore = create((set) => ({
  theme: 'light',

  initTheme: () => {
    const theme = getInitialTheme();
    // :root is light by default — only add 'dark' class when dark mode
    document.documentElement.classList.toggle('dark', theme === 'dark');
    set({ theme });
  },

  toggleTheme: () => {
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', next === 'dark');
      try { localStorage.setItem('carbonx_theme', next); } catch {}
      return { theme: next };
    });
  },
}));
