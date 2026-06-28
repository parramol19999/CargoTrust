'use client';

import React from 'react';
import { useModal } from '@/lib/modals/store';
import {
  ConfirmModalConfig,
  ProcessingModalConfig,
  SuccessModalConfig,
  ErrorModalConfig,
  WarningModalConfig,
  TransactionModalConfig,
  SystemModalConfig,
  CustomModalConfig,
} from '@/lib/modals/types';
import ConfirmationModal from './ConfirmationModal';
import ProcessingModal from './ProcessingModal';
import SuccessModal from './SuccessModal';
import ErrorModal from './ErrorModal';
import WarningModal from './WarningModal';
import TransactionModal from './TransactionModal';
import SystemModal from './SystemModal';
import BaseModal from './BaseModal';

export default function ModalManagerRenderer() {
  const { activeModals, closeModal } = useModal();

  if (activeModals.length === 0) return null;

  return (
    <>
      {activeModals.map((modal) => {
        const handleClose = () => closeModal(modal.id);

        switch (modal.type) {
          case 'confirm': {
            const m = modal as ConfirmModalConfig;
            return (
              <ConfirmationModal
                key={m.id}
                isOpen={true}
                onClose={handleClose}
                title={m.title}
                description={m.description}
                variant={m.variant}
                confirmLabel={m.confirmLabel}
                cancelLabel={m.cancelLabel}
                onConfirm={m.onConfirm}
              />
            );
          }

          case 'processing': {
            const m = modal as ProcessingModalConfig;
            return (
              <ProcessingModal
                key={m.id}
                isOpen={true}
                title={m.title}
                description={m.description}
                progressPercent={m.progressPercent}
                estimatedTimeSeconds={m.estimatedTimeSeconds}
                currentStep={m.currentStep}
                totalSteps={m.totalSteps}
                steps={m.steps}
              />
            );
          }

          case 'success': {
            const m = modal as SuccessModalConfig;
            return (
              <SuccessModal
                key={m.id}
                isOpen={true}
                onClose={handleClose}
                title={m.title}
                description={m.description}
                actionLabel={m.actionLabel}
                onAction={m.onAction}
                secondaryActionLabel={m.secondaryActionLabel}
                onSecondaryAction={m.onSecondaryAction}
                showConfetti={m.showConfetti}
              />
            );
          }

          case 'error': {
            const m = modal as ErrorModalConfig;
            return (
              <ErrorModal
                key={m.id}
                isOpen={true}
                onClose={handleClose}
                title={m.title}
                description={m.description}
                technicalDetails={m.technicalDetails}
                retryLabel={m.retryLabel}
                onRetry={m.onRetry}
                supportLink={m.supportLink}
                reportLabel={m.reportLabel}
                onReport={m.onReport}
              />
            );
          }

          case 'warning': {
            const m = modal as WarningModalConfig;
            return (
              <WarningModal
                key={m.id}
                isOpen={true}
                onClose={handleClose}
                title={m.title}
                description={m.description}
                impactDetails={m.impactDetails}
                acknowledgeLabel={m.acknowledgeLabel}
                onAcknowledge={m.onAcknowledge}
              />
            );
          }

          case 'transaction': {
            const m = modal as TransactionModalConfig;
            return (
              <TransactionModal
                key={m.id}
                isOpen={true}
                onClose={handleClose}
                txHash={m.txHash}
                stepStatus={m.stepStatus}
                statusMessage={m.statusMessage}
                gasStatus={m.gasStatus}
                explorerUrl={m.explorerUrl}
                onRetry={m.onRetry}
                onViewDetails={m.onViewDetails}
              />
            );
          }

          case 'system': {
            const m = modal as SystemModalConfig;
            return (
              <SystemModal
                key={m.id}
                isOpen={true}
                onClose={handleClose}
                title={m.title}
                description={m.description}
                maintenanceWindow={m.maintenanceWindow}
                actionLabel={m.actionLabel}
                onAction={m.onAction}
              />
            );
          }

          case 'custom': {
            const m = modal as CustomModalConfig;
            return (
              <BaseModal
                key={m.id}
                isOpen={true}
                onClose={handleClose}
                title={m.title || 'Action Required'}
                preventCloseOnOverlayClick={m.preventCloseOnOverlayClick}
                preventCloseOnEsc={m.preventCloseOnEsc}
              >
                {m.render(handleClose)}
              </BaseModal>
            );
          }

          default:
            return null;
        }
      })}
    </>
  );
}
