'use client';

import React, { useState, ReactNode } from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { defineChain } from 'viem';
import {
  ARC_TESTNET_CHAIN_ID,
  ARC_TESTNET_RPC,
  ARC_TESTNET_WS,
  ARC_TESTNET_EXPLORER,
} from '@/lib/constants';

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

const config = getDefaultConfig({
  appName: 'CargoTrust Platform',
  projectId: '4c311a3b827e8a93a8d6e3c0800b4cef52', // Simple mock project ID for RainbowKit v2 (doesn't require real registration for testnets)
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http(),
  },
  ssr: true,
});

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
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
