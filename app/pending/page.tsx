import { signOut } from "@/lib/auth/actions";
import { getAuthenticatedLandingPath } from "@/lib/auth/business-approval";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const SUPPORT_WHATSAPP =
  process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.trim() || "";

function whatsAppHref(number: string): string {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

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

  return (
    <div className="auth-shell flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12">
        <section className="panel">
          <div className="stack-4 text-center">
            <p className="text-eyebrow">SalonIQ</p>
            <h1 className="heading-page text-2xl">Aapka account review mein hai</h1>
            <p className="text-body">
              Hum 24 ghante mein activate kar denge.
            </p>
            <p className="text-body">
              Koi sawaal?{" "}
              {SUPPORT_WHATSAPP ? (
                <a
                  href={whatsAppHref(SUPPORT_WHATSAPP)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-accent"
                >
                  WhatsApp: {SUPPORT_WHATSAPP}
                </a>
              ) : (
                <>WhatsApp par humse sampark karein.</>
              )}
            </p>
          </div>

          <form action={signOut} className="mt-6">
            <button type="submit" className="btn-primary w-full">
              Logout
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
