import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo } from '../shared/Logo';
import { ThemeToggle } from '../shared/ThemeToggle';
import { useAuthStore } from '../../store/authStore';

const navLinks = [
  { label: 'Why CarbonX', to: '/features' },
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'Calculator',   to: '/calculator' },
  { label: 'About',        to: '/about' },
  { label: 'Contact',      to: '/contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen]         = useState(false);
  const { isAuthenticated }     = useAuthStore();
  const navigate                = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
        <div className="flex items-center justify-between h-16">

          {/* Logo — bigger */}
          <Logo className="h-11" />

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    isActive ? 'text-accent' : 'hover:text-foreground'
                  }`
                }
                style={({ isActive }) => ({ color: isActive ? 'var(--accent)' : 'var(--text-muted)' })}
              >
                {l.label}
              </NavLink>
            ))}
          </div>

          {/* Right side — only Get Started (or Dashboard when logged in) */}
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

          {/* Mobile menu toggle */}
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
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-2 flex flex-col gap-2 border-t mt-2" style={{ borderColor: 'var(--border)' }}>
            {isAuthenticated ? (
              <button onClick={() => navigate('/dashboard')} className="btn-primary text-sm font-semibold px-4 py-2.5 rounded-lg text-center">
                Dashboard
              </button>
            ) : (
              <button onClick={() => navigate('/signup')} className="btn-primary text-sm font-semibold px-4 py-2.5 rounded-lg text-center">
                Get Started
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
