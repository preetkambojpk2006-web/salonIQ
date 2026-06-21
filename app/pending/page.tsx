import { getAuthenticatedLandingPath } from "@/lib/auth/business-approval";
import { PendingView } from "@/components/pending/pending-view";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { getLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SUPPORT_WHATSAPP =
  process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.trim() || "";

export default async function PendingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const landingPath = await getAuthenticatedLandingPath(supabase);
  if (landingPath !== "/pending") {
    redirect(landingPath);
  }

  const cookieLocale = cookies().get("saloniq_ui_language")?.value;
  const initialLocale = getLocale(
    cookieLocale === "en" || cookieLocale === "hi" ? cookieLocale : undefined
  );

  return (
    <LanguageProvider initialLocale={initialLocale}>
      <PendingView supportWhatsApp={SUPPORT_WHATSAPP} />
    </LanguageProvider>
  );
}
