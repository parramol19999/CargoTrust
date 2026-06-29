'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
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
              <ShieldCheck className="w-7 h-7 text-emerald-500" />
              Privacy Policy
            </h1>
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
      </div>

      <Footer />
    </div>
  );
}
