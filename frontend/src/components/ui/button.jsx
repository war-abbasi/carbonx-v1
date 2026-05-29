import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        default:     'btn-primary',
        outline:     'btn-outline',
        ghost:       'hover:bg-surface text-muted hover:text-foreground',
        secondary:   'bg-surface text-foreground border border-border hover:border-border-strong',
        destructive: 'bg-danger text-white hover:opacity-90 shadow-[0_0_20px_rgba(224,85,96,0.25)]',
        gold:        'text-[var(--bg)] shadow-[0_0_20px_rgba(200,168,75,0.3)] hover:shadow-[0_0_35px_rgba(200,168,75,0.5)] hover:-translate-y-0.5',
        link:        'text-accent underline-offset-4 hover:underline p-0 h-auto font-normal',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm:      'h-8 px-3 text-xs rounded-md',
        lg:      'h-11 px-8',
        xl:      'h-12 px-10 text-base',
        icon:    'h-10 w-10',
        'icon-sm': 'h-8 w-8 rounded-md',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

// Gold variant needs inline style for bg
const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  const extra = variant === 'gold' ? { style: { background: 'var(--accent-gold)', ...props.style } } : {};
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...extra}
      {...props}
    />
  );
});
Button.displayName = 'Button';

export { Button, buttonVariants };
