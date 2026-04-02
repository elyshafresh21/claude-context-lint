import chalk from 'chalk';
import type { AuditResult, Recommendation, Severity } from './types.js';

const BAR_WIDTH = 20;

function bar(ratio: number, width = BAR_WIDTH): string {
  const clamped = Math.min(Math.max(ratio, 0), 1);
  const filled = Math.round(clamped * width);
  const empty = width - filled;
  return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}

function severityBadge(tokens: number, total: number): string {
  const pct = total > 0 ? (tokens / total) * 100 : 0;
  let severity: Severity;
  if (pct > 40) severity = 'CRITICAL';
  else if (pct > 25) severity = 'HIGH';
  else if (pct > 10) severity = 'MEDIUM';
  else severity = 'LOW';

  const colors: Record<Severity, (s: string) => string> = {
    CRITICAL: chalk.bgRed.white.bold,
    HIGH: chalk.red.bold,
    MEDIUM: chalk.yellow,
    LOW: chalk.green,
  };
  return colors[severity](` ${severity} `);
}

function padRight(str: string, len: number): string {
  return str.length >= len ? str : str + ' '.repeat(len - str.length);
}

function fmt(n: number): string {
  return n.toLocaleString();
}

export function printReport(result: AuditResult, recommendations: Recommendation[]): void {
  const { claudeMd, skills, mcp, systemPrompt } = result;
  const total = Math.max(result.totalTokens, 1);

  console.log('');
  console.log(chalk.bold.cyan('  Claude Code Context Audit'));
  console.log(chalk.gray('  ' + '─'.repeat(52)));

  // CLAUDE.md
  console.log(
    `  ${padRight('CLAUDE.md', 24)} ${padRight(fmt(claudeMd.totalTokens) + ' tokens', 16)} ${bar(claudeMd.totalTokens / total)}`
  );
  for (const f of claudeMd.files) {
    const label = f.label || f.filePath;
    console.log(chalk.gray(`    ${padRight(label, 34)} ${fmt(f.tokens)} tokens`));
  }

  // Skills — show listing overhead (per-turn cost)
  const fullSkillTokens = skills.skills.reduce((s, sk) => s + sk.fullTokens, 0);
  console.log('');
  console.log(
    `  ${padRight(`Skills (${skills.skills.length} loaded)`, 24)} ${padRight(fmt(skills.totalTokens) + ' tokens', 16)} ${bar(skills.totalTokens / total)} ${severityBadge(skills.totalTokens, total)}`
  );
  console.log(chalk.gray(`    Listing overhead (per-turn):    ${fmt(skills.totalTokens)} tokens`));
  console.log(chalk.gray(`    Full content (on invocation):   ${fmt(fullSkillTokens)} tokens`));
  if (skills.duplicates.length > 0) {
    console.log(chalk.yellow(`    ⚠ ${skills.duplicates.length} near-duplicate skill${skills.duplicates.length > 1 ? 's' : ''} detected (−${fmt(skills.duplicateTokenSavings)} tokens)`));
  }
  // Top 5 largest by listing tokens
  const topSkills = [...skills.skills].sort((a, b) => b.tokens - a.tokens).slice(0, 5);
  for (const s of topSkills) {
    console.log(chalk.gray(`    ${padRight(s.name, 28)} ${padRight(fmt(s.tokens) + ' listing', 16)} ${fmt(s.fullTokens)} full`));
  }
  if (skills.skills.length > 5) {
    console.log(chalk.gray(`    ... and ${skills.skills.length - 5} more`));
  }

  // MCP Servers
  console.log('');
  console.log(
    `  ${padRight(`MCP Servers (${mcp.servers.length})`, 24)} ${padRight(fmt(mcp.totalTokens) + ' tokens', 16)} ${bar(mcp.totalTokens / total)} ${severityBadge(mcp.totalTokens, total)}`
  );
  for (const s of mcp.servers) {
    const tag = s.isDeferred ? chalk.green(' [deferred]') : chalk.yellow(' [always loaded]');
    console.log(chalk.gray(`    ${padRight(s.name, 22)} ${padRight(fmt(s.estimatedTokens) + ' tokens', 14)} (${s.toolCount} tools)${tag}`));
  }
  if (mcp.servers.length === 0) {
    console.log(chalk.gray('    No MCP servers configured'));
  }

  // System prompt
  console.log('');
  console.log(
    `  ${padRight('System Prompt', 24)} ${padRight(fmt(systemPrompt.estimatedTokens) + ' tokens', 16)} ${bar(systemPrompt.estimatedTokens / total)} ${chalk.gray('(base overhead)')}`
  );

  // Total
  console.log(chalk.gray('  ' + '─'.repeat(52)));
  console.log(chalk.bold(`  TOTAL OVERHEAD:        ${fmt(result.totalTokens)} tokens`));
  console.log(`  Context Limit:         ${fmt(result.contextLimit)} tokens`);

  const pctBar = bar(result.percentUsed / 100, 30);
  const pctColor = result.percentUsed > 25 ? chalk.red : result.percentUsed > 15 ? chalk.yellow : chalk.green;
  console.log(`  Used Before Input:     ${pctColor(result.percentUsed.toFixed(1) + '%')} ${pctBar}`);

  // Recommendations
  if (recommendations.length > 0) {
    console.log('');
    console.log(chalk.bold.cyan('  TOP RECOMMENDATIONS'));
    console.log(chalk.gray('  ' + '─'.repeat(52)));

    for (const rec of recommendations.slice(0, 8)) {
      const savingsStr = rec.savings > 0 ? chalk.green(`−${fmt(rec.savings)} tokens`) : '';
      console.log(`  ${chalk.bold.white(String(rec.priority) + '.')} ${rec.action}`);
      if (savingsStr) console.log(`     ${savingsStr}`);
      if (rec.detail) {
        for (const line of rec.detail.split('\n')) {
          console.log(chalk.gray(`     ${line}`));
        }
      }
    }

    const totalSavings = recommendations.reduce((sum, r) => sum + r.savings, 0);
    if (totalSavings > 0) {
      const reductionPct = ((totalSavings / result.totalTokens) * 100).toFixed(1);
      console.log('');
      console.log(chalk.bold.green(`  Potential savings: ${fmt(totalSavings)} tokens (${reductionPct}% reduction)`));
    }
  }

  console.log('');
}
