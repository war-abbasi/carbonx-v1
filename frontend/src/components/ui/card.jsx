import * as React from 'react';
import { cn } from '../../lib/utils';

const Card = React.forwardRef(({ className, hover = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('glass-card rounded-xl', hover && 'glass-card-hover cursor-pointer', className)}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader      = React.forwardRef(({ className, ...props }, ref) => <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />);
const CardTitle       = React.forwardRef(({ className, ...props }, ref) => <h3 ref={ref} className={cn('text-lg font-semibold leading-none tracking-tight', className)} style={{ color: 'var(--text)' }} {...props} />);
const CardDescription = React.forwardRef(({ className, ...props }, ref) => <p ref={ref} className={cn('text-sm', className)} style={{ color: 'var(--text-muted)' }} {...props} />);
const CardContent     = React.forwardRef(({ className, ...props }, ref) => <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />);
const CardFooter      = React.forwardRef(({ className, ...props }, ref) => <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />);

CardHeader.displayName      = 'CardHeader';
CardTitle.displayName       = 'CardTitle';
CardDescription.displayName = 'CardDescription';
CardContent.displayName     = 'CardContent';
CardFooter.displayName      = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
