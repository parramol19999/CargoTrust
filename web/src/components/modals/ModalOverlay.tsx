'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ModalOverlayProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export default function ModalOverlay({ children, onClick }: ModalOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClick) {
          onClick();
        }
      }}
    >
      {children}
    </motion.div>
  );
}
