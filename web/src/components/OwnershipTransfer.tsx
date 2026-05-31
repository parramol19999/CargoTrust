'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { CARGO_REGISTRY_ADDRESS, USDC_ADDRESS, USDC_ABI, truncateAddress } from '@/lib/constants';
import CARGO_REGISTRY_ABI from '@/components/CargoRegistryABI.json';
import { ShoppingCart, Tag, MapPin, Loader2, RefreshCw, Layers, Calendar, ChevronRight } from 'lucide-react';
import { formatUnits, parseUnits } from 'viem';

export default function OwnershipTransfer({ refreshTrigger }: { refreshTrigger?: number }) {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  // On-chain Data State
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Listing Form State
  const [listingTokenId, setListingTokenId] = useState<number | null>(null);
  const [listPrice, setListPrice] = useState('100.00');

  // Purchase/List Transaction States
  const [txLoadingId, setTxLoadingId] = useState<number | null>(null);
  const [actionStep, setActionStep] = useState<'idle' | 'approving' | 'executing' | 'success'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Fetch nextTokenId to know how many twins exist
  const { data: nextTokenId } = useReadContract({
    address: CARGO_REGISTRY_ADDRESS,
    abi: CARGO_REGISTRY_ABI,
    functionName: 'nextTokenId',
    query: {
      refetchInterval: 5000,
    }
  });

  // 2. Fetch all batch details in parallel from RPC
  useEffect(() => {
    async function loadAllBatches() {
      if (!publicClient || !nextTokenId) return;
      setLoading(true);
      setErrorMsg('');
      try {
        const total = Number(nextTokenId.toString()) - 1;
        const loadedBatches = [];

        for (let i = 1; i <= total; i++) {
          const details: any = await publicClient.readContract({
            address: CARGO_REGISTRY_ADDRESS,
            abi: CARGO_REGISTRY_ABI,
            functionName: 'cargoBatches',
            args: [BigInt(i)],
          });

          const ownerAddress: any = await publicClient.readContract({
            address: CARGO_REGISTRY_ADDRESS,
            abi: CARGO_REGISTRY_ABI,
            functionName: 'ownerOf',
            args: [BigInt(i)],
          });

          const [producer, origin, harvestDate, latLong, ipfsMetadata, priceUsdc, isForSale, status] = details;

          let parsedDesc = 'Batch details on-chain';
          if (ipfsMetadata.includes('?desc=')) {
            parsedDesc = decodeURIComponent(ipfsMetadata.split('?desc=')[1]);
          }

          loadedBatches.push({
            id: i,
            producer,
            origin,
            harvestDate: Number(harvestDate.toString()) * 1000,
            latLong,
            ipfsMetadata,
            description: parsedDesc,
            priceUsdc: BigInt(priceUsdc.toString()),
            isForSale,
            status,
            owner: ownerAddress,
          });
        }

        setBatches(loadedBatches.reverse());
      } catch (err: any) {
        console.error(err);
        setErrorMsg('Error loading on-chain batches from Arc Testnet RPC.');
      } finally {
        setLoading(false);
      }
    }

    loadAllBatches();
  }, [publicClient, nextTokenId, refreshKey, refreshTrigger]);

  const handleList = async (tokenId: number) => {
    if (!isConnected || !address) return;
    setErrorMsg('');
    setTxLoadingId(tokenId);
    setActionStep('executing');

    try {
      const priceScaled = parseUnits(listPrice, 6);
      const tx = await writeContractAsync({
        address: CARGO_REGISTRY_ADDRESS,
        abi: CARGO_REGISTRY_ABI,
        functionName: 'listCargo',
        args: [BigInt(tokenId), priceScaled],
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: tx });
      }

      setListingTokenId(null);
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Listing failed.');
    } finally {
      setTxLoadingId(null);
      setActionStep('idle');
    }
  };

  const handleBuy = async (tokenId: number, price: bigint) => {
    if (!isConnected || !address) {
      setErrorMsg('Please connect your Web3 wallet first.');
      return;
    }
    setErrorMsg('');
    setTxLoadingId(tokenId);

    try {
      setActionStep('approving');
      const allowance = (await publicClient?.readContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'allowance',
        args: [address, CARGO_REGISTRY_ADDRESS],
      })) as bigint;

      if (allowance < price) {
        const approveTx = await writeContractAsync({
          address: USDC_ADDRESS,
          abi: USDC_ABI,
          functionName: 'approve',
          args: [CARGO_REGISTRY_ADDRESS, price],
        });

        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: approveTx });
        }
      }

      setActionStep('executing');
      const buyTx = await writeContractAsync({
        address: CARGO_REGISTRY_ADDRESS,
        abi: CARGO_REGISTRY_ABI,
        functionName: 'purchaseCargo',
        args: [BigInt(tokenId)],
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: buyTx });
      }

      setActionStep('success');
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'USDC Purchase failed.');
    } finally {
      setTxLoadingId(null);
      setActionStep('idle');
    }
  };

  return (
    <div className="card-light p-6">
      
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gray-50 border border-gray-100 rounded-xl">
            <ShoppingCart className="w-5 h-5 text-gray-900" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">B2B Financialized Operations Desk</h3>
            <p className="text-xs text-gray-400">Linked Stablecoin Payments & ownership routing</p>
          </div>
        </div>

        <button
          onClick={() => setRefreshKey((prev) => prev + 1)}
          disabled={loading}
          className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-300 text-gray-400 hover:text-gray-900 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-600 font-semibold mb-4">
          ⚠️ {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-8 h-8 text-gray-900 animate-spin mb-3" />
          <p className="text-xs font-mono text-gray-400">Reading block state from Arc Testnet...</p>
        </div>
      ) : batches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-gray-200 rounded-3xl text-gray-400 text-center">
          <Layers className="w-10 h-10 text-gray-300 mb-2" />
          <p className="text-sm font-semibold">No batches minted on-chain yet.</p>
          <p className="text-xs text-gray-400 max-w-xs mt-1">Use the Twin Creator to initiate the first batch.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => {
            const isOwner = address?.toLowerCase() === batch.owner.toLowerCase();
            const isLoading = txLoadingId === batch.id;
            return (
              <div
                key={batch.id}
                className="bg-white border border-gray-100 hover:border-gray-300 rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 border border-gray-200/50 rounded-lg text-[10px] font-mono font-bold tracking-wider">
                      BATCH: #{batch.id}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        batch.isForSale
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-gray-50 text-gray-500 border border-gray-200/60'
                      }`}
                    >
                      {batch.isForSale ? 'Listed B2B' : 'Held under Custody'}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-gray-900">{batch.origin}</h4>
                  <p className="text-xs text-gray-500 mt-1">{batch.description}</p>

                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100 text-xs font-medium">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Custodian</span>
                      <span className="text-gray-900 font-mono">
                        {isOwner ? 'You (Owner)' : truncateAddress(batch.owner, 4)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Harvest Date</span>
                      <span className="text-gray-950 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(batch.harvestDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex flex-col col-span-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 font-mono">Status & GPS Coordinates</span>
                      <span className="text-gray-900 font-bold flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {batch.latLong} • <span className="text-cyan-600 font-mono text-[11px]">{batch.status}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
                  {batch.isForSale ? (
                    <>
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase block tracking-widest font-bold">
                          B2B Price
                        </span>
                        <span className="text-lg font-bold text-emerald-600">
                          {parseFloat(formatUnits(batch.priceUsdc, 6)).toLocaleString()} USDC
                        </span>
                      </div>

                      {isOwner ? (
                        <span className="text-xs text-gray-400 font-bold italic">Your listing</span>
                      ) : (
                        <button
                          onClick={() => handleBuy(batch.id, batch.priceUsdc)}
                          disabled={isLoading}
                          className="px-6 py-2.5 bg-gray-950 hover:bg-gray-900 text-white rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 shadow"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              {actionStep === 'approving' ? 'Approving...' : 'Buying...'}
                            </>
                          ) : (
                            <>
                              Purchase Cargo
                              <ChevronRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="w-full">
                      {isOwner ? (
                        listingTokenId === batch.id ? (
                          <div className="space-y-3">
                            <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                              <span className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Set Price in USDC</span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={listPrice}
                                  onChange={(e) => setListPrice(e.target.value)}
                                  className="w-full bg-transparent text-sm font-bold text-gray-900 focus:outline-none"
                                />
                                <span className="text-xs text-gray-500 font-bold">USDC</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleList(batch.id)}
                                disabled={isLoading}
                                className="flex-grow py-2 bg-gray-950 hover:bg-gray-900 text-white font-bold rounded-xl text-xs"
                              >
                                {isLoading ? 'Listing...' : 'List Batches'}
                              </button>
                              <button
                                onClick={() => setListingTokenId(null)}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setListingTokenId(batch.id);
                              setListPrice('100.00');
                            }}
                            className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5"
                          >
                            <Tag className="w-3.5 h-3.5 text-gray-600" />
                            List for B2B Sale
                          </button>
                        )
                      ) : (
                        <div className="w-full py-2 bg-gray-50 text-gray-400 border border-gray-100 rounded-xl text-[11px] text-center italic">
                          Not listed by distributor
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
