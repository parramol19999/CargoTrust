'use client';

import React from 'react';
import BaseModal from './BaseModal';
import { TxStepStatus } from '@/lib/modals/types';
import { Loader2, CheckCircle2, AlertCircle, Compass, FileText, ArrowRightLeft } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  txHash?: string;
  stepStatus: TxStepStatus;
  statusMessage?: string;
  gasStatus?: string;
  explorerUrl?: string;
  onRetry?: () => void;
  onViewDetails?: () => void;
}

export default function TransactionModal({
  isOpen,
  onClose,
  txHash,
  stepStatus,
  statusMessage,
  gasStatus,
  explorerUrl,
  onRetry,
  onViewDetails,
}: TransactionModalProps) {

  // Select UI based on status
  const getStatusConfig = () => {
    switch (stepStatus) {
      case 'signing':
        return {
          icon: <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />,
          bgColor: 'bg-cyan-50 border-cyan-100',
          title: 'Awaiting Signature',
          desc: statusMessage || 'Please approve and sign the transaction prompt in your wallet extension.',
        };
      case 'pending':
        return {
          icon: <Loader2 className="w-8 h-8 text-slate-700 animate-spin" />,
          bgColor: 'bg-slate-50 border-slate-100',
          title: 'Transaction Pending',
          desc: statusMessage || 'Broadcasting payload and waiting for on-chain block confirmation...',
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="w-8 h-8 text-emerald-600" />,
          bgColor: 'bg-emerald-50 border-emerald-100',
          title: 'Transaction Confirmed',
          desc: statusMessage || 'The settlement operation has successfully resolved on-chain.',
        };
      case 'failed':
      case 'rejected':
      case 'expired':
        return {
          icon: <AlertCircle className="w-8 h-8 text-rose-600" />,
          bgColor: 'bg-rose-50 border-rose-100',
          title: stepStatus === 'rejected' ? 'Transaction Cancelled' : 'Transaction Failed',
          desc: statusMessage || 'The blockchain transaction was rejected or execution failed.',
        };
      default:
        return {
          icon: <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />,
          bgColor: 'bg-slate-50 border-slate-100',
          title: 'Preparing Transaction',
          desc: statusMessage || 'Initializing and calculating transaction parameters...',
        };
    }
  };

  const config = getStatusConfig();
  const showCloseButton = ['success', 'failed', 'rejected', 'expired'].includes(stepStatus);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={showCloseButton ? onClose : () => {}}
      title={config.title}
      preventCloseOnOverlayClick={!showCloseButton}
      preventCloseOnEsc={!showCloseButton}
      maxWidth="sm"
    >
      <div className="text-center sm:text-left">
        {/* Status Icon */}
        <div className={`p-3 border rounded-2xl mb-4 inline-block ${config.bgColor}`}>
          {config.icon}
        </div>

        <p className="text-sm text-slate-650 leading-relaxed mb-6">
          {config.desc}
        </p>

        {/* Transaction Metadata Info */}
        {(txHash || gasStatus) && (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 w-full text-left text-xs font-mono text-slate-500 space-y-2 mb-6">
            {txHash && (
              <div className="flex justify-between items-center gap-4">
                <span>Transaction Hash:</span>
                <span className="text-slate-900 font-semibold overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px]">
                  {txHash}
                </span>
              </div>
            )}
            {gasStatus && (
              <div className="flex justify-between items-center">
                <span>Gas Status:</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  {gasStatus}
                </span>
              </div>
            )}
            {explorerUrl && txHash && (
              <div className="flex justify-end pt-2 border-t border-slate-200 mt-2 font-sans">
                <a
                  href={`${explorerUrl}/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-600 hover:text-cyan-500 hover:underline flex items-center gap-1 text-[11px] font-semibold"
                >
                  <Compass className="w-3.5 h-3.5" />
                  View on ArcScan
                </a>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end border-t border-slate-100 pt-4">
          {stepStatus === 'failed' && onRetry && (
            <button
              type="button"
              onClick={() => {
                onRetry();
                onClose();
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Retry Transaction
            </button>
          )}

          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
