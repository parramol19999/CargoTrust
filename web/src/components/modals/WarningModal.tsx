'use client';

import React, { useState } from 'react';
import BaseModal from './BaseModal';
import { AlertCircle, AlertTriangle } from 'lucide-react';

interface WarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  impactDetails?: string[];
  acknowledgeLabel?: string;
  onAcknowledge: () => void;
}

export default function WarningModal({
  isOpen,
  onClose,
  title,
  description,
  impactDetails = [],
  acknowledgeLabel = 'I Understand, Proceed',
  onAcknowledge,
}: WarningModalProps) {
  const [isChecked, setIsChecked] = useState(false);

  const handleAcknowledge = () => {
    if (!isChecked) return;
    onAcknowledge();
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="md"
    >
      <div className="text-center sm:text-left">
        {/* Warning Badge */}
        <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl text-amber-650 mb-4 inline-block">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <p className="text-sm text-slate-650 leading-relaxed mb-4">
          {description}
        </p>

        {/* Impact points */}
        {impactDetails.length > 0 && (
          <div className="bg-amber-50/50 border border-amber-100/60 rounded-2xl p-4 mb-5 text-left text-xs text-amber-900 leading-relaxed">
            <span className="font-bold block mb-1">Important Consequences:</span>
            <ul className="list-disc pl-4 space-y-1.5 font-sans font-medium text-slate-700">
              {impactDetails.map((detail, idx) => (
                <li key={idx}>{detail}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Irreversible Confirmation Checkbox */}
        <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl mb-6 text-left">
          <input
            type="checkbox"
            id="acknowledge-checkbox"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
          />
          <label
            htmlFor="acknowledge-checkbox"
            className="text-xs font-semibold text-slate-600 select-none cursor-pointer leading-tight"
          >
            I confirm that I have read the consequences and accept full responsibility for this action.
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-end border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isChecked}
            onClick={handleAcknowledge}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {acknowledgeLabel}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
