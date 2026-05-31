# Skills Atlas — Claude Code plugin

A thin wrapper around the [`skills-atlas-cli`](../) tool so you can discover and
install agent skills **from inside a Claude Code conversation**.

It adds three slash commands and one always-available skill that all shell out to
the `skills-atlas` CLI — no logic is duplicated.

| Command | What it does |
|---|---|
| `/skills-atlas:skill-search <query>` | Search the catalog and summarize matches |
| `/skills-atlas:skill-info <skill>` | Show description + usage guidance for one skill |
| `/skills-atlas:skill-install <skill>` | Install a skill into `.claude/skills/` |

The `skill-finder` skill lets Claude reach for these on its own whenever you ask
to find or install a skill.

## Prerequisite

Install the CLI — the plugin's commands call it:

```bash
npm i -g skills-atlas-cli
```

## Install the plugin

From GitHub (recommended — uses the marketplace at the repo root):

```text
/plugin marketplace add Zita-Go/Skills-Atlas
/plugin install skills-atlas@skills-atlas
```

Or from a local checkout of this repo:

```text
/plugin marketplace add <path-to>/skills-atlas/packages/skills-atlas-cli/plugin
/plugin install skills-atlas@skills-atlas-cli
```

## Manual alternative (no marketplace)

Copy the command and skill files into your Claude config:

```bash
cp skills-atlas/commands/*.md            ~/.claude/commands/
cp -r skills-atlas/skills/skill-finder   ~/.claude/skills/
```

Then start a new session and try `/skill-search seo`.
