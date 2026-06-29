'use client';

import React from 'react';
import BaseModal from './BaseModal';
import ErrorCard, { ErrorSeverity } from '../ErrorCard';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  technicalDetails?: string;
  retryLabel?: string;
  onRetry?: () => void;
  severity?: ErrorSeverity;
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
  severity = 'error',
  supportLink,
  reportLabel,
  onReport,
}: ErrorModalProps) {
  const handleRetry = () => {
    if (onRetry) onRetry();
    onClose();
  };

  const handleReport = () => {
    if (onReport) onReport();
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Operation Error"
      maxWidth="sm"
    >
      <div className="py-2">
        <ErrorCard
          error={technicalDetails || description}
          title={title}
          description={description}
          severity={severity}
          retryLabel={retryLabel}
          onRetry={onRetry ? handleRetry : undefined}
          supportLink={supportLink}
          reportLabel={reportLabel}
          onReport={onReport ? handleReport : undefined}
        />
      </div>
    </BaseModal>
  );
}
