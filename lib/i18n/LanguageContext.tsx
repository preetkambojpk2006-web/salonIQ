"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { t as translate, type Locale } from "@/lib/i18n";

type LanguageContextValue = {
  locale: Locale;
  t: (key: string, params?: Record<string, string>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

type LanguageProviderProps = {
  locale: Locale;
  children: ReactNode;
};

export function LanguageProvider({ locale, children }: LanguageProviderProps) {
  const t = useCallback(
    (key: string, params?: Record<string, string>) => translate(key, locale, params),
    [locale]
  );

  const value = useMemo(() => ({ locale, t }), [locale, t]);

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
    };
  }
  return context;
}
