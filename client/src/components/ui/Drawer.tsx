import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: string;
  footer?: ReactNode;
  className?: string;
}

export function Drawer({ open, onClose, title, children, width = 'w-full sm:w-[420px]', footer, className }: DrawerProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-primary/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'relative z-10 flex flex-col h-full bg-cream shadow-card-hover',
              width,
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gold/10 shrink-0">
              {title && (
                <h2 className="font-heading text-xl font-semibold text-charcoal">{title}</h2>
              )}
              <button
                onClick={onClose}
                className="ml-auto flex items-center justify-center w-8 h-8 rounded-lg text-charcoal/40 hover:text-charcoal hover:bg-gold/10 transition-colors"
                aria-label="Close drawer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="shrink-0 px-5 py-4 border-t border-gold/10 bg-cream">{footer}</div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
