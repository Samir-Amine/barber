import React, { createContext, useContext, useEffect, useState } from 'react';
import { en } from '../../locales/en/translations';
import { fr } from '../../locales/fr/translations';
import { arMA } from '../../locales/ar-MA/translations';

export type SupportedLocale = 'en' | 'fr' | 'ar-MA';

const translationsMap: Record<SupportedLocale, any> = {
  en,
  fr,
  'ar-MA': arMA,
};

interface I18nContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  dir: 'ltr' | 'rtl';
  t: (path: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = 'atlas_blade_locale';

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as SupportedLocale;
      if (saved && ['en', 'fr', 'ar-MA'].includes(saved)) {
        return saved;
      }
    }
    return 'en';
  });

  const dir: 'ltr' | 'rtl' = locale === 'ar-MA' ? 'rtl' : 'ltr';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale === 'ar-MA' ? 'ar' : locale;
      document.documentElement.dir = dir;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, locale);
    }
  }, [locale, dir]);

  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
  };

  const t = (path: string, fallback?: string): string => {
    const keys = path.split('.');
    let current = translationsMap[locale] || translationsMap.en;

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        // Try fallback to English if missing in target locale
        let engFallback = translationsMap.en;
        for (const fk of keys) {
          if (engFallback && typeof engFallback === 'object' && fk in engFallback) {
            engFallback = engFallback[fk];
          } else {
            engFallback = null;
            break;
          }
        }
        if (typeof engFallback === 'string') return engFallback;
        return fallback || path;
      }
    }

    if (typeof current === 'string') return current;
    return fallback || path;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, dir, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
