'use client';

import React, { useState } from 'react';
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
    <div className="min-h-screen flex flex-col bg-[#f6f8fc]">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Travel-booking Inspired Clean Light Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gray-50 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-900 border border-gray-200 rounded-full text-xs font-mono font-bold">
                <Cpu className="w-3.5 h-3.5" />
                Layer-1 Stablecoins Commerce Stack
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
                Crop Sourcing & Ownership Settlements
              </h1>
              <p className="text-sm text-gray-500 max-w-xl leading-relaxed">
                Operate digital twins, anchor verifiable laboratory certificates, and resolve payments through atomic smart contract ownership settlement on Arc Testnet.
              </p>
            </div>

            {/* Platform Statistics */}
            <div className="grid grid-cols-2 sm:flex items-center gap-6 border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8 shrink-0 font-mono">
              <div className="text-left md:text-right">
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Platform Gas</span>
                <p className="text-sm font-bold text-gray-900 mt-1">USDC Gas (Native)</p>
              </div>
              <div className="text-left md:text-right">
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Trading Model</span>
                <p className="text-sm font-bold text-emerald-600 mt-1">Atomic USDC Settlement</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-250 gap-1.5 px-1">
          <button
            onClick={() => setActiveTab('desk')}
            className={`px-5 py-3 border-b-2 font-bold text-xs tracking-wider uppercase transition-all duration-200 ${
              activeTab === 'desk'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-400 hover:text-gray-950'
            }`}
          >
            Sourcing & Trading Desk
          </button>
          <button
            onClick={() => setActiveTab('escrow')}
            className={`px-5 py-3 border-b-2 font-bold text-xs tracking-wider uppercase transition-all duration-200 ${
              activeTab === 'escrow'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-400 hover:text-gray-950'
            }`}
          >
            Escrow Manager
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-5 py-3 border-b-2 font-bold text-xs tracking-wider uppercase transition-all duration-200 ${
              activeTab === 'agents'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-400 hover:text-gray-950'
            }`}
          >
            Agent Registry
          </button>
          <button
            onClick={() => setActiveTab('lending')}
            className={`px-5 py-3 border-b-2 font-bold text-xs tracking-wider uppercase transition-all duration-200 ${
              activeTab === 'lending'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-400 hover:text-gray-950'
            }`}
          >
            Trade Credit
          </button>
          <button
            onClick={() => setActiveTab('developer')}
            className={`px-5 py-3 border-b-2 font-bold text-xs tracking-wider uppercase transition-all duration-200 ${
              activeTab === 'developer'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-400 hover:text-gray-950'
            }`}
          >
            Developer Console
          </button>
        </div>

        {activeTab === 'desk' ? (
          /* Dynamic Two-Column Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Feature A: Crop Creator Left Column */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2 px-1">
                <span className="w-1 h-4 bg-gray-900 rounded-full" />
                <h2 className="text-xs font-mono tracking-widest uppercase text-gray-400 font-bold">
                  Supply Chain Entry Anchor
                </h2>
              </div>
              <TwinCreator onMintSuccess={handleMintSuccess} />
            </div>

            {/* Feature B: Operations Listings Right Column */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 px-1">
                <span className="w-1 h-4 bg-gray-900 rounded-full" />
                <h2 className="text-xs font-mono tracking-widest uppercase text-gray-400 font-bold">
                  Active B2B Listings & Settlements
                </h2>
              </div>
              <OwnershipTransfer refreshTrigger={refreshTrigger} />
            </div>

          </div>
        ) : activeTab === 'escrow' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <span className="w-1 h-4 bg-gray-900 rounded-full" />
              <h2 className="text-xs font-mono tracking-widest uppercase text-gray-400 font-bold">
                Contract Escrow Dashboard
              </h2>
            </div>
            <EscrowDashboard />
          </div>
        ) : activeTab === 'agents' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <span className="w-1 h-4 bg-gray-900 rounded-full" />
              <h2 className="text-xs font-mono tracking-widest uppercase text-gray-400 font-bold">
                IoT Autonomous Agent Console
              </h2>
            </div>
            <AgentConsole />
          </div>
        ) : activeTab === 'lending' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <span className="w-1 h-4 bg-gray-900 rounded-full" />
              <h2 className="text-xs font-mono tracking-widest uppercase text-gray-400 font-bold">
                Crop Collateralized Lending Pool
              </h2>
            </div>
            <LendingPoolConsole />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <span className="w-1 h-4 bg-gray-900 rounded-full" />
              <h2 className="text-xs font-mono tracking-widest uppercase text-gray-400 font-bold">
                Developer Integration Portal
              </h2>
            </div>
            <DeveloperConsole userAddress={address || '0x1087E71CD83101adF154d8215522EadA51Bf891E'} />
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
