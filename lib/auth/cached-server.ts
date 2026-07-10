import { cache } from "react";
import { getRequestAuthContext } from "@/lib/auth/request-context";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/** Dedupes auth.getUser() within a single RSC render (layout + page). */
export const getCachedAuthUser = cache(async (): Promise<User | null> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Same consolidated context as middleware, cached per RSC request. */
export const getCachedRequestAuthContext = cache(async () => {
  const supabase = createClient();
  const user = await getCachedAuthUser();
  if (!user) {
    return null;
  }
  return getRequestAuthContext(supabase, user);
});
