'use client';

import React, { useState } from 'react';
import BaseModal from './BaseModal';
import { AlertTriangle, Trash2, ShieldAlert, Loader2 } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  variant?: 'neutral' | 'warning' | 'destructive';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  title,
  description,
  variant = 'neutral',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
}: ConfirmationModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Select header color scheme and icon based on variant
  const getIcon = () => {
    switch (variant) {
      case 'destructive':
        return (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 mb-4 inline-block">
            <Trash2 className="w-6 h-6" />
          </div>
        );
      case 'warning':
        return (
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl text-amber-600 mb-4 inline-block">
            <AlertTriangle className="w-6 h-6" />
          </div>
        );
      default:
        return (
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-600 mb-4 inline-block">
            <ShieldAlert className="w-6 h-6" />
          </div>
        );
    }
  };

  const getButtonStyles = () => {
    switch (variant) {
      case 'destructive':
        return 'bg-rose-600 hover:bg-rose-500 focus:ring-rose-500 text-white';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-500 focus:ring-amber-500 text-white';
      default:
        return 'bg-slate-900 hover:bg-slate-800 focus:ring-slate-900 text-white';
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      title={title}
      preventCloseOnOverlayClick={loading}
      preventCloseOnEsc={loading}
      maxWidth="sm"
    >
      <div className="text-center sm:text-left">
        {getIcon()}
        
        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          {description}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-end border-t border-slate-100 pt-4">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleConfirm}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${getButtonStyles()} disabled:opacity-50`}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
