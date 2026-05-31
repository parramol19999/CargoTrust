'use client';

import React from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ShieldCheck, Layers, Award, Leaf } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Operations Desk', icon: Layers },
    { href: '/verifier', label: 'Verifier Portal', icon: Award },
    { href: '/verify', label: 'Consumer Verification', icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-[#ffffff]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="p-2 bg-gray-50 rounded-xl border border-gray-100 group-hover:border-gray-300 transition-all duration-300">
            <Leaf className="w-5.5 h-5.5 text-gray-900" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-gray-900">
              CargoTrust
            </span>
            <span className="hidden sm:block text-[9px] font-mono tracking-widest text-gray-500 font-bold uppercase">
              Decentralized Supply Chain Platform
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'text-gray-900 bg-gray-100/80 border border-gray-200/50'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-mono font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Arc Testnet Active
          </div>
          <ConnectButton
            chainStatus="none"
            showBalance={false}
            accountStatus={{
              smallScreen: 'avatar',
              largeScreen: 'full',
            }}
          />
        </div>
      </div>
    </header>
  );
}
