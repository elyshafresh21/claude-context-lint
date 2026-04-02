import type { AuditResult, Recommendation } from './types.js';

export function generateRecommendations(result: AuditResult): Recommendation[] {
  const recs: Recommendation[] = [];
  let priority = 0;

  // MCP: flag servers with many tools (high on-fetch cost when invoked)
  const heavyServers = result.mcp.servers.filter(s => s.toolCount > 15).sort((a, b) => b.toolCount - a.toolCount);
  if (heavyServers.length > 0) {
    recs.push({
      priority: ++priority,
      action: `${heavyServers.length} MCP server${heavyServers.length > 1 ? 's' : ''} with large tool sets`,
      savings: 0,
      detail: heavyServers
        .map(s => `  ${s.name}: ${s.toolCount} tools (${s.onFetchTokens.toLocaleString()} tokens when fetched)`)
        .join('\n') + '\n  ToolSearch defers these automatically, but each fetch adds to context.',
    });
  }

  // Skills: flag duplicates
  if (result.skills.duplicates.length > 0) {
    recs.push({
      priority: ++priority,
      action: `Consolidate ${result.skills.duplicates.length} near-duplicate skill${result.skills.duplicates.length > 1 ? 's' : ''}`,
      savings: result.skills.duplicateTokenSavings,
      detail: result.skills.duplicates
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5)
        .map(d => `  "${d.skill1}" ↔ "${d.skill2}" (${(d.similarity * 100).toFixed(0)}% similar)`)
        .join('\n'),
    });
  }

  // Skills: flag large listing descriptions (>50 listing tokens = very long description)
  const largeListings = result.skills.skills.filter(s => s.tokens > 50).sort((a, b) => b.tokens - a.tokens);
  if (largeListings.length > 0) {
    const top = largeListings.slice(0, 5);
    const savings = largeListings.reduce((sum, s) => sum + Math.floor(s.tokens * 0.4), 0);
    recs.push({
      priority: ++priority,
      action: `Shorten ${largeListings.length} verbose skill descriptions`,
      savings,
      detail: top
        .map(s => `  ${s.name}: ${s.tokens} listing tokens (${s.fullTokens.toLocaleString()} full)`)
        .join('\n'),
    });
  }

  // Skills: flag very large full content (>3000 tokens on invocation)
  const heavySkills = result.skills.skills.filter(s => s.fullTokens > 3000).sort((a, b) => b.fullTokens - a.fullTokens);
  if (heavySkills.length > 0) {
    recs.push({
      priority: ++priority,
      action: `${heavySkills.length} skills load >3,000 tokens when invoked`,
      savings: 0,
      detail: heavySkills
        .slice(0, 5)
        .map(s => `  ${s.name}: ${s.fullTokens.toLocaleString()} tokens on invocation`)
        .join('\n') + '\n  Consider splitting or compressing these skills.',
    });
  }

  // CLAUDE.md: flag large files
  const largeMd = result.claudeMd.files.filter(f => f.tokens > 1000).sort((a, b) => b.tokens - a.tokens);
  if (largeMd.length > 0) {
    const savings = largeMd.reduce((sum, f) => sum + Math.floor(f.tokens * 0.2), 0);
    recs.push({
      priority: ++priority,
      action: `Compress CLAUDE.md (${result.claudeMd.totalTokens.toLocaleString()} tokens)`,
      savings,
      detail: largeMd
        .map(f => `  ${f.filePath}: ${f.tokens.toLocaleString()} tokens`)
        .join('\n'),
    });
  }

  // Overall: flag if total overhead is >20% of context
  if (result.percentUsed > 20) {
    recs.push({
      priority: ++priority,
      action: `Total overhead is ${result.percentUsed.toFixed(1)}% — target <15%`,
      savings: 0,
      detail: `${result.totalTokens.toLocaleString()} tokens consumed before any conversation begins.`,
    });
  }

  // Sort by savings descending
  recs.sort((a, b) => b.savings - a.savings);
  recs.forEach((r, i) => (r.priority = i + 1));

  return recs;
}
