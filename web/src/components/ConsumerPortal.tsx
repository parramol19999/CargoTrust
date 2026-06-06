'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePublicClient } from 'wagmi';
import { CARGO_REGISTRY_ADDRESS, truncateAddress } from '@/lib/constants';
import CARGO_REGISTRY_ABI from '@/components/CargoRegistryABI.json';
import { 
  Search, 
  Loader2, 
  Leaf, 
  ShieldCheck, 
  ShoppingBag, 
  ArrowRight, 
  MapPin, 
  Calendar, 
  Award,
  Activity,
  Play,
  Pause,
  Plus,
  Unlock,
  Wifi,
  CreditCard
} from 'lucide-react';
import { formatUnits } from 'viem';
import { generateClientPaymentToken, TelemetryLog } from '@/lib/nanopayments';
import TelemetryChart from '@/components/TelemetryChart';

export default function ConsumerPortal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const publicClient = usePublicClient();

  const [tokenIdInput, setTokenIdInput] = useState('');
  const [activeTokenId, setActiveTokenId] = useState<number | null>(null);

  // Provenance State
  const [loading, setLoading] = useState(false);
  const [cargo, setCargo] = useState<any | null>(null);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [owner, setOwner] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Telemetry Stream State (x402 nanopayments)
  const [activeTab, setActiveTab] = useState<'provenance' | 'telemetry'>('provenance');
  const [isStreaming, setIsStreaming] = useState(false);
  const [escrowBalance, setEscrowBalance] = useState(0.000050); // Initial pre-funded amount for demo
  const [usdcSpent, setUsdcSpent] = useState(0);
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLog[]>([]);
  const [streamError, setStreamError] = useState('');
  const [isFunding, setIsFunding] = useState(false);

  // 3. IoT Stream Daemon Simulator (Sends x402 requests)
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isStreaming && activeTokenId !== null) {
      interval = setInterval(async () => {
        // Enforce Escrow balance checks before initiating payment
        if (escrowBalance <= 0) {
          setIsStreaming(false);
          setStreamError('Gateway escrow balance depleted. Please fund to resume.');
          return;
        }

        try {
          // Generate EIP-3009 micro-payment token payload
          const token = generateClientPaymentToken('0xBuyerWalletAddressGoesHere', '0.000001', activeTokenId);
          
          const response = await fetch(`/api/telemetry?tokenId=${activeTokenId}`, {
            headers: {
              'x-payment-token': token
            }
          });

          if (response.status === 402) {
            const errData = await response.json();
            setStreamError(errData.message || 'Payment required to fetch telemetry.');
            setIsStreaming(false);
            return;
          }

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setTelemetryLogs(data.history || []);
              // Settle off-chain balance in local state
              setEscrowBalance(prev => Math.max(0, prev - 0.000001));
              setUsdcSpent(prev => prev + 0.000001);
              setStreamError('');
            }
          } else {
            const errText = await response.text();
            setStreamError(`Stream error: ${errText}`);
          }
        } catch (e: any) {
          console.error(e);
          setStreamError(`Connection lost: ${e.message}`);
        }
      }, 1500); // Poll every 1.5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming, activeTokenId, escrowBalance]);

  // 1. Read URL params (e.g. ?tokenId=1)
  useEffect(() => {
    const tid = searchParams.get('tokenId');
    if (tid) {
      const parsed = parseInt(tid);
      if (!isNaN(parsed)) {
        setActiveTokenId(parsed);
        setTokenIdInput(tid);
      }
    }
  }, [searchParams]);

  // 2. Fetch Trace Journey from on-chain RPC
  useEffect(() => {
    async function fetchProvenance() {
      if (!publicClient || activeTokenId === null) return;
      setLoading(true);
      setErrorMsg('');
      setCargo(null);
      setVerifications([]);

      try {
        const details: any = await publicClient.readContract({
          address: CARGO_REGISTRY_ADDRESS,
          abi: CARGO_REGISTRY_ABI,
          functionName: 'cargoBatches',
          args: [BigInt(activeTokenId)],
        });

        const ownerAddress: any = await publicClient.readContract({
          address: CARGO_REGISTRY_ADDRESS,
          abi: CARGO_REGISTRY_ABI,
          functionName: 'ownerOf',
          args: [BigInt(activeTokenId)],
        });

        const verifs: any = await publicClient.readContract({
          address: CARGO_REGISTRY_ADDRESS,
          abi: CARGO_REGISTRY_ABI,
          functionName: 'getVerifications',
          args: [BigInt(activeTokenId)],
        });

        const [producer, origin, harvestDate, latLong, ipfsMetadata, priceUsdc, isForSale, status] = details;

        if (producer === '0x0000000000000000000000000000000000000000') {
          setErrorMsg(`Crop Token ID #${activeTokenId} does not exist in our global provenance registry.`);
          return;
        }

        let parsedDesc = 'Batch details on-chain';
        if (ipfsMetadata.includes('?desc=')) {
          parsedDesc = decodeURIComponent(ipfsMetadata.split('?desc=')[1]);
        }

        setCargo({
          id: activeTokenId,
          producer,
          origin,
          harvestDate: Number(harvestDate.toString()) * 1000,
          latLong,
          ipfsMetadata,
          description: parsedDesc,
          priceUsdc: BigInt(priceUsdc.toString()),
          isForSale,
          status,
        });

        setOwner(ownerAddress);
        setVerifications(verifs);

      } catch (err) {
        console.error(err);
        setErrorMsg(`Failed to query provenance timeline. Ensure token ID #${activeTokenId} is correct.`);
      } finally {
        setLoading(false);
      }
    }

    fetchProvenance();
  }, [publicClient, activeTokenId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const tid = parseInt(tokenIdInput.trim());
    if (isNaN(tid)) {
      setErrorMsg('Please enter a valid numeric Crop ID.');
      return;
    }
    router.push(`/verify?tokenId=${tid}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-8">
      
      {/* Search Input inspired by flight search */}
      <div className="card-light p-6 relative">
        <h3 className="text-xl font-bold text-gray-900 mb-2 text-center md:text-left">
          Scan Cryptographic Crop Provenance
        </h3>
        <p className="text-xs text-gray-400 mb-6 text-center md:text-left">
          Enter any on-chain Token ID to trace its path, quality testing, and B2B stablecoin trades.
        </p>

        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
          <div className="flex-grow p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={tokenIdInput}
              onChange={(e) => setTokenIdInput(e.target.value)}
              placeholder="E.g., enter '1' for first batch..."
              className="w-full bg-transparent text-sm font-bold text-gray-900 focus:outline-none placeholder-gray-300"
            />
          </div>

          <button
            type="submit"
            className="px-8 py-4 bg-gray-950 hover:bg-gray-900 text-white font-bold rounded-2xl text-xs tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2"
          >
            Verify Provenance
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </form>

        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-600 font-semibold mt-4">
            ⚠️ {errorMsg}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-8 h-8 text-gray-900 animate-spin mb-3" />
          <p className="text-xs font-mono text-gray-400">Reconstructing secure provenance timeline...</p>
        </div>
      ) : cargo ? (
        <div className="space-y-6">
          
          {/* Main Provenance Card (Itinerary Style) */}
          <div className="card-light p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
              <div>
                <span className="px-2.5 py-1 bg-gray-100 text-gray-700 border border-gray-200/50 rounded-lg text-[10px] font-mono font-bold tracking-wider">
                  CROP TOKEN ID: #{cargo.id}
                </span>
                <h4 className="text-lg font-bold text-gray-900 mt-1">{cargo.origin}</h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block">Current Custodian</span>
                <span className="text-xs font-mono font-bold text-gray-900 select-all">
                  {owner}
                </span>
            </div>

            {/* Tab Selector */}
            <div className="flex border-b border-gray-150 mb-6">
              <button
                onClick={() => setActiveTab('provenance')}
                className={`pb-3 px-6 text-xs font-bold transition-all relative ${
                  activeTab === 'provenance'
                    ? 'text-gray-950 border-b-2 border-gray-950'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Provenance Timeline
              </button>
              <button
                onClick={() => setActiveTab('telemetry')}
                className={`pb-3 px-6 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
                  activeTab === 'telemetry'
                    ? 'text-gray-950 border-b-2 border-gray-950'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
                Live Telemetry Stream (x402)
              </button>
            </div>

            {activeTab === 'provenance' ? (
              /* Flight-Itinerary Stepper Timeline */
              <div className="space-y-8 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                
                {/* Node 1: Producer Sourcing */}
                <div className="relative pl-10 animate-fade-in">
                  <div className="absolute left-[8px] top-1.5 w-5 h-5 rounded-full border-2 border-gray-950 bg-white flex items-center justify-center z-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-950" />
                  </div>

                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-200/60 rounded text-[9px] font-bold">
                        <Leaf className="w-3 h-3 text-gray-500" />
                        PHASE 1: IMMUTABLE HARVEST ANCHOR
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(cargo.harvestDate).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-gray-900">{cargo.origin}</p>
                    <p className="text-xs text-gray-500 mt-1">{cargo.description}</p>

                    <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-200/60 text-[10px] font-mono text-gray-500">
                      <div>
                        <span className="block text-gray-400 uppercase tracking-widest font-bold text-[8px]">Producer Address</span>
                        <span className="text-gray-700 block text-ellipsis overflow-hidden whitespace-nowrap">{cargo.producer}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 uppercase tracking-widest font-bold text-[8px]">GPS Coordinates</span>
                        <span className="text-gray-900 font-bold flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {cargo.latLong}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Node 2: Laboratory QA Checks */}
                <div className="relative pl-10 animate-fade-in">
                  <div className="absolute left-[8px] top-1.5 w-5 h-5 rounded-full border-2 border-gray-950 bg-white flex items-center justify-center z-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-950" />
                  </div>

                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-200/60 rounded text-[9px] font-bold mb-2">
                      <ShieldCheck className="w-3 h-3 text-gray-500" />
                      PHASE 2: INDEPENDENT LAB VERIFICATION
                    </span>

                    {verifications.length === 0 ? (
                      <div className="text-xs text-gray-400 py-2 italic">
                        Laboratory inspection results pending verifier signature.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {verifications.map((v: any, index: number) => (
                          <div key={index} className="bg-white border border-gray-100 rounded-xl p-3 text-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-gray-900">{v.credentialType}</span>
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[9px] font-bold">
                                Verified ✓
                              </span>
                            </div>

                            <div className="text-[10px] text-gray-500 font-mono space-y-1">
                              <div className="flex justify-between">
                                <span>Verifier Name:</span>
                                <span className="text-gray-900 font-bold">{v.verifierName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Verifier Key:</span>
                                <span className="text-gray-700 select-all">{v.verifier}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>W3C Proof IPFS:</span>
                                <a
                                  href={`https://ipfs.io/ipfs/${v.ipfsVcHash.replace('ipfs://', '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-cyan-600 hover:underline text-ellipsis overflow-hidden whitespace-nowrap max-w-[180px]"
                                >
                                  {v.ipfsVcHash}
                                </a>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Node 3: B2B Trade & Current Custody */}
                <div className="relative pl-10 animate-fade-in">
                  <div className="absolute left-[8px] top-1.5 w-5 h-5 rounded-full border-2 border-gray-950 bg-white flex items-center justify-center z-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-950" />
                  </div>

                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-200/60 rounded text-[9px] font-bold mb-2">
                      <ShoppingBag className="w-3 h-3 text-gray-500" />
                      PHASE 3: B2B COMMERCE SETTLEMENTS
                    </span>

                    <div className="bg-white border border-gray-100 rounded-xl p-3 text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Listing Price:</span>
                        <span className="text-gray-900 font-bold">
                          {cargo.isForSale
                            ? `${parseFloat(formatUnits(cargo.priceUsdc, 6)).toLocaleString()} USDC`
                            : 'Not listed'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Verification Status:</span>
                        <span className="text-cyan-600 font-bold">{cargo.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>On-chain Owner:</span>
                        <span className="font-mono font-bold text-gray-900">{truncateAddress(owner, 6)}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              /* Telemetry Streaming Portal */
              <div className="space-y-6">
                
                {/* Streaming Control Panel */}
                <div className="p-5 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col md:flex-row gap-5 items-stretch md:items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${isStreaming ? 'bg-red-500 animate-ping' : 'bg-gray-300'}`} />
                      <span className="text-xs font-bold text-gray-900">
                        {isStreaming ? 'Streaming telemetry logs...' : 'Stream offline'}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 block">
                      Nanopayment Rate: $0.000001 USDC / sec
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Fund Escrow */}
                    <div className="px-3 py-1.5 bg-white border border-gray-150 rounded-xl flex items-center gap-2 text-xs font-mono font-bold text-gray-700">
                      <span>Escrow: ${escrowBalance.toFixed(6)} USDC</span>
                      <button
                        onClick={() => {
                          setEscrowBalance(prev => prev + 0.000050);
                        }}
                        className="p-1 hover:bg-gray-100 text-cyan-600 rounded-md transition-all flex items-center gap-0.5 animate-pulse"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Fund</span>
                      </button>
                    </div>

                    {/* Stream Toggle Button */}
                    <button
                      onClick={() => setIsStreaming(!isStreaming)}
                      className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow flex items-center gap-1.5 ${
                        isStreaming
                          ? 'bg-gray-900 hover:bg-gray-800 text-white'
                          : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                      }`}
                    >
                      {isStreaming ? (
                        <>
                          <Pause className="w-4 h-4" />
                          <span>Pause Stream</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>Start Stream</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {streamError && (
                  <div className="p-3.5 bg-red-50 border border-red-105 rounded-2xl text-xs font-semibold text-red-600 font-mono">
                    ⚠️ {streamError}
                  </div>
                )}

                {/* Telemetry Chart Component */}
                <TelemetryChart 
                  logs={telemetryLogs} 
                  usdcSpent={usdcSpent} 
                  escrowBalance={escrowBalance} 
                />

              </div>
            )}</div>

          </div>

        </div>
      ) : null}
    </div>
  );
}
