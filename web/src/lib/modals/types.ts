'use client';

import React from 'react';

export type ModalPriority = 'P0' | 'P1' | 'P2' | 'P3';

export type ModalType = 
  | 'confirm'
  | 'processing'
  | 'success'
  | 'error'
  | 'warning'
  | 'transaction'
  | 'system'
  | 'custom';

export interface BaseModalConfig {
  id: string;
  type: ModalType;
  priority?: ModalPriority;
  preventCloseOnOverlayClick?: boolean;
  preventCloseOnEsc?: boolean;
  onClose?: () => void;
}

export interface ConfirmModalConfig extends BaseModalConfig {
  type: 'confirm';
  variant?: 'neutral' | 'warning' | 'destructive';
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
}

export interface ProcessingModalConfig extends BaseModalConfig {
  type: 'processing';
  title: string;
  description: string;
  progressPercent?: number;
  estimatedTimeSeconds?: number;
  currentStep?: number;
  totalSteps?: number;
  steps?: string[];
}

export interface SuccessModalConfig extends BaseModalConfig {
  type: 'success';
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  showConfetti?: boolean;
}

export interface ErrorModalConfig extends BaseModalConfig {
  type: 'error';
  title: string;
  description: string;
  technicalDetails?: string;
  retryLabel?: string;
  onRetry?: () => void;
  supportLink?: string;
  reportLabel?: string;
  onReport?: () => void;
}

export interface WarningModalConfig extends BaseModalConfig {
  type: 'warning';
  title: string;
  description: string;
  impactDetails?: string[];
  acknowledgeLabel?: string;
  onAcknowledge: () => void;
}

export type TxStepStatus = 'idle' | 'preparing' | 'signing' | 'pending' | 'success' | 'failed' | 'rejected' | 'expired';

export interface TransactionModalConfig extends BaseModalConfig {
  type: 'transaction';
  txHash?: string;
  stepStatus: TxStepStatus;
  statusMessage?: string;
  gasStatus?: string;
  explorerUrl?: string;
  onRetry?: () => void;
  onViewDetails?: () => void;
}

export interface SystemModalConfig extends BaseModalConfig {
  type: 'system';
  title: string;
  description: string;
  maintenanceWindow?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export interface CustomModalConfig extends BaseModalConfig {
  type: 'custom';
  title?: string;
  render: (onClose: () => void) => React.ReactNode;
}

export type ModalConfig = 
  | ConfirmModalConfig
  | ProcessingModalConfig
  | SuccessModalConfig
  | ErrorModalConfig
  | WarningModalConfig
  | TransactionModalConfig
  | SystemModalConfig
  | CustomModalConfig;

export interface ModalState {
  activeModals: ModalConfig[];
  modalQueue: ModalConfig[];
}
