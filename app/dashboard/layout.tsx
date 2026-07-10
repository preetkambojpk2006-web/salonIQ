import { CommandCenterShell } from "@/components/command-center/command-center-shell";
import { getCachedAuthUser, getCachedRequestAuthContext } from "@/lib/auth/cached-server";
import { getWorkspaceContext } from "@/lib/command-center/get-workspace";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { getLocale } from "@/lib/i18n";
import { onboardingPathForStep } from "@/lib/onboarding/paths";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCachedAuthUser();

  if (!user) {
    redirect("/login");
  }

  const ctx = await getCachedRequestAuthContext();
  if (!ctx?.onboardingComplete) {
    redirect(onboardingPathForStep(ctx?.onboardingStep ?? "business"));
  }
  if (!ctx.isApproved) {
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
