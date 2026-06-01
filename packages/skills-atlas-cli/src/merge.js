// Merge a base catalog with private overlays. Private vendors are tagged `_private`
// so `vendorsFor` ranks them first on a same-name clash. Pure — returns a new object,
// never mutates inputs, and the result lives only in memory (never cached).
'use strict';

function mergeCatalogs(base, overlays = []) {
  const vendors = { ...(base.vendors || {}) };
  const sections = [...(base.sections || [])];
  for (const ov of overlays) {
    if (!ov) continue;
    for (const [id, v] of Object.entries(ov.vendors || {})) vendors[id] = { ...v, _private: true };
    for (const s of (ov.sections || [])) sections.push(s);
  }
  return { sections, vendors };
}

module.exports = { mergeCatalogs };
