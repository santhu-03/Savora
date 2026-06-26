import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: ModalSize;
  hideClose?: boolean;
  className?: string;
}

const sizes: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-4xl',
};

export function Modal({ open, onClose, title, children, size = 'md', hideClose, className }: ModalProps) {
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-primary/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'relative z-10 w-full bg-cream rounded-2xl shadow-card-hover overflow-hidden',
              sizes[size],
              className
            )}
          >
            {/* Header */}
            {(title || !hideClose) && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-gold/10">
                {title && (
                  <h2 className="font-heading text-xl font-semibold text-charcoal">{title}</h2>
                )}
                {!hideClose && (
                  <button
                    onClick={onClose}
                    className="ml-auto flex items-center justify-center w-8 h-8 rounded-lg text-charcoal/40 hover:text-charcoal hover:bg-gold/10 transition-colors"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}
            <div className="overflow-y-auto max-h-[80vh]">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
