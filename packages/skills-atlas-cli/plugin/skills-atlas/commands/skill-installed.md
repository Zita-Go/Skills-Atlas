---
description: List the agent skills installed in this project and globally
argument-hint: (no arguments)
allowed-tools: Bash(skills-atlas:*)
---

!`skills-atlas installed`

Summarize for the user what's installed and where — project (`./.claude/skills/`) vs
global (`~/.claude/skills/`) — grouped clearly. If something looks unused, you may point
to `/skills-atlas:skill-prune` (which reviews recent activity) or `skills-atlas remove
<skill>`. List only skills shown in the output above; don't invent any.
