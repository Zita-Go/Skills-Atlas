'use strict';
// Hook-side, self-contained telemetry (the skills-atlas CLI may not be installed yet, so this
// cannot use src/telemetry.js). Fire-and-forget via a detached `node -e` POST. Honors the same
// off-switches: DO_NOT_TRACK, or a telemetry.json with {enabled:false}. Inert until ENDPOINT set.
const fs = require('fs');
const os = require('os');
const path = require('path');

const ENDPOINT = 'https://skills-atlas-analytics.zita-go.workers.dev/event'; // worker-analytics /event
function dnt() { const v = process.env.DO_NOT_TRACK; return v != null && v !== '' && v !== '0' && String(v).toLowerCase() !== 'false'; }
function offByConfig() {
  try {
    const f = path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'skills-atlas', 'telemetry.json');
    return JSON.parse(fs.readFileSync(f, 'utf8')).enabled === false;
  } catch { return false; }
}
module.exports = function emitOnboard(stage) {
  if (!ENDPOINT || dnt() || offByConfig()) return;
  try {
    const body = JSON.stringify({ client: 'plugin', events: [{ type: 'onboard', target: String(stage).slice(0, 40) }] });
    const code = "const ac=new AbortController();const t=setTimeout(()=>ac.abort(),2000);" +
      "fetch(" + JSON.stringify(ENDPOINT) + ",{method:'POST',headers:{'Content-Type':'application/json'},body:" + JSON.stringify(body) + ",signal:ac.signal}).catch(()=>{}).finally(()=>clearTimeout(t));";
    require('child_process').spawn(process.execPath, ['-e', code], { detached: true, stdio: 'ignore' }).unref();
  } catch { /* never block the hook */ }
};
