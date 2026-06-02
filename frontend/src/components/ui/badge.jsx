import { cn } from '../../lib/utils';

// All accent-based variants pull from CSS variables so they adapt to light/dark
const variants = {
  default:   'bg-[rgba(var(--accent-rgb),0.10)] text-[var(--accent-dark)] border-[rgba(var(--accent-rgb),0.22)]  dark:text-[var(--accent)]',
  success:   'bg-[rgba(var(--accent-rgb),0.10)] text-[var(--accent-dark)] border-[rgba(var(--accent-rgb),0.22)]  dark:text-[var(--accent)]',
  warning:   'bg-[rgba(196,149,42,0.12)] text-[#7C5A10] border-[rgba(196,149,42,0.28)] dark:text-[var(--accent-warm)]',
  gold:      'bg-[rgba(139,94,60,0.10)]  text-[var(--accent-gold)]         border-[rgba(139,94,60,0.25)]',
  error:     'bg-red-500/10 text-red-700 border-red-500/25 dark:text-red-400',
  secondary: 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)]',
  soon:      'badge-soon',
};

export function Badge({ variant = 'default', className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
        variants[variant] ?? variants.default,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
