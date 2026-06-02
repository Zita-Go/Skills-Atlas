---
description: Review your recent activity and recommend agent skills for the kinds of work you keep doing
argument-hint: (no arguments)
allowed-tools: Bash(skills-atlas:*)
---

!`skills-atlas gaps`

The output above is your recent activity plus an instruction addressed to YOU. Follow it:

- Spot any recurring KIND of work the user keeps doing that an installable catalog skill
  covers but they haven't installed. Ignore one-offs and anything already covered.
- Recommend **only** skills you can verify exist — run `skills-atlas info <skill>`
  (or `skills-atlas search "<intent>"`) first; quote names and install commands verbatim.
  Install with `skills-atlas use <skill> --yes --project`. Do not invent skills.
- If nothing clearly recurs, tell the user there are no gaps right now.
