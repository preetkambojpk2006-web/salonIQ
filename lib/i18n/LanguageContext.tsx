"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { t as translate, type Locale } from "./index";

const LanguageContext = createContext<{
  locale: Locale;
  t: (key: string, params?: Record<string, string>) => string;
  setLocale: (l: Locale) => void;
}>({
  locale: "hi",
  t: (k) => k,
  setLocale: () => {},
});

export function LanguageProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  function setLocale(l: Locale) {
    setLocaleState(l);
    document.cookie = `saloniq_ui_language=${l}; path=/; max-age=31536000`;
  }

  const t = (key: string, params?: Record<string, string>) =>
    translate(key, locale, params);

  return (
    <LanguageContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useT() {
  return useContext(LanguageContext);
}
