'use client';

import React, { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ConsumerPortal from '@/components/ConsumerPortal';
import { Loader2 } from 'lucide-react';

export default function VerificationPortal() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f6f8fc]">
      <Navbar />

      <main className="flex-grow py-8 space-y-8">
        
        {/* Suspense boundary for useSearchParams compliance in App Router */}
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-10 h-10 text-gray-900 animate-spin mb-3" />
              <p className="text-sm font-mono text-gray-400">Parsing secure provenance code...</p>
            </div>
          }
        >
          <ConsumerPortal />
        </Suspense>

      </main>

      <Footer />
    </div>
  );
}
