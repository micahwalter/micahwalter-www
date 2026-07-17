/**
 * Tag merge — union, case-normalize, de-dupe. Never removes existing tags.
 */

function normalizeTag(tag) {
  return String(tag || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function mergeTags(...lists) {
  const seen = new Set();
  const out = [];
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const raw of list) {
      const t = normalizeTag(raw);
      if (!t || t.length > 40 || seen.has(t)) continue;
      seen.add(t);
      out.push(t);
    }
  }
  return out;
}

module.exports = { normalizeTag, mergeTags };
