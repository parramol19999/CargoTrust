'use client';

import React from 'react';
import { CARGO_REGISTRY_ADDRESS, ARC_TESTNET_EXPLORER, USDC_ADDRESS } from '@/lib/constants';
import { ExternalLink, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-100 bg-white text-gray-500 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-gray-900" />
            <span className="text-gray-900 font-bold tracking-wide">CargoTrust Protocol</span>
            <span className="text-xs text-gray-400">v1.0.0</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-mono text-gray-500">
            <div className="flex items-center gap-1.5">
              <span>USDC Gas Bridge:</span>
              <a
                href={`${ARC_TESTNET_EXPLORER}/address/${USDC_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
                className="text-gray-900 hover:underline flex items-center gap-0.5"
              >
                0x3600...0000
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Registry Contract:</span>
              <a
                href={`${ARC_TESTNET_EXPLORER}/address/${CARGO_REGISTRY_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
                className="text-gray-900 hover:underline flex items-center gap-0.5"
              >
                {CARGO_REGISTRY_ADDRESS.slice(0, 6)}...{CARGO_REGISTRY_ADDRESS.slice(-4)}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-6 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-400 gap-4">
          <p>© {new Date().getFullYear()} CargoTrust Technologies. Built for the Circle & Arc Challenge.</p>
          <p className="flex items-center gap-1.5">
            Designed for transparent, financialized B2B commerce
            <Heart className="w-3.5 h-3.5 text-gray-900 fill-gray-900" />
          </p>
        </div>
      </div>
    </footer>
  );
}
