"use server";

import { getAuthenticatedLandingPath } from "@/lib/auth/business-approval";
import { getOnboardingRedirect, getOnboardingStep } from "@/lib/onboarding/status";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

function getAuthRedirectUrl(path: string) {
  const headersList = headers();
  const origin =
    headersList.get("origin") ??
    (headersList.get("x-forwarded-host")
      ? `https://${headersList.get("x-forwarded-host")}`
      : getSiteUrl());

  return `${origin}${path}`;
}

export async function signIn(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const redirectParam = formData.get("redirect") as string | null;

  if (!email || !password) {
    redirect("/login?error=missing-fields");
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  const step = await getOnboardingStep(supabase);
  if (step !== "complete") {
    redirect(await getOnboardingRedirect(supabase));
  }

  const landingPath = await getAuthenticatedLandingPath(supabase);

  if (
    redirectParam &&
    redirectParam.startsWith("/") &&
    !redirectParam.startsWith("//") &&
    !redirectParam.startsWith("/login") &&
    !redirectParam.startsWith("/signup") &&
    landingPath !== "/pending"
  ) {
    redirect(redirectParam);
  }

  redirect(landingPath);
}

export async function signUp(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    redirect("/signup?error=missing-fields");
  }

  if (password.length < 6) {
    redirect("/signup?error=Password must be at least 6 characters");
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getAuthRedirectUrl(
        "/auth/callback?next=/onboarding"
      ),
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (data.session) {
    redirect("/onboarding");
  }

  // No session means Supabase email confirmation is enabled. For smooth local
  // demos, "Confirm email" can be turned off in Supabase Dashboard →
  // Authentication → Providers → Email (project setting, not a code change).
  redirect(`/signup/check-email?email=${encodeURIComponent(email)}`);
}

export type ResendConfirmationResult =
  | { ok: true }
  | { ok: false; error: string };

export async function resendConfirmationEmail(
  formData: FormData
): Promise<ResendConfirmationResult> {
  const email = (formData.get("email") as string)?.trim();

  if (!email) {
    return { ok: false, error: "missing-email" };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: getAuthRedirectUrl("/auth/callback?next=/onboarding"),
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function signOut() {
  const supabase = createClient();
  // Local scope clears this browser's session immediately without waiting on a
  // global revocation round-trip — makes logout feel instant.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}
