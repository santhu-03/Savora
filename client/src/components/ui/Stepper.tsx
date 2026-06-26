import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Step {
  label: string;
  description?: string;
}

export interface StepperProps {
  steps: Step[];
  current: number;
  className?: string;
}

export function Stepper({ steps, current, className }: StepperProps) {
  return (
    <div className={cn('flex items-start gap-0', className)} role="list">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const upcoming = i > current;
        const isLast = i === steps.length - 1;

        return (
          <div key={step.label} className="flex items-start" role="listitem">
            {/* Step */}
            <div className="flex flex-col items-center">
              {/* Circle */}
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold font-body',
                  'border-2 transition-all duration-300 shrink-0',
                  done && 'bg-primary border-primary text-cream',
                  active && 'bg-cream border-gold text-gold shadow-gold-ring',
                  upcoming && 'bg-cream border-gold/20 text-charcoal/30'
                )}
              >
                {done ? <Check size={14} strokeWidth={2.5} /> : <span>{i + 1}</span>}
              </div>

              {/* Label */}
              <div className="mt-2 text-center min-w-[64px] max-w-[80px]">
                <p
                  className={cn(
                    'font-body text-xs font-medium leading-tight',
                    active ? 'text-charcoal' : done ? 'text-charcoal/60' : 'text-charcoal/30'
                  )}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="font-body text-[10px] text-charcoal/35 mt-0.5">{step.description}</p>
                )}
              </div>
            </div>

            {/* Connector */}
            {!isLast && (
              <div className="relative flex-1 mx-1 mt-4 h-0.5">
                <div className="w-full h-full bg-gold/15 rounded-full" />
                <div
                  className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: done ? '100%' : active ? '50%' : '0%' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
