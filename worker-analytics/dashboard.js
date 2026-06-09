// Single-source dashboard UI, served by the worker at GET /dashboard. Data stays gated by
// STATS_TOKEN (same-origin /stats), so only you can see it. Also works as a local file.
// NOTE: this markup is embedded in a template literal — it must contain no backticks, no ${},
// and no backslashes (the trailing-slash regex uses /[/]+$/, and number checks avoid \d).
export const DASHBOARD_HTML = `<!doctype html>
<meta charset="utf-8">
<title>Skills Atlas — private analytics</title>
<style>
  :root{--ink:#1a1a2e;--mut:#7a7a96;--line:#e6e6f0;--accent:#6b7cf0}
  *{box-sizing:border-box}
  body{font:14px/1.5 system-ui,-apple-system,sans-serif;margin:0;padding:22px;color:var(--ink);background:#f6f7fb}
  h1{font-size:18px;margin:0 0 4px}
  .sub{color:var(--mut);margin:0 0 14px;font-size:12.5px}
  .bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:14px}
  input,select,button{font:inherit;padding:7px 10px;border:1px solid #ccd;border-radius:8px;background:#fff}
  input[size]{min-width:300px}
  button{background:var(--accent);color:#fff;border-color:transparent;cursor:pointer;font-weight:600}
  input[type=checkbox]{min-width:auto;padding:0;cursor:pointer}
  code{background:#eef;padding:1px 5px;border-radius:4px;font-size:.9em}
  .muted{color:var(--mut)}
  #err{color:#c0392b;margin:6px 0}
  .meta{color:var(--mut);font-size:12px;margin:0 0 12px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(430px,1fr));gap:14px}
  .card{border:1px solid var(--line);border-radius:12px;padding:13px 15px;background:#fff;box-shadow:0 1px 2px rgba(20,20,60,.04)}
  .card.danger{border-color:#f3c7c1;background:#fff8f7}
  .card h2{margin:0 0 9px;font-size:13px;color:#3b3b6b;font-weight:600}
  .chart{display:flex;flex-direction:column;gap:5px}
  .row{display:grid;grid-template-columns:minmax(70px,40%) 1fr auto;gap:9px;align-items:center;font-size:12.5px}
  .lbl{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#33335a}
  .track{background:#eef0fb;border-radius:6px;height:13px;overflow:hidden}
  .fill{display:block;height:100%;background:linear-gradient(90deg,#6b7cf0,#9aa6ff);border-radius:6px}
  .card.danger .fill{background:linear-gradient(90deg,#e05a4a,#f1968a)}
  .val{font-variant-numeric:tabular-nums;font-weight:600;color:#2b2b50;text-align:right;white-space:nowrap}
  .val small{color:var(--mut);font-weight:400}
</style>
<h1>Skills Atlas — private analytics</h1>
<p class="sub">Private read-out — data is gated by your <code>STATS_TOKEN</code> (set with <code>wrangler secret put STATS_TOKEN</code>), so only you can see it. The endpoint defaults to this worker.</p>
<div class="bar">
  <input id="ep" size="38" placeholder="https://skills-atlas-analytics.<sub>.workers.dev">
  <input id="tok" size="22" type="password" placeholder="STATS_TOKEN">
  <select id="days"><option value="0">all time</option><option value="7">7d</option><option value="30">30d</option><option value="90">90d</option></select>
  <select id="client"><option value="">all clients</option><option value="plugin">plugin (in Claude Code)</option><option value="web">web</option><option value="cli">cli (terminal)</option></select>
  <button id="load">Load</button>
  <label class="muted"><input type="checkbox" id="auto"> auto-refresh 60s</label>
</div>
<div id="err"></div>
<div id="out"></div>
<script>
  const $ = id => document.getElementById(id);
  for (const k of ['ep','tok']) { try { $(k).value = localStorage.getItem('sa_'+k) || ''; } catch(e){} }
  try { $('client').value = localStorage.getItem('sa_client') || ''; } catch(e){}
  if (!$('ep').value && location.protocol.indexOf('http') === 0) $('ep').value = location.origin;
  let autoTimer = null;
  const TITLES = { clientTotals:'Volume: web / cli / plugin', funnel:'Onboarding funnel (by install)', autopilot:'Autopilot: suggest / accept / dismiss', topSkills:'Top skills (open + copy)', topInstalls:'Top CLI installs', skillsCreated:'Skills created (craft)', copySplit:'Copy: plugin vs CLI', cliCommands:'CLI command usage', zeroSearches:'Zero-result searches (gaps)', brokenSkillmd:'Broken SKILL.md (curation)', errorsByType:'Errors by type' };
  const ORDER = Object.keys(TITLES);
  const DANGER = { errorsByType:1, brokenSkillmd:1 };
  function esc(s){ return String(s==null?'':s).replace(/[<>&]/g, c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c])); }
  function fmt(v){ const n = Number(v); return (v!=='' && v!=null && Number.isFinite(n)) ? n.toLocaleString() : String(v==null?'':v); }
  function chart(rows){
    if(!rows || !rows.length) return '<p class="muted">— none —</p>';
    const cols = Object.keys(rows[0]);
    const valCol = cols.indexOf('n') >= 0 ? 'n' : cols[cols.length-1];
    const labelCol = cols.find(c => c !== valCol && c !== 'installs') || cols[0];
    let max = 0; for(const r of rows){ const v = Number(r[valCol])||0; if(v>max) max=v; }
    if(!max) max = 1;
    return '<div class="chart">' + rows.map(r=>{
      const v = Number(r[valCol])||0;
      const pct = Math.max(2, Math.round(v/max*100));
      const extra = (r.installs != null && labelCol !== 'installs') ? ' <small>· '+fmt(r.installs)+' installs</small>' : '';
      return '<div class="row"><span class="lbl" title="'+esc(r[labelCol])+'">'+esc(r[labelCol])+'</span>'
        + '<span class="track"><span class="fill" style="width:'+pct+'%"></span></span>'
        + '<span class="val">'+fmt(v)+extra+'</span></div>';
    }).join('') + '</div>';
  }
  function cardAutopilot(rows){
    const m = {}; for(const r of (rows||[])) m[r.type] = Number(r.n)||0;
    const sg = m.ap_suggest||0, ac = m.ap_accept||0, di = m.ap_dismiss||0;
    const labeled = [
      { metric:'proposed (to agent)', n: sg },
      { metric:'accepted (installed)', n: ac },
      { metric:'dismissed', n: di },
    ];
    const rate = sg ? Math.round(ac/sg*100) : 0;
    const note = '<p class="muted" style="font-size:11px;margin:9px 0 0;line-height:1.5">Accept rate <b>'+rate+'%</b> ('+fmt(ac)+' / '+fmt(sg)+' proposed). “Proposed” = surfaced to Claude as context; you only see it if Claude relays it — so this counts proposals, not what the user saw. <b>accepted</b> (the user installed it) is the real signal.</p>';
    return '<section class="card"><h2>Autopilot — proposed → accepted</h2>'+chart(labeled)+note+'</section>';
  }
  function card(key, rows){
    if(key === 'autopilot') return cardAutopilot(rows);
    return '<section class="card'+(DANGER[key]?' danger':'')+'"><h2>'+(TITLES[key]||key)+'</h2>'+chart(rows)+'</section>';
  }
  async function load(){
    $('err').textContent='';
    const ep = $('ep').value.trim().replace(/[/]+$/,''), tok = $('tok').value.trim();
    try { localStorage.setItem('sa_ep',ep); localStorage.setItem('sa_tok',tok); localStorage.setItem('sa_client',$('client').value); } catch(e){}
    if(!ep || !tok){ $('err').textContent='Enter the token (the endpoint defaults to this worker).'; return; }
    let data;
    try {
      const res = await fetch(ep+'/stats?token='+encodeURIComponent(tok)+'&days='+$('days').value+'&client='+$('client').value);
      if(!res.ok){ $('err').textContent = 'HTTP '+res.status+(res.status===401?' — bad token':res.status===503?' — STATS_TOKEN not set on the worker':''); return; }
      data = await res.json();
    } catch(e){ $('err').textContent = 'fetch failed: '+e.message; return; }
    const s = data.stats || {};
    let cards = '';
    for(const k of ORDER) if(k in s) cards += card(k, s[k]);
    for(const k of Object.keys(s)) if(ORDER.indexOf(k) < 0) cards += card(k, s[k]);
    $('out').innerHTML = '<p class="meta">window: '+(data.days?data.days+'d':'all time')+' · client: '+(data.client||'all')+' · updated '+new Date().toLocaleTimeString()+(autoTimer?' · auto-refresh 60s':'')+'</p><div class="grid">'+cards+'</div>';
  }
  $('load').addEventListener('click', load);
  $('client').addEventListener('change', load);   // changing the filter re-queries immediately
  $('days').addEventListener('change', load);
  // Light "feels-live": auto-refresh re-fetches /stats every 60s while checked (still pull, no backend).
  function setAuto(){
    if(autoTimer){ clearInterval(autoTimer); autoTimer = null; }
    try { localStorage.setItem('sa_auto', $('auto').checked ? '1' : ''); } catch(e){}
    if($('auto').checked){ autoTimer = setInterval(load, 60000); load(); }
  }
  try { $('auto').checked = localStorage.getItem('sa_auto') === '1'; } catch(e){}
  $('auto').addEventListener('change', setAuto);
  if($('auto').checked) setAuto();
</script>
`;
