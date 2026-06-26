import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'gold' | 'copper' | 'green' | 'red' | 'neutral';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  gold:    'bg-gold/15 text-gold-dark border border-gold/25',
  copper:  'bg-copper/10 text-copper-dark border border-copper/25',
  green:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  red:     'bg-red-50 text-red-600 border border-red-200',
  neutral: 'bg-charcoal/6 text-charcoal/70 border border-charcoal/12',
};

const dotColors: Record<BadgeVariant, string> = {
  gold:    'bg-gold',
  copper:  'bg-copper',
  green:   'bg-emerald-500',
  red:     'bg-red-500',
  neutral: 'bg-charcoal/40',
};

const sizes: Record<BadgeSize, string> = {
  sm: 'text-[10px] px-1.5 py-0.5 rounded-md gap-1',
  md: 'text-xs px-2 py-1 rounded-lg gap-1.5',
};

export function Badge({ variant = 'gold', size = 'md', dot, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-body font-medium whitespace-nowrap',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />
      )}
      {children}
    </span>
  );
}
