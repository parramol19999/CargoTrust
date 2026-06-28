'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ModalConfig, ModalPriority } from './types';

interface ModalContextType {
  activeModals: ModalConfig[];
  modalQueue: ModalConfig[];
  openModal: (config: ModalConfig) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  replaceModal: (id: string, newConfig: ModalConfig) => void;
  queueModal: (config: ModalConfig) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

const PRIORITY_ORDER: Record<ModalPriority, number> = {
  P0: 4, // Critical security/announcement
  P1: 3, // Blocking workflow
  P2: 2, // Standard action
  P3: 1, // Informational popup
};

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [activeModals, setActiveModals] = useState<ModalConfig[]>([]);
  const [modalQueue, setModalQueue] = useState<ModalConfig[]>([]);

  // Deduplicate and process queue whenever queue or activeModals change
  useEffect(() => {
    if (modalQueue.length === 0) return;

    // Sort queue by priority first, then FIFO
    const sortedQueue = [...modalQueue].sort((a, b) => {
      const priorityA = PRIORITY_ORDER[a.priority || 'P2'];
      const priorityB = PRIORITY_ORDER[b.priority || 'P2'];
      return priorityB - priorityA;
    });

    const nextModal = sortedQueue[0];
    const isAlreadyActive = activeModals.some((m) => m.id === nextModal.id);

    if (!isAlreadyActive) {
      // Move from queue to active state
      setActiveModals((prev) => [...prev, nextModal]);
      setModalQueue((prev) => prev.filter((m) => m.id !== nextModal.id));
    }
  }, [modalQueue, activeModals]);

  const openModal = useCallback((config: ModalConfig) => {
    setActiveModals((prev) => {
      // Prevent duplicates
      if (prev.some((m) => m.id === config.id)) return prev;
      return [...prev, config];
    });
  }, []);

  const closeModal = useCallback((id: string) => {
    setActiveModals((prev) => {
      const modal = prev.find((m) => m.id === id);
      if (modal?.onClose) {
        try {
          modal.onClose();
        } catch (e) {
          console.error('Error in modal onClose callback:', e);
        }
      }
      return prev.filter((m) => m.id !== id);
    });
    // Also remove from queue just in case
    setModalQueue((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const closeAllModals = useCallback(() => {
    setActiveModals((prev) => {
      prev.forEach((m) => {
        if (m.onClose) {
          try {
            m.onClose();
          } catch (e) {
            console.error(e);
          }
        }
      });
      return [];
    });
    setModalQueue([]);
  }, []);

  const replaceModal = useCallback((id: string, newConfig: ModalConfig) => {
    setActiveModals((prev) => {
      const idx = prev.findIndex((m) => m.id === id);
      if (idx === -1) {
        // If not found, just append
        if (prev.some((m) => m.id === newConfig.id)) return prev;
        return [...prev, newConfig];
      }
      const updated = [...prev];
      updated[idx] = newConfig;
      return updated;
    });
  }, []);

  const queueModal = useCallback((config: ModalConfig) => {
    setModalQueue((prev) => {
      // Prevent duplicates in queue or activeModals
      if (prev.some((m) => m.id === config.id)) return prev;
      return [...prev, config];
    });
  }, []);

  return (
    <ModalContext.Provider
      value={{
        activeModals,
        modalQueue,
        openModal,
        closeModal,
        closeAllModals,
        replaceModal,
        queueModal,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
