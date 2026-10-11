import React from 'react';
import {
  Cpu,
  HardDrive,
  Activity,
  Server,
  Globe,
  CheckCircle2,
  FolderGit2,
  Layers,
  Shield,
  Zap,
} from 'lucide-react';
import { SystemTelemetry } from '../types';

interface SystemViewProps {
  telemetry: SystemTelemetry | null;
  onRefresh: () => void;
}

export const SystemView: React.FC<SystemViewProps> = ({ telemetry, onRefresh }) => {
  if (!telemetry) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-400 font-mono text-xs">
        Collecting hardware telemetry...
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-6 overflow-y-auto font-mono space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-900 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-100 tracking-wider">
              PROJECT FENRIR // KERNEL ARCHITECTURE
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              UNRESTRICTED
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Full host machine resource isolation, hardware bridges, and cloud Antigravity mirrors.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 text-xs font-bold transition flex items-center gap-2"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Grid of Key Machine Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Box */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">PROCESSOR (CPU)</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white">{telemetry.cpu.cores} Cores</div>
          <p className="text-[11px] text-slate-400 truncate">{telemetry.cpu.model}</p>
          <div className="text-[10px] text-slate-500">
            Load Average: {telemetry.cpu.loadAvg.map((l) => l.toFixed(2)).join(', ')}
          </div>
        </div>

        {/* RAM Box */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">PHYSICAL MEMORY</span>
            <HardDrive className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white">
            {formatBytes(telemetry.memory.usedBytes)}{' '}
            <span className="text-xs font-normal text-slate-400">
              / {formatBytes(telemetry.memory.totalBytes)}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              style={{ width: `${telemetry.memory.usedPercent}%` }}
              className={`h-full rounded-full ${
                telemetry.memory.usedPercent > 80 ? 'bg-rose-500' : 'bg-indigo-500'
              }`}
            ></div>
          </div>
          <div className="text-[10px] text-slate-500">
            Memory Utilization: {telemetry.memory.usedPercent}%
          </div>
        </div>

        {/* Host OS Box */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">HOST PLATFORM</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white uppercase">
            {telemetry.platform} {telemetry.arch}
          </div>
          <p className="text-[11px] text-slate-400 truncate">{telemetry.release}</p>
          <div className="text-[10px] text-slate-500">Host: {telemetry.hostname}</div>
        </div>

        {/* Kernel Uptime Box */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">HELL_GATE UPTIME</span>
            <Activity className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-white">{formatUptime(telemetry.uptimeSeconds)}</div>
          <p className="text-[11px] text-slate-400">Node: {telemetry.nodeVersion}</p>
          <div className="text-[10px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Real-time active
          </div>
        </div>
      </div>

      {/* Deep Environment & Permissions Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Antigravity Functional Replica Matrix */}
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-slate-200 tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            ANTIGRAVITY CAPABILITY PARITY MATRIX
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div>
                <span className="font-bold text-slate-200 block">Host Computer Machine Access</span>
                <span className="text-[11px] text-slate-400">
                  Direct shell processes, Python/Node runtimes, file I/O
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                100% UNRESTRICTED
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div>
                <span className="font-bold text-slate-200 block">Workspace Code IDE & Editor</span>
                <span className="text-[11px] text-slate-400">
                  Direct file modification, creation, deletion & syntax inspect
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                INTEGRATED
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div>
                <span className="font-bold text-slate-200 block">Regional Lockout Bypass</span>
                <span className="text-[11px] text-slate-400">
                  Zero region errors. Autonomous fallback to host Fenrir engine
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
                ACTIVE
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div>
                <span className="font-bold text-slate-200 block">Media Studio: Image & Video</span>
                <span className="text-[11px] text-slate-400">
                  Precision dimension resizing, Gemini Flash image editing, Omni 1.1 video
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                ENABLED
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div>
                <span className="font-bold text-slate-200 block">Local AI Model Co-Pilot</span>
                <span className="text-[11px] text-slate-400">
                  Ollama, LM Studio & OpenAI-compatible local endpoints
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                SUPPORTED
              </span>
            </div>
          </div>
        </div>

        {/* Host Path & System Security */}
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-slate-200 tracking-wider flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-indigo-400" />
            STORAGE & KERNEL TOPOLOGY
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block font-bold">
                Dedicated Agent Workspace Directory
              </span>
              <p className="text-cyan-300 font-mono text-xs break-all mt-1">
                {telemetry.workspaceDir}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Files generated by the agent or created via the IDE are saved here on the host.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block font-bold">
                Gemini API Key Status
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    telemetry.hasEnvKey ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                ></span>
                <span className="text-xs text-slate-200">
                  {telemetry.hasEnvKey
                    ? 'Default Server Environment Key Configured'
                    : 'User Provided Key or Local Model Required'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block font-bold">
                Desktop App Shell Capabilities
              </span>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                Project_Fenrir acts as a sovereign desktop developer environment. It provides full
                terminal access, an integrated code studio, multimodal media generators, and local model
                orchestration without cloud geographical limits.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
