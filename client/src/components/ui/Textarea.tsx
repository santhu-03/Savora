import { forwardRef, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
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
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full bg-white border text-charcoal font-body text-sm',
            'rounded-xl px-4 py-3 placeholder-charcoal/30 resize-none',
            'transition-all duration-150 outline-none',
            'focus:ring-1 focus:ring-gold/50 focus:border-gold/60',
            error
              ? 'border-copper/60 focus:ring-copper/40 focus:border-copper/60'
              : 'border-gold/20 hover:border-gold/35',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 font-body text-xs text-copper">{error}</p>}
        {!error && hint && <p className="mt-1 font-body text-xs text-charcoal/40">{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
