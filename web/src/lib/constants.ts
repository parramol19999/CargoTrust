// ─── Arc Testnet Chain & Contract Constants ───
export const ARC_TESTNET_CHAIN_ID = 5042002;
export const ARC_TESTNET_RPC = 'https://rpc.testnet.arc.network';
export const ARC_TESTNET_WS = 'wss://rpc.testnet.arc.network';
export const ARC_TESTNET_EXPLORER = 'https://testnet.arcscan.app';

export const USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as const;
export const USDC_DECIMALS = 6;

export const EURC_ADDRESS = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a' as const;
export const EURC_DECIMALS = 6;

export const CARGO_REGISTRY_ADDRESS = (process.env.NEXT_PUBLIC_CARGO_REGISTRY_ADDRESS || '0x0a231C10eC37E2387Ee8024544b0210A2f9Ed98e') as `0x${string}`;
export const CARGO_ESCROW_ADDRESS = (process.env.NEXT_PUBLIC_CARGO_ESCROW_ADDRESS || '0xD9fa7B19AB322dAeC3e7eEcBBBb2367D7934039C') as `0x${string}`;

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

export const AGENT_REGISTRY_ADDRESS = (process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS || '0x58b26bA54254fBdaB31DEa012411499dDAE81AB5') as `0x${string}`;
export const VERIFIER_REGISTRY_ADDRESS = (process.env.NEXT_PUBLIC_VERIFIER_REGISTRY_ADDRESS || '0xaA3Bd77e6952DbeA94e51DDe41b32d96C559C3cF') as `0x${string}`;
export const CROP_LENDING_POOL_ADDRESS = (process.env.NEXT_PUBLIC_CROP_LENDING_POOL_ADDRESS || '0x4e77709401a75e0296405F9be288863fEec880A1') as `0x${string}`;

