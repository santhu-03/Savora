import { useState, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  placement?: TooltipPlacement;
  delay?: number;
  className?: string;
}

const placements: Record<TooltipPlacement, { tip: string; arrow: string }> = {
  top: {
    tip: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    arrow: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-charcoal',
  },
  bottom: {
    tip: 'top-full left-1/2 -translate-x-1/2 mt-2',
    arrow: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-charcoal',
  },
  left: {
    tip: 'right-full top-1/2 -translate-y-1/2 mr-2',
    arrow: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-charcoal',
  },
  right: {
    tip: 'left-full top-1/2 -translate-y-1/2 ml-2',
    arrow: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-charcoal',
  },
};

export function Tooltip({ content, children, placement = 'top', delay = 300, className }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const show = () => { timerRef.current = setTimeout(() => setVisible(true), delay); };
  const hide = () => { clearTimeout(timerRef.current); setVisible(false); };

  return (
    <div className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.12 }}
            role="tooltip"
            className={cn(
              'absolute z-50 pointer-events-none',
              placements[placement].tip
            )}
          >
            <div
              className={cn(
                'bg-charcoal text-cream text-xs font-body px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg max-w-[200px]',
                className
              )}
            >
              {content}
            </div>
            <span
              className={cn(
                'absolute w-0 h-0 border-4',
                placements[placement].arrow
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
