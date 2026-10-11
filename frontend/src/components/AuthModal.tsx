import React, { useState } from 'react';
import {
  Key,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  X,
  Lock,
  Globe,
  CheckCircle2,
} from 'lucide-react';
import { UserAuth } from '../types';
import { api } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  auth: UserAuth;
  onSaveAuth: (newAuth: Partial<UserAuth>) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  auth,
  onSaveAuth,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState<string>(auth.geminiApiKey || '');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifyStatus, setVerifyStatus] = useState<{
    valid?: boolean;
    message?: string;
    isRegionIssue?: boolean;
  } | null>(null);

  if (!isOpen) return null;

  const handleTestAndSaveKey = async () => {
    if (!apiKeyInput.trim()) {
      localStorage.removeItem('hellgate_gemini_key');
      onSaveAuth({ geminiApiKey: null, isKeyVerified: false });
      setVerifyStatus({ valid: false, message: 'Cleared saved API key.' });
      return;
    }

    setIsVerifying(true);
    setVerifyStatus(null);

    try {
      const res = await api.verifyGeminiKey(apiKeyInput.trim());
      setVerifyStatus(res);
      if (res.valid) {
        localStorage.setItem('hellgate_gemini_key', apiKeyInput.trim());
        onSaveAuth({
          geminiApiKey: apiKeyInput.trim(),
          isKeyVerified: true,
          authProvider: 'api-key',
        });
      }
    } catch (err: any) {
      setVerifyStatus({
        valid: false,
        message: err.message || 'Key verification failed',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSimulateGoogleLogin = () => {
    // Standard mock user login for Google Account
    const mockEmail = 'operator@project-fenrir.local';
    const mockName = 'Fenrir Operator';
    onSaveAuth({
      isLoggedIn: true,
      userEmail: mockEmail,
      userName: mockName,
      authProvider: 'google',
    });
    setVerifyStatus({
      valid: true,
      message: `Signed in as ${mockEmail} with full desktop privileges.`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-900 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center">
              <Key className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                CREDENTIALS & ACCESS MANAGER
              </h3>
              <p className="text-[11px] text-slate-400">Google Account or Gemini API Key</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-900 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-xs">
          {/* Method 1: Google Account Sign-In */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">Google Account Authentication</span>
              {auth.authProvider === 'google' && auth.isLoggedIn && (
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Signed In
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Link your developer identity to Project_Fenrir to unlock workspace desktop actions.
            </p>

            <button
              onClick={handleSimulateGoogleLogin}
              className="w-full py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-900 font-bold flex items-center justify-center gap-2 transition shadow-md"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{auth.isLoggedIn ? 'Switch Google Account' : 'Sign in with Google'}</span>
            </button>
          </div>

          {/* Method 2: Gemini API Key */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">Custom Gemini API Key</span>
              <span className="text-[10px] text-cyan-400">Direct API</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Provide your personal Gemini API key. If your region is restricted from Google Cloud
              Antigravity, Project_Fenrir automatically routes through our local unrestricted machine
              engine.
            </p>

            <div className="space-y-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-black border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
              />

              <button
                onClick={handleTestAndSaveKey}
                disabled={isVerifying}
                className="w-full py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 disabled:bg-slate-800 text-white font-bold flex items-center justify-center gap-2 transition"
              >
                {isVerifying ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin text-cyan-300" />
                    <span>Verifying key with Gemini API...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Test & Save Key</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Verification Feedback Banner */}
          {verifyStatus && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                verifyStatus.valid
                  ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                  : verifyStatus.isRegionIssue
                  ? 'bg-amber-950/60 border-amber-800/80 text-amber-300'
                  : 'bg-rose-950/60 border-rose-800/80 text-rose-300'
              }`}
            >
              {verifyStatus.valid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <span className="font-bold block">
                  {verifyStatus.valid
                    ? 'Verified & Ready'
                    : verifyStatus.isRegionIssue
                    ? 'Region Lockout Handled'
                    : 'Notice'}
                </span>
                <p className="text-[11px] leading-relaxed">{verifyStatus.message}</p>
                {verifyStatus.isRegionIssue && (
                  <p className="text-[10px] text-amber-400 mt-1">
                    Don't worry! Fenrir Autonomous Engine bypasses this restriction by running
                    directly on your host machine.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-900 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
