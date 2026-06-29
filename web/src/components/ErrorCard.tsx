'use client';

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  XCircle, 
  Info, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  RefreshCw, 
  Settings,
  Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types of error severities
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface ErrorCardProps {
  error: any; // Raw error object or string
  title?: string; // Optional override title
  description?: string; // Optional override description
  severity?: ErrorSeverity; // Optional severity level
  onRetry?: () => void; // Optional retry handler
  retryLabel?: string; // Optional custom retry button label (e.g. "Approve Token")
  actionButton?: React.ReactNode; // Custom action button to inject (e.g. Switch Network button)
  supportLink?: string; // Optional support link
  reportLabel?: string; // Optional report button label
  onReport?: () => void; // Optional report handler
}

// Function to clean and parse raw errors into structured user-friendly formats
export function parseError(error: any): {
  title: string;
  description: string;
  severity: ErrorSeverity;
  retryLabel?: string;
  suggestedAction?: 'retry' | 'switch-network' | 'deposit' | 'approve' | 'reconnect';
} {
  if (!error) {
    return {
      title: 'Action Failed',
      description: 'An unexpected issue occurred. Please check and try again.',
      severity: 'error',
    };
  }

  const rawMessage = typeof error === 'string' ? error : error?.message || error?.shortMessage || String(error);
  const message = rawMessage.toLowerCase();
  
  // 1. User Cancelled / Rejected signature
  if (
    message.includes('user rejected') ||
    message.includes('userdeniedsignature') ||
    message.includes('action_rejected') ||
    message.includes('4001') ||
    message.includes('user declined') ||
    message.includes('transaction denied')
  ) {
    return {
      title: 'Transaction Cancelled',
      description: 'You cancelled the transaction before it was confirmed. Nothing has been changed on-chain.',
      severity: 'warning',
      retryLabel: 'Try Again',
      suggestedAction: 'retry'
    };
  }

  // 2. Insufficient balance for Gas or contract
  if (
    message.includes('insufficient funds') ||
    message.includes('exceeds balance') ||
    message.includes('insufficient_funds') ||
    message.includes('exceeds the balance')
  ) {
    return {
      title: 'Insufficient Balance',
      description: "You don't have enough balance to pay for this transaction. Please fund your wallet with USDC/ETH.",
      severity: 'error',
      retryLabel: 'Deposit Funds',
      suggestedAction: 'deposit'
    };
  }

  // 3. Network connection issues
  if (
    message.includes('network error') ||
    message.includes('failed to fetch') ||
    message.includes('enotfound') ||
    message.includes('offline') ||
    message.includes('connection refused')
  ) {
    return {
      title: 'Connection Error',
      description: 'Unable to connect to the blockchain network. Please check your internet connection or try again later.',
      severity: 'critical',
      retryLabel: 'Reconnect',
      suggestedAction: 'reconnect'
    };
  }

  // 4. RPC timeout
  if (message.includes('timeout') || message.includes('took too long') || message.includes('rpc timeout')) {
    return {
      title: 'Network Timeout',
      description: 'The blockchain network took too long to respond. Your wallet signature might still resolve on-chain.',
      severity: 'warning',
      retryLabel: 'Check Status',
      suggestedAction: 'retry'
    };
  }

  // 5. Chain Mismatch / Network Mismatch
  if (
    message.includes('chain mismatch') ||
    message.includes('wrong network') ||
    message.includes('switch chain') ||
    message.includes('unsupported chain') ||
    message.includes('chain id')
  ) {
    return {
      title: 'Wrong Network',
      description: 'Please switch your wallet to the correct blockchain network (Arc Testnet) to submit transactions.',
      severity: 'warning',
      retryLabel: 'Switch Network',
      suggestedAction: 'switch-network'
    };
  }

  // 6. Allowance / Approval Missing
  if (message.includes('allowance') || message.includes('approval required') || message.includes('approve token')) {
    return {
      title: 'Approval Required',
      description: 'Your wallet approval transaction is missing or was not completed. No funds have been transferred.',
      severity: 'warning',
      retryLabel: 'Approve Token',
      suggestedAction: 'approve'
    };
  }

  // 7. Nonce / Out of Sync
  if (message.includes('nonce too low') || message.includes('nonce') || message.includes('out of sync')) {
    return {
      title: 'Wallet Out of Sync',
      description: 'Your wallet transactions are out of sequence. Please try again to refresh your wallet nonce.',
      severity: 'error',
      retryLabel: 'Sync Wallet',
      suggestedAction: 'retry'
    };
  }

  // 8. Replacement Underpriced (Pending)
  if (message.includes('replacement transaction underpriced') || message.includes('already pending')) {
    return {
      title: 'Transaction Pending',
      description: 'You already have a similar transaction waiting in the mempool. Please wait or speed it up in your wallet.',
      severity: 'info',
      retryLabel: 'Retry Transaction',
      suggestedAction: 'retry'
    };
  }

  // 9. Smart Contract Revert Rules
  if (message.includes('execution reverted') || message.includes('revert')) {
    // Custom Smart Contract revert messages
    if (message.includes('not verified')) {
      return {
        title: 'Crop Verification Required',
        description: 'The smart contract rejected this transaction because the crop batch has not received a verified assay certificate.',
        severity: 'error',
      };
    }
    if (message.includes('escrow active')) {
      return {
        title: 'Escrow Is Active',
        description: 'The crop NFT is locked inside an active trade escrow contract and cannot be moved.',
        severity: 'error',
      };
    }
    return {
      title: 'Transaction Failed',
      description: 'The smart contract rejected this transaction. The network state might have changed during execution.',
      severity: 'error',
      retryLabel: 'Try Again',
      suggestedAction: 'retry'
    };
  }

  // 10. Gas Estimation failures
  if (message.includes('gas required exceeds allowance') || message.includes('unpredictable gas limit')) {
    return {
      title: 'Gas Estimation Failed',
      description: "The network couldn't estimate the gas required. The contract execution might fail if submitted.",
      severity: 'error',
      retryLabel: 'Force Retry',
      suggestedAction: 'retry'
    };
  }

  // Fallback default error
  return {
    title: 'Operation Failed',
    description: 'An unexpected smart contract or network error occurred. Click below to retry.',
    severity: 'error',
    retryLabel: 'Try Again',
    suggestedAction: 'retry'
  };
}

export default function ErrorCard({
  error,
  title: overrideTitle,
  description: overrideDescription,
  severity: overrideSeverity,
  onRetry,
  retryLabel: overrideRetryLabel,
  actionButton,
  supportLink,
  reportLabel,
  onReport,
}: ErrorCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  // Parse error parameters
  const parsed = parseError(error);
  const title = overrideTitle || parsed.title;
  const description = overrideDescription || parsed.description;
  const severity = overrideSeverity || parsed.severity;
  const retryLabel = overrideRetryLabel || parsed.retryLabel;

  // Retrieve technical properties from raw error object if they exist
  const getTechnicalDetails = () => {
    if (!error) return 'No technical information available.';
    if (typeof error === 'string') return error;

    const details: Record<string, any> = {
      message: error.message || String(error),
      name: error.name || 'Error',
      code: error.code || error.cause?.code,
    };

    // Wagmi / Viem structures
    if (error.shortMessage) details.shortMessage = error.shortMessage;
    if (error.details) details.details = error.details;
    if (error.version) details.viemVersion = error.version;
    if (error.cause) details.cause = error.cause.message || String(error.cause);

    // Contract call details
    if (error.contractAddress || error.address) details.contractAddress = error.contractAddress || error.address;
    if (error.methodName || error.functionName) details.method = error.methodName || error.functionName;
    if (error.args) details.arguments = JSON.stringify(error.args);
    if (error.sender) details.sender = error.sender;
    
    // Stack and traces
    if (error.stack) details.stackTrace = error.stack;

    return Object.entries(details)
      .map(([k, v]) => `${k.toUpperCase()}:\n${v}`)
      .join('\n\n');
  };

  const handleCopy = () => {
    const details = getTechnicalDetails();
    navigator.clipboard.writeText(details);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Color Styles mapping based on severity (Stripe/Linear style - soft backgrounds)
  const severityStyles = {
    info: {
      bg: 'bg-blue-50/60 border-blue-150/60 text-blue-800',
      icon: Info,
      iconColor: 'text-blue-500',
    },
    warning: {
      bg: 'bg-amber-50/60 border-amber-150/60 text-amber-900',
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
    },
    error: {
      bg: 'bg-rose-50/60 border-rose-150/60 text-rose-900',
      icon: AlertCircle,
      iconColor: 'text-rose-500',
    },
    critical: {
      bg: 'bg-red-50 border-red-200 text-red-900',
      icon: XCircle,
      iconColor: 'text-red-600',
    }
  };

  const currentStyle = severityStyles[severity] || severityStyles.error;
  const Icon = currentStyle.icon;

  return (
    <div className={`border rounded-2xl p-4 sm:p-5 shadow-sm transition-all duration-200 ${currentStyle.bg} w-full`}>
      <div className="flex items-start gap-4">
        {/* Severity Icon */}
        <div className="shrink-0 p-1 mt-0.5 rounded-lg">
          <Icon className={`w-5 h-5 ${currentStyle.iconColor}`} />
        </div>

        {/* Text Details */}
        <div className="flex-1 space-y-1 text-left min-w-0">
          <h4 className="font-extrabold text-sm text-slate-950 tracking-tight">
            {title}
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {description}
          </p>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            {/* Action buttons (Retry / Suggested Action) */}
            {actionButton ? (
              actionButton
            ) : (
              onRetry && retryLabel && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="h-8 px-4 bg-slate-950 hover:bg-slate-900 text-white rounded-lg text-[10px] font-bold tracking-wider uppercase transition shadow-sm flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3 animate-spin-hover" />
                  {retryLabel}
                </button>
              )
            )}

            {supportLink && (
              <a
                href={supportLink}
                target="_blank"
                rel="noreferrer"
                className="h-8 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold uppercase transition flex items-center gap-1.5"
              >
                <LinkIcon className="w-3 h-3 text-slate-500" />
                Contact Support
              </a>
            )}

            {onReport && reportLabel && (
              <button
                type="button"
                onClick={onReport}
                className="h-8 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold uppercase transition flex items-center gap-1.5"
              >
                <Settings className="w-3 h-3 text-slate-500 animate-spin-hover" />
                {reportLabel}
              </button>
            )}

            {/* Technical Accordion Trigger */}
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="h-8 px-3 text-slate-400 hover:text-slate-600 rounded-lg text-[10px] font-bold uppercase transition flex items-center gap-1 focus:outline-none"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Technical Details
                </>
              )}
            </button>
          </div>

          {/* Technical Details Accordion */}
          <AnimatePresence initial={false}>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <div className="mt-4 border-t border-slate-200/50 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                      Developer Console Logs
                    </span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-md text-[9px] font-bold font-mono transition shadow-sm cursor-pointer select-none"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Full Error</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="bg-slate-900 border border-slate-950 p-3 rounded-xl font-mono text-[9px] text-slate-300 leading-relaxed overflow-x-auto select-all max-h-40 max-w-full">
                    {getTechnicalDetails()}
                  </pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
