# Skills Atlas — Claude Code plugin

Discover, install, manage, and **grow** agent skills **from inside a Claude Code
conversation**. A thin wrapper around the [`skills-atlas-cli`](../) tool — no logic is
duplicated; everything shells out to the CLI.

## What you get

**An autopilot, on by default.** Installing the plugin registers a UserPromptSubmit hook
so Claude quietly suggests a catalog skill when your prompt lines up with one you don't
have, surfaces recurring capability gaps, and offers to codify a workflow you keep
repeating — each judged for fit before anything shows. Turn it off with
`skills-atlas hook off`; see controls with `skills-atlas hook status`. Nothing leaves
your machine.

**Slash commands:**

| Command | What it does |
|---|---|
| `/skills-atlas:skill-search <query>` | Search the catalog and summarize matches |
| `/skills-atlas:skill-info <skill>` | Description + usage guidance for one skill |
| `/skills-atlas:skill-install <skill>` | Install + activate a skill in this project |
| `/skills-atlas:skill-installed` | List what's installed (project + global) |
| `/skills-atlas:skill-remove <skill>` | Uninstall a skill |
| `/skills-atlas:skill-kit` | Detect the project type and propose a curated kit (review first) |
| `/skills-atlas:skill-craft` | Codify a workflow you keep repeating into a new local skill |
| `/skills-atlas:skill-gaps` | Recommend skills for the work you keep doing |
| `/skills-atlas:skill-prune` | Suggest installed skills you no longer use |
| `/skills-atlas:skill-doctor` | Health-check your installed skills |

The always-available `skill-finder` skill lets Claude reach for these on its own whenever
you ask to find, install, manage, or create a skill.

## Prerequisite

The plugin's commands and hook call the CLI — install it:

```bash
npm i -g skills-atlas-cli
```

## Install the plugin

From GitHub (recommended):

```text
/plugin marketplace add Zita-Go/Skills-Atlas
/plugin install skills-atlas@skills-atlas
```

Or from a local checkout of this repo:

```text
/plugin marketplace add <path-to>/skills-atlas/packages/skills-atlas-cli/plugin
/plugin install skills-atlas@skills-atlas
```

Run `/reload-plugins` (or start a new session) so the hook, commands, and skill load.

## Manual alternative (no marketplace)

```bash
cp skills-atlas/commands/*.md            ~/.claude/commands/
cp -r skills-atlas/skills/skill-finder   ~/.claude/skills/
```

(The manual copy gives you the commands + skill but not the autopilot hook; enable that
with `skills-atlas hook on`.) Then start a new session and try `/skill-search seo`.
