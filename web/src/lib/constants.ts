// ─── Arc Testnet Chain & Contract Constants ───
export const ARC_TESTNET_CHAIN_ID = 5042002;
export const ARC_TESTNET_RPC = 'https://rpc.testnet.arc.network';
export const ARC_TESTNET_WS = 'wss://rpc.testnet.arc.network';
export const ARC_TESTNET_EXPLORER = 'https://testnet.arcscan.app';

export const USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as const;
export const USDC_DECIMALS = 6;

export const EURC_ADDRESS = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a' as const;
export const EURC_DECIMALS = 6;

export const CARGO_REGISTRY_ADDRESS = '0xE55F66FeAdd3AF36D9A8F0D9fC6A639891be6578' as const;
export const CARGO_ESCROW_ADDRESS = '0x3eb7De7Ae1940B52Fe79394F04eA0238c0D6F2A4' as const;

// ─── Minimal USDC ABI (for balances and approvals) ───
export const USDC_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// ─── Helpers ───
export function explorerTxUrl(txHash: string): string {
  return `${ARC_TESTNET_EXPLORER}/tx/${txHash}`;
}

export function explorerAddressUrl(address: string): string {
  return `${ARC_TESTNET_EXPLORER}/address/${address}`;
}

export function truncateAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export const AGENT_REGISTRY_ADDRESS = '0x798Ef21Cf6C077863c6F995De401edf64BBCE767' as const;
