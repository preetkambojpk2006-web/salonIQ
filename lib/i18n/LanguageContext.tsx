"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { t as translate, type Locale } from "@/lib/i18n";

type LanguageContextValue = {
  locale: Locale;
  t: (key: string, params?: Record<string, string>) => string;
  setLocale: (locale: Locale) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

type LanguageProviderProps = {
  locale: Locale;
  children: ReactNode;
};

export function LanguageProvider({
  locale: serverLocale,
  children,
}: LanguageProviderProps) {
  const [locale, setLocale] = useState<Locale>(serverLocale);

  useEffect(() => {
    setLocale(serverLocale);
  }, [serverLocale]);

  const t = useCallback(
    (key: string, params?: Record<string, string>) => translate(key, locale, params),
    [locale]
  );

  const value = useMemo(
    () => ({ locale, t, setLocale }),
    [locale, t]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useT(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      locale: "hi",
      t: (key: string, params?: Record<string, string>) =>
        translate(key, "hi", params),
      setLocale: () => {},
    };
  }
  return context;
}
