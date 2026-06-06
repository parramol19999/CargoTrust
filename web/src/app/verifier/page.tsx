'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import VerifierDashboard from '@/components/VerifierDashboard';
import VerifierStaking from '@/components/VerifierStaking';
import { Award } from 'lucide-react';

export default function VerifierPortal() {
  const [activeTab, setActiveTab] = useState<'certify' | 'staking'>('certify');

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f8fc]">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Banner header for Verifiers */}
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gray-50 rounded-full blur-3xl" />
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-150 text-gray-900 border border-gray-200 rounded-full text-xs font-mono font-bold">
              <Award className="w-3.5 h-3.5" />
              Cryptographic Quality Verifications
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
              Accredited Quality Laboratory Portal
            </h1>
            <p className="text-sm text-gray-500 max-w-xl leading-relaxed">
              Conduct quality inspections, lock cryptographically signed W3C Verifiable Credentials on-chain, and stake USDC collateral to back certification claims.
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('certify')}
            className={`py-4 px-6 text-xs font-bold font-mono uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'certify'
                ? 'border-gray-900 text-gray-900 font-bold'
                : 'border-transparent text-gray-400 hover:text-gray-650'
            }`}
          >
            Quality Certifications
          </button>
          <button
            onClick={() => setActiveTab('staking')}
            className={`py-4 px-6 text-xs font-bold font-mono uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'staking'
                ? 'border-gray-900 text-gray-900 font-bold'
                : 'border-transparent text-gray-400 hover:text-gray-650'
            }`}
          >
            Staking & Collateral
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'certify' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <span className="w-1 h-4 bg-gray-900 rounded-full" />
              <h2 className="text-xs font-mono tracking-widest uppercase text-gray-400 font-bold">
                Authorized Quality Accreditations
              </h2>
            </div>
            <VerifierDashboard />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <span className="w-1 h-4 bg-gray-900 rounded-full" />
              <h2 className="text-xs font-mono tracking-widest uppercase text-gray-400 font-bold">
                Staking, Collateral & Penalties
              </h2>
            </div>
            <VerifierStaking />
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
