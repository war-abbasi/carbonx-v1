import { cn } from '../../lib/utils';

const variants = {
  default: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  warning: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  gold: 'bg-gold-muted text-gold border-gold/30',
  error: 'bg-red-500/15 text-red-400 border-red-500/30',
  secondary: 'bg-white/5 text-emerald-300/60 border-white/10',
  soon: 'badge-soon',
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
