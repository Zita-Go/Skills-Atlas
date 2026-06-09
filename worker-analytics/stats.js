// Canned read-out aggregates over the `events` table. Each query takes ONE bound param: a `ts`
// cutoff (0 = all-time). Pure — the caller injects the D1 binding. Covers web + cli + funnel.
export const QUERIES = {
  topSkills:    "SELECT target, COUNT(*) n FROM events WHERE ts>=? AND type IN ('use_open','copy_plugin','copy_cli') AND target IS NOT NULL AND target!='' GROUP BY target ORDER BY n DESC LIMIT 25",
  copySplit:    "SELECT type, COUNT(*) n FROM events WHERE ts>=? AND type IN ('copy_plugin','copy_cli') GROUP BY type",
  topInstalls:  "SELECT target, COUNT(*) n FROM events WHERE ts>=? AND type='cli_install' AND detail='ok' AND target!='' GROUP BY target ORDER BY n DESC LIMIT 25",
  skillsCreated:"SELECT target, COUNT(*) n FROM events WHERE ts>=? AND type='skill_created' AND target!='' GROUP BY target ORDER BY n DESC LIMIT 25",
  autopilot:    "SELECT type, COUNT(*) n FROM events WHERE ts>=? AND type IN ('ap_suggest','ap_accept','ap_dismiss') GROUP BY type",
  funnel:       "SELECT target, COUNT(DISTINCT iid) installs, COUNT(*) n FROM events WHERE ts>=? AND type='onboard' GROUP BY target ORDER BY n DESC",
  zeroSearches: "SELECT target, COUNT(*) n FROM events WHERE ts>=? AND type='search_zero' AND target!='' GROUP BY target ORDER BY n DESC LIMIT 25",
  errorsByType: "SELECT type, COUNT(*) n FROM events WHERE ts>=? AND (type LIKE 'err\\_%' ESCAPE '\\' OR type='cli_err') GROUP BY type ORDER BY n DESC",
  brokenSkillmd:"SELECT detail, COUNT(*) n FROM events WHERE ts>=? AND type='err_skillmd' AND detail IS NOT NULL AND detail!='' GROUP BY detail ORDER BY n DESC LIMIT 25",
  cliCommands:  "SELECT target, COUNT(*) n FROM events WHERE ts>=? AND type='cli_cmd' AND target!='' GROUP BY target ORDER BY n DESC LIMIT 25",
  clientTotals: "SELECT client, COUNT(*) n FROM events WHERE ts>=? GROUP BY client",
};

export async function runStats(db, cutoff) {
  const out = {};
  for (const [key, sql] of Object.entries(QUERIES)) {
    const r = await db.prepare(sql).bind(cutoff).all();
    out[key] = (r && r.results) || [];
  }
  return out;
}
