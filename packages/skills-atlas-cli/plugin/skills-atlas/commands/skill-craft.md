---
description: Codify a multi-step workflow you keep repeating into a new local skill, drafted from your own usage
argument-hint: (no arguments)
allowed-tools: Bash(skills-atlas:*)
---

!`skills-atlas craft`

The output above is an instruction addressed to YOU. Follow it exactly:

- It hands you a recurring multi-step procedure detected from the user's own activity,
  the evidence behind it, and Anthropic's skill-authoring rules.
- First extract the user-specific DELTA (their real commands / paths / flags / formats /
  the corrections they keep re-issuing). You may read ./CLAUDE.md, existing
  ./.claude/skills/*/SKILL.md, a Makefile, etc. to confirm their actual conventions.
- Write the skill to `./.claude/skills/<name>/SKILL.md` encoding ONLY that delta, then
  show the user the path + full contents as a DRAFT for them to review and edit.
- If there is no genuine user-specific delta (just generic steps any assistant already
  does), do NOT write a file — say so in one line. A missing file is the correct outcome.

Do not commit it or take further action unless the user asks.
