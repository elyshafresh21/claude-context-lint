import * as fs from 'fs';
import * as path from 'path';
import type { McpResult, McpServerInfo } from '../types.js';

// Average tokens per MCP tool definition (name + description + parameter schema)
const TOKENS_PER_TOOL = 300;
// Tokens for a deferred/ToolSearch tool (just the name, no schema)
const TOKENS_PER_DEFERRED_TOOL = 15;

interface McpConfig {
  mcpServers?: Record<string, { command?: string; args?: string[]; env?: Record<string, string> }>;
}

interface SettingsJson extends McpConfig {
  allowedTools?: string[];
  permissions?: { allow?: string[]; deny?: string[] };
  enabledMcpjsonServers?: string[];
}

function readJsonSafe<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

// Known tool counts for common MCP servers
const KNOWN_SERVERS: Record<string, number> = {
  'postgres': 22,
  'postgresql': 22,
  '@henkey/postgres': 22,
  '@anthropic/mcp-postgres': 22,
  'serena': 28,
  'gmail': 2,
  'claude_ai_gmail': 2,
  'claude_ai_google_calendar': 3,
  'google-calendar': 3,
  'slack': 8,
  'github': 15,
  'filesystem': 6,
  'brave-search': 2,
  'puppeteer': 8,
  'sqlite': 12,
  'memory': 4,
  'fetch': 2,
  'sequential-thinking': 1,
  'gemini-proxy': 5,
  'gemini': 5,
};

/**
 * Scan MCP server configurations from .mcp.json and settings.json files.
 * Estimates token overhead based on tool count heuristics.
 */
export function scanMcp(projectPath: string): McpResult {
  const allMcpServers: Record<string, { command?: string; args?: string[] }> = {};
  const allowedTools = new Set<string>();

  const home = process.env.HOME || process.env.USERPROFILE || '';

  // 1. Read .mcp.json files (primary MCP config location)
  const mcpJsonPaths = [
    path.join(projectPath, '.mcp.json'),
    path.join(projectPath, '.mcp.local.json'),
  ];
  if (home) {
    mcpJsonPaths.push(path.join(home, '.claude', '.mcp.json'));
  }

  for (const mp of mcpJsonPaths) {
    const config = readJsonSafe<McpConfig>(mp);
    if (config?.mcpServers) {
      Object.assign(allMcpServers, config.mcpServers);
    }
  }

  // 2. Read settings.json for MCP servers defined there + allowed tools
  const settingsPaths = [
    path.join(projectPath, '.claude', 'settings.json'),
    path.join(projectPath, '.claude', 'settings.local.json'),
  ];
  if (home) {
    settingsPaths.push(path.join(home, '.claude', 'settings.json'));
    settingsPaths.push(path.join(home, '.claude', 'settings.local.json'));
  }

  for (const sp of settingsPaths) {
    const settings = readJsonSafe<SettingsJson>(sp);
    if (!settings) continue;
    if (settings.mcpServers) {
      Object.assign(allMcpServers, settings.mcpServers);
    }
    if (settings.permissions?.allow) {
      for (const t of settings.permissions.allow) allowedTools.add(t);
    }
    if (settings.allowedTools) {
      for (const t of settings.allowedTools) allowedTools.add(t);
    }
  }

  // 3. Build server info
  const servers: McpServerInfo[] = [];

  for (const [name, config] of Object.entries(allMcpServers)) {
    let toolCount = 10; // default estimate
    const nameLower = name.toLowerCase();

    // Match against config key name first (most reliable), then command string
    if (nameLower in KNOWN_SERVERS) {
      toolCount = KNOWN_SERVERS[nameLower];
    } else {
      const cmdLower = [config.command || '', ...(config.args || [])].join(' ').toLowerCase();
      for (const [knownName, count] of Object.entries(KNOWN_SERVERS)) {
        if (cmdLower.includes(knownName)) {
          toolCount = count;
          break;
        }
      }
    }

    // Check deferred status from allowed tools
    const mcpPrefix = `mcp__${name}__`;
    const hasWildcard = allowedTools.has(`${mcpPrefix}*`) || allowedTools.has('*:**');
    const specificAllowed = [...allowedTools].filter(t => t.startsWith(mcpPrefix) && !t.includes('*'));

    const alwaysLoaded = hasWildcard ? toolCount : specificAllowed.length;
    const deferred = Math.max(0, toolCount - alwaysLoaded);

    const estimatedTokens = (alwaysLoaded * TOKENS_PER_TOOL) + (deferred * TOKENS_PER_DEFERRED_TOOL);

    servers.push({
      name,
      toolCount,
      estimatedTokens,
      isDeferred: deferred > 0,
    });
  }

  const totalTokens = servers.reduce((sum, s) => sum + s.estimatedTokens, 0);
  const potentialSavings = servers.reduce((sum, s) => {
    if (!s.isDeferred) {
      return sum + (s.toolCount * TOKENS_PER_TOOL) - (s.toolCount * TOKENS_PER_DEFERRED_TOOL);
    }
    return sum;
  }, 0);

  return { servers, totalTokens, potentialSavings };
}
