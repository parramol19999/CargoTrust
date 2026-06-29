'use client';

import React, { useState, useEffect } from 'react';
import { useCircleAuth } from './CircleAuth';
import { 
  Wallet, 
  TrendingUp, 
  Activity, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Layers, 
  Shuffle, 
  Share2, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle, 
  Copy, 
  Check, 
  Clock, 
  Globe, 
  Settings, 
  HelpCircle, 
  Loader2, 
  Compass, 
  Zap, 
  PieChart, 
  Fingerprint, 
  Terminal, 
  HeartHandshake,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types and mock analytics interfaces
interface Transaction {
  id: string;
  type: 'transfer_in' | 'transfer_out' | 'swap' | 'bridge_in' | 'bridge_out' | 'payment' | 'escrow';
  chain: string;
  amount: number;
  token: string;
  counterparty: string;
  status: 'confirmed' | 'pending' | 'failed';
  timestamp: string;
}

export default function WalletOverviewDashboard() {
  const { session } = useCircleAuth();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'treasury' | 'analytics' | 'tools' | 'observability'>('treasury');
  
  // Real-time states
  const [liveBalanceArc, setLiveBalanceArc] = useState(42050.22);
  const [liveBalanceBase, setLiveBalanceBase] = useState(12400.00);
  const [liveBalanceSepolia, setLiveBalanceSepolia] = useState(5120.00);
  const [liveBalanceArbitrum, setLiveBalanceArbitrum] = useState(18500.00);
  
  // Simulation interactive states
  const [swapFromAmount, setSwapFromAmount] = useState('1000');
  const [swapToAmount, setSwapToAmount] = useState('920'); // USDC to EURC simulation
  const [slippage, setSlippage] = useState(0.5);
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapStatus, setSwapStatus] = useState<string | null>(null);
  
  const [bridgeSource, setBridgeSource] = useState('base-sepolia');
  const [bridgeAmount, setBridgeAmount] = useState('500');
  const [isBridging, setIsBridging] = useState(false);
  const [bridgeStep, setBridgeStep] = useState(0);
  const [bridgeStatusMsg, setBridgeStatusMsg] = useState('');
  
  // Observability metrics simulation
  const [circleLatency, setCircleLatency] = useState(84);
  const [arcRpcLatency, setArcRpcLatency] = useState(38);
  const [successRate, setSuccessRate] = useState(99.92);

  useEffect(() => {
    // Simulate real-time latency fluctuations
    const interval = setInterval(() => {
      setCircleLatency(Math.floor(80 + Math.random() * 15));
      setArcRpcLatency(Math.floor(35 + Math.random() * 8));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const totalUnifiedBalance = liveBalanceArc + liveBalanceBase + liveBalanceSepolia + liveBalanceArbitrum;

  const handleCopy = () => {
    if (session?.walletAddress) {
      navigator.clipboard.writeText(session.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setIsSwapping(true);
    setSwapStatus('initiating');
    
    // Simulate Circle Swap SDK routing & execution
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSwapStatus('confirming');
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Deduct swapped amount
    const amt = parseFloat(swapFromAmount);
    if (!isNaN(amt)) {
      setLiveBalanceArc((prev) => prev - amt);
    }
    
    setSwapStatus('success');
    setIsSwapping(false);
    setTimeout(() => setSwapStatus(null), 4000);
  };

  const handleBridge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setIsBridging(true);
    
    // Step 1: Burn on Source Chain
    setBridgeStep(1);
    setBridgeStatusMsg('Initiating CCTP token burn on source chain...');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Step 2: Fetch Circle Attestation
    setBridgeStep(2);
    setBridgeStatusMsg('Polling Circle Attestation Service (CCTP Iris)...');
    await new Promise((resolve) => setTimeout(resolve, 2500));
    
    // Step 3: Mint on Destination (Arc Testnet)
    setBridgeStep(3);
    setBridgeStatusMsg('Broadcasting receiveMessage transaction to Arc Testnet...');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Step 4: Complete
    setBridgeStep(4);
    setBridgeStatusMsg('Bridge settlement complete!');
    const amt = parseFloat(bridgeAmount);
    if (!isNaN(amt)) {
      setLiveBalanceArc((prev) => prev + amt);
      if (bridgeSource === 'base-sepolia') setLiveBalanceBase(prev => Math.max(0, prev - amt));
      if (bridgeSource === 'ethereum-sepolia') setLiveBalanceSepolia(prev => Math.max(0, prev - amt));
      if (bridgeSource === 'arbitrum-sepolia') setLiveBalanceArbitrum(prev => Math.max(0, prev - amt));
    }
    
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsBridging(false);
    setBridgeStep(0);
    setBridgeStatusMsg('');
  };

  const mockTransactions: Transaction[] = [
    {
      id: 'tx_cctp_9182',
      type: 'bridge_in',
      chain: 'Base Sepolia → Arc',
      amount: 4500,
      token: 'USDC',
      counterparty: 'TokenMessenger',
      status: 'confirmed',
      timestamp: '2 hours ago',
    },
    {
      id: 'tx_escrow_8817',
      type: 'escrow',
      chain: 'Arc Testnet',
      amount: 12500,
      token: 'USDC',
      counterparty: 'CargoEscrow (0x7e8...1a3)',
      status: 'confirmed',
      timestamp: '1 day ago',
    },
    {
      id: 'tx_swap_7761',
      type: 'swap',
      chain: 'Arc Testnet',
      amount: 2500,
      token: 'USDC → EURC',
      counterparty: 'SwapKit Router',
      status: 'confirmed',
      timestamp: '3 days ago',
    },
    {
      id: 'tx_pay_6619',
      type: 'payment',
      chain: 'Arc Testnet',
      amount: 850,
      token: 'USDC',
      counterparty: 'IoT Agent Tracker #4',
      status: 'confirmed',
      timestamp: '5 days ago',
    },
    {
      id: 'tx_trans_5521',
      type: 'transfer_out',
      chain: 'Arc Testnet',
      amount: 3200,
      token: 'USDC',
      counterparty: '0x152...ef89',
      status: 'confirmed',
      timestamp: '1 week ago',
    }
  ];

  if (!session) {
    return (
      <div className="card-light p-8 text-center border border-slate-200/80 bg-white rounded-3xl shadow-sm">
        <Wallet className="w-12 h-12 text-slate-350 mx-auto mb-4 animate-bounce" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">Connect Your Circle Passkey Wallet</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          Please sign in via the Passkey Portal in the navigation bar to configure your secure multi-chain treasury, verify real-time analytics, and execute atomic settlements.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Treasury Header / Wallet Overview Card */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        {/* Background ambient lighting */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-white/10 rounded-full text-[10px] uppercase font-bold tracking-wider text-slate-200 flex items-center gap-1.5 backdrop-blur-md">
                <Fingerprint className="w-3 h-3 text-cyan-400" />
                Passkey Authenticated
              </span>
              <span className="px-2.5 py-1 bg-indigo-500/30 border border-indigo-400/30 rounded-full text-[10px] uppercase font-bold tracking-wider text-indigo-200 flex items-center gap-1.5 backdrop-blur-md">
                <Zap className="w-3 h-3 text-amber-400 animate-pulse" />
                Gas Sponsored
              </span>
            </div>
            
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Wallet className="w-6 h-6 text-indigo-400" />
              <span>Multi-Chain Treasury Portal</span>
            </h2>
            
            <div className="flex flex-wrap items-center gap-2.5 bg-white/5 border border-white/10 px-3.5 py-2.5 rounded-2xl max-w-lg">
              <span className="text-xs font-mono text-slate-300 truncate select-all">
                {session.walletAddress}
              </span>
              <button 
                onClick={handleCopy}
                className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                title="Copy Smart Account Address"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-md min-w-[240px] space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
              Aggregate Unified Balance
            </span>
            <span className="text-3xl font-black text-white block tracking-tight font-mono">
              ${totalUnifiedBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-300 pt-2 border-t border-white/10 mt-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>SCA Wallet Active on Arc Testnet</span>
            </div>
          </div>
        </div>
      </div>

      {/* Internal Navigation Tabs */}
      <div className="flex border-b border-slate-200/80 gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('treasury')}
          className={`px-5 py-3 border-b-2 font-bold text-xs tracking-wider uppercase transition-all duration-300 shrink-0 ${
            activeTab === 'treasury'
              ? 'border-slate-900 text-slate-950'
              : 'border-transparent text-slate-400 hover:text-slate-950'
          }`}
        >
          <Layers className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
          Treasury Balances
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-5 py-3 border-b-2 font-bold text-xs tracking-wider uppercase transition-all duration-300 shrink-0 ${
            activeTab === 'analytics'
              ? 'border-slate-900 text-slate-950'
              : 'border-transparent text-slate-400 hover:text-slate-950'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
          On-Chain Intelligence
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={`px-5 py-3 border-b-2 font-bold text-xs tracking-wider uppercase transition-all duration-300 shrink-0 ${
            activeTab === 'tools'
              ? 'border-slate-900 text-slate-950'
              : 'border-transparent text-slate-400 hover:text-slate-950'
          }`}
        >
          <Shuffle className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
          Bridge & Swap Desk
        </button>
        <button
          onClick={() => setActiveTab('observability')}
          className={`px-5 py-3 border-b-2 font-bold text-xs tracking-wider uppercase transition-all duration-300 shrink-0 ${
            activeTab === 'observability'
              ? 'border-slate-900 text-slate-950'
              : 'border-transparent text-slate-400 hover:text-slate-950'
          }`}
        >
          <Activity className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
          Observability
        </button>
      </div>

      {/* Main Tab Content panels */}
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          
          {/* Tab 1: Treasury Balances */}
          {activeTab === 'treasury' && (
            <motion.div
              key="treasury"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Left Column: Chain Allocation & Unified Balance Breakdown */}
              <div className="lg:col-span-8 space-y-6">
                <div className="card-light p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Unified Asset Balance Breakdown
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      Instant Cross-Chain Aggregation
                    </span>
                  </div>

                  {/* Chain Balances List */}
                  <div className="space-y-3">
                    {/* Arc Testnet */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-950 text-white font-mono font-bold text-xs flex items-center justify-center border border-slate-800">
                          A
                        </div>
                        <div>
                          <span className="block font-bold text-xs text-slate-900">Arc Blockchain (Gas Native)</span>
                          <span className="block text-[10px] text-slate-400 font-mono">Chain ID: 5042002 • USDC decimals: 18</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block font-bold text-sm font-mono text-slate-900">${liveBalanceArc.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">100.00% USDC</span>
                      </div>
                    </div>

                    {/* Base Sepolia */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center border border-blue-500">
                          B
                        </div>
                        <div>
                          <span className="block font-bold text-xs text-slate-900">Base Sepolia Testnet</span>
                          <span className="block text-[10px] text-slate-400 font-mono">Chain ID: 84532 • USDC decimals: 6</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block font-bold text-sm font-mono text-slate-900">${liveBalanceBase.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">100.00% USDC</span>
                      </div>
                    </div>

                    {/* Arbitrum Sepolia */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-700 text-white font-mono font-bold text-xs flex items-center justify-center border border-cyan-600">
                          Ar
                        </div>
                        <div>
                          <span className="block font-bold text-xs text-slate-900">Arbitrum Sepolia Testnet</span>
                          <span className="block text-[10px] text-slate-400 font-mono">Chain ID: 421614 • USDC decimals: 6</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block font-bold text-sm font-mono text-slate-900">${liveBalanceArbitrum.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">100.00% USDC</span>
                      </div>
                    </div>

                    {/* Ethereum Sepolia */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center border border-indigo-500">
                          E
                        </div>
                        <div>
                          <span className="block font-bold text-xs text-slate-900">Ethereum Sepolia Testnet</span>
                          <span className="block text-[10px] text-slate-400 font-mono">Chain ID: 11155111 • USDC decimals: 6</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block font-bold text-sm font-mono text-slate-900">${liveBalanceSepolia.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">100.00% USDC</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent activity list */}
                <div className="card-light p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Treasury Transaction History
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">Showing Last 5 Activity Entries</span>
                  </div>

                  <div className="space-y-3">
                    {mockTransactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3.5 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl border ${
                            tx.type.includes('in') || tx.type === 'escrow'
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                              : 'bg-rose-50 border-rose-100 text-rose-600'
                          }`}>
                            {tx.type.includes('in') ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="block font-bold text-xs text-slate-950">
                              {tx.type === 'bridge_in' && 'Bridge Deposit (CCTP)'}
                              {tx.type === 'transfer_out' && 'USDC Outgoing Transfer'}
                              {tx.type === 'swap' && 'Swap Execution'}
                              {tx.type === 'payment' && 'M2M Telemetry Fee'}
                              {tx.type === 'escrow' && 'Escrow Deposit'}
                            </span>
                            <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                              {tx.id} • {tx.chain} • {tx.timestamp}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`block font-bold text-xs font-mono ${
                            tx.type.includes('in') ? 'text-emerald-600' : 'text-slate-800'
                          }`}>
                            {tx.type.includes('in') ? '+' : '-'}${tx.amount.toLocaleString()} USDC
                          </span>
                          <span className="block text-[9px] text-slate-400 font-mono">
                            Counterparty: {tx.counterparty}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Allocation & Account Summary */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Visual donut representation via CSS */}
                <div className="card-light p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Asset Allocation Matrix
                  </h3>
                  
                  <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                    {/* Concentric allocation circle illustration */}
                    <div className="absolute inset-0 rounded-full border-[18px] border-slate-100"></div>
                    {/* Simulated color segments using styled relative borders */}
                    <div className="absolute inset-0 rounded-full border-[18px] border-indigo-950 border-r-transparent border-b-transparent animate-spin-slow"></div>
                    <div className="absolute inset-2 rounded-full border-[18px] border-blue-500 border-t-transparent border-l-transparent"></div>
                    <div className="absolute inset-4 rounded-full border-[18px] border-cyan-500 border-t-transparent border-r-transparent"></div>
                    
                    <div className="z-10 text-center">
                      <PieChart className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-400 uppercase font-black">4 Chains</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-indigo-950 shrink-0"></span>
                        <span className="text-slate-600 font-medium">Arc Blockchain</span>
                      </div>
                      <span className="font-bold text-slate-900">53.8%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-cyan-600 shrink-0"></span>
                        <span className="text-slate-600 font-medium">Arbitrum Sepolia</span>
                      </div>
                      <span className="font-bold text-slate-900">23.7%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0"></span>
                        <span className="text-slate-600 font-medium">Base Sepolia</span>
                      </div>
                      <span className="font-bold text-slate-900">15.9%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-indigo-500 shrink-0"></span>
                        <span className="text-slate-600 font-medium">Ethereum Sepolia</span>
                      </div>
                      <span className="font-bold text-slate-900">6.6%</span>
                    </div>
                  </div>
                </div>

                {/* Security details card */}
                <div className="card-light p-6 bg-gradient-to-br from-indigo-50/50 to-teal-50/40 border border-slate-200/80 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Security Specifications
                  </h3>
                  
                  <div className="space-y-3 text-xs leading-relaxed text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Wallet Engine:</span>
                      <span className="font-mono text-slate-900 font-semibold">Circle W3S v2</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Account Type:</span>
                      <span className="font-semibold text-slate-900">SCA (ERC-4337)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Biometrics:</span>
                      <span className="font-semibold text-emerald-600 flex items-center gap-1">
                        WebAuthn Passkey ✓
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Gas Sponsorship:</span>
                      <span className="font-semibold text-emerald-600">Active (Unlimited)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Replay Protection:</span>
                      <span className="font-semibold text-slate-900">ChainID Bound</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab 2: On-Chain Intelligence / Analytics */}
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {/* Card A: Wallet Metrics */}
              <div className="card-light p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Wallet Analytics
                  </span>
                  <Wallet className="w-4 h-4 text-slate-400" />
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-400">Total Transactions</span>
                    <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">47</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Wallet Age</span>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">14 Days Active</p>
                  </div>
                  <div className="border-t border-slate-100 pt-2 flex justify-between text-[10px] text-slate-500 leading-normal">
                    <span>Avg Transfer: $2,400</span>
                    <span>Max: $125k</span>
                  </div>
                </div>
              </div>

              {/* Card B: Stablecoin Concentration */}
              <div className="card-light p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Asset Analytics
                  </span>
                  <DollarSign className="w-4 h-4 text-emerald-500 animate-pulse" />
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-400">USDC Exposure</span>
                    <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">100.0%</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Total Stablecoin Holding</span>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">${totalUnifiedBalance.toLocaleString()} USDC</p>
                  </div>
                  <div className="border-t border-slate-100 pt-2 flex justify-between text-[10px] text-slate-500 leading-normal">
                    <span>Currency: USD</span>
                    <span>Bridges: Active</span>
                  </div>
                </div>
              </div>

              {/* Card C: Sponsored Gas Analytics */}
              <div className="card-light p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Gas Sponsored
                  </span>
                  <Zap className="w-4 h-4 text-amber-500" />
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-400">Cumulative Savings</span>
                    <p className="text-2xl font-black text-emerald-600 font-mono mt-0.5">$42.50</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Sponsored Transactions</span>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">41 Operations</p>
                  </div>
                  <div className="border-t border-slate-100 pt-2 flex justify-between text-[10px] text-slate-500 leading-normal">
                    <span>Sponsor Rate: 100%</span>
                    <span>Paymaster: Circle</span>
                  </div>
                </div>
              </div>

              {/* Card D: Chain Velocity */}
              <div className="card-light p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Network Performance
                  </span>
                  <Activity className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-400">Sub-second Finality</span>
                    <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">~0.8s</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Transaction Velocity</span>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">Instant Confirmation</p>
                  </div>
                  <div className="border-t border-slate-100 pt-2 flex justify-between text-[10px] text-slate-500 leading-normal">
                    <span>RPC Nodes: 3 Live</span>
                    <span>Mempool Lock: Active</span>
                  </div>
                </div>
              </div>

              {/* Large Row: User Insight Dashboard (B2B Trade Behavior) */}
              <div className="md:col-span-2 lg:col-span-4 card-light p-6 bg-gradient-to-br from-indigo-900/10 via-slate-50 to-teal-500/5 border border-slate-200/80 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    On-Chain Trade Behavior Insights
                  </h3>
                  <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-150 text-emerald-700 text-[10px] uppercase font-black rounded-full">
                    Excellent Score
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-400 uppercase font-black">Escrow Locking Velocity</span>
                    <p className="font-bold text-slate-900">High Reliability</p>
                    <p className="text-[10px] leading-relaxed text-slate-400">Escrow commitments resolve inside 24 hours on average.</p>
                  </div>
                  <div className="space-y-2 border-t md:border-t-0 md:border-x border-slate-200/60 md:px-4">
                    <span className="text-[10px] text-slate-400 uppercase font-black">Risk Indicators</span>
                    <p className="font-bold text-emerald-600 flex items-center gap-1">
                      No Flagged IPs
                    </p>
                    <p className="text-[10px] leading-relaxed text-slate-400">Zero transaction rollbacks, signature mismatches or reverts.</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-400 uppercase font-black">Engagement Score</span>
                    <p className="font-bold text-slate-900">Frequent Operator</p>
                    <p className="text-[10px] leading-relaxed text-slate-400">Daily interaction with telemetry contracts and verification staking.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab 3: Interactive Bridge & Swap Portal */}
          {activeTab === 'tools' && (
            <motion.div
              key="tools"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column: CCTP Bridge */}
              <div className="lg:col-span-6 card-light p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Circle CCTP Cross-Chain Bridge
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-5">
                    Bridge USDC between EVM Testnets and Arc Testnet using Circle Cross-Chain Transfer Protocol (CCTP). Burns USDC on source, retrieves signature, and mints gaslessly on Arc.
                  </p>

                  <form onSubmit={handleBridge} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                        Source Network
                      </label>
                      <select
                        value={bridgeSource}
                        onChange={(e) => setBridgeSource(e.target.value)}
                        disabled={isBridging}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                      >
                        <option value="base-sepolia">Base Sepolia (CCTP Domain 6)</option>
                        <option value="arbitrum-sepolia">Arbitrum Sepolia (CCTP Domain 3)</option>
                        <option value="ethereum-sepolia">Ethereum Sepolia (CCTP Domain 0)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                          Destination Chain
                        </label>
                        <input
                          type="text"
                          readOnly
                          value="Arc Testnet"
                          className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                          USDC Amount
                        </label>
                        <input
                          type="number"
                          required
                          value={bridgeAmount}
                          onChange={(e) => setBridgeAmount(e.target.value)}
                          disabled={isBridging}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono"
                        />
                      </div>
                    </div>

                    {isBridging && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                          <span>Progress: Step {bridgeStep} of 4</span>
                          <span className="text-teal-600 font-mono">{bridgeStep * 25}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-650 h-full transition-all duration-300"
                            style={{ width: `${bridgeStep * 25}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 italic block">
                          {bridgeStatusMsg}
                        </span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isBridging || !session}
                      className="w-full py-3 bg-slate-950 hover:bg-slate-900 disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      {isBridging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                      Start Bridge Transfer
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Swap Desk */}
              <div className="lg:col-span-6 card-light p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Shuffle className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Circle Swap Kit Desk
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-5">
                    Convert USDC to EURC or wrap tokens instantly inside the same chain. Employs direct slippage configuration, automated liquidity calculation, and signature security checks.
                  </p>

                  <form onSubmit={handleSwap} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                          From Asset
                        </label>
                        <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800">
                          <option>USDC (USD Dollar Stable)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                          Sell Amount
                        </label>
                        <input
                          type="number"
                          required
                          value={swapFromAmount}
                          onChange={(e) => {
                            setSwapFromAmount(e.target.value);
                            const parsed = parseFloat(e.target.value);
                            if (!isNaN(parsed)) setSwapToAmount(Math.floor(parsed * 0.92).toString());
                          }}
                          disabled={isSwapping}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                          To Asset
                        </label>
                        <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800">
                          <option>EURC (Euro Dollar Stable)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                          Receive (Estimated)
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={swapToAmount}
                          className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-mono"
                        />
                      </div>
                    </div>

                    {/* Slippage controller */}
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">
                        <span>Max Slippage Protection</span>
                        <span className="text-indigo-600">{slippage}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="2.0"
                        step="0.1"
                        value={slippage}
                        onChange={(e) => setSlippage(parseFloat(e.target.value))}
                        disabled={isSwapping}
                        className="w-full accent-indigo-650 cursor-pointer"
                      />
                    </div>

                    {swapStatus && (
                      <div className={`p-3 rounded-xl border text-[11px] font-medium flex items-center gap-2 ${
                        swapStatus === 'initiating' && 'bg-blue-50 border-blue-100 text-blue-700'
                      } ${
                        swapStatus === 'confirming' && 'bg-amber-50 border-amber-100 text-amber-700'
                      } ${
                        swapStatus === 'success' && 'bg-emerald-50 border-emerald-100 text-emerald-700'
                      }`}>
                        {swapStatus === 'initiating' && (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Requesting quote and calculating optimum routes...</span>
                          </>
                        )}
                        {swapStatus === 'confirming' && (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Verifying passkey signature & completing Swap execution...</span>
                          </>
                        )}
                        {swapStatus === 'success' && (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Swap settled! Minted {swapToAmount} EURC successfully.</span>
                          </>
                        )}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSwapping || !session}
                      className="w-full py-3 bg-slate-950 hover:bg-slate-900 disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      {isSwapping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shuffle className="w-4 h-4" />}
                      Execute Swap Contract
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab 4: Observability Monitor */}
          {activeTab === 'observability' && (
            <motion.div
              key="observability"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Latency Log Terminal */}
              <div className="lg:col-span-8 card-light p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Terminal className="w-4.5 h-4.5 text-slate-500" />
                    Observability Logging Daemon
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Streaming Logs</span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 font-mono text-[10px] text-slate-300 space-y-2 h-64 overflow-y-auto leading-relaxed shadow-inner">
                  <div>[23:23:01 INFO] Initialized Circle W3S connection client. Server Status: OK.</div>
                  <div>[23:23:05 TRACE] API REQUEST: client.listWallets() - Latency: {circleLatency}ms</div>
                  <div>[23:23:10 TRACE] RPC BROADCAST: eth_getBalance on Arc Network - Latency: {arcRpcLatency}ms</div>
                  <div>[23:23:15 TRACE] API REQUEST: client.getUserStatus() - Success rate: {successRate}%</div>
                  <div>[23:23:20 INFO] Checked Gas sponsorship rules. Gas sponsorship cap is active.</div>
                  <div className="text-slate-400 italic">[Listening to smart contract events on CargoRegistry: {session.walletAddress.slice(0, 8)}...]</div>
                </div>
              </div>

              {/* API metrics cards */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Health Metrics */}
                <div className="card-light p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest">
                    Health Dashboard
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">CIRCLE W3S API LATENCY</span>
                      <div className="flex items-end gap-2 mt-1">
                        <span className="text-2xl font-black text-slate-900 font-mono leading-none">{circleLatency}ms</span>
                        <span className="text-[10px] text-emerald-600 font-bold mb-0.5">Optimal</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">ARC TESTNET RPC LATENCY</span>
                      <div className="flex items-end gap-2 mt-1">
                        <span className="text-2xl font-black text-slate-900 font-mono leading-none">{arcRpcLatency}ms</span>
                        <span className="text-[10px] text-emerald-600 font-bold mb-0.5">Sub-second</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">TRANSACTION SUCCESS RATE</span>
                      <div className="flex items-end gap-2 mt-1">
                        <span className="text-2xl font-black text-emerald-600 font-mono leading-none">{successRate}%</span>
                        <span className="text-[10px] text-slate-400 mb-0.5">0 Fails</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Exponential Backoff Explainer */}
                <div className="card-light p-5 bg-gradient-to-br from-indigo-50/50 to-slate-50 border border-slate-200/80 rounded-2xl text-xs space-y-3">
                  <span className="font-bold text-indigo-950 block">Built-in Resiliency Mechanics</span>
                  <p className="text-slate-500 leading-relaxed text-[11px]">
                    CargoTrust enforces automatic 3x retries with exponential backoff on all RPC calls. Transaction hash polling retrieves execution receipts securely even under high mempool congestion.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
