import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo } from '../shared/Logo';
import { ThemeToggle } from '../shared/ThemeToggle';
import { useAuthStore } from '../../store/authStore';

const NAV_LINKS = [
  { label: 'Home',         anchor: 'home'         },
  { label: 'About',        anchor: 'about'        },
  { label: 'How It Works', anchor: 'how-it-works' },
  { label: 'Calculator',   anchor: 'calculator'   },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen]         = useState(false);
  const { isAuthenticated }     = useAuthStore();
  const navigate                = useNavigate();
  const { pathname }            = useLocation();
  const isHome                  = pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleAnchorClick = (e, anchor) => {
    setOpen(false);
    if (isHome) {
      e.preventDefault();
      document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-400"
      style={
        scrolled
          ? { background: 'var(--nav-bg)', backdropFilter: 'blur(22px)', borderBottom: '1px solid var(--border)' }
          : { background: 'transparent' }
      }
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between" style={{ height: '80px' }}>

          {/* Logo */}
          <Logo className="h-20 w-44" />

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <a
                key={l.anchor}
                href={isHome ? `#${l.anchor}` : `/#${l.anchor}`}
                onClick={(e) => handleAnchorClick(e, l.anchor)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'rgba(var(--accent-rgb),0.07)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary text-sm font-semibold px-5 py-2 rounded-lg"
              >
                Dashboard
              </button>
            ) : (
              <button
                onClick={() => navigate('/signup')}
                className="btn-primary text-sm font-semibold px-5 py-2 rounded-lg"
              >
                Get Started
              </button>
            )}
          </div>

          {/* Mobile toggle */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setOpen((v) => !v)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Toggle menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div
          className="md:hidden px-4 pb-5 pt-3 space-y-1 border-t animate-fade-in"
          style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(22px)', borderColor: 'var(--border)' }}
        >
          {NAV_LINKS.map((l) => (
            <a
              key={l.anchor}
              href={isHome ? `#${l.anchor}` : `/#${l.anchor}`}
              onClick={(e) => handleAnchorClick(e, l.anchor)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              {l.label}
            </a>
          ))}
          <div className="pt-2 flex flex-col gap-2 border-t mt-2" style={{ borderColor: 'var(--border)' }}>
            {isAuthenticated ? (
              <button onClick={() => { navigate('/dashboard'); setOpen(false); }} className="btn-primary text-sm font-semibold px-4 py-2.5 rounded-lg text-center">
                Dashboard
              </button>
            ) : (
              <button onClick={() => { navigate('/signup'); setOpen(false); }} className="btn-primary text-sm font-semibold px-4 py-2.5 rounded-lg text-center">
                Get Started
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
