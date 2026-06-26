import { cn } from '@/lib/utils';

export interface SkeletonProps {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

const roundings = {
  sm: 'rounded',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  full: 'rounded-full',
};

export function Skeleton({ className, rounded = 'lg' }: SkeletonProps) {
  return (
    <div
      className={cn('shimmer', roundings[rounded], className)}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gold/10 shadow-card p-5 space-y-3">
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="flex gap-3 p-4 bg-white rounded-xl border border-gold/10">
      <Skeleton className="w-12 h-12 shrink-0" rounded="lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
