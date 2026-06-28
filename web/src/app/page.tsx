'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TwinCreator from '@/components/TwinCreator';
import OwnershipTransfer from '@/components/OwnershipTransfer';
import EscrowDashboard from '@/components/EscrowDashboard';
import AgentConsole from '@/components/AgentConsole';
import LendingPoolConsole from '@/components/LendingPoolConsole';
import DeveloperConsole from '@/components/DeveloperConsole';
import { Leaf, Award, Cpu, ShieldCheck } from 'lucide-react';
import { useAccount } from 'wagmi';

export default function OperationsDesk() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<'desk' | 'escrow' | 'agents' | 'lending' | 'developer'>('desk');
  const { address } = useAccount();

  const handleMintSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in-up">
        
        {/* Travel-booking Inspired Clean Light Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-sm">
          <div className="absolute top-0 right-0 w-80 h-80 bg-slate-50/50 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-950">
                Crop Sourcing & Ownership Settlements
              </h1>
              <p className="text-sm text-slate-500 max-w-xl leading-relaxed">
                Operate digital twins, anchor verifiable laboratory certificates, and resolve payments through atomic smart contract ownership settlement on Arc Testnet.
              </p>
            </div>

            {/* Platform Statistics */}
            <div className="grid grid-cols-2 sm:flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8 shrink-0 font-mono">
              <div className="text-left md:text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Platform Gas</span>
                <p className="text-sm font-bold text-slate-900 mt-1">USDC Gas (Native)</p>
              </div>
              <div className="text-left md:text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Trading Model</span>
                <p className="text-sm font-bold text-emerald-600 mt-1">Atomic USDC Settlement</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200/80 gap-1.5 px-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('desk')}
            className={`px-5 py-3 border-b-2 font-bold text-xs tracking-wider uppercase transition-all duration-300 shrink-0 ${
              activeTab === 'desk'
                ? 'border-slate-900 text-slate-950 scale-105'
                : 'border-transparent text-slate-400 hover:text-slate-900'
            }`}
          >
            Sourcing & Trading Desk
          </button>
          <button
            onClick={() => setActiveTab('escrow')}
            className={`px-5 py-3 border-b-2 font-bold text-xs tracking-wider uppercase transition-all duration-300 shrink-0 ${
              activeTab === 'escrow'
                ? 'border-slate-900 text-slate-950 scale-105'
                : 'border-transparent text-slate-400 hover:text-slate-900'
            }`}
          >
            Escrow Manager
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-5 py-3 border-b-2 font-bold text-xs tracking-wider uppercase transition-all duration-300 shrink-0 ${
              activeTab === 'agents'
                ? 'border-slate-900 text-slate-950 scale-105'
                : 'border-transparent text-slate-400 hover:text-slate-900'
            }`}
          >
            Agent Registry
          </button>
          <button
            onClick={() => setActiveTab('lending')}
            className={`px-5 py-3 border-b-2 font-bold text-xs tracking-wider uppercase transition-all duration-300 shrink-0 ${
              activeTab === 'lending'
                ? 'border-slate-900 text-slate-950 scale-105'
                : 'border-transparent text-slate-400 hover:text-slate-900'
            }`}
          >
            Trade Credit
          </button>
          <button
            onClick={() => setActiveTab('developer')}
            className={`px-5 py-3 border-b-2 font-bold text-xs tracking-wider uppercase transition-all duration-300 shrink-0 ${
              activeTab === 'developer'
                ? 'border-slate-900 text-slate-950 scale-105'
                : 'border-transparent text-slate-400 hover:text-slate-900'
            }`}
          >
            Developer Console
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -15, filter: 'blur(4px)' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeTab === 'desk' ? (
              /* Dynamic Two-Column Layout */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Feature A: Crop Creator Left Column */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <span className="w-1 h-4 bg-slate-950 rounded-full" />
                    <h2 className="text-xs font-mono tracking-widest uppercase text-slate-400 font-bold">
                      Supply Chain Entry Anchor
                    </h2>
                  </div>
                  <TwinCreator onMintSuccess={handleMintSuccess} />
                </div>

                {/* Feature B: Operations Listings Right Column */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <span className="w-1 h-4 bg-slate-950 rounded-full" />
                    <h2 className="text-xs font-mono tracking-widest uppercase text-slate-400 font-bold">
                      Active B2B Listings & Settlements
                    </h2>
                  </div>
                  <OwnershipTransfer refreshTrigger={refreshTrigger} />
                </div>

              </div>
            ) : activeTab === 'escrow' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <span className="w-1 h-4 bg-slate-950 rounded-full" />
                  <h2 className="text-xs font-mono tracking-widest uppercase text-slate-400 font-bold">
                    Contract Escrow Dashboard
                  </h2>
                </div>
                <EscrowDashboard />
              </div>
            ) : activeTab === 'agents' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <span className="w-1 h-4 bg-slate-950 rounded-full" />
                  <h2 className="text-xs font-mono tracking-widest uppercase text-slate-400 font-bold">
                    IoT Autonomous Agent Console
                  </h2>
                </div>
                <AgentConsole />
              </div>
            ) : activeTab === 'lending' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <span className="w-1 h-4 bg-slate-950 rounded-full" />
                  <h2 className="text-xs font-mono tracking-widest uppercase text-slate-400 font-bold">
                    Crop Collateralized Lending Pool
                  </h2>
                </div>
                <LendingPoolConsole />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <span className="w-1 h-4 bg-slate-950 rounded-full" />
                  <h2 className="text-xs font-mono tracking-widest uppercase text-slate-400 font-bold">
                    Developer Integration Portal
                  </h2>
                </div>
                <DeveloperConsole userAddress={address || '0x1087E71CD83101adF154d8215522EadA51Bf891E'} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

      </main>

      <Footer />
    </div>
  );
}
