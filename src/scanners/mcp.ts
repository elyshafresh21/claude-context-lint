import * as fs from 'fs';
import * as path from 'path';
import type { McpResult, McpServerInfo } from '../types.js';

// Tokens for a deferred tool (just the name listed in system-reminder, no schema)
const TOKENS_PER_DEFERRED_TOOL = 15;
// Tokens when a tool is fetched via ToolSearch (full schema loaded on demand)
const TOKENS_PER_FETCHED_TOOL = 300;

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
 *
 * ToolSearch is ON by default in Claude Code. When tool-token count crosses
 * a threshold, tools are automatically deferred (only names listed in the
 * system prompt, full schemas fetched on demand via ToolSearch).
 *
 * This scanner reports the deferred (name-only) cost as the per-turn overhead,
 * and the on-fetch cost for when tools are actually invoked.
 */
export function scanMcp(projectPath: string): McpResult {
  // Credentials in .mcp.json stay in local vars, intentionally excluded from output
  const allMcpServers: Record<string, { command?: string; args?: string[] }> = {};

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

  // 2. Read settings.json for MCP servers defined there
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
  }

  // 3. Build server info
  // ToolSearch is on by default: all MCP tools are deferred (name-only in system prompt).
  // Full schemas are fetched on demand when Claude decides to use a tool.
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

    // All tools deferred by default (ToolSearch is automatic)
    const deferredTokens = toolCount * TOKENS_PER_DEFERRED_TOOL;
    const onFetchTokens = toolCount * TOKENS_PER_FETCHED_TOOL;

    servers.push({
      name,
      toolCount,
      estimatedTokens: deferredTokens,
      onFetchTokens,
      isDeferred: true,
    });
  }

  const totalTokens = servers.reduce((sum, s) => sum + s.estimatedTokens, 0);

  return { servers, totalTokens, potentialSavings: 0 };
}
