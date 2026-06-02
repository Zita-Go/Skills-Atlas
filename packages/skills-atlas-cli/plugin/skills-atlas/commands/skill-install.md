---
description: Install an AI agent skill from the Skills Atlas into this project and activate it now
argument-hint: <skill> [--force]
allowed-tools: Bash(skills-atlas:*)
---

!`skills-atlas install $ARGUMENTS --inline --yes --project`

The skill was installed into **this project** (`./.claude/skills/`) AND its
`SKILL.md` is printed above (between the "SKILL.md (active for this task)"
markers). **Apply that SKILL.md's instructions right now** for the user's current
task — no session restart is needed; the folder is also saved so it loads
automatically in future sessions of this project.

- Want it available in **every** project instead? Tell the user to run
  `skills-atlas use <skill>` themselves (that installs globally to `~/.claude/skills/`).
- If the source is a whole-repo / marketplace installer (no per-skill folder),
  there's no SKILL.md to apply — surface the exact install command printed above.
- If it stopped because the skill already exists, offer to re-run with `--force`.
