'use client';

import React from 'react';
import BaseModal from './BaseModal';
import { ShieldAlert, Compass } from 'lucide-react';

interface SystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  maintenanceWindow?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function SystemModal({
  isOpen,
  onClose,
  title,
  description,
  maintenanceWindow,
  actionLabel,
  onAction,
}: SystemModalProps) {

  const handleAction = () => {
    if (onAction) onAction();
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
        {/* System Alert Icon */}
        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-650 mb-4 inline-block animate-pulse-slow">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <p className="text-sm text-slate-650 leading-relaxed mb-4">
          {description}
        </p>

        {maintenanceWindow && (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
              Scheduled Period
            </span>
            <span className="text-xs font-semibold text-slate-800 font-mono">
              {maintenanceWindow}
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-end border-t border-slate-100 pt-4">
          {actionLabel && (
            <button
              type="button"
              onClick={handleAction}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              {actionLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
