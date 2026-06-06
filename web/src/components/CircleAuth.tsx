'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { useConnect, useDisconnect, useAccount } from 'wagmi';
import { getOrCreateUserSession, createWalletChallengeAction, fetchUserWalletsAction } from '@/lib/circleClient';
import { ShieldCheck, Mail, Key, LogOut, CheckCircle2, User, ChevronRight, AlertCircle, Copy, Check } from 'lucide-react';

interface CircleSession {
  email: string;
  userId: string;
  userToken: string;
  encryptionKey: string;
  appId: string;
  walletAddress: string;
  walletId: string;
}

interface CircleAuthContextType {
  session: CircleSession | null;
  login: (email: string) => Promise<boolean>;
  logout: () => void;
  isAuthOpen: boolean;
  setIsAuthOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  loading: boolean;
  error: string | null;
}

const CircleAuthContext = createContext<CircleAuthContextType | undefined>(undefined);

export function useCircleAuth() {
  const context = useContext(CircleAuthContext);
  if (!context) {
    throw new Error('useCircleAuth must be used within a CircleAuthProvider');
  }
  return context;
}

export function CircleAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<CircleSession | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { connect, connectors } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { isConnected } = useAccount();

  // Load session from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('circle_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.walletAddress) {
          setSession(parsed);
        }
      } catch (e) {
        console.error('Failed to load circle session:', e);
      }
    }
  }, []);

  const login = async (email: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOrCreateUserSession(email);
      if (!res.success) {
        throw new Error(res.error || 'Failed to initialize session');
      }

      const tempSession = {
        email,
        userId: res.userId!,
        userToken: res.userToken!,
        encryptionKey: res.encryptionKey!,
        appId: res.appId!,
        walletAddress: res.walletAddress || '',
        walletId: res.walletId || '',
      };

      if (res.walletAddress) {
        // User already has a wallet, log in immediately
        setSession(tempSession);
        localStorage.setItem('circle_session', JSON.stringify(tempSession));
        
        // Connect via Wagmi
        const circleConnector = connectors.find((c) => c.id === 'circle-ucw');
        if (circleConnector) {
          connect({ connector: circleConnector });
        }
        setLoading(false);
        return true;
      } else {
        // New user - generate wallet creation challenge
        const challengeRes = await createWalletChallengeAction(tempSession.userToken);
        if (!challengeRes.success || !challengeRes.challengeId) {
          throw new Error(challengeRes.error || 'Failed to generate wallet challenge');
        }

        // Execute challenge (Passkey registration)
        const { W3SSdk } = await import('@circle-fin/w3s-pw-web-sdk');
        const sdk = new W3SSdk();
        sdk.setAppSettings({ appId: tempSession.appId });
        sdk.setAuthentication({
          userToken: tempSession.userToken,
          encryptionKey: tempSession.encryptionKey,
        });

        const success = await new Promise<boolean>((resolve) => {
          sdk.execute(challengeRes.challengeId!, async (err, result) => {
            if (err) {
              console.error('Passkey creation error:', err);
              setError(err.message || 'Passkey registration cancelled');
              resolve(false);
            } else {
              // Wait for wallet creation index on backend
              let foundAddress = '';
              let foundId = '';
              for (let i = 0; i < 5; i++) {
                await new Promise((r) => setTimeout(r, 2000));
                const listRes = await fetchUserWalletsAction(tempSession.userToken);
                if (listRes.success && listRes.wallets) {
                  const arcWallet = listRes.wallets.find(
                    (w: any) => w.blockchain === 'ARC-TESTNET' || w.blockchain === 'ARC'
                  );
                  if (arcWallet) {
                    foundAddress = arcWallet.address;
                    foundId = arcWallet.id;
                    break;
                  }
                }
              }

              if (foundAddress) {
                const finalSession = {
                  ...tempSession,
                  walletAddress: foundAddress,
                  walletId: foundId,
                };
                setSession(finalSession);
                localStorage.setItem('circle_session', JSON.stringify(finalSession));
                
                // Connect via Wagmi
                const circleConnector = connectors.find((c) => c.id === 'circle-ucw');
                if (circleConnector) {
                  connect({ connector: circleConnector });
                }
                resolve(true);
              } else {
                setError('Failed to fetch newly created wallet');
                resolve(false);
              }
            }
          });
        });

        setLoading(false);
        return success;
      }
    } catch (err: any) {
      console.error('Circle login error:', err);
      setError(err.message || 'Authentication failed');
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem('circle_session');
    wagmiDisconnect();
  };

  return (
    <CircleAuthContext.Provider
      value={{
        session,
        login,
        logout,
        isAuthOpen,
        setIsAuthOpen,
        isSettingsOpen,
        setIsSettingsOpen,
        loading,
        error,
      }}
    >
      {children}
      <CircleAuthModal />
      <CircleUserSettingsModal />
    </CircleAuthContext.Provider>
  );
}

function CircleAuthModal() {
  const { isAuthOpen, setIsAuthOpen, login, loading, error } = useCircleAuth();
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);

  if (!isAuthOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setOtpError('Please enter a valid email address');
      return;
    }
    setOtpError(null);
    setOtpSent(true);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode !== '123456' && otpCode.length !== 6) {
      setOtpError('Invalid OTP code. Use 123456 for testnet login.');
      return;
    }
    setOtpError(null);
    const success = await login(email);
    if (success) {
      setIsAuthOpen(false);
      setOtpSent(false);
      setOtpCode('');
      setEmail('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-3xl shadow-2xl p-6 relative overflow-hidden">
        {/* Decorative background gradient */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-100 rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-100 rounded-full blur-3xl opacity-60" />

        <button
          onClick={() => setIsAuthOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-3 bg-cyan-50 rounded-2xl border border-cyan-100 mb-3 text-cyan-600">
            <ShieldCheck className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">CargoTrust Sign In</h2>
          <p className="text-sm text-gray-500 mt-1">Seamless passkey & email authentication portal</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-start gap-2.5 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {otpError && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-100 text-amber-600 rounded-xl flex items-start gap-2.5 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{otpError}</span>
          </div>
        )}

        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@farm.com"
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none text-gray-900"
                />
                <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold tracking-wide shadow-lg shadow-gray-900/10 hover:shadow-gray-900/20 transition-all flex items-center justify-center gap-1.5"
            >
              Continue with Email
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="relative flex items-center justify-center my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100" />
              </div>
              <span className="relative bg-white px-3 text-xs text-gray-400 uppercase tracking-wider font-medium">
                Or Social Auth
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                // Mock social login
                setEmail('demo-grower@cargotrust.io');
                setOtpSent(true);
              }}
              disabled={loading}
              className="w-full py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-1.14 2.78-2.4 3.62v3.02h3.87c2.26-2.08 3.58-5.14 3.58-8.49z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.87-3.02c-1.08.72-2.45 1.16-4.09 1.16-3.15 0-5.81-2.13-6.76-5.01H1.36v3.12c2 3.97 6.11 6.66 10.64 6.66z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.24 14.22c-.25-.72-.39-1.5-.39-2.3 0-.8.14-1.57.39-2.3V6.5H1.36C.49 8.21 0 10.1 0 12s.49 3.79 1.36 5.5l3.88-3.28z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.47 0 3.36 2.69 1.36 6.5l3.88 3.28c.95-2.88 3.61-5.03 6.76-5.03z"
                />
              </svg>
              Sign in with Google
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-xs text-amber-800 leading-relaxed">
              <strong>Testnet Notice:</strong> A mock OTP has been sent. Please enter <strong>123456</strong> to proceed.
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                Verification Code (OTP)
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm tracking-widest text-center font-mono focus:bg-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none text-gray-900"
                />
                <Key className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-semibold tracking-wide shadow-lg shadow-cyan-600/10 hover:shadow-cyan-600/20 transition-all flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Secure Passkey...
                </>
              ) : (
                <>
                  Verify & Register Passkey
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setOtpSent(false)}
              disabled={loading}
              className="w-full text-center text-xs text-gray-500 hover:text-gray-800 transition-colors py-1"
            >
              Back to Email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function CircleUserSettingsModal() {
  const { isSettingsOpen, setIsSettingsOpen, session, logout } = useCircleAuth();
  const [copied, setCopied] = useState(false);

  if (!isSettingsOpen || !session) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(session.walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-3xl shadow-2xl p-6 relative overflow-hidden">
        <button
          onClick={() => setIsSettingsOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>

        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-gray-100">
          <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-gray-900">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-base leading-tight">Circle Account</h3>
            <span className="text-xs text-gray-500">{session.email}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              SCA Wallet Address (Arc Testnet)
            </label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-150 p-3 rounded-xl">
              <span className="text-xs font-mono text-gray-700 select-all truncate grow">
                {session.walletAddress}
              </span>
              <button
                onClick={handleCopy}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-lg transition-all"
                title="Copy Address"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="block text-xs font-semibold text-emerald-800">Passkey Configured</span>
              <span className="block text-[11px] text-emerald-600/80 leading-relaxed mt-0.5">
                Biometric credentials are securely registered to this browser. Transactions are signed passwordlessly.
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              setIsSettingsOpen(false);
            }}
            className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
