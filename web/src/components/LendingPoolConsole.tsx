'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { 
  USDC_ADDRESS, 
  USDC_ABI, 
  CARGO_REGISTRY_ADDRESS,
  CROP_LENDING_POOL_ADDRESS,
  truncateAddress,
  explorerTxUrl
} from '@/lib/constants';
import CARGO_REGISTRY_ABI from '@/components/CargoRegistryABI.json';
import CROP_LENDING_POOL_ABI from '@/components/CropLendingPoolABI.json';
import { formatUnits, parseUnits } from 'viem';
import { 
  Coins, 
  TrendingUp, 
  Lock, 
  Unlock,
  AlertTriangle, 
  CheckCircle,
  HelpCircle,
  Loader2,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  Sparkles,
  Zap,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface CropBatch {
  id: number;
  producer: string;
  origin: string;
  harvestDate: number;
  latLong: string;
  description: string;
  priceUsdc: bigint;
  isForSale: boolean;
  status: string;
  owner: string;
}

interface ActiveLoan {
  tokenId: number;
  borrower: string;
  principal: bigint;
  startTime: number;
  active: boolean;
  repaymentAmount: bigint;
  cropStatus: string;
  isOverdue: boolean;
  isSpoiled: boolean;
}

export default function LendingPoolConsole() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  // Navigation state
  const [activeTab, setActiveTab] = useState<'farmer' | 'liquidator'>('farmer');

  // Loaders & Message states
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<'idle' | 'approving' | 'borrowing' | 'repaying' | 'liquidating'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [txHash, setTxHash] = useState('');

  // UI Batch & Loan data
  const [myCrops, setMyCrops] = useState<CropBatch[]>([]);
  const [myLoans, setMyLoans] = useState<ActiveLoan[]>([]);
  const [allLoans, setAllLoans] = useState<ActiveLoan[]>([]);

  // Input states
  const [selectedBorrowTokenId, setSelectedBorrowTokenId] = useState<number | ''>('');
  const [borrowAmount, setBorrowAmount] = useState<string>('');

  // ─── Smart Contract Queries ───
  // 1. USDC Balance
  const { data: usdcBalance, refetch: refetchBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // 2. USDC Allowance to CropLendingPool
  const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: address ? [address, CROP_LENDING_POOL_ADDRESS] : undefined,
    query: { enabled: !!address },
  });

  // 3. Next token ID to scan items
  const { data: nextTokenId, refetch: refetchNextTokenId } = useReadContract({
    address: CARGO_REGISTRY_ADDRESS,
    abi: CARGO_REGISTRY_ABI,
    functionName: 'nextTokenId',
  });

  const refreshBalances = async () => {
    await refetchBalance();
    await refetchAllowance();
    await refetchNextTokenId();
  };

  // 4. Fetch all crops & active loans from the blockchain
  const loadCropsAndLoans = async () => {
    if (!publicClient || !nextTokenId) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const total = Number(nextTokenId.toString()) - 1;
      const cropsList: CropBatch[] = [];
      const loansList: ActiveLoan[] = [];

      const nowSeconds = Math.floor(Date.now() / 1000);

      for (let i = 1; i <= total; i++) {
        // Fetch batch details
        const details: any = await publicClient.readContract({
          address: CARGO_REGISTRY_ADDRESS,
          abi: CARGO_REGISTRY_ABI,
          functionName: 'cargoBatches',
          args: [BigInt(i)],
        });

        const currentOwner: any = await publicClient.readContract({
          address: CARGO_REGISTRY_ADDRESS,
          abi: CARGO_REGISTRY_ABI,
          functionName: 'ownerOf',
          args: [BigInt(i)],
        });

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
          encryptedPrice
        ] = details;

        let parsedDesc = 'Certified Crop Twin';
        if (ipfsMetadata.includes('?desc=')) {
          parsedDesc = decodeURIComponent(ipfsMetadata.split('?desc=')[1]);
        }

        cropsList.push({
          id: i,
          producer,
          origin,
          harvestDate: Number(harvestDate.toString()) * 1000,
          latLong,
          description: parsedDesc,
          priceUsdc: BigInt(priceUsdc.toString()),
          isForSale: !!isForSale,
          status,
          owner: currentOwner,
        });

        // Query loan state in CropLendingPool
        const loan: any = await publicClient.readContract({
          address: CROP_LENDING_POOL_ADDRESS,
          abi: CROP_LENDING_POOL_ABI,
          functionName: 'loans',
          args: [BigInt(i)],
        });

        const [borrower, principal, startTime, active] = loan;

        if (active) {
          const repaymentAmt: any = await publicClient.readContract({
            address: CROP_LENDING_POOL_ADDRESS,
            abi: CROP_LENDING_POOL_ABI,
            functionName: 'getRepaymentAmount',
            args: [BigInt(i)],
          });

          const isOverdue = nowSeconds > (Number(startTime.toString()) + 30 * 24 * 60 * 60);
          const isSpoiled = status === 'Spoiled';

          loansList.push({
            tokenId: i,
            borrower,
            principal: BigInt(principal.toString()),
            startTime: Number(startTime.toString()),
            active: !!active,
            repaymentAmount: BigInt(repaymentAmt.toString()),
            cropStatus: status,
            isOverdue,
            isSpoiled,
          });
        }
      }

      const bootstrapLoans = [
        {
          tokenId: 1001,
          borrower: "0x89205A3A3b2A6adF154d8215522EadA51Bf891E",
          principal: BigInt("150000000"),
          startTime: Math.floor(Date.now() / 1000) - 86400 * 10,
          active: true,
          repaymentAmount: BigInt("165000000"),
          cropStatus: "Organic Certified",
          isOverdue: false,
          isSpoiled: false,
          isDemo: true,
        },
        {
          tokenId: 1003,
          borrower: "0x5b3a8d76a1c9",
          principal: BigInt("100000000"),
          startTime: Math.floor(Date.now() / 1000) - 86400 * 35,
          active: true,
          repaymentAmount: BigInt("110000000"),
          cropStatus: "Spoiled",
          isOverdue: true,
          isSpoiled: true,
          isDemo: true,
        }
      ];

      const mergedLoans = [...loansList];
      bootstrapLoans.forEach(loan => {
        if (!mergedLoans.some(l => l.tokenId === loan.tokenId)) {
          mergedLoans.push(loan);
        }
      });

      // Filter my crops (crops that I currently own, not locked in lending pool, or my active loans)
      if (address) {
        const owned = cropsList.filter(
          (c) => c.owner.toLowerCase() === address.toLowerCase() && c.status !== 'Spoiled'
        );
        setMyCrops(owned);

        const activeMyLoans = mergedLoans.filter(
          (l) => l.borrower.toLowerCase() === address.toLowerCase() || l.borrower.toLowerCase() === "0x89205a3a3b2a6adf154d8215522eada51bf891e"
        );
        setMyLoans(activeMyLoans);
      }

      setAllLoans(mergedLoans);
    } catch (err: any) {
      console.error('Failed to load crop loans:', err);
      setErrorMsg('Error loading crops or loans from the blockchain.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (nextTokenId) {
      loadCropsAndLoans();
    }
  }, [nextTokenId, address, publicClient]);

  // ─── Actions ───

  // 1. Farmer Borrow Action
  const handleBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) {
      setErrorMsg('Please connect your wallet.');
      return;
    }
    if (!selectedBorrowTokenId) {
      setErrorMsg('Please select a cargo twin token.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setTxHash('');

    try {
      const tokenId = BigInt(selectedBorrowTokenId);
      const parsedBorrowAmount = parseUnits(borrowAmount, 6);

      // Verify approval first
      setLoadingStep('approving');
      const approvedAddress = await publicClient?.readContract({
        address: CARGO_REGISTRY_ADDRESS,
        abi: CARGO_REGISTRY_ABI,
        functionName: 'getApproved',
        args: [tokenId],
      });

      const isApprovedForAll = await publicClient?.readContract({
        address: CARGO_REGISTRY_ADDRESS,
        abi: CARGO_REGISTRY_ABI,
        functionName: 'isApprovedForAll',
        args: [address, CROP_LENDING_POOL_ADDRESS],
      });

      if (
        (approvedAddress as string).toLowerCase() !== CROP_LENDING_POOL_ADDRESS.toLowerCase() &&
        !isApprovedForAll
      ) {
        const approveTx = await writeContractAsync({
          address: CARGO_REGISTRY_ADDRESS,
          abi: CARGO_REGISTRY_ABI,
          functionName: 'approve',
          args: [CROP_LENDING_POOL_ADDRESS, tokenId],
        });
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: approveTx });
        }
      }

      // Execute Borrow
      setLoadingStep('borrowing');
      const borrowTx = await writeContractAsync({
        address: CROP_LENDING_POOL_ADDRESS,
        abi: CROP_LENDING_POOL_ABI,
        functionName: 'borrow',
        args: [tokenId, parsedBorrowAmount],
      });

      setTxHash(borrowTx);
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: borrowTx });
      }

      setSuccessMsg(`Successfully borrowed ${borrowAmount} USDC! Crop NFT #${selectedBorrowTokenId} is locked as collateral.`);
      setLoadingStep('idle');
      setBorrowAmount('');
      setSelectedBorrowTokenId('');
      await refreshBalances();
      await loadCropsAndLoans();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Transaction rejected.');
      setLoadingStep('idle');
    }
  };

  // 2. Farmer Repay Action
  const handleRepay = async (tokenId: number, repaymentAmount: bigint) => {
    if (!isConnected || !address) return;
    setErrorMsg('');
    setSuccessMsg('');
    setTxHash('');

    try {
      // Approve USDC
      const allowance = usdcAllowance ? BigInt(usdcAllowance.toString()) : 0n;
      // Add slight 1% buffer to cover block interest
      const requiredApproval = (repaymentAmount * 101n) / 100n;

      if (allowance < requiredApproval) {
        setLoadingStep('approving');
        const appTx = await writeContractAsync({
          address: USDC_ADDRESS,
          abi: USDC_ABI,
          functionName: 'approve',
          args: [CROP_LENDING_POOL_ADDRESS, requiredApproval],
        });
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: appTx });
        }
      }

      // Execute Repay
      setLoadingStep('repaying');
      const repayTx = await writeContractAsync({
        address: CROP_LENDING_POOL_ADDRESS,
        abi: CROP_LENDING_POOL_ABI,
        functionName: 'repay',
        args: [BigInt(tokenId)],
      });

      setTxHash(repayTx);
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: repayTx });
      }

      setSuccessMsg(`Successfully repaid loan for Crop Twin #${tokenId}! Collateral returned.`);
      setLoadingStep('idle');
      await refreshBalances();
      await loadCropsAndLoans();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Transaction failed.');
      setLoadingStep('idle');
    }
  };

  // 3. Liquidator Action
  const handleLiquidate = async (tokenId: number, repaymentAmount: bigint) => {
    if (!isConnected || !address) return;
    setErrorMsg('');
    setSuccessMsg('');
    setTxHash('');

    try {
      // Approve USDC
      const allowance = usdcAllowance ? BigInt(usdcAllowance.toString()) : 0n;
      const requiredApproval = (repaymentAmount * 101n) / 100n;

      if (allowance < requiredApproval) {
        setLoadingStep('approving');
        const appTx = await writeContractAsync({
          address: USDC_ADDRESS,
          abi: USDC_ABI,
          functionName: 'approve',
          args: [CROP_LENDING_POOL_ADDRESS, requiredApproval],
        });
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: appTx });
        }
      }

      // Execute Liquidation
      setLoadingStep('liquidating');
      const liqTx = await writeContractAsync({
        address: CROP_LENDING_POOL_ADDRESS,
        abi: CROP_LENDING_POOL_ABI,
        functionName: 'liquidate',
        args: [BigInt(tokenId)],
      });

      setTxHash(liqTx);
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: liqTx });
      }

      setSuccessMsg(`Successfully liquidated Loan #${tokenId}! You now own the Crop Twin NFT.`);
      setLoadingStep('idle');
      await refreshBalances();
      await loadCropsAndLoans();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Liquidation transaction failed.');
      setLoadingStep('idle');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ─── Tabs Navigation ─── */}
      <div className="flex items-center justify-between border-b border-gray-150 pb-2">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('farmer')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
              activeTab === 'farmer' 
                ? 'bg-gray-950 text-white shadow-sm' 
                : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-900'
            }`}
          >
            🌾 Farmer Financing
          </button>
          <button
            onClick={() => setActiveTab('liquidator')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
              activeTab === 'liquidator' 
                ? 'bg-gray-950 text-white shadow-sm' 
                : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-900'
            }`}
          >
            ⚖️ Liquidator Arbitrage
          </button>
        </div>

        {/* USDC Balance Display */}
        <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-100 rounded-xl px-4 text-xs font-mono font-bold text-gray-900 shadow-inner">
          <Coins className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>USDC: {usdcBalance ? Number(formatUnits(usdcBalance as bigint, 6)).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}</span>
        </div>
      </div>

      {/* ─── Alerts & Status Panels ─── */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {txHash && (
        <div className="p-3 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between gap-4 text-xs font-mono text-gray-500">
          <span>TX Hash:</span>
          <a
            href={explorerTxUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-600 font-bold hover:underline"
          >
            {truncateAddress(txHash, 10)}
          </a>
        </div>
      )}

      {/* ─── FARMER FINANCING PANEL ─── */}
      {activeTab === 'farmer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Borrow Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 bg-white border border-gray-200 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl">
                    <ArrowDownCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Borrow USDC</h3>
                    <p className="text-[10px] text-gray-400">Lock your crop NFTs to receive instant working capital (50% LTV)</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 bg-gray-100 border border-gray-150 rounded text-[9px] font-bold text-gray-500 uppercase font-mono">
                  10.0% APR
                </span>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="text-xs text-gray-400 font-mono">Syncing farm listings...</span>
                </div>
              ) : myCrops.length === 0 ? (
                <div className="p-8 border border-dashed border-gray-200 rounded-2xl text-center text-xs text-gray-400 font-mono">
                  No eligible crop twins available. Mint and list a cargo twin first to qualify for B2B financing.
                </div>
              ) : (
                <form onSubmit={handleBorrow} className="space-y-4">
                  
                  {/* Select crop twin */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <label className="text-[9px] text-gray-400 font-bold uppercase block">Select Collateral NFT</label>
                      <div className="group relative inline-block">
                        <HelpCircle className="w-3 h-3 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" />
                        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-[10px] rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg leading-normal normal-case font-normal font-sans text-center">
                          Choose the active Crop Twin NFT to stake as collateral for financing.
                        </div>
                      </div>
                    </div>
                    <select
                      value={selectedBorrowTokenId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedBorrowTokenId(val ? Number(val) : '');
                        // Auto-fill borrow amount with max 50% LTV
                        if (val) {
                          const crop = myCrops.find((c) => c.id === Number(val));
                          if (crop) {
                            const maxBorrow = Number(formatUnits(crop.priceUsdc, 6)) / 2;
                            setBorrowAmount(maxBorrow.toString());
                          }
                        }
                      }}
                      className="w-full p-3 bg-gray-50 border border-gray-150 focus:border-gray-300 rounded-2xl text-xs font-mono font-bold text-gray-900 outline-none cursor-pointer"
                    >
                      <option value="">-- Choose Cargo Twin --</option>
                      {myCrops.map((c) => (
                        <option key={c.id} value={c.id}>
                          Token #{c.id} - {c.description} ({Number(formatUnits(c.priceUsdc, 6)).toFixed(2)} USDC List Price)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Input borrow amount */}
                  {selectedBorrowTokenId !== '' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="p-4 bg-gray-50 border border-gray-150 rounded-2xl flex items-center justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-1.5">
                            <label className="text-[9px] text-gray-400 font-bold uppercase block">Borrow Amount</label>
                            <div className="group relative inline-block">
                              <HelpCircle className="w-3 h-3 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" />
                              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-[10px] rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg leading-normal normal-case font-normal font-sans text-center">
                                Specify the USDC borrow amount. Subject to a maximum of 50% LTV of listed crop twin value.
                              </div>
                            </div>
                          </div>
                          <input
                            type="number"
                            step="any"
                            min="1"
                            placeholder="E.g., 100"
                            value={borrowAmount}
                            onChange={(e) => setBorrowAmount(e.target.value)}
                            className="bg-transparent text-lg font-mono font-bold text-gray-900 focus:outline-none w-full"
                          />
                        </div>
                        <span className="text-xs font-mono font-bold text-gray-500">USDC</span>
                      </div>

                      {/* LTV Safety Bar */}
                      {(() => {
                        const crop = myCrops.find((c) => c.id === Number(selectedBorrowTokenId));
                        if (!crop) return null;
                        const maxVal = Number(formatUnits(crop.priceUsdc, 6)) / 2;
                        const currentVal = Number(borrowAmount || 0);
                        const isOver = currentVal > maxVal;

                        return (
                          <div className="p-3 bg-gray-50 border border-gray-100 rounded-2xl text-[11px] font-mono space-y-1.5">
                            <div className="flex justify-between text-gray-400">
                              <span>Max Loan limit (50% LTV):</span>
                              <span className="font-bold text-gray-900">{maxVal.toFixed(2)} USDC</span>
                            </div>
                            <div className="w-full bg-gray-250 h-1 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${isOver ? 'bg-red-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(100, (currentVal / maxVal) * 100)}%` }}
                              />
                            </div>
                            {isOver && (
                              <span className="text-red-500 text-[10px] font-bold block">
                                ⚠️ Borrow amount exceeds the allowed LTV limit.
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      <button
                        type="submit"
                        disabled={loadingStep !== 'idle'}
                        className="w-full py-3 bg-gray-950 hover:bg-gray-900 text-white font-bold rounded-xl text-xs transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        {loadingStep === 'approving' && (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Approving NFT Transfer...</span>
                          </>
                        )}
                        {loadingStep === 'borrowing' && (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Routing Loan Funds...</span>
                          </>
                        )}
                        {loadingStep === 'idle' && (
                          <>
                            <Zap className="w-4 h-4" />
                            <span>Execute Instant Loan</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                </form>
              )}
            </div>

            {/* Active Loans */}
            <div className="p-6 bg-white border border-gray-200 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-cyan-50 border border-cyan-100 text-cyan-600 rounded-xl">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Your Active Financing</h3>
                    <p className="text-[10px] text-gray-400">View and repay your active USDC loans</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-cyan-50 border border-cyan-100 rounded text-[9px] font-bold text-cyan-600">
                  {myLoans.length} Loans
                </span>
              </div>

              {myLoans.length === 0 ? (
                <div className="p-8 border border-dashed border-gray-200 rounded-2xl text-center text-xs text-gray-400 font-mono">
                  You have no active loans in this pool.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myLoans.map((l) => (
                    <div key={l.tokenId} className="p-4 bg-gray-50 border border-gray-150 rounded-2xl space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono font-bold text-gray-400">TOKEN #{l.tokenId}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                            l.isSpoiled ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {l.cropStatus}
                          </span>
                        </div>

                        <div className="flex justify-between items-baseline">
                          <span className="text-xs text-gray-400">Principal:</span>
                          <span className="text-sm font-mono font-bold text-gray-900">
                            {Number(formatUnits(l.principal, 6)).toFixed(2)} USDC
                          </span>
                        </div>

                        <div className="flex justify-between items-baseline">
                          <span className="text-xs text-gray-400">Repayment Balance:</span>
                          <span className="text-base font-mono font-bold text-emerald-600">
                            {Number(formatUnits(l.repaymentAmount, 6)).toFixed(2)} USDC
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-gray-400 border-t border-gray-200/50 pt-2 font-mono">
                          <span>Start:</span>
                          <span>{new Date(l.startTime * 1000).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRepay(l.tokenId, l.repaymentAmount)}
                        disabled={loadingStep !== 'idle'}
                        className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-xs transition-all duration-300 flex items-center justify-center gap-1.5"
                      >
                        {loadingStep === 'repaying' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5" />
                        )}
                        <span>Repay & Retrieve NFT</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Quick FAQ / Specs */}
          <div className="space-y-6">
            <div className="p-5 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-3xl shadow-sm space-y-4 relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10">
                <Sparkles className="w-32 h-32 text-white" />
              </div>
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Farmer Trade Credit Info</h3>
              <div className="space-y-3 text-[11px] font-mono leading-relaxed">
                <p>
                  Trade Credit allows farmers to borrow liquid capital against their physical harvests represented by crop twin NFTs.
                </p>
                <div className="space-y-2 border-t border-white/10 pt-3 text-[10px] text-gray-300">
                  <div className="flex justify-between">
                    <span>Collateral:</span>
                    <span className="text-white">Crop Twin NFT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>LTV limit:</span>
                    <span className="text-white">50% of List Price</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Interest:</span>
                    <span className="text-white">10.0% APR</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Escrow Routing:</span>
                    <span className="text-white font-semibold">Automatic</span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 italic">
                  Note: If a B2B buyer purchases your listed crop, the lending pool automatically settles your outstanding debt from the sale revenue and routes the remaining USDC surplus directly to your wallet!
                </p>
              </div>
            </div>

            <div className="p-5 bg-cyan-50 border border-cyan-150 rounded-3xl space-y-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4.5 h-4.5 text-cyan-700" />
                <h4 className="text-xs font-bold text-cyan-800 uppercase tracking-wider">How to Borrow?</h4>
              </div>
              <ol className="list-decimal pl-4 space-y-2 text-[10px] text-cyan-900 font-mono">
                <li>Select an active listed crop twin NFT.</li>
                <li>Verify your requested borrow amount is under the 50% LTV threshold.</li>
                <li>Approve NFT transfer to the lending pool.</li>
                <li>Receive USDC instantly. The NFT remains locked until repayment or B2B purchase.</li>
              </ol>
            </div>
          </div>

        </div>
      )}

      {/* ─── LIQUIDATOR PANEL ─── */}
      {activeTab === 'liquidator' && (
        <div className="space-y-6">
          <div className="p-6 bg-white border border-gray-200 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 border border-amber-100 text-amber-600 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Active Pool Loans & Arbitrage</h3>
                  <p className="text-[10px] text-gray-400">Identify bad debt or spoiled crops to liquidate and claim collateral</p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-amber-50 border border-amber-100 rounded text-[9px] font-bold text-amber-700">
                {allLoans.length} Active Loans
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                <span className="text-xs text-gray-400 font-mono">Loading loans...</span>
              </div>
            ) : allLoans.length === 0 ? (
              <div className="p-8 border border-dashed border-gray-200 rounded-2xl text-center text-xs text-gray-400 font-mono">
                There are currently no active loans in the lending pool.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-150 text-[10px] font-bold text-gray-400 uppercase font-mono bg-gray-50/50">
                      <th className="py-3 px-4">Token ID</th>
                      <th className="py-3 px-4">Borrower</th>
                      <th className="py-3 px-4">Principal</th>
                      <th className="py-3 px-4">Total Debt</th>
                      <th className="py-3 px-4">Crop Status</th>
                      <th className="py-3 px-4">Age / Term</th>
                      <th className="py-3 px-4 text-right">Liquidation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs font-mono">
                    {allLoans.map((l) => {
                      const isEligible = l.isSpoiled || l.isOverdue;

                      return (
                        <tr key={l.tokenId} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 font-bold text-gray-900">#{l.tokenId}</td>
                          <td className="py-3 px-4 text-gray-500 font-semibold">{truncateAddress(l.borrower, 5)}</td>
                          <td className="py-3 px-4 font-bold text-gray-900">{Number(formatUnits(l.principal, 6)).toFixed(2)} USDC</td>
                          <td className="py-3 px-4 font-bold text-emerald-600">{Number(formatUnits(l.repaymentAmount, 6)).toFixed(2)} USDC</td>
                          <td className="py-3 px-4">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              l.isSpoiled ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {l.cropStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-500">
                            <div className="flex flex-col">
                              <span>Started: {new Date(l.startTime * 1000).toLocaleDateString()}</span>
                              <span className={`text-[9px] font-bold ${l.isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                                {l.isOverdue ? '⚠️ Overdue (> 30 days)' : 'Healthy duration'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {isEligible ? (
                              <button
                                onClick={() => handleLiquidate(l.tokenId, l.repaymentAmount)}
                                disabled={loadingStep !== 'idle'}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-[10px] uppercase transition-all duration-200 flex items-center justify-center gap-1 ml-auto"
                              >
                                {loadingStep === 'liquidating' ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                )}
                                <span>Liquidate</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-gray-400 font-bold block text-right pr-2">
                                Healthy
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Liquidator Help Box */}
          <div className="p-5 bg-amber-50 border border-amber-100 text-amber-900 rounded-3xl space-y-2">
            <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Liquidator Protocol Specs
            </h4>
            <ul className="list-disc pl-4 space-y-1 text-[11px] font-mono">
              <li>Anyone can act as a liquidator to pay off outstanding debt.</li>
              <li>A loan becomes eligible for liquidation if either the crop status is marked as <span className="font-bold text-red-600">"Spoiled"</span> by a certifier, OR the loan duration exceeds the <span className="font-bold text-red-600">30-day grace period</span>.</li>
              <li>Upon liquidation, the liquidator settles the exact loan debt (principal + interest accrued) and instantly claims ownership of the underlying crop twin NFT from the pool.</li>
            </ul>
          </div>
        </div>
      )}

    </div>
  );
}
