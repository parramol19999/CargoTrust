'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import ModalPortal from './ModalPortal';
import ModalOverlay from './ModalOverlay';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  preventCloseOnOverlayClick?: boolean;
  preventCloseOnEsc?: boolean;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

const MAX_WIDTH_MAP = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export default function BaseModal({
  isOpen,
  onClose,
  title,
  preventCloseOnOverlayClick = false,
  preventCloseOnEsc = false,
  children,
  maxWidth = 'md',
}: BaseModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  // Keyboard navigation & Esc handler
  useEffect(() => {
    if (!isOpen) return;

    // Track active element to restore later
    if (typeof window !== 'undefined') {
      previousFocus.current = document.activeElement as HTMLElement;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !preventCloseOnEsc) {
        onClose();
      }

      // Simple focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Set focus on container on mount
    modalRef.current?.focus();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Restore previous focus
      previousFocus.current?.focus();
    };
  }, [isOpen, preventCloseOnEsc, onClose]);

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <ModalOverlay onClick={preventCloseOnOverlayClick ? undefined : onClose}>
        <motion.div
          ref={modalRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={`w-full ${MAX_WIDTH_MAP[maxWidth]} bg-white border border-slate-200/80 rounded-[24px] shadow-2xl p-6 relative overflow-hidden focus:outline-none`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 id="modal-title" className="text-base font-bold text-slate-900 tracking-tight">
              {title}
            </h3>
            {!preventCloseOnEsc && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Body content */}
          <div className="relative z-10">{children}</div>
        </motion.div>
      </ModalOverlay>
    </ModalPortal>
  );
}
