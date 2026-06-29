'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FileText, ShieldCheck, Scale, ChevronRight } from 'lucide-react';

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 py-12">
        {/* Page Header */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-mono font-bold uppercase">
            Legal Center
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
            Terms & Guidelines
          </h1>
          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            Please read our Terms of Service and Privacy Policy to understand how CargoTrust handles on-chain telemetry and USDC escrow trades.
          </p>
        </div>

        {/* Tab Selection Row */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-6 py-2.5 rounded-2xl text-xs font-bold border transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'terms'
                ? 'bg-slate-950 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-500 border-slate-200 hover:text-slate-900'
            }`}
          >
            <Scale className="w-4 h-4" />
            Terms of Service
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-6 py-2.5 rounded-2xl text-xs font-bold border transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'privacy'
                ? 'bg-slate-950 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-500 border-slate-200 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Privacy Policy
          </button>
        </div>

        {/* Main Content Area */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-sm text-left text-slate-600 text-sm leading-relaxed space-y-6">
          
          {activeTab === 'terms' ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">Terms of Service</h2>
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
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">Privacy Policy</h2>
                <p className="text-slate-400 text-xs mt-1">Last Updated: June 28, 2026</p>
              </div>

              <hr className="border-slate-100" />

              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 text-base">1. Information We Collect</h3>
                <p>
                  CargoTrust operates primarily as a non-custodial decentralized application. We do not require users to create traditional accounts with passwords. We collect:
                </p>
                <ul className="list-disc pl-6 space-y-1.5 text-xs text-slate-500">
                  <li><strong className="text-slate-700">Public Wallet Addresses:</strong> To render crop assets and escrow status.</li>
                  <li><strong className="text-slate-700">IoT Telemetry Logs:</strong> Environmental conditions (temperature, moisture, humidity) and coordinate vectors of active tracked shipments.</li>
                  <li><strong className="text-slate-700">Email (if using Circle Auth):</strong> Used solely to authenticate through Circle's embedded wallet services.</li>
                </ul>

                <h3 className="font-bold text-slate-900 text-base">2. How Information is Used</h3>
                <p>
                  Public ledger data (such as crop twin mints and escrow releases) are recorded on the public Arc blockchain and cannot be deleted. Telemetry logs are used to feed the CargoPilot AI monitoring engine. We do not sell your personal or shipping information to third-party brokers.
                </p>

                <h3 className="font-bold text-slate-900 text-base">3. Blockchain Transparency</h3>
                <p>
                  Due to the immutable nature of block records, once a laboratory signs a quality certification or a producer mints an asset, this action is publicly visible. If you require complete confidentiality, do not upload sensitive commercial values or personal identifier parameters to the public registry.
                </p>

                <h3 className="font-bold text-slate-900 text-base">4. Changes to This Policy</h3>
                <p>
                  We reserve the right to update this Privacy Policy from time to time to adapt to new regulatory compliance rules or features on the Arc network. Check this page regularly to keep informed of changes.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

      <Footer />
    </div>
  );
}
