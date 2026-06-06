import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Webhook, 
  Copy, 
  Plus, 
  Trash, 
  Check, 
  AlertCircle, 
  ExternalLink, 
  Globe, 
  RefreshCw, 
  Play, 
  Lock, 
  ShieldAlert,
  Cpu
} from 'lucide-react';

interface ApiKey {
  id: string;
  rawKey?: string;
  hashedKey: string;
  userId: string;
  active: boolean;
}

interface Webhook {
  id: string;
  targetUrl: string;
  events: string[];
  active: boolean;
  secret: string;
}

export default function DeveloperConsole({ userAddress }: { userAddress: string }) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  
  // Webhook form state
  const [targetUrl, setTargetUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['CargoPurchased', 'CargoVerified']);
  
  // Loading states
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [loadingWebhooks, setLoadingWebhooks] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Curl sandbox states
  const [sandboxTokenId, setSandboxTokenId] = useState('1');
  const [sandboxOrigin, setSandboxOrigin] = useState('Loire Valley, France');

  useEffect(() => {
    fetchKeys();
    fetchWebhooks();
  }, []);

  const fetchKeys = async () => {
    setLoadingKeys(true);
    try {
      const res = await fetch('/api/developer/keys');
      const data = await res.json();
      if (data.success) {
        setKeys(data.keys);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingKeys(false);
    }
  };

  const fetchWebhooks = async () => {
    setLoadingWebhooks(true);
    try {
      const res = await fetch('/api/developer/webhooks');
      const data = await res.json();
      if (data.success) {
        setWebhooks(data.webhooks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWebhooks(false);
    }
  };

  const handleCreateKey = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    setNewKey(null);
    try {
      const res = await fetch('/api/developer/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userAddress || 'anonymous' })
      });
      const data = await res.json();
      if (data.success) {
        setNewKey(data.key.rawKey);
        setSuccessMsg('API Key successfully generated!');
        fetchKeys();
      } else {
        setErrorMsg(data.error || 'Failed to create key.');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleKey = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch('/api/developer/keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !currentActive })
      });
      const data = await res.json();
      if (data.success) {
        fetchKeys();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Are you sure you want to permanently revoke this API Key?')) return;
    try {
      const res = await fetch(`/api/developer/keys?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('API Key successfully revoked.');
        fetchKeys();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl.startsWith('https://')) {
      setErrorMsg('Target URL must use HTTPS to guarantee webhook transmission security.');
      return;
    }
    if (selectedEvents.length === 0) {
      setErrorMsg('Please select at least one event type to dispatch.');
      return;
    }

    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/developer/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl, events: selectedEvents })
      });
      const data = await res.json();
      if (data.success) {
        setTargetUrl('');
        setSuccessMsg('Webhook endpoint successfully registered!');
        fetchWebhooks();
      } else {
        setErrorMsg(data.error || 'Failed to register webhook.');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleWebhook = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch('/api/developer/webhooks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !currentActive })
      });
      const data = await res.json();
      if (data.success) {
        fetchWebhooks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to remove this webhook endpoint?')) return;
    try {
      const res = await fetch(`/api/developer/webhooks?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Webhook endpoint successfully removed.');
        fetchWebhooks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleEvent = (event: string) => {
    if (selectedEvents.includes(event)) {
      setSelectedEvents(selectedEvents.filter((e) => e !== event));
    } else {
      setSelectedEvents([...selectedEvents, event]);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const activeKeyForSandbox = keys.find(k => k.active)?.hashedKey || 'cg_live_your_active_api_key_here';

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-1 text-white">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-teal-900/40 via-purple-950/30 to-indigo-950/40 border border-teal-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl -ml-20 -mb-20"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-teal-400 mb-1 font-semibold tracking-wider text-xs uppercase">
              <Cpu className="w-4 h-4 animate-pulse" />
              <span>Machine-to-Machine Integration</span>
            </div>
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-indigo-200">
              Enterprise ERP Gateway
            </h2>
            <p className="text-gray-400 mt-2 text-sm max-w-2xl leading-relaxed">
              Generate secure API keys to connect ERP platforms (SAP, NetSuite) programmatically. Enforce real-time telemetry, automated split mechanics, and signed webhooks directly to your endpoint.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 bg-teal-950/50 border border-teal-500/30 rounded-full text-teal-300 font-mono text-xs flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
              Gateway Port: 3001
            </span>
          </div>
        </div>
      </div>

      {/* Global alert notifications */}
      {errorMsg && (
        <div className="bg-red-950/40 border border-red-500/40 text-red-200 p-4 rounded-xl flex items-start gap-3 text-sm animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Security Alert</p>
            <p className="text-gray-300 mt-1">{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-300 font-bold">×</button>
        </div>
      )}

      {successMsg && (
        <div className="bg-teal-950/40 border border-teal-500/40 text-teal-200 p-4 rounded-xl flex items-start gap-3 text-sm animate-fadeIn">
          <Check className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Operation Completed</p>
            <p className="text-gray-300 mt-1">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-teal-400 hover:text-teal-300 font-bold">×</button>
        </div>
      )}

      {/* Main Console Split Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: API Keys & Webhook list (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* API Keys Management */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-teal-500/20 to-teal-500/5 rounded-xl border border-teal-500/20 text-teal-400">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">API Access Tokens</h3>
                  <p className="text-xs text-gray-400">Credentials for server-to-server operations</p>
                </div>
              </div>
              <button
                onClick={handleCreateKey}
                disabled={actionLoading}
                className="px-4 py-2 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl text-sm flex items-center gap-2 transition-all duration-200 shadow-md shadow-teal-950/30"
              >
                <Plus className="w-4 h-4" />
                <span>Generate Key</span>
              </button>
            </div>

            {/* Displaying raw key only once after generation */}
            {newKey && (
              <div className="mb-6 bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/30 p-5 rounded-xl relative overflow-hidden">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-bold text-amber-300 text-sm">Save your API Access Token!</h4>
                    <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                      For security reasons, this token will only be shown to you once. Copy it now and store it in a secure password manager. Hashed matching is enforced on-chain.
                    </p>
                    <div className="mt-3 flex items-center bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 font-mono text-sm">
                      <span className="text-amber-200 flex-1 overflow-x-auto whitespace-nowrap scrollbar-none mr-2">
                        {newKey}
                      </span>
                      <button
                        onClick={() => copyToClipboard(newKey, 'newkey')}
                        className="p-1.5 hover:bg-slate-800 rounded text-gray-400 hover:text-teal-300 transition-colors"
                        title="Copy to Clipboard"
                      >
                        {copiedText === 'newkey' ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Keys Table list */}
            {loadingKeys ? (
              <div className="py-10 text-center text-gray-500 text-sm flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
                <span>Loading active credentials...</span>
              </div>
            ) : keys.length === 0 ? (
              <div className="py-12 border-2 border-dashed border-slate-800 rounded-xl text-center">
                <Lock className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm font-semibold">No active API keys found</p>
                <p className="text-gray-500 text-xs mt-1">Generate a key above to configure automated B2B executions.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Key ID</th>
                      <th className="py-3 px-4">SHA-256 Hash Signature</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {keys.map((key) => (
                      <tr key={key.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-4 px-4 font-mono text-xs text-gray-300">
                          {key.id}
                        </td>
                        <td className="py-4 px-4 font-mono text-xs text-gray-500 max-w-[200px] truncate">
                          {key.hashedKey}
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleToggleKey(key.id, key.active)}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              key.active 
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                : 'bg-slate-800 border-slate-700 text-gray-400'
                            }`}
                          >
                            {key.active ? 'Active' : 'Disabled'}
                          </button>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => handleDeleteKey(key.id)}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete / Revoke Token"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Webhook Subscriptions Management */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 rounded-xl border border-indigo-500/20 text-indigo-400">
                <Webhook className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Webhook Subscriptions</h3>
                <p className="text-xs text-gray-400">Real-time callbacks on crop smart contract events</p>
              </div>
            </div>

            {/* Webhooks table list */}
            {loadingWebhooks ? (
              <div className="py-10 text-center text-gray-500 text-sm flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Loading webhook channels...</span>
              </div>
            ) : webhooks.length === 0 ? (
              <div className="py-12 border-2 border-dashed border-slate-800 rounded-xl text-center mb-6">
                <Globe className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm font-semibold">No registered webhook URLs</p>
                <p className="text-gray-500 text-xs mt-1">Configure an HTTPS target to receive instant event dispatches.</p>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                {webhooks.map((hook) => (
                  <div key={hook.id} className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-teal-400">ID: {hook.id}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                            hook.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-gray-500'
                          }`}>
                            {hook.active ? 'Active' : 'Paused'}
                          </span>
                        </div>
                        <p className="font-mono text-sm text-gray-200 break-all">{hook.targetUrl}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleWebhook(hook.id, hook.active)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium rounded-lg text-gray-300 transition-colors"
                        >
                          {hook.active ? 'Pause' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteWebhook(hook.id)}
                          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {hook.events.map((e) => (
                        <span key={e} className="px-2 py-0.5 bg-indigo-950/40 border border-indigo-500/20 rounded-md text-xs text-indigo-300">
                          {e}
                        </span>
                      ))}
                    </div>

                    <div className="border-t border-slate-800/80 pt-2 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-500/70" />
                        <span>Payload signing secret:</span>
                        <code className="bg-slate-950 border border-slate-900 px-1.5 py-0.5 rounded font-mono text-gray-400">
                          {hook.secret}
                        </code>
                      </div>
                      <button
                        onClick={() => copyToClipboard(hook.secret, `whsec_${hook.id}`)}
                        className="text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1"
                      >
                        {copiedText === `whsec_${hook.id}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy secret</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Create Webhook Form */}
            <form onSubmit={handleCreateWebhook} className="bg-slate-950/60 border border-slate-850 p-5 rounded-xl space-y-4">
              <h4 className="text-sm font-bold text-gray-200">Register Webhook Endpoint</h4>
              
              <div className="space-y-1">
                <label className="text-xs text-gray-400 block font-medium">Target HTTPS Endpoint</label>
                <div className="flex">
                  <span className="px-3 bg-slate-900 border border-r-0 border-slate-800 rounded-l-xl flex items-center text-xs text-gray-500 font-mono">
                    https://
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="yourdomain.com/webhooks/cargotrust"
                    value={targetUrl.replace(/^https:\/\//i, '')}
                    onChange={(e) => setTargetUrl('https://' + e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-r-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block font-medium mb-2">Subscribe to Events</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['CargoMinted', 'CargoPurchased', 'CargoVerified', 'StatusUpdated'].map((evt) => {
                    const isSelected = selectedEvents.includes(evt);
                    return (
                      <button
                        key={evt}
                        type="button"
                        onClick={() => toggleEvent(evt)}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold text-center border transition-all ${
                          isSelected 
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' 
                            : 'bg-slate-900 border-slate-800 text-gray-500 hover:border-slate-700'
                        }`}
                      >
                        {evt}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all"
                >
                  Register Endpoint
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right column: Sandbox/CURL simulator (4 cols) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Integration sandbox details */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
            
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-teal-400" />
              <span>Sandbox Integration</span>
            </h3>
            
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Integrate with NestJS gateway endpoints using the active API keys. Send transaction payloads programmatically to perform write operations on Arc Testnet.
            </p>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 uppercase font-semibold">Gateway RPC Server</label>
                <code className="block bg-slate-950 px-3 py-2 border border-slate-850 rounded-xl text-xs font-mono text-teal-400">
                  http://localhost:3001
                </code>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 uppercase font-semibold">HTTP Headers required</label>
                <div className="bg-slate-950 p-3 border border-slate-850 rounded-xl text-xs font-mono text-gray-300 space-y-1">
                  <div>x-api-key: <span className="text-teal-400">cg_live_...</span></div>
                  <div>Content-Type: application/json</div>
                </div>
              </div>

              {/* API Endpoints Catalog */}
              <div className="border-t border-slate-800/80 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Gateway REST endpoints</h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono bg-slate-950/60 p-2 rounded-lg border border-slate-900">
                    <span className="text-emerald-400 font-bold">POST</span>
                    <span className="text-gray-300 flex-1 text-right">/api/v1/batches</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono bg-slate-950/60 p-2 rounded-lg border border-slate-900">
                    <span className="text-indigo-400 font-bold">GET</span>
                    <span className="text-gray-300 flex-1 text-right">/api/v1/batches?tokenId=:id</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono bg-slate-950/60 p-2 rounded-lg border border-slate-900">
                    <span className="text-emerald-400 font-bold">POST</span>
                    <span className="text-gray-300 flex-1 text-right">/api/v1/batches/split</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono bg-slate-950/60 p-2 rounded-lg border border-slate-900">
                    <span className="text-emerald-400 font-bold">POST</span>
                    <span className="text-gray-300 flex-1 text-right">/api/v1/listings</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono bg-slate-950/60 p-2 rounded-lg border border-slate-900">
                    <span className="text-emerald-400 font-bold">POST</span>
                    <span className="text-gray-300 flex-1 text-right">/api/v1/listings/buy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* cURL Code sample card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">M2M cURL Execution Sample</h3>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Sandbox crop origin:</label>
                <input
                  type="text"
                  value={sandboxOrigin}
                  onChange={(e) => setSandboxOrigin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-teal-500 text-teal-300"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400">Test split parent token ID:</label>
                <input
                  type="text"
                  value={sandboxTokenId}
                  onChange={(e) => setSandboxTokenId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-teal-500 text-teal-300"
                />
              </div>
            </div>

            <div className="relative">
              <pre className="bg-slate-950 p-4 border border-slate-850 rounded-xl font-mono text-[10px] text-gray-300 overflow-x-auto leading-relaxed max-h-60">
{`curl -X POST \\
  http://localhost:3001/api/v1/batches \\
  -H "x-api-key: cg_live_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "origin": "${sandboxOrigin}",
    "harvestDate": ${Math.floor(Date.now() / 1000)},
    "latLong": "47.4116, 0.8932",
    "ipfsMetadata": "ipfs://QmYwAPzWJy...",
    "weight": 120
  }'`}
              </pre>
              <button
                onClick={() => copyToClipboard(`curl -X POST http://localhost:3001/api/v1/batches -H "x-api-key: cg_live_your_api_key" -H "Content-Type: application/json" -d '{"origin": "${sandboxOrigin}","harvestDate": ${Math.floor(Date.now() / 1000)},"latLong": "47.4116, 0.8932","ipfsMetadata": "ipfs://QmYwAPzWJy...","weight": 120}'`, 'curl1')}
                className="absolute top-2 right-2 p-1.5 bg-slate-900 border border-slate-850 rounded-md text-gray-400 hover:text-teal-300 transition-colors"
                title="Copy Curl Command"
              >
                {copiedText === 'curl1' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            
            <p className="text-[10px] text-gray-500 italic">
              * Note: The gateway automatically executes transacting signatures using pre-funded Developer-Controlled Wallets on Arc Testnet.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
