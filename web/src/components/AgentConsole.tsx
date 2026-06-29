'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, usePublicClient, useSwitchChain } from 'wagmi';
import { parseUnits } from 'viem';
import { USDC_ABI } from '@/lib/constants';
import { 
  SUPPORTED_SOURCE_CHAINS, 
  TOKEN_MESSENGER_ABI, 
  MESSAGE_TRANSMITTER_ABI, 
  addressToBytes32, 
  CCTP_DOMAINS, 
  extractMessageFromReceipt, 
  getCCTPAttestation 
} from '@/lib/bridgeKit';
import { AGENT_REGISTRY_ADDRESS, truncateAddress } from '@/lib/constants';
import AGENT_REGISTRY_ABI from '@/components/AgentRegistryABI.json';
import { 
  Cpu, 
  RefreshCw, 
  Radio, 
  HardDrive, 
  Plus, 
  CheckCircle, 
  ShieldAlert, 
  Loader2, 
  ArrowRight, 
  Terminal, 
  Database, 
  Coins, 
  Compass, 
  Zap, 
  Play, 
  Pause, 
  AlertTriangle, 
  Award,
  CircleDot,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorCard from '@/components/ErrorCard';

interface ActiveAgent {
  id: string;
  name: string;
  agentWalletAddress: string;
  deviceId: string;
  status: string;
  agentURI?: string;
  createdAt: string;
}

interface SwarmLog {
  id: string;
  agent: 'Coordinator' | 'Procurement' | 'Auditor' | 'Logistics' | 'System';
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warn' | 'action';
}

interface X402AuditLog {
  id: string;
  endpoint: string;
  status: number;
  challenge: string;
  signature: string;
  hash: string;
  timestamp: string;
}

export default function AgentConsole() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  // Navigation Tab
  const [activeConsoleTab, setActiveConsoleTab] = useState<'iot' | 'swarm' | 'x402' | 'tipping' | 'streaming'>('swarm');

  // Standard IoT Agent State
  const [agents, setAgents] = useState<ActiveAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('IoT Temperature Tracker Dalat-02');
  const [deviceId, setDeviceId] = useState('DEV-' + Math.floor(1000 + Math.random() * 9000));
  const [agentWalletAddress, setAgentWalletAddress] = useState('0x64e43D0c90A5Fbf31336Cc43CdD3Cc289B850000');
  const [agentURI, setAgentURI] = useState(`ipfs://QmAgent${deviceId}`);
  const [txLoading, setTxLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Swarm Cognitive State
  const [swarmLogs, setSwarmLogs] = useState<SwarmLog[]>([]);
  const [swarmRunning, setSwarmRunning] = useState(false);
  const [swarmProgress, setSwarmProgress] = useState(0);

  // x402 Micropayment Audits
  const [x402Logs, setX402Logs] = useState<X402AuditLog[]>([
    {
      id: 'audit_01',
      endpoint: '/api/telemetry?tokenId=1',
      status: 402,
      challenge: 'eDRwMDIgYW1vdW50PSIwLjAwMDAwMSIsIGN1cnJlbmN5PSJVU0RDIiwgbmV0d29yaz0iYXJjLXRlc3RuZXQi',
      signature: 'Pending Authorization...',
      hash: '-',
      timestamp: new Date(Date.now() - 60000).toLocaleTimeString()
    },
    {
      id: 'audit_02',
      endpoint: '/api/telemetry?tokenId=1',
      status: 200,
      challenge: 'eDRwMDIgYW1vdW50PSIwLjAwMDAwMSIsIGN1cnJlbmN5PSJVU0RDIiwgbmV0d29yaz0iYXJjLXRlc3RuZXQi',
      signature: 'sig_a9c0f993d8b8e0192f15... (EIP-712 Intent)',
      hash: '0xe83bc818ac01f92e... (Settled on Arc)',
      timestamp: new Date(Date.now() - 58000).toLocaleTimeString()
    }
  ]);

  // Cross-Chain Tipping State
  const [tipChain, setTipChain] = useState<'base' | 'polygon' | 'ethereum'>('base');
  const [tipAmount, setTipAmount] = useState('5');
  const [tippingLogs, setTippingLogs] = useState<string[]>([]);
  const [tippingStep, setTippingStep] = useState(0);
  const [tippingActive, setTippingActive] = useState(false);

  // Streaming Logistics State
  const [streamActive, setStreamActive] = useState(false);
  const [tempCelsius, setTempCelsius] = useState(4.2);
  const [streamedUsdc, setStreamedUsdc] = useState(0.00);
  const [streamAlert, setStreamAlert] = useState<string | null>(null);

  // Fetch standard agents
  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agents/auth');
      const data = await res.json();
      if (data.success) {
        setAgents(data.agents);
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  // Standard IoT Registry Form
  const handleRegisterAgent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!isConnected) {
      setErrorMsg('Please connect your owner wallet to register agents on-chain.');
      return;
    }
    setTxLoading(true);
    try {
      const tx = await writeContractAsync({
        address: AGENT_REGISTRY_ADDRESS as `0x${string}`,
        abi: AGENT_REGISTRY_ABI,
        functionName: 'registerAgent',
        args: [agentWalletAddress as `0x${string}`, agentURI],
      });
      setTxHash(tx);
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: tx });
      }
      const syncRes = await fetch('/api/agents/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, deviceId, agentWalletAddress, agentURI, status: 'Active' }),
      });
      const syncData = await syncRes.json();
      if (syncData.success) {
        setSuccessMsg(`Agent "${name}" successfully registered on-chain and registered to the Operations Desk!`);
        await fetchAgents();
        setDeviceId('DEV-' + Math.floor(1000 + Math.random() * 9000));
        setAgentWalletAddress('0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));
      } else {
        setErrorMsg(syncData.error || 'On-chain succeeded but backend sync failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'On-chain transaction failed or was rejected.');
    } finally {
      setTxLoading(false);
    }
  };

  // Swarm Simulator Loop
  const runSwarmSimulation = async () => {
    if (swarmRunning) return;
    setSwarmRunning(true);
    setSwarmProgress(0);
    setSwarmLogs([]);

    const log = (agent: SwarmLog['agent'], message: string, type: SwarmLog['type'] = 'info') => {
      setSwarmLogs(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          agent,
          message,
          timestamp: new Date().toLocaleTimeString(),
          type
        }
      ]);
    };

    // Step 1: Coordinator Start
    log('System', 'Initializing multi-agent swarm loop...', 'info');
    await new Promise(r => setTimeout(r, 1200));
    setSwarmProgress(20);
    log('Coordinator', 'Scanning CargoRegistry contract for available listed crop twins...', 'info');

    let twinLog = 'Found listing Crop Twin #1 (Origin: Dalat, organic certified). Listing price: 100 USDC.';
    let optimalBorrow = 50;
    try {
      const gqlRes = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetCargoTwins {
              cargoTwins {
                tokenId
                origin
                priceUsdc
                isForSale
              }
            }
          `
        })
      });
      const gqlData = await gqlRes.json();
      const forSale = gqlData?.data?.cargoTwins?.filter((t: any) => t.isForSale) || [];
      if (forSale.length > 0) {
        const twin = forSale[0];
        const price = parseFloat(twin.priceUsdc) / 1000000;
        twinLog = `Found active listing Crop Twin #${twin.tokenId} (Origin: ${twin.origin}). Listing price: ${price} USDC.`;
        optimalBorrow = Math.floor(price * 0.5);
      } else {
        const all = gqlData?.data?.cargoTwins || [];
        if (all.length > 0) {
          const twin = all[all.length - 1];
          twinLog = `No active listings. Scanning held custodian Crop Twin #${twin.tokenId} (Origin: ${twin.origin}).`;
        }
      }
    } catch (e) {
      console.warn(e);
    }

    await new Promise(r => setTimeout(r, 1500));
    
    // Step 2: Procurement scans & evaluates LTV
    log('Procurement', twinLog, 'info');
    await new Promise(r => setTimeout(r, 1200));
    setSwarmProgress(40);
    log('Procurement', `Calculating LTV limit for collateralization. AI Model predicts optimal borrow: ${optimalBorrow} USDC.`, 'action');
    await new Promise(r => setTimeout(r, 1500));
    log('Procurement', `Calling CropLendingPool on Arc to draw ${optimalBorrow} USDC liquidity. Tx Hash: 0xf92b8d00... (Gas: USDC)`, 'success');
    
    // Step 3: Escrow deposit
    await new Promise(r => setTimeout(r, 1800));
    setSwarmProgress(60);
    log('Procurement', 'Deposited remaining 50 USDC into CargoEscrow to lock B2B purchase.', 'success');
    
    // Step 4: Auditor QA Checks
    await new Promise(r => setTimeout(r, 1400));
    log('Auditor', 'Evaluating cargo quality logs. Requesting encrypted telemetry via x402 gateway...', 'action');
    
    // x402 Intercept Simulation
    await new Promise(r => setTimeout(r, 1500));
    setSwarmProgress(80);
    log('System', 'HTTP 402 Payment Required returned by /api/telemetry.', 'warn');
    log('Auditor', 'Authorizing $0.000001 USDC EIP-712 nanopayment from Auditor Agent Wallet.', 'action');
    
    // Push a new log to x402 tab
    setX402Logs(prev => [
      {
        id: Math.random().toString(),
        endpoint: '/api/telemetry?tokenId=1',
        status: 200,
        challenge: 'eDRwMDIgYW1vdW50PSIwLjAwMDAwMSIsIGN1cnJlbmN5PSJVU0RDIiwgbmV0d29yaz0iYXJjLXRlc3RuZXQi',
        signature: 'sig_f891b8d28f8101a... (Auditor Wallet)',
        hash: '0x71b83cc91b2e987c... (Settled)',
        timestamp: new Date().toLocaleTimeString()
      },
      ...prev
    ]);

    await new Promise(r => setTimeout(r, 1500));
    log('Auditor', 'Lab temperature checks verified: 4.5°C stable. Publishing W3C Verifiable Credential to registry.', 'success');
    
    // Step 5: Logistics Carrier Hired
    await new Promise(r => setTimeout(r, 1200));
    setSwarmProgress(100);
    log('Logistics', 'Carrier IoT Agent hired. Initializing real-time tracking route. Escrow finalized.', 'success');
    log('System', 'Swarm execution completed successfully.', 'success');
    setSwarmRunning(false);
  };

  // Cross-Chain Tipping Real Integration
  const runTippingSimulation = async () => {
    if (!isConnected || !address) {
      setTippingLogs(['Error: Please connect your Web3 wallet first.']);
      return;
    }
    if (tippingActive) return;
    setTippingActive(true);
    setTippingLogs([]);
    setTippingStep(1);

    const logTip = (msg: string) => setTippingLogs(prev => [...prev, msg]);

    try {
      const selectedKey = tipChain === 'base' ? 'base-sepolia' : tipChain === 'polygon' ? 'arbitrum-sepolia' : 'ethereum-sepolia';
      const selectedChain = SUPPORTED_SOURCE_CHAINS[selectedKey];
      const amountRaw = parseUnits(tipAmount, 6);

      logTip(`[Step 1/4] Switching wallet to source chain: ${selectedChain.name}...`);
      if (chainId !== selectedChain.chainId && switchChainAsync) {
        await switchChainAsync({ chainId: selectedChain.chainId });
      }

      logTip(`[Step 1/4] Approving ${tipAmount} USDC on ${selectedChain.name} for CCTP TokenMessenger...`);
      const approveTx = await writeContractAsync({
        address: selectedChain.usdcAddress,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [selectedChain.tokenMessengerAddress, amountRaw],
      });
      logTip(`Approve Tx Submitted: ${approveTx}`);
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: approveTx });
      }
      logTip(`✓ Approved successfully!`);
      setTippingStep(2);

      logTip(`[Step 2/4] Initiating CCTP burn: Depositing ${tipAmount} USDC to TokenMessenger...`);
      const recipientBytes32 = addressToBytes32(address);
      const burnTx = await writeContractAsync({
        address: selectedChain.tokenMessengerAddress,
        abi: TOKEN_MESSENGER_ABI,
        functionName: 'depositForBurn',
        args: [amountRaw, CCTP_DOMAINS.ArcTestnet, recipientBytes32, selectedChain.usdcAddress],
      });
      logTip(`Burn Tx Submitted: ${burnTx}`);
      
      let burnReceipt;
      if (publicClient) {
        burnReceipt = await publicClient.waitForTransactionReceipt({ hash: burnTx });
      }
      const { message, messageHash } = extractMessageFromReceipt(burnReceipt);
      logTip(`✓ Burn transaction confirmed! CCTP Message Hash: ${messageHash}`);
      setTippingStep(3);

      logTip(`[Step 3/4] Polling Circle CCTP attestation service for signature...`);
      const attestation = await getCCTPAttestation(messageHash);
      logTip(`✓ Attestation signature retrieved!`);
      setTippingStep(4);

      logTip(`[Step 4/4] Switching wallet back to Arc Testnet...`);
      if (switchChainAsync) {
        await switchChainAsync({ chainId: 5042002 });
      }

      logTip(`[Step 4/4] Relaying CCTP message to MessageTransmitter on Arc Testnet to mint USDC...`);
      const messageTransmitterAddress = '0xe737e5cebeeba77efe34d4aa090756590b1ce275';
      const mintTx = await writeContractAsync({
        address: messageTransmitterAddress,
        abi: MESSAGE_TRANSMITTER_ABI,
        functionName: 'receiveMessage',
        args: [message, attestation as `0x${string}`],
      });
      logTip(`Mint Tx Submitted: ${mintTx}`);
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: mintTx });
      }

      logTip(`✓ Success! Farmer credited with ${tipAmount} USDC on Arc. (Zero gas spent by consumer)`);
      setTippingStep(5);
    } catch (err: any) {
      console.error(err);
      logTip(`❌ Error: ${err.message || 'Tipping transaction failed.'}`);
      setTippingStep(0);
    } finally {
      setTippingActive(false);
    }
  };

  // Streaming Logistics Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (streamActive) {
      interval = setInterval(() => {
        if (tempCelsius > 9.5) {
          setStreamAlert('⚠️ Critical Cold-Chain Breach! Temperature exceeded 9.5°C. Logistics payment stream suspended on-chain.');
          setStreamActive(false);
          return;
        }
        setStreamedUsdc(prev => prev + 0.00001);
      }, 500);
    }
    return () => clearInterval(interval);
  }, [streamActive, tempCelsius]);

  return (
    <div className="space-y-6">
      {/* Sleek Tabs Navigation */}
      <div className="flex border-b border-gray-200/80 gap-1.5 p-1 bg-white rounded-2xl shadow-sm border">
        {[
          { id: 'swarm', label: 'AI Swarm Console', icon: Cpu },
          { id: 'x402', label: 'x402 Nanopayments', icon: Coins },
          { id: 'streaming', label: 'Streaming Carrier', icon: Zap },
          { id: 'tipping', label: 'Cross-Chain Tipping', icon: Compass },
          { id: 'iot', label: 'IoT Registry', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeConsoleTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveConsoleTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-gray-950 text-white shadow-md shadow-gray-950/20'
                  : 'text-gray-500 hover:text-gray-950 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Console Content */}
      <div className="min-h-[500px]">
        {activeConsoleTab === 'swarm' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className="card-light p-6">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Cpu className="w-4.5 h-4.5 text-gray-950" />
                  Swarm Orchestration
                </h3>
                <p className="text-xs text-gray-400 mb-6">
                  Trigger the cognitive agent swarm. Autonomous buyers, carriers, and verifier agents execute on-chain decisions within predefined USDC budgets.
                </p>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 border border-gray-150 rounded-2xl space-y-3">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Active Agent Allocations</span>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-gray-700">Procurement Agent</span>
                      <span className="font-mono font-bold text-gray-900">500.00 USDC</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-gray-700">QA Auditor Agent</span>
                      <span className="font-mono font-bold text-gray-900">100.00 USDC</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-gray-700">Carrier Logistics</span>
                      <span className="font-mono font-bold text-gray-900">150.00 USDC</span>
                    </div>
                  </div>

                  <button
                    onClick={runSwarmSimulation}
                    disabled={swarmRunning}
                    className="w-full py-4 bg-gray-950 hover:bg-gray-900 text-white rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow transition-all duration-300 disabled:opacity-50"
                  >
                    {swarmRunning ? (
                      <>
                        <Loader2 className="w-4.5 h-4.5 animate-spin" />
                        Swarm Loop Running...
                      </>
                    ) : (
                      <>
                        <Play className="w-4.5 h-4.5 text-white" />
                        Execute Swarm Loop
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col h-[500px]">
              <div className="bg-[#121316] text-[#e4e7eb] rounded-2xl flex-grow p-5 border border-gray-800 shadow-2xl flex flex-col font-mono relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-3 text-xs">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Terminal className="w-4 h-4" />
                    <span>cargotrust-swarm-coordinator ~ bash</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Cognitive Engine logs</span>
                </div>

                <div className="flex-grow overflow-y-auto space-y-3 scrollbar-thin text-xs pr-1">
                  {swarmLogs.length === 0 ? (
                    <div className="text-gray-600 h-full flex items-center justify-center italic text-center select-none">
                      Click &quot;Execute Swarm Loop&quot; to initialize AI cognitive logs...
                    </div>
                  ) : (
                    swarmLogs.map((l) => (
                      <motion.div
                        key={l.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="leading-relaxed border-l-2 border-gray-800 pl-3"
                      >
                        <span className="text-gray-500 text-[10px] mr-2">{l.timestamp}</span>
                        <span className={`font-bold mr-1.5 ${
                          l.agent === 'Coordinator' ? 'text-purple-400' :
                          l.agent === 'Procurement' ? 'text-amber-400' :
                          l.agent === 'Auditor' ? 'text-cyan-400' :
                          l.agent === 'Logistics' ? 'text-green-400' : 'text-gray-400'
                        }`}>
                          [{l.agent}]
                        </span>
                        <span className={
                          l.type === 'success' ? 'text-emerald-400' :
                          l.type === 'warn' ? 'text-amber-500' :
                          l.type === 'action' ? 'text-cyan-300' : 'text-gray-300'
                        }>
                          {l.message}
                        </span>
                      </motion.div>
                    ))
                  )}
                </div>

                {swarmRunning && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-800">
                    <div 
                      className="h-full bg-cyan-400 transition-all duration-300"
                      style={{ width: `${swarmProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeConsoleTab === 'x402' && (
          <div className="space-y-6">
            <div className="card-light p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Coins className="w-4.5 h-4.5 text-cyan-600" />
                    x402 Telemetry Citation Toll Gate
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Every detailed query to sensor history requires a micropayment of $0.000001 USDC. The client intercepts 402 HTTP codes, signs EIP-712 auth, and settles gaslessly on Arc.
                  </p>
                </div>
                <div className="px-3 py-1 bg-cyan-50 border border-cyan-100 rounded-lg text-[10px] font-mono font-bold text-cyan-700">
                  HTTP 402 Enabled
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Endpoint</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Challenge</th>
                      <th className="py-3 px-4">EIP-712 Signature</th>
                      <th className="py-3 px-4">Arc TX Hash</th>
                      <th className="py-3 px-4">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {x402Logs.map((log) => (
                      <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-all font-mono">
                        <td className="py-3 px-4 text-gray-700 font-bold">{log.endpoint}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.status === 402 ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-400 truncate max-w-[120px]" title={log.challenge}>{log.challenge}</td>
                        <td className="py-3 px-4 text-gray-600 truncate max-w-[150px]" title={log.signature}>{log.signature}</td>
                        <td className="py-3 px-4 text-cyan-600 truncate max-w-[120px]">{log.hash}</td>
                        <td className="py-3 px-4 text-gray-400">{log.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeConsoleTab === 'streaming' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-light p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Zap className="w-4.5 h-4.5 text-cyan-600" />
                  Streaming Carrier Payments
                </h3>
                <p className="text-xs text-gray-400">
                  Payments are streamed per-second to the Logistics carrier. If the temperature exceeds cold-chain limits, the flow terminates immediately.
                </p>
              </div>

              <div className="p-5 bg-gray-50 border border-gray-150 rounded-2xl space-y-5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-700">Transit Status</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    streamActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-gray-150 text-gray-600'
                  }`}>
                    <CircleDot className={`w-3.5 h-3.5 ${streamActive ? 'animate-pulse text-emerald-600' : 'text-gray-400'}`} />
                    {streamActive ? 'In Transit (Streaming)' : 'Suspended / Idle'}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-semibold">Live Temp Celsius</span>
                    <span className={`font-mono font-bold ${tempCelsius > 9.5 ? 'text-red-600 animate-pulse' : 'text-cyan-600'}`}>
                      {tempCelsius.toFixed(1)}°C
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    step="0.1"
                    value={tempCelsius}
                    onChange={(e) => setTempCelsius(parseFloat(e.target.value))}
                    className="w-full accent-cyan-600"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-bold font-mono">
                    <span>1°C (Optimal)</span>
                    <span>9.5°C (Threshold Limit)</span>
                    <span>15°C (Spoiled)</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">USDC Streamed</span>
                  <span className="text-lg font-mono font-bold text-gray-900">${streamedUsdc.toFixed(5)} USDC</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setStreamActive(!streamActive);
                  if (!streamActive) {
                    setStreamAlert(null);
                  }
                }}
                className={`w-full py-4 text-xs font-bold uppercase tracking-wider rounded-2xl transition-all shadow flex items-center justify-center gap-2 ${
                  streamActive ? 'bg-gray-900 hover:bg-gray-800 text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                }`}
              >
                {streamActive ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause Delivery Stream
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-white" />
                    Start Delivery Stream
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-col justify-center">
              {streamAlert ? (
                <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-center space-y-3">
                  <AlertTriangle className="w-12 h-12 text-red-500 mx-auto animate-bounce" />
                  <h4 className="text-sm font-bold text-red-900 uppercase">Alert: Stream Cancelled</h4>
                  <p className="text-xs text-red-700 leading-relaxed font-mono">
                    {streamAlert}
                  </p>
                </div>
              ) : streamActive ? (
                <div className="p-6 bg-cyan-50/50 border border-cyan-150 rounded-2xl text-center space-y-3">
                  <RefreshCw className="w-12 h-12 text-cyan-600 mx-auto animate-spin" />
                  <h4 className="text-sm font-bold text-cyan-900 uppercase">Streaming Payments Active</h4>
                  <p className="text-xs text-cyan-700 leading-relaxed font-mono">
                    Micro-payout channels remain open. Every 1 second, a micropayment is routed directly to the transport provider wallet via the Arc precompiled gas engine.
                  </p>
                </div>
              ) : (
                <div className="p-6 bg-gray-50 border border-gray-150 rounded-2xl text-center space-y-3">
                  <Database className="w-12 h-12 text-gray-400 mx-auto" />
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Stream Dashboard Idle</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Click &quot;Start Delivery Stream&quot; to begin tracing carrier micro-payout logs. Use the slider to simulate real-world temperature fluctuation.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeConsoleTab === 'tipping' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-light p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Compass className="w-4.5 h-4.5 text-cyan-600" />
                  Cross-Chain Farmer Tipping
                </h3>
                <p className="text-xs text-gray-400">
                  Allow consumers to tip organic producers from any network. App Kit automatically swaps to USDC and bridges the funds to the farmer&apos;s Arc wallet.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Source Blockchain
                    </label>
                    <div className="group relative inline-block">
                      <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-655 transition-colors" />
                      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-[10px] rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg leading-normal normal-case font-normal font-sans text-center">
                        Choose the blockchain ecosystem from which you wish to send the tip. Circle CCTP will execute the bridging gaslessly.
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'base', name: 'Base' },
                      { id: 'polygon', name: 'Polygon' },
                      { id: 'ethereum', name: 'Ethereum' }
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setTipChain(c.id as any)}
                        className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all ${
                          tipChain === c.id
                            ? 'bg-gray-950 text-white border-gray-950 shadow-sm'
                            : 'bg-white text-gray-500 border-gray-150 hover:bg-gray-50'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Tip Amount (USDC equivalent)
                    </label>
                    <div className="group relative inline-block">
                      <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-655 transition-colors" />
                      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-[10px] rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg leading-normal normal-case font-normal font-sans text-center">
                        Specify the donation or tipping amount in USDC to support the grower.
                      </div>
                    </div>
                  </div>
                  <input
                    type="number"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    placeholder="E.g., 5"
                    className="w-full p-3 bg-gray-50 border border-gray-150 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none"
                  />
                </div>

                <button
                  onClick={runTippingSimulation}
                  disabled={tippingActive}
                  className="w-full py-4 bg-gray-950 hover:bg-gray-900 disabled:opacity-50 text-white rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow transition-all duration-300"
                >
                  <Coins className="w-4.5 h-4.5 text-white" />
                  Send Cross-Chain Tip
                </button>
              </div>
            </div>

            <div className="bg-[#121316] text-[#e4e7eb] rounded-2xl p-5 border border-gray-800 shadow-2xl flex flex-col font-mono">
              <div className="flex items-center gap-2 text-cyan-400 border-b border-gray-800 pb-3 mb-3 text-xs">
                <Compass className="w-4.5 h-4.5" />
                <span>Circle CCTP Live Routing Monitor</span>
              </div>

              <div className="flex-grow space-y-3 overflow-y-auto text-xs">
                {tippingLogs.length === 0 ? (
                  <div className="text-gray-600 h-full flex items-center justify-center italic text-center select-none">
                    Select a chain and click &quot;Send Cross-Chain Tip&quot; to inspect routing trace...
                  </div>
                ) : (
                  tippingLogs.map((log, i) => (
                    <div key={i} className="leading-relaxed border-l-2 border-cyan-800 pl-3">
                      <span className={i === tippingLogs.length - 1 ? 'text-cyan-400 font-bold' : 'text-gray-300'}>
                        {log}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeConsoleTab === 'iot' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            {/* Registration Console */}
            <div className="lg:col-span-1 card-light p-6">
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="w-5 h-5 text-gray-800" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Register IoT Agent</h3>
              </div>

              <form onSubmit={handleRegisterAgent} className="space-y-4">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Agent Name
                    </label>
                    <div className="group relative inline-block">
                      <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-655 transition-colors" />
                      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-[10px] rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg leading-normal normal-case font-normal font-sans text-center">
                        Identify the IoT tracking unit (e.g., Dalat organic coffee tracker).
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g., Dalat Cold-Chain Tracker"
                    className="w-full p-3 bg-gray-50 border border-gray-150 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Device Hardware ID
                    </label>
                    <div className="group relative inline-block">
                      <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-655 transition-colors" />
                      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-[10px] rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg leading-normal normal-case font-normal font-sans text-center">
                        The physical MAC/hardware ID of the tracking unit.
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    required
                    value={deviceId}
                    onChange={(e) => {
                      setDeviceId(e.target.value);
                      setAgentURI(`ipfs://QmAgent${e.target.value}`);
                    }}
                    placeholder="E.g., DEV-7822"
                    className="w-full p-3 bg-gray-50 border border-gray-150 rounded-xl text-xs font-mono text-gray-800 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Agent Wallet Address (SCA / EOA)
                    </label>
                    <div className="group relative inline-block">
                      <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-655 transition-colors" />
                      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-[10px] rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg leading-normal normal-case font-normal font-sans text-center">
                        The programmatic on-chain wallet address of the device to receive gasless telemetry payments.
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    required
                    value={agentWalletAddress}
                    onChange={(e) => setAgentWalletAddress(e.target.value)}
                    placeholder="E.g., 0x64e43D...0000"
                    className="w-full p-3 bg-gray-50 border border-gray-150 rounded-xl text-xs font-mono text-gray-800 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Metadata URI (ERC-8004 IPFS ID)
                    </label>
                    <div className="group relative inline-block">
                      <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-655 transition-colors" />
                      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-[10px] rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg leading-normal normal-case font-normal font-sans text-center">
                        IPFS/decentralized storage hash specifying hardware specifications and verification keys.
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    required
                    value={agentURI}
                    onChange={(e) => setAgentURI(e.target.value)}
                    placeholder="E.g., ipfs://Qm..."
                    className="w-full p-3 bg-gray-50 border border-gray-150 rounded-xl text-xs font-mono text-gray-800 focus:outline-none"
                  />
                </div>

                 {errorMsg && (
                   <ErrorCard
                     error={errorMsg}
                     onRetry={handleRegisterAgent}
                   />
                 )}

                {successMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] text-emerald-700">
                    ✅ {successMsg}
                    {txHash && (
                      <div className="mt-1 pt-1 border-t border-emerald-150 font-mono text-[10px]">
                        Tx: <a href={`https://testnet.arcscan.app/tx/${txHash}`} target="_blank" rel="noreferrer" className="underline hover:text-emerald-900">{txHash.slice(0, 20)}...</a>
                      </div>
                    )}
                  </div>
                )}

                {!isConnected ? (
                  <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-center text-xs text-gray-400 font-semibold">
                    Please connect your owner wallet first
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={txLoading}
                    className="w-full py-3 bg-gray-950 hover:bg-gray-900 disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    {txLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Executing Tx...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Register Agent on Arc
                      </>
                    )}
                  </button>
                )}
              </form>
            </div>

            {/* Agents Monitor List */}
            <div className="lg:col-span-2 card-light p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-cyan-600 animate-pulse" />
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Active IoT Swarm Monitor</h3>
                </div>
                <button
                  onClick={fetchAgents}
                  disabled={loading}
                  className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition-all"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {agents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <HardDrive className="w-12 h-12 text-gray-300 mb-3" />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">No Agents Registered</span>
                  <p className="text-[11px] text-gray-400 mt-1 max-w-xs">
                    Start the background IoT simulator daemon (`npm run daemon`) or fill the form on the left to register a device.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                  {agents.map((agent) => (
                    <div
                      key={agent.id}
                      className="p-4 bg-gray-50 border border-gray-150 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                          <span className="font-bold text-gray-900 text-xs">{agent.name}</span>
                          <span className="px-2 py-0.5 bg-cyan-50 border border-cyan-150 text-[10px] text-cyan-700 font-mono rounded-md">
                            {agent.deviceId}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono">
                          Wallet: <span className="text-gray-700 font-bold">{agent.agentWalletAddress}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          ERC-8004 IPFS Metadata: <a href={`https://gateway.ipfs.io/ipfs/${agent.agentURI?.replace('ipfs://', '')}`} target="_blank" rel="noreferrer" className="underline hover:text-cyan-600">{agent.agentURI}</a>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right hidden md:block">
                          <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Swarm Status</span>
                          <span className="text-[11px] font-bold text-emerald-600">Active Polling</span>
                        </div>
                        <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 p-4 bg-cyan-50/50 border border-cyan-150 rounded-2xl text-[11px] text-cyan-800 flex items-start gap-3 leading-relaxed">
                <ShieldAlert className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Autonomous Swarm Settlements</strong>: Registered devices are recognized by `CargoRegistry.sol`. The `iot-agent-daemon.js` simulates tracker transport loops, updating shipping states and releasing escrow contracts on-chain once arrival coordinates match destination conditions.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
