'use client';

import React, { useState } from 'react';
import { useFriendlyMode } from '@/lib/useFriendlyMode';
import { HelpCircle, ToggleLeft, ToggleRight, Sparkles, BookOpen, Lock, Activity, Milestone, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface FriendlyOnboardingProps {
  section: 'desk' | 'escrow' | 'agents' | 'lending' | 'developer' | 'agent-os' | 'verifier' | 'verify' | 'wallet';
}

export default function FriendlyOnboarding({ section }: FriendlyOnboardingProps) {
  const { isSimpleMode, toggleSimpleMode } = useFriendlyMode();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "1. Create Crop Receipt",
      desc: "Produce a digital receipt (crop twin) for your harvest. It records origin, harvest date, and details permanently so buyers know it is authentic.",
      badge: "Farmer Stage"
    },
    {
      title: "2. Verify Quality",
      desc: "An authorized inspector checks the temperature history and coordinates, signing a digital stamp of approval. No paperwork required.",
      badge: "Quality Check"
    },
    {
      title: "3. Safe Payment Escrow",
      desc: "Buyers put digital dollars (USDC) in a secure digital lock-box. Funds are locked and only release when crop ownership changes hands.",
      badge: "Safe Trade"
    },
    {
      title: "4. Automated Settlement",
      desc: "As soon as the buyer accepts the batch, ownership swaps and funds are instantly sent to the farmer. Smooth, safe, and direct.",
      badge: "Payout"
    }
  ];

  const sectionExplanations: Record<string, { title: string; explanation: string; icon: any; nextStep: string }> = {
    desk: {
      title: "Crop Sourcing & Ownership Settlements",
      explanation: "Here you can create a digital representation of your harvest (a digital receipt) and put it up for sale. Buyers can purchase the crop receipt using digital currency. Once purchased, ownership is safely transferred.",
      icon: Milestone,
      nextStep: "Try filling out the 'Create Crop Receipt' form below to register a crop harvested today!"
    },
    escrow: {
      title: "Secure Lock-box (Escrow Account)",
      explanation: "This acts as a neutral middleman. When buying high-value crops, the buyer puts digital dollars here first. The dollars are held safely until the quality is approved or the carrier delivers the shipment, protecting both parties.",
      icon: Lock,
      nextStep: "Select a batch and deposit funds to test the secure payment guarantee."
    },
    agents: {
      title: "Automated Shipping Trackers",
      explanation: "Link IoT smart devices and automated helpers to check shipping temperature in real time. If the temperature exceeds limits, the system triggers alerts or automated cargo refunds.",
      icon: Activity,
      nextStep: "Register a tracking device address to start streaming cold-chain telemetry."
    },
    lending: {
      title: "Instant Crop Lending & Financing",
      explanation: "Need working capital before your crop is sold? Lock your digital crop receipt as collateral to borrow digital dollars (USDC) instantly. Repay the loan when you get paid.",
      icon: BookOpen,
      nextStep: "Check if your crop receipt qualifies for a loan and click 'Draw Loan'."
    },
    developer: {
      title: "Technical Control Center",
      explanation: "For software engineers and partners. Integrate CargoTrust directly into your custom ERP systems, logistics databases, or custom mobile apps.",
      icon: Sparkles,
      nextStep: "Copy the REST endpoints or test payload structures below to query contract addresses."
    },
    'agent-os': {
      title: "CargoPilot Intelligent Helper",
      explanation: "Your conversational companion. Instead of clicking buttons, simply tell CargoPilot what you want to do (e.g. 'Mint a crop harvested in Dalat' or 'Check if batch #3 has loan space') and let the system guide you.",
      icon: Sparkles,
      nextStep: "Ask the chat assistant: 'Mint digital twin for coffee harvest Dalat, Vietnam'"
    },
    verifier: {
      title: "Quality Certifications Hub",
      explanation: "Portal for QA labs and inspectors to review crop records. Sign verified quality statements gaslessly using secure credentials.",
      icon: ShieldCheck,
      nextStep: "Select an unverified crop twin and sign a verification statement."
    },
    verify: {
      title: "Consumer Proof of Authenticity",
      explanation: "A public lookup tool for end consumers. Scan a barcode or search a batch number to view the complete history of your food, from the farm to the processing plant.",
      icon: CheckCircle2,
      nextStep: "Enter a batch number to trace the entire temperature log history."
    },
    wallet: {
      title: "Treasury & Portfolio Desk",
      explanation: "Here you can monitor your digital wallets across multiple blockchains (Arc, Base, Ethereum Sepolia) in one unified dashboard, calculate optimum swap and bridge routes with CCTP, and analyze on-chain logs.",
      icon: Lock,
      nextStep: "Use the 'Tools' tab to calculate bridge or swap routes!"
    }
  };

  const currentInfo = sectionExplanations[section] || {
    title: "CargoTrust Platform",
    explanation: "Secure supply chain tracking using digital receipts and digital currency.",
    icon: Milestone,
    nextStep: ""
  };

  const IconComp = currentInfo.icon;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 md:p-6 shadow-sm space-y-6 relative overflow-hidden">
      {/* Background Subtle Gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50/60 rounded-full blur-2xl -z-10" />

      {/* Mode Control Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
            <IconComp className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-950 flex items-center gap-1.5">
              {currentInfo.title}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                Onboarding Help
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isSimpleMode ? "Showing clear, simplified explanations" : "Showing detailed technical definitions"}
            </p>
          </div>
        </div>

        <button
          onClick={toggleSimpleMode}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl text-xs font-semibold text-slate-800 transition-all"
        >
          {isSimpleMode ? (
            <>
              <ToggleRight className="w-5 h-5 text-emerald-600" />
              <span>🌱 Everyday Language Enabled</span>
            </>
          ) : (
            <>
              <ToggleLeft className="w-5 h-5 text-slate-400" />
              <span>💻 Developer Language Enabled</span>
            </>
          )}
        </button>
      </div>

      {/* Everyday explanation banner */}
      {isSimpleMode && (
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
            {currentInfo.explanation}
          </p>

          {/* Interactive Step-by-Step Walkthrough */}
          <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 md:p-5">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                Interactive Trade Flow Guide
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  {steps[currentStep].title}
                </span>
                <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded font-mono">
                  {steps[currentStep].badge}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-normal">
                {steps[currentStep].desc}
              </p>
            </div>

            <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
              <div className="flex gap-1">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={`w-5 h-1.5 rounded-full transition-all duration-300 ${
                      i === currentStep ? 'bg-cyan-600 w-8' : 'bg-slate-200 hover:bg-slate-300'
                    }`}
                  />
                ))}
              </div>
              
              <button
                onClick={() => setCurrentStep((prev) => (prev + 1) % steps.length)}
                className="flex items-center gap-1 text-[11px] font-bold text-slate-900 hover:text-cyan-700 transition-colors"
              >
                Next Step
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {currentInfo.nextStep && (
            <div className="inline-flex items-center gap-2 text-xs text-cyan-700 bg-cyan-50/50 border border-cyan-100/50 px-3.5 py-2 rounded-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-pulse" />
              <span className="font-semibold">What to do next:</span>
              <span className="text-slate-650">{currentInfo.nextStep}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
