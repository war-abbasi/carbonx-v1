import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button }  from '../../components/ui/button';
import { Input }   from '../../components/ui/input';
import { Logo }    from '../../components/shared/Logo';
import { Spinner } from '../../components/ui/spinner';
import { useAuth } from '../../hooks/useAuth';
import { validators } from '../../utils/validators';

function FieldWrapper({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs mt-1.5" style={{ color: 'var(--danger)' }}>{error}</p>
      )}
    </div>
  );
}

export default function SignupPage() {
  const { handleRegister, isLoading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', terms: false,
  });
  const [errors,      setErrors]      = useState({});
  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const update = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const e = {};
    const nameErr    = validators.name(form.name);
    const emailErr   = validators.email(form.email);
    const pwErr      = validators.password(form.password);
    const confirmErr = validators.confirmPassword(form.confirmPassword, form.password);
    if (nameErr)    e.name            = nameErr;
    if (emailErr)   e.email           = emailErr;
    if (pwErr)      e.password        = pwErr;
    if (confirmErr) e.confirmPassword = confirmErr;
    if (!form.terms) e.terms          = 'You must accept the terms to continue';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    await handleRegister({ name: form.name, email: form.email, password: form.password });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-12"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 70% at 70% 0%, rgba(var(--accent-rgb),0.1) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 20% 80%, rgba(200,168,75,0.06) 0%, transparent 50%)',
      }} />
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
      <div className="orb orb-green w-72 h-72 absolute top-10  right-10  opacity-25 animate-orb-2" />
      <div className="orb orb-green w-80 h-80 absolute bottom-10 left-10 opacity-15 animate-orb-1" />
      <div className="orb orb-gold  w-48 h-48 absolute top-1/2  left-20  opacity-20 animate-orb-3" />

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
              className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all"
              style={{
                background: 'var(--accent)',
                color: 'var(--bg)',
                boxShadow: '0 0 12px rgba(var(--accent-rgb),0.35)',
              }}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all"
              style={{ background: 'transparent', color: 'var(--text-muted)' }}
            >
              Log In
            </button>
          </div>

          <p className="text-center text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Create your free CarbonX account
          </p>

          <form onSubmit={submit} noValidate className="space-y-4">
            {/* Name */}
            <FieldWrapper label="Full name" error={errors.name}>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--text-dim)' }} />
                <Input id="name" type="text" placeholder="Jane Smith" value={form.name} onChange={update('name')}
                  className={`pl-10 ${errors.name ? 'border-red-500/50' : ''}`} autoComplete="name" />
              </div>
            </FieldWrapper>

            {/* Email */}
            <FieldWrapper label="Email address" error={errors.email}>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--text-dim)' }} />
                <Input id="email" type="email" placeholder="you@company.com" value={form.email} onChange={update('email')}
                  className={`pl-10 ${errors.email ? 'border-red-500/50' : ''}`} autoComplete="email" />
              </div>
            </FieldWrapper>

            {/* Password */}
            <FieldWrapper label="Password" error={errors.password}>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--text-dim)' }} />
                <Input id="password" type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters"
                  value={form.password} onChange={update('password')}
                  className={`pl-10 pr-10 ${errors.password ? 'border-red-500/50' : ''}`} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPw((v) => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'var(--text-dim)' }}>
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FieldWrapper>

            {/* Confirm password */}
            <FieldWrapper label="Confirm password" error={errors.confirmPassword}>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--text-dim)' }} />
                <Input id="confirmPassword" type={showConfirm ? 'text' : 'password'} placeholder="Re-enter your password"
                  value={form.confirmPassword} onChange={update('confirmPassword')}
                  className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500/50' : ''}`} autoComplete="new-password" />
                <button type="button" onClick={() => setShowConfirm((v) => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'var(--text-dim)' }}>
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FieldWrapper>

            {/* Terms */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.terms} onChange={update('terms')}
                  className="mt-0.5 h-4 w-4 rounded" style={{ accentColor: 'var(--accent)' }} />
                <span className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  I agree to the{' '}
                  <a href="#" style={{ color: 'var(--accent)' }}>Terms of Service</a>{' '}
                  and{' '}
                  <a href="#" style={{ color: 'var(--accent)' }}>Privacy Policy</a>
                </span>
              </label>
              {errors.terms && <p className="text-xs mt-1.5" style={{ color: 'var(--danger)' }}>{errors.terms}</p>}
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full mt-2" size="lg" disabled={isLoading}>
              {isLoading ? (
                <><Spinner size="sm" /> Creating account…</>
              ) : (
                <>Create Account <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
          </form>
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
