'use client';

export interface UserFriendlyError {
  title: string;
  description: string;
  technicalDetails?: string;
  retryable: boolean;
}

export function mapRawError(error: any): UserFriendlyError {
  if (!error) {
    return {
      title: 'Unknown Action Failed',
      description: 'An unexpected issue occurred. Please check your connection and try again.',
      retryable: true,
    };
  }

  // Extract message and code
  const message = error.message || String(error);
  const code = error.code;

  // 1. User Rejection (Web3 / Wallet)
  if (
    message.includes('User rejected') || 
    message.includes('user rejected') ||
    message.includes('UserDeniedSignature') ||
    message.includes('ACTION_REJECTED') ||
    code === 4001
  ) {
    return {
      title: 'Transaction Cancelled',
      description: 'You declined the signing request in your wallet. If this was an accident, feel free to try again.',
      technicalDetails: 'Wallet signature denied by user (code 4001).',
      retryable: true,
    };
  }

  // 2. Insufficient Funds (Gas or Native Balance)
  if (
    message.includes('insufficient funds') || 
    message.includes('INSUFFICIENT_FUNDS') ||
    message.includes('exceeds balance')
  ) {
    return {
      title: 'Insufficient Balance',
      description: 'You do not have enough USDC/ETH in your wallet to cover this transaction fee or trade amount.',
      technicalDetails: message.slice(0, 150),
      retryable: false,
    };
  }

  // 3. Chain/Network Mismatch or Switch Error
  if (
    message.includes('Chain not support') || 
    message.includes('switch chain') ||
    message.includes('wrong network')
  ) {
    return {
      title: 'Wrong Network Selected',
      description: 'Your wallet is connected to an unsupported network. Please switch to Arc Testnet or the requested source chain.',
      technicalDetails: message.slice(0, 150),
      retryable: true,
    };
  }

  // 4. API Rate Limits
  if (
    message.includes('429') ||
    message.includes('Too Many Requests') ||
    message.includes('rate limit')
  ) {
    return {
      title: 'Too Many Requests',
      description: 'We are receiving a high volume of requests from your browser. Please wait a brief moment before trying again.',
      technicalDetails: 'HTTP 429 Too Many Requests (Rate Limit Breached).',
      retryable: true,
    };
  }

  // 5. Network Offline / Timeout
  if (
    message.includes('Network Error') ||
    message.includes('failed to fetch') ||
    message.includes('timeout') ||
    message.includes('ENOTFOUND')
  ) {
    return {
      title: 'Connection Disrupted',
      description: 'We could not reach the servers. Please check your internet connectivity or firewall rules and try again.',
      technicalDetails: message.slice(0, 150),
      retryable: true,
    };
  }

  // 6. Contract Reverts
  if (
    message.includes('execution reverted') ||
    message.includes('UNPREDICTABLE_GAS_LIMIT')
  ) {
    // Custom Crop Registry Reverts
    if (message.includes('not verified')) {
      return {
        title: 'Verification Requirement Failed',
        description: 'This batch cannot be settled because it lacks active, signed quality credentials from an authorized verifier.',
        technicalDetails: 'Contract revert: CropRegistry__CropNotVerified().',
        retryable: false,
      };
    }
    if (message.includes('escrow active')) {
      return {
        title: 'Escrow Settlement Active',
        description: 'This digital crop twin cannot be transferred directly because there is an active trade escrow contract locked on it.',
        technicalDetails: 'Contract revert: CropRegistry__EscrowActive().',
        retryable: false,
      };
    }
    return {
      title: 'Transaction Reverted',
      description: 'The smart contract rejected this transaction. This can happen if conditions changed or safety checks failed.',
      technicalDetails: message.slice(0, 150),
      retryable: true,
    };
  }

  // Default fallback
  return {
    title: 'Operation Failed',
    description: 'An unexpected technical issue interrupted this operation. Our developers have been notified.',
    technicalDetails: message.slice(0, 200),
    retryable: true,
  };
}
