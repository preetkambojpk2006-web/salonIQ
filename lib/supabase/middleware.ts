import { canAccessDashboardPath } from "@/lib/auth/route-access";
import {
  getRequestAuthContext,
  landingPathFromContext,
} from "@/lib/auth/request-context";
import { onboardingPathForStep } from "@/lib/onboarding/status";
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
    // Single consolidated lookup (was ~18 sequential queries) — only when the
    // route actually needs gating, so most requests stay cheap.
    const needsContext =
      isAuthRoute ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/onboarding") ||
      pathname.startsWith("/pending");

    if (needsContext) {
      const ctx = await getRequestAuthContext(supabase, user);
      const { appRole, onboardingComplete, isApproved, onboardingStep } = ctx;

      if (pathname.startsWith("/dashboard") && !appRole) {
        const url = request.nextUrl.clone();
        url.pathname = "/onboarding";
        return NextResponse.redirect(url);
      }

      if (
        pathname.startsWith("/dashboard") &&
        (onboardingStep === "business" || onboardingStep === "branch")
      ) {
        const url = request.nextUrl.clone();
        url.pathname = onboardingPathForStep(onboardingStep);
        return NextResponse.redirect(url);
      }

      if (
        pathname.startsWith("/dashboard") &&
        onboardingComplete &&
        !isApproved
      ) {
        const url = request.nextUrl.clone();
        url.pathname = "/pending";
        return NextResponse.redirect(url);
      }

      if (pathname.startsWith("/pending")) {
        if (!onboardingComplete) {
          const url = request.nextUrl.clone();
          url.pathname = onboardingPathForStep(onboardingStep);
          return NextResponse.redirect(url);
        }

        if (isApproved) {
          const url = request.nextUrl.clone();
          url.pathname = "/dashboard";
          return NextResponse.redirect(url);
        }
      }

      if (
        pathname.startsWith("/onboarding") &&
        appRole &&
        appRole !== "owner"
      ) {
        const url = request.nextUrl.clone();
        url.pathname = isApproved ? "/dashboard" : "/pending";
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
        url.pathname = landingPathFromContext(ctx);
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
