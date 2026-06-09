// Single-source dashboard UI, served by the worker at GET /dashboard. Data stays gated by
// STATS_TOKEN (same-origin /stats), so only you can see it. Also works as a local file.
// NOTE: this markup is embedded in a template literal — it must contain no backticks, no ${},
// and no backslashes (the one trailing-slash regex uses /[/]+$/ instead of /\/+$/).
export const DASHBOARD_HTML = `<!doctype html>
<meta charset="utf-8">
<title>Skills Atlas — private analytics</title>
<style>
  body{font:14px/1.5 system-ui,sans-serif;margin:24px;max-width:1000px;color:#1a1a2e;background:#fafafe}
  h1{font-size:18px} h2{font-size:14px;margin:22px 0 6px;color:#3b3b6b}
  .bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px}
  input,select,button{font:inherit;padding:6px 9px;border:1px solid #ccd;border-radius:6px}
  input[size]{min-width:320px}
  button{background:#4b5bd4;color:#fff;border-color:transparent;cursor:pointer}
  table{border-collapse:collapse;width:100%;margin:4px 0 12px}
  th,td{border-bottom:1px solid #eee;padding:4px 8px;text-align:left;font-variant-numeric:tabular-nums}
  td:last-child,th:last-child{text-align:right}
  .muted{color:#889} code{background:#eef;padding:1px 5px;border-radius:4px}
  input[type=checkbox]{min-width:auto;padding:0;cursor:pointer}
  #err{color:#c0392b}
</style>
<h1>Skills Atlas — private analytics</h1>
<p class="muted">Private read-out — data is gated by your <code>STATS_TOKEN</code> (set with <code>wrangler secret put STATS_TOKEN</code>), so only you can see it. The endpoint defaults to this worker.</p>
<div class="bar">
  <input id="ep" size="40" placeholder="https://skills-atlas-analytics.<sub>.workers.dev">
  <input id="tok" size="24" type="password" placeholder="STATS_TOKEN">
  <select id="days"><option value="0">all time</option><option value="7">7d</option><option value="30">30d</option><option value="90">90d</option></select>
  <button id="load">Load</button>
  <label class="muted"><input type="checkbox" id="auto"> auto-refresh 60s</label>
</div>
<div id="err"></div>
<div id="out"></div>
<script>
  const $ = id => document.getElementById(id);
  for (const k of ['ep','tok']) { try { $(k).value = localStorage.getItem('sa_'+k) || ''; } catch(e){} }
  if (!$('ep').value && location.protocol.indexOf('http') === 0) $('ep').value = location.origin;
  let autoTimer = null;
  function table(rows){
    if(!rows || !rows.length) return '<p class="muted">— none —</p>';
    const cols = Object.keys(rows[0]);
    const head = '<tr>'+cols.map(c=>'<th>'+c+'</th>').join('')+'</tr>';
    const body = rows.map(r=>'<tr>'+cols.map(c=>'<td>'+String(r[c]==null?'':r[c]).replace(/[<>&]/g,s=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[s]))+'</td>').join('')+'</tr>').join('');
    return '<table>'+head+body+'</table>';
  }
  const TITLES = { topSkills:'Top skills (open + copy)', copySplit:'Copy: plugin vs CLI', topInstalls:'Top CLI installs', autopilot:'Autopilot: suggest / accept / dismiss', funnel:'Onboarding funnel (by install)', zeroSearches:'Zero-result searches (gaps)', errorsByType:'Errors by type', brokenSkillmd:'Broken SKILL.md (curation)', cliCommands:'CLI command usage', clientTotals:'Volume: web / cli / plugin' };
  async function load(){
    $('err').textContent=''; $('out').innerHTML='';
    const ep = $('ep').value.trim().replace(/[/]+$/,''), tok = $('tok').value.trim();
    try { localStorage.setItem('sa_ep',ep); localStorage.setItem('sa_tok',tok); } catch(e){}
    if(!ep || !tok){ $('err').textContent='Enter the token (the endpoint defaults to this worker).'; return; }
    let data;
    try {
      const res = await fetch(ep+'/stats?token='+encodeURIComponent(tok)+'&days='+$('days').value);
      if(!res.ok){ $('err').textContent = 'HTTP '+res.status+(res.status===401?' — bad token':res.status===503?' — STATS_TOKEN not set on the worker':''); return; }
      data = await res.json();
    } catch(e){ $('err').textContent = 'fetch failed: '+e.message; return; }
    const s = data.stats || {};
    let html = '<p class="muted">window: '+(data.days?data.days+'d':'all time')+' · updated '+new Date().toLocaleTimeString()+(autoTimer?' · auto-refresh 60s':'')+'</p>';
    for(const k of Object.keys(TITLES)) html += '<h2>'+TITLES[k]+'</h2>'+table(s[k]);
    for(const k of Object.keys(s)) if(!(k in TITLES)) html += '<h2>'+k+'</h2>'+table(s[k]);
    $('out').innerHTML = html;
  }
  $('load').addEventListener('click', load);
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
