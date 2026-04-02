import * as fs from 'fs';
import * as path from 'path';
import fg from 'fast-glob';
import { countTokens, wordSimilarity } from '../tokenizer.js';
import type { SkillsResult, SkillInfo, DuplicatePair } from '../types.js';

const DUPLICATE_THRESHOLD = 0.75;

function parseSkillFrontmatter(content: string): { name: string; description: string } {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return { name: '', description: '' };
  const fm = match[1];
  const name = fm.match(/name:\s*["']?(.+?)["']?\s*$/m)?.[1] || '';
  const description = fm.match(/description:\s*["']?(.+?)["']?\s*$/m)?.[1] || '';
  return { name, description };
}

/**
 * Scan all skill files in .claude/skills/ (project + global).
 *
 * Token accounting:
 * - "listing tokens": The skill name + description one-liner injected into every system prompt
 * - "full tokens": The complete SKILL.md content, only loaded when the skill is invoked
 *
 * The per-turn overhead is the LISTING tokens, not the full content.
 */
export function scanSkills(projectPath: string): SkillsResult {
  const skills: SkillInfo[] = [];

  const searchDirs = [
    path.join(projectPath, '.claude', 'skills'),
  ];

  const home = process.env.HOME || process.env.USERPROFILE || '';
  if (home) {
    searchDirs.push(path.join(home, '.claude', 'skills'));
  }

  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fg.sync('**/SKILL.md', { cwd: dir, absolute: true, followSymbolicLinks: false });
    for (const filePath of files) {
      let content: string;
      try {
        content = fs.readFileSync(filePath, 'utf-8');
      } catch {
        continue; // skip unreadable files
      }
      const { name, description } = parseSkillFrontmatter(content);
      const skillName = name || path.basename(path.dirname(filePath));
      const desc = description || content.slice(0, 200);

      // The listing line that appears in every system prompt:
      // "- skillName: description text here..."
      const listingLine = `- ${skillName}: ${desc}`;
      const listingTokens = countTokens(listingLine);

      skills.push({
        name: skillName,
        description: desc,
        filePath,
        tokens: listingTokens,
        fullTokens: countTokens(content),
      });
    }
  }

  // Detect duplicates via description similarity
  const duplicates: DuplicatePair[] = [];
  for (let i = 0; i < skills.length; i++) {
    for (let j = i + 1; j < skills.length; j++) {
      const sim = wordSimilarity(skills[i].description, skills[j].description);
      if (sim >= DUPLICATE_THRESHOLD) {
        duplicates.push({
          skill1: skills[i].name,
          skill2: skills[j].name,
          similarity: sim,
          potentialSavings: Math.min(skills[i].tokens, skills[j].tokens),
        });
      }
    }
  }

  const duplicateTokenSavings = duplicates.reduce((sum, d) => sum + d.potentialSavings, 0);

  return {
    skills,
    totalTokens: skills.reduce((sum, s) => sum + s.tokens, 0),
    duplicates,
    duplicateTokenSavings,
  };
}
