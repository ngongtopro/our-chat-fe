"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { Locale } from "@/lib/i18n"
import { defaultLocale, getTranslation, interpolateString } from "@/lib/i18n"
import type { TranslationKey } from "@/lib/i18n"

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, values?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)

  useEffect(() => {
    // Load saved locale from localStorage
    const savedLocale = localStorage.getItem("locale") as Locale
    if (savedLocale && (savedLocale === "en" || savedLocale === "vi")) {
      setLocaleState(savedLocale)
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem("locale", newLocale)
    // Update HTML lang attribute
    document.documentElement.lang = newLocale
  }

  const t = (key: TranslationKey, values?: Record<string, string | number>): string => {
    const translation = getTranslation(locale, key)
    if (values) {
      return interpolateString(translation, values)
    }
    return translation
  }

  return <LanguageContext.Provider value={{ locale, setLocale, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
