'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { AGENT_REGISTRY_ADDRESS } from '@/lib/constants';
import AGENT_REGISTRY_ABI from '@/components/AgentRegistryABI.json';
import { Cpu, RefreshCw, Radio, HardDrive, Plus, CheckCircle, ShieldAlert, Loader2, ArrowRight } from 'lucide-react';

interface ActiveAgent {
  id: string;
  name: string;
  agentWalletAddress: string;
  deviceId: string;
  status: string;
  agentURI?: string;
  createdAt: string;
}

export default function AgentConsole() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  // State
  const [agents, setAgents] = useState<ActiveAgent[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [name, setName] = useState('IoT Temperature Tracker Dalat-02');
  const [deviceId, setDeviceId] = useState('DEV-' + Math.floor(1000 + Math.random() * 9000));
  const [agentWalletAddress, setAgentWalletAddress] = useState('0x64e43D0c90A5Fbf31336Cc43CdD3Cc289B850000');
  const [agentURI, setAgentURI] = useState(`ipfs://QmAgent${deviceId}`);

  // Transaction States
  const [txLoading, setTxLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch agents
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

  const handleRegisterAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!isConnected) {
      setErrorMsg('Please connect your owner wallet to register agents on-chain.');
      return;
    }

    setTxLoading(true);

    try {
      // 1. Submit on-chain registration to AgentRegistry.sol
      console.log('Registering agent on-chain at:', AGENT_REGISTRY_ADDRESS);
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

      // 2. Submit database synchronization to backend API
      const syncRes = await fetch('/api/agents/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          deviceId,
          agentWalletAddress,
          agentURI,
          status: 'Active',
        }),
      });
      
      const syncData = await syncRes.json();
      if (syncData.success) {
        setSuccessMsg(`Agent "${name}" successfully registered on-chain and registered to the Operations Desk!`);
        // Refresh details
        await fetchAgents();
        // Generate new random device ID and wallet address to prevent duplicates
        setDeviceId('DEV-' + Math.floor(1000 + Math.random() * 9000));
        setAgentWalletAddress('0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));
      } else {
        setErrorMsg(syncData.error || 'On-chain succeeded but backend sync failed.');
      }
    } catch (err: any) {
      console.error('Registration failed:', err);
      setErrorMsg(err.message || 'On-chain transaction failed or was rejected.');
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Registration Console */}
      <div className="lg:col-span-1 card-light p-6">
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="w-5 h-5 text-gray-800" />
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Register IoT Agent</h3>
        </div>

        <form onSubmit={handleRegisterAgent} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
              Agent Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-150 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
              Device Hardware ID
            </label>
            <input
              type="text"
              required
              value={deviceId}
              onChange={(e) => {
                setDeviceId(e.target.value);
                setAgentURI(`ipfs://QmAgent${e.target.value}`);
              }}
              className="w-full p-3 bg-gray-50 border border-gray-150 rounded-xl text-xs font-mono text-gray-800 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
              Agent Wallet Address (SCA / EOA)
            </label>
            <input
              type="text"
              required
              value={agentWalletAddress}
              onChange={(e) => setAgentWalletAddress(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-150 rounded-xl text-xs font-mono text-gray-800 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
              Metadata URI (ERC-8004 IPFS ID)
            </label>
            <input
              type="text"
              required
              value={agentURI}
              onChange={(e) => setAgentURI(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-150 rounded-xl text-xs font-mono text-gray-800 focus:outline-none"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] font-mono text-red-600">
              ⚠️ {errorMsg}
            </div>
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
              className="w-full py-3 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
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
  );
}
