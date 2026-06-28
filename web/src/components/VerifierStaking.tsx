'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { 
  USDC_ADDRESS, 
  USDC_ABI, 
  VERIFIER_REGISTRY_ADDRESS, 
  truncateAddress,
  explorerTxUrl
} from '@/lib/constants';
import VERIFIER_REGISTRY_ABI from '@/components/VerifierRegistryABI.json';
import { formatUnits, parseUnits } from 'viem';
import { 
  ShieldCheck, 
  Coins, 
  TrendingUp, 
  Lock, 
  AlertTriangle, 
  CheckCircle,
  HelpCircle,
  Loader2,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  Activity
} from 'lucide-react';

export default function VerifierStaking() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  // Input States
  const [stakeAmount, setStakeAmount] = useState('500');
  const [withdrawAmount, setWithdrawAmount] = useState('500');

  // Transaction States
  const [loadingStep, setLoadingStep] = useState<'idle' | 'approving' | 'staking' | 'requesting' | 'finalizing' | 'claiming'>('idle');
  const [txHash, setTxHash] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [timeLeftStr, setTimeLeftStr] = useState('');

  // ─── Smart Contract Queries ───

  // 1. USDC balance of the verifier
  const { data: usdcBalance, refetch: refetchBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // 2. USDC allowance for the VerifierRegistry
  const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: address ? [address, VERIFIER_REGISTRY_ADDRESS] : undefined,
    query: { enabled: !!address },
  });

  // 3. Staked amount
  const { data: stakedAmount, refetch: refetchStaked } = useReadContract({
    address: VERIFIER_REGISTRY_ADDRESS,
    abi: VERIFIER_REGISTRY_ABI,
    functionName: 'stakedAmount',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // 4. Rewards balance
  const { data: rewardBalance, refetch: refetchRewards } = useReadContract({
    address: VERIFIER_REGISTRY_ADDRESS,
    abi: VERIFIER_REGISTRY_ABI,
    functionName: 'rewardBalance',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // 5. Reputation score
  const { data: reputationScore, refetch: refetchReputation } = useReadContract({
    address: VERIFIER_REGISTRY_ADDRESS,
    abi: VERIFIER_REGISTRY_ABI,
    functionName: 'reputationScore',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // 6. Withdrawal Request details
  const { data: withdrawRequest, refetch: refetchWithdrawRequest } = useReadContract({
    address: VERIFIER_REGISTRY_ADDRESS,
    abi: VERIFIER_REGISTRY_ABI,
    functionName: 'withdrawRequests',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // 7. Total Slashed
  const { data: totalSlashed, refetch: refetchSlashed } = useReadContract({
    address: VERIFIER_REGISTRY_ADDRESS,
    abi: VERIFIER_REGISTRY_ABI,
    functionName: 'totalSlashed',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // 8. Min Stake Required
  const { data: minStake } = useReadContract({
    address: VERIFIER_REGISTRY_ADDRESS,
    abi: VERIFIER_REGISTRY_ABI,
    functionName: 'minStake',
  });

  // Helper values
  const hasMinStake = stakedAmount ? BigInt(stakedAmount.toString()) >= (minStake ? BigInt(minStake.toString()) : 500000000n) : false;
  const pendingWithdrawAmount = withdrawRequest ? BigInt((withdrawRequest as any)[0].toString()) : 0n;
  const pendingUnlockTime = withdrawRequest ? Number((withdrawRequest as any)[1].toString()) : 0;

  // Refresh everything helper
  const refreshAll = async () => {
    await refetchBalance();
    await refetchAllowance();
    await refetchStaked();
    await refetchRewards();
    await refetchReputation();
    await refetchWithdrawRequest();
    await refetchSlashed();
  };

  // Cooldown countdown timer
  useEffect(() => {
    if (pendingUnlockTime === 0 || pendingWithdrawAmount === 0n) {
      setTimeLeftStr('');
      return;
    }

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const diff = pendingUnlockTime - now;

      if (diff <= 0) {
        setTimeLeftStr('Unlocked & Ready to Finalize!');
        clearInterval(interval);
      } else {
        const days = Math.floor(diff / (24 * 3600));
        const hours = Math.floor((diff % (24 * 3600)) / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        setTimeLeftStr(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pendingUnlockTime, pendingWithdrawAmount]);

  // ─── Actions ───

  const handleStake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) {
      setErrorMsg('Wallet not connected.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setTxHash('');

    try {
      const parsedAmount = parseUnits(stakeAmount, 6);
      const balance = usdcBalance ? BigInt(usdcBalance.toString()) : 0n;

      if (balance < parsedAmount) {
        setErrorMsg('Insufficient USDC balance to complete staking.');
        return;
      }

      const allowance = usdcAllowance ? BigInt(usdcAllowance.toString()) : 0n;

      // Approval step if allowance is less than requested amount
      if (allowance < parsedAmount) {
        setLoadingStep('approving');
        const appTx = await writeContractAsync({
          address: USDC_ADDRESS,
          abi: USDC_ABI,
          functionName: 'approve',
          args: [VERIFIER_REGISTRY_ADDRESS, parsedAmount * 2n], // approve double for convenience
        });
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: appTx });
        }
        await refetchAllowance();
      }

      // Staking step
      setLoadingStep('staking');
      const stakeTx = await writeContractAsync({
        address: VERIFIER_REGISTRY_ADDRESS,
        abi: VERIFIER_REGISTRY_ABI,
        functionName: 'stake',
        args: [parsedAmount],
      });

      setTxHash(stakeTx);
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: stakeTx });
      }
      setSuccessMsg(`Successfully staked ${stakeAmount} USDC! You are now registered.`);
      setLoadingStep('idle');
      await refreshAll();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Transaction rejected or failed.');
      setLoadingStep('idle');
    }
  };

  const handleRequestWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const parsedAmount = parseUnits(withdrawAmount, 6);
      const currentlyStaked = stakedAmount ? BigInt(stakedAmount.toString()) : 0n;

      if (currentlyStaked < parsedAmount) {
        setErrorMsg('Cannot request withdrawal of more than your active stake.');
        return;
      }

      setLoadingStep('requesting');
      const reqTx = await writeContractAsync({
        address: VERIFIER_REGISTRY_ADDRESS,
        abi: VERIFIER_REGISTRY_ABI,
        functionName: 'requestWithdraw',
        args: [parsedAmount],
      });

      setTxHash(reqTx);
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: reqTx });
      }
      setSuccessMsg(`Withdrawal request submitted for ${withdrawAmount} USDC. Cooldown lock period initiated.`);
      setLoadingStep('idle');
      await refreshAll();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Transaction rejected.');
      setLoadingStep('idle');
    }
  };

  const handleFinalizeWithdraw = async () => {
    if (!isConnected || !address) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const now = Math.floor(Date.now() / 1000);
      if (now < pendingUnlockTime) {
        setErrorMsg('Withdrawal is still locked under the 7-day freeze period.');
        return;
      }

      setLoadingStep('finalizing');
      const finTx = await writeContractAsync({
        address: VERIFIER_REGISTRY_ADDRESS,
        abi: VERIFIER_REGISTRY_ABI,
        functionName: 'finalizeWithdraw',
      });

      setTxHash(finTx);
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: finTx });
      }
      setSuccessMsg(`Successfully finalized withdrawal. Staked funds returned.`);
      setLoadingStep('idle');
      await refreshAll();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Transaction failed.');
      setLoadingStep('idle');
    }
  };

  const handleClaimRewards = async () => {
    if (!isConnected || !address) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const rewards = rewardBalance ? BigInt(rewardBalance.toString()) : 0n;
      if (rewards === 0n) {
        setErrorMsg('No rewards available to withdraw.');
        return;
      }

      setLoadingStep('claiming');
      const claimTx = await writeContractAsync({
        address: VERIFIER_REGISTRY_ADDRESS,
        abi: VERIFIER_REGISTRY_ABI,
        functionName: 'withdrawRewards',
      });

      setTxHash(claimTx);
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: claimTx });
      }
      setSuccessMsg(`Successfully claimed rewards!`);
      setLoadingStep('idle');
      await refreshAll();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Transaction failed.');
      setLoadingStep('idle');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Quick Audit Card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Active Stake */}
        <div className="p-5 bg-white border border-gray-100 rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Collateral</span>
            <div className="p-1.5 bg-gray-50 border border-gray-100 rounded-lg">
              <Coins className="w-4 h-4 text-gray-900" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-gray-900">
              {stakedAmount ? Number(formatUnits(stakedAmount as bigint, 6)).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[10px]">
              {hasMinStake ? (
                <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Registry Accredited
                </span>
              ) : (
                <span className="text-red-500 font-bold flex items-center gap-0.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Under-collateralized
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Reputation Score */}
        <div className="p-5 bg-white border border-gray-100 rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Reputation Score</span>
            <div className="p-1.5 bg-gray-50 border border-gray-100 rounded-lg">
              <TrendingUp className="w-4 h-4 text-cyan-600" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-gray-900">
              {reputationScore ? reputationScore.toString() : '100'} <span className="text-xs text-gray-400 font-medium">/ 500</span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div 
                className="bg-cyan-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (Number(reputationScore || 100) / 500) * 100)}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Accrued Reward Fees */}
        <div className="p-5 bg-white border border-gray-100 rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Accrued Rewards</span>
            <div className="p-1.5 bg-gray-50 border border-gray-100 rounded-lg">
              <ArrowDownCircle className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-gray-900">
              {rewardBalance ? Number(formatUnits(rewardBalance as bigint, 6)).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
            </div>
            <button
              onClick={handleClaimRewards}
              disabled={!rewardBalance || BigInt(rewardBalance.toString()) === 0n || loadingStep !== 'idle'}
              className="mt-2 text-[10px] text-cyan-600 hover:text-cyan-700 font-bold flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Withdraw Rewards &rarr;
            </button>
          </div>
        </div>

        {/* Total Penalties / Slashes */}
        <div className="p-5 bg-white border border-gray-100 rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Slashed</span>
            <div className="p-1.5 bg-red-50 border border-red-100 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-red-600">
              {totalSlashed ? Number(formatUnits(totalSlashed as bigint, 6)).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
            </div>
            <span className="text-[10px] text-gray-400 block mt-1">Audit-recorded penalties</span>
          </div>
        </div>

      </div>

      {/* 2. Operations Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Stake Collateral Form */}
        <div className="p-6 bg-white border border-gray-150 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-gray-900" />
            <h4 className="text-sm font-bold text-gray-900">Deposit Staking Collateral</h4>
          </div>
          <p className="text-xs text-gray-400">
            Stake USDC to activate or replenish your accreditation status. Active verifiers must maintain a minimum of 
            {' '}<span className="font-bold text-gray-900">500.00 USDC</span> at all times to submit verification reports.
          </p>

          <form onSubmit={handleStake} className="space-y-4">
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-[9px] text-gray-400 font-bold uppercase block">Staking Amount</label>
                  <div className="group relative inline-block">
                    <HelpCircle className="w-3 h-3 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" />
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-[10px] rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg leading-normal normal-case font-normal">
                      Amount of USDC to deposit as collateral. Active verifiers must maintain a minimum of 500.00 USDC.
                    </div>
                  </div>
                </div>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="E.g., 500"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="bg-transparent text-lg font-mono font-bold text-gray-900 focus:outline-none w-full"
                />
              </div>
              <span className="text-xs font-mono font-bold text-gray-500">USDC</span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-400 px-1 font-mono">
              <span>Your USDC Balance:</span>
              <span>{usdcBalance ? Number(formatUnits(usdcBalance as bigint, 6)).toFixed(2) : '0.00'} USDC</span>
            </div>

            <button
              type="submit"
              disabled={loadingStep !== 'idle'}
              className="w-full py-3 bg-gray-950 hover:bg-gray-900 text-white font-bold rounded-xl text-xs transition-all duration-300 flex items-center justify-center gap-2"
            >
              {loadingStep === 'approving' && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Approving USDC...</span>
                </>
              )}
              {loadingStep === 'staking' && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Executing Stake...</span>
                </>
              )}
              {loadingStep === 'idle' && (
                <>
                  <ArrowUpCircle className="w-4 h-4" />
                  <span>Stake USDC Collateral</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Withdraw Stake / Freeze Status Form */}
        <div className="p-6 bg-white border border-gray-150 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-900" />
            <h4 className="text-sm font-bold text-gray-900">Withdrawal Lock & Cooldown</h4>
          </div>
          <p className="text-xs text-gray-400">
            To prevent instant exit during potential dispute investigations, all withdrawals require a 
            {' '}<span className="font-bold text-gray-900">7-day freeze period</span> before funds are released.
          </p>

          {/* Active Cooldown Request Info */}
          {pendingWithdrawAmount > 0n && (
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-amber-800 block uppercase">Active Withdrawal Cooldown</span>
                  <div className="text-lg font-mono font-bold text-amber-950">
                    {Number(formatUnits(pendingWithdrawAmount, 6)).toFixed(2)} USDC
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-amber-100 border border-amber-200 text-amber-800 rounded text-[9px] font-bold">
                  Frozen
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-amber-800 border-t border-amber-200/50 pt-2 font-mono">
                <span>Unlock In:</span>
                <span className="font-bold">{timeLeftStr || 'Checking...'}</span>
              </div>

              {/* Finalize Button */}
              {Math.floor(Date.now() / 1000) >= pendingUnlockTime && (
                <button
                  onClick={handleFinalizeWithdraw}
                  disabled={loadingStep !== 'idle'}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm mt-1"
                >
                  {loadingStep === 'finalizing' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>Release & Finalize Withdrawal</span>
                </button>
              )}
            </div>
          )}

          {/* Request Withdraw Input */}
          <form onSubmit={handleRequestWithdraw} className="space-y-4">
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-[9px] text-gray-400 font-bold uppercase block">Withdrawal Request Amount</label>
                  <div className="group relative inline-block">
                    <HelpCircle className="w-3 h-3 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" />
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-[10px] rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg leading-normal normal-case font-normal">
                      Specify the amount of USDC to withdraw. Locked for a 7-day cooldown period.
                    </div>
                  </div>
                </div>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="E.g., 500"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="bg-transparent text-lg font-mono font-bold text-gray-900 focus:outline-none w-full"
                />
              </div>
              <span className="text-xs font-mono font-bold text-gray-500">USDC</span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-400 px-1 font-mono">
              <span>Your Active Stake:</span>
              <span>{stakedAmount ? Number(formatUnits(stakedAmount as bigint, 6)).toFixed(2) : '0.00'} USDC</span>
            </div>

            <button
              type="submit"
              disabled={loadingStep !== 'idle' || !stakedAmount || BigInt(stakedAmount.toString()) === 0n}
              className="w-full py-3 bg-white hover:bg-gray-50 text-gray-900 border border-gray-250 font-bold rounded-xl text-xs transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loadingStep === 'requesting' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Request...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-gray-700" />
                  <span>Initiate Cooldown Request</span>
                </>
              )}
            </button>
          </form>
        </div>

      </div>

      {/* 3. Global Logs / Status Prompts */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-xs font-semibold">
          ⚠️ {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl text-xs font-semibold">
          ✅ {successMsg}
        </div>
      )}

      {txHash && (
        <div className="p-3 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between gap-4 text-xs font-mono text-gray-500">
          <span>Transaction Hash:</span>
          <a
            href={explorerTxUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-600 font-bold hover:underline"
          >
            {truncateAddress(txHash, 8)}
          </a>
        </div>
      )}

      {/* 4. Help & Staking Instructions */}
      <div className="p-5 bg-cyan-50/50 border border-cyan-100/50 rounded-2xl space-y-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4.5 h-4.5 text-cyan-700" />
          <h5 className="text-xs font-bold text-cyan-800 uppercase tracking-wider">Staking System FAQ</h5>
        </div>
        <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-cyan-900/80 font-mono">
          <li>Accreditation validation queries `IVerifierRegistry.isActiveVerifier` on-chain.</li>
          <li>Accrued rewards come from premium verification checks and logistics tracking audits paid by B2B buyers.</li>
          <li>Slashing occurs in cases of fraudulent data claims, executed by the owner or multisig arbitrator council.</li>
          <li>Slashing reduces reputation score by 50 points and sends staked USDC to the treasury/recipients.</li>
        </ul>
      </div>

    </div>
  );
}
