'use client';

import React, { useState } from 'react';
import BaseModal from './BaseModal';
import { ShieldX, ChevronDown, ChevronUp, AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  technicalDetails?: string;
  retryLabel?: string;
  onRetry?: () => void;
  supportLink?: string;
  reportLabel?: string;
  onReport?: () => void;
}

export default function ErrorModal({
  isOpen,
  onClose,
  title,
  description,
  technicalDetails,
  retryLabel,
  onRetry,
  supportLink,
  reportLabel,
  onReport,
}: ErrorModalProps) {
  const [showTechnical, setShowTechnical] = useState(false);

  const handleRetry = () => {
    if (onRetry) onRetry();
    onClose();
  };

  const handleReport = () => {
    if (onReport) onReport();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="sm"
    >
      <div className="text-center sm:text-left">
        {/* Error Badge */}
        <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 mb-4 inline-block">
          <ShieldX className="w-8 h-8" />
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          {description}
        </p>

        {/* Technical Details Accordion */}
        {technicalDetails && (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowTechnical(!showTechnical)}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-xs font-semibold focus:outline-none transition-colors"
            >
              {showTechnical ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  Hide Technical Details
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  Show Technical Details
                </>
              )}
            </button>

            {showTechnical && (
              <div className="mt-2 bg-slate-50 border border-slate-100 rounded-xl p-3 text-left font-mono text-[10px] text-slate-500 overflow-x-auto max-h-32">
                {technicalDetails}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-end border-t border-slate-100 pt-4">
          {onReport && (
            <button
              type="button"
              onClick={handleReport}
              className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              {reportLabel || 'Report Issue'}
            </button>
          )}

          {onRetry && (
            <button
              type="button"
              onClick={handleRetry}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {retryLabel || 'Try Again'}
            </button>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
