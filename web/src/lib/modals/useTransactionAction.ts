'use client';

import { useModal } from './store';
import { mapRawError } from './errorMapper';

interface TxActionParams {
  id: string;
  title: string;
  successMessage?: string;
  action: () => Promise<string | `0x${string}`>;
  onSuccess?: (txHash: string) => void | Promise<void>;
  onFailure?: (error: any) => void;
}

export function useTransactionAction() {
  const { openModal } = useModal();

  const runTransaction = async ({
    id,
    title,
    successMessage,
    action,
    onSuccess,
    onFailure,
  }: TxActionParams) => {
    // 1. Preparing state
    openModal({
      id,
      type: 'transaction',
      stepStatus: 'preparing',
      statusMessage: `Preparing parameters for ${title.toLowerCase()}...`,
    });

    try {
      // 2. Signing state
      openModal({
        id,
        type: 'transaction',
        stepStatus: 'signing',
        statusMessage: 'Please approve the transaction signature request in your wallet extension.',
      });

      const txHash = await action();

      // 3. Pending / Confirming state
      openModal({
        id,
        type: 'transaction',
        txHash,
        stepStatus: 'pending',
        statusMessage: 'Transaction broadcasted. Waiting for network block confirmation...',
        explorerUrl: 'https://testnet.arcscan.app',
      });

      if (onSuccess) {
        await onSuccess(txHash);
      }

      // 4. Success state
      openModal({
        id,
        type: 'transaction',
        txHash,
        stepStatus: 'success',
        statusMessage: successMessage || `${title} completed successfully!`,
        explorerUrl: 'https://testnet.arcscan.app',
      });

      return txHash;
    } catch (err: any) {
      console.error('Tx action failed:', err);
      const mapped = mapRawError(err);
      
      openModal({
        id: `${id}-error`,
        type: 'error',
        title: mapped.title,
        description: mapped.description,
        technicalDetails: mapped.technicalDetails,
        retryLabel: mapped.retryable ? 'Try Again' : undefined,
        onRetry: mapped.retryable 
          ? () => runTransaction({ id, title, successMessage, action, onSuccess, onFailure })
          : undefined,
      });

      if (onFailure) {
        onFailure(err);
      }
      throw err;
    }
  };

  return { runTransaction };
}
