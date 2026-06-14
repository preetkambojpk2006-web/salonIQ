import { canAccessDashboardPath } from "@/lib/auth/route-access";
import { resolveAppRole } from "@/lib/auth/resolve-role";
import {
  getAuthenticatedLandingPath,
  getBusinessApprovalStatus,
} from "@/lib/auth/business-approval";
import { getOnboardingRedirect, getOnboardingStep } from "@/lib/onboarding/status";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/pending");

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (user) {
    const appRole = await resolveAppRole(supabase, user.id);
    const step = await getOnboardingStep(supabase);
    const approval = await getBusinessApprovalStatus(supabase, user.id);

    if (pathname.startsWith("/dashboard") && !appRole) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    if (
      pathname.startsWith("/dashboard") &&
      (step === "business" || step === "branch")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = await getOnboardingRedirect(supabase);
      return NextResponse.redirect(url);
    }

    if (
      pathname.startsWith("/dashboard") &&
      approval.onboardingComplete &&
      !approval.isApproved
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/pending";
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/pending")) {
      if (!approval.onboardingComplete) {
        const url = request.nextUrl.clone();
        url.pathname = await getOnboardingRedirect(supabase);
        return NextResponse.redirect(url);
      }

      if (approval.isApproved) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }

    if (pathname.startsWith("/onboarding") && appRole && appRole !== "owner") {
      const url = request.nextUrl.clone();
      url.pathname = approval.isApproved ? "/dashboard" : "/pending";
      return NextResponse.redirect(url);
    }

    if (
      appRole &&
      pathname.startsWith("/dashboard") &&
      !canAccessDashboardPath(appRole, pathname)
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    if (isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = await getAuthenticatedLandingPath(supabase);
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
