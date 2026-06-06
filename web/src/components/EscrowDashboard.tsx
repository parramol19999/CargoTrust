'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { CARGO_ESCROW_ADDRESS, truncateAddress, EURC_ADDRESS } from '@/lib/constants';
import CARGO_ESCROW_ABI from '@/components/CargoEscrowABI.json';
import { ShieldCheck, Lock, Unlock, HelpCircle, Loader2, RefreshCw, XCircle, DollarSign, Calendar, AlertTriangle } from 'lucide-react';

export default function EscrowDashboard() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  // Escrow state
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Fetch nextJobId to know how many jobs exist
  const { data: nextJobId } = useReadContract({
    address: CARGO_ESCROW_ADDRESS,
    abi: CARGO_ESCROW_ABI,
    functionName: 'nextJobId',
    query: { refetchInterval: 10000 }
  });

  // 2. Fetch jobs from the contract
  useEffect(() => {
    async function loadAllJobs() {
      if (!publicClient || !nextJobId) return;
      setLoading(true);
      setErrorMsg('');
      try {
        const totalJobs = Number(nextJobId.toString()) - 1;
        const loadedJobs = [];

        for (let i = 1; i <= totalJobs; i++) {
          const jobData: any = await publicClient.readContract({
            address: CARGO_ESCROW_ADDRESS,
            abi: CARGO_ESCROW_ABI,
            functionName: 'jobs',
            args: [BigInt(i)],
          });

          const [client, provider, evaluator, token, amount, expiry, status, deliverableHash, tokenId, isDamaged] = jobData;

          // Status enum: 0 = OPEN, 1 = FUNDED, 2 = COMPLETED, 3 = REJECTED
          let statusText = 'Unknown';
          if (status === 0) statusText = 'OPEN';
          if (status === 1) statusText = 'IN ESCROW';
          if (status === 2) statusText = 'PAID';
          if (status === 3) statusText = 'REFUNDED';

          // Token Name
          let tokenName = 'USDC';
          if (token.toLowerCase() === EURC_ADDRESS.toLowerCase()) {
            tokenName = 'EURC';
          }

          loadedJobs.push({
            id: i,
            client,
            provider,
            evaluator,
            token,
            tokenName,
            amount: Number(amount.toString()) / 1000000, // 6 decimals
            expiry: Number(expiry.toString()) * 1000, // to ms
            status,
            statusText,
            deliverableHash,
            tokenId: Number(tokenId.toString()),
            isDamaged,
          });
        }

        loadedJobs.sort((a, b) => b.id - a.id);
        setJobs(loadedJobs);
      } catch (err) {
        console.error(err);
        setErrorMsg('Error loading on-chain escrow job details.');
      } finally {
        setLoading(false);
      }
    }

    loadAllJobs();
  }, [publicClient, nextJobId, refreshKey]);

  // Certify Job & Release Funds
  const handleCertify = async (jobId: number) => {
    if (!isConnected || !address) {
      setErrorMsg('Wallet connection is required.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setActionLoadingId(jobId);

    try {
      const tx = await writeContractAsync({
        address: CARGO_ESCROW_ADDRESS,
        abi: CARGO_ESCROW_ABI,
        functionName: 'certifyDeliverable',
        args: [BigInt(jobId)],
      });

      setSuccessMsg(`Escrow payout certified successfully! Tx Hash: ${tx.slice(0, 10)}...`);
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to certify escrow deliverable.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Claim Refund
  const handleRefund = async (jobId: number) => {
    if (!isConnected || !address) {
      setErrorMsg('Wallet connection is required.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setActionLoadingId(jobId);

    try {
      const tx = await writeContractAsync({
        address: CARGO_ESCROW_ADDRESS,
        abi: CARGO_ESCROW_ABI,
        functionName: 'refund',
        args: [BigInt(jobId)],
      });

      setSuccessMsg(`Escrow refunded successfully! Tx Hash: ${tx.slice(0, 10)}...`);
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Refund request rejected. Ensure conditions (damaged/expired/voluntary release) are met.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Helper metrics
  const totalLockedUSDC = jobs
    .filter(j => j.status === 1 && j.tokenName === 'USDC')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalLockedEURC = jobs
    .filter(j => j.status === 1 && j.tokenName === 'EURC')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const yourEscrowVolume = jobs
    .filter(j => j.status === 1 && (j.client.toLowerCase() === address?.toLowerCase() || j.provider.toLowerCase() === address?.toLowerCase()))
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="bg-white border border-gray-250 rounded-3xl p-6 md:p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-5 bg-gray-900 rounded-full" />
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-gray-900" />
              B2B Escrow Settlements (ERC-8183)
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-2 max-w-xl leading-relaxed">
            Funds are locked securely in escrow contract. Releases are triggered automatically upon verifier certifications or manually released upon cargo damage or transit delays.
          </p>
        </div>
        <button
          onClick={() => setRefreshKey(prev => prev + 1)}
          disabled={loading}
          className="self-start md:self-center bg-gray-50 hover:bg-gray-100 disabled:opacity-50 text-gray-700 px-4.5 py-2.5 rounded-xl flex items-center gap-2 border border-gray-200 transition duration-200 text-xs font-semibold"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
          )}
          Refresh
        </button>
      </div>

      {/* Global Alerts */}
      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
          <XCircle className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
          <div className="text-rose-700 text-xs font-medium leading-relaxed">{errorMsg}</div>
        </div>
      )}
      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
          <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-emerald-700 text-xs font-medium leading-relaxed">{successMsg}</div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-[#fcfdfe] border border-gray-200 rounded-2xl p-5 relative overflow-hidden">
          <div className="text-[10px] font-mono tracking-wider font-bold text-gray-400 uppercase">USDC In Escrow</div>
          <div className="text-2xl font-extrabold text-gray-900 mt-1.5 flex items-baseline gap-1">
            {totalLockedUSDC.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs font-bold text-emerald-600">USDC</span>
          </div>
          <div className="absolute right-4 bottom-3 bg-emerald-50 p-2 rounded-xl border border-emerald-100">
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div className="bg-[#fcfdfe] border border-gray-200 rounded-2xl p-5 relative overflow-hidden">
          <div className="text-[10px] font-mono tracking-wider font-bold text-gray-400 uppercase">EURC In Escrow</div>
          <div className="text-2xl font-extrabold text-gray-900 mt-1.5 flex items-baseline gap-1">
            {totalLockedEURC.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs font-bold text-cyan-600">EURC</span>
          </div>
          <div className="absolute right-4 bottom-3 bg-cyan-50 p-2 rounded-xl border border-cyan-100">
            <DollarSign className="w-5 h-5 text-cyan-600" />
          </div>
        </div>

        <div className="bg-[#fcfdfe] border border-gray-200 rounded-2xl p-5 relative overflow-hidden">
          <div className="text-[10px] font-mono tracking-wider font-bold text-gray-400 uppercase">Your Active Share</div>
          <div className="text-2xl font-extrabold text-gray-900 mt-1.5 flex items-baseline gap-1">
            {yourEscrowVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs font-bold text-slate-500">Value</span>
          </div>
          <div className="absolute right-4 bottom-3 bg-purple-50 p-2 rounded-xl border border-purple-100">
            <Unlock className="w-5 h-5 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Escrow list */}
      {loading && jobs.length === 0 ? (
        <div className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-xs text-gray-500 font-medium">Reading ERC-8183 smart contract jobs...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="py-12 text-center bg-gray-50 border border-dashed border-gray-200 rounded-2xl">
          <HelpCircle className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-800">No Escrow Agreements</h3>
          <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1 leading-relaxed">
            Locked escrow jobs appear automatically when crops are purchased on the platform.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const isBuyer = job.client.toLowerCase() === address?.toLowerCase();
            const isSeller = job.provider.toLowerCase() === address?.toLowerCase();
            const isEvaluator = job.evaluator.toLowerCase() === address?.toLowerCase();
            const isPastExpiry = Date.now() > job.expiry;

            return (
              <div
                key={job.id}
                className="bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl p-5 transition duration-200 relative overflow-hidden"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="bg-gray-100 text-gray-800 border border-gray-200 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold">
                      Job #{job.id}
                    </span>
                    <span className="text-gray-400 font-mono text-[10px] font-semibold">
                      Crop Batch ID: {job.tokenId}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {job.isDamaged && (
                      <span className="bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Damaged
                      </span>
                    )}
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold tracking-wider border ${
                        job.status === 0
                          ? 'bg-amber-50 text-amber-700 border-amber-100'
                          : job.status === 1
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100 animate-pulse'
                          : job.status === 2
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                          : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}
                    >
                      {job.statusText}
                    </span>
                  </div>
                </div>

                {/* Routing & Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400 w-24">Buyer (Client):</span>
                      <span className="font-mono text-gray-800 font-semibold">
                        {truncateAddress(job.client)} {isBuyer && '(You)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400 w-24">Seller (Provider):</span>
                      <span className="font-mono text-gray-800 font-semibold">
                        {truncateAddress(job.provider)} {isSeller && '(You)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400 w-24">Certifier:</span>
                      <span className="font-mono text-gray-800 font-semibold">
                        {truncateAddress(job.evaluator)} {isEvaluator && '(You)'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-150 rounded-xl p-3 flex flex-col justify-center">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-medium">Locked:</span>
                      <span className="font-extrabold text-gray-900">
                        {job.amount.toLocaleString()} {job.tokenName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] mt-1.5">
                      <span className="text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Deadline:
                      </span>
                      <span className={`font-semibold ${isPastExpiry && job.status === 1 ? 'text-rose-600' : 'text-gray-600'}`}>
                        {new Date(job.expiry).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Operations Panel */}
                {job.status === 1 && (
                  <div className="flex flex-wrap items-center justify-between border-t border-gray-100 pt-3.5 gap-4">
                    <div className="text-[10px] text-gray-400 max-w-md">
                      {isEvaluator
                        ? 'Confirm crop quality specs and release payout to seller.'
                        : 'Awaiting lab QA report certification to release escrow payout.'}
                    </div>

                    <div className="flex items-center gap-2">
                      {(isEvaluator || isConnected) && (
                        <button
                          onClick={() => handleCertify(job.id)}
                          disabled={actionLoadingId !== null}
                          className="bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 transition duration-200"
                        >
                          {actionLoadingId === job.id ? (
                            <Loader2 className="w-3 animate-spin" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          )}
                          Release Escrow
                        </button>
                      )}

                      {(isBuyer || isSeller || isEvaluator) && (
                        <button
                          onClick={() => handleRefund(job.id)}
                          disabled={actionLoadingId !== null || (!job.isDamaged && !isPastExpiry && !isSeller && !isEvaluator)}
                          className="bg-white hover:bg-rose-50 border border-gray-200 hover:border-rose-100 text-gray-600 hover:text-rose-600 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-gray-600 disabled:hover:border-gray-200 px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 transition duration-200"
                        >
                          {actionLoadingId === job.id ? (
                            <Loader2 className="w-3 animate-spin" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          Claim Refund
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
