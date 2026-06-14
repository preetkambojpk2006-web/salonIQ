import type { Metadata } from "next";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

export const metadata: Metadata = {
  title: "Walk-in queue | SalonIQ",
  description: "Salon walk-in virtual queue",
};

export default function QueueLayout({ children }: { children: React.ReactNode }) {
  return <LanguageProvider locale="hi">{children}</LanguageProvider>;
}
