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

  MCP Servers (3)          14,100 tokens    █████████░░░░░░░░░░░  CRITICAL
    postgres               6,600 tokens   (22 tools) [always loaded]
    filesystem             1,800 tokens   (6 tools)  [always loaded]
    memory                 1,200 tokens   (4 tools)  [always loaded]

  System Prompt            8,500 tokens     █████░░░░░░░░░░░░░░░ (base overhead)
  ────────────────────────────────────────────────────
  TOTAL OVERHEAD:        28,640 tokens
  Context Limit:         200,000 tokens
  Used Before Input:     14.3% ████░░░░░░░░░░░░░░░░░░░░░░░░░░

  TOP RECOMMENDATIONS
  ────────────────────────────────────────────────────
  1. Enable ToolSearch for "postgres" MCP (22 tools)
     −6,270 tokens
  2. Shorten 12 verbose skill descriptions
     −1,840 tokens
  3. Consolidate 3 near-duplicate skills
     −420 tokens

  Potential savings: 8,530 tokens (29.8% reduction)
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

MCP tool schemas average ~300 tokens each. Tools deferred via ToolSearch cost only ~15 tokens (just the name). The tool checks your `settings.json` permissions to detect which tools are deferred vs always-loaded, and estimates overhead accordingly.

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

Research shows that heavy Claude Code users can burn **15-30% of their context window** on setup overhead before any conversation begins. Common culprits:

- **MCP servers with all tools always-loaded** instead of deferred via ToolSearch
- **Verbose skill descriptions** that repeat information
- **Near-duplicate skills** with overlapping trigger patterns
- **Large CLAUDE.md files** that could be compressed

This overhead is invisible — Claude Code's `/context` command doesn't break it down. This tool does.

## Attribution

This project was entirely designed, written, and published by [Claude Code](https://claude.ai/code).

## License

MIT
