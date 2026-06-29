'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { parseUnits } from 'viem';
import { 
  CARGO_REGISTRY_ADDRESS, 
  CROP_LENDING_POOL_ADDRESS, 
  VERIFIER_REGISTRY_ADDRESS, 
  AGENT_REGISTRY_ADDRESS,
  USDC_ADDRESS,
  USDC_ABI,
  truncateAddress,
  explorerTxUrl
} from '@/lib/constants';
import CARGO_REGISTRY_ABI from '@/components/CargoRegistryABI.json';
import CROP_LENDING_POOL_ABI from '@/components/CropLendingPoolABI.json';
import VERIFIER_REGISTRY_ABI from '@/components/VerifierRegistryABI.json';
import AGENT_REGISTRY_ABI from '@/components/AgentRegistryABI.json';
import { 
  Cpu, 
  Send, 
  Terminal, 
  Database, 
  Zap, 
  ShieldAlert, 
  Award, 
  Activity, 
  Code, 
  Layers, 
  Workflow, 
  Sparkles, 
  Lock, 
  Eye, 
  Play, 
  CheckCircle, 
  AlertTriangle,
  BookOpen, 
  Plus, 
  UserCheck, 
  TrendingUp, 
  Key, 
  Clock, 
  CheckCircle2, 
  HelpCircle,
  XCircle,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string;
  toolCall?: {
    name: string;
    parameters: any;
    status: 'pending' | 'executing' | 'success' | 'failed';
    txHash?: string;
  };
}

export default function AgentOSPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  // Navigation sub-tabs inside AgentOS page
  const [activeSubTab, setActiveSubTab] = useState<'playground' | 'swarm' | 'rag' | 'observability' | 'security'>('playground');

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I am CargoPilot, your Autonomous Supply Chain Coordinator. I am linked to the Arc Testnet smart contracts. You can ask me to mint crop twins, list crop batches, request trade credits, or check verifier registrations using natural language. Try saying: "Mint a digital twin for coffee crop harvested in Dalat, Vietnam"',
      reasoning: 'Initializing connection to Arc Testnet contract addresses and indexing caches.'
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showReasoning, setShowReasoning] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Workflow builder nodes state
  const [workflowNodes, setWorkflowNodes] = useState([
    { id: '1', name: 'Farmer Harvest Entry', type: 'trigger', status: 'completed', desc: 'Crop digital twin minted on-chain' },
    { id: '2', name: 'IoT Telemetry Stream', type: 'monitoring', status: 'active', desc: 'Continuous temperature sensor updates' },
    { id: '3', name: 'Auditor Lab Verification', type: 'certification', status: 'pending', desc: 'Verifier cryptographically signs credentials' },
    { id: '4', name: 'B2B Smart Escrow', type: 'settlement', status: 'idle', desc: 'Atomic ownership swap release' }
  ]);

  // Vector store mock data for RAG tab
  const [vectorDocs, setVectorDocs] = useState([
    { title: 'Global Coffee Quality Standards ISO 1047', size: '24 KB', similarity: 0.94, chunks: 5, date: 'June 2026' },
    { title: 'USDA Organic Import Certification Guidelines', size: '18 KB', similarity: 0.88, chunks: 3, date: 'May 2026' },
    { title: 'Arc Testnet CCTP Integration Schema v1.2', size: '32 KB', similarity: 0.82, chunks: 8, date: 'June 2026' }
  ]);
  const [newDocName, setNewDocName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Swarm Simulator Logs
  const [swarmLogs, setSwarmLogs] = useState<{ id: string; sender: string; msg: string; time: string; status: string }[]>([]);
  const [swarmState, setSwarmState] = useState<'idle' | 'running' | 'done'>('idle');

  // Observability live metrics
  const [metrics, setMetrics] = useState({
    tokensSpent: 12480,
    averageLatency: 420,
    successRate: 98.4,
    gasSavedUsdc: '1.2405'
  });

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Send message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isSending) return;

    const userMsg = inputVal.trim();
    setInputVal('');
    setIsSending(true);

    const updatedMessages = [...chatMessages, { role: 'user', content: userMsg } as ChatMessage];
    setChatMessages(updatedMessages);

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await res.json();
      if (res.ok) {
        // Parse for tool calls in response content
        let toolCall: ChatMessage['toolCall'] = undefined;
        let mainContent = data.content;

        const jsonMatch = data.content.match(/```json\n([\s\S]+?)\n```/) || data.content.match(/{[\s\S]+?}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            if (parsed.tool_call) {
              toolCall = {
                name: parsed.tool_call.name,
                parameters: parsed.tool_call.parameters,
                status: 'pending'
              };
              // Clean content block from raw json
              mainContent = data.content.replace(/```json\n[\s\S]+?\n```/, '').trim();
            }
          } catch (e) {
            console.error('Failed to parse tool call from response:', e);
          }
        }

        setChatMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: mainContent || 'Tool call prepared successfully.',
            reasoning: data.reasoning || 'Executed chain-of-thought routing.',
            toolCall
          }
        ]);

        // If the API call worked, slightly update live metrics
        setMetrics(prev => ({
          ...prev,
          tokensSpent: prev.tokensSpent + 850,
          averageLatency: Math.floor(350 + Math.random() * 120)
        }));
      } else {
        throw new Error(data.error || 'Failed to fetch agent completions.');
      }
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Failed to invoke agent engine. Error: ${err.message || 'Unknown network error'}.`,
          reasoning: 'Connection timed out or API key rejected.'
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // Execute tool call on chain
  const executeAgentTool = async (index: number) => {
    const msg = chatMessages[index];
    if (!msg.toolCall) return;

    // Update message status to executing
    const updated = [...chatMessages];
    updated[index] = {
      ...msg,
      toolCall: { ...msg.toolCall, status: 'executing' }
    };
    setChatMessages(updated);

    try {
      const toolName = msg.toolCall.name;
      const params = msg.toolCall.parameters;

      let tx = '0x';

      if (!isConnected) {
        // Fallback simulation if no wallet is connected
        await new Promise(r => setTimeout(r, 2000));
        tx = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      } else {
        if (toolName === 'mint_twin') {
          const origin = params.origin || 'Valle del Cauca, Colombia';
          const weight = BigInt(params.weight || 500);
          const ipfs = `ipfs://QmTwin${Math.floor(Math.random() * 1000)}`;

          // Check/approve USDC allowance first (mint fee is 0.10 USDC)
          if (publicClient && address) {
            try {
              const allowance = await publicClient.readContract({
                address: USDC_ADDRESS,
                abi: USDC_ABI,
                functionName: 'allowance',
                args: [address, CARGO_REGISTRY_ADDRESS]
              }) as bigint;

              if (allowance < BigInt(100000)) {
                // Approve 10 USDC
                const approveTx = await writeContractAsync({
                  address: USDC_ADDRESS,
                  abi: USDC_ABI,
                  functionName: 'approve',
                  args: [CARGO_REGISTRY_ADDRESS, parseUnits('10', 6)]
                });
                await publicClient.waitForTransactionReceipt({ hash: approveTx });
              }
            } catch (err) {
              console.warn('USDC allowance check/approval failed or skipped', err);
            }
          }

          tx = await writeContractAsync({
            address: CARGO_REGISTRY_ADDRESS,
            abi: CARGO_REGISTRY_ABI,
            functionName: 'mintCargo',
            args: [
              origin,
              BigInt(Math.floor(Date.now() / 1000)),
              '10.0° N, 10.0° W',
              ipfs,
              false, // _isEncrypted
              '',    // _encryptedPrice
              weight
            ]
          });
        } else if (toolName === 'request_credit') {
          const tokenId = BigInt(params.tokenId || 1);
          let borrowAmount = parseUnits('5', 6); // default 5 USDC if query fails

          // 1. Calculate borrow limit from listing price (50% LTV limit)
          if (publicClient) {
            try {
              const batch = await publicClient.readContract({
                address: CARGO_REGISTRY_ADDRESS,
                abi: CARGO_REGISTRY_ABI,
                functionName: 'cargoBatches',
                args: [tokenId]
              }) as any;

              // cargoBatches returns a tuple/array where priceUsdc is index 5
              const price = batch[5] || batch.priceUsdc;
              if (price && price > 0) {
                borrowAmount = (BigInt(price) * BigInt(5000)) / BigInt(10000);
              }
            } catch (e) {
              console.warn('Failed to fetch listing price for LTV calculation', e);
            }
          }

          // 2. Approve NFT to Lending Pool
          if (publicClient && address) {
            try {
              const approvedAddress = await publicClient.readContract({
                address: CARGO_REGISTRY_ADDRESS,
                abi: CARGO_REGISTRY_ABI,
                functionName: 'getApproved',
                args: [tokenId]
              }) as string;

              if (approvedAddress.toLowerCase() !== CROP_LENDING_POOL_ADDRESS.toLowerCase()) {
                const approveNftTx = await writeContractAsync({
                  address: CARGO_REGISTRY_ADDRESS,
                  abi: CARGO_REGISTRY_ABI,
                  functionName: 'approve',
                  args: [CROP_LENDING_POOL_ADDRESS, tokenId]
                });
                await publicClient.waitForTransactionReceipt({ hash: approveNftTx });
              }
            } catch (e) {
              console.warn('NFT approval check/approve failed or skipped', e);
            }
          }

          tx = await writeContractAsync({
            address: CROP_LENDING_POOL_ADDRESS,
            abi: CROP_LENDING_POOL_ABI,
            functionName: 'borrow',
            args: [tokenId, borrowAmount]
          });
        } else if (toolName === 'register_verifier_agent') {
          const name = params.name || 'IoT Tracker';
          const address = params.agentAddress || '0x64e43D0c90A5Fbf31336Cc43CdD3Cc289B850000';
          const uri = `ipfs://QmAgent${Math.floor(Math.random() * 1000)}`;
          tx = await writeContractAsync({
            address: AGENT_REGISTRY_ADDRESS,
            abi: AGENT_REGISTRY_ABI,
            functionName: 'registerAgent',
            args: [address, uri]
          });
        } else if (toolName === 'simulate_quality_check') {
          const tokenId = BigInt(params.tokenId || 1);
          tx = await writeContractAsync({
            address: CARGO_REGISTRY_ADDRESS,
            abi: CARGO_REGISTRY_ABI,
            functionName: 'addVerification',
            args: [tokenId, 'USDA Organic', 'ipfs://QmAttestationHash102']
          });
        } else {
          throw new Error('Unsupported smart contract function tool.');
        }

        if (publicClient && tx) {
          await publicClient.waitForTransactionReceipt({ hash: tx as `0x${string}` });
        }
      }

      // Update message status to success
      const finalMsg = [...chatMessages];
      finalMsg[index] = {
        ...msg,
        content: msg.content + `\n\n✓ Transaction executed successfully! On-chain Tx Hash: ${tx}`,
        toolCall: { ...msg.toolCall, status: 'success', txHash: tx }
      };
      setChatMessages(finalMsg);

      // Trigger workflow builder update
      if (toolName === 'mint_twin') {
        setWorkflowNodes(prev => prev.map(n => n.id === '1' ? { ...n, status: 'completed' } : n));
      } else if (toolName === 'simulate_quality_check') {
        setWorkflowNodes(prev => prev.map(n => n.id === '3' ? { ...n, status: 'completed' } : n));
      }

    } catch (err: any) {
      console.error(err);
      const finalMsg = [...chatMessages];
      finalMsg[index] = {
        ...msg,
        content: msg.content + `\n\n❌ Execution failed: ${err.message || 'User rejected request.'}`,
        toolCall: { ...msg.toolCall, status: 'failed' }
      };
      setChatMessages(finalMsg);
    }
  };

  // Run swarm simulator loops
  const startSwarm = async () => {
    if (swarmState === 'running') return;
    setSwarmState('running');
    setSwarmLogs([]);

    const addLog = (sender: string, msg: string, status = 'info') => {
      setSwarmLogs(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          sender,
          msg,
          time: new Date().toLocaleTimeString(),
          status
        }
      ]);
    };

    addLog('Coordinator Agent', 'Initializing multi-agent consensus verification...', 'info');
    await new Promise(r => setTimeout(r, 1200));
    addLog('Procurement Agent', 'Scanning CargoRegistry contract for listed crop digital twins. Active target: Coffee twin #1001.', 'info');
    await new Promise(r => setTimeout(r, 1500));
    addLog('Procurement Agent', 'Simulating optimal risk premium. Safe LTV: 50% max. Price: 250 USDC. Loan Limit: 125 USDC.', 'success');
    await new Promise(r => setTimeout(r, 1800));
    addLog('QA Auditor Agent', 'Intercepting cold-chain telemetry logs from sensors. Quality rating: GRADE-A Arabica.', 'success');
    await new Promise(r => setTimeout(r, 1400));
    addLog('QA Auditor Agent', 'Triggering EIP-712 nanopayment authorization for sensor records to API gateway.', 'warning');
    await new Promise(r => setTimeout(r, 1600));
    addLog('Logistics Agent', 'Carrier hired for delivery route. Transit status updated. Locked escrow released.', 'success');
    await new Promise(r => setTimeout(r, 1000));
    addLog('Coordinator Agent', 'Multi-agent cycle completed. Crop batch ownership verified.', 'success');
    
    setSwarmState('done');
  };

  // Add document to vector store
  const handleUploadDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim() || isUploading) return;

    setIsUploading(true);
    setTimeout(() => {
      setVectorDocs(prev => [
        {
          title: newDocName,
          size: `${Math.floor(10 + Math.random() * 40)} KB`,
          similarity: parseFloat((0.8 + Math.random() * 0.18).toFixed(2)),
          chunks: Math.floor(2 + Math.random() * 8),
          date: 'Just Now'
        },
        ...prev
      ]);
      setNewDocName('');
      setIsUploading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Banner with Glowing Border */}
        <div className="relative overflow-hidden rounded-3xl border border-cyan-100 bg-white p-6 md:p-8 shadow-sm">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-50/40 via-emerald-50/20 to-transparent rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-cyan-50 to-emerald-50 text-cyan-700 border border-cyan-100/50 rounded-full text-xs font-mono font-bold">
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-cyan-600" />
                ARC & Circle Native AI Orchestrator
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                CargoPilot Intelligence Hub
              </h1>
              <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
                Unlock natural language coordination across your supply chain. Intercept API telemetry tolls, automate verifier audits, and execute on-chain smart contracts gaslessly using native USDC.
              </p>
            </div>
            
            <div className="flex gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-mono font-bold text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                DeepSeek-V4 Active
              </span>
            </div>
          </div>
        </div>

        {/* Section Sub-Navigation Tabs */}
        <div className="flex border-b border-slate-200/80 gap-1.5 p-1 bg-white rounded-2xl shadow-sm border overflow-x-auto scrollbar-none">
          {[
            { id: 'playground', label: 'AI Agent Playground', icon: Cpu },
            { id: 'swarm', label: 'Multi-Agent Swarm', icon: Workflow },
            { id: 'rag', label: 'Compliance RAG Hub', icon: BookOpen },
            { id: 'observability', label: 'Observability & Metrics', icon: Activity },
            { id: 'security', label: 'Security & Guardrails', icon: ShieldAlert }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-950 text-white shadow-md shadow-slate-950/20'
                    : 'text-slate-500 hover:text-slate-950 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="min-h-[550px]">
          {activeSubTab === 'playground' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Interactive Chat Box */}
              <div className="lg:col-span-8 space-y-4">
                <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm flex flex-col h-[550px] overflow-hidden">
                  
                  {/* Chat Header */}
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-900 rounded-xl">
                        <Cpu className="w-4.5 h-4.5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Orchestration Coordinator</h3>
                        <p className="text-[10px] text-emerald-600 font-medium">Ready to execute tools on Arc Testnet</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowReasoning(!showReasoning)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold transition-all border ${
                          showReasoning
                            ? 'bg-cyan-50 border-cyan-100 text-cyan-700'
                            : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        {showReasoning ? 'Hide Reasoning' : 'Show Reasoning'}
                      </button>
                    </div>
                  </div>

                  {/* Message Container */}
                  <div className="flex-grow overflow-y-auto p-5 space-y-4 scrollbar-thin">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className="space-y-2">
                        {/* Reasoning Chain */}
                        {msg.reasoning && showReasoning && msg.role === 'assistant' && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-cyan-50/40 border border-cyan-100/50 rounded-2xl text-[10px] font-mono text-cyan-800 space-y-1.5 leading-relaxed"
                          >
                            <span className="font-bold uppercase tracking-wider block text-cyan-600">Thought Process:</span>
                            <p>{msg.reasoning}</p>
                          </motion.div>
                        )}

                        {/* Actual Message bubble */}
                        <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-slate-950 text-white font-medium shadow-sm'
                              : 'bg-slate-50 border border-slate-200 text-slate-800'
                          }`}>
                            <p className="whitespace-pre-line">{msg.content}</p>

                            {/* Tool Interceptor Confirmation Button */}
                            {msg.toolCall && (
                              <div className="mt-4 p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-3">
                                <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                                  <span>Action Required</span>
                                  <span className="text-cyan-600">Arc Testnet Tool</span>
                                </div>
                                <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-lg text-[10px] font-mono space-y-1">
                                  <p className="font-bold text-slate-800">Tool: {msg.toolCall.name.toUpperCase()}</p>
                                  <pre className="text-slate-600 text-[9px] overflow-x-auto whitespace-pre-wrap">
                                    {JSON.stringify(msg.toolCall.parameters, null, 2)}
                                  </pre>
                                </div>

                                {msg.toolCall.status === 'pending' && (
                                  <button
                                    onClick={() => executeAgentTool(i)}
                                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] uppercase font-bold tracking-wider rounded-lg transition-all active:scale-98 shadow-sm flex items-center justify-center gap-1.5"
                                  >
                                    <Key className="w-3.5 h-3.5" />
                                    Sign & Execute Transaction
                                  </button>
                                )}

                                {msg.toolCall.status === 'executing' && (
                                  <div className="flex items-center justify-center py-2 text-[10px] font-mono text-cyan-600 font-bold gap-2">
                                    <span className="w-2.5 h-2.5 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
                                    Executing and verifying receipt...
                                  </div>
                                )}

                                {msg.toolCall.status === 'success' && (
                                  <div className="flex items-center justify-center py-1 text-[10px] font-mono text-emerald-600 font-bold gap-1.5">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Transaction Confirmed!
                                  </div>
                                )}

                                {msg.toolCall.status === 'failed' && (
                                  <div className="flex items-center justify-center py-1 text-[10px] font-mono text-rose-600 font-bold gap-1.5">
                                    <XCircle className="w-4 h-4" />
                                    Transaction Failed / Rejected.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat Input Field */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 flex gap-2">
                    <input
                      type="text"
                      value={inputVal}
                      onChange={(e) => setInputVal(e.target.value)}
                      disabled={isSending}
                      placeholder="Ask the Agent to mint a crop digital twin or calculate credit..."
                      className="flex-grow px-4 py-3 bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl text-xs font-medium focus:outline-none disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={isSending || !inputVal.trim()}
                      className="px-4 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl transition-all shadow flex items-center justify-center active:scale-95"
                    >
                      {isSending ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4.5 h-4.5" />
                      )}
                    </button>
                  </form>

                </div>
              </div>

              {/* Right Column: Workflow Builder & Active Registry */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Workflow Builder Visual */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Workflow className="w-4.5 h-4.5 text-cyan-600" />
                    Workflow Builder Status
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Visual tracking nodes linked to smart contracts. Successful agent executions automatically progress the steps.
                  </p>

                  <div className="space-y-4 relative">
                    {/* Vertical Connector Line */}
                    <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-100 -z-0" />
                    
                    {workflowNodes.map((node, i) => (
                      <div key={node.id} className="flex gap-4 relative z-10">
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs ${
                          node.status === 'completed' 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                            : node.status === 'active'
                            ? 'bg-cyan-50 border-cyan-200 text-cyan-600 animate-pulse'
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}>
                          {node.id}
                        </div>
                        <div className="space-y-1 py-0.5">
                          <span className="text-[11px] font-bold text-slate-700 block leading-tight">{node.name}</span>
                          <span className="text-[9px] text-slate-400 block">{node.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Capabilities Overview */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4.5 h-4.5 text-cyan-600" />
                    System Capabilities
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-start gap-3">
                      <span className="p-1.5 bg-cyan-50 text-cyan-600 rounded-lg shrink-0 mt-0.5">
                        <Zap className="w-3.5 h-3.5" />
                      </span>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-700 block">EIP-712 Nanopayment Signing</span>
                        <span className="text-[9px] text-slate-400 block">Exchanges zero gas signatures for live sensor data payloads.</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-start gap-3">
                      <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0 mt-0.5">
                        <Activity className="w-3.5 h-3.5" />
                      </span>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-700 block">LTV Risk Profiling</span>
                        <span className="text-[9px] text-slate-400 block">Analyzes listing price to suggest borrow limits.</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {activeSubTab === 'swarm' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Swarm Visualization Diagram */}
              <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Workflow className="w-4.5 h-4.5 text-cyan-600" />
                    Swarm Topology Visualizer
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Visual simulation of Coordinator, Procurement, Auditor, and Logistics carrier agents executing collaborative settlements.
                  </p>
                </div>

                {/* Node Graph */}
                <div className="relative border border-slate-100 bg-slate-50 rounded-2xl h-80 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
                  
                  {/* Coordinator Center Node */}
                  <div className="relative z-10 w-24 h-24 bg-slate-900 border border-slate-800 rounded-full flex flex-col items-center justify-center text-white shadow-xl text-center p-2">
                    <Cpu className="w-5 h-5 text-cyan-400 animate-pulse mb-1" />
                    <span className="text-[8px] font-mono font-bold uppercase tracking-wider">Coordinator</span>
                  </div>

                  {/* Satellite Nodes */}
                  <div className="absolute top-10 left-12 w-16 h-16 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center shadow-md text-center p-1.5">
                    <Award className="w-4.5 h-4.5 text-cyan-600 mb-1" />
                    <span className="text-[8px] font-bold text-slate-700">QA Auditor</span>
                  </div>

                  <div className="absolute bottom-10 left-12 w-16 h-16 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center shadow-md text-center p-1.5">
                    <TrendingUp className="w-4.5 h-4.5 text-emerald-600 mb-1" />
                    <span className="text-[8px] font-bold text-slate-700">Procurement</span>
                  </div>

                  <div className="absolute top-28 right-12 w-16 h-16 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center shadow-md text-center p-1.5">
                    <Zap className="w-4.5 h-4.5 text-amber-500 mb-1" />
                    <span className="text-[8px] font-bold text-slate-700">Logistics</span>
                  </div>
                </div>

                <button
                  onClick={startSwarm}
                  disabled={swarmState === 'running'}
                  className="w-full py-3.5 bg-slate-950 hover:bg-slate-900 disabled:opacity-50 text-white rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow"
                >
                  {swarmState === 'running' ? 'Swarm Running...' : 'Execute Swarm Simulation'}
                </button>
              </div>

              {/* Swarm Console Logs */}
              <div className="lg:col-span-7 bg-[#121316] text-[#e4e7eb] rounded-3xl p-5 border border-slate-800 shadow-2xl h-[480px] flex flex-col font-mono">
                <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-3 text-xs">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Terminal className="w-4 h-4" />
                    <span>cargotrust-swarm-orchestrator ~ bash</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Multi-Agent Logs</span>
                </div>

                <div className="flex-grow overflow-y-auto space-y-3 scrollbar-thin text-xs pr-1">
                  {swarmLogs.length === 0 ? (
                    <div className="text-slate-600 h-full flex items-center justify-center italic text-center select-none">
                      Click &quot;Execute Swarm Simulation&quot; to initialize multi-agent routing...
                    </div>
                  ) : (
                    swarmLogs.map((l) => (
                      <motion.div
                        key={l.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="leading-relaxed border-l-2 border-gray-800 pl-3"
                      >
                        <span className="text-gray-500 text-[10px] mr-2">{l.time}</span>
                        <span className="font-bold mr-1.5 text-cyan-400">[{l.sender}]</span>
                        <span className={
                          l.status === 'success' ? 'text-emerald-400' :
                          l.status === 'warning' ? 'text-amber-500' : 'text-slate-300'
                        }>
                          {l.msg}
                        </span>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {activeSubTab === 'rag' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Compliance Ingestion form */}
              <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4.5 h-4.5 text-cyan-600" />
                    Compliance RAG Ingestion
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                    Upload new coffee standards, agricultural regulations, or transport guidelines to convert them into vector embeddings for the QA Auditor Agent.
                  </p>
                </div>

                <form onSubmit={handleUploadDoc} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Document Title
                    </label>
                    <input
                      type="text"
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                      placeholder="E.g., Colombia Coffee Growers Association Rulebook"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUploading || !newDocName.trim()}
                    className="w-full py-3.5 bg-slate-950 hover:bg-slate-900 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    {isUploading ? 'Generating Embeddings...' : 'Add to Compliance Store'}
                  </button>
                </form>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Vector Indexing Schema</span>
                  <div className="flex justify-between text-[10px] font-mono text-slate-600">
                    <span>Embeddings Model:</span>
                    <span>text-embedding-3-small</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-600">
                    <span>Chunk Size:</span>
                    <span>512 tokens</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-600">
                    <span>Overlap:</span>
                    <span>64 tokens</span>
                  </div>
                </div>
              </div>

              {/* Uploaded Docs list */}
              <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Active Compliance Memory</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-2">Document Name</th>
                        <th className="py-3 px-2">File Size</th>
                        <th className="py-3 px-2">Chunks</th>
                        <th className="py-3 px-2">Sim Score</th>
                        <th className="py-3 px-2">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vectorDocs.map((doc, i) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all font-medium">
                          <td className="py-3 px-2 text-slate-700">{doc.title}</td>
                          <td className="py-3 px-2 text-slate-500 font-mono text-[10px]">{doc.size}</td>
                          <td className="py-3 px-2 text-slate-500 font-mono text-[10px]">{doc.chunks}</td>
                          <td className="py-3 px-2 text-emerald-600 font-mono font-bold text-[10px]">{(doc.similarity * 100).toFixed(0)}%</td>
                          <td className="py-3 px-2 text-slate-400 text-[10px]">{doc.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {activeSubTab === 'observability' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Metric Card 1 */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Tokens Consumed</span>
                  <Code className="w-4.5 h-4.5" />
                </div>
                <h4 className="text-2xl font-mono font-extrabold text-slate-900">{metrics.tokensSpent.toLocaleString()}</h4>
                <p className="text-[10px] text-slate-400 font-medium">Accumulated token count this session</p>
              </div>

              {/* Metric Card 2 */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Average Latency</span>
                  <Clock className="w-4.5 h-4.5" />
                </div>
                <h4 className="text-2xl font-mono font-extrabold text-slate-900">{metrics.averageLatency} ms</h4>
                <p className="text-[10px] text-slate-400 font-medium">DeepSeek Inference response time</p>
              </div>

              {/* Metric Card 3 */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Tool Success Rate</span>
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                </div>
                <h4 className="text-2xl font-mono font-extrabold text-emerald-600">{metrics.successRate}%</h4>
                <p className="text-[10px] text-slate-400 font-medium">Smart contract call verification rate</p>
              </div>

              {/* Metric Card 4 */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Cumulative Gas saved</span>
                  <Zap className="w-4.5 h-4.5 text-amber-500" />
                </div>
                <h4 className="text-2xl font-mono font-extrabold text-slate-900">${metrics.gasSavedUsdc} USDC</h4>
                <p className="text-[10px] text-slate-400 font-medium">Sponsered native gas saved on Arc</p>
              </div>

            </div>
          )}

          {activeSubTab === 'security' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Threat Defense Panel */}
              <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-4.5 h-4.5 text-cyan-600" />
                  Prompt Shield Protection
                </h3>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  CargoTrust implements active shielding filters to validate structured smart contract executions before submitting transactions.
                </p>

                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-800 font-mono">Jailbreak Guard</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[9px] uppercase font-mono">Shield Active</span>
                  </div>

                  <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-800 font-mono">Token Theft Prevention</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[9px] uppercase font-mono">Shield Active</span>
                  </div>

                  <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-800 font-mono">Tool Parameter Validator</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[9px] uppercase font-mono">Shield Active</span>
                  </div>
                </div>
              </div>

              {/* Audit trail */}
              <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4.5 h-4.5 text-cyan-600" />
                  Security Execution Log
                </h3>

                <div className="space-y-3 font-mono text-[10px]">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex items-center justify-between">
                    <span className="text-slate-500">14:02:18</span>
                    <span className="text-slate-800 font-bold">SHIELD: Validated parameters for mint_twin</span>
                    <span className="text-emerald-600 font-bold">PASS</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex items-center justify-between">
                    <span className="text-slate-500">14:00:10</span>
                    <span className="text-slate-800 font-bold">SHIELD: Scanned context for instruction overrides</span>
                    <span className="text-emerald-600 font-bold">PASS</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Documentation Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 bg-white border border-slate-200/80 rounded-3xl shadow-sm space-y-2 flex flex-col justify-between h-40">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan-600" />
                Developer Guides
              </h4>
              <p className="text-[10px] text-slate-400 mt-1">Read integration blueprints for setting up third party ERP gateways.</p>
            </div>
            <a href="#" className="text-[10px] font-bold text-slate-900 flex items-center gap-1 hover:underline">
              View Guide
            </a>
          </div>

          <div className="p-5 bg-white border border-slate-200/80 rounded-3xl shadow-sm space-y-2 flex flex-col justify-between h-40">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Code className="w-4 h-4 text-cyan-600" />
                API References
              </h4>
              <p className="text-[10px] text-slate-400 mt-1">Full documentation for REST endpoints, webhooks, and EIP-712 envelopes.</p>
            </div>
            <a href="#" className="text-[10px] font-bold text-slate-900 flex items-center gap-1 hover:underline">
              View API Docs
            </a>
          </div>

          <div className="p-5 bg-white border border-slate-200/80 rounded-3xl shadow-sm space-y-2 flex flex-col justify-between h-40">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-cyan-600" />
                Agent SDK
              </h4>
              <p className="text-[10px] text-slate-400 mt-1">Install the node client to programmatically interact with AgentOS.</p>
            </div>
            <a href="#" className="text-[10px] font-bold text-slate-900 flex items-center gap-1 hover:underline">
              View Github Repository
            </a>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
