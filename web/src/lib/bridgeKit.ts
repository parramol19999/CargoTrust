import { pad, keccak256, decodeEventLog } from 'viem';

// ABI for MessageTransmitter containing MessageSent event
const MESSAGE_TRANSMITTER_EVENTS = [
  {
    name: 'MessageSent',
    type: 'event',
    inputs: [
      { name: 'message', type: 'bytes', indexed: false }
    ]
  }
] as const;

export function extractMessageFromReceipt(receipt: any): { message: `0x${string}`; messageHash: `0x${string}` } {
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: MESSAGE_TRANSMITTER_EVENTS,
        eventName: 'MessageSent',
        data: log.data,
        topics: log.topics,
      });
      if (decoded && decoded.args && decoded.args.message) {
        const message = decoded.args.message;
        const messageHash = keccak256(message);
        return { message, messageHash };
      }
    } catch (e) {
      // Skip log if it doesn't match
    }
  }
  throw new Error('CCTP MessageSent event log not found in burn transaction receipt.');
}

// CCTP Domains
export const CCTP_DOMAINS = {
  Ethereum: 0,
  EthereumSepolia: 0,
  Base: 6,
  BaseSepolia: 6,
  Arbitrum: 3,
  ArbitrumSepolia: 3,
  Arc: 26,
  ArcTestnet: 26,
  Solana: 5,
} as const;

export interface ChainConfig {
  name: string;
  chainId: number;
  domainId: number;
  usdcAddress: `0x${string}`;
  tokenMessengerAddress: `0x${string}`;
  messageTransmitterAddress: `0x${string}`;
}

export const SUPPORTED_SOURCE_CHAINS: Record<string, ChainConfig> = {
  'ethereum-sepolia': {
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    domainId: CCTP_DOMAINS.EthereumSepolia,
    usdcAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    tokenMessengerAddress: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',
    messageTransmitterAddress: '0x80537e4e8bAb73D21096baa3a8c813b45CA0b7c9',
  },
  'base-sepolia': {
    name: 'Base Sepolia',
    chainId: 84532,
    domainId: CCTP_DOMAINS.BaseSepolia,
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    tokenMessengerAddress: '0xb43db544E2c27092c107639Ad201b3dEfAbcF192',
    messageTransmitterAddress: '0x7865fAfC2db2093669d92c0F33AeEF291086BEFD',
  },
  'arbitrum-sepolia': {
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    domainId: CCTP_DOMAINS.ArbitrumSepolia,
    usdcAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    tokenMessengerAddress: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',
    messageTransmitterAddress: '0xaCF1AcC99017614740D7A9222476b225A417CC2C',
  },
};

// ABI for TokenMessenger
export const TOKEN_MESSENGER_ABI = [
  {
    name: 'depositForBurn',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'destinationDomain', type: 'uint32' },
      { name: 'mintRecipient', type: 'bytes32' },
      { name: 'burnToken', type: 'address' },
    ],
    outputs: [{ name: 'nonce', type: 'uint64' }],
  },
] as const;

// ABI for MessageTransmitter
export const MESSAGE_TRANSMITTER_ABI = [
  {
    name: 'receiveMessage',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'message', type: 'bytes' },
      { name: 'attestation', type: 'bytes' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
  },
] as const;

/**
 * Encodes an EVM address into CCTP bytes32 format.
 */
export function addressToBytes32(address: string): `0x${string}` {
  return pad(address as `0x${string}`, { size: 32 });
}

/**
 * Polls Circle's Attestation API sandbox for the CCTP signature.
 */
export async function getCCTPAttestation(messageHash: string): Promise<string> {
  const url = `https://iris-api-sandbox.circle.com/attestations/${messageHash}`;
  
  for (let i = 0; i < 30; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'complete' && data.attestation) {
          return data.attestation;
        }
      }
    } catch (e) {
      console.warn('Error polling CCTP attestation service:', e);
    }
    // Wait 3 seconds before retrying
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  
  throw new Error('CCTP Attestation retrieval timed out.');
}
