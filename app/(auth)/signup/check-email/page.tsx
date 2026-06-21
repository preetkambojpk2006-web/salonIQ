import { CheckEmailView } from "@/components/auth/check-email-view";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { getLocale } from "@/lib/i18n";
import { cookies } from "next/headers";

type CheckEmailPageProps = {
  searchParams: { email?: string };
};

export default function CheckEmailPage({ searchParams }: CheckEmailPageProps) {
  const email = searchParams.email?.trim() ?? "";
  const cookieLocale = cookies().get("saloniq_ui_language")?.value;
  const initialLocale = getLocale(
    cookieLocale === "en" || cookieLocale === "hi" ? cookieLocale : undefined
  );

  return (
    <LanguageProvider initialLocale={initialLocale}>
      <CheckEmailView email={email} />
    </LanguageProvider>
  );
}
