---
description: Install an AI agent skill from the Skills Atlas into .claude/skills/
argument-hint: <skill> [--project] [--force]
allowed-tools: Bash(skills-atlas:*)
---

!`skills-atlas install $ARGUMENTS --yes`

Report the outcome to the user:
- If a skill folder was installed, give the destination path, briefly explain when
  and how to use the skill, and remind them to start a new Claude Code session to
  load it (then invoke it by name).
- If the source is a whole-repo / marketplace / CLI installer (no per-skill
  folder), surface the exact command printed above for them to run — do not treat
  this as a failure.
- If it stopped because the skill already exists, offer to re-run with `--force`.
