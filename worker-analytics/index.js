import { normalizeEvent, uaFamily, refHost } from './lib.js';
import { runStats } from './stats.js';

const DEFAULT_ALLOWED_ORIGINS = ['https://zita-go.github.io'];
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 60;
const MAX_BATCH = 50;
const ipBuckets = new Map();

function rateLimitOk(ip) {
  const now = Date.now();
  const recent = (ipBuckets.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) { ipBuckets.set(ip, recent); return false; }
  recent.push(now); ipBuckets.set(ip, recent);
  if (ipBuckets.size > 10_000) {
    for (const [k, v] of ipBuckets) if (v.every(t => now - t >= RATE_WINDOW_MS)) ipBuckets.delete(k);
  }
  return true;
}

function corsHeaders(origin, allowed) {
  return {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

const noContent = (cors) => new Response(null, { status: 204, headers: cors });

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(','))
      .split(',').map(s => s.trim()).filter(Boolean);
    const cors = corsHeaders(origin, allowed);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method === 'GET' && url.pathname === '/') {
      return new Response(JSON.stringify({ ok: true, service: 'skills-atlas-analytics' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...cors } });
    }
    if (request.method === 'GET' && url.pathname === '/stats') {
      const open = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
      if (!env.STATS_TOKEN) return new Response(JSON.stringify({ error: 'stats not configured' }), { status: 503, headers: open });
      if (!safeEqual(url.searchParams.get('token') || '', env.STATS_TOKEN)) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: open });
      const days = parseInt(url.searchParams.get('days') || '0', 10);
      const cutoff = days > 0 ? Date.now() - days * 86_400_000 : 0;
      try {
        const stats = await runStats(env.DB, cutoff);
        return new Response(JSON.stringify({ generatedAt: Date.now(), days: days || null, stats }), { status: 200, headers: open });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'query failed' }), { status: 500, headers: open });
      }
    }
    if (request.method !== 'POST' || url.pathname !== '/event') return noContent(cors);

    const hasOrigin = !!origin;
    if (hasOrigin && !allowed.includes(origin)) return noContent(cors);
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!rateLimitOk(ip)) return noContent(cors);

    let body;
    try { body = await request.json(); } catch { return noContent(cors); }
    const events = Array.isArray(body && body.events) ? body.events.slice(0, MAX_BATCH) : [];
    if (!events.length) return noContent(cors);

    const client = hasOrigin ? 'web' : (body.client === 'plugin' ? 'plugin' : 'cli');
    const derived = {
      ts: Date.now(),
      ref: refHost(request.headers.get('Referer') || ''),
      ua: uaFamily(request.headers.get('User-Agent') || ''),
      client,
    };
    const rows = events.map(e => normalizeEvent(e, derived)).filter(Boolean);
    if (!rows.length) return noContent(cors);

    try {
      const stmt = env.DB.prepare(
        'INSERT INTO events (ts,type,target,category,source,lang,view,sid,ref,ua,ver,detail,client,os,iid) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
      );
      await env.DB.batch(rows.map(r => stmt.bind(
        r.ts, r.type, r.target, r.category, r.source, r.lang, r.view, r.sid, r.ref, r.ua, r.ver, r.detail, r.client, r.os, r.iid
      )));
    } catch (_) { /* swallow — never retry-storm */ }

    return noContent(cors);
  },
};
