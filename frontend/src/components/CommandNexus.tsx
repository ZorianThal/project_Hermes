import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  RotateCw,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  FolderGit2,
  Code,
  FileText,
  ChevronDown,
  ChevronRight,
  Globe2,
  ArrowRight,
  Layers,
  Copy,
  Check,
} from 'lucide-react';
import { AgentEngineMode, AgentStep, LocalModelStatus } from '../types';
import { api } from '../services/api';

interface CommandNexusProps {
  onOpenFileInIde: (filePath: string) => void;
  localModels: LocalModelStatus | null;
  onRefreshFiles: () => void;
}

export const CommandNexus: React.FC<CommandNexusProps> = ({
  onOpenFileInIde,
  localModels,
  onRefreshFiles,
}) => {
  const [prompt, setPrompt] = useState<string>('');
  const [engineMode, setEngineMode] = useState<AgentEngineMode>('auto');
  const [selectedLocalModel, setSelectedLocalModel] = useState<{
    provider: 'ollama' | 'lmStudio';
    model: string;
  } | null>(null);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [finalOutput, setFinalOutput] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRegionBlocked, setIsRegionBlocked] = useState<boolean>(false);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<boolean>(false);

  const presetPrompts = [
    {
      title: 'Machine Telemetry & Diagnostic Script',
      text: 'Write a Python script fenrir_diagnostics.py that scans CPU, memory, platform info, runs a quick benchmark, and writes a detailed markdown report system_audit.md. Then execute it using bash.',
    },
    {
      title: 'Full-Stack Microservice & Curl Test',
      text: 'Create a Node.js microservice server_demo.js that listens on an available port, responds to /health and /metrics, start it in the background, test it with curl, and log the response.',
    },
    {
      title: 'Antigravity Data Pipeline',
      text: 'Build a data pipeline script in Python that downloads or generates synthetic time-series sensor data, computes rolling statistics, and saves output to data_summary.json.',
    },
    {
      title: 'File Cleaner & Code Auditor',
      text: 'Inspect all files in the current workspace directory, report line counts and file sizes, and write a summary table to workspace_manifest.txt.',
    },
  ];

  const toggleStepExpand = (stepId: string) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const handleCopyOutput = () => {
    if (finalOutput) {
      navigator.clipboard.writeText(finalOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRunAgent = async (overridePrompt?: string) => {
    const textToRun = (overridePrompt ?? prompt).trim();
    if (!textToRun || isRunning) return;

    setIsRunning(true);
    setSteps([]);
    setFinalOutput(null);
    setErrorMsg(null);
    setIsRegionBlocked(false);

    try {
      const result = await api.runAgent(
        textToRun,
        engineMode,
        engineMode === 'local-agent' && selectedLocalModel
          ? {
              provider: selectedLocalModel.provider,
              model: selectedLocalModel.model,
            }
          : undefined
      );

      if (result.steps && result.steps.length > 0) {
        setSteps(result.steps);
        // Automatically expand the latest steps
        const expandedMap: Record<string, boolean> = {};
        result.steps.forEach((s) => {
          expandedMap[s.id] = true;
        });
        setExpandedSteps(expandedMap);
      }

      if (result.success) {
        setFinalOutput(result.output);
        onRefreshFiles();
      } else {
        setErrorMsg(result.error || 'Execution encountered an error');
        if (result.isRegionBlocked) {
          setIsRegionBlocked(true);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-slate-950 text-slate-100">
      {/* Left Column: Command Prompt & Configuration */}
      <div className="w-full md:w-[460px] lg:w-[500px] border-r border-slate-900 flex flex-col h-full bg-slate-950/70 p-4 overflow-y-auto">
        {/* Header Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-900 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-cyan-950 border border-cyan-800 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide font-mono text-slate-100">
                ANTIGRAVITY RUNNER
              </h2>
              <p className="text-[11px] text-slate-400">Autonomous Cloud & Machine Agent</p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono">
            Unrestricted
          </span>
        </div>

        {/* Engine Mode Selector */}
        <div className="mb-4">
          <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1.5 font-medium">
            Execution Engine & Regional Routing
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => setEngineMode('auto')}
              className={`p-2 rounded-lg border text-left flex flex-col gap-0.5 transition ${
                engineMode === 'auto'
                  ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200'
                  : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1 font-mono">
                  <Globe2 className="w-3.5 h-3.5 text-cyan-400" /> Auto-Bypass
                </span>
                <span className="text-[9px] px-1 rounded bg-cyan-900/60 text-cyan-300 font-mono">
                  Recommended
                </span>
              </div>
              <span className="text-[10px] text-slate-400 leading-tight">
                Cloud Antigravity with auto-fallback to Fenrir Engine
              </span>
            </button>

            <button
              onClick={() => setEngineMode('fenrir-autonomous')}
              className={`p-2 rounded-lg border text-left flex flex-col gap-0.5 transition ${
                engineMode === 'fenrir-autonomous'
                  ? 'border-indigo-500 bg-indigo-950/40 text-indigo-200'
                  : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1 font-mono">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" /> Fenrir Engine
                </span>
                <span className="text-[9px] px-1 rounded bg-indigo-900/60 text-indigo-300 font-mono">
                  Direct Machine
                </span>
              </div>
              <span className="text-[10px] text-slate-400 leading-tight">
                Direct local machine access, shell & workspace files
              </span>
            </button>

            <button
              onClick={() => setEngineMode('cloud-antigravity')}
              className={`p-2 rounded-lg border text-left flex flex-col gap-0.5 transition ${
                engineMode === 'cloud-antigravity'
                  ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200'
                  : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Antigravity API
                </span>
              </div>
              <span className="text-[10px] text-slate-400 leading-tight">
                antigravity-preview-09-2026 managed sandbox
              </span>
            </button>

            <button
              onClick={() => {
                setEngineMode('local-agent');
                if (
                  !selectedLocalModel &&
                  localModels &&
                  (localModels.ollama.models.length > 0 || localModels.lmStudio.models.length > 0)
                ) {
                  if (localModels.ollama.models.length > 0) {
                    setSelectedLocalModel({
                      provider: 'ollama',
                      model: localModels.ollama.models[0],
                    });
                  } else if (localModels.lmStudio.models.length > 0) {
                    setSelectedLocalModel({
                      provider: 'lmStudio',
                      model: localModels.lmStudio.models[0],
                    });
                  }
                }
              }}
              className={`p-2 rounded-lg border text-left flex flex-col gap-0.5 transition ${
                engineMode === 'local-agent'
                  ? 'border-amber-500 bg-amber-950/40 text-amber-200'
                  : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1 font-mono">
                  <Layers className="w-3.5 h-3.5 text-amber-400" /> Local Model
                </span>
                <span className="text-[9px] px-1 rounded bg-amber-900/60 text-amber-300 font-mono">
                  Ollama / LMS
                </span>
              </div>
              <span className="text-[10px] text-slate-400 leading-tight">
                Runs completely on your local GPU/CPU
              </span>
            </button>
          </div>

          {/* Local Model dropdown if selected */}
          {engineMode === 'local-agent' && (
            <div className="mt-2 p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/50 text-xs">
              <span className="text-[11px] text-amber-300 font-medium block mb-1">
                Select Active Local Model:
              </span>
              {localModels &&
              (localModels.ollama.models.length > 0 || localModels.lmStudio.models.length > 0) ? (
                <select
                  value={selectedLocalModel ? `${selectedLocalModel.provider}:${selectedLocalModel.model}` : ''}
                  onChange={(e) => {
                    const [provider, model] = e.target.value.split(':');
                    if (provider && model) {
                      setSelectedLocalModel({ provider: provider as any, model });
                    }
                  }}
                  className="w-full bg-slate-900 border border-amber-700/60 text-amber-200 rounded px-2 py-1.5 font-mono text-xs focus:outline-none focus:border-amber-400"
                >
                  {localModels.ollama.models.map((m) => (
                    <option key={`ollama:${m}`} value={`ollama:${m}`}>
                      Ollama: {m}
                    </option>
                  ))}
                  {localModels.lmStudio.models.map((m) => (
                    <option key={`lmStudio:${m}`} value={`lmStudio:${m}`}>
                      LM Studio: {m}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-[11px] text-slate-400">
                  No local models detected. Check the "Local AI Runner" tab to start Ollama or LM Studio.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Prompt Box */}
        <div className="flex-1 flex flex-col mb-4">
          <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1.5 font-medium flex items-center justify-between">
            <span>Agent Mission & Code Objective</span>
            <span className="text-[10px] text-slate-500">Autonomous multi-step loop</span>
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Instruct Hell_Gate to write code, build a script, explore files, execute bash commands, or process data on your machine..."
            className="w-full flex-1 min-h-[140px] bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition resize-none"
          />

          <div className="flex items-center justify-between mt-2.5">
            <span className="text-[11px] text-slate-500 font-mono">
              Target: <span className="text-cyan-400">agent_workspace/</span>
            </span>
            <button
              onClick={() => handleRunAgent()}
              disabled={isRunning || !prompt.trim()}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-bold transition shadow-lg ${
                isRunning || !prompt.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-rose-600 text-white hover:from-cyan-500 hover:to-rose-500 shadow-cyan-900/30'
              }`}
            >
              {isRunning ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin text-cyan-300" />
                  <span>EXECUTING...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-white fill-white" />
                  <span>RUN AGENT</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="pt-3 border-t border-slate-900">
          <span className="text-[11px] font-mono uppercase text-slate-500 block mb-2 font-medium">
            Quick Mission Templates
          </span>
          <div className="space-y-1.5">
            {presetPrompts.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPrompt(preset.text);
                }}
                className="w-full text-left p-2 rounded-md bg-slate-900/40 hover:bg-slate-800/80 border border-slate-800/60 hover:border-cyan-700/50 transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-cyan-300 font-mono">
                    {preset.title}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-cyan-400 transition" />
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {preset.text}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Execution Timeline, Proof of Work & Output */}
      <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
        {/* Top Bar for Results */}
        <div className="px-4 py-2.5 border-b border-slate-900 flex items-center justify-between bg-slate-900/30">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'}`}></span>
              Execution Timeline & Proof of Work
            </span>
            {steps.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                {steps.length} Steps
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {finalOutput && (
              <button
                onClick={handleCopyOutput}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 font-mono px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:border-cyan-700 transition"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Output'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Region Block Notification if detected */}
        {isRegionBlocked && (
          <div className="m-4 p-3 rounded-lg bg-amber-950/40 border border-amber-700/60 text-amber-200 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold font-mono">Antigravity Cloud Region Restriction Detected</p>
              <p className="text-[11px] text-amber-300/90 mt-0.5">
                Your direct IP/region cannot invoke Google's remote sandbox Antigravity agent. Project_Fenrir has activated the unrestricted Fenrir Autonomous Engine, which executes all commands, code, and files directly on this host machine.
              </p>
            </div>
          </div>
        )}

        {/* Steps & Final Response Display */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono">
          {steps.length === 0 && !isRunning && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-cyan-400/50">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-300 font-mono">Hell_Gate Engine Idle</h3>
              <p className="text-xs max-w-md mt-1 text-slate-400">
                Select a template or write an objective on the left. The agent will formulate a plan, write code, run shell commands, and verify deliverables.
              </p>
            </div>
          )}

          {steps.map((step) => {
            const isExpanded = expandedSteps[step.id] ?? true;
            return (
              <div
                key={step.id}
                className={`rounded-lg border transition text-xs overflow-hidden ${
                  step.type === 'thought'
                    ? 'border-slate-800 bg-slate-900/40'
                    : step.type === 'tool_call'
                    ? 'border-indigo-900/60 bg-indigo-950/20'
                    : step.type === 'tool_result'
                    ? 'border-cyan-900/60 bg-cyan-950/20'
                    : step.type === 'error'
                    ? 'border-rose-900/80 bg-rose-950/30'
                    : 'border-emerald-900/60 bg-emerald-950/20'
                }`}
              >
                {/* Step Header */}
                <button
                  onClick={() => toggleStepExpand(step.id)}
                  className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-800/30 transition"
                >
                  <div className="flex items-center gap-2">
                    {step.type === 'thought' && (
                      <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    )}
                    {step.type === 'tool_call' && (
                      <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                    {step.type === 'tool_result' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    {step.type === 'error' && (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    )}
                    {step.type === 'model_output' && (
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    )}

                    <span className="font-semibold text-slate-200">{step.title}</span>

                    {step.durationMs !== undefined && (
                      <span className="text-[10px] text-slate-500">
                        ({step.durationMs}ms)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">{step.timestamp.slice(11, 19)}</span>
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Step Details */}
                {isExpanded && step.details && (
                  <div className="px-3 pb-3 pt-1 border-t border-slate-900/80 bg-black/40">
                    <pre className="text-[11px] text-slate-300 whitespace-pre-wrap break-words font-mono leading-relaxed max-h-80 overflow-y-auto">
                      {step.details}
                    </pre>

                    {/* Quick Action to open files in IDE if a file was written */}
                    {step.title.includes('File Written') && (
                      <div className="mt-2 pt-2 border-t border-slate-800 flex justify-end">
                        <button
                          onClick={() => {
                            const filename = step.title.replace('File Written:', '').trim();
                            onOpenFileInIde(filename);
                          }}
                          className="flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 text-[10px] transition"
                        >
                          <Code className="w-3 h-3" />
                          <span>Open in Machine IDE</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Running Indicator */}
          {isRunning && (
            <div className="p-3 rounded-lg border border-cyan-800/60 bg-cyan-950/20 text-xs flex items-center gap-3 animate-pulse">
              <RotateCw className="w-4 h-4 text-cyan-400 animate-spin" />
              <span className="text-cyan-300 font-mono">
                Hell_Gate is analyzing, executing tools, and verifying machine outputs...
              </span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && !isRegionBlocked && (
            <div className="p-3 rounded-lg border border-rose-800/80 bg-rose-950/40 text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Execution Failed</p>
                <p className="text-[11px] mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Final Synthesized Output Card */}
          {finalOutput && (
            <div className="mt-4 p-4 rounded-xl border border-slate-800 bg-slate-900/60 text-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="font-bold text-slate-100 flex items-center gap-1.5 font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Mission Conclusion & Summary
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Hell_Gate Verified</span>
              </div>
              <div className="prose prose-invert prose-xs max-w-none font-sans text-slate-200 leading-relaxed whitespace-pre-wrap">
                {finalOutput}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
