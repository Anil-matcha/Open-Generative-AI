'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getLang, initLocale, setLang as setLangStore, t as translate } from '../src/lib/i18n.js';

const I18nContext = createContext({
  lang: 'en',
  t: translate,
  setLang: () => {},
});

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState('en');

  useEffect(() => {
    initLocale();
    setLangState(getLang());
    document.documentElement.lang = getLang() === 'zh-CN' ? 'zh-CN' : 'en';
    const onChange = () => {
      const next = getLang();
      setLangState(next);
      document.documentElement.lang = next === 'zh-CN' ? 'zh-CN' : 'en';
    };
    window.addEventListener('og_lang_change', onChange);
    return () => window.removeEventListener('og_lang_change', onChange);
  }, []);

  const setLang = useCallback((next) => {
    setLangStore(next, { reload: false });
    setLangState(getLang());
  }, []);

  const t = useCallback((key) => translate(key), [lang]);

  const value = useMemo(() => ({ lang, t, setLang }), [lang, t, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
