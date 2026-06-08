import { CommandCenterShell } from "@/components/command-center/command-center-shell";
import { getWorkspaceContext } from "@/lib/command-center/get-workspace";
import { getOnboardingStep } from "@/lib/onboarding/status";
import { createClient } from "@/lib/supabase/server";
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

  const workspace = await getWorkspaceContext();

  return (
    <CommandCenterShell workspace={workspace} appRole={workspace.appRole}>
      {children}
    </CommandCenterShell>
  );
}
