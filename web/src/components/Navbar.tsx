'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { 
  ShieldCheck, 
  Layers, 
  Award, 
  Leaf, 
  LogOut, 
  User, 
  Menu, 
  X, 
  ChevronDown, 
  Settings, 
  HelpCircle, 
  FileText 
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCircleAuth } from './CircleAuth';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const pathname = usePathname();
  const { session, logout, setIsAuthOpen, setIsSettingsOpen } = useCircleAuth();
  
  // Responsive menus state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const links = [
    { href: '/', label: 'Operations Desk', icon: Layers },
    { href: '/verifier', label: 'Verifier Portal', icon: Award },
    { href: '/verify', label: 'Consumer Verification', icon: ShieldCheck },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-6 2xl:px-12 h-16 md:h-20 flex items-center justify-between gap-3 md:gap-5 2xl:gap-8">
          
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0 select-none">
            <div className="p-2 bg-gray-50 rounded-xl border border-gray-150 group-hover:border-gray-300 group-hover:bg-gray-100/50 transition-all duration-300">
              <Leaf className="w-5 h-5 md:w-5.5 md:h-5.5 text-gray-900" />
            </div>
            <div className="flex flex-col">
              <span className="text-base md:text-lg font-extrabold tracking-tight text-gray-900 leading-none">
                CargoTrust
              </span>
              <span className="hidden sm:block text-[8px] font-mono tracking-widest text-gray-400 font-bold uppercase mt-1 leading-none">
                Decentralized Supply Chain
              </span>
            </div>
          </Link>

          {/* 1. Large Screen Navigation (Laptop/Desktop >= 1280px) */}
          <nav className="hidden xl:flex items-center gap-6 2xl:gap-8">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                    isActive
                      ? 'text-gray-900 bg-gray-100/80 border border-gray-200/50 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/80 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* 2. Tablet Screen Navigation (Large Tablet 1024px - 1279px) */}
          <nav className="hidden lg:flex xl:hidden items-center gap-5">
            {/* Primary active Link */}
            <Link
              href="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                pathname === '/'
                  ? 'text-gray-900 bg-gray-100/80 border border-gray-200/50'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Layers className="w-4 h-4" />
              Operations Desk
            </Link>

            {/* Dropdown for lower-priority links */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 border whitespace-nowrap ${
                  isMoreOpen || pathname === '/verifier' || pathname === '/verify'
                    ? 'text-gray-900 bg-gray-50 border-gray-200/70'
                    : 'text-gray-500 border-transparent hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                More
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isMoreOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isMoreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute left-0 mt-2 w-56 rounded-2xl bg-white border border-gray-150 p-2 shadow-xl z-50 flex flex-col gap-1"
                  >
                    <Link
                      href="/verifier"
                      onClick={() => setIsMoreOpen(false)}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        pathname === '/verifier'
                          ? 'text-gray-950 bg-gray-50'
                          : 'text-gray-500 hover:text-gray-950 hover:bg-gray-50/80'
                      }`}
                    >
                      <Award className="w-4 h-4 text-gray-400" />
                      Verifier Portal
                    </Link>
                    <Link
                      href="/verify"
                      onClick={() => setIsMoreOpen(false)}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        pathname === '/verify'
                          ? 'text-gray-950 bg-gray-50'
                          : 'text-gray-500 hover:text-gray-950 hover:bg-gray-50/80'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-gray-400" />
                      Consumer Verification
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Right Area: Status Badge + Buttons + Hamburger */}
          <div className="flex items-center gap-3 md:gap-4 xl:gap-5 ml-auto">
            


            {/* Circle Auth States - (Laptop/Desktop Only) */}
            <div className="hidden lg:flex items-center gap-2.5">
              {session ? (
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="flex items-center gap-2 h-11 xl:h-12 px-3.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-100 hover:border-cyan-200 rounded-xl text-xs font-mono font-bold transition-all duration-200 shadow-sm whitespace-nowrap"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                    {session.email}
                  </button>
                  <button
                    onClick={logout}
                    className="flex items-center justify-center w-11 h-11 xl:w-12 xl:h-12 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-rose-600 border border-gray-150 hover:border-rose-200 rounded-xl transition-all duration-200 shadow-sm"
                    title="Sign Out"
                  >
                    <LogOut className="w-4.5 h-4.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="h-11 xl:h-12 px-4 xl:px-5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs xl:text-sm font-bold tracking-wide transition-all duration-200 shadow-md shadow-gray-900/5 flex items-center gap-1.5 whitespace-nowrap"
                >
                  <User className="w-4 h-4" />
                  Sign In
                </button>
              )}
            </div>

            {/* Connect Wallet Button (Custom RainbowKit for Dynamic Responsive Heights) */}
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
              }) => {
                const ready = mounted && authenticationStatus !== 'loading';
                const connected =
                  ready &&
                  account &&
                  chain &&
                  (!authenticationStatus ||
                    authenticationStatus === 'authenticated');

                return (
                  <div
                    className="flex items-center"
                    {...(!ready && {
                      'aria-hidden': true,
                      'style': {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            onClick={openConnectModal}
                            type="button"
                            className="h-10 md:h-11 xl:h-12 px-3.5 md:px-4 xl:px-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs md:text-sm font-extrabold tracking-wide transition-all duration-200 shadow-md shadow-cyan-600/10 flex items-center gap-1.5 whitespace-nowrap active:scale-95"
                          >
                            Connect Wallet
                          </button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <button
                            onClick={openChainModal}
                            type="button"
                            className="h-10 md:h-11 xl:h-12 px-3.5 md:px-4 xl:px-5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs md:text-sm font-bold tracking-wide transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap active:scale-95 animate-pulse"
                          >
                            Wrong Network
                          </button>
                        );
                      }

                      return (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={openChainModal}
                            type="button"
                            className="hidden md:flex h-11 xl:h-12 px-3 xl:px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-150 rounded-xl text-xs font-mono font-bold transition-all duration-200 items-center gap-1.5"
                          >
                            {chain.hasIcon && chain.iconUrl && (
                              <img
                                alt={chain.name ?? 'Chain icon'}
                                src={chain.iconUrl}
                                className="w-3.5 h-3.5"
                              />
                            )}
                            {chain.name}
                          </button>

                          <button
                            onClick={openAccountModal}
                            type="button"
                            className="h-10 md:h-11 xl:h-12 px-3.5 md:px-4 xl:px-5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs md:text-sm font-mono font-bold tracking-wide transition-all duration-200 shadow-sm flex items-center gap-1.5 active:scale-95"
                          >
                            {account.displayName}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>

            {/* Hamburger Button (Mobile/Tablet < 1024px) */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex lg:hidden items-center justify-center w-10 h-10 md:w-11 md:h-11 bg-gray-50 hover:bg-gray-100 border border-gray-150 rounded-xl text-gray-900 transition-all duration-200 active:scale-95"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

          </div>
        </div>
      </header>

      {/* Responsive Hamburger Drawer Menu */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Drawer Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm lg:hidden"
            />

            {/* Drawer Sliding Side-panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-white border-l border-gray-150 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto lg:hidden"
            >
              <div>
                {/* Header Row */}
                <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <Leaf className="w-5 h-5 text-gray-900" />
                    <span className="text-lg font-bold tracking-tight text-gray-900">CargoTrust</span>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition duration-200"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Section 1: Navigation List */}
                <div className="py-6 flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-1 font-mono">
                    Navigation Links
                  </span>
                  {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsDrawerOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                          isActive
                            ? 'text-gray-900 bg-gray-50 border border-gray-200/50'
                            : 'text-gray-600 hover:text-gray-950 hover:bg-gray-50/60'
                        }`}
                      >
                        <Icon className="w-4.5 h-4.5" />
                        {link.label}
                      </Link>
                    );
                  })}
                </div>

                {/* Section 2: Developer Accounts */}
                <div className="py-5 border-t border-gray-100 flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-1 font-mono">
                    Developer Account
                  </span>
                  {session ? (
                    <div className="flex flex-col gap-1 px-1">
                      <div className="flex items-center gap-2 px-3 py-2 bg-cyan-50 border border-cyan-100 rounded-xl text-xs font-mono text-cyan-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                        {session.email}
                      </div>
                      <button
                        onClick={() => {
                          setIsDrawerOpen(false);
                          setIsSettingsOpen(true);
                        }}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:text-gray-950 hover:bg-gray-50 transition-all text-left w-full"
                      >
                        <Settings className="w-4.5 h-4.5" />
                        API Keys & Webhooks
                      </button>
                      <button
                        onClick={() => {
                          setIsDrawerOpen(false);
                          logout();
                        }}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-all text-left w-full"
                      >
                        <LogOut className="w-4.5 h-4.5" />
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setIsDrawerOpen(false);
                        setIsAuthOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-950 hover:bg-gray-900 text-white rounded-xl text-sm font-bold transition duration-200"
                    >
                      <User className="w-4 h-4" />
                      Sign In with Circle
                    </button>
                  )}
                </div>

                {/* Section 3: Extra Portal Support */}
                <div className="py-5 border-t border-gray-100 flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-1 font-mono">
                    Platform Resources
                  </span>
                  <a
                    href="#"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all"
                  >
                    <FileText className="w-4.5 h-4.5" />
                    Documentation
                  </a>
                  <a
                    href="#"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all"
                  >
                    <HelpCircle className="w-4.5 h-4.5" />
                    Help & FAQ
                  </a>
                </div>
              </div>

              {/* Drawer Footer Information */}
              <div className="pt-6 border-t border-gray-100 text-center flex flex-col items-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-mono font-bold leading-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Arc Testnet Active
                </div>
                <p className="text-[10px] text-gray-400 mt-3 font-mono">v1.2.4 • CargoTrust Network</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
