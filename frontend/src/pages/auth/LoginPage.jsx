import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button }  from '../../components/ui/button';
import { Input }   from '../../components/ui/input';
import { Logo }    from '../../components/shared/Logo';
import { Spinner } from '../../components/ui/spinner';
import { useAuth } from '../../hooks/useAuth';
import { validators } from '../../utils/validators';

export default function LoginPage() {
  const { handleLogin, isLoading } = useAuth();
  const navigate = useNavigate();

  const [form,   setForm]   = useState({ email: '', password: '', remember: false });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);

  const update = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const e = {};
    const emailErr = validators.email(form.email);
    const pwErr    = validators.password(form.password);
    if (emailErr) e.email    = emailErr;
    if (pwErr)    e.password = pwErr;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    await handleLogin({ email: form.email, password: form.password });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-4"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 70% at 30% 0%, rgba(var(--accent-rgb),0.08) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 80% 80%, rgba(var(--accent-warm-rgb),0.06) 0%, transparent 50%)',
      }} />
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
      <div className="orb orb-green  w-64 h-64 absolute top-20   left-10  opacity-25 animate-orb-1" />
      <div className="orb orb-green  w-80 h-80 absolute bottom-20 right-10 opacity-15 animate-orb-2" />
      <div className="orb orb-gold   w-48 h-48 absolute top-1/2   right-20 opacity-20 animate-orb-3" />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="auth-card rounded-2xl p-8 sm:p-10">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo className="h-11" linkTo="/" />
          </div>

          {/* Tab switcher */}
          <div
            className="flex rounded-xl overflow-hidden mb-7 p-1"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all"
              style={{ background: 'transparent', color: 'var(--text-muted)' }}
            >
              Sign Up
            </button>
            <button
              type="button"
              className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all"
              style={{
                background: 'var(--accent)',
                color: '#ffffff',
                boxShadow: '0 2px 10px rgba(var(--accent-rgb),0.28)',
              }}
            >
              Log In
            </button>
          </div>

          <p className="text-center text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Welcome back — sign in to continue
          </p>

          {/* Form */}
          <form onSubmit={submit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--text-dim)' }} />
                <Input id="email" type="email" placeholder="you@company.com" value={form.email} onChange={update('email')}
                  className={`pl-10 ${errors.email ? 'border-red-500/50' : ''}`} autoComplete="email" />
              </div>
              {errors.email && <p className="text-xs mt-1.5" style={{ color: 'var(--danger)' }}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--text-dim)' }} />
                <Input id="password" type={showPw ? 'text' : 'password'} placeholder="Enter your password"
                  value={form.password} onChange={update('password')}
                  className={`pl-10 pr-10 ${errors.password ? 'border-red-500/50' : ''}`} autoComplete="current-password" />
                <button type="button" onClick={() => setShowPw((v) => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'var(--text-dim)' }}>
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs mt-1.5" style={{ color: 'var(--danger)' }}>{errors.password}</p>}
            </div>

            {/* Remember me + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.remember} onChange={update('remember')}
                  className="h-4 w-4 rounded" style={{ accentColor: 'var(--accent)' }} />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Remember me</span>
              </label>
              <a href="#" className="text-sm transition-colors" style={{ color: 'var(--accent)' }}>
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <><Spinner size="sm" /> Signing in…</>
              ) : (
                <>Sign In <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'var(--border)' }} />
            </div>
            <div className="relative flex justify-center text-xs px-3" style={{ color: 'var(--text-dim)', background: 'var(--glass-bg)' }}>
              New to CarbonX?
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/signup')}
            className="btn-outline w-full py-2.5 rounded-xl text-sm font-semibold"
          >
            Create a Free Account
          </button>
        </div>

        <p className="text-center mt-5 text-sm" style={{ color: 'var(--text-dim)' }}>
          <Link to="/" className="hover:underline transition-colors" style={{ color: 'var(--text-muted)' }}>
            ← Back to homepage
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
