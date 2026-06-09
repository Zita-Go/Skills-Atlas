'use strict';
const t = require('../telemetry');
const HELP = `usage: skills-atlas telemetry [on | off | status]

Anonymous, opt-out usage telemetry (no prompts, paths, identity, or IP). On by default.
  on       enable
  off      disable (you can also set DO_NOT_TRACK=1)
  status   show the current state`;
module.exports = async function telemetry(argv) {
  const sub = argv[0];
  if (sub === 'on') { t.setEnabled(true); console.log('✓ telemetry on'); return; }
  if (sub === 'off') { t.setEnabled(false); console.log('✓ telemetry off — nothing will be sent'); return; }
  if (sub === '-h' || sub === '--help') { console.log(HELP); return; }
  if (sub && sub !== 'status') { console.log(HELP); return; }
  const st = t.state();
  console.log(`telemetry:  ${st.enabled ? 'on' : 'off'}`);
  console.log(`endpoint:   ${t.endpoint() ? 'configured' : 'not configured (inert)'}`);
  if (st.iid) console.log(`install id: ${st.iid} (anonymous)`);
  console.log(`config:     ${t.configFile()}`);
};
