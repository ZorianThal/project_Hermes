import React from 'react';
import {
  Terminal,
  Cpu,
  Layers,
  Image as ImageIcon,
  HardDrive,
  Key,
  ShieldCheck,
  Globe,
  User,
  LogOut,
  Sparkles,
  Download,
} from 'lucide-react';
import { ActiveTab, SystemTelemetry, UserAuth } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  telemetry: SystemTelemetry | null;
  auth: UserAuth;
  onOpenAuthModal: () => void;
  onOpenDownloadModal: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  telemetry,
  auth,
  onOpenAuthModal,
  onOpenDownloadModal,
  onLogout,
}) => {
  return (
    <header className="bg-slate-950 border-b border-cyan-900/40 text-slate-100 select-none sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
      {/* Top Banner: App Title & Hardware / Auth Stats */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-900">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-600 via-indigo-600 to-rose-600 p-[1px] shadow-lg shadow-cyan-500/10">
            <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
              <span className="text-cyan-400 font-black text-sm tracking-tighter">HG</span>
            </div>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base tracking-wider text-slate-100 font-mono flex items-center gap-1.5">
                HELL_GATE
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-sans font-medium uppercase tracking-normal">
                  Project_Fenrir
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Antigravity Unrestricted Cloud Replica
              <span className="text-slate-600">|</span>
              <span className="text-cyan-400/90 flex items-center gap-1">
                <Globe className="w-3 h-3 text-cyan-400" /> Region-Free Kernel
              </span>
            </p>
          </div>
        </div>

        {/* Live Hardware Telemetry Pointers */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono">
          {telemetry ? (
            <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-1.5">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {telemetry.cpu.cores} Cores <span className="text-slate-500">({telemetry.platform})</span>
                </span>
              </div>
              <div className="w-[1px] h-3.5 bg-slate-800"></div>
              <div className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-slate-300">
                  RAM: <span className={telemetry.memory.usedPercent > 85 ? 'text-rose-400' : 'text-emerald-400'}>
                    {telemetry.memory.usedPercent}%
                  </span>
                </span>
                <span className="text-[10px] text-slate-500">
                  ({Math.round(telemetry.memory.usedBytes / (1024 * 1024))}MB)
                </span>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 flex items-center gap-1 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              Synchronizing telemetry...
            </div>
          )}

          {/* Download Desktop App Button */}
          <button
            onClick={onOpenDownloadModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 via-indigo-600 to-rose-600 hover:from-cyan-500 hover:to-rose-500 text-white font-bold text-xs shadow-md shadow-cyan-900/40 transition"
            title="Скачать или установить приложение на компьютер"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Скачать Desktop (.EXE / PWA)</span>
            <span className="lg:hidden">Desktop</span>
          </button>

          {/* Auth State & Key Quick Toggle */}
          <div className="flex items-center gap-2">
            {auth.isLoggedIn || auth.isKeyVerified || telemetry?.hasEnvKey ? (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 hover:bg-emerald-900/60 transition text-xs"
                title="Authentication & API Keys verified"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{auth.userName || (auth.geminiApiKey ? 'API Key Active' : 'Cloud Key Active')}</span>
              </button>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-950/50 border border-amber-700/60 text-amber-300 hover:bg-amber-900/50 transition text-xs"
              >
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Set Key / Sign in</span>
              </button>
            )}

            {auth.isLoggedIn && (
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-4 flex items-center gap-1 overflow-x-auto scrollbar-none py-1.5">
        <button
          onClick={() => setActiveTab('agent')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium font-mono transition-all ${
            activeTab === 'agent'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>COMMAND NEXUS</span>
          <span className="text-[10px] px-1 rounded bg-cyan-900/50 text-cyan-300">Antigravity</span>
        </button>

        <button
          onClick={() => setActiveTab('ide')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium font-mono transition-all ${
            activeTab === 'ide'
              ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span>MACHINE IDE & TERMINAL</span>
        </button>

        <button
          onClick={() => setActiveTab('media')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium font-mono transition-all ${
            activeTab === 'media'
              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 text-rose-400" />
          <span>MEDIA LAB</span>
          <span className="text-[10px] px-1 rounded bg-rose-950 text-rose-300">Resize & Video</span>
        </button>

        <button
          onClick={() => setActiveTab('local-ai')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium font-mono transition-all ${
            activeTab === 'local-ai'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>LOCAL AI RUNNER</span>
          <span className="text-[10px] px-1 rounded bg-amber-950 text-amber-300">Ollama / LM Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium font-mono transition-all ${
            activeTab === 'system'
              ? 'bg-slate-800 text-slate-200 border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5 text-slate-400" />
          <span>SYSTEM TELEMETRY</span>
        </button>
      </div>
    </header>
  );
};
