'use client';

import React, { useState, ReactNode } from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider, http, createConnector } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { defineChain } from 'viem';
import {
  ARC_TESTNET_CHAIN_ID,
  ARC_TESTNET_RPC,
  ARC_TESTNET_WS,
  ARC_TESTNET_EXPLORER,
} from '@/lib/constants';
import { CircleAuthProvider } from './CircleAuth';
import { createContractCallChallengeAction, getTransactionHashByChallengeAction } from '@/lib/circleClient';

export const arcTestnet = defineChain({
  id: ARC_TESTNET_CHAIN_ID,
  name: 'Arc Testnet',
  network: 'arcTestnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 18, // Native gas uses 18 decimals
  },
  rpcUrls: {
    default: {
      http: [ARC_TESTNET_RPC],
      webSocket: [ARC_TESTNET_WS],
    },
    public: {
      http: [ARC_TESTNET_RPC],
      webSocket: [ARC_TESTNET_WS],
    },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: ARC_TESTNET_EXPLORER },
  },
});

const getCircleSession = () => {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem('circle_session');
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
};

export function circleUcwConnector() {
  return createConnector((config) => ({
    id: 'circle-ucw',
    name: 'Circle Passkey Wallet',
    type: 'circlePasskey',
    async connect({ chainId, isReconnecting, withCapabilities }: any = {}) {
      const session = getCircleSession();
      if (!session) {
        throw new Error('Please sign in via email first');
      }
      const accounts = [session.walletAddress as `0x${string}`];
      if (withCapabilities) {
        return {
          accounts: accounts.map(a => ({ address: a, capabilities: {} })),
          chainId: ARC_TESTNET_CHAIN_ID,
        } as any;
      }
      return {
        accounts,
        chainId: ARC_TESTNET_CHAIN_ID,
      };
    },
    async disconnect() {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('circle_session');
      }
    },
    async getAccounts() {
      const session = getCircleSession();
      return session ? [session.walletAddress as `0x${string}`] : [];
    },
    async getChainId() {
      return ARC_TESTNET_CHAIN_ID;
    },
    async isAuthorized() {
      return !!getCircleSession();
    },
    async getProvider() {
      return {
        request: async ({ method, params }: any) => {
          const session = getCircleSession();
          if (!session) throw new Error('Not authenticated with Circle');

          if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
            return [session.walletAddress];
          }
          if (method === 'eth_chainId') {
            return '0x4cef52'; // Chain ID 5042002
          }

          if (method === 'eth_sendTransaction') {
            const tx = params[0];
            const res = await createContractCallChallengeAction(
              session.userToken,
              session.walletId,
              tx.to,
              tx.data || '0x'
            );
            if (!res.success || !res.challengeId) {
              throw new Error(res.error || 'Failed to create contract execution challenge');
            }

            const challengeId = res.challengeId;
            const { W3SSdk } = await import('@circle-fin/w3s-pw-web-sdk');
            const sdk = new W3SSdk();
            if (process.env.NEXT_PUBLIC_CIRCLE_CLIENT_URL) {
              (sdk as any).serviceUrl = process.env.NEXT_PUBLIC_CIRCLE_CLIENT_URL;
            }
            sdk.setAppSettings({ appId: session.appId });
            sdk.setAuthentication({
              userToken: session.userToken,
              encryptionKey: session.encryptionKey,
            });

            await sdk.getDeviceId();

            return new Promise<string>((resolve, reject) => {
              sdk.execute(challengeId, async (error, result) => {
                if (error) {
                  reject(new Error(error.message || 'Passkey transaction signature rejected'));
                } else {
                  // Poll for transaction hash
                  let txHash = null;
                  for (let i = 0; i < 30; i++) {
                    await new Promise((r) => setTimeout(r, 2000));
                    const statusRes = await getTransactionHashByChallengeAction(
                      session.userToken,
                      challengeId
                    );
                    if (statusRes.success && statusRes.txHash) {
                      txHash = statusRes.txHash;
                      break;
                    }
                  }
                  if (txHash) {
                    resolve(txHash);
                  } else {
                    reject(new Error('Timeout waiting for transaction validation'));
                  }
                }
              });
            });
          }

          // Fetch read-only node data
          const response = await fetch(ARC_TESTNET_RPC, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method,
              params,
            }),
          });
          const json = await response.json();
          if (json.error) {
            throw new Error(json.error.message);
          }
          return json.result;
        },
      };
    },
    onAccountsChanged(accounts: any) {},
    onChainChanged(chainId: any) {},
    onDisconnect() {},
  } as any));
}

import { sepolia, baseSepolia, arbitrumSepolia } from 'viem/chains';

const config = getDefaultConfig({
  appName: 'CargoTrust Platform',
  projectId: '4c311a3b827e8a93a8d6e3c0800b4cef52',
  chains: [arcTestnet, baseSepolia, sepolia, arbitrumSepolia],
  transports: {
    [arcTestnet.id]: http(),
    [baseSepolia.id]: http(),
    [sepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
  ssr: true,
});

(config.connectors as any).push(circleUcwConnector());

export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#06b6d4',
            accentColorForeground: '#ffffff',
            borderRadius: 'large',
            overlayBlur: 'small',
          })}
        >
          <CircleAuthProvider>
            {children}
          </CircleAuthProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
