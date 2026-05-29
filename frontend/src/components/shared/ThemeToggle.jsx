import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

export function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className={`relative h-9 w-16 rounded-full border transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${className}`}
      style={{
        background: theme === 'dark' ? 'rgba(46,204,113,0.12)' : 'rgba(34,168,92,0.1)',
        borderColor: 'var(--border-strong)',
      }}
    >
      {/* Track icons */}
      <Sun
        className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 transition-opacity duration-300"
        style={{ color: 'var(--accent-gold)', opacity: theme === 'light' ? 1 : 0.3 }}
      />
      <Moon
        className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 transition-opacity duration-300"
        style={{ color: 'var(--accent)', opacity: theme === 'dark' ? 1 : 0.3 }}
      />

      {/* Thumb */}
      <span
        className="absolute top-1 h-7 w-7 rounded-full shadow-md transition-all duration-300"
        style={{
          left: theme === 'dark' ? 'calc(100% - 2rem)' : '0.25rem',
          background: theme === 'dark' ? 'var(--accent)' : 'var(--accent-gold)',
        }}
      />
    </button>
  );
}
