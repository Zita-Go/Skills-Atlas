// Pure helpers — no Workers runtime deps, so node --test can exercise them.

export const EVENT_TYPES = new Set([
  // web (11)
  'use_open', 'copy_plugin', 'copy_cli', 'ai_recommend',
  'search', 'search_zero', 'view_switch', 'panel_open',
  'err_skillmd', 'err_js', 'err_ai',
  // cli/plugin (8)
  'cli_cmd', 'cli_install', 'ap_suggest', 'ap_accept', 'ap_dismiss', 'onboard', 'cli_err', 'skill_created',
]);

const STR_MAX = 200;

export function clampStr(s, n = STR_MAX) {
  return typeof s === 'string' ? s.slice(0, n) : null;
}

export function uaFamily(ua) {
  const s = typeof ua === 'string' ? ua : '';
  if (/\bEdg\//.test(s)) return 'Edge';
  if (/\bOPR\/|\bOpera\b/.test(s)) return 'Opera';
  if (/\bChrome\//.test(s)) return 'Chrome';
  if (/\bFirefox\//.test(s)) return 'Firefox';
  if (/\bSafari\//.test(s)) return 'Safari';
  return 'other';
}

export function refHost(referer) {
  try { return new URL(referer).host; } catch { return ''; }
}

// raw = one client event; derived = server-side {ts, ref, ua, client}. Returns a row or null.
export function normalizeEvent(raw, derived) {
  if (!raw || !EVENT_TYPES.has(raw.type)) return null;
  return {
    ts: derived.ts,
    type: raw.type,
    target: clampStr(raw.target),
    category: clampStr(raw.category, 80),
    source: clampStr(raw.source, 80),
    lang: clampStr(raw.lang, 8),
    view: clampStr(raw.view, 16),
    sid: clampStr(raw.sid, 16),
    ref: derived.ref || '',
    ua: derived.ua || 'other',
    ver: clampStr(raw.ver, 40),
    detail: clampStr(raw.detail),
    client: derived.client || 'web',
    os: clampStr(raw.os, 24),
    iid: clampStr(raw.iid, 40),
  };
}
