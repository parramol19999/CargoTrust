'use client';

import React, { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { CARGO_REGISTRY_ADDRESS, USDC_ADDRESS, USDC_ABI } from '@/lib/constants';
import CARGO_REGISTRY_ABI from '@/components/CargoRegistryABI.json';
import { Leaf, MapPin, Calendar, Compass, FileText, Loader2, ArrowRight, ArrowLeftRight } from 'lucide-react';
import { formatUnits } from 'viem';

export default function TwinCreator({ onMintSuccess }: { onMintSuccess?: () => void }) {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  // Segment State (Inspire by Flight/Hotel tabs)
  const [activeSegment, setActiveSegment] = useState<'registry' | 'standards' | 'logistics'>('registry');

  // Form State
  const [origin, setOrigin] = useState('Dalat Organic Coffee Farm, Lam Dong');
  const [latLong, setLatLong] = useState('11.9404, 108.4583');
  const [destination, setDestination] = useState('CargoTrust QA Testing Lab, HCMC');
  const [destLatLong, setDestLatLong] = useState('10.8231, 106.6297');
  
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split('T')[0]);
  const [ipfsDoc, setIpfsDoc] = useState('ipfs://QmZ4831j1n38fsVakWc92uNs8F4qW924511n9K1mUfP2');
  const [description, setDescription] = useState('Premium Organic Arabica Beans, Micro-lot harvest #408');

  // Loading & Transaction States
  const [loadingStep, setLoadingStep] = useState<'idle' | 'approving' | 'minting' | 'success'>('idle');
  const [txHash, setTxHash] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Read USDC balance
  const { data: usdcBalance, refetch: refetchBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // 2. Read USDC allowance
  const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: address ? [address, CARGO_REGISTRY_ADDRESS] : undefined,
    query: { enabled: !!address },
  });

  const MINT_FEE = 100000n; // 0.10 USDC

  const handleSwap = () => {
    // Swap Origin and Destination
    const tempOrig = origin;
    const tempLat = latLong;
    setOrigin(destination);
    setLatLong(destLatLong);
    setDestination(tempOrig);
    setDestLatLong(tempLat);
  };

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) {
      setErrorMsg('Please connect your Web3 wallet first.');
      return;
    }
    setErrorMsg('');

    try {
      const balance = usdcBalance ? BigInt(usdcBalance.toString()) : 0n;
      if (balance < MINT_FEE) {
        setErrorMsg(`Insufficient USDC balance. You need at least 0.10 USDC (MINT Fee) + some USDC for gas.`);
        return;
      }

      const allowance = usdcAllowance ? BigInt(usdcAllowance.toString()) : 0n;

      if (allowance < MINT_FEE) {
        setLoadingStep('approving');
        const approveTx = await writeContractAsync({
          address: USDC_ADDRESS,
          abi: USDC_ABI,
          functionName: 'approve',
          args: [CARGO_REGISTRY_ADDRESS, 1000000n], // 1.00 USDC
        });
        
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: approveTx });
        }
        await refetchAllowance();
      }

      setLoadingStep('minting');
      const timestamp = Math.floor(new Date(harvestDate).getTime() / 1000);
      
      const mintTx = await writeContractAsync({
        address: CARGO_REGISTRY_ADDRESS,
        abi: CARGO_REGISTRY_ABI,
        functionName: 'mintCargo',
        args: [origin, BigInt(timestamp), latLong, `${ipfsDoc}?desc=${encodeURIComponent(description)}`],
      });

      setTxHash(mintTx);
      
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: mintTx });
      }

      setLoadingStep('success');
      refetchBalance();
      refetchAllowance();
      if (onMintSuccess) onMintSuccess();

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Transaction rejected or execution reverted.');
      setLoadingStep('idle');
    }
  };

  return (
    <div className="card-light p-6 relative">
      
      {/* Tab Segment Controls */}
      <div className="inline-flex bg-gray-100/80 p-1.5 rounded-2xl mb-6">
        <button
          type="button"
          onClick={() => setActiveSegment('registry')}
          className={`flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold tracking-wide transition-all ${
            activeSegment === 'registry' ? 'segment-tab-active' : 'segment-tab-inactive'
          }`}
        >
          <Leaf className="w-4 h-4" />
          Crop Registry
        </button>
        <button
          type="button"
          onClick={() => setActiveSegment('standards')}
          className={`flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold tracking-wide transition-all ${
            activeSegment === 'standards' ? 'segment-tab-active' : 'segment-tab-inactive'
          }`}
        >
          <FileText className="w-4 h-4" />
          Certifications
        </button>
      </div>

      {loadingStep === 'success' ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="p-4 bg-emerald-50 rounded-full border border-emerald-100 mb-4">
            <Leaf className="w-12 h-12 text-emerald-600 animate-pulse" />
          </div>
          <h4 className="text-lg font-bold text-gray-900">Digital Twin Registered</h4>
          <p className="text-xs text-gray-500 max-w-sm mt-2">
            The batch has been assigned an immutable identity NFT and anchors origin credentials on the blockchain.
          </p>

          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 w-full max-w-md mt-6 text-left text-xs font-mono text-gray-600">
            <div className="flex justify-between mb-1.5">
              <span>Token Standard:</span>
              <span className="text-gray-950 font-bold">ERC-721 (CRGO)</span>
            </div>
            <div className="flex justify-between mb-1.5">
              <span>Mint Fee Paid:</span>
              <span className="text-gray-950 font-bold">0.10 USDC</span>
            </div>
            <div className="flex justify-between mt-3 pt-3 border-t border-gray-200">
              <span>Tx Hash:</span>
              <a
                href={`https://testnet.arcscan.app/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-600 hover:underline overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]"
              >
                {txHash}
              </a>
            </div>
          </div>

          <button
            onClick={() => {
              setLoadingStep('idle');
              setTxHash('');
            }}
            className="mt-6 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-all duration-300"
          >
            Create Another Batch
          </button>
        </div>
      ) : (
        <form onSubmit={handleMint} className="space-y-5">
          
          {/* Main Booking-style Dual Cards (FROM / TO) */}
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Origin Farm */}
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-gray-400" />
                FROM (Origin Farm)
              </span>
              <input
                type="text"
                required
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="E.g., Bordeaux Vineyard, France"
                className="w-full bg-transparent text-base font-bold text-gray-900 focus:outline-none placeholder-gray-300"
              />
              <input
                type="text"
                required
                value={latLong}
                onChange={(e) => setLatLong(e.target.value)}
                placeholder="Coordinates: Lat, Long"
                className="w-full bg-transparent text-xs text-gray-500 font-mono mt-1 focus:outline-none placeholder-gray-400"
              />
            </div>

            {/* Interactive Swapper */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block">
              <button
                type="button"
                onClick={handleSwap}
                className="p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-full shadow-md text-gray-600 hover:text-gray-900 transition-all duration-300"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            {/* Destination Lab */}
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <Compass className="w-3 h-3 text-gray-400" />
                TO (QA Lab Destination)
              </span>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Destination Warehouse / testing laboratory"
                className="w-full bg-transparent text-base font-bold text-gray-900 focus:outline-none placeholder-gray-300"
              />
              <input
                type="text"
                required
                value={destLatLong}
                onChange={(e) => setDestLatLong(e.target.value)}
                placeholder="Coordinates: Lat, Long"
                className="w-full bg-transparent text-xs text-gray-500 font-mono mt-1 focus:outline-none placeholder-gray-400"
              />
            </div>
          </div>

          {/* Date, Certs, and Description Rows */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-gray-400" />
                Date of Harvest
              </span>
              <input
                type="date"
                required
                value={harvestDate}
                onChange={(e) => setHarvestDate(e.target.value)}
                className="w-full bg-transparent text-base font-bold text-gray-900 focus:outline-none"
              />
            </div>

            <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <FileText className="w-3 h-3 text-gray-400" />
                Certificates URI (IPFS)
              </span>
              <input
                type="text"
                required
                value={ipfsDoc}
                onChange={(e) => setIpfsDoc(e.target.value)}
                placeholder="ipfs://..."
                className="w-full bg-transparent text-sm font-bold text-gray-900 font-mono focus:outline-none placeholder-gray-300"
              />
            </div>
          </div>

          {/* Crop Grade Description */}
          <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Crop Batch Description & Grade Specifications
            </span>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide crop weight, grade, variety, moisture level..."
              className="w-full bg-transparent text-sm font-semibold text-gray-900 focus:outline-none placeholder-gray-400"
            />
          </div>

          {/* Account USDC Status bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs text-gray-500 font-mono">
            <span>
              Balance:{' '}
              <strong className="text-gray-900">
                {usdcBalance ? parseFloat(formatUnits(BigInt(usdcBalance.toString()), 6)).toFixed(2) : '0.00'}{' '}
                USDC
              </strong>
            </span>
            <span>
              Pre-approval Status:{' '}
              <strong className="text-emerald-600">
                {usdcAllowance && BigInt(usdcAllowance.toString()) >= MINT_FEE ? 'Approved ✓' : 'Required'}
              </strong>
            </span>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-600 font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Booking overlapping action button placement */}
          <div className="relative pt-4 flex justify-end">
            {!isConnected ? (
              <div className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-center text-xs text-gray-500 font-medium">
                Please connect your wallet at the navbar to mint crop twins.
              </div>
            ) : (
              <button
                type="submit"
                disabled={loadingStep !== 'idle'}
                className="px-8 py-3.5 bg-gray-950 hover:bg-gray-900 text-white font-bold rounded-2xl text-xs tracking-wider uppercase transition-all duration-300 flex items-center gap-2.5 shadow-lg shadow-gray-950/10 hover:shadow-gray-950/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loadingStep === 'approving' && (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Approving USDC...
                  </>
                )}
                {loadingStep === 'minting' && (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Minting twin...
                  </>
                )}
                {loadingStep === 'idle' && (
                  <>
                    Mint Product Twin (0.10 USDC Fee)
                    <ArrowRight className="w-4 h-4 text-white" />
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
