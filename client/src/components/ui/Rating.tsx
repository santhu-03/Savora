import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RatingProps {
  value: number;
  max?: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  count?: number;
  className?: string;
}

const starSizes = { sm: 12, md: 16, lg: 20 };

export function Rating({ value, max = 5, onChange, size = 'md', showCount, count, className }: RatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const interactive = !!onChange;
  const display = hovered ?? value;

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <div
        className={cn('flex items-center gap-0.5', interactive && 'cursor-pointer')}
        onMouseLeave={() => setHovered(null)}
      >
        {Array.from({ length: max }, (_, i) => {
          const filled = i + 1 <= display;
          return (
            <Star
              key={i}
              size={starSizes[size]}
              className={cn(
                'transition-colors duration-100',
                filled ? 'fill-gold text-gold' : 'fill-none text-gold/25',
                interactive && 'hover:text-gold hover:fill-gold'
              )}
              onMouseEnter={() => interactive && setHovered(i + 1)}
              onClick={() => onChange?.(i + 1)}
              aria-label={`Rate ${i + 1} of ${max}`}
            />
          );
        })}
      </div>
      {showCount && count !== undefined && (
        <span className="font-body text-xs text-charcoal/45 ml-0.5">({count})</span>
      )}
    </div>
  );
}
