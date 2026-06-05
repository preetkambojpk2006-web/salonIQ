"use server";

import { getOnboardingRedirect } from "@/lib/onboarding/status";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

function getAuthRedirectUrl(path: string) {
  const headersList = headers();
  const origin =
    headersList.get("origin") ??
    (headersList.get("x-forwarded-host")
      ? `https://${headersList.get("x-forwarded-host")}`
      : "http://localhost:3000");

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

  if (
    redirectParam &&
    redirectParam.startsWith("/") &&
    !redirectParam.startsWith("//") &&
    !redirectParam.startsWith("/login") &&
    !redirectParam.startsWith("/signup")
  ) {
    redirect(redirectParam);
  }

  redirect(await getOnboardingRedirect(supabase));
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

  redirect("/login?message=check-email");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
