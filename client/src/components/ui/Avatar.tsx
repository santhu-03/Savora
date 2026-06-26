import { ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { initials } from '@/lib/utils';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  name?: string;
  size?: AvatarSize;
  status?: 'online' | 'offline' | 'away';
  className?: string;
}

const sizes: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
};

const statusColors = {
  online: 'bg-emerald-500',
  offline: 'bg-charcoal/25',
  away: 'bg-amber-400',
};

const statusSizes: Record<AvatarSize, string> = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-3.5 h-3.5',
};

export function Avatar({ src, name, size = 'md', status, className, alt, ...props }: AvatarProps) {
  const label = name ? initials(name) : '?';

  return (
    <div className={cn('relative inline-flex shrink-0', sizes[size], className)}>
      {src ? (
        <img
          src={src}
          alt={alt ?? name ?? 'avatar'}
          className="w-full h-full object-cover rounded-full border border-gold/15"
          {...props}
        />
      ) : (
        <div
          className="w-full h-full rounded-full bg-primary-gradient flex items-center justify-center font-body font-semibold text-cream select-none"
          aria-label={name ?? 'User avatar'}
        >
          {label}
        </div>
      )}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-cream',
            statusColors[status],
            statusSizes[size]
          )}
        />
      )}
    </div>
  );
}
