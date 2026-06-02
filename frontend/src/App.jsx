import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import AppRouter from './routes/AppRouter';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import PageLoader from './components/shared/PageLoader';

export default function App() {
  const { loadUser, isInitializing } = useAuthStore();
  const { initTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
    loadUser();
  }, [initTheme, loadUser]);

  if (isInitializing) return <PageLoader />;

  return (
    <>
      <AppRouter />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--bg-card, var(--surface))',
            color: 'var(--text)',
            border: '1px solid var(--border-strong)',
            backdropFilter: 'blur(12px)',
            boxShadow: 'var(--shadow-md)',
            fontSize: '14px',
            fontFamily: 'var(--font-sans)',
          },
          success: { iconTheme: { primary: 'var(--accent)', secondary: 'var(--bg)' } },
          error:   { iconTheme: { primary: 'var(--danger)', secondary: 'var(--bg)' } },
        }}
      />
    </>
  );
}
