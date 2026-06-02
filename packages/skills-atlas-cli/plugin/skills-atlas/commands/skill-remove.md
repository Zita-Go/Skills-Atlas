---
description: Uninstall an agent skill (project scope by default; --global for the global copy)
argument-hint: <skill> [--global]
allowed-tools: Bash(skills-atlas:*)
---

!`skills-atlas remove $ARGUMENTS --yes`

Confirm to the user exactly what was removed and from which scope. Note on scope:
`skills-atlas remove` defaults to the **global** copy (`~/.claude/skills/`). Skills
installed from a conversation go into the **project** (`./.claude/skills/`) — to remove
one of those, the args must include `--project`. If the skill wasn't installed in the
scope tried, relay that and run `/skills-atlas:skill-installed` to show what is, then
re-run with the right scope.
