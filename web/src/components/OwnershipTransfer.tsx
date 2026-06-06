'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { CARGO_REGISTRY_ADDRESS, USDC_ADDRESS, USDC_ABI, EURC_ADDRESS, truncateAddress } from '@/lib/constants';
import CARGO_REGISTRY_ABI from '@/components/CargoRegistryABI.json';
import { ShoppingCart, Tag, MapPin, Loader2, RefreshCw, Layers, Calendar, ChevronRight } from 'lucide-react';
import { formatUnits, parseUnits } from 'viem';

import { useGasSponsorship } from '@/lib/gasSponsor';
import CrossChainPurchaseModal from '@/components/CrossChainPurchaseModal';
import BatchSplitter from '@/components/BatchSplitter';

export default function OwnershipTransfer({ refreshTrigger }: { refreshTrigger?: number }) {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const { isSponsored, limitReached } = useGasSponsorship();

  // Cross-chain purchase state
  const [crossChainModalOpen, setCrossChainModalOpen] = useState(false);
  const [selectedCrossChainBatch, setSelectedCrossChainBatch] = useState<any | null>(null);

  // Split Batch Modal State
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [selectedSplitBatch, setSelectedSplitBatch] = useState<any | null>(null);

  // On-chain Data State
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Listing Form State
  const [listingTokenId, setListingTokenId] = useState<number | null>(null);
  const [listPrice, setListPrice] = useState('100.00');
  const [listingCurrency, setListingCurrency] = useState<'USDC' | 'EURC'>('USDC');

  // Purchase/List Transaction States
  const [txLoadingId, setTxLoadingId] = useState<number | null>(null);
  const [actionStep, setActionStep] = useState<'idle' | 'approving' | 'executing' | 'success'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // StableFX Conversion State
  const [payCurrencies, setPayCurrencies] = useState<{ [tokenId: number]: 'USDC' | 'EURC' }>({});
  const [slippage, setSlippage] = useState('0.5'); // customizable slippage %
  const [quotes, setQuotes] = useState<{ [tokenId: number]: any }>({});
  const [fetchingQuote, setFetchingQuote] = useState<{ [tokenId: number]: boolean }>({});

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

          // Struct layout: producer, origin, harvestDate, latLong, ipfsMetadata, priceUsdc, isForSale, status, paymentToken, isEncrypted, encryptedPrice, weight
          const [
            producer,
            origin,
            harvestDate,
            latLong,
            ipfsMetadata,
            priceUsdc,
            isForSale,
            status,
            paymentToken,
            isEncrypted,
            encryptedPrice,
            weight
          ] = details;

          let parsedDesc = 'Batch details on-chain';
          if (ipfsMetadata.includes('?desc=')) {
            parsedDesc = decodeURIComponent(ipfsMetadata.split('?desc=')[1]);
          }

          const resolvedPaymentToken = (paymentToken && paymentToken !== '0x0000000000000000000000000000000000000000') 
            ? paymentToken 
            : USDC_ADDRESS;

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
            paymentToken: resolvedPaymentToken,
            weight: weight ? BigInt(weight.toString()) : 100n
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

  // StableFX Quote fetch trigger
  const fetchStableFXQuote = async (
    tokenId: number,
    targetAmountStr: string,
    fromCurrency: 'USDC' | 'EURC',
    toCurrency: 'USDC' | 'EURC'
  ) => {
    if (!address) return;
    setFetchingQuote((prev) => ({ ...prev, [tokenId]: true }));
    try {
      const fromAddress = fromCurrency === 'EURC' ? EURC_ADDRESS : USDC_ADDRESS;
      const toAddress = toCurrency === 'EURC' ? EURC_ADDRESS : USDC_ADDRESS;

      const res = await fetch(
        `/api/stablefx/quote?tokenId=${tokenId}&fromToken=${fromAddress}&toToken=${toAddress}&targetAmount=${targetAmountStr}&buyerAddress=${address}&slippage=${slippage}`
      );
      const data = await res.json();
      if (data.success) {
        setQuotes((prev) => ({ ...prev, [tokenId]: data.quote }));
      } else {
        setErrorMsg(data.error || 'Failed to fetch StableFX conversion quote.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to query backend StableFX engine.');
    } finally {
      setFetchingQuote((prev) => ({ ...prev, [tokenId]: false }));
    }
  };

  // Automatically monitor selected purchase currencies and poll quotes
  useEffect(() => {
    batches.forEach((batch) => {
      if (!batch.isForSale) return;
      const listedCurr = batch.paymentToken.toLowerCase() === EURC_ADDRESS.toLowerCase() ? 'EURC' : 'USDC';
      const selectedPayCurr = payCurrencies[batch.id] || listedCurr;

      if (selectedPayCurr !== listedCurr) {
        const priceStr = formatUnits(batch.priceUsdc, 6);
        fetchStableFXQuote(batch.id, priceStr, selectedPayCurr, listedCurr);
      } else {
        if (quotes[batch.id]) {
          setQuotes((prev) => {
            const updated = { ...prev };
            delete updated[batch.id];
            return updated;
          });
        }
      }
    });
  }, [payCurrencies, slippage, batches, address]);

  const handleList = async (tokenId: number) => {
    if (!isConnected || !address) return;
    setErrorMsg('');
    setTxLoadingId(tokenId);
    setActionStep('executing');

    try {
      const priceScaled = parseUnits(listPrice, 6);
      const targetToken = listingCurrency === 'EURC' ? EURC_ADDRESS : USDC_ADDRESS;
      
      const tx = await writeContractAsync({
        address: CARGO_REGISTRY_ADDRESS,
        abi: CARGO_REGISTRY_ABI,
        functionName: 'listCargo',
        args: [BigInt(tokenId), priceScaled, targetToken],
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

  const handleBuy = async (tokenId: number, batch: any) => {
    if (!isConnected || !address) {
      setErrorMsg('Please connect your Web3 wallet first.');
      return;
    }
    setErrorMsg('');
    setTxLoadingId(tokenId);

    try {
      const listedCurr = batch.paymentToken.toLowerCase() === EURC_ADDRESS.toLowerCase() ? 'EURC' : 'USDC';
      const selectedPayCurr = payCurrencies[tokenId] || listedCurr;

      if (selectedPayCurr === listedCurr) {
        // Direct trade in listed currency
        const tokenAddress = listedCurr === 'EURC' ? EURC_ADDRESS : USDC_ADDRESS;
        const price = batch.priceUsdc;

        setActionStep('approving');
        const allowance = (await publicClient?.readContract({
          address: tokenAddress,
          abi: USDC_ABI,
          functionName: 'allowance',
          args: [address, CARGO_REGISTRY_ADDRESS],
        })) as bigint;

        if (allowance < price) {
          const approveTx = await writeContractAsync({
            address: tokenAddress,
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
      } else {
        // Cross-currency conversion via StableFX (e.g. pay EURC for USDC batch)
        const quote = quotes[tokenId];
        if (!quote) {
          setErrorMsg('Waiting for signed StableFX quote payload.');
          return;
        }

        const paymentTokenAddr = selectedPayCurr === 'EURC' ? EURC_ADDRESS : USDC_ADDRESS;
        const paymentAmountRaw = parseUnits(quote.paymentAmount, 6);

        setActionStep('approving');
        const allowance = (await publicClient?.readContract({
          address: paymentTokenAddr,
          abi: USDC_ABI,
          functionName: 'allowance',
          args: [address, CARGO_REGISTRY_ADDRESS],
        })) as bigint;

        if (allowance < paymentAmountRaw) {
          const approveTx = await writeContractAsync({
            address: paymentTokenAddr,
            abi: USDC_ABI,
            functionName: 'approve',
            args: [CARGO_REGISTRY_ADDRESS, paymentAmountRaw],
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
          args: [
            BigInt(tokenId),
            paymentTokenAddr,
            paymentAmountRaw,
            BigInt(quote.deadline),
            quote.signature as `0x${string}`,
          ],
        });

        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: buyTx });
        }

        // Post execution trade logging to backend
        await fetch('/api/stablefx/trade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokenId,
            quote,
            txHash: buyTx,
          }),
        });
      }

      setActionStep('success');
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'StableFX Purchase execution failed.');
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
            <p className="text-xs text-gray-400">StableFX Cross-Token Conversions & ownership routing</p>
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
        <div className="p-3.5 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-600 font-semibold mb-4 animate-pulse">
          ⚠️ {errorMsg}
        </div>
      )}

      {limitReached && (
        <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-2xl text-xs text-amber-700 font-medium font-sans mb-4">
          ⚠️ Gas sponsorship limits reached. B2B operations will require native USDC gas.
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
            const listedCurr = batch.paymentToken.toLowerCase() === EURC_ADDRESS.toLowerCase() ? 'EURC' : 'USDC';
            const selectedPayCurr = payCurrencies[batch.id] || listedCurr;
            const quote = quotes[batch.id];
            const isQuoteLoading = fetchingQuote[batch.id];

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
                      {batch.isForSale ? `Listed in ${listedCurr}` : 'Held under Custody'}
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
                      <span className="text-gray-955 flex items-center gap-1">
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

                <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col gap-4">
                  {batch.isForSale ? (
                    <>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase block tracking-widest font-bold">
                            B2B Price
                          </span>
                          <span className="text-lg font-bold text-emerald-600">
                            {parseFloat(formatUnits(batch.priceUsdc, 6)).toLocaleString()} {listedCurr}
                          </span>
                        </div>

                        {!isOwner && (
                          <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 text-xs font-semibold">
                            <span className="text-gray-500">Pay With:</span>
                            <select
                              value={selectedPayCurr}
                              onChange={(e) =>
                                setPayCurrencies((prev) => ({ ...prev, [batch.id]: e.target.value as 'USDC' | 'EURC' }))
                              }
                              className="bg-white border border-gray-200 rounded-lg px-2 py-0.5 text-xs font-bold cursor-pointer"
                            >
                              <option value="USDC">USDC</option>
                              <option value="EURC">EURC</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {/* StableFX Quote drawer */}
                      {!isOwner && selectedPayCurr !== listedCurr && (
                        <div className="p-4 bg-emerald-50/30 border border-emerald-100/50 rounded-2xl space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 font-medium">Slippage Limit:</span>
                            <select
                              value={slippage}
                              onChange={(e) => setSlippage(e.target.value)}
                              className="bg-white border border-gray-200 rounded-lg px-2 py-0.5 text-[11px] font-bold"
                            >
                              <option value="0.1">0.1%</option>
                              <option value="0.5">0.5% (Default)</option>
                              <option value="1.0">1.0%</option>
                            </select>
                          </div>

                          {isQuoteLoading ? (
                            <div className="flex items-center justify-center py-2 text-emerald-700 font-mono text-xs">
                              <Loader2 className="w-4 h-4 animate-spin mr-1.5 text-emerald-600" />
                              Fetching StableFX Live rate...
                            </div>
                          ) : quote ? (
                            <div className="text-xs space-y-2">
                              <div className="flex justify-between font-mono">
                                <span className="text-gray-400">Conversion Rate:</span>
                                <span className="text-gray-900 font-bold">1 EURC ≈ {quote.rate.toFixed(4)} USDC</span>
                              </div>
                              <div className="flex justify-between font-mono">
                                <span className="text-gray-400">Total Charged:</span>
                                <span className="text-emerald-700 font-extrabold text-sm">{quote.paymentAmount} EURC</span>
                              </div>
                              <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                                <span>Quote Expiry:</span>
                                <span>{new Date(quote.deadline * 1000).toLocaleTimeString()}</span>
                              </div>
                              <div className="inline-flex items-center gap-1 bg-emerald-100/60 text-emerald-800 border border-emerald-200/50 rounded-lg px-2 py-1 text-[9px] font-bold font-mono">
                                🛡️ Rate Slippage Protected & Signed
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] text-red-500 text-center font-semibold">
                              Failed to generate quote. Please verify network.
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                        {isOwner ? (
                          <span className="text-xs text-gray-400 font-bold italic font-mono pr-2">Your listing</span>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => handleBuy(batch.id, batch)}
                              disabled={isLoading || (selectedPayCurr !== listedCurr && !quotes[batch.id] && !isQuoteLoading)}
                              className="px-5 py-2.5 bg-gray-950 hover:bg-gray-900 text-white rounded-xl text-xs font-bold transition-all duration-300 flex flex-col items-center justify-center gap-0.5 shadow min-w-[140px]"
                            >
                              {isLoading ? (
                                <span className="flex items-center gap-1.5 font-mono">
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  {actionStep === 'approving' ? 'Approving...' : 'Settling...'}
                                </span>
                              ) : (
                                <>
                                  <span className="flex items-center gap-1">
                                    {selectedPayCurr !== listedCurr ? 'Settle with StableFX' : 'Purchase Cargo'}
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </span>
                                  <span className="text-[9px] text-cyan-300 font-mono tracking-normal normal-case font-medium">
                                    {isSponsored ? 'Gas Sponsored' : 'User Pays Gas'}
                                  </span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => {
                                setSelectedCrossChainBatch(batch);
                                setCrossChainModalOpen(true);
                              }}
                              disabled={isLoading}
                              className="px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-950 border border-gray-205 rounded-xl text-xs font-bold transition-all duration-300 flex flex-col items-center justify-center gap-0.5 shadow-sm min-w-[140px]"
                            >
                              <span className="flex items-center gap-1">
                                Buy with Base/Eth
                              </span>
                              <span className="text-[9px] text-emerald-600 font-mono tracking-normal normal-case font-medium">
                                USDC Bridge
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="w-full">
                      {isOwner ? (
                        listingTokenId === batch.id ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                                <span className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Set Price</span>
                                <input
                                  type="number"
                                  value={listPrice}
                                  onChange={(e) => setListPrice(e.target.value)}
                                  className="w-full bg-transparent text-sm font-bold text-gray-900 focus:outline-none"
                                />
                              </div>
                              <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                                <span className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Currency</span>
                                <select
                                  value={listingCurrency}
                                  onChange={(e) => setListingCurrency(e.target.value as 'USDC' | 'EURC')}
                                  className="w-full bg-transparent text-xs font-bold text-gray-900 focus:outline-none cursor-pointer"
                                >
                                  <option value="USDC">USDC</option>
                                  <option value="EURC">EURC</option>
                                </select>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleList(batch.id)}
                                disabled={isLoading}
                                className="flex-grow py-2 bg-gray-950 hover:bg-gray-900 text-white font-bold rounded-xl text-xs flex flex-col items-center justify-center gap-0.5"
                              >
                                <span>{isLoading ? 'Listing...' : 'List Batches'}</span>
                                {isSponsored && !isLoading && (
                                  <span className="text-[9px] text-cyan-300 font-mono tracking-normal normal-case font-medium">Gas Sponsored</span>
                                )}
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
                          <div className="flex gap-2 w-full">
                            <button
                              onClick={() => {
                                setListingTokenId(batch.id);
                                setListPrice('100.00');
                                setListingCurrency('USDC');
                              }}
                              className="flex-grow py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5"
                            >
                              <Tag className="w-3.5 h-3.5 text-gray-650" />
                              List
                            </button>

                            <button
                              onClick={() => {
                                setSelectedSplitBatch(batch);
                                setSplitModalOpen(true);
                              }}
                              className="flex-grow py-2.5 bg-white hover:bg-gray-50 text-cyan-600 border border-cyan-200 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5"
                            >
                              <Layers className="w-3.5 h-3.5" />
                              Split Batch
                            </button>
                          </div>
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

      {selectedCrossChainBatch && (
        <CrossChainPurchaseModal
          isOpen={crossChainModalOpen}
          onClose={() => {
            setCrossChainModalOpen(false);
            setSelectedCrossChainBatch(null);
          }}
          batch={selectedCrossChainBatch}
          onSuccess={() => setRefreshKey((prev) => prev + 1)}
        />
      )}

      {selectedSplitBatch && (
        <BatchSplitter
          batch={selectedSplitBatch}
          onClose={() => {
            setSplitModalOpen(false);
            setSelectedSplitBatch(null);
          }}
          onSuccess={() => {
            setRefreshKey((prev) => prev + 1);
          }}
        />
      )}
    </div>
  );
}
