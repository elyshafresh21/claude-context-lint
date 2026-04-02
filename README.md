# claude-context-lint

> Audit your Claude Code setup and find exactly where tokens are being wasted.

[![Built by Claude Code](https://img.shields.io/badge/Built%20by-Claude%20Code-blueviolet)](https://claude.ai/code)
[![npm version](https://img.shields.io/npm/v/claude-context-lint)](https://www.npmjs.com/package/claude-context-lint)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Every Claude Code conversation starts with overhead: your CLAUDE.md files, skill descriptions, MCP tool schemas, and the base system prompt all consume context tokens **before you type a single word**. This tool makes that invisible cost visible.

## Quick Start

```bash
npx claude-context-lint
```

Or install globally:

```bash
npm install -g claude-context-lint
claude-context-lint
```

## Example Output

```
  Claude Code Context Audit
  ────────────────────────────────────────────────────
  CLAUDE.md                1,240 tokens     █░░░░░░░░░░░░░░░░░░░
    CLAUDE.md                          1,240 tokens

  Skills (32 loaded)       4,800 tokens     ████░░░░░░░░░░░░░░░░  MEDIUM
    Listing overhead (per-turn):    4,800 tokens
    Full content (on invocation):   89,200 tokens
    ⚠ 3 near-duplicate skills detected (−420 tokens)
    api-helper                   120 listing      3,200 full
    db-migrate                   105 listing      2,800 full
    test-runner                   98 listing      1,950 full
    ... and 29 more

  MCP Servers (3)          480 tokens       ░░░░░░░░░░░░░░░░░░░░  LOW
    Deferred listing (per-turn):    480 tokens
    Full schemas (when fetched):    9,600 tokens
    postgres               330 listing     (22 tools) 6,600 on fetch
    filesystem              90 listing     (6 tools)  1,800 on fetch
    memory                  60 listing     (4 tools)  1,200 on fetch

  System Prompt            8,500 tokens     ██████████████░░░░░░ (base overhead)
  ────────────────────────────────────────────────────
  TOTAL OVERHEAD:        14,180 tokens
  Context Limit:         200,000 tokens
  Used Before Input:     7.1% ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░

  TOP RECOMMENDATIONS
  ────────────────────────────────────────────────────
  1. Shorten 12 verbose skill descriptions
     −1,840 tokens
  2. Consolidate 3 near-duplicate skills
     −420 tokens
  3. 1 MCP server with large tool set
     postgres: 22 tools (6,600 tokens when fetched)

  Potential savings: 2,260 tokens (15.9% reduction)
```

## What It Scans

| Category | What it finds | How it counts |
|----------|---------------|---------------|
| **CLAUDE.md** | Project + parent dirs + `~/.claude/CLAUDE.md` | Exact token estimate of each file |
| **Skills** | All `.claude/skills/**/SKILL.md` files | **Listing tokens** (per-turn cost of name+description) and **full tokens** (on-invocation cost) |
| **MCP Servers** | `.mcp.json` + `settings.json` configs | Tool count × estimated tokens per schema |
| **System Prompt** | Claude Code's base instructions | Fixed estimate (~8,500 tokens) |

### Skill Token Accounting

Claude Code doesn't inject full skill content every turn. It injects a **listing** (skill name + description one-liner) into the system prompt, and only loads the **full SKILL.md** when invoked. This tool reports both:

- **Listing tokens**: Your per-turn cost (what matters for context efficiency)
- **Full tokens**: What loads when a skill is triggered (matters for complex conversations)

### Duplicate Detection

Skills with >75% word overlap in their descriptions are flagged as near-duplicates. Uses Jaccard similarity on word sets, filtering stop words under 3 characters.

### MCP Tool Estimation

ToolSearch is on by default in Claude Code, so MCP tools are automatically deferred (only names listed in the system prompt, ~15 tokens each). When Claude decides to use a tool, it fetches the full schema on demand (~300 tokens per tool). This tool reports both costs: the per-turn listing overhead and the on-fetch cost when tools are actually invoked.

## Options

```
Usage: claude-context-lint [options]

Options:
  -p, --path <path>     Project path to audit (default: current directory)
  -c, --context <size>  Context window size: opus, sonnet, haiku, opus-1m,
                        or a number (default: "opus" = 200K)
  --json                Output as JSON (structured data on stdout)
  -V, --version         Output version number
  -h, --help            Display help
```

### Examples

```bash
# Audit current directory
claude-context-lint

# Audit a specific project
claude-context-lint --path ~/my-project

# Check overhead against 1M context window
claude-context-lint --context opus-1m

# Get machine-readable output for scripting
claude-context-lint --json | jq '.percentUsed'
```

## Why This Matters

Claude Code users with many skills can burn **5-15% of their context window** on setup overhead before any conversation begins. Common culprits:

- **Verbose skill descriptions** that repeat boilerplate in every listing
- **Near-duplicate skills** with overlapping trigger patterns
- **Large CLAUDE.md files** that could be compressed
- **Many MCP servers** adding up in deferred tool listings

This overhead is invisible. This tool makes it visible, with specific numbers and actionable recommendations.

## Attribution

This project was entirely designed, written, and published by [Claude Code](https://claude.ai/code).

## License

MIT
