#!/usr/bin/env node

import { Command } from 'commander';
import { scanClaudeMd } from './scanners/claude-md.js';
import { scanSkills } from './scanners/skills.js';
import { scanMcp } from './scanners/mcp.js';
import { generateRecommendations } from './recommendations.js';
import { printReport } from './reporter.js';
import type { AuditResult, SystemPromptResult } from './types.js';

const CONTEXT_LIMITS: Record<string, number> = {
  'opus': 200_000,
  'sonnet': 200_000,
  'haiku': 200_000,
  'opus-1m': 1_000_000,
};

function estimateSystemPrompt(): SystemPromptResult {
  // Claude Code injects: system prompt + built-in tool schemas + env/git info
  // Built-in tools: Bash, Read, Write, Edit, Glob, Grep, Agent, Skill, ToolSearch,
  // TaskCreate, TaskUpdate, WebFetch, WebSearch, NotebookEdit, etc. (~15 tools)
  return {
    estimatedTokens: 8500,
    breakdown: [
      { label: 'Core instructions', tokens: 2800 },
      { label: 'Built-in tool schemas (~15)', tokens: 3200 },
      { label: 'Git/commit/PR rules', tokens: 1200 },
      { label: 'Tone, style, env info', tokens: 800 },
      { label: 'Memory system instructions', tokens: 500 },
    ],
  };
}

function runAudit(projectPath: string, contextLimit: number): AuditResult {
  const claudeMd = scanClaudeMd(projectPath);
  const skills = scanSkills(projectPath);
  const mcp = scanMcp(projectPath);
  const systemPrompt = estimateSystemPrompt();

  const totalTokens = claudeMd.totalTokens + skills.totalTokens + mcp.totalTokens + systemPrompt.estimatedTokens;

  return {
    claudeMd,
    skills,
    mcp,
    systemPrompt,
    totalTokens,
    contextLimit,
    percentUsed: (totalTokens / contextLimit) * 100,
  };
}

const program = new Command();

program
  .name('claude-context-lint')
  .description('Audit your Claude Code setup and find where tokens are being wasted')
  .version('0.1.0')
  .option('-p, --path <path>', 'Project path to audit', process.cwd())
  .option('-c, --context <size>', 'Context window size (opus, sonnet, haiku, opus-1m, or number)', 'opus')
  .option('--json', 'Output as JSON')
  .action((opts) => {
    try {
      const projectPath = opts.path;
      let contextLimit: number;

      if (opts.context in CONTEXT_LIMITS) {
        contextLimit = CONTEXT_LIMITS[opts.context];
      } else {
        const parsed = parseInt(opts.context, 10);
        contextLimit = isNaN(parsed) ? 200_000 : parsed;
      }

      const result = runAudit(projectPath, contextLimit);
      const recommendations = generateRecommendations(result);

      if (opts.json) {
        // JSON mode: only structured data on stdout
        console.log(JSON.stringify({ ...result, recommendations }, null, 2));
      } else {
        printReport(result, recommendations);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`Error: ${msg}\n`);
      process.exit(1);
    }
  });

program.parse();
