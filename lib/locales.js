// Locale registry for the standalone Open Generative AI studio app.
//
// This mirrors the additive-route architecture documented in the main
// muapi client (../../../docs/localization.md): English stays the
// default, unprefixed route tree; every other locale gets a parallel
// `/[[locale]]/...` route tree that reuses the same components with
// translated copy passed as a prop. There is no i18n routing library
// (no next-intl) — just a registry + plain JSON message bundles + a
// recursive merge so a partial translation still renders (falls back to
// English for any missing key).
//
// Adding a new locale: register it here with its message imports, then
// add a matching `app/<locale>/...` route wrapper tree that passes
// `locale="<locale>"` into the shared components. Do not add
// `locale === 'zh'`-style branches in shared components — read copy from
// this registry instead.

import enCommon from '../messages/en/common.json';
import zhCommon from '../messages/zh/common.json';

export const DEFAULT_LOCALE = 'en';

export const LOCALE_CONFIGS = {
  en: {
    code: 'en',
    nativeName: 'English',
    htmlLang: 'en',
    rootPath: '',
    messages: {
      common: enCommon,
    },
  },
  zh: {
    code: 'zh',
    nativeName: '中文',
    htmlLang: 'zh-CN',
    rootPath: '/zh',
    messages: {
      common: zhCommon,
    },
  },
};

export const SUPPORTED_LOCALES = Object.keys(LOCALE_CONFIGS);

export function isSupportedLocale(locale) {
  return Boolean(locale) && Object.prototype.hasOwnProperty.call(LOCALE_CONFIGS, locale);
}

// Registered locale prefixes, longest first, so `/zh-CN` (if ever added)
// would not falsely match under a shorter `/zh` prefix check.
const LOCALE_PREFIXES = Object.values(LOCALE_CONFIGS)
  .filter((config) => config.rootPath)
  .map((config) => config.rootPath)
  .sort((a, b) => b.length - a.length);

// Mirrors client/lib's getLocaleFromPathname pattern: derive the active
// locale purely from the URL path, no cookies/headers/negotiation.
export function getLocaleFromPathname(pathname) {
  if (!pathname) return DEFAULT_LOCALE;
  for (const prefix of LOCALE_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      const locale = Object.values(LOCALE_CONFIGS).find((c) => c.rootPath === prefix);
      return locale?.code || DEFAULT_LOCALE;
    }
  }
  return DEFAULT_LOCALE;
}

export function getLocaleConfig(locale) {
  return LOCALE_CONFIGS[locale] || LOCALE_CONFIGS[DEFAULT_LOCALE];
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Generic recursive merge: translated arrays replace the English array
// wholesale (locale-owned unit), plain objects merge key-by-key so a
// partial bundle still falls back to English per-key rather than
// per-namespace.
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

// Returns the `common` namespace for a locale, merged over the English
// defaults so every key is always present.
export function getCommonCopy(locale) {
  const config = getLocaleConfig(locale);
  if (config.code === DEFAULT_LOCALE) return LOCALE_CONFIGS[DEFAULT_LOCALE].messages.common;
  return mergeCopy(LOCALE_CONFIGS[DEFAULT_LOCALE].messages.common, config.messages.common);
}

// Loads and merges a per-studio-tab namespace (messages/{locale}/studio/{tabId}.json)
// over its English default. Namespaces are loaded lazily by each Studio
// component (`getStudioCopy('imageStudio', enBundle, zhBundle, locale)`)
// so this file doesn't need to import every tab's bundle up front.
export function resolveStudioCopy(enBundle, localeBundle, locale) {
  if (locale === DEFAULT_LOCALE) return enBundle;
  return mergeCopy(enBundle, localeBundle);
}

// Builds the studio path for a given tab under the active locale's root,
// e.g. localizeStudioPath('zh', 'video') -> '/zh/studio/video'.
export function localizeStudioPath(locale, tabId) {
  const config = getLocaleConfig(locale);
  const suffix = tabId ? `/studio/${tabId}` : '/studio';
  return `${config.rootPath}${suffix}`;
}
