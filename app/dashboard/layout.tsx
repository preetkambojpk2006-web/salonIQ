import { getBusinessApprovalStatus } from "@/lib/auth/business-approval";
import { CommandCenterShell } from "@/components/command-center/command-center-shell";
import { getWorkspaceContext } from "@/lib/command-center/get-workspace";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { getLocale } from "@/lib/i18n";
import { getOnboardingStep } from "@/lib/onboarding/status";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const step = await getOnboardingStep(supabase);
  if (step === "business" || step === "branch") {
    redirect("/onboarding");
  }

  const approval = await getBusinessApprovalStatus(supabase, user.id);
  if (approval.onboardingComplete && !approval.isApproved) {
    redirect("/pending");
  }

  const workspace = await getWorkspaceContext();
  const cookieLocale = cookies().get("saloniq_ui_language")?.value;
  const initialLocale = getLocale(
    cookieLocale === "en" || cookieLocale === "hi" ? cookieLocale : undefined
  );

  return (
    <LanguageProvider initialLocale={initialLocale}>
      <CommandCenterShell workspace={workspace} appRole={workspace.appRole}>
        {children}
      </CommandCenterShell>
    </LanguageProvider>
  );
}
