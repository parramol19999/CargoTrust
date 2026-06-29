'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { USDC_ADDRESS, USDC_ABI, CARGO_REGISTRY_ADDRESS, truncateAddress } from '@/lib/constants';
import CARGO_REGISTRY_ABI from '@/components/CargoRegistryABI.json';
import { formatUnits, parseUnits } from 'viem';
import { X, Layers, Plus, Trash2, ShieldAlert, Loader2, CheckCircle2, AlertCircle, Info, HelpCircle } from 'lucide-react';
import { useFriendlyMode } from '@/lib/useFriendlyMode';
import ErrorCard from '@/components/ErrorCard';

interface BatchSplitterProps {
  batch: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BatchSplitter({ batch, onClose, onSuccess }: BatchSplitterProps) {
  const { isSimpleMode } = useFriendlyMode();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  // Parent weight defaults to 100 if none defined or zero
  const parentWeight = batch.weight ? Number(batch.weight.toString()) : 100;

  // Split Weights State
  const [splits, setSplits] = useState<string[]>(['60', '40']);

  // Transaction States
  const [loadingStep, setLoadingStep] = useState<'idle' | 'approving' | 'splitting' | 'success'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [txHash, setTxHash] = useState('');

  // ─── Smart Contract Reads ───
  
  // 1. USDC Balance of the user
  const { data: usdcBalance, refetch: refetchBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // 2. USDC Allowance for the CargoRegistry
  const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: address ? [address, CARGO_REGISTRY_ADDRESS] : undefined,
    query: { enabled: !!address },
  });

  // ─── Calculations ───
  const MINT_FEE_PER_CHILD = 100000n; // 0.10 USDC
  const totalMintFeeRequired = MINT_FEE_PER_CHILD * BigInt(splits.length);
  const totalMintFeeFormatted = (Number(totalMintFeeRequired) / 1000000).toFixed(2);

  const sumOfSplits = splits.reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
  const isSumValid = sumOfSplits === parentWeight;

  const userUsdcBalanceFormatted = usdcBalance 
    ? Number(formatUnits(usdcBalance as bigint, 6)).toLocaleString('en-US', { minimumFractionDigits: 2 })
    : '0.00';

  const userUsdcAllowance = usdcAllowance ? BigInt(usdcAllowance.toString()) : 0n;
  const isAllowanceSufficient = userUsdcAllowance >= totalMintFeeRequired;

  // Functions to adjust splits list
  const handleAddSplit = () => {
    if (splits.length >= 10) return; // limit to max 10 children
    const newSplits = [...splits, '0'];
    setSplits(newSplits);
  };

  const handleRemoveSplit = (index: number) => {
    if (splits.length <= 2) return; // must split into at least 2 children
    const newSplits = splits.filter((_, idx) => idx !== index);
    setSplits(newSplits);
  };

  const handleSplitValueChange = (index: number, val: string) => {
    const newSplits = [...splits];
    newSplits[index] = val;
    setSplits(newSplits);
  };

  // Perform split execution
  const executeSplit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isConnected || !address) {
      setErrorMsg('Wallet not connected.');
      return;
    }
    if (!isSumValid) {
      setErrorMsg(`The sum of child split proportions (${sumOfSplits}) must exactly equal the parent batch weight (${parentWeight}).`);
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Approve USDC if allowance is too low
      if (!isAllowanceSufficient) {
        setLoadingStep('approving');
        const approveTx = await writeContractAsync({
          address: USDC_ADDRESS,
          abi: USDC_ABI,
          functionName: 'approve',
          args: [CARGO_REGISTRY_ADDRESS, totalMintFeeRequired * 2n], // approve 2x for safety
        });
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: approveTx });
        }
        await refetchAllowance();
      }

      // 2. Perform the Split
      setLoadingStep('splitting');
      
      const childWeights = splits.map(s => BigInt(Math.floor(parseFloat(s))));
      
      const splitTx = await writeContractAsync({
        address: CARGO_REGISTRY_ADDRESS,
        abi: CARGO_REGISTRY_ABI,
        functionName: 'splitCargo',
        args: [BigInt(batch.id), childWeights],
      });

      setTxHash(splitTx);
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: splitTx });
      }

      setSuccessMsg(
        isSimpleMode
          ? `Batch divided successfully! ${splits.length} new sub-batches created.`
          : `Batch split completed successfully! ${splits.length} child crop tokens minted.`
      );
      setLoadingStep('success');
      
      await refetchBalance();
      await refetchAllowance();

      // Callback success after 2 seconds delay
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || (isSimpleMode ? 'Failed to divide batch.' : 'Split transaction failed.'));
      setLoadingStep('idle');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white border border-gray-150 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-600" />
            <h3 className="text-lg font-bold text-gray-900">
              {isSimpleMode ? 'Divide Coffee Batch' : 'Split Crop Batch Twin'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-655 rounded-lg hover:bg-gray-50 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={executeSplit} className="p-6 space-y-6">
          
          {/* Parent Summary Box */}
          <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-2 text-xs">
            <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">
              {isSimpleMode ? 'Original Batch Info' : 'Parent Token Info'}
            </span>
            <div className="flex justify-between font-mono">
              <span className="text-gray-500">{isSimpleMode ? 'Batch ID:' : 'Token ID:'}</span>
              <span className="text-gray-900 font-bold">#{batch.id}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-gray-500">{isSimpleMode ? 'Total Weight:' : 'Total Batch Weight:'}</span>
              <span className="text-gray-900 font-bold">{parentWeight} {isSimpleMode ? 'lbs' : 'units'}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-gray-500">Origin Sourcing:</span>
              <span className="text-gray-700 truncate max-w-[220px]">{batch.origin}</span>
            </div>
          </div>

          {/* Child Split Items */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  {isSimpleMode ? 'New Sub-Batches Setup' : 'Child Splits Setup'}
                </span>
                <div className="group relative inline-block">
                  <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-650 transition-colors" />
                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-[10px] rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg leading-normal normal-case font-normal font-sans text-center">
                    {isSimpleMode 
                      ? 'Enter the desired weight for each sub-batch. The total must equal the original batch weight.' 
                      : 'Enter the desired weight for each sub-batch child token. The total must sum to the parent weight.'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddSplit}
                disabled={splits.length >= 10}
                className="text-[10px] text-cyan-600 hover:text-cyan-700 font-bold flex items-center gap-0.5"
              >
                <Plus className="w-3.5 h-3.5" />
                {isSimpleMode ? 'Add Sub-Batch' : 'Add Split Token'}
              </button>
            </div>

            <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
              {splits.map((split, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-gray-50 border border-gray-100 p-2.5 rounded-xl">
                  <span className="text-xs font-mono font-bold text-gray-400 w-8">#{idx + 1}</span>
                  <div className="flex-grow flex items-center bg-white border border-gray-150 px-3 py-1.5 rounded-lg">
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="E.g., 50"
                      value={split}
                      onChange={(e) => handleSplitValueChange(idx, e.target.value)}
                      className="w-full bg-transparent text-sm font-mono font-bold text-gray-900 focus:outline-none"
                    />
                    <span className="text-xs text-gray-400 ml-1">{isSimpleMode ? 'lbs' : 'units'}</span>
                  </div>
                  <button
                    type="button"
                    disabled={splits.length <= 2}
                    onClick={() => handleRemoveSplit(idx)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-gray-100 transition-all disabled:opacity-40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Validations & Proportions */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs px-1">
              <span className="text-gray-500 font-medium">
                {isSimpleMode ? 'Sub-Batches Sum:' : 'Split Proportions Sum:'}
              </span>
              <span className={`font-mono font-bold ${isSumValid ? 'text-emerald-600' : 'text-red-500'}`}>
                {sumOfSplits} / {parentWeight} {isSimpleMode ? 'lbs' : 'units'}
              </span>
            </div>

            {/* Visual alert */}
            {isSumValid ? (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-[11px] text-emerald-800 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  {isSimpleMode ? 'Sub-batch weights match exactly!' : 'Split proportions match exactly! Batch splitting is fully aligned.'}
                </span>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-2 text-[11px] text-amber-800 font-medium animate-pulse">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  {isSimpleMode 
                    ? `Sum of sub-batches must equal the original weight (${parentWeight} lbs).` 
                    : `Sum of split values must equal the parent's weight (${parentWeight} units).`}
                </span>
              </div>
            )}
          </div>

          {/* Circle Mint Fee Pricing Table */}
          <div className="p-4 bg-cyan-50/50 border border-cyan-100/30 rounded-2xl space-y-3">
            <div className="flex items-center gap-1.5 text-cyan-800">
              <Info className="w-4 h-4 text-cyan-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {isSimpleMode ? 'System Fees' : 'Circle stablecoin fees'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-cyan-900/80">
              <div>{isSimpleMode ? 'Fee per sub-batch:' : 'USDC Fee per child:'}</div>
              <div className="text-right font-bold">0.10 USDC</div>
              <div>Estimated Total Fee:</div>
              <div className="text-right font-bold text-gray-900">{totalMintFeeFormatted} USDC</div>
            </div>

            <div className="border-t border-cyan-100/60 pt-2 flex justify-between text-[10px] font-mono text-cyan-800/80">
              <span>{isSimpleMode ? 'Your Dollar Balance:' : 'Your USDC Balance:'}</span>
              <span className="font-bold">{userUsdcBalanceFormatted} USDC</span>
            </div>
          </div>

          {/* Transaction error displays */}
          {errorMsg && (
            <ErrorCard
              error={errorMsg}
              onRetry={executeSplit}
            />
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-105 rounded-xl text-xs font-semibold text-emerald-800">
              ✅ {successMsg}
            </div>
          )}

          {txHash && (
            <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 px-1">
              <span>{isSimpleMode ? 'Transaction ID:' : 'Transaction hash:'}</span>
              <span className="font-bold text-gray-900 select-all">{truncateAddress(txHash, 8)}</span>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={!isSumValid || loadingStep === 'splitting' || loadingStep === 'approving' || loadingStep === 'success'}
            className="w-full py-3.5 bg-gray-950 hover:bg-gray-900 text-white font-bold rounded-2xl text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow"
          >
            {loadingStep === 'approving' && (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isSimpleMode ? 'Approving Fee...' : 'Approving USDC...'}</span>
              </>
            )}
            {loadingStep === 'splitting' && (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isSimpleMode ? 'Dividing Batch...' : 'Executing Batch Split...'}</span>
              </>
            )}
            {loadingStep === 'idle' && (
              <>
                <Layers className="w-4 h-4" />
                <span>{isSimpleMode ? 'Confirm & Divide Batch' : 'Approve & Split Batch'}</span>
              </>
            )}
            {loadingStep === 'success' && (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSimpleMode ? 'Successfully Divided!' : 'Splitting Success!'}</span>
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  );
}
