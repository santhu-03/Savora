import { forwardRef, SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, placeholder, id, ...props }, ref) => {
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
          <select
            ref={ref}
            id={inputId}
            className={cn(
              'w-full appearance-none bg-white border text-charcoal font-body text-sm',
              'rounded-xl px-4 py-2.5 pr-9 cursor-pointer',
              'transition-all duration-150 outline-none',
              'focus:ring-1 focus:ring-gold/50 focus:border-gold/60',
              error
                ? 'border-copper/60 focus:ring-copper/40'
                : 'border-gold/20 hover:border-gold/35',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map(opt => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={15}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 pointer-events-none"
          />
        </div>
        {error && <p className="mt-1 font-body text-xs text-copper">{error}</p>}
        {!error && hint && <p className="mt-1 font-body text-xs text-charcoal/40">{hint}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
