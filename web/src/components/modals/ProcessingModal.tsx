'use client';

import React from 'react';
import BaseModal from './BaseModal';
import { Loader2, CheckCircle2, Circle } from 'lucide-react';

interface ProcessingModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  progressPercent?: number;
  estimatedTimeSeconds?: number;
  currentStep?: number;
  totalSteps?: number;
  steps?: string[];
}

export default function ProcessingModal({
  isOpen,
  title,
  description,
  progressPercent,
  estimatedTimeSeconds,
  currentStep = 0,
  totalSteps,
  steps = [],
}: ProcessingModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => {}} // Processing cannot be closed manually
      title={title}
      preventCloseOnOverlayClick={true}
      preventCloseOnEsc={true}
      maxWidth="md"
    >
      <div className="flex flex-col items-center py-4 text-center">
        {/* Loading Spinner */}
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-full border-4 border-slate-100 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-slate-900 animate-spin" />
          </div>
          {progressPercent !== undefined && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-bold text-slate-700 font-mono">
                {progressPercent}%
              </span>
            </div>
          )}
        </div>

        <p className="text-sm text-slate-600 mb-4 max-w-sm leading-relaxed">
          {description}
        </p>

        {/* Progress Bar */}
        {progressPercent !== undefined && (
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4">
            <div
              className="bg-slate-900 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Time Estimation */}
        {estimatedTimeSeconds !== undefined && estimatedTimeSeconds > 0 && (
          <span className="text-xs text-slate-400 font-mono mb-6">
            Estimated time remaining: ~{estimatedTimeSeconds}s
          </span>
        )}

        {/* Steps List */}
        {steps.length > 0 && (
          <div className="w-full text-left bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3 font-sans mt-2">
            <h4 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">
              Operation Progress
            </h4>
            {steps.map((step, idx) => {
              const isActive = idx === currentStep;
              const isCompleted = idx < currentStep;

              return (
                <div key={idx} className="flex items-center gap-3">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : isActive ? (
                    <Loader2 className="w-4 h-4 text-slate-900 animate-spin shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                  <span
                    className={`text-xs font-semibold ${
                      isActive
                        ? 'text-slate-900 font-bold'
                        : isCompleted
                        ? 'text-slate-400 line-through'
                        : 'text-slate-400'
                    }`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </BaseModal>
  );
}
