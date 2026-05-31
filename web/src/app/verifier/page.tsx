'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import VerifierDashboard from '@/components/VerifierDashboard';
import { Award } from 'lucide-react';

export default function VerifierPortal() {
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
              Conduct quality inspections and lock cryptographically signed W3C Verifiable Credentials on-chain to provide end-consumers with unforgeable food origin claims.
            </p>
          </div>
        </div>

        {/* Core Verifications Panel */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <span className="w-1 h-4 bg-gray-900 rounded-full" />
            <h2 className="text-xs font-mono tracking-widest uppercase text-gray-400 font-bold">
              Authorized Quality Accreditations
            </h2>
          </div>
          <VerifierDashboard />
        </div>

      </main>

      <Footer />
    </div>
  );
}
