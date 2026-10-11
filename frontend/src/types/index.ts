export type ActiveTab = 'agent' | 'ide' | 'media' | 'local-ai' | 'system';

export type AgentEngineMode = 'auto' | 'cloud-antigravity' | 'fenrir-autonomous' | 'local-agent';

export interface AgentStep {
  id: string;
  type: 'thought' | 'tool_call' | 'tool_result' | 'model_output' | 'error';
  title: string;
  details?: string;
  timestamp: string;
  durationMs?: number;
}

export interface AgentExecutionResult {
  success: boolean;
  engine: string;
  output: string;
  steps: AgentStep[];
  error?: string;
  isRegionBlocked?: boolean;
  recommendation?: string;
}

export interface FileItem {
  name: string;
  path: string;
  relativePath: string;
  isDirectory: boolean;
  size: number;
  updatedAt: string;
  children?: FileItem[];
}

export interface SystemTelemetry {
  status: string;
  platform: string;
  arch: string;
  release: string;
  hostname: string;
  uptimeSeconds: number;
  cpu: {
    model: string;
    cores: number;
    loadAvg: number[];
  };
  memory: {
    totalBytes: number;
    freeBytes: number;
    usedBytes: number;
    usedPercent: number;
  };
  nodeVersion: string;
  workspaceDir: string;
  hasEnvKey: boolean;
}

export interface LocalModelStatus {
  ollama: {
    connected: boolean;
    models: string[];
    url: string;
    error?: string;
  };
  lmStudio: {
    connected: boolean;
    models: string[];
    url: string;
    error?: string;
  };
}

export interface UserAuth {
  isLoggedIn: boolean;
  userEmail: string | null;
  userName: string | null;
  userAvatar: string | null;
  authProvider: 'google' | 'api-key' | 'anonymous';
  geminiApiKey: string | null;
  isKeyVerified: boolean;
}

export interface TerminalEntry {
  id: string;
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  timestamp: string;
}
