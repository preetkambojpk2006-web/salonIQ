import en from "@/lib/i18n/en.json";
import hi from "@/lib/i18n/hi.json";

export type Locale = "en" | "hi";

const messages: Record<Locale, Record<string, string>> = {
  en: en as Record<string, string>,
  hi: hi as Record<string, string>,
};

export function getLocale(uiLanguage: string | null | undefined): Locale {
  return uiLanguage === "en" ? "en" : "hi";
}

export function t(
  key: string,
  locale: Locale,
  params?: Record<string, string>
): string {
  const template = messages[locale][key] ?? messages.hi[key] ?? key;

  if (!params) {
    return template;
  }

  return Object.entries(params).reduce(
    (result, [name, value]) => result.replaceAll(`{${name}}`, value),
    template
  );
}
