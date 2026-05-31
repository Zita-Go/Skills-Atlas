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

The CLI must be on your `PATH`:

```bash
# once published:
npm i -g skills-atlas-cli
# or, for local dev from this repo:
cd packages/skills-atlas-cli && npm link
```

## Install the plugin

```text
/plugin marketplace add <path-to>/skills-atlas/packages/skills-atlas-cli/plugin
/plugin install skills-atlas@skills-atlas-cli
```

(Or add it straight from GitHub once published: `/plugin marketplace add Zita-Go/Skills-Atlas`.)

## Manual alternative (no marketplace)

Copy the command and skill files into your Claude config:

```bash
cp skills-atlas/commands/*.md            ~/.claude/commands/
cp -r skills-atlas/skills/skill-finder   ~/.claude/skills/
```

Then start a new session and try `/skill-search seo`.
