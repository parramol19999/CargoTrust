'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Scale, ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 py-12">
        {/* Back Link */}
        <div className="mb-6">
          <Link href="/legal" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition font-bold">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Legal Center
          </Link>
        </div>

        {/* Page Content */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-sm text-left text-slate-600 text-sm leading-relaxed space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight flex items-center gap-2.5">
              <Scale className="w-7 h-7 text-emerald-500" />
              Terms of Service
            </h1>
            <p className="text-slate-400 text-xs mt-1">Last Updated: June 28, 2026</p>
          </div>

          <hr className="border-slate-100" />

          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base">1. Agreement to Terms</h3>
            <p>
              By accessing or using the CargoTrust Operations Desk, smart contracts, or telemetry services, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, do not access our software on the Arc blockchain network.
            </p>

            <h3 className="font-bold text-slate-900 text-base">2. Description of Service</h3>
            <p>
              CargoTrust provides software utilities that allow users to anchor agricultural crop information on-chain (Digital Twins), designate laboratories to sign quality certificates, and create USDC stablecoin escrows to secure trades. CargoTrust is a software interface and does not custody funds or verify physical assets itself.
            </p>

            <h3 className="font-bold text-slate-900 text-base">3. Arc Network and Gas Fees</h3>
            <p>
              All transactions submitted through our interface are processed on the Arc blockchain. Gas fees are settled directly using USDC in accordance with the network parameters. CargoTrust is not responsible for network congestion, transactions failing, or loss of gas fees due to incorrect user parameters.
            </p>

            <h3 className="font-bold text-slate-900 text-base">4. Smart Contract Risks</h3>
            <p>
              You acknowledge that smart contract execution involves inherent security risks. By locking USDC in the CargoTrust escrow contract, you accept the risks of coding bugs, consensus errors, or potential exploits.
            </p>

            <h3 className="font-bold text-slate-900 text-base">5. Dispute Resolution</h3>
            <p>
              CargoTrust holds escrow transactions in smart contracts that release programmatically when the designated laboratory signs the verification certificate. Any commercial disputes regarding crop quality or shipping delays must be resolved directly between the buyer, seller, and verifier.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
