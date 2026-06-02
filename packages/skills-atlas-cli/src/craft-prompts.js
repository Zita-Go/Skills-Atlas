// The two model-facing prompts for feature ② "craft" (generative gap-filling),
// hardened by an adversarial multi-agent pass (drafts → critique → synthesis).
//
//  • DETECTION  — handed to the small background model (gap-analyze). Reads the user's
//                 recent prompts + matched catalog skills and emits exactly one of
//                 NONE / EXISTING <skill> / CRAFT: <pattern> | DELTA: <quoted artifact>.
//                 Biased hard toward NONE; the firewall is a QUOTABLE user-specific delta.
//  • CRAFT_INSTRUCTION — injected into the MAIN agent when the user runs `skills-atlas
//                 craft`. Distills the user's OWN repeated procedure into one SKILL.md,
//                 self-contained, delta-only, draft-for-review, never auto-active.
//
// Placeholders are filled by split/join (no regex, so `$` in the activity text is safe).
'use strict';

const DETECTION = `You read a developer's recent Claude Code requests and decide whether ONE recurring kind of work is worth acting on. Your default answer is NONE, and it is the right answer most of the time. Only an unmistakable, repeated, concrete signal overrides that default. When in any doubt, output NONE. It is far better to MISS a real pattern than to NAG the user with a weak, generic, or one-off one.

Recent requests (newest first):
{{ACTIVITY}}

Installable catalog skills that lexically matched this activity (these MAY be relevant — judge for yourself; lexical matching is shallow and may miss or misfire):
{{CANDIDATES}}

Already dismissed (never suggest and never craft these, or anything equivalent to them): {{DISMISSED}}
Already installed (a need one of these already covers is NOT uncovered — never CRAFT or recommend these): {{INSTALLED}}
Your project CLAUDE.md rules (excerpt; if a rule here already governs the procedure, it is covered → not CRAFT): {{CLAUDEMD}}

WHAT YOU SEE, AND ITS LIMITS. The list above is ONLY the user's own typed prompts, each truncated to ~100 characters, with no timestamps and no replies from the assistant. You therefore CANNOT see the assistant's answers, tool calls, diffs, or most of the corrections the user actually made. Do not pretend to. A task being phrased similarly several times is just how a routine recurring task looks — it is NOT, by itself, evidence that the user does it in a special way.

You output EXACTLY ONE of three verdicts and nothing else:
- NONE — nothing clearly recurs, the signal is too thin, or the recurring work has no user-specific, codifiable procedure. This is the common case.
- EXISTING — a real recurring need that ONE of the listed catalog skills already covers; the user just hasn't installed it.
- CRAFT — a recurring multi-step PROCEDURE the user performs in their OWN particular, visible way, that NO listed catalog skill covers, worth distilling into a new local skill from their actual workflow.

=== HARD PRECONDITIONS (if any fails → NONE) ===
- At least THREE separate, substantive requests in the list are clearly the SAME kind of work. Ignore filler and continuation prompts ("yes", "ok", "continue", "go on", "run it", "next", "thanks") and anything under ~5 words when counting — they are not independent requests.
- Those three must look spread across different occasions, not one continuous back-and-forth on a single task or feature. You have no timestamps, so if the three reasonably read as one focused session iterating on one thing, treat it as a single occasion → NONE.
- The evidence must be concrete in the text above. If you are inferring the pattern from one request plus imagination, or guessing what the user "probably" does off-screen, output NONE.
- If the activity is sparse, generic, or a scatter of unrelated tasks, output NONE.

=== PREFER EXISTING OVER CRAFT ===
An installable catalog skill beats authoring a new one. If a listed catalog skill plausibly covers the recurring need, choose EXISTING. Only consider CRAFT when no listed skill fits.

=== THE FOUR GATES FOR CRAFT — ALL must hold, or do NOT emit CRAFT ===

GATE 1 — RECURS. The same kind of work appears on 3+ distinct, substantive occasions (per the preconditions). Frequency is NECESSARY but NOT sufficient: it only proves the TOPIC recurs, never that there is anything user-specific to codify.

GATE 2 — IS A PROCEDURE. Multi-step work with an order or set of conventions — a workflow, checklist, or pipeline — NOT a single-shot task and NOT a standing one-line preference.
  - A single action is not a procedure: "fix this typo", "rename X", "explain this error", "translate this", "add an index". Reject.
  - A single standing preference is not a procedure: "always use tabs", "prefer named exports", "reply in Chinese", "PR titles start with the ticket id". That is a CLAUDE.md rule with no steps, NOT a skill. Reject → NONE.
  Test: "If I wrote this down, would it be an ORDERED list of several steps the user repeats, or just one instruction?" Only the ordered list passes. A multi-step task is still necessary-but-far-from-sufficient — most multi-step work is generic and dies at Gate 3.

GATE 3 — CARRIES A VISIBLE, USER-SPECIFIC DELTA (the firewall; apply it ruthlessly). The procedure must encode something a competent assistant would NOT already do by default — the user's OWN conventions: a named command/script/flag, a specific file path or layout, a fixed format or checklist they impose, a non-obvious ordering constraint, or a correction they explicitly keep re-issuing ("again", "like before", "not like that — do it our way", "you forgot X", "always do X first", "use OUR script/format").
  You may claim a delta ONLY if you can QUOTE the specific token(s) from the requests above that prove it — an exact command, filename, flag, path, format name, or explicit correction, appearing across the recurring requests. The delta must be QUOTABLE, not inferred from the topic.
  A REPEATED INSTRUCTION IS NOT, BY ITSELF, A DELTA. Because you see only the user's prompts (never the assistant's replies), a routine task naturally gets phrased the same way each time; that sameness is not a correction and not a convention. If the recurring steps are ones any competent assistant already performs (validate → handler → test, lint → test → commit, reproduce → fix → re-run, write up → down → migrate, write tests, run the linter, use clear names, handle errors), the delta is ZERO → NONE. A vague topic ("they do a lot of testing", "a deployment workflow") is not a delta.
  ANTI-CONFABULATION: You are forbidden from inventing a delta to justify CRAFT. If you cannot quote the evidence that proves a user-specific delta, the answer is NONE — even when the work clearly recurs and is multi-step. Recurrence + ordered steps WITHOUT a quotable delta = NONE. If your CRAFT line would contain only generic verbs (add / update / write / test / deploy / fix) and category nouns, output NONE. Specificity test: if the delta would survive find-replacing this project's name with any other project's, it is generic → NONE.

GATE 4 — NOT ALREADY COVERED. No listed catalog skill fits, nothing in "Already installed" covers it, and no CLAUDE.md rule above already handles it. An ABSENT candidate is NOT proof of "uncovered": lexical matching is shallow and may have missed a covering skill. For a common engineering task (testing, PR prep, releasing, migrations, adding endpoints, debugging), assume a catalog or built-in capability likely covers it and prefer EXISTING or NONE. Treat it as genuinely uncovered ONLY when the procedure is idiosyncratic to THIS user — which is exactly what Gate 3 must already have proven.

If all four gates hold AND no catalog skill fits → CRAFT. In every other case → NONE.

=== OUTPUT — emit EXACTLY ONE line, nothing before or after, no preamble, no markdown, no second line. Write the line (other than the literal word NONE) in {{LANG}}. ===

NONE
  — or —
EXISTING <skill-name> — one line: the recurring pattern + rough frequency (e.g. "~4 times") + why that listed catalog skill (named verbatim) covers it
  — or —
CRAFT: <one line naming the uncovered recurring multi-step procedure + its rough frequency as evidence> | DELTA: <the concrete user-specific thing it would encode, quoting the exact command / path / flag / format / correction you saw in the requests above>

Rules for the line:
- EXISTING <skill-name> must be one of the listed catalog skills, verbatim.
- CRAFT names the user's ACTUAL procedure, not a topic area, and you must be able to fill DELTA with a real quoted artifact. If you cannot, fall back to NONE.
- When the four gates are not ALL clearly satisfied, output NONE.`;

const CRAFT_INSTRUCTION = `[Skills Atlas — craft a skill from your own repeated workflow]

A background detector flagged a recurring multi-step procedure in the user's recent Claude Code activity that no installed or catalog skill appears to cover, and the user has now run \`skills-atlas craft\`. Your job is to draft a local project skill that codifies THE USER'S OWN procedure — self-evolution from their actual usage. You are distilling what THEY already do; you are NOT authoring a generic best-practice guide for a topic. The detector is deliberately conservative but works from thin evidence (the user's prompts, truncated, no replies); YOU have the real project in front of you, so part of your job is to VETO it when the signal doesn't hold up.

DETECTED PATTERN:
{{PATTERN}}

RELEVANT RECENT-ACTIVITY EVIDENCE (the user's own requests that show this procedure, newest first):
{{EVIDENCE}}

=== STEP 1 — EXTRACT THE DELTA, OR BAIL (do this before writing anything) ===
Find what makes THIS user's procedure non-obvious. Produce a concrete list of the user-specific artifacts: their exact commands, scripts, flags, file paths, naming conventions, ordering constraints, fixed formats/checklists, and especially any instruction they kept RE-ISSUING because the generic approach was wrong. Quote them from the evidence.

To ground this in reality rather than guessing, you MAY first read existing project files the evidence points at — ./CLAUDE.md, ~/.claude/CLAUDE.md, ./.claude/skills/*/SKILL.md, a Makefile/justfile, the test directory, an existing handler/migration the user keeps editing. Read only; write nothing except the one SKILL.md. Use these to confirm the user's ACTUAL conventions instead of inventing plausible ones.

Then apply the hard gate. Proceed to write ONLY if ALL hold:
1. The evidence shows the same multi-step procedure on more than one distinct occasion.
2. It is a genuine ordered procedure, not a single-shot task and not a single standing preference. If the only real signal is ONE standing rule (e.g. "regenerate the spec with \`make openapi\`, never the IDE plugin"), that belongs in CLAUDE.md, NOT a skill — say so and write nothing. Never pad one rule with generic steps to make it "skill-shaped".
3. You can quote at least TWO specific evidence lines (or grounding files) carrying the user's particular convention/format/flag/path/correction — something beyond how any competent assistant would already do this task. If that list is empty or only generic steps, STOP.
4. Nothing already installed (./.claude/skills/, ~/.claude/skills/), no listed catalog skill, and no CLAUDE.md rule already does this. Before choosing a name, list ./.claude/skills/* ; if a sibling already covers it, stop.

If any check fails, write NO file. Say in one line what you found and why it's not skill-worthy — e.g. "The pattern recurs but I can't see anything specific to how YOU do it — there's no delta worth a skill yet; tell me your conventions, or this may just belong in CLAUDE.md." Default to stopping: a missing file is the correct, safe outcome, and the user running \`craft\` is NOT itself evidence a delta exists. A skill that restates common knowledge is a failure, not a deliverable.

=== STEP 2 — CLARIFY ONLY IF GENUINELY AMBIGUOUS ===
If the procedure is real but one key convention is unclear from the evidence and the files, ask the user ONE focused question, then write. Otherwise write directly — do not interrogate them.

=== STEP 3 — WRITE THE SKILL.md ===
Write exactly ONE file: ./.claude/skills/<name>/SKILL.md (create the folder). Touch nothing else; do not run git; do not install or enable anything. You are the author — do not depend on any external skill-creator. Follow Anthropic's skill conventions exactly.

Frontmatter (YAML between --- fences, only these two keys):
- name: lowercase-with-hyphens, <=64 chars, in GERUND / action form naming the procedure (e.g. running-release-checks, preparing-pr-descriptions). It MUST match the <name> folder.
- description: third person, one or two sentences stating WHAT the skill does AND WHEN to use it, with concrete trigger terms drawn from the user's ACTUAL nouns in the evidence (their service/file/tool/format names), not the bare category word — so it auto-loads at the right moment. (e.g. "Runs the project's pre-release checklist. Use when cutting a release, tagging a version, or before publishing.")

Body (Markdown — encode ONLY the user-specific delta):
- Open with one line on when this applies.
- Then the CORE: the user's ACTUAL procedure as a clear ORDERED workflow or checklist — their real steps, in their order, with their exact commands / paths / file names / flags / formats inlined verbatim from the evidence. Where the user kept correcting or re-instructing something, make that an explicit, prominent step — those corrections are the whole point.
- If the user has a fixed output format or checklist, reproduce it as a template/code block exactly as they use it.
- Briefly note WHICH repeated requests (or which grounding file) each convention came from, so the user can confirm you did not invent it.
- End with a one-line provenance note, e.g.: "_Locally crafted by Skills Atlas, distilled from your own repeated workflow — review and edit freely; delete the folder to remove it._"

HARD CONSTRAINTS — the firewall against correct-but-useless output:
- Every numbered step MUST carry a user-specific token (a real command, path, flag, or named format). A step that is only a generic verb phrase ("write a test", "update the docs", "handle errors", "run the linter", "use clear names") must be DELETED — the assistant already does that by default. If, after deleting all generic steps, fewer than ~2 substantive delta-bearing steps remain, you do NOT have a skill — bail per Step 1.
- Challenge every token. Assume the reader is already a capable agent who knows generic best practice; write only what is specific to THIS user and THIS procedure. Keep SKILL.md tight and well under ~500 lines; most crafted skills are far shorter.
- Use progressive disclosure: push long reference material into a sibling file (one level deep) only if genuinely needed; most crafted skills are a single SKILL.md.
- Do not invent conventions the user has not shown. If unsure whether a step is theirs or generic, leave it out or mark it clearly for them to confirm.

=== STEP 4 — SHOW YOUR WORK ===
Print the path you wrote and the full SKILL.md contents. Tell the user this is a DRAFT distilled from their own usage: review and edit it, it loads automatically next session, and deleting the folder discards it. In one line, state the specific user-delta you encoded (and where it came from) so they can sanity-check you captured the right thing. Do not commit it or take any further action unless they ask. Reply in the user's language.`;

const fill = (tpl, map) =>
  Object.keys(map).reduce((s, k) => s.split('{{' + k + '}}').join(map[k]), tpl);

function detectionPrompt({ activity, candidates, dismissed, installed, claudeMd, lang }) {
  return fill(DETECTION, {
    ACTIVITY: activity, CANDIDATES: candidates, DISMISSED: dismissed,
    INSTALLED: installed, CLAUDEMD: claudeMd, LANG: lang,
  });
}
function craftPrompt({ pattern, evidence }) {
  return fill(CRAFT_INSTRUCTION, { PATTERN: pattern, EVIDENCE: evidence });
}

module.exports = { DETECTION, CRAFT_INSTRUCTION, detectionPrompt, craftPrompt };
