'use client';

import React, { useEffect } from 'react';
import BaseModal from './BaseModal';
import { CheckCircle2, ArrowRight } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  showConfetti?: boolean;
}

export default function SuccessModal({
  isOpen,
  onClose,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  showConfetti = false,
}: SuccessModalProps) {

  const handleAction = () => {
    if (onAction) onAction();
    onClose();
  };

  const handleSecondaryAction = () => {
    if (onSecondaryAction) onSecondaryAction();
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="sm"
    >
      <div className="text-center sm:text-left">
        {/* Animated Checkmark */}
        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 mb-4 inline-block">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          {description}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-end border-t border-slate-100 pt-4">
          {secondaryActionLabel && (
            <button
              type="button"
              onClick={handleSecondaryAction}
              className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              {secondaryActionLabel}
            </button>
          )}
          <button
            type="button"
            onClick={handleAction}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            {actionLabel || 'Continue'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
