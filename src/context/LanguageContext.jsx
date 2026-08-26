import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { STRINGS } from '../i18n/strings'
import { detectLang } from '../i18n/detect'
import { setDateLocale } from '../lib/date'

const LanguageContext = createContext(null)
const LANG_KEY = 'tornasol-lang'

function interpolate(str, vars) {
  if (!vars) return str
  return str.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m))
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = window.localStorage.getItem(LANG_KEY)
      if (saved === 'en' || saved === 'es') return saved
    } catch {
      // ignore
    }
    return detectLang()
  })

  // Keep date formatting in sync with the chosen language.
  setDateLocale(lang)
  useEffect(() => {
    setDateLocale(lang)
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next) => {
    try {
      window.localStorage.setItem(LANG_KEY, next)
    } catch {
      // ignore
    }
    setLangState(next)
  }, [])

  const t = useCallback(
    (key, vars) => {
      const entry = STRINGS[key]
      const raw = (entry && (entry[lang] ?? entry.en)) ?? key
      return interpolate(raw, vars)
    },
    [lang]
  )

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useI18n() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useI18n must be used within a LanguageProvider')
  return ctx
}
