import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-cream hover:bg-primary-light shadow-sm active:bg-primary',
  secondary:
    'bg-gold text-primary font-semibold hover:bg-gold-dark shadow-sm active:bg-gold',
  outline:
    'border border-gold/40 text-gold hover:bg-gold/10 hover:border-gold/70',
  ghost:
    'text-charcoal/70 hover:text-charcoal hover:bg-primary/[0.06]',
  danger:
    'bg-copper text-cream hover:bg-copper-dark shadow-sm',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3.5 text-xs rounded-lg gap-1.5',
  md: 'h-10 px-5 text-sm rounded-xl gap-2',
  lg: 'h-12 px-7 text-base rounded-xl gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', loading, disabled, children, icon, fullWidth, ...props },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-body font-semibold',
        'transition-all duration-200 active:scale-[0.97]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        fullWidth && 'w-full',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? <Loader2 size={14} className="animate-spin shrink-0" /> : icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  )
);
Button.displayName = 'Button';
