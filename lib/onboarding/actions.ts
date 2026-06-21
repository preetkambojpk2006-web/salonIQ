"use server";

import { getAuthenticatedLandingPath } from "@/lib/auth/business-approval";
import { maybeAutoApproveForDemo } from "@/lib/auth/demo-autoapprove";
import {
  markOnboardingComplete,
} from "@/lib/onboarding/status";
import { withOnboardingSkip } from "@/lib/onboarding/skips";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

async function getBusinessForOwner(supabase: ReturnType<typeof createClient>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  return business;
}

export async function createBusiness(formData: FormData) {
  const { supabase, user } = await requireUser();

  const name = (formData.get("name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const email = (formData.get("email") as string)?.trim() || null;
  const openingHoursNote =
    (formData.get("opening_hours") as string)?.trim() || null;

  if (!name) {
    redirect("/onboarding/business?error=Please enter your salon name");
  }

  const existing = await getBusinessForOwner(supabase);
  if (existing) {
    redirect("/onboarding/branch");
  }

  const opening_hours = openingHoursNote
    ? { display: openingHoursNote }
    : {};

  const { data: createdBusiness, error } = await supabase
    .from("businesses")
    .insert({
      owner_id: user.id,
      name,
      phone,
      email,
      opening_hours,
    })
    .select("id")
    .single();

  if (error) {
    redirect(
      `/onboarding/business?error=${encodeURIComponent(error.message)}`
    );
  }

  const { error: memberError } = await supabase.from("business_members").insert({
    user_id: user.id,
    business_id: createdBusiness.id,
    app_role: "owner",
  });

  if (memberError) {
    redirect(
      `/onboarding/business?error=${encodeURIComponent(memberError.message)}`
    );
  }

  const { data: slug, error: slugError } = await supabase.rpc(
    "generate_booking_slug",
    {
      p_name: name,
      p_business_id: createdBusiness.id,
    }
  );

  if (!slugError && slug) {
    await supabase
      .from("businesses")
      .update({ booking_slug: slug })
      .eq("id", createdBusiness.id);
  }

  redirect("/onboarding/branch");
}

export async function createBranch(formData: FormData) {
  const { supabase } = await requireUser();
  const business = await getBusinessForOwner(supabase);

  if (!business) {
    redirect("/onboarding/business");
  }

  const name = (formData.get("name") as string)?.trim();
  const address = (formData.get("address") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;

  if (!name) {
    redirect("/onboarding/branch?error=Please enter a branch name");
  }

  const { count } = await supabase
    .from("branches")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id);

  if (count && count > 0) {
    redirect("/onboarding/staff");
  }

  const { error } = await supabase.from("branches").insert({
    business_id: business.id,
    name,
    address,
    phone,
  });

  if (error) {
    redirect(`/onboarding/branch?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/onboarding/staff");
}

export async function createStaff(formData: FormData) {
  const { supabase } = await requireUser();
  const business = await getBusinessForOwner(supabase);

  if (!business) {
    redirect("/onboarding/business");
  }

  const name = (formData.get("name") as string)?.trim();
  const role = (formData.get("role") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const branchId = formData.get("branch_id") as string;

  if (!name) {
    redirect("/onboarding/staff?error=Please enter a staff name");
  }

  if (!branchId) {
    redirect("/onboarding/staff?error=Please select a branch");
  }

  const { error } = await supabase.from("staff").insert({
    business_id: business.id,
    branch_id: branchId,
    name,
    role,
    phone,
    is_active: true,
  });

  if (error) {
    redirect(`/onboarding/staff?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/onboarding/services");
}

export async function skipStaff() {
  const { supabase } = await requireUser();
  const business = await getBusinessForOwner(supabase);

  if (!business) {
    redirect("/onboarding/business");
  }

  const { data: row } = await supabase
    .from("businesses")
    .select("opening_hours")
    .eq("id", business.id)
    .maybeSingle();

  const { error: skipError } = await supabase
    .from("businesses")
    .update({
      opening_hours: withOnboardingSkip(row?.opening_hours, "staff"),
    })
    .eq("id", business.id);

  if (skipError) {
    redirect(
      `/onboarding/staff?error=${encodeURIComponent(skipError.message)}`
    );
  }

  redirect("/onboarding/services");
}

export async function createService(formData: FormData) {
  const { supabase } = await requireUser();
  const business = await getBusinessForOwner(supabase);

  if (!business) {
    redirect("/onboarding/business");
  }

  const name = (formData.get("name") as string)?.trim();
  const category = (formData.get("category") as string)?.trim() || null;
  const durationRaw = formData.get("duration_mins") as string;
  const priceRaw = formData.get("price") as string;

  if (!name) {
    redirect("/onboarding/services?error=Please enter a service name");
  }

  const duration_mins = parseInt(durationRaw, 10);
  const price = parseFloat(priceRaw);

  if (!duration_mins || duration_mins < 1) {
    redirect("/onboarding/services?error=Enter a valid duration in minutes");
  }

  if (Number.isNaN(price) || price < 0) {
    redirect("/onboarding/services?error=Enter a valid price");
  }

  const { error } = await supabase.from("services").insert({
    business_id: business.id,
    name,
    category,
    duration_mins,
    price,
    is_active: true,
  });

  if (error) {
    redirect(
      `/onboarding/services?error=${encodeURIComponent(error.message)}`
    );
  }

  const { error: completeError } = await markOnboardingComplete(
    supabase,
    business.id
  );
  if (completeError) {
    redirect(
      `/onboarding/services?error=${encodeURIComponent(completeError)}`
    );
  }

  await maybeAutoApproveForDemo(business.id);

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  revalidatePath("/pending");
  redirect(await getAuthenticatedLandingPath(supabase));
}

export async function skipServices() {
  const { supabase } = await requireUser();
  const business = await getBusinessForOwner(supabase);

  if (!business) {
    redirect("/onboarding/business");
  }

  const { data: row } = await supabase
    .from("businesses")
    .select("opening_hours")
    .eq("id", business.id)
    .maybeSingle();

  const { error: skipError } = await supabase
    .from("businesses")
    .update({
      opening_hours: withOnboardingSkip(row?.opening_hours, "services"),
    })
    .eq("id", business.id);

  if (skipError) {
    redirect(
      `/onboarding/services?error=${encodeURIComponent(skipError.message)}`
    );
  }

  const { error: completeError } = await markOnboardingComplete(
    supabase,
    business.id
  );
  if (completeError) {
    redirect(
      `/onboarding/services?error=${encodeURIComponent(completeError)}`
    );
  }

  await maybeAutoApproveForDemo(business.id);

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  revalidatePath("/pending");
  redirect(await getAuthenticatedLandingPath(supabase));
}
