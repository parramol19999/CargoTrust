'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  ArrowRight, 
  ShieldCheck, 
  Leaf, 
  Cpu, 
  Award, 
  Layers, 
  DollarSign, 
  Activity, 
  Globe, 
  ChevronRight, 
  CheckCircle,
  FileText,
  HelpCircle,
  Users,
  Lock,
  Zap
} from 'lucide-react';

export default function LandingPage() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      title: 'Mint Crop Twin',
      desc: 'Producer anchors physical crops (coffee, cocoa, grains) on-chain as tokenized digital twins with origin, volume, and batch details.',
      icon: Leaf,
      color: 'text-emerald-500 bg-emerald-50',
      badge: 'Step 1'
    },
    {
      title: 'Anchor Quality Certificate',
      desc: 'Certified laboratories inspect the cargo and cryptographically sign quality parameters (humidity, grade, purity) directly to the token.',
      icon: Award,
      color: 'text-cyan-500 bg-cyan-50',
      badge: 'Step 2'
    },
    {
      title: 'Lock Escrow Payment',
      desc: 'The B2B buyer locks USDC purchase funds into the CargoTrust smart contract escrow, creating a trustless payment guarantee.',
      icon: Lock,
      color: 'text-blue-500 bg-blue-50',
      badge: 'Step 3'
    },
    {
      title: 'Atomic Ownership Settlement',
      desc: 'Once the lab anchors verification, ownership of the crop twin transfers to the buyer, and USDC is instantly released to the producer.',
      icon: Zap,
      color: 'text-purple-500 bg-purple-50',
      badge: 'Step 4'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 overflow-hidden">
      <Navbar />

      {/* Hero Section - Dark Mesh Premium Gradient Style */}
      <section className="relative bg-[#06070a] text-white pt-24 pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Glow meshes */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />
        
        {/* Fine grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

        <div className="max-w-7xl mx-auto text-center relative z-10 space-y-8">
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold tracking-wide text-cyan-400 font-mono"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Stablecoin Commerce Challenge • Arc Testnet
          </motion.div>

          {/* Heading */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1] font-sans"
          >
            Financializing Global Supply Chains with <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-blue-500 bg-clip-text text-transparent">Absolute Trust</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            CargoTrust bridges agricultural trade and decentralized finance. Anchor crop provenance, verify laboratory testing, and automate B2B settlements using USDC on the ultra-fast Arc blockchain.
          </motion.p>

          {/* CTAs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link 
              href="/dashboard"
              className="w-full sm:w-auto h-12 px-8 bg-white hover:bg-slate-100 text-slate-950 font-bold rounded-xl transition duration-200 shadow-lg shadow-white/5 flex items-center justify-center gap-2 group"
            >
              Launch Operations Desk
              <ArrowRight className="w-4 h-4 transition duration-200 group-hover:translate-x-1" />
            </Link>
            <Link 
              href="/docs"
              className="w-full sm:w-auto h-12 px-8 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-xl border border-slate-800 hover:border-slate-700 transition duration-200 flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4 text-slate-400" />
              Documentation
            </Link>
          </motion.div>

          {/* Interactive Flow Widget (Dashboard Preview mockup) */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="pt-10 max-w-5xl mx-auto"
          >
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 backdrop-blur-xl p-3 sm:p-5 shadow-2xl relative">
              <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
              {/* Window Header */}
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-900 text-xs px-2 text-slate-500 font-mono">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500/70" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/70" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
                  </div>
                  <span className="ml-2 hidden sm:inline text-slate-400">cargotrust-ops-console.sh</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-emerald-400">ARC TESTNET ACTIVE</span>
                </div>
              </div>
              
              {/* Mockup Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left p-2 sm:p-4 text-sm font-sans">
                {/* Panel 1: Digital Twin */}
                <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/80 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono text-cyan-400">CARGO_TWIN_NFT</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold">MINTED</span>
                  </div>
                  <h3 className="font-bold text-slate-200">Ethiopian Arabica Coffee</h3>
                  <div className="space-y-1 text-xs text-slate-400 font-mono">
                    <p>Origin: Yirgacheffe, ET</p>
                    <p>Volume: 18.5 Metric Tons</p>
                    <p>Owner: 0x71C9...89F2</p>
                  </div>
                  <div className="border-t border-slate-900 pt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>Certificates: 1 Anchored</span>
                    <Award className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>

                {/* Panel 2: Verified Parameters */}
                <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/80 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono text-cyan-400">QUALITY_CERT</span>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono font-bold">VERIFIED</span>
                  </div>
                  <h3 className="font-bold text-slate-200">Agronomica Laboratory Ltd.</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-slate-900/60 p-2 rounded">
                      <p className="text-[10px] text-slate-500">HUMIDITY</p>
                      <p className="font-bold text-slate-200">11.2% (OK)</p>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded">
                      <p className="text-[10px] text-slate-500">GRADE</p>
                      <p className="font-bold text-slate-200">Grade 1 Premium</p>
                    </div>
                  </div>
                  <div className="border-t border-slate-900 pt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>Signature: Verified 📝</span>
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  </div>
                </div>

                {/* Panel 3: Escrow Status */}
                <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/80 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono text-cyan-400">ESCROW_CONTRACT</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono font-bold">RELEASED</span>
                  </div>
                  <h3 className="font-bold text-slate-200">B2B Trade Settlement</h3>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono text-slate-400">
                      <span>Fund Lock:</span>
                      <span className="text-white font-bold">75,000.00 USDC</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono text-slate-400">
                      <span>Gas Token:</span>
                      <span className="text-slate-300">USDC (Gas-free)</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-500 h-1.5 w-full rounded-full" />
                    </div>
                  </div>
                  <div className="border-t border-slate-900 pt-2 flex items-center justify-between text-xs text-emerald-400 font-mono">
                    <span>Funds Transferred ✓</span>
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column: Storytelling content */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-xs font-mono font-bold uppercase">
              The Trade Problem
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
              International B2B commerce is slow, paper-driven, and expensive.
            </h2>
            <p className="text-slate-600 leading-relaxed text-base">
              Today’s agricultural trade relies on paper bills of lading, manual fax confirmations, and expensive bank letters of credit. Trust is fragmented, wire transfers take 3–5 business days, and fraud in quality testing certificates is a constant threat for importers.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✕</span>
                <p className="text-sm text-slate-600"><strong className="text-slate-800">Falsified Lab Assays:</strong> Certificates are photocopied or altered, masking inferior crop qualities.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✕</span>
                <p className="text-sm text-slate-600"><strong className="text-slate-800">High Escrow Friction:</strong> Third-party escrow agents charge high fees and introduce operational delays.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✕</span>
                <p className="text-sm text-slate-600"><strong className="text-slate-800">Payment Fragmentations:</strong> Working capital is locked in multi-day cross-border wire clearances.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Solution card grid */}
          <div className="bg-slate-50 border border-slate-200/80 p-8 rounded-3xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-mono font-bold uppercase">
              The CargoTrust Solution
            </div>
            <h3 className="text-2xl font-bold text-slate-900">
              Modernizing supply chains with on-chain trust assets.
            </h3>
            
            <div className="space-y-4">
              <div className="bg-white border border-slate-100 p-4 rounded-2xl flex gap-4 shadow-sm">
                <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 shrink-0 h-10 w-10 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-950 text-sm">Verifiable Quality Attestations</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Laboratory signatures are anchored directly onto the digital crop token, making quality parameters completely immutable.</p>
                </div>
              </div>

              <div className="bg-white border border-slate-100 p-4 rounded-2xl flex gap-4 shadow-sm">
                <div className="p-2.5 bg-cyan-50 rounded-xl text-cyan-600 shrink-0 h-10 w-10 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-950 text-sm">Atomic Escrow Execution</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Escrows execute programmatically on Arc. Ownership shifts and seller payment releases in a single, atomic block confirmation.</p>
                </div>
              </div>

              <div className="bg-white border border-slate-100 p-4 rounded-2xl flex gap-4 shadow-sm">
                <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600 shrink-0 h-10 w-10 flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-950 text-sm">Native Stablecoin Engine</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Powered by USDC on Arc. Gas fees are abstracted and paid natively in USDC, offering a frictionless web2-like experience.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works (Step-by-Step with visual flow selector) */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 border-y border-slate-200/50">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-50 text-cyan-700 border border-cyan-100 rounded-lg text-xs font-mono font-bold uppercase">
              Operational Flow
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
              How CargoTrust Settles B2B Shipments
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm">
              An elegant, fully automated workflow designed for producers, testing laboratories, and B2B buyers.
            </p>
          </div>

          {/* Interactive Steps Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div 
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`p-6 rounded-3xl border transition-all duration-300 cursor-pointer text-left relative ${
                    activeStep === idx 
                      ? 'bg-white border-slate-300 shadow-md scale-[1.02]' 
                      : 'bg-slate-100/60 border-slate-200/50 hover:bg-slate-100/90'
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className={`p-2.5 rounded-xl shrink-0 ${step.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase bg-slate-200/50 px-2 py-0.5 rounded">
                      {step.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-2">{step.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                  
                  {idx < 3 && (
                    <div className="hidden lg:block absolute right-[-14px] top-[45%] z-10 text-slate-300">
                      <ChevronRight className="w-6 h-6" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-lg text-xs font-mono font-bold uppercase">
              Product Suite
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
              Enterprise Features, Built for Speed
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm">
              All the tools you need to track shipments, anchor laboratory verifications, and finance purchases.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-3xl border border-slate-200/80 bg-white hover:shadow-lg transition duration-300 space-y-4">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 w-fit">
                <Leaf className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Crop Provenance Digital Twins</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Tokenize agricultural assets at origin. Record details on harvests, farmers, and geographic locations to build verifiable proof of sustainable sourcing.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl border border-slate-200/80 bg-white hover:shadow-lg transition duration-300 space-y-4">
              <div className="p-3 bg-cyan-50 rounded-2xl text-cyan-600 w-fit">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Cryptographic Quality Anchoring</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Enable testing laboratories to sign and write certs (grade, moisture levels, impurities) directly to the crop asset, protecting buyers against falsifications.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl border border-slate-200/80 bg-white hover:shadow-lg transition duration-300 space-y-4">
              <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 w-fit">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">USDC Smart Escrow Contracts</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Protect deals without expensive bank letters of credit. Payments are locked in smart contracts and trigger automatically on laboratory verification rules.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-3xl border border-slate-200/80 bg-white hover:shadow-lg transition duration-300 space-y-4">
              <div className="p-3 bg-purple-50 rounded-2xl text-purple-600 w-fit">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">CargoPilot AI Assistant</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Our autonomous AI operator tracks global IoT sensors, alerts when cargo enters custom zones, checks temperature thresholds, and generates supply chain reports.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-3xl border border-slate-200/80 bg-white hover:shadow-lg transition duration-300 space-y-4">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 w-fit">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Crop-Collateralized Finance</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Traders can pledge verified digital twins as collateral to obtain immediate USDC credit lines, bridging cash flow gaps during long shipping times.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-3xl border border-slate-200/80 bg-white hover:shadow-lg transition duration-300 space-y-4">
              <div className="p-3 bg-slate-900 rounded-2xl text-slate-100 w-fit">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">USDC Gas Abstraction</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Zero complex native token management. All transaction gas is settled natively behind the scenes with USDC, offering a polished, professional enterprise feel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Showcase Section (Fast, Better, Cheaper) */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
              Why Traders Choose CargoTrust
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm">
              We eliminate traditional B2B banking delays and paper-based fraud.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-slate-200/80 p-8 rounded-3xl text-left space-y-4 shadow-sm hover:shadow-md transition">
              <span className="text-4xl font-extrabold text-emerald-500 font-mono">10x</span>
              <h3 className="text-lg font-bold text-slate-950">Faster Transactions</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Instead of 3 to 5 business days for bank wire routing and letter of credit verifications, B2B settlements on CargoTrust execute in seconds on Arc Testnet.
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 p-8 rounded-3xl text-left space-y-4 shadow-sm hover:shadow-md transition">
              <span className="text-4xl font-extrabold text-cyan-500 font-mono">90%</span>
              <h3 className="text-lg font-bold text-slate-950">Fee Reductions</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                By removing bank processing fees, documentary collections, and physical inspection mail-routing, transactional overhead costs drop by over 90%.
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 p-8 rounded-3xl text-left space-y-4 shadow-sm hover:shadow-md transition">
              <span className="text-4xl font-extrabold text-purple-500 font-mono">100%</span>
              <h3 className="text-lg font-bold text-slate-950">Counterparty Security</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Funds are locked programmatically in a secure escrow contract. Neither buyer nor seller is exposed to payment defaults or delivery fraud risks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Technology Partners */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto space-y-8 text-center">
          <p className="text-xs font-mono tracking-widest text-slate-400 font-bold uppercase">
            Powered by World-Class Web3 Architecture
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition duration-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-slate-900" />
              <span className="text-slate-900 font-extrabold tracking-tight text-sm">Circle Developer</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-slate-900" />
              <span className="text-slate-900 font-extrabold tracking-tight text-sm">Arc Blockchain</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-slate-900" />
              <span className="text-slate-900 font-extrabold tracking-tight text-sm">Wagmi protocol</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-slate-900" />
              <span className="text-slate-900 font-extrabold tracking-tight text-sm">Framer Motion</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative bg-[#06070a] text-white py-24 px-4 sm:px-6 lg:px-8 text-center overflow-hidden border-t border-slate-900">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Modernize Your B2B Commerce?
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
            Join agricultural importers and exporters worldwide who use CargoTrust to eliminate paperwork, fraud, and payment clearing delays.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-6">
            <Link 
              href="/dashboard"
              className="w-full sm:w-auto h-12 px-8 bg-white hover:bg-slate-100 text-slate-950 font-bold rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg"
            >
              Enter Operations Desk
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/docs"
              className="w-full sm:w-auto h-12 px-8 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-xl border border-slate-800 transition duration-200 flex items-center justify-center gap-2"
            >
              Learn More in Docs
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
