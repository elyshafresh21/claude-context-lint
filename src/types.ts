export interface TokenCount {
  tokens: number;
  filePath: string;
  label?: string;
}

export interface ClaudeMdResult {
  files: TokenCount[];
  totalTokens: number;
}

export interface SkillInfo {
  name: string;
  description: string;
  filePath: string;
  tokens: number;       // listing tokens (name + description one-liner, injected every turn)
  fullTokens: number;   // full SKILL.md content (only loaded on invocation)
}

export interface DuplicatePair {
  skill1: string;
  skill2: string;
  similarity: number;
  potentialSavings: number;
}

export interface SkillsResult {
  skills: SkillInfo[];
  totalTokens: number;
  duplicates: DuplicatePair[];
  duplicateTokenSavings: number;
}

export interface McpServerInfo {
  name: string;
  toolCount: number;
  estimatedTokens: number;
  isDeferred: boolean;
}

export interface McpResult {
  servers: McpServerInfo[];
  totalTokens: number;
  potentialSavings: number;
}

export interface SystemPromptResult {
  estimatedTokens: number;
  breakdown: { label: string; tokens: number }[];
}

export interface AuditResult {
  claudeMd: ClaudeMdResult;
  skills: SkillsResult;
  mcp: McpResult;
  systemPrompt: SystemPromptResult;
  totalTokens: number;
  contextLimit: number;
  percentUsed: number;
}

export interface Recommendation {
  priority: number;
  action: string;
  savings: number;
  detail: string;
}

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
