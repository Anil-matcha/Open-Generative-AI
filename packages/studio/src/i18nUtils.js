// Tiny, dependency-free locale-copy resolver shared by every Studio
// component in this package.
//
// Design: each component ships its own English default bundle (source of
// truth for keys/shape) plus one override bundle per additional locale.
// `resolveCopy` deep-merges the override over English so a partial
// translation still renders — missing keys fall back to English rather
// than showing `undefined`. This mirrors the merge behavior in the host
// app's `lib/locales.js` (see Open-Higgsfield-ai/lib/locales.js) but is
// duplicated here (not imported) so this package has no dependency on the
// consuming app's file layout — it only needs a `locale` string prop.
//
// Adding a new locale to a component: add `../messages/<locale>/<name>.json`
// next to the existing `en`/`zh` bundles, import it, and pass it into
// `resolveCopy(en, localeBundles[locale], locale)`. No changes needed here.

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function mergeCopy(base, override) {
  if (!override) return base;
  if (!base) return override;
  if (!isPlainObject(base) || !isPlainObject(override)) return override;

  const merged = { ...base };
  for (const key of Object.keys(override)) {
    merged[key] = isPlainObject(base[key]) && isPlainObject(override[key])
      ? mergeCopy(base[key], override[key])
      : override[key];
  }
  return merged;
}

// `en` is the required default bundle; `localeBundle` is the override for
// the active `locale` (or undefined/null when only English exists yet, or
// when locale === 'en'). Always returns a fully-populated copy object.
export function resolveCopy(en, localeBundle, locale) {
  if (!locale || locale === 'en') return en;
  return mergeCopy(en, localeBundle);
}
