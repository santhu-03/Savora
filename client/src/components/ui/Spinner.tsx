import { cn } from '@/lib/utils';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';

export interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  label?: string;
}

const sizes: Record<SpinnerSize, string> = {
  xs: 'w-3 h-3 border',
  sm: 'w-4 h-4 border',
  md: 'w-6 h-6 border-2',
  lg: 'w-9 h-9 border-2',
};

export function Spinner({ size = 'md', className, label = 'Loading…' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-block rounded-full border-gold/25 border-t-gold animate-spin',
        sizes[size],
        className
      )}
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-cream/80 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="font-body text-sm text-charcoal/50">Loading…</p>
      </div>
    </div>
  );
}
