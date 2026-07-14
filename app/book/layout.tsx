import type { Metadata } from "next";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

export const metadata: Metadata = {
  title: "Book appointment | SalonIQ",
  description: "Online salon booking",
};

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return <LanguageProvider initialLocale="hi">{children}</LanguageProvider>;
}
