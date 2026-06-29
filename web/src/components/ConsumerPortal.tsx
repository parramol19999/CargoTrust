'use client';

import React, { useState, useEffect } from 'react';
import { useModal } from '@/lib/modals/store';
import { mapRawError } from '@/lib/modals/errorMapper';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePublicClient, useAccount, useSignMessage, useWriteContract } from 'wagmi';
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
  CreditCard,
  HelpCircle
} from 'lucide-react';
import { formatUnits } from 'viem';
import { generateClientPaymentToken, TelemetryLog } from '@/lib/nanopayments';
import TelemetryChart from '@/components/TelemetryChart';
import AccessRequestPanel from '@/components/AccessRequestPanel';
import LineageTree from '@/components/LineageTree';
import ProvenanceMap from '@/components/ProvenanceMap';
import { useFriendlyMode } from '@/lib/useFriendlyMode';
import ErrorCard from '@/components/ErrorCard';

export default function ConsumerPortal() {
  const { isSimpleMode } = useFriendlyMode();
  const { openModal } = useModal();
  const searchParams = useSearchParams();
  const router = useRouter();
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync } = useWriteContract();
  
  const [sessionSig, setSessionSig] = useState<string | null>(null);
  const [sessionNonce, setSessionNonce] = useState<string | null>(null);

  const [tokenIdInput, setTokenIdInput] = useState('');
  const [activeTokenId, setActiveTokenId] = useState<number | null>(null);

  // Anomaly Simulation & Spoilage states
  const [tempSpikeSimulated, setTempSpikeSimulated] = useState(false);
  const [spoilageLoading, setSpoilageLoading] = useState(false);

  // Provenance State
  const [loading, setLoading] = useState(false);
  const [cargo, setCargo] = useState<any | null>(null);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [owner, setOwner] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Privacy and Decryption states
  const [decryptedData, setDecryptedData] = useState<any | null>(null);
  const [decryptLoading, setDecryptLoading] = useState(false);
  const [decryptError, setDecryptError] = useState('');
  const [refreshPrivacyTrigger, setRefreshPrivacyTrigger] = useState(0);

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
          if (!sessionNonce || !sessionSig || !address) {
            setIsStreaming(false);
            setStreamError('Session expired or unauthorized. Please re-sign.');
            return;
          }
          const nonceVal = `${sessionNonce}-${Date.now()}`;
          const payload = {
            buyerAddress: address,
            amount: '0.000001',
            currency: 'USDC',
            tokenId: activeTokenId,
            nonce: nonceVal,
            signature: sessionSig,
          };
          const token = Buffer.from(JSON.stringify(payload)).toString('base64');
          
          const response = await fetch(`/api/telemetry?tokenId=${activeTokenId}`, {
            headers: {
              'x-payment-token': token
            }
          });

          if (response.status === 402) {
            const errData = await response.json();
            setStreamError(errData.error || errData.message || 'Payment required to fetch telemetry.');
            setIsStreaming(false);
            return;
          }

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              let logs = data.history || [];
              if (tempSpikeSimulated) {
                // If temp spike is simulated, override the last log's temperature to trigger breach alert
                logs = logs.map((log: any, idx: number) => {
                  if (idx === logs.length - 1) {
                    return { ...log, temperature: 28.5 };
                  }
                  return log;
                });
              }
              setTelemetryLogs(logs);
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
  }, [isStreaming, activeTokenId, escrowBalance, sessionNonce, sessionSig, address, tempSpikeSimulated]);

  const handleToggleStream = async () => {
    if (isStreaming) {
      setIsStreaming(false);
      return;
    }
    
    if (!address) {
      setStreamError('Please connect your owner wallet to authorize telemetry micro-payments.');
      return;
    }

    if (activeTokenId === null) {
      setStreamError('Please search and select a cargo token ID first.');
      return;
    }
    
    setStreamError('');
    try {
      const nonce = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const message = `Authorize Telemetry Stream Session for Crop Twin #${activeTokenId} (Session: ${nonce})`;
      
      const sig = await signMessageAsync({ message });
      setSessionNonce(nonce);
      setSessionSig(sig);
      setIsStreaming(true);
    } catch (e: any) {
      console.error(e);
      setStreamError(`Authorization failed: ${e.message || 'Signature rejected by wallet.'}`);
    }
  };

  const handleReportSpoilage = async () => {
    if (activeTokenId === null || !address) {
      openModal({
        id: 'report-spoilage-no-wallet',
        type: 'error',
        title: 'Wallet Disconnected',
        description: 'Please connect your Web3 wallet first to submit on-chain logs.',
      });
      return;
    }
    
    openModal({
      id: 'report-spoilage-tx',
      type: 'transaction',
      stepStatus: 'preparing',
      statusMessage: 'Preparing the transaction to flag this cargo as Spoiled...',
    });

    setSpoilageLoading(true);
    try {
      openModal({
        id: 'report-spoilage-tx',
        type: 'transaction',
        stepStatus: 'signing',
        statusMessage: 'Awaiting signature in your wallet...',
      });

      const tx = await writeContractAsync({
        address: CARGO_REGISTRY_ADDRESS,
        abi: CARGO_REGISTRY_ABI,
        functionName: 'updateStatus',
        args: [BigInt(activeTokenId), 'Spoiled'],
      });

      openModal({
        id: 'report-spoilage-tx',
        type: 'transaction',
        txHash: tx,
        stepStatus: 'pending',
        statusMessage: 'Waiting for blockchain block confirmation...',
        explorerUrl: 'https://testnet.arcscan.app',
      });

      // Set to success once receipt triggers, but wait 4 seconds mock since we refresh privacy trigger anyway
      setTimeout(() => {
        openModal({
          id: 'report-spoilage-tx',
          type: 'transaction',
          txHash: tx,
          stepStatus: 'success',
          statusMessage: `Cargo #${activeTokenId} successfully reported as Spoiled on-chain!`,
          explorerUrl: 'https://testnet.arcscan.app',
        });
        setRefreshPrivacyTrigger(prev => prev + 1);
      }, 4000);

    } catch (err: any) {
      console.error(err);
      const mapped = mapRawError(err);
      openModal({
        id: 'report-spoilage-error',
        type: 'error',
        title: mapped.title,
        description: mapped.description,
        technicalDetails: mapped.technicalDetails,
        retryLabel: mapped.retryable ? 'Try Again' : undefined,
        onRetry: mapped.retryable ? handleReportSpoilage : undefined,
      });
    } finally {
      setSpoilageLoading(false);
    }
  };

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
      setDecryptedData(null);
      setDecryptError('');

      try {
        const res = await fetch('/api/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `
              query GetCargoTwin($id: ID!) {
                cargoTwinById(id: $id) {
                  id
                  tokenId
                  producer
                  origin
                  harvestDate
                  latLong
                  ipfsMetadata
                  owner
                  priceUsdc
                  isForSale
                  status
                  isEncrypted
                  encryptedPrice
                  weight
                }
              }
            `,
            variables: { id: activeTokenId.toString() }
          })
        });

        const { data } = await res.json();
        const twin = data?.cargoTwinById;

        if (!twin) {
          setErrorMsg(`Crop Token ID #${activeTokenId} does not exist in our global provenance registry.`);
          setLoading(false);
          return;
        }

        const verifs: any = await publicClient.readContract({
          address: CARGO_REGISTRY_ADDRESS,
          abi: CARGO_REGISTRY_ABI,
          functionName: 'getVerifications',
          args: [BigInt(activeTokenId)],
        }).catch(() => []);

        // Read real-time cargo status from smart contract to override indexer delay
        const onChainCargo: any = await publicClient.readContract({
          address: CARGO_REGISTRY_ADDRESS,
          abi: CARGO_REGISTRY_ABI,
          functionName: 'cargoBatches',
          args: [BigInt(activeTokenId)],
        }).catch(() => null);

        const onChainOwner: any = await publicClient.readContract({
          address: CARGO_REGISTRY_ADDRESS,
          abi: CARGO_REGISTRY_ABI,
          functionName: 'ownerOf',
          args: [BigInt(activeTokenId)],
        }).catch(() => null);

        let realTimeStatus = twin.status;
        if (onChainCargo) {
          realTimeStatus = onChainCargo[7]; // status is index 7
        }

        let parsedDesc = 'Batch details on-chain';
        if (twin.ipfsMetadata.includes('?desc=')) {
          parsedDesc = decodeURIComponent(twin.ipfsMetadata.split('?desc=')[1]);
        }

        const cargoRecord = {
          id: activeTokenId,
          producer: twin.producer,
          origin: twin.origin,
          harvestDate: Number(twin.harvestDate.toString()) * 1000,
          latLong: twin.latLong,
          ipfsMetadata: twin.ipfsMetadata,
          description: parsedDesc,
          priceUsdc: BigInt(twin.priceUsdc || '0'),
          isForSale: twin.isForSale,
          status: realTimeStatus,
          isEncrypted: !!twin.isEncrypted,
          encryptedPrice: twin.encryptedPrice || '',
          weight: BigInt(twin.weight || 100)
        };

        setCargo(cargoRecord);
        setOwner(onChainOwner || twin.owner);
        setVerifications(verifs);

        // Attempt decryption automatically if a key is stored locally for this token
        if (twin.isEncrypted) {
          const localKey = localStorage.getItem(`crop_key_${activeTokenId}`);
          if (localKey || address) {
            try {
              const decryptRes = await fetch('/api/privacy/decrypt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  tokenId: activeTokenId,
                  requester: address || twin.producer,
                  producer: twin.producer,
                  encryptedData: {
                    origin: twin.origin,
                    latLong: twin.latLong,
                    description: parsedDesc,
                    price: twin.encryptedPrice || '',
                  }
                }),
              });
              const decVal = await decryptRes.json();
              if (decVal.success) {
                setDecryptedData(decVal.decrypted);
              }
            } catch (decErr) {
              console.error('Decryption failed:', decErr);
            }
          }
        }

      } catch (err) {
        console.error(err);
        setErrorMsg(`Failed to query provenance timeline. Ensure token ID #${activeTokenId} is correct.`);
      } finally {
        setLoading(false);
      }
    }

    fetchProvenance();
  }, [publicClient, activeTokenId, address, refreshPrivacyTrigger]);

  const handleTryDecrypt = async () => {
    if (!activeTokenId || !cargo) return;
    setDecryptLoading(true);
    setDecryptError('');
    try {
      const res = await fetch('/api/privacy/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: activeTokenId,
          requester: address || '',
          producer: cargo.producer,
          encryptedData: {
            origin: cargo.origin,
            latLong: cargo.latLong,
            description: cargo.description,
            price: cargo.encryptedPrice || '',
          }
        }),
      });

      const data = await res.json();
      if (data.success) {
        setDecryptedData(data.decrypted);
        setDecryptError('');
      } else {
        setDecryptError(data.error || 'Decryption unauthorized.');
      }
    } catch (err: any) {
      setDecryptError(err.message || 'Decryption failed.');
    } finally {
      setDecryptLoading(false);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
          {isSimpleMode ? 'Scan Coffee Farm Receipt' : 'Scan Cryptographic Crop Provenance'}
        </h3>
        <p className="text-xs text-gray-400 mb-6 text-center md:text-left">
          {isSimpleMode 
            ? 'Enter any Receipt ID to trace its farm origin, quality certifications, and purchase history.'
            : 'Enter any on-chain Token ID to trace its path, quality testing, and B2B stablecoin trades.'}
        </p>

        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
          <div className="flex-grow p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center gap-3 relative group">
            <Search className="w-5 h-5 text-gray-400 font-bold" />
            <input
              type="text"
              value={tokenIdInput}
              onChange={(e) => setTokenIdInput(e.target.value)}
              placeholder={isSimpleMode ? 'E.g., 1 (Enter Receipt ID)' : 'E.g., 1 (Enter Crop Token ID)'}
              className="w-full bg-transparent text-sm font-bold text-gray-900 focus:outline-none placeholder-gray-300"
            />
            <div className="group-hover:opacity-100 opacity-0 pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-[10px] rounded p-2 transition-opacity z-50 shadow-lg leading-normal normal-case font-normal font-sans text-center max-w-[200px]">
              {isSimpleMode 
                ? 'Search by entering the digital number of your coffee receipt.' 
                : 'Search by entering the numeric Token ID of the crop twin registered on CargoTrust.'}
            </div>
          </div>

          <button
            type="submit"
            className="px-8 py-4 bg-gray-950 hover:bg-gray-900 text-white font-bold rounded-2xl text-xs tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2"
          >
            {isSimpleMode ? 'Trace Coffee' : 'Verify Provenance'}
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </form>

        {errorMsg && (
          <div className="mt-4">
            <ErrorCard
              error={errorMsg}
              onRetry={() => handleSearch()}
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-8 h-8 text-gray-900 animate-spin mb-3" />
          <p className="text-xs font-mono text-gray-400">
            {isSimpleMode ? 'Reconstructing coffee timeline...' : 'Reconstructing secure provenance timeline...'}
          </p>
        </div>
      ) : cargo ? (
        <div className="space-y-6">
          
          {/* Main Provenance Card (Itinerary Style) */}
          <div className="card-light p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-700 border border-gray-200/50 rounded-lg text-[10px] font-mono font-bold tracking-wider">
                    {isSimpleMode ? 'RECEIPT ID' : 'CROP TOKEN ID'}: #{cargo.id}
                  </span>
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-700 border border-gray-200/50 rounded-lg text-[10px] font-mono font-bold tracking-wider">
                    {isSimpleMode ? `WEIGHT: ${cargo.weight ? cargo.weight.toString() : '100'} LBS` : `WEIGHT: ${cargo.weight ? cargo.weight.toString() : '100'} UNITS`}
                  </span>
                  {cargo.isEncrypted && (
                    <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded border uppercase tracking-wider ${
                      decryptedData
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-red-50 text-red-600 border-red-200'
                    }`}>
                      {decryptedData 
                        ? (isSimpleMode ? '🔓 Unlocked' : '🔓 Decrypted') 
                        : (isSimpleMode ? '🔒 Hidden' : '🔒 Encrypted')}
                    </span>
                  )}
                  {cargo.isEncrypted && !decryptedData && (
                    <button
                      onClick={handleTryDecrypt}
                      disabled={decryptLoading}
                      className="px-2.5 py-1 bg-gray-950 hover:bg-gray-900 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1"
                    >
                      {decryptLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlock className="w-3 h-3" />}
                      {isSimpleMode ? 'Unlock Details' : 'Decrypt Details'}
                    </button>
                  )}
                </div>
                {decryptError && (
                  <span className="block text-[9px] text-red-600 font-mono mt-1">⚠️ {decryptError}</span>
                )}
                <h4 className="text-lg font-bold text-gray-900 mt-1">
                  {cargo.isEncrypted
                    ? decryptedData
                      ? decryptedData.origin
                      : (isSimpleMode ? 'Hidden Coffee Batch 🔒' : 'Private Crop Batch 🔒')
                    : cargo.origin}
                </h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block">
                  {isSimpleMode ? 'Current Owner' : 'Current Custodian'}
                </span>
                <span className="text-xs font-mono font-bold text-gray-900 select-all" title={owner}>
                  {truncateAddress(owner, 8)}
                </span>
              </div>
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
                {isSimpleMode ? 'Coffee Origin Timeline' : 'Provenance Timeline'}
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
                {isSimpleMode ? 'Live Temperature Stream' : 'Live Telemetry Stream (x402)'}
              </button>
            </div>

            {activeTab === 'provenance' ? (
              <div className="space-y-6">
                <ProvenanceMap 
                  latLong={
                    cargo.isEncrypted && decryptedData
                      ? decryptedData.latLong
                      : cargo.latLong
                  }
                  verifications={verifications}
                  status={cargo.status}
                />

                {/* Flight-Itinerary Stepper Timeline */}
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
                        {isSimpleMode ? 'STEP 1: FARM ORIGIN CERTIFICATE' : 'PHASE 1: IMMUTABLE HARVEST ANCHOR'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(cargo.harvestDate).toLocaleDateString()}
                      </span>
                    </div>
 
                    <p className="text-sm font-bold text-gray-900">
                      {cargo.isEncrypted
                        ? decryptedData
                          ? decryptedData.origin
                          : (isSimpleMode ? 'Origin Details Hidden 🔒' : 'Origin Details Encrypted 🔒')
                        : cargo.origin}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {cargo.isEncrypted
                        ? decryptedData
                          ? decryptedData.description
                          : (isSimpleMode ? `${cargo.description.slice(0, 32)}... (Hidden Information 🔒)` : `${cargo.description.slice(0, 32)}... (Encrypted Metadata Payload 🔒)`)
                        : cargo.description}
                    </p>
 
                    <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-200/60 text-[10px] font-mono text-gray-500">
                      <div>
                        <span className="block text-gray-400 uppercase tracking-widest font-bold text-[8px]">
                          {isSimpleMode ? 'Producer ID' : 'Producer Address'}
                        </span>
                        <span className="text-gray-700 block text-ellipsis overflow-hidden whitespace-nowrap">{cargo.producer}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 uppercase tracking-widest font-bold text-[8px]">
                          {isSimpleMode ? 'Farm GPS Location' : 'GPS Coordinates'}
                        </span>
                        <span className="text-gray-900 font-bold flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {cargo.isEncrypted
                            ? decryptedData
                              ? decryptedData.latLong
                              : (isSimpleMode ? 'Redacted (Hidden 🔒)' : 'Redacted (Encrypted 🔒)')
                            : cargo.latLong}
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
                      {isSimpleMode ? 'STEP 2: QUALITY & HEALTH REPORT' : 'PHASE 2: INDEPENDENT LAB VERIFICATION'}
                    </span>

                    {verifications.length === 0 ? (
                      <div className="text-xs text-gray-400 py-2 italic">
                        {isSimpleMode ? 'Laboratory reports are pending verification.' : 'Laboratory inspection results pending verifier signature.'}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {verifications.map((v: any, index: number) => (
                          <div key={index} className="bg-white border border-gray-100 rounded-xl p-3 text-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-gray-900">{v.credentialType}</span>
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[9px] font-bold">
                                {isSimpleMode ? 'Certified ✓' : 'Verified ✓'}
                              </span>
                            </div>

                            <div className="text-[10px] text-gray-500 font-mono space-y-1">
                              <div className="flex justify-between">
                                <span>{isSimpleMode ? 'Authorized Lab:' : 'Verifier Name:'}</span>
                                <span className="text-gray-900 font-bold">{v.verifierName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>{isSimpleMode ? 'Lab Signature ID:' : 'Verifier Key:'}</span>
                                <span className="text-gray-700 select-all">{v.verifier}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>{isSimpleMode ? 'Secure Report File:' : 'W3C Proof IPFS:'}</span>
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
                      {isSimpleMode ? 'STEP 3: TRADE & OWNERSHIP BOARD' : 'PHASE 3: B2B COMMERCE SETTLEMENTS'}
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
                      {cargo.isEncrypted && (
                        <div className="flex justify-between border-t border-gray-100 pt-2 mt-2">
                          <span className="text-gray-400">
                            {isSimpleMode ? 'Minimum Selling Price:' : 'Target Harvest Price:'}
                          </span>
                          <span className="font-mono font-bold text-gray-900">
                            {decryptedData ? `${decryptedData.price} USDC 🔓` : (isSimpleMode ? 'Redacted (Hidden 🔒)' : 'Redacted (Encrypted 🔒)')}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>{isSimpleMode ? 'Shipment Status:' : 'Settlement Status:'}</span>
                        <span className="text-cyan-600 font-bold">{cargo.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{isSimpleMode ? 'Registered Owner:' : 'On-chain Owner:'}</span>
                        <span className="font-mono font-bold text-gray-900">{truncateAddress(owner, 6)}</span>
                      </div>
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
                        {isStreaming 
                          ? (isSimpleMode ? 'Receiving temperature updates...' : 'Streaming telemetry logs...') 
                          : (isSimpleMode ? 'Monitoring offline' : 'Stream offline')}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 block">
                      {isSimpleMode ? 'Cost: $0.000001 per second (Automatic micropayments)' : 'Nanopayment Rate: $0.000001 USDC / sec'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Anomaly Simulator */}
                    <label className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-150 rounded-xl text-xs font-bold text-gray-700 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={tempSpikeSimulated} 
                        onChange={(e) => setTempSpikeSimulated(e.target.checked)}
                        className="rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer w-3.5 h-3.5" 
                      />
                      <span>{isSimpleMode ? 'Simulate High Heat' : 'Simulate Temp Spike'}</span>
                    </label>

                    {/* Fund Escrow */}
                    <div className="px-3 py-1.5 bg-white border border-gray-150 rounded-xl flex items-center gap-2 text-xs font-mono font-bold text-gray-700">
                      <span>{isSimpleMode ? `Balance: $${escrowBalance.toFixed(6)}` : `Escrow: $${escrowBalance.toFixed(6)} USDC`}</span>
                      <button
                        onClick={() => {
                          setEscrowBalance(prev => prev + 0.000050);
                        }}
                        className="p-1 hover:bg-gray-100 text-cyan-600 rounded-md transition-all flex items-center gap-0.5 animate-pulse"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isSimpleMode ? 'Top Up' : 'Fund'}</span>
                      </button>
                    </div>

                    <button
                      onClick={handleToggleStream}
                      className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow flex items-center gap-1.5 ${
                        isStreaming
                          ? 'bg-gray-900 hover:bg-gray-800 text-white'
                          : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                      }`}
                    >
                      {isStreaming ? (
                        <>
                          <Pause className="w-4 h-4" />
                          <span>{isSimpleMode ? 'Pause' : 'Pause Stream'}</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>{isSimpleMode ? 'Start Tracking' : 'Start Stream'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {streamError && (
                  <ErrorCard
                    error={streamError}
                    onRetry={handleToggleStream}
                  />
                )}

                {/* Telemetry Chart Component */}
                <TelemetryChart 
                  logs={telemetryLogs} 
                  usdcSpent={usdcSpent} 
                  escrowBalance={escrowBalance}
                  onTriggerSpoilage={handleReportSpoilage}
                  isSpoilageLoading={spoilageLoading} 
                />

              </div>
            )}

          </div>

          {/* Lineage and split provenance tree */}
          <LineageTree activeTokenId={cargo.id} />

          {/* Selective Cryptographic Disclosure / Sharing Desk */}
          <div className="mt-8">
            <AccessRequestPanel refreshTrigger={refreshPrivacyTrigger} />
          </div>

        </div>
      ) : null}
    </div>
  );
}
