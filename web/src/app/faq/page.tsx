'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck,
  Mail,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQItem {
  q: string;
  a: string;
  category: 'general' | 'technical' | 'security' | 'financial';
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'general' | 'technical' | 'security' | 'financial'>('all');

  const faqs: FAQItem[] = [
    {
      category: 'general',
      q: 'What is CargoTrust and who is it for?',
      a: 'CargoTrust is a decentralized B2B agricultural commerce platform. It is designed for producers (farmers/cooperatives), international buyers (importers/exporters), and certified testing laboratories. It enables trustless agricultural trades by linking crop ownership to cryptographic testing certificates.'
    },
    {
      category: 'technical',
      q: 'What is the Arc blockchain and why does CargoTrust use it?',
      a: 'Arc is a high-performance blockchain designed for stablecoin commerce. CargoTrust uses Arc because of its sub-second transaction finality and its ability to use USDC as a native gas token. This eliminates the need to acquire volatile native gas tokens (like ETH), allowing for predictable transaction costs.'
    },
    {
      category: 'financial',
      q: 'Do I need to manage multiple cryptocurrencies to pay gas fees?',
      a: 'No. CargoTrust integrates Arc’s native gas abstraction. Gas fees are settled directly using USDC. When you mint a crop token or deposit funds in escrow, the platform handles the underlying transaction fees automatically, giving users a seamless, digital-dollar experience.'
    },
    {
      category: 'general',
      q: 'How does the quality verification work?',
      a: 'When a producer mints a Crop Twin token, they designate an authorized testing laboratory. Once the laboratory inspects the physical crop, they anchor the verification properties (moisture content, purity, pesticide reports) directly to the crop twin on-chain. The buyer can review these properties before releasing payment.'
    },
    {
      category: 'security',
      q: 'How does the USDC smart escrow guarantee B2B trades?',
      a: 'The B2B buyer deposits USDC into the CargoTrust Escrow contract. The contract programmatically locks the funds. The funds cannot be retrieved by the seller until the designated testing lab anchors a successful quality certificate, and they cannot be withdrawn by the buyer unless the verification fails or a shipping deadline expires. This removes counterparty default risks entirely.'
    },
    {
      category: 'technical',
      q: 'What is CargoPilot OS and how do IoT trackers sync on-chain?',
      a: 'CargoPilot OS is our autonomous tracking dashboard. By attaching GPS/environmental IoT trackers to shipments, critical metrics (temperature, humidity, moisture, coordinates) are pushed dynamically to the blockchain. CargoPilot uses AI agents to monitor these telemetry streams, sending alerts and filing on-chain evidence if thresholds are breached.'
    },
    {
      category: 'security',
      q: 'Is my trade data secure?',
      a: 'Yes. CargoTrust stores general crop metadata on-chain to ensure transparency, but sensitive trade parameters (such as commercial pricing, buyer identities, and custom agreements) can be encrypted or managed off-chain, referencing only hash-proofs on the public ledger. You retain full control over what information you disclose.'
    },
    {
      category: 'financial',
      q: 'What stablecoins and chains are supported?',
      a: 'Currently, the MVP is deployed on Arc Testnet, supporting USDC stablecoins. Arc allows fast, cost-predictable digital-dollar settlements. The platform is designed to extend cross-chain bridge support using Circle App Kit and CCTP.'
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 space-y-8">
        
        {/* Page Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-50 text-cyan-700 border border-cyan-100 rounded-lg text-xs font-mono font-bold uppercase">
            Platform Help Center
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
            Frequently Asked Questions
          </h1>
          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            Find simple, clear answers to common questions about CargoTrust trade mechanics, USDC escrows, and Arc Testnet transactions.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="space-y-4">
          <div className="relative input-group-container flex items-center px-4 py-2 border border-slate-200/80 bg-white rounded-2xl shadow-sm">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input 
              type="text" 
              placeholder="Search FAQs by keywords (e.g. escrow, lab, USDC)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-sm px-3 py-1 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 justify-center">
            {['all', 'general', 'technical', 'security', 'financial'].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat as any);
                  setExpandedIndex(null);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize border transition-all duration-200 ${
                  activeCategory === cat
                    ? 'bg-slate-950 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-500 border-slate-200/60 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {cat === 'all' ? 'All Questions' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* FAQs Accordion */}
        <div className="space-y-3">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, idx) => {
              const isExpanded = expandedIndex === idx;
              return (
                <div 
                  key={idx} 
                  className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm transition-all duration-200 hover:border-slate-300"
                >
                  <button
                    onClick={() => toggleExpand(idx)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left gap-4"
                  >
                    <span className="font-bold text-slate-900 text-sm sm:text-base">{faq.q}</span>
                    <span className="p-1 bg-slate-50 border border-slate-100 rounded-lg text-slate-500 shrink-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                      >
                        <div className="px-6 pb-5 pt-1 text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-slate-50">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          ) : (
            <div className="bg-white border border-dashed border-slate-200 text-center py-12 rounded-2xl space-y-3">
              <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-slate-500 text-sm font-semibold">No questions matched your search query</p>
              <button 
                onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                className="text-xs text-cyan-600 font-bold hover:underline"
              >
                Clear Search Filters
              </button>
            </div>
          )}
        </div>

        {/* Support CTA Callout */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-1.5 text-left">
            <h3 className="font-bold text-lg">Still have questions?</h3>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Can't find the answer you are looking for? Contact our support desk. We are here to help developers, producers, and buyers get onboarded.
            </p>
          </div>
          <div className="flex gap-3 shrink-0 w-full md:w-auto">
            <a 
              href="mailto:support@cargotrust.com"
              className="flex-1 md:flex-none h-10 px-4 bg-white hover:bg-slate-100 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <Mail className="w-4 h-4" />
              Contact Support
            </a>
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}
