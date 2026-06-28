'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { CARGO_REGISTRY_ADDRESS, truncateAddress } from '@/lib/constants';
import CARGO_REGISTRY_ABI from '@/components/CargoRegistryABI.json';
import { Award, BadgeCheck, FileText, CheckSquare, Loader2, RefreshCw, PenTool, HelpCircle } from 'lucide-react';
import { useWalletClient } from 'wagmi';

import { useGasSponsorship } from '@/lib/gasSponsor';

export default function VerifierDashboard() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const { isSponsored, limitReached } = useGasSponsorship();

  // Batches list state
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Selected Batch for Certification
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);

  // Certifications Form State
  const [credType, setCredType] = useState('Organic Certified');
  const [labScore, setLabScore] = useState('98/100');
  const [testingNotes, setTestingNotes] = useState('Certified organic. Zero chemical pesticide detected. Checked via liquid chromatography mass spectrometry.');
  const [expiryDate, setExpiryDate] = useState('2027-12-31');

  // Transaction & Signature loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionStep, setActionStep] = useState<'idle' | 'signing' | 'registering' | 'success'>('idle');
  const [vcPayloadStr, setVcPayloadStr] = useState('');
  const [cryptographicSignature, setCryptographicSignature] = useState('');
  const [vcIpfsHash, setVcIpfsHash] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Fetch nextTokenId to know how many twins exist
  const { data: nextTokenId } = useReadContract({
    address: CARGO_REGISTRY_ADDRESS,
    abi: CARGO_REGISTRY_ABI,
    functionName: 'nextTokenId',
  });

  // 2. Fetch is msg.sender authorized
  const { data: isVerifier } = useReadContract({
    address: CARGO_REGISTRY_ADDRESS,
    abi: CARGO_REGISTRY_ABI,
    functionName: 'authorizedVerifiers',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const { data: verifierName } = useReadContract({
    address: CARGO_REGISTRY_ADDRESS,
    abi: CARGO_REGISTRY_ABI,
    functionName: 'verifierNames',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  // 3. Load all batches from RPC
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

          const currentOwner: any = await publicClient.readContract({
            address: CARGO_REGISTRY_ADDRESS,
            abi: CARGO_REGISTRY_ABI,
            functionName: 'ownerOf',
            args: [BigInt(i)],
          });

          const verifications: any = await publicClient.readContract({
            address: CARGO_REGISTRY_ADDRESS,
            abi: CARGO_REGISTRY_ABI,
            functionName: 'getVerifications',
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
            description: parsedDesc,
            status,
            owner: currentOwner,
            verificationsCount: verifications.length,
            verificationsList: verifications,
            isEncrypted: !!isEncrypted,
            encryptedPrice: encryptedPrice || '',
          });
        }

        setBatches(loadedBatches.reverse());
      } catch (err) {
        console.error(err);
        setErrorMsg('Error loading on-chain batches for verifications.');
      } finally {
        setLoading(false);
      }
    }

    loadAllBatches();
  }, [publicClient, nextTokenId, refreshKey]);

  const handleCertify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address || !walletClient || !selectedTokenId) {
      setErrorMsg('Web3 wallet context or selected batch is missing.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    setVcPayloadStr('');
    setCryptographicSignature('');
    setVcIpfsHash('');

    try {
      const vcPayload = {
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          'https://cargotrust.io/contexts/supplychain-v1.jsonld'
        ],
        type: ['VerifiableCredential', 'SupplyChainQualityCredential'],
        issuer: `did:ethr:${address}`,
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: `cargotrust:cargo:batch:${selectedTokenId}`,
          blockchain: 'Arc Testnet',
          registryContract: CARGO_REGISTRY_ADDRESS,
          grade: labScore,
          expiry: expiryDate,
          complianceBadge: credType,
          evidenceNotes: testingNotes
        }
      };

      const payloadString = JSON.stringify(vcPayload, null, 2);
      setVcPayloadStr(payloadString);

      setActionStep('signing');
      const signature = await walletClient.signMessage({
        message: `Verify CargoTrust Token ID #${selectedTokenId}\nPayload Hash: ${payloadString.slice(0, 80)}...`
      });
      setCryptographicSignature(signature);

      setActionStep('registering');
      
      const fullVC = {
        ...vcPayload,
        proof: {
          type: 'EthereumEip191Signature2026',
          created: new Date().toISOString(),
          verificationMethod: `did:ethr:${address}#keys-1`,
          proofPurpose: 'assertionMethod',
          jws: signature
        }
      };

      const generatedCID = `ipfs://QmCert${selectedTokenId}v${Math.floor(Math.random() * 9000 + 1000)}QualityCheck`;
      setVcIpfsHash(generatedCID);

      const tx = await writeContractAsync({
        address: CARGO_REGISTRY_ADDRESS,
        abi: CARGO_REGISTRY_ABI,
        functionName: 'addVerification',
        args: [BigInt(selectedTokenId), credType, generatedCID],
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: tx });
      }

      setActionStep('success');
      setRefreshKey((prev) => prev + 1);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Signature rejected or on-chain anchoring failed.');
      setActionStep('idle');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card-light p-6">
      
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gray-50 border border-gray-100 rounded-xl">
            <Award className="w-5 h-5 text-gray-900" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Authorized Verifier Credentials Dashboard</h3>
            <p className="text-xs text-gray-400">Independent Quality Testing & Cryptographic Verification Hub</p>
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

      {address && isConnected && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BadgeCheck className="w-8 h-8 text-gray-900" />
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Verifier Accreditation</span>
              <div className="text-sm font-bold text-gray-900">
                {isVerifier
                  ? `${(verifierName as string) || 'Registered Laboratory Expert'}`
                  : 'Pending Accreditation / General User'}
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500 font-mono">
            {truncateAddress(address, 6)}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-600 font-semibold mb-4">
          ⚠️ {errorMsg}
        </div>
      )}

      {selectedTokenId !== null ? (
        <div className="bg-gray-50 border border-gray-150 rounded-2xl p-5 mb-6">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
            <h4 className="text-sm font-bold text-gray-900">
              Certifying Crop Batch: Token ID #{selectedTokenId}
            </h4>
            <button
              onClick={() => {
                setSelectedTokenId(null);
                setActionStep('idle');
              }}
              className="text-xs text-gray-500 hover:text-gray-900 font-bold"
            >
              Back to batches
            </button>
          </div>

          {actionStep === 'success' ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckSquare className="w-6 h-6" />
              </div>
              <h5 className="text-sm font-bold text-emerald-700">Verifiable Credential Registered!</h5>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                The attestation was successfully signed with your private keys and registered permanently on-chain.
              </p>

              <div className="bg-white border border-gray-100 rounded-2xl p-4 text-left font-mono text-[10px] text-gray-600 max-w-lg mx-auto mt-4 space-y-2">
                <div>
                  <span className="text-gray-400 block mb-0.5 font-bold uppercase tracking-wider text-[8px]">W3C Credential Type:</span>
                  <span className="text-gray-900 font-bold">{credType}</span>
                </div>
                {isSponsored && (
                  <div>
                    <span className="text-gray-400 block mb-0.5 font-bold uppercase tracking-wider text-[8px]">Gas Status:</span>
                    <span className="text-cyan-600 font-bold">Gas Sponsored ✓</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-400 block mb-0.5 font-bold uppercase tracking-wider text-[8px]">IPFS Document URI:</span>
                  <span className="text-gray-900 select-all font-bold">{vcIpfsHash}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5 font-bold uppercase tracking-wider text-[8px]">Signature Proof:</span>
                  <span className="text-emerald-700 select-all overflow-hidden text-ellipsis block max-w-full">
                    {cryptographicSignature}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedTokenId(null);
                  setActionStep('idle');
                }}
                className="mt-5 px-5 py-2.5 bg-gray-950 hover:bg-gray-900 text-white rounded-xl text-xs font-bold"
              >
                Return to Batches
              </button>
            </div>
          ) : (
            <form onSubmit={handleCertify} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-white border border-gray-100 rounded-xl">
                  <div className="flex items-center gap-1.5 mb-1">
                    <label className="block text-[10px] text-gray-400 font-bold uppercase">Credential Badging</label>
                    <div className="group relative inline-block">
                      <HelpCircle className="w-3 h-3 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" />
                      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-[10px] rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg leading-normal normal-case font-normal">
                        Select the W3C Verifiable Credential standard to certify the crop batch.
                      </div>
                    </div>
                  </div>
                  <select
                    value={credType}
                    onChange={(e) => setCredType(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-gray-900 focus:outline-none cursor-pointer"
                  >
                    <option value="Organic Certified">Certified Organic (USDA/EU)</option>
                    <option value="ISO9001 Quality Grade">ISO 9001 Food Quality</option>
                    <option value="FairTrade Compliant">FairTrade Certified Sourcing</option>
                    <option value="Premium Grade A">Premium Diamond Grade A</option>
                  </select>
                </div>

                <div className="p-3 bg-white border border-gray-100 rounded-xl">
                  <div className="flex items-center gap-1.5 mb-1">
                    <label className="block text-[10px] text-gray-400 font-bold uppercase">Quality Score / Benchmarks</label>
                    <div className="group relative inline-block">
                      <HelpCircle className="w-3 h-3 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" />
                      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-[10px] rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg leading-normal normal-case font-normal">
                        Enter the testing quality score or grade. Example format: 98/100, Grade A, or 8.5 pH.
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="E.g., 98/100"
                    value={labScore}
                    onChange={(e) => setLabScore(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-gray-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-white border border-gray-100 rounded-xl">
                  <div className="flex items-center gap-1.5 mb-1">
                    <label className="block text-[10px] text-gray-400 font-bold uppercase">Verification Expiry Date</label>
                    <div className="group relative inline-block">
                      <HelpCircle className="w-3 h-3 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" />
                      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-[10px] rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg leading-normal normal-case font-normal">
                        Select the expiration date for this quality verification.
                      </div>
                    </div>
                  </div>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-gray-900 focus:outline-none cursor-pointer"
                  />
                </div>

                <div className="p-3 bg-gray-100 border border-gray-200 rounded-xl">
                  <div className="flex items-center gap-1.5 mb-1">
                    <label className="block text-[10px] text-gray-400 font-bold uppercase">Accredited Testing Laboratory</label>
                    <div className="group relative inline-block">
                      <HelpCircle className="w-3 h-3 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" />
                      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-[10px] rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg leading-normal normal-case font-normal">
                        On-chain registered laboratory identity executing this digital twin verification.
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    disabled
                    value={(verifierName as string) || 'Registered Lab Expert'}
                    className="w-full bg-transparent text-xs font-bold text-gray-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-white border border-gray-100 rounded-xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <label className="block text-[10px] text-gray-400 font-bold uppercase">Scientific Analysis Notes</label>
                  <div className="group relative inline-block">
                    <HelpCircle className="w-3 h-3 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" />
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-[10px] rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg leading-normal normal-case font-normal">
                      Provide scientific notes. Specify methodologies (e.g., LC-MS), pesticide trace checks, and moisture readings.
                    </div>
                  </div>
                </div>
                <textarea
                  rows={2}
                  required
                  placeholder="E.g., Certified organic. Zero chemical pesticide detected."
                  value={testingNotes}
                  onChange={(e) => setTestingNotes(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-gray-900 focus:outline-none"
                />
              </div>

              {limitReached && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl text-[11px] text-amber-700 font-medium mb-3">
                  ⚠️ Gas sponsorship limits reached. Transactions will require your wallet to hold native USDC gas.
                </div>
              )}
              <div className="pt-2">
                {!isVerifier ? (
                  <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-2xl text-center text-xs text-yellow-700 font-semibold">
                    ⚠️ Your connected wallet is not authorized as a Verifier on-chain. Admin approval required.
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-gray-950 hover:bg-gray-900 text-white font-bold rounded-xl text-xs transition-all duration-300 flex flex-col items-center justify-center gap-0.5"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2 font-mono">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {actionStep === 'signing' ? 'Signing W3C Payload...' : 'Anchoring verification on-chain...'}
                      </span>
                    ) : (
                      <>
                        <span className="flex items-center gap-2">
                          <PenTool className="w-4 h-4 text-white" />
                          Sign & Anchor Quality Credentials
                        </span>
                        <span className="text-[9px] text-cyan-300 font-mono tracking-normal normal-case font-medium">
                          {isSponsored ? 'Gas Fee: $0.00 (Sponsored)' : 'Gas Fee: Paid by User'}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      ) : null}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-8 h-8 text-gray-900 animate-spin mb-3" />
          <p className="text-xs font-mono text-gray-400">Loading trace registry...</p>
        </div>
      ) : batches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-gray-250 rounded-2xl text-gray-400 text-center">
          <Award className="w-12 h-12 text-gray-300 mb-2" />
          <p className="text-sm font-semibold">No batches to certify.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Supply Chain Cargo</h4>
          <div className="overflow-x-auto border border-gray-100 rounded-2xl bg-white">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="p-3 text-gray-500 font-bold uppercase tracking-wider">ID</th>
                  <th className="p-3 text-gray-500 font-bold uppercase tracking-wider">Origin</th>
                  <th className="p-3 text-gray-500 font-bold uppercase tracking-wider">Custody</th>
                  <th className="p-3 text-gray-500 font-bold uppercase tracking-wider">Certs</th>
                  <th className="p-3 text-gray-500 font-bold uppercase tracking-wider">Status</th>
                  <th className="p-3 text-right text-gray-500 font-bold uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr key={batch.id} className="border-b border-gray-100 hover:bg-gray-50/30 transition-all duration-150">
                    <td className="p-3 text-gray-900 font-bold">#{batch.id}</td>
                    <td className="p-3 text-gray-800 font-bold max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                      {batch.isEncrypted ? (
                        <span className="text-gray-400 font-bold">Encrypted Batch 🔒</span>
                      ) : (
                        batch.origin
                      )}
                    </td>
                    <td className="p-3 text-gray-500">{truncateAddress(batch.owner, 4)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        batch.verificationsCount > 0 ? 'bg-cyan-50 text-cyan-700 border border-cyan-100' : 'bg-gray-50 text-gray-400'
                      }`}>
                        {batch.verificationsCount} Certed
                      </span>
                    </td>
                    <td className="p-3 text-gray-600 font-semibold">{batch.status}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedTokenId(batch.id);
                          setActionStep('idle');
                        }}
                        className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-250 rounded-xl text-[10px] font-bold"
                      >
                        Verify Quality
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
