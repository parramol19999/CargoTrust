'use client';

import { useState, useEffect } from 'react';

/**
 * Checks if Circle Gas Station sponsorship is configured and active.
 */
export function isGasSponsorshipEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CIRCLE_GAS_SPONSORSHIP === 'true';
}

/**
 * Checks if the developer-defined gas sponsorship quota has been exceeded.
 */
export function isGasLimitReached(): boolean {
  return process.env.NEXT_PUBLIC_CIRCLE_GAS_SPONSOR_LIMIT_REACHED === 'true';
}

/**
 * Custom hook to consume Gas Sponsorship parameters on the frontend components.
 */
export function useGasSponsorship() {
  const [enabled, setEnabled] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    setEnabled(isGasSponsorshipEnabled());
    setLimitReached(isGasLimitReached());
  }, []);

  const isSponsored = enabled && !limitReached;

  return {
    enabled,
    limitReached,
    isSponsored,
    gasFeeText: isSponsored ? '$0.00 (Gas Sponsored)' : 'Calculated by Network',
  };
}
