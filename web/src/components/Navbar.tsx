'use client';

import React from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ShieldCheck, Layers, Award, Leaf, LogOut, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCircleAuth } from './CircleAuth';

export default function Navbar() {
  const pathname = usePathname();
  const { session, logout, setIsAuthOpen, setIsSettingsOpen } = useCircleAuth();

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

          {session ? (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-100 hover:border-cyan-200 rounded-xl text-xs font-mono font-medium transition-all duration-200 shadow-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                {session.email}
              </button>
              <button
                onClick={logout}
                className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-rose-600 border border-gray-150 hover:border-rose-200 rounded-xl transition-all duration-200 shadow-sm"
                title="Sign Out"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsAuthOpen(true)}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 shadow-md shadow-gray-900/5 hover:shadow-gray-900/10 flex items-center gap-1.5"
              >
                <User className="w-4 h-4" />
                Sign In
              </button>
              <ConnectButton
                chainStatus="none"
                showBalance={false}
                accountStatus={{
                  smallScreen: 'avatar',
                  largeScreen: 'full',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
