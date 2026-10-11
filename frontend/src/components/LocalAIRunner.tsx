import React, { useState } from 'react';
import {
  Layers,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Terminal,
  Cpu,
  Server,
  Zap,
  ExternalLink,
} from 'lucide-react';
import { LocalModelStatus } from '../types';
import { api } from '../services/api';

interface LocalAIRunnerProps {
  localModels: LocalModelStatus | null;
  onRefreshLocalModels: () => void;
  ollamaUrl: string;
  lmStudioUrl: string;
  onChangeUrls: (ollama: string, lmStudio: string) => void;
}

export const LocalAIRunner: React.FC<LocalAIRunnerProps> = ({
  localModels,
  onRefreshLocalModels,
  ollamaUrl,
  lmStudioUrl,
  onChangeUrls,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<'ollama' | 'lmStudio'>('ollama');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [testPrompt, setTestPrompt] = useState<string>(
    'Write a quick bash script to monitor high memory usage processes and print a summary table.'
  );
  const [systemPrompt, setSystemPrompt] = useState<string>(
    'You are Hell_Gate local agent. Answer with high technical precision and direct bash code.'
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedText, setGeneratedText] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Set default model on detection
  React.useEffect(() => {
    if (localModels) {
      if (selectedProvider === 'ollama' && localModels.ollama.models.length > 0 && !selectedModel) {
        setSelectedModel(localModels.ollama.models[0]);
      } else if (
        selectedProvider === 'lmStudio' &&
        localModels.lmStudio.models.length > 0 &&
        !selectedModel
      ) {
        setSelectedModel(localModels.lmStudio.models[0]);
      }
    }
  }, [localModels, selectedProvider]);

  const handleRunLocalModel = async () => {
    if (!testPrompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setGeneratedText(null);
    setErrorText(null);

    try {
      const res = await api.generateLocalModel({
        provider: selectedProvider,
        model: selectedModel || (selectedProvider === 'ollama' ? 'llama3.2' : 'default'),
        prompt: testPrompt,
        systemPrompt,
        url: selectedProvider === 'ollama' ? ollamaUrl : lmStudioUrl,
      });

      setGeneratedText(res.text);
    } catch (err: any) {
      setErrorText(err.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const isOllamaConnected = localModels?.ollama.connected ?? false;
  const isLmConnected = localModels?.lmStudio.connected ?? false;

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full bg-slate-950 text-slate-100 overflow-hidden font-mono">
      {/* Left Settings & Model Selection */}
      <div className="w-full md:w-[440px] border-r border-slate-900 bg-slate-950/70 p-4 overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-900">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-amber-950 border border-amber-800 flex items-center justify-center">
              <Layers className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide text-slate-100">LOCAL AI RUNNER</h2>
              <p className="text-[11px] text-slate-400">Zero-Cloud Host Machine Inference</p>
            </div>
          </div>
          <button
            onClick={onRefreshLocalModels}
            className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 px-2 py-1 rounded bg-amber-950/50 border border-amber-800/60 transition"
          >
            <RotateCw className="w-3 h-3" />
            <span>Scan Endpoints</span>
          </button>
        </div>

        {/* Local Provider Cards */}
        <div className="space-y-2">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
            1. Select Host Engine
          </span>

          {/* Ollama Card */}
          <div
            onClick={() => setSelectedProvider('ollama')}
            className={`p-3 rounded-xl border cursor-pointer transition ${
              selectedProvider === 'ollama'
                ? 'border-amber-500 bg-amber-950/30'
                : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-xs text-slate-200">Ollama Local Engine</span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                  isOllamaConnected
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isOllamaConnected ? 'bg-emerald-400' : 'bg-slate-500'
                  }`}
                ></span>
                {isOllamaConnected ? 'Detected' : 'Offline / Standby'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Endpoint: {ollamaUrl}</p>
            {isOllamaConnected && localModels && (
              <div className="mt-2 text-[10px] text-emerald-300">
                Found {localModels.ollama.models.length} model(s):{' '}
                {localModels.ollama.models.join(', ') || 'None pulled'}
              </div>
            )}
          </div>

          {/* LM Studio Card */}
          <div
            onClick={() => setSelectedProvider('lmStudio')}
            className={`p-3 rounded-xl border cursor-pointer transition ${
              selectedProvider === 'lmStudio'
                ? 'border-amber-500 bg-amber-950/30'
                : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-xs text-slate-200">
                  LM Studio / Local OpenAI API
                </span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                  isLmConnected
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isLmConnected ? 'bg-emerald-400' : 'bg-slate-500'
                  }`}
                ></span>
                {isLmConnected ? 'Detected' : 'Offline / Standby'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Endpoint: {lmStudioUrl}</p>
            {isLmConnected && localModels && (
              <div className="mt-2 text-[10px] text-emerald-300">
                Found {localModels.lmStudio.models.length} loaded model(s)
              </div>
            )}
          </div>
        </div>

        {/* Model Selection Dropdown or Manual Input */}
        <div>
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-1.5">
            2. Active Model Name
          </span>
          {selectedProvider === 'ollama' && localModels && localModels.ollama.models.length > 0 ? (
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-amber-200 focus:outline-none focus:border-amber-500"
            >
              {localModels.ollama.models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          ) : selectedProvider === 'lmStudio' &&
            localModels &&
            localModels.lmStudio.models.length > 0 ? (
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-amber-200 focus:outline-none focus:border-amber-500"
            >
              {localModels.lmStudio.models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              placeholder={
                selectedProvider === 'ollama'
                  ? 'e.g. llama3.2, deepseek-r1:1.5b, mistral'
                  : 'e.g. loaded-model'
              }
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-amber-200 focus:outline-none focus:border-amber-500"
            />
          )}
        </div>

        {/* System Prompt & Test Prompt */}
        <div>
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
            Agent Role / System Prompt
          </span>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-none h-16"
          />
        </div>

        <div>
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
            Task / Execution Instruction
          </span>
          <textarea
            value={testPrompt}
            onChange={(e) => setTestPrompt(e.target.value)}
            placeholder="Type a coding or reasoning objective..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-none h-24"
          />
        </div>

        <button
          onClick={handleRunLocalModel}
          disabled={isGenerating || !testPrompt.trim()}
          className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-amber-950/40"
        >
          {isGenerating ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin text-amber-200" />
              <span>INFERRING LOCALLY...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>RUN LOCAL AGENT INFERENCE</span>
            </>
          )}
        </button>

        {/* Quick Instructions */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
          <p className="font-bold text-slate-300">How to use Local AI with Hell_Gate:</p>
          <p>
            1. Install Ollama (<code className="text-amber-300">ollama run llama3.2</code>) or start
            LM Studio's local server.
          </p>
          <p>
            2. Click "Scan Endpoints". Once detected, you can also select "Local Model" directly in
            the Command Nexus to run autonomous machine actions using your local hardware!
          </p>
        </div>
      </div>

      {/* Right Output View */}
      <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-900 bg-slate-900/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              Local Model Output Stream
            </span>
          </div>
          {selectedModel && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60">
              Active: {selectedModel}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono">
          {errorText && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Inference Error</p>
                <p className="text-[11px] mt-0.5">{errorText}</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Ensure Ollama (http://127.0.0.1:11434) or LM Studio (http://127.0.0.1:1234) is
                  running with CORS enabled (OLLAMA_ORIGINS="*" ollama serve).
                </p>
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="p-4 rounded-xl border border-amber-800/60 bg-amber-950/20 text-xs flex items-center gap-3 animate-pulse">
              <RotateCw className="w-4 h-4 text-amber-400 animate-spin" />
              <span className="text-amber-300">
                Streaming response from {selectedProvider} ({selectedModel || 'default'})...
              </span>
            </div>
          )}

          {generatedText ? (
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Generation Response
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Local Hardware Execution</span>
              </div>
              <pre className="text-xs text-slate-200 whitespace-pre-wrap font-mono leading-relaxed select-text">
                {generatedText}
              </pre>
            </div>
          ) : !isGenerating && !errorText ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-600">
              <Layers className="w-12 h-12 mb-3 opacity-30 text-amber-400" />
              <h3 className="text-sm font-bold text-slate-300">Local Engine Ready</h3>
              <p className="text-xs max-w-sm mt-1 text-slate-500">
                Send an execution prompt on the left to verify your local models and monitor tokens.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
