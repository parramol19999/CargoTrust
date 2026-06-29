'use client';

import React, { useState, useEffect } from 'react';
import { useModal } from '@/lib/modals/store';
import { mapRawError } from '@/lib/modals/errorMapper';
import { useAccount } from 'wagmi';
import { Lock, Unlock, Key, Check, X, RefreshCw, Loader2, Send, HelpCircle } from 'lucide-react';
import { decryptKeyWithECDH } from '@/lib/cryptoHelper';
import { useFriendlyMode } from '@/lib/useFriendlyMode';
import ErrorCard from '@/components/ErrorCard';

interface AccessRequest {
  id: string;
  requester: string;
  tokenId: number;
  encryptedKey: string;
  status: string;
  requesterPublicKey: string;
  ownerPublicKey?: string;
  createdAt: string;
}

export default function AccessRequestPanel({ refreshTrigger }: { refreshTrigger?: number }) {
  const { isSimpleMode } = useFriendlyMode();
  const { openModal } = useModal();
  const { address, isConnected } = useAccount();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Requester form state
  const [tokenIdInput, setTokenIdInput] = useState('');
  const [reqLoading, setReqLoading] = useState(false);
  const [reqSuccess, setReqSuccess] = useState('');
  const [reqError, setReqError] = useState('');

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const res = await fetch('/api/privacy/request');
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      fetchRequests();
    }
  }, [address, refreshTrigger]);

  const handleRequestAccess = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setReqSuccess('');
    setReqError('');
    if (!address) {
      setReqError('Connect wallet first.');
      return;
    }
    const tokenId = parseInt(tokenIdInput);
    if (isNaN(tokenId)) {
      setReqError('Invalid Token ID.');
      return;
    }

    setReqLoading(true);
    try {
      // 1. Get/Initialize persistent ECDH keys for this address
      const keyRes = await fetch(`/api/privacy/keys?address=${address}`);
      const keyData = await keyRes.json();
      if (!keyData.success) throw new Error(keyData.error || 'Failed to fetch ECDH keys');

      const requesterPublicKey = keyData.ecdhKeys.publicKey;

      // 2. Submit access request
      const reqRes = await fetch('/api/privacy/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requester: address,
          tokenId,
          requesterPublicKey,
        }),
      });

      const reqData = await reqRes.json();
      if (reqData.success) {
        setReqSuccess(`Access request for batch #${tokenId} successfully submitted!`);
        setTokenIdInput('');
        fetchRequests();
      } else {
        setReqError(reqData.error || 'Submission failed.');
      }
    } catch (err: any) {
      setReqError(err.message || 'Request failed.');
    } finally {
      setReqLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch('/api/privacy/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'Approved' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch('/api/privacy/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'Rejected' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDecryptKey = async (req: AccessRequest) => {
    if (!address) return;
    setActionLoadingId(req.id);
    try {
      const keyRes = await fetch(`/api/privacy/keys?address=${address}`);
      const keyData = await keyRes.json();
      if (!keyData.success) throw new Error('Could not fetch ECDH keys');

      const requesterPrivateKey = keyData.ecdhKeys.privateKey;

      if (!req.ownerPublicKey || !req.encryptedKey) {
        throw new Error('Owner public key or encrypted key is missing');
      }

      const decryptedAesKey = decryptKeyWithECDH(
        req.ownerPublicKey,
        requesterPrivateKey,
        req.encryptedKey
      );

      localStorage.setItem(`crop_key_${req.tokenId}`, decryptedAesKey);

      openModal({
        id: 'decrypt-success-' + req.id,
        type: 'success',
        title: isSimpleMode ? 'Crop Data Unlocked' : 'Decryption Completed',
        description: isSimpleMode 
          ? `Successfully unlocked secure details for batch #${req.tokenId}. You can now view its exact origin and quality stats.`
          : `Successfully decrypted the crop key for batch #${req.tokenId}. Shared secret derived via secp256k1 ECDH. You can now access protected metadata fields.`,
      });

      fetchRequests();
    } catch (err: any) {
      console.error(err);
      const mapped = mapRawError(err);
      openModal({
        id: 'decrypt-error-' + req.id,
        type: 'error',
        title: isSimpleMode ? 'Unlock Failed' : 'Decryption Failed',
        description: mapped.description,
        technicalDetails: mapped.technicalDetails,
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="card-light p-6 text-center text-xs text-gray-400">
        {isSimpleMode 
          ? 'Please sign in with your digital wallet to request or share secure batch data.'
          : 'Please connect your wallet to manage secure data access requests.'}
      </div>
    );
  }

  // Filter requests
  const myRequests = requests.filter(r => r.requester.toLowerCase() === address?.toLowerCase());
  // Simulated incoming requests for testing simplicity
  const incomingRequests = requests.filter(r => r.requester.toLowerCase() !== address?.toLowerCase());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Request Form */}
      <div className="lg:col-span-1 card-light p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-gray-800" />
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              {isSimpleMode ? 'Request Private Crop Details' : 'Request Private Data'}
            </h3>
          </div>
          <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
            {isSimpleMode 
              ? 'Submit a request to the coffee batch owner to grant you access to secure details such as exact coordinates, moisture readings, and origin certificates.'
              : 'Submit your cryptographic public key (ECDH secp256k1) to request data decryption access for crop batch details (origin, coordinates, harvest price).'}
          </p>

          <form onSubmit={handleRequestAccess} className="space-y-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {isSimpleMode ? 'Coffee Batch ID' : 'Crop Token ID'}
                </label>
                <div className="group relative inline-block">
                  <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-650 transition-colors" />
                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-[10px] rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg leading-normal normal-case font-normal font-sans text-center">
                    {isSimpleMode ? 'Enter the unique coffee batch number you want to request information for.' : 'Enter the unique numeric token ID of the crop twin you wish to decrypt.'}
                  </div>
                </div>
              </div>
              <input
                type="text"
                required
                value={tokenIdInput}
                onChange={(e) => setTokenIdInput(e.target.value)}
                placeholder="E.g., 1"
                className="w-full p-3 bg-gray-50 border border-gray-150 rounded-xl text-xs font-mono text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
            </div>

            {reqError && (
              <ErrorCard
                error={reqError}
                onRetry={handleRequestAccess}
              />
            )}
            {reqSuccess && <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-[11px]">{reqSuccess}</div>}

            <button
              type="submit"
              disabled={reqLoading}
              className="w-full py-3 bg-gray-950 hover:bg-gray-900 disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {reqLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isSimpleMode ? 'Request Data Key' : 'Submit ECDH Request'}
            </button>
          </form>
        </div>
      </div>

      {/* Requests Lists */}
      <div className="lg:col-span-2 card-light p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-800" />
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              {isSimpleMode ? 'Data Access Manager' : 'Access Sharing Desk'}
            </h3>
          </div>
          <button onClick={fetchRequests} className="p-1 bg-gray-50 hover:bg-gray-100 rounded text-gray-500">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Outgoing Requests */}
          {/* Outgoing Requests */}
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              {isSimpleMode ? 'My Access Requests' : 'My Requests'}
            </span>
            {myRequests.length === 0 ? (
              <span className="text-[11px] text-gray-400 italic">
                {isSimpleMode ? 'No access requests submitted yet.' : 'No access requests submitted by you.'}
              </span>
            ) : (
              <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                {myRequests.map(req => {
                  const hasKeyInStorage = !!localStorage.getItem(`crop_key_${req.tokenId}`);
                  return (
                    <div key={req.id} className="p-3 bg-gray-50 border border-gray-150 rounded-xl flex items-center justify-between gap-4 text-xs">
                      <div>
                        <span className="font-bold text-gray-900 font-mono">
                          {isSimpleMode ? `Batch #${req.tokenId}` : `Token #${req.tokenId}`}
                        </span>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                          Status:{' '}
                          <span className={`font-bold ${req.status === 'Approved' ? 'text-emerald-600' : req.status === 'Pending' ? 'text-amber-600' : 'text-red-600'}`}>
                            {req.status === 'Approved' ? (isSimpleMode ? 'Granted' : 'Approved') : req.status === 'Pending' ? (isSimpleMode ? 'Pending' : 'Pending') : (isSimpleMode ? 'Denied' : 'Rejected')}
                          </span>
                        </div>
                      </div>
                      
                      {req.status === 'Approved' && (
                        <button
                          onClick={() => handleDecryptKey(req)}
                          disabled={actionLoadingId === req.id || hasKeyInStorage}
                          className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all ${
                            hasKeyInStorage
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default'
                              : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                          }`}
                        >
                          {actionLoadingId === req.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : hasKeyInStorage ? (
                            <>
                              <Unlock className="w-3.5 h-3.5" />
                              {isSimpleMode ? 'Unlocked ✓' : 'Decrypted ✓'}
                            </>
                          ) : (
                            <>
                              <Key className="w-3.5 h-3.5" />
                              {isSimpleMode ? 'Unlock Crop Data' : 'Decrypt Key'}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Incoming Requests */}
          <div className="border-t border-gray-150 pt-4">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              {isSimpleMode ? 'Data Access Approvals' : 'Incoming Data Requests'}
            </span>
            {incomingRequests.length === 0 ? (
              <span className="text-[11px] text-gray-400 italic">
                {isSimpleMode ? 'No incoming requests to approve.' : 'No incoming requests to authorize.'}
              </span>
            ) : (
              <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                {incomingRequests.map(req => (
                  <div key={req.id} className="p-3 bg-gray-50 border border-gray-150 rounded-xl flex items-center justify-between gap-4 text-xs">
                    <div>
                      <span className="font-bold text-gray-900 font-mono">
                        {isSimpleMode ? `Batch #${req.tokenId}` : `Token #${req.tokenId}`}
                      </span>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                        Requester: <span className="font-bold text-gray-700">{req.requester.slice(0, 6)}...{req.requester.slice(-4)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {req.status === 'Pending' ? (
                        <>
                          <button
                            onClick={() => handleApprove(req.id)}
                            disabled={actionLoadingId === req.id}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-150 rounded-lg"
                            title={isSimpleMode ? 'Approve request' : 'Approve & Encrypt Key'}
                          >
                            {actionLoadingId === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            disabled={actionLoadingId === req.id}
                            className="p-1.5 bg-red-50 hover:bg-red-150 text-red-600 border border-red-150 rounded-lg"
                            title={isSimpleMode ? 'Reject request' : 'Reject'}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${req.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                          {req.status === 'Approved' ? (isSimpleMode ? 'Granted' : 'Approved') : (isSimpleMode ? 'Denied' : 'Rejected')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
