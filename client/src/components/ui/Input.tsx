import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block font-body text-xs font-medium text-charcoal/60 uppercase tracking-wider mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/35 pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full bg-white border text-charcoal font-body text-sm',
              'rounded-xl px-4 py-2.5 placeholder-charcoal/30',
              'transition-all duration-150 outline-none',
              'focus:ring-1 focus:ring-gold/50 focus:border-gold/60',
              error
                ? 'border-copper/60 focus:ring-copper/40 focus:border-copper/60'
                : 'border-gold/20 hover:border-gold/35',
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/35">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="mt-1 font-body text-xs text-copper">{error}</p>}
        {!error && hint && <p className="mt-1 font-body text-xs text-charcoal/40">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
