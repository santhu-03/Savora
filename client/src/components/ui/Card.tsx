import { HTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  children: ReactNode;
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-7',
};

export function Card({ hover = true, padding = 'md', border = true, children, className, ...props }: CardProps) {
  const base = cn(
    'bg-white rounded-2xl shadow-card',
    border && 'border border-gold/10',
    paddings[padding],
    className
  );

  if (hover) {
    return (
      <motion.div
        whileHover={{ y: -3, boxShadow: '0 12px 40px rgba(38,11,16,0.12)' }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className={base}
        {...(props as Parameters<typeof motion.div>[0])}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={base} {...props}>
      {children}
    </div>
  );
}
