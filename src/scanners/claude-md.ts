import * as fs from 'fs';
import * as path from 'path';
import { countTokens } from '../tokenizer.js';
import type { ClaudeMdResult, TokenCount } from '../types.js';

const CLAUDE_MD_NAMES = ['CLAUDE.md', 'CLAUDE.local.md'];

/**
 * Find all CLAUDE.md files in the project and user home directory.
 * Claude Code loads: project CLAUDE.md, parent dirs' CLAUDE.md, ~/.claude/CLAUDE.md
 */
export function scanClaudeMd(projectPath: string): ClaudeMdResult {
  const files: TokenCount[] = [];

  // Project-level CLAUDE.md files (walk up to 3 parent dirs)
  let dir = path.resolve(projectPath);
  const visited = new Set<string>();
  for (let i = 0; i < 4; i++) {
    if (visited.has(dir)) break;
    visited.add(dir);
    for (const name of CLAUDE_MD_NAMES) {
      const filePath = path.join(dir, name);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        files.push({
          filePath: filePath,
          tokens: countTokens(content),
          label: name,
        });
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  // Global ~/.claude/CLAUDE.md
  const home = process.env.HOME || process.env.USERPROFILE || '';
  if (home) {
    for (const name of CLAUDE_MD_NAMES) {
      const globalPath = path.join(home, '.claude', name);
      if (fs.existsSync(globalPath) && !visited.has(path.dirname(globalPath))) {
        const content = fs.readFileSync(globalPath, 'utf-8');
        files.push({
          filePath: globalPath,
          tokens: countTokens(content),
          label: `~/.claude/${name}`,
        });
      }
    }
  }

  return {
    files,
    totalTokens: files.reduce((sum, f) => sum + f.tokens, 0),
  };
}
