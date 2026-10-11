import React, { useState, useEffect } from 'react';
import {
  Folder,
  FileCode,
  FileText,
  File,
  Plus,
  Trash2,
  Save,
  Play,
  Terminal as TerminalIcon,
  RotateCw,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  HardDrive,
  Copy,
  Check,
  CheckCircle2,
  X,
} from 'lucide-react';
import { FileItem, TerminalEntry } from '../types';
import { api } from '../services/api';

interface MachineIDEProps {
  initialFile?: string | null;
  onClearInitialFile?: () => void;
  files: FileItem[];
  workspaceDir: string;
  onRefreshFiles: () => void;
}

export const MachineIDE: React.FC<MachineIDEProps> = ({
  initialFile,
  onClearInitialFile,
  files,
  workspaceDir,
  onRefreshFiles,
}) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isModified, setIsModified] = useState<boolean>(false);
  const [loadingFile, setLoadingFile] = useState<boolean>(false);
  const [savingFile, setSavingFile] = useState<boolean>(false);
  const [newFileName, setNewFileName] = useState<string>('');
  const [showNewFileDialog, setShowNewFileDialog] = useState<boolean>(false);

  // Terminal state
  const [terminalCommand, setTerminalCommand] = useState<string>('');
  const [terminalEntries, setTerminalEntries] = useState<TerminalEntry[]>([]);
  const [runningCommand, setRunningCommand] = useState<boolean>(false);
  const [termHeight, setTermHeight] = useState<number>(240);

  // Quick preset commands
  const quickCommands = [
    { label: 'ls -la', cmd: 'ls -la' },
    { label: 'python fenrir_init.py', cmd: 'python3 fenrir_init.py' },
    { label: 'node -v && python3 -V', cmd: 'node -v && python3 -V' },
    { label: 'df -h', cmd: 'df -h .' },
    { label: 'top snapshot', cmd: 'ps aux | head -n 10' },
  ];

  // Handle external file opening request from Agent
  useEffect(() => {
    if (initialFile) {
      loadFile(initialFile);
      if (onClearInitialFile) onClearInitialFile();
    }
  }, [initialFile]);

  // Load initial welcome file if nothing is open
  useEffect(() => {
    if (!selectedFile && files.length > 0) {
      const firstPy = files.find((f) => !f.isDirectory && f.name.endsWith('.py'));
      const firstFile = firstPy || files.find((f) => !f.isDirectory);
      if (firstFile) {
        loadFile(firstFile.relativePath);
      }
    }
  }, [files]);

  const loadFile = async (relPath: string) => {
    setLoadingFile(true);
    try {
      const res = await api.readFile(relPath);
      setSelectedFile(relPath);
      setFileContent(res.content);
      setIsModified(false);
    } catch (err: any) {
      alert(`Could not load file ${relPath}: ${err.message}`);
    } finally {
      setLoadingFile(false);
    }
  };

  const handleSaveFile = async () => {
    if (!selectedFile) return;
    setSavingFile(true);
    try {
      await api.writeFile(selectedFile, fileContent);
      setIsModified(false);
      onRefreshFiles();
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSavingFile(false);
    }
  };

  const handleCreateFile = async () => {
    if (!newFileName.trim()) return;
    try {
      await api.writeFile(newFileName.trim(), `# ${newFileName}\n`);
      setShowNewFileDialog(false);
      const created = newFileName.trim();
      setNewFileName('');
      onRefreshFiles();
      loadFile(created);
    } catch (err: any) {
      alert(`Create error: ${err.message}`);
    }
  };

  const handleDeleteFile = async (relPath: string) => {
    if (!confirm(`Delete ${relPath} from host machine?`)) return;
    try {
      await api.deleteFile(relPath);
      if (selectedFile === relPath) {
        setSelectedFile(null);
        setFileContent('');
      }
      onRefreshFiles();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const handleExecuteTerminal = async (cmdToRun?: string) => {
    const cmd = (cmdToRun || terminalCommand).trim();
    if (!cmd || runningCommand) return;

    setRunningCommand(true);
    try {
      const entry = await api.runTerminalCommand(cmd);
      setTerminalEntries((prev) => [...prev, entry]);
      setTerminalCommand('');
      onRefreshFiles(); // In case command modified files
    } catch (err: any) {
      setTerminalEntries((prev) => [
        ...prev,
        {
          id: `term-err-${Date.now()}`,
          command: cmd,
          stdout: '',
          stderr: err.message,
          exitCode: 1,
          durationMs: 0,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setRunningCommand(false);
    }
  };

  const handleRunCurrentFile = () => {
    if (!selectedFile) return;
    if (selectedFile.endsWith('.py')) {
      handleExecuteTerminal(`python3 ${selectedFile}`);
    } else if (selectedFile.endsWith('.js') || selectedFile.endsWith('.ts')) {
      handleExecuteTerminal(`node ${selectedFile}`);
    } else if (selectedFile.endsWith('.sh')) {
      handleExecuteTerminal(`bash ${selectedFile}`);
    } else {
      handleExecuteTerminal(`cat ${selectedFile}`);
    }
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.py')) return <FileCode className="w-3.5 h-3.5 text-amber-400" />;
    if (fileName.endsWith('.js') || fileName.endsWith('.ts') || fileName.endsWith('.tsx'))
      return <FileCode className="w-3.5 h-3.5 text-cyan-400" />;
    if (fileName.endsWith('.json') || fileName.endsWith('.md'))
      return <FileText className="w-3.5 h-3.5 text-emerald-400" />;
    return <File className="w-3.5 h-3.5 text-slate-400" />;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden font-mono">
      {/* Main Split: File Tree + Code Editor */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Workspace File Explorer */}
        <div className="w-64 border-r border-slate-900 bg-slate-950/80 flex flex-col">
          <div className="p-3 border-b border-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <FolderOpen className="w-4 h-4 text-cyan-400" />
              <span>WORKSPACE</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowNewFileDialog(true)}
                className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-900 transition"
                title="New File"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onRefreshFiles}
                className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-900 transition"
                title="Refresh File Tree"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* New file input prompt */}
          {showNewFileDialog && (
            <div className="p-2 border-b border-slate-800 bg-slate-900/90 flex flex-col gap-1.5">
              <span className="text-[10px] text-slate-400 font-sans">Enter file name:</span>
              <input
                type="text"
                autoFocus
                placeholder="script.py"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFile();
                  if (e.key === 'Escape') setShowNewFileDialog(false);
                }}
                className="w-full bg-black border border-cyan-800 rounded px-2 py-1 text-xs text-white focus:outline-none"
              />
              <div className="flex justify-end gap-1">
                <button
                  onClick={() => setShowNewFileDialog(false)}
                  className="px-2 py-0.5 text-[10px] text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFile}
                  className="px-2 py-0.5 text-[10px] bg-cyan-700 text-white rounded font-bold"
                >
                  Create
                </button>
              </div>
            </div>
          )}

          {/* Workspace Root Path indicator */}
          <div className="px-3 py-1.5 text-[10px] text-slate-500 border-b border-slate-900/60 truncate">
            {workspaceDir}
          </div>

          {/* File Tree List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 text-xs">
            {files.length === 0 ? (
              <div className="text-center py-8 text-slate-600 text-xs">
                Workspace is empty. Create a file or run an agent task.
              </div>
            ) : (
              files.map((file) => (
                <div
                  key={file.path}
                  onClick={() => !file.isDirectory && loadFile(file.relativePath)}
                  className={`group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition ${
                    selectedFile === file.relativePath
                      ? 'bg-cyan-950/70 text-cyan-200 border border-cyan-800/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {file.isDirectory ? (
                      <Folder className="w-3.5 h-3.5 text-amber-500/80" />
                    ) : (
                      getFileIcon(file.name)
                    )}
                    <span className="truncate">{file.name}</span>
                  </div>

                  {!file.isDirectory && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(file.relativePath);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-rose-400 transition"
                      title="Delete file"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Center / Right: Code Editor & Execution Bar */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          {/* File Tab Bar */}
          <div className="px-3 py-2 border-b border-slate-900 bg-slate-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedFile ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-slate-200">
                  {getFileIcon(selectedFile)}
                  <span className="font-semibold">{selectedFile}</span>
                  {isModified && <span className="w-2 h-2 rounded-full bg-cyan-400"></span>}
                </div>
              ) : (
                <span className="text-xs text-slate-500">No file open</span>
              )}
            </div>

            {/* Editor Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveFile}
                disabled={savingFile || !selectedFile || !isModified}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition ${
                  isModified
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white font-bold'
                    : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingFile ? 'Saving...' : 'Save File'}</span>
              </button>

              <button
                onClick={handleRunCurrentFile}
                disabled={!selectedFile || runningCommand}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm shadow-emerald-950"
                title="Execute currently open file in host terminal"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Execute File</span>
              </button>
            </div>
          </div>

          {/* Textarea Editor */}
          <div className="flex-1 relative overflow-hidden bg-black/60">
            {loadingFile ? (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 gap-2">
                <RotateCw className="w-4 h-4 animate-spin text-cyan-400" />
                Loading file from disk...
              </div>
            ) : selectedFile ? (
              <textarea
                value={fileContent}
                onChange={(e) => {
                  setFileContent(e.target.value);
                  setIsModified(true);
                }}
                spellCheck={false}
                className="w-full h-full p-4 bg-transparent text-slate-200 font-mono text-xs leading-relaxed resize-none focus:outline-none selection:bg-cyan-900/60"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 text-xs">
                <FileCode className="w-10 h-10 mb-2 opacity-30" />
                <span>Select a file from the left workspace tree to view and edit</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Panel: Interactive Host Machine Terminal */}
      <div
        style={{ height: `${termHeight}px` }}
        className="border-t border-slate-900 bg-black flex flex-col transition-all overflow-hidden"
      >
        {/* Terminal Header & Quick Buttons */}
        <div className="px-3 py-2 border-b border-slate-900 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TerminalIcon className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-300">HOST TERMINAL & SHELL</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
              Direct Machine Access
            </span>
          </div>

          {/* Quick Command Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {quickCommands.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleExecuteTerminal(q.cmd)}
                disabled={runningCommand}
                className="px-2 py-0.5 rounded text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 transition"
              >
                {q.label}
              </button>
            ))}
            <button
              onClick={() => setTerminalEntries([])}
              className="text-[10px] text-slate-500 hover:text-rose-400 px-1.5 py-0.5 ml-2"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Terminal Output Stream */}
        <div className="flex-1 overflow-y-auto p-3 text-xs space-y-2 select-text font-mono">
          {terminalEntries.length === 0 ? (
            <div className="text-slate-600 text-[11px]">
              Hell_Gate Machine Shell ready. Commands run with direct machine permissions in the workspace directory.
            </div>
          ) : (
            terminalEntries.map((entry) => (
              <div key={entry.id} className="space-y-0.5">
                <div className="flex items-center gap-2 text-cyan-400 text-[11px]">
                  <span>$ {entry.command}</span>
                  <span className="text-slate-600 text-[9px]">
                    ({entry.durationMs}ms - {entry.timestamp})
                  </span>
                </div>
                {entry.stdout && (
                  <pre className="text-slate-300 whitespace-pre-wrap text-[11px] leading-relaxed pl-2 border-l border-slate-800">
                    {entry.stdout}
                  </pre>
                )}
                {entry.stderr && (
                  <pre className="text-rose-400 whitespace-pre-wrap text-[11px] leading-relaxed pl-2 border-l border-rose-900">
                    {entry.stderr}
                  </pre>
                )}
              </div>
            ))
          )}
          {runningCommand && (
            <div className="text-cyan-400 text-[11px] flex items-center gap-2 animate-pulse">
              <RotateCw className="w-3 h-3 animate-spin" />
              <span>Executing process on host machine...</span>
            </div>
          )}
        </div>

        {/* Terminal Input Line */}
        <div className="p-2 border-t border-slate-900 bg-slate-950/80 flex items-center gap-2">
          <span className="text-cyan-400 text-xs font-bold pl-2">$</span>
          <input
            type="text"
            value={terminalCommand}
            onChange={(e) => setTerminalCommand(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleExecuteTerminal();
            }}
            placeholder="Type any bash/shell command (e.g. ls, pip list, python3, npm)..."
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-600 focus:outline-none font-mono"
          />
          <button
            onClick={() => handleExecuteTerminal()}
            disabled={runningCommand || !terminalCommand.trim()}
            className="px-3 py-1 bg-cyan-700 hover:bg-cyan-600 disabled:bg-slate-900 disabled:text-slate-600 text-white rounded text-xs font-bold transition"
          >
            Run
          </button>
        </div>
      </div>
    </div>
  );
};
