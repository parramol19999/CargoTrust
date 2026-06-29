'use client';

import React, { useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  BookOpen, 
  Terminal, 
  Code, 
  Play, 
  Check, 
  Copy, 
  ChevronRight, 
  ShieldCheck, 
  Cpu, 
  Layers, 
  Lock, 
  Database, 
  Leaf, 
  Search, 
  AlertTriangle, 
  Info, 
  Server, 
  Wifi, 
  Key, 
  Activity, 
  HelpCircle, 
  HelpCircle as QuestionIcon,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  FileCode,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types for Documentation System
interface DocSection {
  id: string;
  title: string;
  category: 'Getting Started' | 'Core Modules' | 'Developer Reference' | 'Architecture & Resiliency' | 'Support & FAQs';
  icon: any;
  summary: string;
}

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<string>('intro');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  
  // Interactive troubleshooting state
  const [troubleSymptom, setTroubleSymptom] = useState<string | null>(null);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Sections Registry
  const docSections: DocSection[] = [
    { id: 'intro', title: 'Introduction', category: 'Getting Started', icon: BookOpen, summary: 'Understand the CargoTrust trust protocol and crop tokenization vision.' },
    { id: 'quickstart', title: 'Quick Start (< 10 mins)', category: 'Getting Started', icon: Play, summary: 'Create your first digital twin crop NFT and test escrow locks.' },
    { id: 'concepts', title: 'Core Architecture', category: 'Getting Started', icon: Layers, summary: 'High-level look at the CargoTrust decentralized commerce layers.' },
    
    { id: 'twins', title: 'Digital Crop Twins', category: 'Core Modules', icon: Leaf, summary: 'Purity, weight, coordinates, and laboratory certification anchor specifications.' },
    { id: 'escrows', title: 'Programmatic Escrow', category: 'Core Modules', icon: Lock, summary: 'Locking digital dollar USDC and resolving buyer/seller settlements.' },
    { id: 'agents', title: 'IoT Cold-Chain Tracking', category: 'Core Modules', icon: Cpu, summary: 'Autonomous shipping telemetry checks and temperature compliance.' },
    
    { id: 'endpoints', title: 'REST API Gateway', category: 'Developer Reference', icon: Terminal, summary: 'Integrate CargoTrust ERP gateway endpoints with REST APIs.' },
    { id: 'sdk', title: 'Client Smart Contracts', category: 'Developer Reference', icon: Code, summary: 'Interact directly with contract logic using viem/ethers.' },
    { id: 'webhooks', title: 'Automated Webhooks', category: 'Developer Reference', icon: Wifi, summary: 'Receive instant dispatch notices on supply chain registry events.' },
    
    { id: 'flow', title: 'Transaction Lifecycles', category: 'Architecture & Resiliency', icon: Activity, summary: 'Visualized state changes and CCTP cross-chain bridge steps.' },
    { id: 'security', title: 'Passkeys & MPC Security', category: 'Architecture & Resiliency', icon: ShieldCheck, summary: 'How WebAuthn biometrics shield Developer-Controlled Wallets.' },
    
    { id: 'troubleshoot', title: 'Troubleshooting System', category: 'Support & FAQs', icon: AlertTriangle, summary: 'Interactive decision tree for RPC faults and bridge latency.' },
    { id: 'faq', title: 'Frequently Asked Questions', category: 'Support & FAQs', icon: HelpCircle, summary: 'Find quick answers to common B2B trade questions.' }
  ];

  // Filtering sections based on search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return docSections;
    const query = searchQuery.toLowerCase();
    return docSections.filter(s => 
      s.title.toLowerCase().includes(query) || 
      s.summary.toLowerCase().includes(query) || 
      s.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Code snippets definitions
  const codeMint = `import { createWalletClient, http } from 'viem';
import { arcTestnet } from '@/lib/chains';

const client = createWalletClient({
  chain: arcTestnet,
  transport: http()
});

// Mint cargo twin NFT
const txHash = await client.writeContract({
  address: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',
  abi: TWIN_REGISTRY_ABI,
  functionName: 'mintCropTwin',
  args: [
    'Coffee Arabica - Grade A',
    'Dalat, Vietnam',
    45000, // weight: 45.0 Tons
    'https://ipfs.io/ipfs/QmZ...',
    '0xVerifierAddress'
  ]
});
console.log('Transaction hash:', txHash);`;

  const codeEscrow = `// Create programmatic escrow account
const txHash = await client.writeContract({
  address: '0x80537e4e8bAb73D21096baa3a8c813b45CA0b7c9',
  abi: CARGO_ESCROW_ABI,
  functionName: 'createEscrow',
  args: [
    12, // cropTokenId
    '0xProducerSellerAddress',
    75000000000n, // amount: 75,000.00 USDC (6 decimals)
    '0x036CbD53842c5426634e7929541eC2318f3dCF7e' // USDC Address
  ]
});`;

  const codeRestBuy = `curl -X POST https://localhost:3001/api/v1/listings/buy \\
  -H "x-api-key: cg_live_4a11fde891cc7721a48c" \\
  -H "Content-Type: application/json" \\
  -d '{
    "listingId": "18",
    "buyerAddress": "0x25a6Ef899bCDe0891a27e...",
    "stablecoin": "USDC"
  }'`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      <div className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Banner with Search */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-900 text-white p-8 shadow-md mb-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-widest text-teal-400 font-bold block">
                CARGOTRUST DEVPACK
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                Developer Documentation Portal
              </h1>
              <p className="text-slate-350 text-xs max-w-xl leading-relaxed">
                Explore the API architectures, secure escrow mechanics, and CCTP cross-chain setups built on Arc Testnet. 
              </p>
            </div>
            
            <div className="relative w-full max-w-md md:ml-auto">
              <Search className="absolute left-4 top-3.5 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search endpoints, guides, and errors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-400 focus:bg-white/15 transition-all shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Documentation Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Navigation Sidebar */}
          <div className="lg:col-span-3 space-y-4 sticky top-6">
            <div className="flex items-center justify-between px-3 pb-2 border-b border-slate-250">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-3 bg-indigo-600 rounded-full" />
                <h2 className="text-[10px] font-mono tracking-widest uppercase text-slate-400 font-bold">
                  Navigation
                </h2>
              </div>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-[9px] font-bold text-indigo-650 hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
            
            <nav className="space-y-4 pt-1">
              {['Getting Started', 'Core Modules', 'Developer Reference', 'Architecture & Resiliency', 'Support & FAQs'].map((category) => {
                const categorySections = filteredSections.filter(s => s.category === category);
                if (categorySections.length === 0) return null;
                
                return (
                  <div key={category} className="space-y-1">
                    <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest px-3 block mb-1">
                      {category}
                    </span>
                    {categorySections.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[11px] font-bold transition-all duration-200 border ${
                            isActive
                              ? 'bg-slate-950 text-white border-slate-950 shadow-sm'
                              : 'text-slate-500 hover:text-slate-950 hover:bg-slate-100 bg-white border-slate-200/80 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            <span>{item.title}</span>
                          </div>
                          <ChevronRight className="w-3 h-3 opacity-50" />
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Right Main Content Panel */}
          <div className="lg:col-span-9 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm min-h-[500px]">
            
            {/* Section 1: Introduction */}
            {activeTab === 'intro' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">Introduction</h2>
                  <p className="text-slate-500 text-xs mt-1">Establishing cryptographic trust in B2B physical commodity trade.</p>
                </div>
                
                <hr className="border-slate-100" />
                
                <div className="space-y-4 text-slate-650 text-xs sm:text-sm leading-relaxed">
                  <p>
                    <strong className="text-slate-900">CargoTrust</strong> is a web3 B2B commerce platform built on the <strong className="text-slate-900">Arc blockchain</strong>, powered by USDC as the native gas token. It bridges the gap between physical agricultural assets and on-chain financial trust, ensuring transparent, immutable, and secure trades.
                  </p>

                  <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex gap-3 text-xs text-indigo-900">
                    <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Design Paradigm</span>
                      <span className="leading-normal">
                        Every physical crop shipment is registered as a unique Digital Twin NFT. The NFT represents legal title, verified assay results, and IoT trackings, ensuring that buyers only pay when conditions match.
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 pt-2">Core Commerce Pillars</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="p-4 rounded-2xl border border-slate-150 bg-slate-50 space-y-2">
                      <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 w-fit">
                        <Leaf className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-slate-950 text-xs">1. Crop Digital Twin</h4>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Tokenizes crop provenance on-chain. Stores harvest time, weight, geolocation, and IPFS metadata links.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-150 bg-slate-50 space-y-2">
                      <div className="p-2 bg-cyan-50 rounded-xl text-cyan-600 w-fit">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-slate-950 text-xs">2. Verifiable Quality</h4>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Trusted inspectors sign and anchor quality reports on-chain, eliminating cargo grade misrepresentation.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-150 bg-slate-50 space-y-2">
                      <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 w-fit">
                        <Lock className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-slate-950 text-xs">3. Escrow Settlements</h4>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Buyers lock USDC in a programmatic smart contract that auto-releases upon verification or delivery.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 2: Quick Start */}
            {activeTab === 'quickstart' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">Quick Start Guide</h2>
                  <p className="text-slate-500 text-xs mt-1">Get started using the platform in under 10 minutes.</p>
                </div>

                <hr className="border-slate-100" />

                <div className="space-y-6 text-slate-650 text-xs sm:text-sm">
                  <div className="flex gap-4 items-start">
                    <div className="w-7 h-7 rounded-full bg-slate-950 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 text-xs">Setup Biometric Passkey Wallet</h3>
                      <p className="text-slate-500">
                        Input your email in the top navigation panel. Complete the OTP loop and verify your browser passkey. Circle Programmable Wallets SDK creates a gas-sponsored Smart Account on Arc Testnet automatically.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-7 h-7 rounded-full bg-slate-950 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 text-xs">Register Crop Receipt</h3>
                      <p className="text-slate-500">
                        Go to the **Sourcing & Trading Desk** tab. Fill out crop variables: Commodity, Origin country, coordinates, and laboratory address. Confirm the transaction with your biometric passkey.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-7 h-7 rounded-full bg-slate-950 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 text-xs">Simulate Escrow Lock</h3>
                      <p className="text-slate-500">
                        The buyer navigates to the **Escrow Manager** tab, sets a purchase value (in USDC), and deposits the digital dollars. The assets are locked securely inside the escrow smart contract.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-7 h-7 rounded-full bg-slate-950 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      4
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 text-xs">Inspect & Disburse</h3>
                      <p className="text-slate-500">
                        Open the **Verifier Portal** page. Sign off on the crop batch quality metrics. Escrow triggers immediate USDC release to the producer, and transfers crop registry NFT ownership to the buyer.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 3: Concepts */}
            {activeTab === 'concepts' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">Core Architecture Overview</h2>
                  <p className="text-slate-500 text-xs mt-1">Under the hood of the B2B settlement system.</p>
                </div>

                <hr className="border-slate-100" />

                <div className="space-y-4 text-slate-650 text-xs sm:text-sm leading-relaxed">
                  <p>
                    CargoTrust simplifies B2B agricultural commerce by removing intermediaries through three decentralized tech layers:
                  </p>

                  <h3 className="font-bold text-slate-950 text-xs uppercase tracking-widest pt-2">1. Protocol Layer (Arc Chain)</h3>
                  <p>
                    Arc serves as the native settlement ledger. Unlike general blockchains (Ethereum, Arbitrum), Arc Testnet natively supports **USDC as the gas currency**. Exporters and cargo verifiers do not need to purchase volatile native tokens (like ETH or MATIC) to complete transactions, reducing operational friction.
                  </p>

                  <h3 className="font-bold text-slate-950 text-xs uppercase tracking-widest pt-2">2. Identity & Wallet Layer (Circle W3S)</h3>
                  <p>
                    Biometric WebAuthn keys generate secure, non-custodial smart wallets via **Circle User-Controlled Wallets SDK**. Exporters approve transfers using fingerprint/face ID, abstracting complex seed phrase management while maintaining full self-custody.
                  </p>

                  <h3 className="font-bold text-slate-950 text-xs uppercase tracking-widest pt-2">3. Connectivity & Telemetry Layer (IoT Agents)</h3>
                  <p>
                    Automated IoT tracking devices poll metrics like shipping temperature and humidity. An agent network evaluates limits and anchors alerts to the batch twin, validating quality guarantees.
                  </p>
                </div>
              </div>
            )}

            {/* Section 4: Digital Crop Twins */}
            {activeTab === 'twins' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">Digital Crop Twins</h2>
                  <p className="text-slate-500 text-xs mt-1">Cryptographic proof-of-origin registry parameters.</p>
                </div>

                <hr className="border-slate-100" />

                <div className="space-y-4 text-slate-650 text-xs sm:text-sm leading-relaxed">
                  <p>
                    Every crop batch creates an on-chain token representing inventory ownership. The metadata record stores:
                  </p>

                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 font-mono text-[11px] text-slate-700 space-y-2">
                    <div>struct CropTwin &#123;</div>
                    <div className="pl-4">uint256 tokenId;</div>
                    <div className="pl-4">string commodityName;</div>
                    <div className="pl-4">string originLocation;</div>
                    <div className="pl-4">uint256 weightInKg;</div>
                    <div className="pl-4">string ipfsMetadataUri;</div>
                    <div className="pl-4">address designatedVerifier;</div>
                    <div className="pl-4">bool qualityApproved;</div>
                    <div>&#125;</div>
                  </div>

                  <h3 className="font-bold text-slate-950 text-xs">Best Practices</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Generate the `ipfsMetadataUri` containing verifiable documents (such as certificates of origin, local lab sheets) before calling the registry.</li>
                    <li>Always assign a verified Laboratory address as the `designatedVerifier` to avoid unauthorized quality sign-offs.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Section 5: Escrow */}
            {activeTab === 'escrows' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">Programmatic Escrow</h2>
                  <p className="text-slate-500 text-xs mt-1">USDC payment lockups and multi-signature resolution.</p>
                </div>

                <hr className="border-slate-100" />

                <div className="space-y-4 text-slate-650 text-xs sm:text-sm leading-relaxed">
                  <p>
                    The escrow contract securely locks B2B purchase funds in USDC stablecoin. Rather than trusting foreign buyers, sellers know funds are secured once on-chain.
                  </p>

                  <h3 className="font-bold text-slate-950 text-xs">Settlement Conditions</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-slate-900">Release:</strong> Triggered programmatically when the designated verifier updates the digital twin's `qualityApproved` to `true`.</li>
                    <li><strong className="text-slate-900">Refund:</strong> Triggered if the verifier rejects quality compliance, returning all locked USDC to the buyer.</li>
                  </ul>

                  <div className="bg-amber-50 border border-amber-250 rounded-2xl p-4 flex gap-3 text-xs text-amber-900">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Escrow Expiry Notice</span>
                      <span>
                        Escrows include a 30-day lock expiry. If no verifier signature is supplied within 30 days, the buyer can retrieve locked USDC directly.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 6: IoT Tracking */}
            {activeTab === 'agents' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">IoT Cold-Chain Telemetry</h2>
                  <p className="text-slate-500 text-xs mt-1">Connecting logistics sensors with autonomous agent alarms.</p>
                </div>

                <hr className="border-slate-100" />

                <div className="space-y-4 text-slate-650 text-xs sm:text-sm leading-relaxed">
                  <p>
                    Shipment containers carrying organic or premium crops are equipped with IoT temperature sensors. CargoTrust pulls logs via autonomous nodes to enforce compliance checks:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-150 bg-slate-50 space-y-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Temperature Threshold</span>
                      <p className="text-xs font-bold text-slate-800">Must remain between 2°C and 8°C</p>
                      <p className="text-[11px] text-slate-500">Continuous excursion beyond 4 hours flags an anomaly.</p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-150 bg-slate-50 space-y-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Humidity Threshold</span>
                      <p className="text-xs font-bold text-slate-800">Must not exceed 65% RH</p>
                      <p className="text-[11px] text-slate-500">Moisture spikes trigger quality rejection rules.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 7: REST API */}
            {activeTab === 'endpoints' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">REST API Gateway</h2>
                  <p className="text-slate-500 text-xs mt-1">ERP machine-to-machine REST calls catalog.</p>
                </div>

                <hr className="border-slate-100" />

                <div className="space-y-6 text-slate-650 text-xs sm:text-sm">
                  {/* Endpoint 1 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                      <div className="flex gap-2">
                        <span className="text-emerald-700 font-black">POST</span>
                        <span className="text-slate-850 font-bold">/api/v1/batches</span>
                      </div>
                      <span className="text-slate-400">Mint Crop Twin</span>
                    </div>
                    <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-[11px] font-mono overflow-x-auto leading-relaxed border border-slate-900">
{`{
  "origin": "Loire Valley, France",
  "harvestDate": 1782663211,
  "latLong": "47.4116, 0.8932",
  "ipfsMetadata": "ipfs://QmYwAPzWJy...",
  "weight": 120
}`}
                    </pre>
                  </div>

                  {/* Endpoint 2 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                      <div className="flex gap-2">
                        <span className="text-emerald-700 font-black">POST</span>
                        <span className="text-slate-850 font-bold">/api/v1/listings/buy</span>
                      </div>
                      <span className="text-slate-400">Lock Escrow B2B Purchase</span>
                    </div>
                    <div className="relative">
                      <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-[11px] font-mono overflow-x-auto leading-relaxed border border-slate-900">
                        {codeRestBuy}
                      </pre>
                      <button
                        onClick={() => handleCopy(codeRestBuy, 'restbuy')}
                        className="absolute top-2.5 right-2.5 p-1.5 bg-slate-900 border border-slate-850 rounded-lg text-slate-400 hover:text-white"
                      >
                        {copied === 'restbuy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 8: SDK */}
            {activeTab === 'sdk' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">Client SDK & Contracts</h2>
                  <p className="text-slate-500 text-xs mt-1">Web3 contract call setups using viem / wagmi client libraries.</p>
                </div>

                <hr className="border-slate-100" />

                <div className="space-y-6">
                  {/* Code 1 */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
                      <span>Mint Crop Digital Twin via viem</span>
                      <button 
                        onClick={() => handleCopy(codeMint, 'sdk-mint')}
                        className="flex items-center gap-1 hover:text-slate-950 transition"
                      >
                        {copied === 'sdk-mint' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied === 'sdk-mint' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-[11px] font-mono overflow-x-auto leading-relaxed border border-slate-900">
                      {codeMint}
                    </pre>
                  </div>

                  {/* Code 2 */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
                      <span>Lock B2B Escrow Funds via SDK</span>
                      <button 
                        onClick={() => handleCopy(codeEscrow, 'sdk-escrow')}
                        className="flex items-center gap-1 hover:text-slate-950 transition"
                      >
                        {copied === 'sdk-escrow' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied === 'sdk-escrow' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-[11px] font-mono overflow-x-auto leading-relaxed border border-slate-900">
                      {codeEscrow}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* Section 9: Webhooks */}
            {activeTab === 'webhooks' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">Automated Webhooks</h2>
                  <p className="text-slate-500 text-xs mt-1">Setup real-time callbacks on supply chain ledger events.</p>
                </div>

                <hr className="border-slate-100" />

                <div className="space-y-4 text-slate-650 text-xs sm:text-sm leading-relaxed">
                  <p>
                    Webhooks dispatch automated JSON POST payloads directly to your endpoint when events occur on-chain:
                  </p>

                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-3">
                    <div className="flex justify-between text-xs border-b border-slate-200/60 pb-2">
                      <span className="font-bold text-slate-950">Event Name</span>
                      <span className="font-bold text-slate-950">Trigger Condition</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-mono">
                      <span>CargoMinted</span>
                      <span className="text-slate-550">Crop Twin registered on Arc Testnet</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-mono">
                      <span>CargoPurchased</span>
                      <span className="text-slate-550">Escrow deposit has been locked in USDC</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-mono">
                      <span>CargoVerified</span>
                      <span className="text-slate-550">Verifier signed verification approval</span>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-950 text-xs pt-2">Payload Verification & Signing</h3>
                  <p>
                    Each webhook payload is signed with a secret hash. To confirm dispatch authenticity, calculate the HMAC SHA255 signature and compare it with the `x-signature` header:
                  </p>
                  <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-[11px] font-mono overflow-x-auto leading-relaxed border border-slate-900">
{`const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(JSON.stringify(payload))
  .digest('hex');`}
                  </pre>
                </div>
              </div>
            )}

            {/* Section 10: Flow Lifecycles */}
            {activeTab === 'flow' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">Transaction Lifecycles</h2>
                  <p className="text-slate-500 text-xs mt-1">Step-by-step visual lookup of settlement flows.</p>
                </div>

                <hr className="border-slate-100" />

                <div className="space-y-6 text-slate-650 text-xs sm:text-sm">
                  <p>
                    Below is the sequence diagram illustrating how crop twins, lab attestations, and escrow release settlements execute asynchronously:
                  </p>

                  {/* Flow chart layout via styled components */}
                  <div className="border border-slate-200/80 rounded-2xl p-5 bg-slate-50 space-y-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center">
                      <div className="p-3 bg-white border border-slate-200 rounded-xl w-full md:w-1/4">
                        <span className="block font-bold text-slate-950 text-[11px]">1. Mint</span>
                        <span className="text-[10px] text-slate-400">Crop Digital Twin registered</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 rotate-90 md:rotate-0" />
                      <div className="p-3 bg-white border border-slate-200 rounded-xl w-full md:w-1/4">
                        <span className="block font-bold text-slate-950 text-[11px]">2. Lock</span>
                        <span className="text-[10px] text-slate-400">USDC locked in Escrow</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 rotate-90 md:rotate-0" />
                      <div className="p-3 bg-white border border-slate-200 rounded-xl w-full md:w-1/4">
                        <span className="block font-bold text-slate-950 text-[11px]">3. Certify</span>
                        <span className="text-[10px] text-slate-400">Verifier signs quality</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 rotate-90 md:rotate-0" />
                      <div className="p-3 bg-slate-900 border border-slate-800 text-white rounded-xl w-full md:w-1/4">
                        <span className="block font-bold text-[11px]">4. Settle</span>
                        <span className="text-[10px] text-slate-400">USDC disbursed automatically</span>
                      </div>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-950 text-xs uppercase tracking-widest pt-2">CCTP Cross-Chain Bridge Flow</h3>
                  <p>
                    Cross-chain deposits integrate Circle's Cross-Chain Transfer Protocol (CCTP) directly:
                  </p>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li><strong className="text-slate-900">Token Burn:</strong> Exporter initiates burn of USDC on Base/Arbitrum chain through TokenMessenger contract.</li>
                    <li><strong className="text-slate-900">Iris Attestation:</strong> Backend queries Circle's Attestation iris-api service for attestation signature when the block confirms.</li>
                    <li><strong className="text-slate-900">Mint on Arc:</strong> Relayer submits attestation to mint equivalent USDC natively on Arc Testnet.</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Section 11: Security & MPC */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">Passkeys & MPC Security</h2>
                  <p className="text-slate-500 text-xs mt-1">Shielding non-custodial accounts with multi-party computing keys.</p>
                </div>

                <hr className="border-slate-100" />

                <div className="space-y-4 text-slate-650 text-xs sm:text-sm leading-relaxed">
                  <p>
                    CargoTrust prioritizes corporate fund security. Accounts employ cryptographic security mechanisms:
                  </p>

                  <h3 className="font-bold text-slate-950 text-xs pt-2">Multi-Party Computation (MPC)</h3>
                  <p>
                    Instead of a single private key stored on device, the wallet key is split into multiple shards distributed across the client device, Circle's secure hardware modules, and a backup vault. A transaction requires biometric confirmation to co-sign the payload, preventing single-point key compromise.
                  </p>

                  <h3 className="font-bold text-slate-950 text-xs pt-2">WebAuthn Passkey Standards</h3>
                  <p>
                    Exporters confirm smart contract executions using built-in biometric sensors (TouchID, FaceID). This makes phishing impossible, as the passkey is domain-bound and cryptographically linked to the specific URL origin.
                  </p>
                </div>
              </div>
            )}

            {/* Section 12: Troubleshooting System */}
            {activeTab === 'troubleshoot' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">Interactive Troubleshooting Desk</h2>
                  <p className="text-slate-500 text-xs mt-1">Diagnostic tree for smart contract execution exceptions.</p>
                </div>

                <hr className="border-slate-100" />

                <div className="space-y-6 text-slate-650 text-xs sm:text-sm">
                  <p>
                    Select a symptom to find the solution and validation steps:
                  </p>

                  {/* Diagnostic selector */}
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={() => setTroubleSymptom('low-gas')}
                      className={`px-3.5 py-2 border rounded-xl text-xs font-semibold ${
                        troubleSymptom === 'low-gas' ? 'bg-indigo-950 text-white border-indigo-950' : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      Transaction revert/fail
                    </button>
                    <button
                      onClick={() => setTroubleSymptom('cctp-timeout')}
                      className={`px-3.5 py-2 border rounded-xl text-xs font-semibold ${
                        troubleSymptom === 'cctp-timeout' ? 'bg-indigo-950 text-white border-indigo-950' : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      CCTP Bridge Pending / Delay
                    </button>
                    <button
                      onClick={() => setTroubleSymptom('passkey-cancel')}
                      className={`px-3.5 py-2 border rounded-xl text-xs font-semibold ${
                        troubleSymptom === 'passkey-cancel' ? 'bg-indigo-950 text-white border-indigo-950' : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      Passkey Signature Cancelled
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {troubleSymptom === 'low-gas' && (
                      <motion.div
                        key="low-gas"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="p-5 border border-slate-200 rounded-2xl bg-slate-50 space-y-3"
                      >
                        <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          Symptom: Transaction reverts on-chain or fails execution.
                        </h4>
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="font-bold text-slate-900 block">Possible Cause:</span>
                            <span className="text-slate-500">Mempool priorities or gas limit mismatches during peak network load.</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">Resolution:</span>
                            <span className="text-slate-500">Our smart client implements automatic retries with exponential backoff. Wait 10 seconds and re-submit. Ensure your SCA has at least 0.05 USDC native gas remaining.</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">Verification:</span>
                            <span className="text-slate-500">Search the transaction hash on ArcScan to confirm execution status.</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {troubleSymptom === 'cctp-timeout' && (
                      <motion.div
                        key="cctp-timeout"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="p-5 border border-slate-200 rounded-2xl bg-slate-50 space-y-3"
                      >
                        <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          Symptom: Bridge deposit hasn't arrived on Arc Testnet.
                        </h4>
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="font-bold text-slate-900 block">Possible Cause:</span>
                            <span className="text-slate-500">Circle Iris Attestation sandbox API is processing signatures slowly or source chain block finality is pending.</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">Resolution:</span>
                            <span className="text-slate-500">Wait up to 10 minutes. Use the CCTP API tool to query the burn message status using your burn tx hash.</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {troubleSymptom === 'passkey-cancel' && (
                      <motion.div
                        key="passkey-cancel"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="p-5 border border-slate-200 rounded-2xl bg-slate-50 space-y-3"
                      >
                        <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          Symptom: Browser biometric dialog cancels automatically.
                        </h4>
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="font-bold text-slate-900 block">Possible Cause:</span>
                            <span className="text-slate-500">WebAuthn RP (Relying Party) ID domain mismatch (e.g. running on localhost vs IP address).</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">Resolution:</span>
                            <span className="text-slate-500">Ensure the app runs on `localhost` or an HTTPS domain. Browsers block biometric passkeys on raw IP addresses or non-secure origins.</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Section 13: FAQ */}
            {activeTab === 'faq' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">Frequently Asked Questions</h2>
                  <p className="text-slate-500 text-xs mt-1">Quick answers on USDC settlements, escrow conditions, and gas fees.</p>
                </div>

                <hr className="border-slate-100" />

                <div className="space-y-4">
                  {[
                    {
                      q: "Is Arc gas sponsored or must we acquire separate gas tokens?",
                      a: "Arc blockchain is built to use USDC directly as gas. Furthermore, when logged in with a Passkey Smart Account (SCA), your transaction gas fees are fully sponsored by our platform. Exporters pay exactly zero gas costs to mint or settle."
                    },
                    {
                      q: "What happens if a cargo shipment fails quality checks?",
                      a: "The designated lab/verifier signs a quality rejection. The escrow contract immediately releases the locked USDC back to the buyer, and the crop provenance twin registry is flagged as unverified."
                    },
                    {
                      q: "How does the IoT cold-chain telemetry prevent tampering?",
                      a: "IoT tracking devices are registered on-chain with unique signing keys. They submit temperature hashes directly. Tampered or modified payloads mismatch signatures and are rejected by the autonomous validation contract."
                    }
                  ].map((faq, index) => (
                    <div 
                      key={index}
                      className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-sm"
                    >
                      <button
                        onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                        className="w-full flex items-center justify-between p-4 font-bold text-slate-900 text-xs sm:text-sm text-left hover:bg-slate-50/50 transition-colors"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${
                          expandedFAQ === index ? 'rotate-180' : ''
                        }`} />
                      </button>
                      <AnimatePresence>
                        {expandedFAQ === index && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <p className="p-4 pt-0 text-xs text-slate-500 border-t border-slate-100 leading-relaxed bg-slate-50/30">
                              {faq.a}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
